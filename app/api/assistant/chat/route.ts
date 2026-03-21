import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { publicChatStream, type ChatMessage } from '@/lib/rag/public-chat'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const limiter = rateLimit({ limit: 20, windowSeconds: 60, prefix: 'pub-chat' })

const messageSchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string().max(4000),
})

const bodySchema = z.object({
    query: z.string().min(1).max(2000),
    history: z.array(messageSchema).max(20).optional().default([]),
    imageUrls: z.array(z.string().url()).max(3).optional(),
})

export async function POST(req: NextRequest) {
    const { success, resetAt } = limiter.check(req)
    if (!success) return rateLimitResponse(resetAt)

    let body: z.infer<typeof bodySchema>
    try {
        const raw = await req.json()
        body = bodySchema.parse(raw)
    } catch (err) {
        const msg = err instanceof z.ZodError ? err.errors.map(e => e.message).join(', ') : 'Invalid request'
        return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { query, history, imageUrls } = body
    const accept = req.headers.get('accept') || ''
    const wantsJSON = accept.includes('application/json') && !accept.includes('text/event-stream')

    try {
        const stream = publicChatStream(query, history as ChatMessage[], imageUrls)

        if (wantsJSON) {
            let fullText = ''
            for await (const chunk of stream) fullText += chunk
            return NextResponse.json({ text: fullText })
        }

        // SSE streaming
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        // Check for sources metadata
                        if (chunk.startsWith('\n[SOURCES:')) {
                            const sourcesJson = chunk.slice('\n[SOURCES:'.length, -1)
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: JSON.parse(sourcesJson) })}\n\n`))
                            continue
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`))
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Error desconocido'
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`))
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error interno'
        console.error('[PublicAssistant] Error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
