/**
 * 并发重新评判Hook
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { callAgentDebugAPI } from '@/lib/api'
import { TestCase, EvaluationCriteria } from '../types'
import { executeBatchWithResults } from '../utils/concurrency'
import { parseEvaluationResponse, calculateOverallScore } from '../utils/evaluationCalculator'

interface EvaluationResult {
  id: number
  success: boolean
  evaluation?: string
  evaluationDetails?: any[]
  overallScore?: number
  overallLevel?: string
  passed?: boolean
}

export function useConcurrentEvaluation(
  concurrentCount: number,
  evaluationCriteria: EvaluationCriteria[]
) {
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalProgress, setEvalProgress] = useState(0)

  /** 重新评判单个测试用例 */
  const reEvaluateSingle = useCallback(
    async (tc: TestCase): Promise<EvaluationResult> => {
      if (!tc.conversationHistory) {
        return { id: tc.id, success: false }
      }

      const conversationText = tc.conversationHistory
        .map((m) => `${m.role === 'user' ? '用户' : 'Agent'}: ${m.content}`)
        .join('\n')

      const enabledCriteria = evaluationCriteria.filter((c) => c.enabled)
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

      try {
        const result = await callAgentDebugAPI({
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

        const evaluationDetails = parseEvaluationResponse(result.response || '', enabledCriteria)
        
        if (evaluationDetails.length > 0) {
          const { score, level } = calculateOverallScore(evaluationDetails, enabledCriteria)
          const passed = score >= 60
          const evaluation = evaluationDetails
            .map((r) => `【${r.criteriaName}】${r.score}分 - ${r.reason}`)
            .join('\n')

          return {
            id: tc.id,
            success: true,
            evaluation,
            evaluationDetails,
            overallScore: score,
            overallLevel: level,
            passed,
          }
        }

        return { id: tc.id, success: false }
      } catch (error) {
        console.error(`用例 ${tc.id} 重新评判异常:`, error)
        return { id: tc.id, success: false }
      }
    },
    [evaluationCriteria]
  )

  /** 批量重新评判 */
  const reEvaluateAll = useCallback(
    async (testCases: TestCase[]): Promise<Map<number, EvaluationResult>> => {
      const executedCases = testCases.filter(
        (tc) => tc.status === 'success' && tc.conversationHistory
      )

      if (executedCases.length === 0) {
        message.warning('没有已执行的测试用例')
        return new Map()
      }

      const enabledCriteria = evaluationCriteria.filter((c) => c.enabled)
      if (enabledCriteria.length === 0) {
        message.warning('请至少启用1个评判标准')
        return new Map()
      }

      setIsEvaluating(true)
      setEvalProgress(0)

      try {
        message.info(`开始重新评判 ${executedCases.length} 个测试用例（${concurrentCount}并发）...`)

        const results = await executeBatchWithResults(
          executedCases,
          reEvaluateSingle,
          concurrentCount,
          (completed, total) => {
            setEvalProgress(Math.round((completed / total) * 100))
          }
        )

        const succeeded = Array.from(results.values()).filter((r) => r.success).length
        const total = executedCases.length

        if (succeeded === total) {
          message.success(`重新评判完成！成功重新评判 ${succeeded} 个用例`)
        } else if (succeeded > 0) {
          message.warning(
            `重新评判完成！成功 ${succeeded} 个，失败 ${total - succeeded} 个（失败的保留原评判结果）`
          )
        } else {
          message.error('重新评判失败！所有用例保持原有评判结果')
        }

        return results
      } catch (error) {
        console.error('重新评判失败:', error)
        message.error('重新评判失败')
        return new Map()
      } finally {
        setIsEvaluating(false)
        setEvalProgress(0)
      }
    },
    [concurrentCount, evaluationCriteria, reEvaluateSingle]
  )

  return {
    isEvaluating,
    evalProgress,
    reEvaluateAll,
    reEvaluateSingle,
  }
}
