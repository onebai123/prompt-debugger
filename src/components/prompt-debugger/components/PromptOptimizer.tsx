/**
 * 提示词优化面板
 */

'use client'

import { useState } from 'react'
import { Card, Button, Input, Spin, Alert, Typography, Space, Divider, message } from 'antd'
import { ThunderboltOutlined, BulbOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { callAgentDebugAPI } from '@/lib/api'
import { TestCase } from '../types'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

interface PromptOptimizerProps {
  testCases: TestCase[]
  systemPrompt: string
  currentVersion: string
  onSaveVersion?: (newPrompt: string, changes: string) => void
}

export default function PromptOptimizer({ testCases, systemPrompt, currentVersion, onSaveVersion }: PromptOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [promptChanges, setPromptChanges] = useState('')
  const [optimizeDirection, setOptimizeDirection] = useState('')
  const [optimizeConstraints, setOptimizeConstraints] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleOptimize = async () => {
    if (testCases.length === 0) {
      message.warning('请先执行测试获取优化依据')
      return
    }

    setIsOptimizing(true)
    try {
      // 构建简化测试报告
      const totalTests = testCases.length
      const passedTests = testCases.filter((tc) => tc.passed).length
      const failedTests = testCases.filter((tc) => tc.passed === false).length
      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

      // 失败案例详情（前3个，减少输入长度）
      const failedCases = testCases
        .filter((tc) => tc.passed === false)
        .slice(0, 3)
        .map((tc, idx) => {
          let caseDetail = `${idx + 1}. ${tc.title}`
          
          // 添加评判详情（只显示前2个失败标准）
          if (tc.evaluationDetails && tc.evaluationDetails.length > 0) {
            const failedCriteria = tc.evaluationDetails
              .filter(d => !d.passed && !d.notApplicable)
              .slice(0, 2)
              .map(d => `  - ${d.criteriaName}: ${d.score}分 - ${d.reason.substring(0, 100)}`)
              .join('\n')
            
            if (failedCriteria) {
              caseDetail += `\n  未通过标准:\n${failedCriteria}`
            }
          } else if (tc.evaluation) {
            caseDetail += `\n  问题: ${tc.evaluation.substring(0, 150)}`
          }
          
          return caseDetail
        })
        .join('\n\n')

      // 统计失败标准（找出最常见的失败点）
      const failureStats: Record<string, number> = {}
      testCases
        .filter((tc) => tc.evaluationDetails)
        .forEach((tc) => {
          tc.evaluationDetails?.forEach((d) => {
            if (!d.passed && !d.notApplicable) {
              failureStats[d.criteriaName] = (failureStats[d.criteriaName] || 0) + 1
            }
          })
        })

      const topFailures = Object.entries(failureStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `- ${name}: ${count}次失败`)
        .join('\n')

      const simplifiedReport = `
测试统计: 总${totalTests}个，通过${passedTests}个，未通过${failedTests}个，通过率${passRate}%

最常见的失败点:
${topFailures || '无'}

主要失败案例:
${failedCases || '无失败案例'}
`

      // 限制提示词长度，避免超时（保留前8000字符）
      const limitedPrompt = systemPrompt.length > 8000 
        ? systemPrompt.substring(0, 8000) + '\n...(后续内容已省略)'
        : systemPrompt

      const optimizePrompt = `你是AI提示词优化专家。基于测试报告优化以下Agent提示词。

**当前提示词**：
${limitedPrompt}

**测试报告摘要**：
${simplifiedReport}

${optimizeDirection ? `**优化方向**：${optimizeDirection}\n` : ''}

${optimizeConstraints ? `**优化前提（必须遵守）**：\n${optimizeConstraints}\n` : ''}

**要求**：
1. 保持原有业务逻辑和角色定位
2. 针对失败用例的问题进行优化
3. 提升意图识别、异常处理、真人感
4. 语言表达更自然
5. 如果输入提示词被截断，请基于现有部分优化，保持结构完整
${optimizeConstraints ? '6. **严格遵守上述优化前提，不得违反**' : ''}

**输出格式**（不要输出思考过程，简洁输出）：

【优化后的提示词】
<完整的新版提示词>

【主要改动】
1. <改动点1>
2. <改动点2>
3. <改动点3>`

      // 从配置读取评估模型
      const configStr = localStorage.getItem('prompt_debugger_config')
      const config = configStr ? JSON.parse(configStr) : {}
      const evalModel = config.evalModel || process.env.NEXT_PUBLIC_EVAL_MODEL || 'gpt-4o'

      const result = await callAgentDebugAPI({
        messages: [
          {
            role: 'user',
            content: optimizePrompt,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: '你是AI提示词优化专家。直接输出结果，不要思考过程，简洁高效。',
        model: evalModel,
        temperature: 0.5,
        maxTokens: 16000, // 提示词优化可能需要返回较长内容
        enableIntent: false,
        intentCategories: [],
      })

      if (result.success && result.response) {
        const fullResponse = result.response

        // 解析优化结果
        const promptMatch = fullResponse.match(/【优化后的提示词】\n([\s\S]*?)(?=\n【主要改动】|$)/)
        const changesMatch = fullResponse.match(/【主要改动】\n([\s\S]*)/)

        if (promptMatch && changesMatch) {
          const finalPrompt = promptMatch[1].trim()
          const finalChanges = changesMatch[1].trim()
          setOptimizedPrompt(finalPrompt)
          setPromptChanges(finalChanges)
          message.success('优化完成')
        } else {
          setOptimizedPrompt(fullResponse)
          setPromptChanges('AI未按格式输出改动，请查看完整内容')
        }
      }
    } catch (error) {
      console.error('优化失败:', error)
      message.error('优化失败')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt)
    message.success('已复制到剪贴板')
  }

  const handleSaveAsNewVersion = () => {
    if (onSaveVersion && optimizedPrompt && promptChanges) {
      onSaveVersion(optimizedPrompt, promptChanges)
      setShowConfirmModal(false)
      message.success('已保存为新版本')
    }
  }

  const executedCount = testCases.filter((tc) => tc.status === 'success').length

  return (
    <Card
      title={
        <Space>
          <BulbOutlined />
          <span>提示词优化</span>
        </Space>
      }
      size="small"
      extra={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleOptimize}
          loading={isOptimizing}
          disabled={executedCount === 0}
          size="small"
        >
          AI优化
        </Button>
      }
    >
      {executedCount === 0 ? (
        <Alert message="请先执行测试获取优化依据" type="info" showIcon />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 优化前提 */}
          <div>
            <Text strong style={{ fontSize: 12 }}>
              优化前提（可选）：
            </Text>
            <TextArea
              placeholder="例如：保持输出格式不变、保留特定功能逻辑、维持字符长度限制等"
              rows={2}
              value={optimizeConstraints}
              onChange={(e) => setOptimizeConstraints(e.target.value)}
              disabled={isOptimizing}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* 优化方向 */}
          <div>
            <Text strong style={{ fontSize: 12 }}>
              优化方向（可选）：
            </Text>
            <TextArea
              placeholder="例如：提升异议处理能力、增强真人感、优化开场引导等"
              rows={2}
              value={optimizeDirection}
              onChange={(e) => setOptimizeDirection(e.target.value)}
              disabled={isOptimizing}
              style={{ marginTop: 4 }}
            />
          </div>

          {isOptimizing ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="AI正在分析并优化提示词..." />
            </div>
          ) : optimizedPrompt ? (
            <>
              {/* 主要改动 */}
              {promptChanges && (
                <Card type="inner" size="small" title="主要改动">
                  <div style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{promptChanges}</div>
                </Card>
              )}

              {/* 优化后的提示词 */}
              <Card
                type="inner"
                size="small"
                title="优化后的提示词"
                extra={
                  <Space size="small">
                    <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                      复制
                    </Button>
                    {onSaveVersion && (
                      <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleSaveAsNewVersion}>
                        保存为新版本
                      </Button>
                    )}
                  </Space>
                }
              >
                <TextArea
                  value={optimizedPrompt}
                  onChange={(e) => setOptimizedPrompt(e.target.value)}
                  rows={12}
                  style={{ fontSize: 12 }}
                />
              </Card>
            </>
          ) : (
            <Alert message="点击「AI优化」基于测试结果优化提示词" type="info" showIcon />
          )}
        </Space>
      )}
    </Card>
  )
}
