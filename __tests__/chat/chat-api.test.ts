/**
 * Tests for the /api/assistant/chat route — SSE streaming, rate limiting, validation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock publicChatStream to avoid hitting Gemini
const mockStream = vi.fn()
vi.mock('@/lib/rag/public-chat', () => ({
  publicChatStream: (...args: unknown[]) => mockStream(...args),
}))

// Mock rate limiter
const mockCheck = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({
    check: (req: unknown) => mockCheck(req),
  }),
  rateLimitResponse: (resetAt: number) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
      },
    )
  },
}))

function makeRequest(body: object, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/assistant/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) yield chunk
}

describe('POST /api/assistant/chat', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockCheck.mockReturnValue({ success: true, remaining: 19, resetAt: Date.now() + 60000 })
    mockStream.mockImplementation(() => fakeStream(['Hola', ', soy Nova!']))

    // Fresh import each test
    const mod = await import('@/app/api/assistant/chat/route')
    POST = mod.POST
  })

  it('returns SSE stream with correct content-type', async () => {
    const req = makeRequest({ query: 'Hola' }, { accept: 'text/event-stream' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('streams chunks as SSE data events', async () => {
    const req = makeRequest({ query: 'Hola' }, { accept: 'text/event-stream' })
    const res = await POST(req)
    const text = await res.text()

    // Should contain chunk events
    expect(text).toContain('"type":"chunk"')
    expect(text).toContain('"text":"Hola"')
    expect(text).toContain('"text":", soy Nova!"')
    // Should end with done event
    expect(text).toContain('"type":"done"')
  })

  it('returns JSON when Accept: application/json', async () => {
    const req = makeRequest({ query: 'Hola' }, { accept: 'application/json' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.text).toBe('Hola, soy Nova!')
  })

  it('returns 429 after rate limit exceeded', async () => {
    const resetAt = Date.now() + 30000
    mockCheck.mockReturnValue({ success: false, remaining: 0, resetAt })

    const req = makeRequest({ query: 'Hola' })
    const res = await POST(req)

    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toContain('Too many requests')
  })

  it('returns 400 for empty query', async () => {
    const req = makeRequest({ query: '' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('handles missing history gracefully (defaults to empty array)', async () => {
    const req = makeRequest({ query: 'Hola' }, { accept: 'application/json' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    // Verify publicChatStream was called with empty history
    expect(mockStream).toHaveBeenCalledWith('Hola', [], undefined)
  })

  it('returns 400 for completely invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: '{invalid json',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('passes history to publicChatStream when provided', async () => {
    const history = [
      { role: 'user' as const, text: 'Hola' },
      { role: 'model' as const, text: 'Hola! Soy Nova' },
    ]
    const req = makeRequest(
      { query: 'Que remeras tienen?', history },
      { accept: 'application/json' },
    )
    await POST(req)

    expect(mockStream).toHaveBeenCalledWith('Que remeras tienen?', history, undefined)
  })
})
