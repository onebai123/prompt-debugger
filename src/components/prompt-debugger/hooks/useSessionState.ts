/**
 * 会话状态管理Hook
 */

import { useState, useCallback, useEffect } from 'react'
import { TestSession, TestCase, EvaluationCriteria } from '../types'

const SESSIONS_STORAGE_KEY = 'batch_test_sessions'
const CURRENT_SESSION_KEY = 'batch_test_current_session'

/** 创建新会话 */
function createNewSession(name?: string): TestSession {
  return {
    id: `session_${Date.now()}`,
    name: name || `会话${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      testCasesText: '',
      testCases: [],
      evaluationCriteria: [],
      criteriaGenerated: false,
      generateCount: 10,
      concurrentCount: 5,
      testCaseLevel: 'p1_p2',
      openingStyle: 'mixed',
      criteriaScenario: 'phone_robot',
      progress: 0,
      promptVersions: [
        {
          version: 'V1',
          content: '',
          changes: '初始版本',
          timestamp: new Date().toLocaleString('zh-CN'),
        },
      ],
      currentVersion: 'V1',
    },
  }
}

export function useSessionState() {
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')

  // 初始化：从localStorage加载会话
  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY)
    const savedCurrentId = localStorage.getItem(CURRENT_SESSION_KEY)

    if (savedSessions) {
      const parsed = JSON.parse(savedSessions)
      setSessions(parsed)
      if (savedCurrentId && parsed.some((s: TestSession) => s.id === savedCurrentId)) {
        setCurrentSessionId(savedCurrentId)
      } else if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id)
      }
    } else {
      // 创建默认会话
      const defaultSession = createNewSession('默认会话')
      setSessions([defaultSession])
      setCurrentSessionId(defaultSession.id)
    }
  }, [])

  // 保存到localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
    }
    if (currentSessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId)
    }
  }, [sessions, currentSessionId])

  // 获取当前会话
  const getCurrentSession = useCallback((): TestSession | undefined => {
    return sessions.find((s) => s.id === currentSessionId)
  }, [sessions, currentSessionId])

  // 创建会话
  const createSession = useCallback((name?: string) => {
    const newSession = createNewSession(name)
    setSessions((prev) => [...prev, newSession])
    setCurrentSessionId(newSession.id)
    return newSession
  }, [])

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
  }, [])

  // 更新当前会话数据
  const updateCurrentSession = useCallback(
    (updates: Partial<TestSession['data']>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                data: { ...s.data, ...updates },
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      )
    },
    [currentSessionId]
  )

  // 重命名会话
  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, name: newName, updatedAt: new Date().toISOString() }
          : s
      )
    )
  }, [])

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId)
      // 如果删除的是当前会话，切换到第一个
      if (sessionId === currentSessionId && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id)
      }
      return filtered
    })
  }, [currentSessionId])

  // 复制会话
  const duplicateSession = useCallback((sessionId: string) => {
    const original = sessions.find((s) => s.id === sessionId)
    if (original) {
      const newSession = {
        ...original,
        id: `session_${Date.now()}`,
        name: `${original.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSessions((prev) => [...prev, newSession])
      setCurrentSessionId(newSession.id)
    }
  }, [sessions])

  return {
    sessions,
    currentSessionId,
    currentSession: getCurrentSession(),
    createSession,
    switchSession,
    updateCurrentSession,
    renameSession,
    deleteSession,
    duplicateSession,
  }
}
