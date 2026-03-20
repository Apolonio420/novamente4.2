import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { chatStream, getSources } from '@/lib/rag/chat'
import type { ChatMessage } from '@/lib/rag/chat'
import { indexAllSources, isIndexed } from '@/lib/rag/indexer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
    // 1. Try Authorization header
    const authHeader = request.headers.get('authorization')
    let token: string | null = authHeader?.replace('Bearer ', '') ?? null

    // 2. Fallback: Supabase session cookie (sb-<ref>-auth-token)
    if (!token) {
        for (const cookie of request.cookies.getAll()) {
            if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
                try {
                    const parsed = JSON.parse(cookie.value)
                    token = Array.isArray(parsed) ? parsed[0] : parsed
                } catch {
                    token = cookie.value
                }
                break
            }
        }
    }

    if (!token) return null

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return null

    return data.user.id
}

const ChatSchema = z.object({
    query: z.string().min(1).max(2000),
    persona: z.literal('partner'),
    history: z
        .array(
            z.object({
                role: z.enum(['user', 'model']),
                text: z.string().max(4000),
            }),
        )
        .max(20)
        .optional()
        .default([]),
    imageUrls: z.array(z.string().url()).max(3).optional(),
})

let _indexing: Promise<void> | null = null

async function ensureIndexed(): Promise<void> {
    if (isIndexed()) return

    if (!_indexing) {
        _indexing = indexAllSources()
            .then(result => {
                if (result.errors.length > 0) {
                    console.error('[RAG] Index errors:', result.errors)
                }
                console.log(
                    `[RAG] Indexed ${result.totalChunks} chunks from ${result.totalSources - result.skippedSources.length} sources`,
                )
            })
            .catch(err => {
                console.error('[RAG] Index failed:', err)
                _indexing = null
            })
    }

    await _indexing
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const userId = await getAuthenticatedUserId(request)
        if (!userId) {
            return NextResponse.json(
                { error: 'No autenticado. Ingresa a tu cuenta para usar el asistente.' },
                { status: 401 },
            )
        }

        // Parse + validate body
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { error: 'El cuerpo de la solicitud no es JSON valido.' },
                { status: 400 },
            )
        }

        const parsed = ChatSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: 'Solicitud invalida.',
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            )
        }

        const { query, persona, imageUrls } = parsed.data
        const history = parsed.data.history as ChatMessage[]

        // Lazy index
        await ensureIndexed()

        const acceptHeader = request.headers.get('accept') ?? ''
        const wantsSSE = !acceptHeader.includes('application/json')

        // SSE streaming response
        if (wantsSSE) {
            const encoder = new TextEncoder()

            const stream = new ReadableStream({
                async start(controller) {
                    function send(data: object) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                        )
                    }

                    try {
                        for await (const chunk of chatStream(query, persona, history, imageUrls)) {
                            send({ type: 'chunk', text: chunk })
                        }

                        const sources = await getSources(query, persona)
                        send({
                            type: 'sources',
                            sources: sources.map(s => ({
                                source: s.document.metadata.source,
                                category: s.document.metadata.category,
                                title: s.document.metadata.title,
                                score: Math.round(s.score * 100) / 100,
                            })),
                        })

                        send({ type: 'done' })
                    } catch (err) {
                        const msg =
                            err instanceof Error ? err.message : 'Error desconocido'
                        console.error('[RAG chat] Stream error:', msg)
                        send({
                            type: 'error',
                            error: 'Ocurrio un error al procesar tu consulta. Intenta de nuevo.',
                        })
                    } finally {
                        controller.close()
                    }
                },
            })

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                    'X-Accel-Buffering': 'no',
                },
            })
        }

        // JSON (non-streaming) response
        let fullText = ''
        for await (const chunk of chatStream(query, persona, history, imageUrls)) {
            fullText += chunk
        }

        const sources = await getSources(query, persona)

        return NextResponse.json({
            text: fullText,
            sources: sources.map(s => ({
                source: s.document.metadata.source,
                category: s.document.metadata.category,
                title: s.document.metadata.title,
                score: Math.round(s.score * 100) / 100,
            })),
        })
    } catch (err) {
        console.error('[RAG chat] Unexpected error:', err)
        return NextResponse.json(
            {
                error: 'Ocurrio un error inesperado. Si el problema persiste, contacta soporte en soporte@novamente.ar',
            },
            { status: 500 },
        )
    }
}
