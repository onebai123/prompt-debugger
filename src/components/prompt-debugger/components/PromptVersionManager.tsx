/**
 * 提示词版本管理组件
 */

'use client'

import { useState } from 'react'
import { Card, Select, Space, Tag, Button, Modal, Typography, Alert, message, Input } from 'antd'
import { HistoryOutlined, EyeOutlined, SwapOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons'
import { PromptVersion } from '../types'

const { Text } = Typography

interface PromptVersionManagerProps {
  versions: PromptVersion[]
  currentVersion: string
  basePrompt: string
  onVersionChange: (version: string) => void
  onSaveVersion: (content: string, changes: string) => void
}

export default function PromptVersionManager({
  versions = [],
  currentVersion = 'V1',
  basePrompt = '',
  onVersionChange,
  onSaveVersion,
}: PromptVersionManagerProps) {
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [compareVersion, setCompareVersion] = useState<string>('')
  const [editedPrompt, setEditedPrompt] = useState('')
  const [versionChanges, setVersionChanges] = useState('')

  // 确保至少有 V1 版本
  const safeVersions = versions.length > 0 ? versions : [
    {
      version: 'V1',
      content: '',
      changes: '初始版本',
      timestamp: new Date().toLocaleString('zh-CN'),
    },
  ]

  const getCurrentPrompt = () => {
    if (currentVersion === 'V1') {
      return basePrompt
    }
    return safeVersions.find((v) => v.version === currentVersion)?.content || basePrompt
  }

  const handleViewDiff = () => {
    if (safeVersions.length < 2) return
    const prevIdx = safeVersions.findIndex((v) => v.version === currentVersion) - 1
    if (prevIdx >= 0) {
      setCompareVersion(safeVersions[prevIdx].version)
    } else {
      setCompareVersion('V1')
    }
    setShowDiffModal(true)
  }

  const getPromptContent = (version: string) => {
    if (version === 'V1') return basePrompt
    return safeVersions.find((v) => v.version === version)?.content || basePrompt
  }

  // 简单的行级差异对比
  const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const result: Array<{
      type: 'equal' | 'delete' | 'insert' | 'replace'
      oldLine?: string
      newLine?: string
      oldIndex?: number
      newIndex?: number
    }> = []

    let i = 0
    let j = 0

    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        // 新增行
        result.push({ type: 'insert', newLine: newLines[j], newIndex: j })
        j++
      } else if (j >= newLines.length) {
        // 删除行
        result.push({ type: 'delete', oldLine: oldLines[i], oldIndex: i })
        i++
      } else if (oldLines[i] === newLines[j]) {
        // 相同行
        result.push({
          type: 'equal',
          oldLine: oldLines[i],
          newLine: newLines[j],
          oldIndex: i,
          newIndex: j,
        })
        i++
        j++
      } else {
        // 检查是否是修改（在后续行中找不到匹配）
        const oldInNew = newLines.slice(j).indexOf(oldLines[i])
        const newInOld = oldLines.slice(i).indexOf(newLines[j])

        if (oldInNew === -1 && newInOld === -1) {
          // 替换行
          result.push({
            type: 'replace',
            oldLine: oldLines[i],
            newLine: newLines[j],
            oldIndex: i,
            newIndex: j,
          })
          i++
          j++
        } else if (oldInNew !== -1 && (newInOld === -1 || oldInNew < newInOld)) {
          // 新增行
          result.push({ type: 'insert', newLine: newLines[j], newIndex: j })
          j++
        } else {
          // 删除行
          result.push({ type: 'delete', oldLine: oldLines[i], oldIndex: i })
          i++
        }
      }
    }

    return result
  }

  const currentVersionData = safeVersions.find((v) => v.version === currentVersion)

  return (
    <>
      <Card
        size="small"
        title={
          <Space>
            <HistoryOutlined />
            <span>提示词版本</span>
            <Tag color="blue">{currentVersion}</Tag>
          </Space>
        }
        extra={
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setShowViewModal(true)}
            >
              查看
            </Button>
            {safeVersions.length > 1 && (
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={handleViewDiff}
              >
                对比
              </Button>
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text strong style={{ fontSize: 12 }}>
              当前版本：
            </Text>
            <Select
              value={currentVersion}
              onChange={onVersionChange}
              style={{ width: '100%', marginTop: 4 }}
              size="small"
              options={safeVersions.map((v) => ({
                label: `${v.version} - ${v.changes} (${v.timestamp.split(' ')[1] || v.timestamp})`,
                value: v.version,
              }))}
            />
          </div>

          {currentVersionData && (
            <Alert
              message={currentVersionData.changes}
              type="info"
              showIcon
              style={{ fontSize: 11 }}
            />
          )}
        </Space>
      </Card>

      {/* 版本对比Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            <span>版本对比</span>
          </Space>
        }
        open={showDiffModal}
        onCancel={() => setShowDiffModal(false)}
        width="90vw"
        footer={null}
        style={{ top: 20 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Text>对比版本：</Text>
            <Select
              value={compareVersion}
              onChange={setCompareVersion}
              style={{ width: 200 }}
              options={safeVersions
                .filter((v) => v.version !== currentVersion)
                .map((v) => ({
                  label: `${v.version} - ${v.changes}`,
                  value: v.version,
                }))}
            />
            <Text type="secondary">→</Text>
            <Tag color="blue">{currentVersion}</Tag>
            <Text type="secondary">{currentVersionData?.changes}</Text>
          </Space>

          {currentVersionData && (
            <Alert
              message={`主要改动：${currentVersionData.changes}`}
              type="info"
              showIcon
            />
          )}

          {/* 行级差异对比 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {(() => {
              const oldContent = getPromptContent(compareVersion)
              const newContent = getCurrentPrompt()
              const diff = computeDiff(oldContent, newContent)

              return (
                <>
                  {/* 旧版本 */}
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span>{`${compareVersion} (旧版本)`}</span>
                        <Tag color="red">删除</Tag>
                        <Tag color="orange">修改</Tag>
                      </Space>
                    }
                    style={{ background: '#fff7e6' }}
                  >
                    <div
                      style={{
                        background: '#fff',
                        padding: 12,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        fontSize: 12,
                        lineHeight: '1.8',
                        fontFamily: 'monospace',
                      }}
                    >
                      {diff.map((item, idx) => {
                        if (item.type === 'insert') return null
                        return (
                          <div
                            key={idx}
                            style={{
                              background:
                                item.type === 'delete'
                                  ? '#ffebee'
                                  : item.type === 'replace'
                                  ? '#fff3e0'
                                  : 'transparent',
                              padding: '2px 4px',
                              borderLeft:
                                item.type === 'delete'
                                  ? '3px solid #f44336'
                                  : item.type === 'replace'
                                  ? '3px solid #ff9800'
                                  : '3px solid transparent',
                              textDecoration: item.type === 'delete' ? 'line-through' : 'none',
                              opacity: item.type === 'delete' ? 0.7 : 1,
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{ marginRight: 8, fontSize: 10, minWidth: 30, display: 'inline-block' }}
                            >
                              {item.oldIndex !== undefined ? item.oldIndex + 1 : ''}
                            </Text>
                            <span>{item.oldLine || item.newLine || ' '}</span>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* 新版本 */}
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span>{`${currentVersion} (当前版本)`}</span>
                        <Tag color="green">新增</Tag>
                        <Tag color="orange">修改</Tag>
                      </Space>
                    }
                    style={{ background: '#f0f5ff' }}
                  >
                    <div
                      style={{
                        background: '#fff',
                        padding: 12,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        fontSize: 12,
                        lineHeight: '1.8',
                        fontFamily: 'monospace',
                      }}
                    >
                      {diff.map((item, idx) => {
                        if (item.type === 'delete') return null
                        return (
                          <div
                            key={idx}
                            style={{
                              background:
                                item.type === 'insert'
                                  ? '#e8f5e9'
                                  : item.type === 'replace'
                                  ? '#fff3e0'
                                  : 'transparent',
                              padding: '2px 4px',
                              borderLeft:
                                item.type === 'insert'
                                  ? '3px solid #4caf50'
                                  : item.type === 'replace'
                                  ? '3px solid #ff9800'
                                  : '3px solid transparent',
                              fontWeight: item.type === 'insert' ? 500 : 'normal',
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{ marginRight: 8, fontSize: 10, minWidth: 30, display: 'inline-block' }}
                            >
                              {item.newIndex !== undefined ? item.newIndex + 1 : ''}
                            </Text>
                            <span>{item.newLine || item.oldLine || ' '}</span>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </>
              )
            })()}
          </div>
        </Space>
      </Modal>

      {/* 编辑/查看提示词Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>编辑提示词</span>
            <Tag color="blue">{currentVersion}</Tag>
          </Space>
        }
        open={showViewModal}
        onCancel={() => {
          setShowViewModal(false)
          setEditedPrompt('')
          setVersionChanges('')
        }}
        width="900px"
        footer={
          <Space>
            <Button
              onClick={() => {
                setShowViewModal(false)
                setEditedPrompt('')
                setVersionChanges('')
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => {
                if (!editedPrompt.trim()) {
                  message.warning('提示词内容不能为空')
                  return
                }
                if (!versionChanges.trim()) {
                  message.warning('请填写版本改动说明')
                  return
                }
                onSaveVersion(editedPrompt, versionChanges)
                setShowViewModal(false)
                setEditedPrompt('')
                setVersionChanges('')
                message.success('新版本已保存')
              }}
            >
              保存为新版本
            </Button>
          </Space>
        }
        style={{ top: 20 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {currentVersionData && (
            <Alert
              message={`基于 ${currentVersion} - ${currentVersionData.changes}`}
              description={`创建时间: ${currentVersionData.timestamp}`}
              type="info"
              showIcon
            />
          )}

          <div>
            <Text strong>提示词内容：</Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                const content = editedPrompt || getCurrentPrompt()
                navigator.clipboard.writeText(content)
                message.success('已复制到剪贴板')
              }}
              style={{ marginLeft: 8 }}
            >
              复制
            </Button>
            <Input.TextArea
              value={editedPrompt || getCurrentPrompt()}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="编辑提示词内容..."
              autoSize={{ minRows: 15, maxRows: 25 }}
              style={{
                marginTop: 8,
                fontSize: 12,
                lineHeight: '1.6',
                fontFamily: 'monospace',
              }}
              onFocus={(e) => {
                if (!editedPrompt) {
                  setEditedPrompt(getCurrentPrompt())
                }
              }}
            />
          </div>

          <div>
            <Text strong>版本改动说明：</Text>
            <Input
              value={versionChanges}
              onChange={(e) => setVersionChanges(e.target.value)}
              placeholder="例如：优化了回复逻辑，增强了响应准确性"
              style={{ marginTop: 8 }}
            />
          </div>

          <Alert
            message="提示"
            description="编辑后点击'保存为新版本'将自动创建新版本（V2, V3...）并切换到新版本"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    </>
  )
}
