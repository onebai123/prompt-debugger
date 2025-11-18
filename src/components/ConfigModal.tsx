'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, message, Tabs, Space } from 'antd'
import { SaveOutlined, ApiOutlined } from '@ant-design/icons'

interface ConfigModalProps {
  open: boolean
  onClose: () => void
}

export default function ConfigModal({ open, onClose }: ConfigModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const config = localStorage.getItem('prompt_debugger_config')
      if (config) {
        form.setFieldsValue(JSON.parse(config))
      }
    }
  }, [open, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      localStorage.setItem('prompt_debugger_config', JSON.stringify(values))
      
      message.success('配置已保存')
      onClose()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined />
          <span>配置</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          保存配置
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          apiBaseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          testModel: 'deepseek-v3',
          evalModel: 'gpt-4o',
        }}
      >
        <Tabs
          items={[
            {
              key: 'api',
              label: '🔗 API配置',
              children: (
                <>
                  <Form.Item
                    label="API Base URL"
                    name="apiBaseUrl"
                    rules={[{ required: true, message: '请输入API地址' }]}
                    extra="AI服务的API地址"
                  >
                    <Input placeholder="例如: https://api.openai.com/v1" />
                  </Form.Item>

                  <Form.Item
                    label="API Key"
                    name="apiKey"
                    rules={[{ required: true, message: '请输入API密钥' }]}
                    extra="你的API密钥"
                  >
                    <Input.Password placeholder="请输入你的API密钥" />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'models',
              label: '🤖 模型配置',
              children: (
                <>
                  <Form.Item
                    label="测试模型"
                    name="testModel"
                    rules={[{ required: true, message: '请输入测试模型' }]}
                    extra="用于执行实际测试的模型（运行提示词）"
                  >
                    <Input placeholder="例如: deepseek-v3, gpt-4o-mini" />
                  </Form.Item>

                  <Form.Item
                    label="评测模型"
                    name="evalModel"
                    rules={[{ required: true, message: '请输入评测模型' }]}
                    extra="用于评判、评分、优化的模型（更强大的模型）"
                  >
                    <Input placeholder="例如: gpt-4o, claude-sonnet-4 ,gemini-2.5-pro-nothinking" />
                  </Form.Item>

                  <div style={{ 
                    padding: '12px', 
                    background: '#f0f7ff', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#666',
                    marginTop: '16px'
                  }}>
                    <p style={{ margin: 0, marginBottom: '8px' }}>💡 <strong>模型选择建议：</strong></p>
                    <p style={{ margin: 0, marginBottom: '4px' }}>• <strong>测试模型</strong>: 你要测试的实际模型</p>
                    <p style={{ margin: 0 }}>• <strong>评测模型</strong>: 用更强大的模型进行评判，确保评测质量</p>
                  </div>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  )
}
