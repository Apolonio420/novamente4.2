/**
 * RAG Chat — Novamente Public Assistant ("Nova")
 *
 * Public-facing sales assistant that can answer questions, trigger design
 * generation, mockup creation, and cart actions via structured [ACTION:...] tags.
 */

import { readFileSync } from 'fs'
import path from 'path'
import { chunkMarkdown } from './chunker'
import { embedDocuments, embedQuery } from './embeddings'
import { InMemoryVectorStore } from './vector-store'
import type { VectorDocument, SearchResult } from './vector-store'
import { buildProductListForPrompt, buildShippingForPrompt, SIZES } from '@/lib/catalog'

const CHAT_MODEL = 'gemini-2.0-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const ROOT = process.cwd()

// Separate store for public docs (doesn't interfere with partner index)
let _publicStore: InMemoryVectorStore | null = null
let _indexing: Promise<void> | null = null

function getPublicStore(): InMemoryVectorStore {
    if (!_publicStore) _publicStore = new InMemoryVectorStore()
    return _publicStore
}

const PUBLIC_SOURCES = [
    { file: 'docs/public/PRODUCTS.md', category: 'products' },
    { file: 'docs/public/STYLES.md', category: 'styles' },
    { file: 'docs/public/SHIPPING.md', category: 'shipping' },
    { file: 'docs/public/FAQ.md', category: 'faq' },
    { file: 'docs/public/COMPANY.md', category: 'company' },
    { file: 'docs/public/PARTNERS.md', category: 'partners' },
]

export async function indexPublicSources(): Promise<number> {
    const store = getPublicStore()
    if (store.size > 0) return store.size

    if (_indexing) {
        await _indexing
        return store.size
    }

    _indexing = (async () => {
        const docs: VectorDocument[] = []
        for (const src of PUBLIC_SOURCES) {
            try {
                const content = readFileSync(path.join(ROOT, src.file), 'utf-8')
                const chunks = chunkMarkdown(content, src.file)
                for (let i = 0; i < chunks.length; i++) {
                    docs.push({
                        id: `${src.file}::${i}`,
                        text: chunks[i].text,
                        embedding: [],
                        metadata: {
                            source: src.file,
                            category: src.category,
                            audience: 'public',
                            title: chunks[i].title,
                            chunkIndex: chunks[i].index,
                        },
                    })
                }
            } catch {
                console.warn(`[PublicRAG] Could not read ${src.file}`)
            }
        }

        if (docs.length > 0) {
            const embeddings = await embedDocuments(docs.map(d => d.text))
            for (let i = 0; i < docs.length; i++) docs[i].embedding = embeddings[i]
            store.addDocuments(docs)
        }
        console.log(`[PublicRAG] Indexed ${docs.length} chunks from ${PUBLIC_SOURCES.length} sources`)
    })()

    await _indexing
    return store.size
}

export function isPublicIndexed(): boolean {
    return getPublicStore().size > 0
}

async function searchPublic(query: string, topK = 6): Promise<SearchResult[]> {
    const embedding = await embedQuery(query)
    return getPublicStore().search(embedding, { topK, minScore: 0.25 })
}

const SYSTEM_PROMPT = `Sos Nova, el asistente de Novamente. Ayudas a clientes a disenar y comprar ropa personalizada con IA.

QUIEN SOS:
- Representas a Novamente, la primera marca argentina de indumentaria personalizada con inteligencia artificial.
- Sos amigable, entusiasta pero no invasivo. Hablas en espanol argentino.
- Conoces todo sobre los productos, estilos, precios, envios, DTG, y el programa de partners.

QUE PODES HACER:
- Responder preguntas sobre productos, precios, envios, calidad, talles, estilos artisticos, etc.
- Generar disenos con IA cuando el cliente lo pida
- Crear mockups mostrando el diseno en una prenda real
- Agregar productos al carrito
- Mostrar el catalogo de productos
- Mostrar los estilos artisticos disponibles
- Guiar al cliente hasta la compra

REGLAS:
- Responde SIEMPRE en espanol argentino.
- Se conciso. No mas de 3-4 oraciones por respuesta a menos que el cliente pida detalle.
- Usa **negrita** para info clave (precios, productos, plazos).
- NO inventes precios, productos ni datos. Usa SOLO la info del contexto.
- Si no sabes algo, deci "No tengo esa info, pero podes escribirnos por WhatsApp al +5491126603080".
- Cuando el cliente muestre interes en comprar, guialo naturalmente al carrito.
- NO seas agresivo con la venta. Informar primero, vender despues.

ACCIONES (usa SOLO cuando corresponda):
Cuando necesites ejecutar una accion en la interfaz, agrega al final de tu respuesta en una linea separada:

[ACTION:GENERATE_DESIGN] descripcion del diseno | estilo (opcional)
  Ejemplo: [ACTION:GENERATE_DESIGN] leon geometrico minimalista | geometrico-abstracto
  Usar cuando: el cliente pide que le generes/crees/diseñes algo

[ACTION:SHOW_MOCKUP] url_del_diseno | tipo_prenda | color | lado | tamaño
  Ejemplo: [ACTION:SHOW_MOCKUP] https://r2.../design.png | aura-oversize-tshirt | black | front | R3
  Usar cuando: ya tenes un diseno y el cliente quiere verlo en una prenda

[ACTION:ADD_TO_CART] nombre | garmentType | color | talle | precio | mockupUrl
  Ejemplo: [ACTION:ADD_TO_CART] Aura Oversize Negra | aura-oversize-tshirt | black | M | 31000 | https://...mockup.png
  Usar cuando: el cliente confirma que quiere comprar un producto especifico

[ACTION:SHOW_CATALOG]
  Usar cuando: el cliente pide ver los productos disponibles

[ACTION:SHOW_STYLES]
  Usar cuando: el cliente pregunta por estilos o quiere ver las opciones artisticas

[ACTION:SHOW_PRICING]
  Usar cuando: el cliente pregunta cuanto sale, cuanto cuesta, precios, o quiere ver la lista de precios

[ACTION:CHECKOUT]
  Usar cuando: el cliente dice que quiere pagar o ir al checkout

IMPORTANTE sobre acciones:
- SOLO genera acciones cuando el cliente lo pide explicitamente o cuando es el paso natural.
- NUNCA agregues al carrito sin que el cliente confirme producto, talle y color.
- NUNCA generes un diseno sin que el cliente lo pida.
- Podes combinar texto + accion en la misma respuesta.

PRODUCTOS DISPONIBLES (precios en ARS):
${buildProductListForPrompt()}

TALLES: ${SIZES.join(', ')}
${buildShippingForPrompt()}`

