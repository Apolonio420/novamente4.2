'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)}ms (${metric.rating})`)
    }

    // Send to analytics endpoint in production
    if (process.env.NODE_ENV === 'production' && metric.rating !== 'good') {
      // Only report poor/needs-improvement metrics to reduce noise
      const body = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        page: window.location.pathname,
      }

      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/vitals',
          new Blob([JSON.stringify(body)], { type: 'application/json' }),
        )
      }
    }
  })

  return null
}
