/**
 * 测试用例生成组件
 */

'use client'

import { useState } from 'react'
import { Card, Button, Input, Space, Select, InputNumber, message } from 'antd'
import { ThunderboltOutlined, FileTextOutlined } from '@ant-design/icons'
import { callAgentDebugAPI } from '@/lib/api'
import { TestCase } from '../types'
import { parseTestCasesFromText, replaceVariables } from '../utils/testCaseParser'

const { TextArea } = Input

interface TestCaseGeneratorProps {
  systemPrompt: string
  botName: string
  productName: string
  language: string
  onGenerated: (testCases: TestCase[]) => void
  testCasesText: string
  onTestCasesTextChange: (text: string) => void
}

export default function TestCaseGenerator({
  systemPrompt,
  botName,
  productName,
  language,
  onGenerated,
  testCasesText,
  onTestCasesTextChange,
}: TestCaseGeneratorProps) {
  const [testPoints, setTestPoints] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)
  const [testCaseLevel, setTestCaseLevel] = useState<string>('p1_p2')
  const [openingStyle, setOpeningStyle] = useState<string>('mixed')

  /** AI生成测试用例 */
  const handleGenerateTestCases = async () => {
    // 如果没有输入测试要点，使用默认值
    const finalTestPoints = testPoints.trim() || '基于提示词生成典型的对话场景，包括：积极场景、拒绝场景、常规场景等'

    setIsGenerating(true)
    try {
      const processedPrompt = replaceVariables(systemPrompt, { botName, productName, language })

      const levelConfig: Record<string, { desc: string; counts: string }> = {
        p0: { desc: 'P0(致命错误)用例', counts: `共${generateCount}个P0用例` },
        p1: { desc: 'P1(核心流程)用例', counts: `共${generateCount}个P1用例` },
        p1_p2: {
          desc: 'P1-P2(核心+重要)用例',
          counts: `P1用例${Math.ceil(generateCount * 0.6)}个，P2用例${Math.floor(generateCount * 0.4)}个`,
        },
        p1_p3: {
          desc: 'P1-P3(核心+重要+常规)用例',
          counts: `P1用例${Math.ceil(generateCount * 0.5)}个，P2用例${Math.floor(generateCount * 0.3)}个，P3用例${Math.floor(generateCount * 0.2)}个`,
        },
        p1_p5: {
          desc: 'P1-P5全覆盖用例',
          counts: `P1:${Math.ceil(generateCount * 0.3)}个，P2:${Math.floor(generateCount * 0.25)}个，P3:${Math.floor(generateCount * 0.2)}个，P4:${Math.floor(generateCount * 0.15)}个，P5:${Math.floor(generateCount * 0.1)}个`,
        },
        all: {
          desc: 'P0-P6完整覆盖用例',
          counts: `P0:${Math.ceil(generateCount * 0.05)}个，P1:${Math.ceil(generateCount * 0.25)}个，P2:${Math.floor(generateCount * 0.2)}个，P3:${Math.floor(generateCount * 0.2)}个，P4:${Math.floor(generateCount * 0.15)}个，P5:${Math.floor(generateCount * 0.1)}个，P6:${Math.floor(generateCount * 0.05)}个`,
        },
      }

      const config = levelConfig[testCaseLevel] || levelConfig.p1_p2

      const generatePrompt = `基于以下提示词和测试要点，生成${config.desc}。

**系统提示词**：
${processedPrompt}

**测试要点**：
${finalTestPoints}

**要求**：
1. 生成${config.counts}
2. 用例格式：
   用例X：【级别】标题
   AI:开场白
   用户:回应
   AI:回应
   ...

3. 开场方式：${openingStyle === 'ai_first' ? 'AI先说话' : openingStyle === 'user_first' ? '用户先说话' : '混合（随机）'}
4. 覆盖关键场景
5. 直接输出用例文本，不要其他说明

开始生成：`

      // 从配置读取评估模型
      const apiConfigStr = localStorage.getItem('prompt_debugger_config')
      const apiConfig = apiConfigStr ? JSON.parse(apiConfigStr) : {}
      const evalModel = apiConfig.evalModel || process.env.NEXT_PUBLIC_EVAL_MODEL || 'gpt-4o'

      const result = await callAgentDebugAPI({
        messages: [
          {
            role: 'user',
            content: generatePrompt,
            timestamp: new Date().toISOString(),
          },
        ],
        systemPrompt: '你是测试用例生成专家，生成高质量的对话测试用例。',
        model: evalModel,
        temperature: 0.7,
        maxTokens: 8000, // 生成多个测试用例需要较多token
        enableIntent: false,
        intentCategories: [],
      })

      if (result.success && result.response) {
        onTestCasesTextChange(result.response)
        const parsed = parseTestCasesFromText(result.response)
        onGenerated(parsed)
        message.success(`生成${parsed.length}个测试用例`)
      } else {
        message.error('生成失败：' + (result.error || '未知错误'))
      }
    } catch (error) {
      message.error('生成失败')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  /** 手动解析用例 */
  const handleParseManual = () => {
    try {
      const parsed = parseTestCasesFromText(testCasesText)
      if (parsed.length === 0) {
        message.warning('未解析到有效用例')
        return
      }
      onGenerated(parsed)
      message.success(`解析${parsed.length}个测试用例`)
    } catch (error) {
      message.error('解析失败')
      console.error(error)
    }
  }

  return (
    <Card title="测试用例" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* AI生成配置 */}
        <Card type="inner" size="small" title="AI生成配置">
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <TextArea
              placeholder="输入测试要点，AI会根据提示词生成对应的测试用例&#10;例如：正向场景、边界条件、异常处理、特殊情况等"
              rows={3}
              value={testPoints}
              onChange={(e) => setTestPoints(e.target.value)}
            />
            <Space wrap>
              <Select
                style={{ width: 160 }}
                value={testCaseLevel}
                onChange={setTestCaseLevel}
                options={[
                  { label: 'P0 致命错误', value: 'p0' },
                  { label: 'P1 核心流程', value: 'p1' },
                  { label: 'P1-P2 核心+重要', value: 'p1_p2' },
                  { label: 'P1-P3 常规覆盖', value: 'p1_p3' },
                  { label: 'P1-P5 全面覆盖', value: 'p1_p5' },
                  { label: 'P0-P6 完整覆盖', value: 'all' },
                ]}
              />
              <Select
                style={{ width: 120 }}
                value={openingStyle}
                onChange={setOpeningStyle}
                options={[
                  { label: 'AI开场', value: 'ai_first' },
                  { label: '用户开场', value: 'user_first' },
                  { label: '混合开场', value: 'mixed' },
                ]}
              />
              <Space.Compact>
                <Input value="数量" disabled style={{ width: 50, textAlign: 'center' }} />
                <InputNumber
                  min={1}
                  max={50}
                  value={generateCount}
                  onChange={(v) => setGenerateCount(v || 10)}
                />
              </Space.Compact>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateTestCases}
                loading={isGenerating}
              >
                AI生成
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 手动编辑 */}
        <div>
          <TextArea
            placeholder="或手动输入测试用例&#10;格式：&#10;用例1：标题&#10;AI:消息&#10;用户:消息"
            rows={10}
            value={testCasesText}
            onChange={(e) => onTestCasesTextChange(e.target.value)}
          />
          <Button
            type="dashed"
            icon={<FileTextOutlined />}
            onClick={handleParseManual}
            style={{ marginTop: 8 }}
            block
          >
            解析用例
          </Button>
        </div>
      </Space>
    </Card>
  )
}
