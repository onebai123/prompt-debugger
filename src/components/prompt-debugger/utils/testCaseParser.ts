/**
 * 测试用例解析工具
 */

import { Message } from '@/lib/api'
import { TestCase } from '../types'

/** 解析文本格式的测试用例 */
export function parseTestCasesFromText(text: string): TestCase[] {
  const cases = text.split(/(?=用例\d+：)/).filter((c) => c.trim())
  
  // 过滤掉不是以"用例N："开头的部分（如AI生成的前置说明）
  const validCases = cases.filter((c) => /^用例\d+：/.test(c.trim()))
  
  return validCases.map((caseText, index) => {
    const lines = caseText.split('\n').filter((l) => l.trim())
    // 清理标题：移除"用例N："前缀和markdown标记
    const rawTitle = lines[0]?.replace(/^用例\d+：/, '') || `用例${index + 1}`
    const title = rawTitle.replace(/\*\*/g, '').trim()

    const messages: Message[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('AI:') || line.startsWith('我:') || line.startsWith('用户:')) {
        const role = line.startsWith('AI:') ? 'assistant' : 'user'
        const content = line.replace(/^(AI:|我:|用户:)/, '').trim()
        if (content) {
          messages.push({
            role,
            content,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    return {
      id: index + 1,
      title,
      messages,
      status: 'pending' as const,
    }
  })
}

/** 替换提示词中的变量 */
export function replaceVariables(
  prompt: string,
  variables: { botName: string; productName: string; language: string }
): string {
  return prompt
    .replace(/\{\{botName\}\}/g, variables.botName)
    .replace(/\{\{productName\}\}/g, variables.productName)
    .replace(/\{\{language\}\}/g, variables.language)
}

/** 替换消息中的变量 */
export function replaceMessageVariables(
  messages: Message[],
  variables: { botName: string; productName: string; language: string }
): Message[] {
  return messages.map((msg) => ({
    ...msg,
    content: replaceVariables(msg.content, variables),
  }))
}
