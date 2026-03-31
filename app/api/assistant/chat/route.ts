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
    role: z.enum(['visitor', 'partner', 'admin']).optional(),
    pageContext: z.object({
        pathname: z.string(),
        pageType: z.string(),
        storefrontSlug: z.string().optional(),
        productSlug: z.string().optional(),
        workspaceSection: z.string().optional(),
    }).optional(),
    tenantSlug: z.string().optional(),
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

    const { query, history, imageUrls, role, pageContext, tenantSlug } = body
    const accept = req.headers.get('accept') || ''
    const wantsJSON = accept.includes('application/json') && !accept.includes('text/event-stream')

    // Enrich query with context for logged-in users
    let enrichedQuery = query
    if (role && role !== 'visitor') {
        const contextParts = [`[Rol: ${role}]`]
        if (tenantSlug) contextParts.push(`[Tenant: ${tenantSlug}]`)
        if (pageContext?.pathname) contextParts.push(`[Página: ${pageContext.pathname}]`)
        if (pageContext?.storefrontSlug) contextParts.push(`[Storefront: ${pageContext.storefrontSlug}]`)
        enrichedQuery = `${contextParts.join(' ')} ${query}`
    }

    try {
        const stream = publicChatStream(enrichedQuery, history as ChatMessage[], imageUrls)

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
