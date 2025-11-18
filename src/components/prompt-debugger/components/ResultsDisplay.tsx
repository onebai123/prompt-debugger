/**
 * 结果展示组件
 */

'use client'

import { Card, Space, Tag, Button, Collapse, Typography } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { TestCase } from '../types'

const { Panel } = Collapse
const { Text } = Typography

interface ResultsDisplayProps {
  testCases: TestCase[]
  botName: string
  productName: string
  language: string
  onTargetedTest?: (testCase: TestCase) => void
}

export default function ResultsDisplay({
  testCases,
  botName,
  productName,
  language,
  onTargetedTest,
}: ResultsDisplayProps) {
  const replaceVars = (text: string) => {
    return text
      .replace(/\{\{botName\}\}/g, botName)
      .replace(/\{\{productName\}\}/g, productName)
      .replace(/\{\{language\}\}/g, language)
  }

  if (testCases.length === 0) {
    return null
  }

  return (
    <Card title="测试结果" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {testCases.map((tc) => (
          <Card
            key={tc.id}
            size="small"
            type="inner"
            title={
              <Space>
                <span>{tc.title}</span>
                {tc.status === 'pending' && <Tag>等待</Tag>}
                {tc.status === 'running' && <Tag color="processing">运行中</Tag>}
                {tc.status === 'success' && tc.passed === true && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    通过
                  </Tag>
                )}
                {tc.status === 'success' && tc.passed === false && (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    未通过
                  </Tag>
                )}
                {tc.status === 'success' && tc.passed === undefined && (
                  <Tag color="processing">评判中</Tag>
                )}
                {tc.status === 'failed' && <Tag color="error">失败</Tag>}
                {tc.overallLevel && (
                  <Tag color={tc.overallScore && tc.overallScore >= 75 ? 'green' : 'orange'}>
                    {tc.overallLevel} {tc.overallScore}分
                  </Tag>
                )}
              </Space>
            }
            extra={
              tc.status === 'success' &&
              onTargetedTest && (
                <Button
                  type="link"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => onTargetedTest(tc)}
                >
                  定向测试
                </Button>
              )
            }
          >
            {/* 原始用例 */}
            <Collapse size="small" ghost style={{ marginBottom: 8 }}>
              <Panel header="原始用例" key="original">
                <div
                  style={{
                    fontSize: 12,
                    padding: 8,
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                  }}
                >
                  {tc.messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      <Text strong type="secondary">
                        {msg.role === 'user' ? '用户' : 'AI'}:{' '}
                      </Text>
                      {replaceVars(msg.content)}
                    </div>
                  ))}
                </div>
              </Panel>
            </Collapse>

            {/* Agent回复 */}
            {tc.responses && tc.responses.length > 0 && (
              <Collapse size="small" ghost style={{ marginBottom: 8 }}>
                <Panel header="Agent回复" key="response">
                  <div
                    style={{
                      fontSize: 12,
                      padding: 8,
                      background: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      borderRadius: 4,
                    }}
                  >
                    {tc.responses.map((resp, idx) => (
                      <div key={idx} style={{ marginBottom: 4 }}>
                        <Text strong type="secondary">AI{idx + 1}: </Text>
                        {resp}
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            )}

            {/* 评判详情 */}
            {tc.evaluationDetails && tc.evaluationDetails.length > 0 && (
              <Collapse size="small" ghost>
                <Panel header="评判详情" key="details">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    {tc.evaluationDetails.map((detail, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 4,
                          background: detail.notApplicable
                            ? '#f5f5f5'
                            : detail.passed
                            ? '#f6ffed'
                            : '#fff2f0',
                          border: `1px solid ${detail.notApplicable ? '#d9d9d9' : detail.passed ? '#b7eb8f' : '#ffccc7'}`,
                          borderRadius: 4,
                        }}
                      >
                        <div>
                          <Text strong>{detail.criteriaName}</Text>
                          {detail.notApplicable ? (
                            <Tag color="default" style={{ marginLeft: 4, fontSize: 10 }}>
                              N/A
                            </Tag>
                          ) : (
                            <>
                              <Tag
                                color={detail.passed ? 'success' : 'error'}
                                style={{ marginLeft: 4, fontSize: 10 }}
                              >
                                {detail.score}分
                              </Tag>
                              {detail.passed ? (
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              ) : (
                                <CloseCircleOutlined style={{ color: '#f5222d' }} />
                              )}
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {detail.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            )}

            {/* 失败信息 */}
            {tc.status === 'failed' && tc.evaluation && (
              <Text type="danger" style={{ fontSize: 12 }}>
                {tc.evaluation}
              </Text>
            )}
          </Card>
        ))}
      </Space>
    </Card>
  )
}
