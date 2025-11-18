/**Agent调试器API模块 */

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface IntentResult {
  intent: string
  confidence: number
  reasoning?: string
}

export interface AgentDebugRequest {
  messages: Message[]
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  enableIntent: boolean
  intentCategories: string[]
}

export interface AgentDebugResponse {
  success: boolean
  response?: string
  intent?: IntentResult
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**调用Agent调试API - 直接调用AI服务（无需后端中转）*/
export async function callAgentDebugAPI(request: AgentDebugRequest): Promise<AgentDebugResponse> {
  try {
    // 从localStorage读取配置
    const configStr = localStorage.getItem('prompt_debugger_config')
    const config = configStr ? JSON.parse(configStr) : {}
    
    const apiBaseUrl = config.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.openai.com/v1'
    const apiKey = config.apiKey || process.env.NEXT_PUBLIC_API_KEY || ''
    
    if (!apiKey) {
      return {
        success: false,
        error: '未配置API密钥，请点击右上角⚙️配置API密钥'
      }
    }

    // 构建消息数组
    const apiMessages = [
      {
        role: 'system',
        content: request.systemPrompt
      },
      ...request.messages.filter(m => m.role !== 'system')
    ]

    // 设置5分钟超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5分钟
    
    // 直接调用AI服务API
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: apiMessages,
        temperature: request.temperature,
        max_tokens: request.maxTokens
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMsg = errorData.error?.message || errorData.error || errorMsg
      } catch {
        errorMsg = await response.text() || errorMsg
      }
      
      return {
        success: false,
        error: errorMsg
      }
    }

    // 解析AI服务响应
    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || ''
    
    return {
      success: true,
      response: responseText,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0
      } : undefined
    }
  } catch (error: any) {
    console.error('调用Agent调试API失败:', error)
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时（5分钟），AI处理时间过长，请减少输入长度或稍后重试'
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误'
    }
  }
}
