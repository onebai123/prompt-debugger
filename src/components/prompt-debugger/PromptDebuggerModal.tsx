/**
 * Prompt Debugger - 提示词调试器
 * 
 * 功能特性：
 * - 会话管理：支持多会话切换，每个会话独立保存测试数据
 * - 组件化：拆分成多个小组件，易于维护
 * - 并发执行：支持并发测试和重新评判
 * - 智能优化：基于测试结果生成优化建议并持续迭代
 */

'use client'

import { Modal, Row, Col, message } from 'antd'
import { useSessionState } from './hooks/useSessionState'
import { useTestExecution } from './hooks/useTestExecution'
import { useConcurrentEvaluation } from './hooks/useConcurrentEvaluation'
import SessionManager from './components/SessionManager'
import TestCaseGenerator from './components/TestCaseGenerator'
import EvaluationManager from './components/EvaluationManager'
import TestExecutor from './components/TestExecutor'
import ResultsDisplay from './components/ResultsDisplay'
import AIScorePanel from './components/AIScorePanel'
import PromptOptimizer from './components/PromptOptimizer'
import PromptVersionManager from './components/PromptVersionManager'
import { TestCase, EvaluationCriteria } from './types'

interface PromptDebuggerModalProps {
  open: boolean
  onClose: () => void
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  botName: string
  productName: string
  language: string
}

