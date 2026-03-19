import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * In-memory rate limiter. Use for serverless/edge-compatible rate limiting.
 * For production at scale, replace with Redis-backed (@upstash/ratelimit).
 */
export function rateLimit(opts: {
  /** Max requests in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
  /** Optional prefix to namespace keys */
  prefix?: string
}) {
  return {
    check(request: NextRequest): { success: boolean; remaining: number; resetAt: number } {
      cleanup()

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown'
      const key = `${opts.prefix || 'rl'}:${ip}`
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || now > entry.resetAt) {
        const resetAt = now + opts.windowSeconds * 1000
        store.set(key, { count: 1, resetAt })
        return { success: true, remaining: opts.limit - 1, resetAt }
      }

      entry.count++
      if (entry.count > opts.limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt }
      }

      return { success: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt }
    },
  }
}

/** Helper to return a 429 response */
export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    }
  )
}
