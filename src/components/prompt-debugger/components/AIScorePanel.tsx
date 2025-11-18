/**
 * AI评分面板
 */

'use client'

import { useState } from 'react'
import { Card, Button, Spin, Alert, Statistic, Row, Col, Typography, Space, Collapse } from 'antd'
import { ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { callAgentDebugAPI } from '@/lib/api'
import { TestCase } from '../types'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

interface ScoreDimension {
  name: string
  score: number
  reason: string
}

interface ScoreReport {
  totalScore: number
  dimensions: ScoreDimension[]
  suggestions: string[]
  summary: string
}

interface AIScorePanelProps {
  testCases: TestCase[]
  systemPrompt: string
}

export default function AIScorePanel({ testCases, systemPrompt }: AIScorePanelProps) {
  const [isScoring, setIsScoring] = useState(false)
  const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null)

  const handleAIScore = async () => {
    if (testCases.length === 0) {
      return
    }

    setIsScoring(true)
    try {
      // 构建测试报告
      const totalTests = testCases.length
      const passedTests = testCases.filter((tc) => tc.passed).length
      const failedTests = testCases.filter((tc) => tc.passed === false).length
      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

      // 收集失败案例
      const failedCases = testCases
        .filter((tc) => tc.passed === false)
        .slice(0, 5)
        .map((tc) => `- ${tc.title}: ${tc.evaluation?.substring(0, 100)}`)
        .join('\n')

      const scorePrompt = `你是AI Agent质量评估专家。基于批量测试结果，对Agent进行综合评分。

**系统提示词**（前500字）：
${systemPrompt.substring(0, 500)}...

**测试统计**：
- 总用例: ${totalTests}
- 通过: ${passedTests}
- 未通过: ${failedTests}
- 通过率: ${passRate}%

**失败案例示例**：
${failedCases || '无失败案例'}

**评分要求**：
从以下维度评分（0-100分）：
1. 功能完整性 - 核心功能是否完整可用
2. 稳定性 - 是否存在崩溃或异常
3. 真人感 - 对话是否自然流畅
4. 异常处理 - 对意外情况的处理能力
5. 用户体验 - 整体交互体验

返回JSON格式：
{
  "totalScore": 总分0-100,
  "dimensions": [
    {"name": "功能完整性", "score": 分数, "reason": "简短理由"},
    ...
  ],
  "suggestions": ["改进建议1", "改进建议2", ...],
  "summary": "一句话总结"
}

只返回JSON。`

      // 从配置读取评估模型
      const configStr = localStorage.getItem('prompt_debugger_config')
      const config = configStr ? JSON.parse(configStr) : {}
      const evalModel = config.evalModel || process.env.NEXT_PUBLIC_EVAL_MODEL || 'gpt-4o'

      const result = await callAgentDebugAPI({
        messages: [
          {
            role: 'user',
            content: scorePrompt,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: '你是专业的AI质量评估专家，返回准确的JSON格式。',
        model: evalModel,
        temperature: 0.3,
        maxTokens: 4000,
        enableIntent: false,
        intentCategories: [],
      })

      if (result.success && result.response) {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const report = JSON.parse(jsonMatch[0])
          setScoreReport(report)
        }
      }
    } catch (error) {
      console.error('AI评分失败:', error)
    } finally {
      setIsScoring(false)
    }
  }

  const executedCount = testCases.filter((tc) => tc.status === 'success').length

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>AI综合评分</span>
        </Space>
      }
      size="small"
      extra={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleAIScore}
          loading={isScoring}
          disabled={executedCount === 0}
          size="small"
        >
          AI评分
        </Button>
      }
    >
      {executedCount === 0 ? (
        <Alert message="请先执行测试" type="info" showIcon />
      ) : isScoring ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="AI正在分析测试结果..." />
        </div>
      ) : scoreReport ? (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 总分 */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Statistic
              title="综合得分"
              value={scoreReport.totalScore}
              suffix="/ 100"
              valueStyle={{
                color: scoreReport.totalScore >= 80 ? '#52c41a' : scoreReport.totalScore >= 60 ? '#faad14' : '#f5222d',
                fontSize: 48,
              }}
            />
            <Text type="secondary">{scoreReport.summary}</Text>
          </div>

          {/* 可折叠的详细内容 */}
          <Collapse size="small" defaultActiveKey={['dimensions']}>
            {/* 各维度得分 */}
            <Panel header="各维度评分" key="dimensions">
              <Row gutter={[8, 8]}>
                {scoreReport.dimensions.map((dim, idx) => (
                  <Col span={12} key={idx}>
                    <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                      <Statistic
                        title={dim.name}
                        value={dim.score}
                        valueStyle={{
                          fontSize: 20,
                          color: dim.score >= 80 ? '#52c41a' : dim.score >= 60 ? '#faad14' : '#f5222d',
                        }}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dim.reason}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Panel>

            {/* 改进建议 */}
            {scoreReport.suggestions.length > 0 && (
              <Panel header="改进建议" key="suggestions">
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                  {scoreReport.suggestions.map((suggestion, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </Collapse>
        </Space>
      ) : (
        <Alert message="点击「AI评分」获取综合评估" type="info" showIcon />
      )}
    </Card>
  )
}
