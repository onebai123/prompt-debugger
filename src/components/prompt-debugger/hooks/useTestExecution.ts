/**
 * 测试执行Hook
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { callAgentDebugAPI, Message } from '@/lib/api'
import { TestCase, EvaluationCriteria } from '../types'
import { executeConcurrently } from '../utils/concurrency'
import { parseEvaluationResponse, calculateOverallScore } from '../utils/evaluationCalculator'
import { replaceMessageVariables } from '../utils/testCaseParser'

interface UseTestExecutionProps {
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  botName: string
  productName: string
  language: string
  concurrentCount: number
  evaluationCriteria: EvaluationCriteria[]
}

export function useTestExecution(props: UseTestExecutionProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  /** 执行单个测试用例 */
  const executeSingleTest = useCallback(async (testCase: TestCase): Promise<TestCase> => {
    try {
      const processedMessages = replaceMessageVariables(testCase.messages, {
        botName: props.botName,
        productName: props.productName,
        language: props.language,
      })

      const conversationHistory: Message[] = []
      const responses: string[] = []

      for (const msg of processedMessages) {
        conversationHistory.push(msg)

        if (msg.role === 'user') {
          const result = await callAgentDebugAPI({
            messages: conversationHistory,
            systemPrompt: props.systemPrompt,
            model: props.model,
            temperature: props.temperature,
            maxTokens: props.maxTokens,
            enableIntent: false,
            intentCategories: [],
          })

          if (result.success && result.response) {
            responses.push(result.response)
            conversationHistory.push({
              role: 'assistant',
              content: result.response,
              timestamp: new Date().toISOString(),
            })
          } else {
            throw new Error(result.error || '执行失败')
          }
        }
      }

      // 评判
      const enabledCriteria = props.evaluationCriteria.filter((c) => c.enabled)
      const conversationText = conversationHistory
        .map((m) => `${m.role === 'user' ? '用户' : 'Agent'}: ${m.content}`)
        .join('\n')

      const evaluatePrompt = `请根据以下评判标准，对这段对话进行评分。

**对话记录**：
${conversationText}

**评判标准**：
${enabledCriteria.map((c) => `ID: ${c.id}
${c.level} - ${c.name}（权重${c.weight}）
描述: ${c.description}${c.applicableCondition ? `
适用条件: ${c.applicableCondition}` : ''}`).join('\n\n')}

**评判要求**：
1. 对每个标准评分（0-100分）
2. 如果标准不适用当前场景，标记为N/A
3. 给出具体理由
4. **重要**：criteriaId必须使用上面标准的ID（如${enabledCriteria[0]?.id}）

返回JSON格式：
[
  {"criteriaId": "${enabledCriteria[0]?.id}", "score": 分数, "passed": true/false, "reason": "理由", "notApplicable": false},
  ...
]

只返回JSON数组。`

      const evalResult = await callAgentDebugAPI({
        messages: [
          {
            role: 'user',
            content: evaluatePrompt,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: '你是专业的对话质量评判专家，返回准确的JSON格式。',
        model: 'gemini-2.5-pro-thinking-128',
        temperature: 0.5,
        maxTokens: 2048,
        enableIntent: false,
        intentCategories: [],
      })

      let evaluationDetails = parseEvaluationResponse(evalResult.response || '', enabledCriteria)
      const { score, level } = calculateOverallScore(evaluationDetails, enabledCriteria)
      const passed = score >= 60

      return {
        ...testCase,
        status: 'success',
        responses,
        conversationHistory,
        evaluationDetails,
        overallScore: score,
        overallLevel: level,
        passed,
        evaluation: evaluationDetails.map((r) => `【${r.criteriaName}】${r.score}分 - ${r.reason}`).join('\n'),
      }
    } catch (error) {
      return {
        ...testCase,
        status: 'failed',
        evaluation: error instanceof Error ? error.message : '执行失败',
      }
    }
  }, [props])

  /** 批量执行测试 */
  const executeTests = useCallback(
    async (testCases: TestCase[]): Promise<TestCase[]> => {
      setIsRunning(true)
      setProgress(0)

      try {
        const results = await executeConcurrently(
          testCases,
          executeSingleTest,
          props.concurrentCount,
          (completed, total) => {
            setProgress(Math.round((completed / total) * 100))
          }
        )

        const passed = results.filter((r) => r.passed).length
        message.success(`测试完成！通过 ${passed}/${results.length} 个用例`)
        return results
      } catch (error) {
        message.error('测试执行失败')
        throw error
      } finally {
        setIsRunning(false)
        setProgress(0)
      }
    },
    [props.concurrentCount, executeSingleTest]
  )

  return {
    isRunning,
    progress,
    executeTests,
    executeSingleTest,
  }
}
