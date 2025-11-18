/**
 * 评判标准管理组件
 */

'use client'

import { useState } from 'react'
import { Card, Button, Space, Switch, Tag, Collapse, message, InputNumber, Input } from 'antd'
import { ThunderboltOutlined, EditOutlined } from '@ant-design/icons'
import { callAgentDebugAPI } from '@/lib/api'
import { EvaluationCriteria } from '../types'
import { replaceVariables } from '../utils/testCaseParser'

const { TextArea } = Input
const { Panel } = Collapse

interface EvaluationManagerProps {
  systemPrompt: string
  botName: string
  productName: string
  language: string
  criteria: EvaluationCriteria[]
  onCriteriaChange: (criteria: EvaluationCriteria[]) => void
  onQuickSwitch: (level: string) => void
}

export default function EvaluationManager({
  systemPrompt,
  botName,
  productName,
  language,
  criteria,
  onCriteriaChange,
  onQuickSwitch,
}: EvaluationManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria[]>([])

  /** AI生成评判标准 */
  const handleGenerateCriteria = async () => {
    setIsGenerating(true)
    try {
      const processedPrompt = replaceVariables(systemPrompt, { botName, productName, language })

      const generatePrompt = `基于以下AI提示词，生成全面的对话质量评判标准。

**提示词**：
${processedPrompt}

**要求**：
1. 生成P0-P6级别的评判标准
2. P0: 致命错误（系统崩溃、无法响应等）
3. P1: 核心流程（业务逻辑、关键功能、执行流程等）
4. P2: 重要特性（风格一致性、回复质量等）
5. P3-P6: 其他质量维度

返回JSON格式：
[
  {
    "id": "唯一ID",
    "level": "P0/P1/P2/P3/P4/P5/P6",
    "name": "标准名称",
    "description": "详细描述",
    "weight": 权重(1-10),
    "applicableCondition": "适用条件（可选）"
  },
  ...
]

只返回JSON数组。`

      // 从配置读取评估模型
      const configStr = localStorage.getItem('prompt_debugger_config')
      const config = configStr ? JSON.parse(configStr) : {}
      const evalModel = config.evalModel || process.env.NEXT_PUBLIC_EVAL_MODEL || 'gpt-4o'

      const result = await callAgentDebugAPI({
        messages: [
          {
            role: 'user',
            content: generatePrompt,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: '你是专业的对话质量评判专家，生成准确的JSON格式。',
        model: evalModel,
        temperature: 0.3,
        maxTokens: 4000,
        enableIntent: false,
        intentCategories: [],
      })

      if (result.success && result.response) {
        const jsonMatch = result.response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0])
          const withEnabled = generated.map((c: any) => ({
            ...c,
            enabled: c.level === 'P0' || c.level === 'P1' || c.level === 'P2',
          }))
          onCriteriaChange(withEnabled)
          message.success(`生成${generated.length}个评判标准`)
        }
      }
    } catch (error) {
      message.error('生成失败')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  /** 开始编辑 */
  const startEdit = () => {
    setEditingCriteria(JSON.parse(JSON.stringify(criteria)))
    setShowEditor(true)
  }

  /** 保存编辑 */
  const saveEdit = () => {
    onCriteriaChange(editingCriteria)
    setShowEditor(false)
    message.success('保存成功')
  }

  /** 切换启用 */
  const toggleEnabled = (id: string) => {
    setEditingCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
  }

  /** 更新权重 */
  const updateWeight = (id: string, weight: number) => {
    setEditingCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight } : c))
    )
  }

  const enabledCount = criteria.filter((c) => c.enabled).length

  return (
    <Card
      title={
        <Space>
          <span>评判标准</span>
          <Tag color="blue">{enabledCount}个已启用</Tag>
        </Space>
      }
      size="small"
      extra={
        <Space>
          {!showEditor ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateCriteria}
                loading={isGenerating}
              >
                AI生成
              </Button>
              <Button size="small" icon={<EditOutlined />} onClick={startEdit}>
                编辑
              </Button>
            </>
          ) : (
            <>
              <Button size="small" onClick={() => setShowEditor(false)}>
                取消
              </Button>
              <Button type="primary" size="small" onClick={saveEdit}>
                保存
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* 快速切换预设 */}
        <Card type="inner" size="small" title="快速切换">
          <Space wrap>
            {['P0', 'P1', 'P1-P2', 'P1-P3', 'P1-P4', 'P1-P5', 'ALL'].map((level) => (
              <Button key={level} size="small" onClick={() => onQuickSwitch(level)}>
                {level}
              </Button>
            ))}
          </Space>
        </Card>

        {/* 标准列表 */}
        {showEditor ? (
          <Collapse size="small">
            {editingCriteria.map((c) => (
              <Panel
                key={c.id}
                header={
                  <Space>
                    <Switch
                      size="small"
                      checked={c.enabled}
                      onChange={() => toggleEnabled(c.id)}
                    />
                    <Tag color={c.level === 'P0' ? 'red' : c.level === 'P1' ? 'orange' : 'blue'}>
                      {c.level}
                    </Tag>
                    <span>{c.name}</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>权重：</strong>
                    <InputNumber
                      min={1}
                      max={10}
                      value={c.weight}
                      onChange={(v) => updateWeight(c.id, v || 1)}
                      size="small"
                    />
                  </div>
                  <div>
                    <strong>描述：</strong>
                    <div>{c.description}</div>
                  </div>
                  {c.applicableCondition && (
                    <div>
                      <strong>适用条件：</strong>
                      <div>{c.applicableCondition}</div>
                    </div>
                  )}
                </Space>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {criteria
              .filter((c) => c.enabled)
              .map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '4px 8px',
                    marginBottom: 4,
                    background: '#f5f5f5',
                    borderRadius: 4,
                  }}
                >
                  <Space size={4}>
                    <Tag
                      color={c.level === 'P0' ? 'red' : c.level === 'P1' ? 'orange' : 'blue'}
                      style={{ margin: 0 }}
                    >
                      {c.level}
                    </Tag>
                    <span style={{ fontSize: 12 }}>
                      {c.name} (权重{c.weight})
                    </span>
                  </Space>
                </div>
              ))}
          </div>
        )}
      </Space>
    </Card>
  )
}