export interface ChatMessage {
    role: 'user' | 'model'
    text: string
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        const mimeType = contentType.split(';')[0].trim()
        const buffer = await res.arrayBuffer()
        return { base64: Buffer.from(buffer).toString('base64'), mimeType }
    } catch {
        return null
    }
}

function buildContents(
    history: ChatMessage[],
    query: string,
    context: string,
    imageUrls?: string[],
    imageParts?: Array<{ base64: string; mimeType: string }>,
) {
    const systemContent = {
        role: 'user',
        parts: [{ text: `[CONTEXTO]\n${context}` }],
    }
    const systemAck = {
        role: 'model',
        parts: [{ text: 'Entendido. Uso ese contexto para responder.' }],
    }
    const historyContents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }))
    const userParts: object[] = [{ text: query }]
    if (imageParts) {
        for (const img of imageParts) {
            userParts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
        }
    }
    return [systemContent, systemAck, ...historyContents, { role: 'user', parts: userParts }]
}

export async function* publicChatStream(
    query: string,
    history: ChatMessage[] = [],
    imageUrls?: string[],
): AsyncGenerator<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    await indexPublicSources()

    const sources = await searchPublic(query)
    const context = sources.length > 0
        ? sources.map(s => s.document.text).join('\n\n---\n\n')
        : 'No hay info especifica en la base de conocimiento para esta consulta.'

    let imageParts: Array<{ base64: string; mimeType: string }> | undefined
    if (imageUrls && imageUrls.length > 0) {
        const results = await Promise.all(imageUrls.map(fetchImageAsBase64))
        imageParts = results.filter(Boolean) as Array<{ base64: string; mimeType: string }>
    }

    const contents = buildContents(history, query, context, imageUrls, imageParts)

    const url = `${GEMINI_BASE}/models/${CHAT_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
    })

    if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr || jsonStr === '[DONE]') continue
            try {
                const parsed = JSON.parse(jsonStr)
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) yield text
            } catch { /* skip malformed */ }
        }
    }

    // Yield sources metadata as final event
    if (sources.length > 0) {
        yield `\n[SOURCES:${JSON.stringify(sources.map(s => ({
            title: s.document.metadata.title || s.document.metadata.source,
            category: s.document.metadata.category,
            score: Math.round(s.score * 100) / 100,
        })))}]`
    }
}

// Parse action tags from assistant response
export interface AssistantAction {
    type: 'GENERATE_DESIGN' | 'SHOW_MOCKUP' | 'ADD_TO_CART' | 'SHOW_CATALOG' | 'SHOW_STYLES' | 'SHOW_PRICING' | 'CHECKOUT'
    params: string[]
}

export function parseActions(text: string): { cleanText: string; actions: AssistantAction[] } {
    const actions: AssistantAction[] = []
    const actionRegex = /\[ACTION:(\w+)\]\s*(.*)/g
    let match
    while ((match = actionRegex.exec(text)) !== null) {
        const type = match[1] as AssistantAction['type']
        const paramStr = match[2]?.trim() || ''
        actions.push({ type, params: paramStr ? paramStr.split('|').map(p => p.trim()) : [] })
    }
    const cleanText = text.replace(/\[ACTION:\w+\]\s*.*/g, '').trim()
    return { cleanText, actions }
}
