/**
 * 会话管理侧边栏
 */

'use client'

import { useState } from 'react'
import { Card, List, Button, Input, Space, Popconfirm, Typography, Badge } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { TestSession } from '../types'

const { Text } = Typography

interface SessionManagerProps {
  sessions: TestSession[]
  currentSessionId: string
  currentPrompt: string
  onSwitch: (sessionId: string) => void
  onCreate: (name?: string) => void
  onRename: (sessionId: string, newName: string) => void
  onDelete: (sessionId: string) => void
  onDuplicate: (sessionId: string) => void
  onPromptChange: (prompt: string) => void
}

export default function SessionManager({
  sessions,
  currentSessionId,
  currentPrompt,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
  onPromptChange,
}: SessionManagerProps) {
  const [editingId, setEditingId] = useState<string>('')
  const [editName, setEditName] = useState('')

  const startEdit = (session: TestSession) => {
    setEditingId(session.id)
    setEditName(session.name)
  }

  const saveEdit = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim())
    }
    setEditingId('')
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditName('')
  }

  return (
    <Card
      title="会话管理"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onCreate()}
        >
          新建会话
        </Button>
      }
      style={{ height: '100%', overflow: 'auto' }}
      styles={{ body: { padding: '12px' } }}
    >
      {/* 提示词编辑区 */}
      <div style={{ marginBottom: '12px' }}>
        <Text strong style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
          当前提示词：
        </Text>
        <Input.TextArea
          value={currentPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="输入或编辑AI提示词..."
          autoSize={{ minRows: 4, maxRows: 10 }}
          style={{
            fontSize: '13px',
            lineHeight: '1.6',
          }}
        />
      </div>

      <List
        dataSource={sessions}
        size="small"
        renderItem={(session) => {
          const isActive = session.id === currentSessionId
          const isEditing = editingId === session.id
          const testCount = session.data.testCases.length
          const passedCount = session.data.testCases.filter((tc) => tc.passed).length

          return (
            <List.Item
              style={{
                padding: '8px',
                background: isActive ? '#e6f7ff' : 'transparent',
                border: isActive ? '1px solid #1890ff' : '1px solid #f0f0f0',
                borderRadius: '4px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
              onClick={() => !isEditing && onSwitch(session.id)}
            >
              <div style={{ width: '100%' }}>
                {isEditing ? (
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onPressEnter={saveEdit}
                      autoFocus
                    />
                    <Button size="small" icon={<CheckOutlined />} onClick={saveEdit} />
                    <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
                  </Space.Compact>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text strong={isActive}>{session.name}</Text>
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(session)
                          }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          title="克隆会话"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicate(session.id)
                          }}
                        />
                        {!isActive && (
                          <Popconfirm
                            title="确认删除此会话？"
                            onConfirm={(e) => {
                              e?.stopPropagation()
                              onDelete(session.id)
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      <Space split="|" size={4}>
                        <span>
                          用例: {testCount > 0 && (
                            <Badge
                              count={passedCount}
                              showZero
                              style={{ backgroundColor: '#52c41a', marginLeft: 4 }}
                            />
                          )}
                          <Badge
                            count={testCount}
                            showZero
                            style={{ backgroundColor: '#1890ff', marginLeft: 4 }}
                          />
                        </span>
                        <span>
                          {new Date(session.updatedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </Space>
                    </div>
                  </>
                )}
              </div>
            </List.Item>
          )
        }}
      />
    </Card>
  )
}
