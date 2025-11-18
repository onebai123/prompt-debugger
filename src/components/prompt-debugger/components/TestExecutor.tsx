/**
 * 测试执行面板
 */

'use client'

import { Card, Button, Space, Progress, Alert, Input, InputNumber, Statistic, Row, Col } from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import { TestCase } from '../types'

interface TestExecutorProps {
  testCases: TestCase[]
  isRunning: boolean
  progress: number
  concurrentCount: number
  onConcurrentChange: (count: number) => void
  onExecute: () => void
  onReEvaluate: () => void
  onClear: () => void
}

export default function TestExecutor({
  testCases,
  isRunning,
  progress,
  concurrentCount,
  onConcurrentChange,
  onExecute,
  onReEvaluate,
  onClear,
}: TestExecutorProps) {
  const pendingCount = testCases.filter((tc) => tc.status === 'pending').length
  const runningCount = testCases.filter((tc) => tc.status === 'running').length
  const successCount = testCases.filter((tc) => tc.status === 'success').length
  const failedCount = testCases.filter((tc) => tc.status === 'failed').length
  const passedCount = testCases.filter((tc) => tc.passed === true).length
  const notPassedCount = testCases.filter((tc) => tc.passed === false).length

  const hasExecuted = successCount > 0 || failedCount > 0

  return (
    <Card title="测试执行" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 统计信息 */}
        {testCases.length > 0 && (
          <Row gutter={8}>
            <Col span={6}>
              <Statistic title="总用例" value={testCases.length} />
            </Col>
            <Col span={6}>
              <Statistic title="已执行" value={successCount} valueStyle={{ color: '#1890ff' }} />
            </Col>
            <Col span={6}>
              <Statistic title="通过" value={passedCount} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={6}>
              <Statistic title="未通过" value={notPassedCount} valueStyle={{ color: '#f5222d' }} />
            </Col>
          </Row>
        )}

        {/* 进度条 */}
        {isRunning && (
          <Progress
            percent={progress}
            status="active"
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
          />
        )}

        {/* 提示 */}
        {testCases.length === 0 && (
          <Alert message="请先生成或解析测试用例" type="info" showIcon />
        )}

        {/* 操作按钮 */}
        <Space wrap>
          <Space.Compact>
            <Input value="并发" disabled style={{ width: 50, textAlign: 'center' }} />
            <InputNumber
              min={1}
              max={10}
              value={concurrentCount}
              onChange={(v) => onConcurrentChange(v || 5)}
              disabled={isRunning}
              style={{ width: 90 }}
            />
          </Space.Compact>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onExecute}
            disabled={testCases.length === 0 || isRunning}
            loading={isRunning}
          >
            执行测试
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onReEvaluate}
            disabled={!hasExecuted || isRunning}
          >
            重新评判
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
            disabled={testCases.length === 0 || isRunning}
            danger
          >
            清空结果
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
