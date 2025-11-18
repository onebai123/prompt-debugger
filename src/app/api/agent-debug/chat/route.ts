import { NextRequest, NextResponse } from 'next/server'

// Next.js路由配置 - 设置最大执行时间为5分钟
export const maxDuration = 300

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**Agent调试聊天API */
export async function POST(request: NextRequest) {
  try {
    // 安全地解析请求体
    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json({
          success: false,
          error: '请求体为空'
        }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON解析错误:', parseError)
      return NextResponse.json({
        success: false,
        error: '无效的JSON格式'
      }, { status: 400 })
    }

    const { 
      messages, 
      systemPrompt, 
      model = 'deepseek-v3',
      temperature = 0.7,
      maxTokens = 2048,
      enableIntent = false,
      intentCategories = []
    } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        success: false,
        error: '缺少messages参数'
      }, { status: 400 })
    }

    if (!systemPrompt) {
      return NextResponse.json({
        success: false,
        error: '缺少systemPrompt参数'
      }, { status: 400 })
    }

    // 从请求头或环境变量读取API配置
    const apiBaseUrl = request.headers.get('X-API-Base-URL') || 
                       process.env.NEXT_PUBLIC_API_BASE_URL || 
                       'https://api.openai.com/v1'
    const apiKey = request.headers.get('X-API-Key') || 
                   process.env.NEXT_PUBLIC_API_KEY || 
                   ''

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: '未配置API密钥，请在设置中配置或设置环境变量NEXT_PUBLIC_API_KEY'
      }, { status: 401 })
    }

    // 构建消息数组
    const apiMessages: Message[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.filter((m: Message) => m.role !== 'system')
    ]

    // 如果启用意图识别且是用户消息，添加意图识别指令
    let intentInstruction = ''
    if (enableIntent && intentCategories.length > 0 && messages[messages.length - 1]?.role === 'user') {
      intentInstruction = `\n\n[系统指令] 在回复后，请用JSON格式分析用户意图: {"intent": "选择一个: ${intentCategories.join('/')}", "confidence": 0-1之间, "reasoning": "简要说明"}`
    }

    // 如果有意图识别指令，添加到系统消息
    if (intentInstruction) {
      apiMessages[0].content += intentInstruction
    }

    console.log('调用AI API:', {
      model,
      temperature,
      maxTokens,
      messageCount: apiMessages.length,
      enableIntent
    })

    // 调用AI API，设置4分钟超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 240000) // 4分钟
    
    let response
    try {
      response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: apiMessages
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('AI API调用超时（4分钟）')
        return NextResponse.json({
          success: false,
          error: 'AI调用超时，请减少输入长度或稍后重试'
        }, { status: 504 })
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API错误:', response.status, errorText)
      return NextResponse.json({
        success: false,
        error: `AI API调用失败 (${response.status})`
      }, { status: response.status })
    }

    const result = await response.json()
    let responseText = result.choices?.[0]?.message?.content || ''

    // 解析意图(如果启用)
    let intent = null
    if (enableIntent && responseText.includes('{') && responseText.includes('"intent"')) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*?"intent"[\s\S]*?\}/)
        if (jsonMatch) {
          const intentData = JSON.parse(jsonMatch[0])
          intent = {
            intent: intentData.intent,
            confidence: intentData.confidence || 0.5,
            reasoning: intentData.reasoning || ''
          }
          // 移除JSON部分
          responseText = responseText.replace(jsonMatch[0], '').trim()
        }
      } catch (e) {
        console.log('意图解析失败:', e)
      }
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      intent,
      usage: result.usage
    })

  } catch (error) {
    console.error('Agent调试API错误:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器错误'
    }, { status: 500 })
  }
}
