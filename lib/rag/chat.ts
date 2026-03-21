/**
 * RAG Chat — Novamente Partner Assistant
 *
 * Handles vector search + Gemini streaming chat for the partner persona.
 * Supports both SSE streaming and JSON (non-streaming) modes.
 */

import { embedQuery } from './embeddings'
import { getVectorStore } from './vector-store'
import type { SearchResult } from './vector-store'

export type BotPersona = 'partner'

const CHAT_MODEL = 'gemini-2.0-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set. Required for RAG chat.')
    }
    return apiKey
}

const SYSTEM_PROMPTS: Record<BotPersona, string> = {
    partner: `Sos el asistente virtual del Workspace de Novamente. Ayudas a los partners a usar la plataforma.

REGLAS:
- Responde siempre en espanol argentino, tono amigable y profesional.
- Solo podes responder sobre: el workspace, catalogo de productos, design engine, leads, pedidos, branding, analytics, planes, billing, soporte tecnico.
- Si el partner reporta un problema tecnico, recopila toda la info posible: que paso, que pagina, que estaba haciendo, si tiene screenshot.
- Si el partner adjunta una imagen, analizala y responde en contexto. Puede ser un screenshot de un error, un logo, un diseño, o cualquier imagen relevante. Describi lo que ves y como se relaciona con su consulta.
- Si no sabes la respuesta, deci "No tengo esa info. Contacta soporte en soporte@novamente.ar o usa el sistema de tickets en /workspace/support"
- Usa **negrita** para info importante.
- Cuando menciones una pagina del workspace, linkea a ella.

LINKS VALIDOS (SOLO estos):
/workspace (dashboard), /workspace/catalog (catalogo), /workspace/design-engine (studio),
/workspace/leads (leads), /workspace/orders (pedidos), /workspace/branding (branding),
/workspace/analytics (analytics), /workspace/chatbot (chatbot), /workspace/billing (billing),
/workspace/settings (configuracion), /workspace/support (soporte)
Formato: [Texto](/ruta). Ejemplo: "Anda a [Catalogo](/workspace/catalog) para agregar productos."
PROHIBIDO links a archivos internos, docs/, scripts/, etc.

SUPER ACCIONES:
Si el partner pide algo que requiere cambios en el codigo de su storefront (editar la pagina, cambiar algo tecnico, generar catalogo completo automaticamente), responde normalmente pero agrega al final de tu respuesta en una linea separada:
[SUPER_ACTION:tipo] descripcion corta
Tipos validos: storefront_edit, catalog_generation, bug_fix, custom
Ejemplo: [SUPER_ACTION:storefront_edit] Cambiar imagen hero del storefront
Solo agrega esto si REALMENTE requiere intervencion tecnica, no para cosas que el partner puede hacer solo desde el workspace.`,
}

export interface ChatMessage {
    role: 'user' | 'model'
    text: string
}

/** Fetch an image URL and return base64 + detected MIME type */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        const mimeType = contentType.split(';')[0].trim()
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return { base64, mimeType }
    } catch (err) {
        console.error(`[RAG] Failed to fetch image: ${url}`, err)
        return null
    }
}

async function buildContents(
    history: ChatMessage[],
    query: string,
    context: string,
    imageUrls?: string[],
): Promise<object[]> {
    const systemContent = {
        role: 'user',
        parts: [{ text: `[CONTEXTO DE LA BASE DE CONOCIMIENTO]\n${context}` }],
    }
    const systemAck = {
        role: 'model',
        parts: [{ text: 'Entendido. Voy a usar ese contexto para responder.' }],
    }

    const historyContents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }))

    const userParts: object[] = [{ text: query }]
    if (imageUrls && imageUrls.length > 0) {
        const imageResults = await Promise.all(imageUrls.map(fetchImageAsBase64))
        for (const img of imageResults) {
            if (img) {
                userParts.push({
                    inlineData: { mimeType: img.mimeType, data: img.base64 },
                })
            }
        }
    }

    const userTurn = { role: 'user', parts: userParts }

    return [systemContent, systemAck, ...historyContents, userTurn]
}

export async function getSources(
    query: string,
    persona: BotPersona = 'partner',
    options: { topK?: number; minScore?: number } = {},
): Promise<SearchResult[]> {
    const { topK = 6, minScore = 0.25 } = options
    const queryEmbedding = await embedQuery(query)
    const store = getVectorStore()
    return store.search(queryEmbedding, {
        topK,
        audience: persona,
        minScore,
    })
}

export async function* chatStream(
    query: string,
    persona: BotPersona = 'partner',
    history: ChatMessage[] = [],
    imageUrls?: string[],
): AsyncGenerator<string> {
    const apiKey = getApiKey()
    const systemPrompt = SYSTEM_PROMPTS[persona]

    const sources = await getSources(query, persona)
    const context =
        sources.length > 0
            ? sources.map(s => s.document.text).join('\n\n---\n\n')
            : 'No hay informacion especifica disponible para esta consulta en la base de conocimiento.'

    const contents = await buildContents(history, query, context, imageUrls)

    const url = `${GEMINI_BASE}/models/${CHAT_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
            },
        }),
    })

    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini API error (${res.status}): ${errorText.slice(0, 500)}`)
    }

    if (!res.body) {
        throw new Error('No response body from Gemini streaming API')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw || raw === '[DONE]') continue

            try {
                const parsed = JSON.parse(raw)
                const text =
                    parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
                if (text) {
                    yield text
                }
            } catch {
                // malformed SSE line — skip
            }
        }
    }
}

export async function chat(
    query: string,
    persona: BotPersona = 'partner',
    history: ChatMessage[] = [],
    imageUrls?: string[],
): Promise<{ text: string; sources: SearchResult[] }> {
    const sources = await getSources(query, persona)

    let fullText = ''
    for await (const chunk of chatStream(query, persona, history, imageUrls)) {
        fullText += chunk
    }

    return { text: fullText, sources }
}

/**
 * Parse SSE stream from ReadableStream into async chunks.
 * Useful on the client side to consume the chat route's SSE response.
 */
export async function* parseSSEStream(
    stream: ReadableStream<Uint8Array>,
): AsyncGenerator<{ type: string; [key: string]: unknown }> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw || raw === '[DONE]') continue

            try {
                yield JSON.parse(raw)
            } catch {
                // skip malformed
            }
        }
    }
}
