'use client'

import { useState, useEffect } from 'react'

export interface AssistantAuth {
  mode: 'visitor' | 'partner' | 'admin'
  email?: string
  tenantSlug?: string
  tenantId?: string
  tenantName?: string
  loading: boolean
}

const CACHE_KEY = 'nova-auth'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useAssistantAuth(): AssistantAuth {
  const [auth, setAuth] = useState<AssistantAuth>({ mode: 'visitor', loading: true })

  useEffect(() => {
    // Check cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setAuth({ ...data, loading: false })
          return
        }
      }
    } catch { /* ignore */ }

    fetch('/api/assistant/identify')
      .then(r => r.json())
      .then(data => {
        const result: AssistantAuth = {
          mode: data.role ?? 'visitor',
          email: data.email,
          tenantSlug: data.tenantSlug,
          tenantId: data.tenantId,
          tenantName: data.tenantName,
          loading: false,
        }
        setAuth(result)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }))
        } catch { /* ignore */ }
      })
      .catch(() => setAuth({ mode: 'visitor', loading: false }))
  }, [])

  return auth
}