export default function PromptDebuggerModal({
  open,
  onClose,
  systemPrompt,
  model,
  temperature,
  maxTokens,
  botName,
  productName,
  language,
}: PromptDebuggerModalProps) {
  // 会话管理
  const {
    sessions,
    currentSessionId,
    currentSession,
    createSession,
    switchSession,
    updateCurrentSession,
    renameSession,
    deleteSession,
    duplicateSession,
  } = useSessionState()

  // 当前会话数据（兼容旧数据）
  const sessionData = {
    testCasesText: '',
    testCases: [],
    evaluationCriteria: [],
    criteriaGenerated: false,
    generateCount: 10,
    concurrentCount: 5,
    testCaseLevel: 'p1_p2',
    openingStyle: 'mixed',
    criteriaScenario: 'phone_robot',
    progress: 0,
    promptVersions: [
      {
        version: 'V1',
        content: '',
        changes: '初始版本',
        timestamp: new Date().toLocaleString('zh-CN'),
      },
    ],
    currentVersion: 'V1',
    ...(currentSession?.data || {}),
  }

  // 获取当前版本的提示词
  const getCurrentVersionPrompt = () => {
    if (!sessionData.currentVersion || sessionData.currentVersion === 'V1') {
      return systemPrompt
    }
    if (!sessionData.promptVersions || sessionData.promptVersions.length === 0) {
      return systemPrompt
    }
    const version = sessionData.promptVersions.find((v) => v.version === sessionData.currentVersion)
    return version?.content || systemPrompt
  }

  // 测试执行Hook
  const { isRunning, progress, executeTests } = useTestExecution({
    systemPrompt: getCurrentVersionPrompt(),
    model,
    temperature,
    maxTokens,
    botName,
    productName,
    language,
    concurrentCount: sessionData.concurrentCount,
    evaluationCriteria: sessionData.evaluationCriteria,
  })

  // 重新评判Hook
  const { isEvaluating, evalProgress, reEvaluateAll } = useConcurrentEvaluation(
    sessionData.concurrentCount,
    sessionData.evaluationCriteria
  )

  /** 处理测试用例生成 */
  const handleTestCasesGenerated = (testCases: TestCase[]) => {
    updateCurrentSession({ testCases })
  }

  /** 处理测试用例文本变化 */
  const handleTestCasesTextChange = (text: string) => {
    updateCurrentSession({ testCasesText: text })
  }

  /** 处理评判标准变化 */
  const handleCriteriaChange = (criteria: EvaluationCriteria[]) => {
    updateCurrentSession({
      evaluationCriteria: criteria,
      criteriaGenerated: criteria.length > 0,
    })
  }

  /** 快速切换评判标准 */
  const handleQuickSwitch = (level: string) => {
    const newCriteria = sessionData.evaluationCriteria.map((c) => {
      if (level === 'ALL') {
        return { ...c, enabled: true }
      } else if (level.includes('-')) {
        const [start, end] = level.split('-')
        const levels = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']
        const startIdx = levels.indexOf(start)
        const endIdx = levels.indexOf(end)
        return {
          ...c,
          enabled:
            levels.indexOf(c.level) >= startIdx && levels.indexOf(c.level) <= endIdx,
        }
      } else {
        return { ...c, enabled: c.level === level }
      }
    })
    updateCurrentSession({ evaluationCriteria: newCriteria })
    message.success(`已切换到 ${level} 标准`)
  }

  /** 执行测试 */
  const handleExecute = async () => {
    const enabledCriteria = sessionData.evaluationCriteria.filter((c) => c.enabled)
    if (enabledCriteria.length === 0) {
      message.warning('请至少启用1个评判标准')
      return
    }

    try {
      const results = await executeTests(sessionData.testCases)
      updateCurrentSession({ testCases: results })
    } catch (error) {
      console.error('测试执行失败:', error)
    }
  }

  /** 重新评判 */
  const handleReEvaluate = async () => {
    try {
      // 先清理状态
      const executedCases = sessionData.testCases.filter(
        (tc) => tc.status === 'success' && tc.conversationHistory
      )
      
      const clearedCases = sessionData.testCases.map((tc) => {
        if (executedCases.some((ec) => ec.id === tc.id)) {
          return {
            ...tc,
            passed: undefined,
            overallScore: undefined,
            overallLevel: undefined,
          }
        }
        return tc
      })
      
      updateCurrentSession({ testCases: clearedCases })

      // 执行重新评判
      const results = await reEvaluateAll(executedCases)

      // 更新结果
      const updatedCases = sessionData.testCases.map((tc) => {
        const result = results.get(tc.id)
        if (result && result.success) {
          return {
            ...tc,
            evaluation: result.evaluation,
            evaluationDetails: result.evaluationDetails,
            overallScore: result.overallScore,
            overallLevel: result.overallLevel,
            passed: result.passed,
          }
        }
        return tc
      })

      updateCurrentSession({ testCases: updatedCases })
    } catch (error) {
      console.error('重新评判失败:', error)
    }
  }

  /** 清空结果 */
  const handleClear = () => {
    const cleared = sessionData.testCases.map((tc) => ({
      ...tc,
      status: 'pending' as const,
      responses: undefined,
      evaluation: undefined,
      passed: undefined,
      evaluationDetails: undefined,
      overallLevel: undefined,
      overallScore: undefined,
      conversationHistory: undefined,
    }))
    updateCurrentSession({ testCases: cleared, progress: 0 })
    message.success('已清空测试结果')
  }

  /** 并发数变化 */
  const handleConcurrentChange = (count: number) => {
    updateCurrentSession({ concurrentCount: count })
  }

  /** 定向测试 */
  const handleTargetedTest = (testCase: TestCase) => {
    message.info('定向测试功能开发中...')
    // TODO: 实现定向测试逻辑
  }

  /** 保存新版本 */
  const handleSaveVersion = (newPrompt: string, changes: string) => {
    const newVersionNumber = sessionData.promptVersions.length + 1
    const newVersion = {
      version: `V${newVersionNumber}`,
      content: newPrompt,
      changes: changes,
      timestamp: new Date().toLocaleString('zh-CN'),
    }
    
    updateCurrentSession({
      promptVersions: [...sessionData.promptVersions, newVersion],
      currentVersion: newVersion.version,
    })
    
    message.success(`已保存为 ${newVersion.version}，可以继续测试验证`)
  }

  /** 处理提示词直接编辑 */
  const handlePromptChange = (newPrompt: string) => {
    if (sessionData.currentVersion === 'V1') {
      // V1版本直接保存新版本
      const newVersion = {
        version: 'V2',
        content: newPrompt,
        changes: '手动编辑',
        timestamp: new Date().toLocaleString('zh-CN'),
      }
      updateCurrentSession({
        promptVersions: [...sessionData.promptVersions, newVersion],
        currentVersion: 'V2',
      })
    } else {
      // 更新当前版本
      const updatedVersions = sessionData.promptVersions.map((v) =>
        v.version === sessionData.currentVersion ? { ...v, content: newPrompt } : v
      )
      updateCurrentSession({ promptVersions: updatedVersions })
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            🧪 Prompt Debugger
          </span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#999' }}>|</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
            📝 输入提示词 → 🧪 生成测试 → 🚀 执行测试 → 📊 AI评分 → 💡 智能优化 → 🔄 复测验证 → 🔁 持续迭代
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width="95vw"
      style={{ top: 20 }}
      footer={null}
    >
      <Row gutter={12} style={{ height: 'calc(100vh - 200px)' }}>
        {/* 左侧：会话管理 */}
        <Col span={4} style={{ height: '100%', overflow: 'auto' }}>
          <SessionManager
            sessions={sessions}
            currentSessionId={currentSessionId}
            currentPrompt={getCurrentVersionPrompt()}
            onSwitch={switchSession}
            onCreate={createSession}
            onRename={renameSession}
            onDelete={deleteSession}
            onDuplicate={duplicateSession}
            onPromptChange={handlePromptChange}
          />
        </Col>

        {/* 中左：测试用例和评判标准 */}
        <Col span={7} style={{ height: '100%', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TestCaseGenerator
              systemPrompt={getCurrentVersionPrompt()}
              botName={botName}
              productName={productName}
              language={language}
              onGenerated={handleTestCasesGenerated}
              testCasesText={sessionData.testCasesText}
              onTestCasesTextChange={handleTestCasesTextChange}
            />

            <EvaluationManager
              systemPrompt={getCurrentVersionPrompt()}
              botName={botName}
              productName={productName}
              language={language}
              criteria={sessionData.evaluationCriteria}
              onCriteriaChange={handleCriteriaChange}
              onQuickSwitch={handleQuickSwitch}
            />
          </div>
        </Col>

        {/* 中右：执行和结果 */}
        <Col span={7} style={{ height: '100%', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TestExecutor
              testCases={sessionData.testCases}
              isRunning={isRunning || isEvaluating}
              progress={isRunning ? progress : evalProgress}
              concurrentCount={sessionData.concurrentCount}
              onConcurrentChange={handleConcurrentChange}
              onExecute={handleExecute}
              onReEvaluate={handleReEvaluate}
              onClear={handleClear}
            />

            <ResultsDisplay
              testCases={sessionData.testCases}
              botName={botName}
              productName={productName}
              language={language}
              onTargetedTest={handleTargetedTest}
            />
          </div>
        </Col>

        {/* 右侧：版本管理、AI评分和提示词优化 */}
        <Col span={6} style={{ height: '100%', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PromptVersionManager
              versions={sessionData.promptVersions}
              currentVersion={sessionData.currentVersion}
              basePrompt={systemPrompt}
              onVersionChange={(version) => updateCurrentSession({ currentVersion: version })}
              onSaveVersion={handleSaveVersion}
            />

            <AIScorePanel testCases={sessionData.testCases} systemPrompt={getCurrentVersionPrompt()} />

            <PromptOptimizer
              testCases={sessionData.testCases}
              systemPrompt={getCurrentVersionPrompt()}
              currentVersion={sessionData.currentVersion}
              onSaveVersion={handleSaveVersion}
            />
          </div>
        </Col>
      </Row>
    </Modal>
  )
}
