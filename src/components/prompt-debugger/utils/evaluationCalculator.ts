/**
 * 评判分数计算工具
 */

import { EvaluationCriteria, EvaluationResult } from '../types'

/** 计算总分（加权平均） */
export function calculateOverallScore(
  evaluationDetails: EvaluationResult[],
  enabledCriteria: EvaluationCriteria[]
): { score: number; level: string } {
  let overallScore = 0

  // 过滤适用的评判结果
  const applicableDetails = evaluationDetails.filter((r) => {
    return !r.notApplicable && enabledCriteria.some((c) => c.id === r.criteriaId)
  })

  if (applicableDetails.length > 0) {
    // 计算适用标准的总权重
    const applicableWeight = applicableDetails.reduce((sum, r) => {
      const criteria = enabledCriteria.find((c) => c.id === r.criteriaId)
      return sum + (criteria?.weight || 0)
    }, 0)

    if (applicableWeight > 0) {
      // 加权平均分
      overallScore =
        applicableDetails.reduce((sum, r) => {
          const criteria = enabledCriteria.find((c) => c.id === r.criteriaId)
          const weight = criteria?.weight || 0
          return sum + r.score * weight
        }, 0) / applicableWeight
    } else {
      // 降级：使用简单平均分
      overallScore = applicableDetails.reduce((sum, r) => sum + r.score, 0) / applicableDetails.length
      console.warn('没有匹配的标准权重，使用平均分')
    }
  } else {
    // 降级：如果没有匹配的标准，使用所有非N/A的平均分
    const scorableDetails = evaluationDetails.filter((r) => !r.notApplicable)
    if (scorableDetails.length > 0) {
      overallScore = scorableDetails.reduce((sum, r) => sum + r.score, 0) / scorableDetails.length
      console.warn('没有适用标准，使用所有评分平均')
    } else {
      console.warn('所有标准都不适用，默认60分及格')
      overallScore = 60
    }
  }

  // 判断级别
  let overallLevel = '基础'
  if (overallScore >= 90) overallLevel = '卓越'
  else if (overallScore >= 75) overallLevel = '优秀'
  else if (overallScore >= 60) overallLevel = '良好'

  return { score: Math.round(overallScore), level: overallLevel }
}

/** 解析AI返回的评判结果JSON */
export function parseEvaluationResponse(
  response: string,
  enabledCriteria: EvaluationCriteria[]
): EvaluationResult[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const rawResults = JSON.parse(jsonMatch[0])
    return rawResults.map((r: any) => {
      const criteria = enabledCriteria.find((c) => c.id === r.criteriaId)
      return {
        criteriaId: r.criteriaId,
        criteriaName: criteria?.name || r.criteriaName || `Unknown(${r.criteriaId})`,
        score: r.score || 0,
        passed: r.passed !== false,
        reason: r.reason || '',
        notApplicable: r.notApplicable === true,
      }
    })
  } catch (e) {
    console.error('解析评判结果失败:', e)
    return []
  }
}
