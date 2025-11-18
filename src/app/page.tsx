'use client'

import { useState } from 'react'
import { Button, ConfigProvider, theme, Input, Space } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import PromptDebuggerModal from '@/components/prompt-debugger/PromptDebuggerModal'
import ConfigModal from '@/components/ConfigModal'
import { SettingOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'

export default function Home() {
  const [showBatchTest, setShowBatchTest] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState('')

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative'
      }}>
        {/* 配置按钮 */}
        <Button
          icon={<SettingOutlined />}
          onClick={() => setShowConfig(true)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            width: '50px',
            height: '50px',
          }}
        />

        <div style={{ 
          textAlign: 'center', 
          color: 'white',
          marginBottom: '60px'
        }}>
          <h1 style={{ 
            fontSize: '72px', 
            marginBottom: '20px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🔍 Prompt Debugger
          </h1>
          <p style={{ 
            fontSize: '24px', 
            marginBottom: '10px',
            opacity: 0.95
          }}>
            AI提示词测试与优化工具
          </p>
          <p style={{ 
            fontSize: '16px',
            opacity: 0.85
          }}>
            系统化测试 • 智能评估 • 持续优化
          </p>
        </div>

        <div style={{ 
          width: '100%',
          maxWidth: '800px',
          marginBottom: '40px'
        }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Input.TextArea
              placeholder="(可选) 输入你的AI提示词，也可以在测试界面中输入..."
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{
                fontSize: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.95)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<ExperimentOutlined />}
                onClick={() => setShowBatchTest(true)}
                style={{ 
                  height: '60px',
                  fontSize: '18px',
                  padding: '0 40px',
                  borderRadius: '30px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                开始测试
              </Button>
            </div>
          </Space>
        </div>

        <div style={{ 
          color: 'white', 
          fontSize: '14px',
          opacity: 0.9,
          textAlign: 'center',
          maxWidth: '1000px'
        }}>
          {/* 流程图 */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '32px 24px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              fontSize: '15px',
              marginBottom: '24px'
            }}>
              {/* 第1步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  1. 输入提示词
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  编写或导入AI提示词
                </div>
              </div>

              {/* 第2步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧪</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  2. 生成测试用例
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  AI自动生成多样化测试场景
                </div>
              </div>

              {/* 第3步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  3. 执行测试
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  并发执行，实时查看进度
                </div>
              </div>

              {/* 第4步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  4. AI评分
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  五维度评分+改进建议
                </div>
              </div>

              {/* 第5步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  5. 智能优化
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  AI分析问题并优化提示词
                </div>
              </div>

              {/* 第6步 */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  6. 复测验证
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  验证优化效果，持续迭代
                </div>
              </div>
            </div>
            
            {/* 循环闭环提示 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '14px',
              padding: '16px 24px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              border: '2px dashed rgba(255,255,255,0.6)'
            }}>
              <span style={{ fontSize: '28px' }}>🔁</span>
              <div style={{ textAlign: 'left', lineHeight: '1.7' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '6px' }}>
                  持续优化闭环 · 反复迭代
                </div>
                <div style={{ fontSize: '13px', opacity: 0.95 }}>
                  通过多轮 <strong>测试→评分→优化→复测</strong>，不断提升提示词质量，直至达到 <strong>生产级别稳定可用标准</strong>
                </div>
              </div>
            </div>
          </div>
          
          <p style={{ fontSize: '13px', opacity: 0.85 }}>
            点击右上角 ⚙️ 配置 API 密钥后开始使用
          </p>
        </div>
      </div>

      {showBatchTest && (
        <PromptDebuggerModal
          open={showBatchTest}
          onClose={() => setShowBatchTest(false)}
          systemPrompt={initialPrompt}
          model="deepseek-v3"
          temperature={0.7}
          maxTokens={2048}
          botName="Assistant"
          productName="Application"
          language="zh"
        />
      )}

      {showConfig && (
        <ConfigModal
          open={showConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </ConfigProvider>
  )
}
