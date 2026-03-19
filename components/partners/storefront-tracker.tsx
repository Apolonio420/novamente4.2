'use client'

import { useEffect } from 'react'

interface StorefrontTrackerProps {
  tenantId: string
  event: string
  data?: Record<string, unknown>
}

export function StorefrontTracker({ tenantId, event, data }: StorefrontTrackerProps) {
  useEffect(() => {
    // Generate a simple visitor ID from sessionStorage
    let visitorId = sessionStorage.getItem('nv_visitor_id')
    if (!visitorId) {
      visitorId = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('nv_visitor_id', visitorId)
    }

    // Use sendBeacon for non-blocking tracking
    const payload = JSON.stringify({
      tenantId,
      event,
      data: { ...data, visitorId },
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/partners/track', payload)
    } else {
      fetch('/api/partners/track', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }
  }, [tenantId, event, data])

  return null
}
