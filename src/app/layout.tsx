import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prompt Debugger - AI提示词测试与优化工具',
  description: '系统化测试、评估和优化AI提示词，确保AI系统稳定性',
  keywords: ['AI', 'Prompt', 'Test', 'Debug', 'Optimize', 'ChatGPT', 'Gemini'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
