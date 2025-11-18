/**
 * 批量测试系统类型定义
 */

import { Message } from '../../lib/api'

/** 测试用例 */
export interface TestCase {
  id: number
  title: string
  messages: Message[]
  status: 'pending' | 'running' | 'success' | 'failed'
  responses?: string[]
  evaluation?: string
  passed?: boolean
  evaluationDetails?: EvaluationResult[]
  overallLevel?: string
  overallScore?: number
  conversationHistory?: Message[]
}

/** 评判标准 */
export interface EvaluationCriteria {
  id: string
  level: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'
  name: string
  description: string
  weight: number
  enabled: boolean
  applicableCondition?: string
}

/** 评判结果 */
export interface EvaluationResult {
  criteriaId: string
  criteriaName: string
  score: number
  passed: boolean
  reason: string
  notApplicable?: boolean
}

/** 定向测试数据 */
export interface TargetedTestData {
  originalCase: TestCase
  testCases: string
  evaluationCriteria: string
  generatedAt: string
}

/** 提示词版本 */
export interface PromptVersion {
  version: string
  content: string
  changes: string
  timestamp: string
}

/** 会话数据 */
export interface TestSession {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: {
    testCasesText: string
    testCases: TestCase[]
    evaluationCriteria: EvaluationCriteria[]
    criteriaGenerated: boolean
    generateCount: number
    concurrentCount: number
    testCaseLevel: string
    openingStyle: string
    criteriaScenario: string
    progress: number
    promptVersions: PromptVersion[]
    currentVersion: string
  }
}

/** AI推荐 */
export interface AIRecommendation {
  level: string
  count: number
  reason: string
}
