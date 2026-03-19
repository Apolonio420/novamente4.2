import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGeminiClient } from '@/lib/gemini'
import { getTenantById } from './tenant'
import { getPublishedProducts } from './catalog'
import { PLAN_FEATURES } from './plans'
import type { Tenant, PartnerProduct, CommerceMode } from './types'

// Cast helper (same pattern as tenant.ts, catalog.ts)
const db = () => supabaseAdmin as any

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentConfig {
  enabled: boolean
  greeting: string
  personality: string
  tenantName: string
  tenantDescription: string | null
  productCount: number
  commerceMode: CommerceMode
}

export interface AgentSession {
  id: string
  tenant_id: string
  visitor_id: string | null
  status: 'active' | 'closed'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

// ---------------------------------------------------------------------------
// Agent Config
// ---------------------------------------------------------------------------

export async function getAgentConfig(tenantId: string): Promise<AgentConfig | null> {
  const tenant = await getTenantById(tenantId)
  if (!tenant) return null

  const features = PLAN_FEATURES[tenant.plan]
  const products = await getPublishedProducts(tenantId)

  return {
    enabled: features.chatbot,
    greeting: `Hola! Soy el asistente virtual de ${tenant.name}. En que puedo ayudarte?`,
    personality: 'friendly_sales',
    tenantName: tenant.name,
    tenantDescription: tenant.description,
    productCount: products.length,
    commerceMode: tenant.commerce_mode,
  }
}

// ---------------------------------------------------------------------------
// Build System Prompt
// ---------------------------------------------------------------------------

export async function buildAgentContext(tenantId: string): Promise<string> {
  const tenant = await getTenantById(tenantId)
  if (!tenant) throw new Error('Tenant not found')

  const products = await getPublishedProducts(tenantId)
  const catalogBlock = buildCatalogBlock(products, tenant.currency)
  const commerceInstructions = getCommerceInstructions(tenant.commerce_mode, tenant)

  return `Sos el asistente virtual de ventas de "${tenant.name}".
${tenant.tagline ? `Slogan: ${tenant.tagline}` : ''}
${tenant.description ? `Sobre la marca: ${tenant.description}` : ''}
${tenant.industry ? `Rubro: ${tenant.industry}` : ''}

## Tu personalidad
- Amigable, conciso y profesional
- Respondes siempre en espanol
- Usas un tono cercano pero no excesivamente informal
- Tus respuestas son cortas (maximo 3-4 oraciones por mensaje)

## Catalogo de productos
${catalogBlock || 'Esta marca aun no tiene productos publicados.'}

## Instrucciones de venta
${commerceInstructions}

## Reglas estrictas
- NUNCA inventes productos o precios que no estan en el catalogo
- NUNCA compartas informacion interna de la empresa
- Si no sabes algo, decilo honestamente y ofrece conectar con un humano
- Si el cliente pide algo fuera del catalogo, sugeri lo mas parecido disponible
- Mantene las respuestas breves y enfocadas
- Si el cliente muestra intencion de compra, guialo hacia la accion (${getCTADescription(tenant)})
`
}

function buildCatalogBlock(products: PartnerProduct[], currency: string): string {
  if (products.length === 0) return ''

  return products
    .map((p) => {
      const price = p.price != null
        ? new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency || 'ARS',
            minimumFractionDigits: 0,
          }).format(p.price)
        : 'Precio a consultar'

      const desc = p.description ? ` — ${p.description.slice(0, 100)}` : ''
      const category = p.category ? ` [${p.category}]` : ''

      return `- ${p.name}${category}: ${price}${desc}`
    })
    .join('\n')
}

function getCommerceInstructions(mode: CommerceMode, tenant: Tenant): string {
  const ctaText = getCTADescription(tenant)

  switch (mode) {
    case 'leads':
      return `Tu objetivo es captar datos del cliente (nombre, email, telefono). Cuando el cliente muestre interes, pedile sus datos para que el equipo lo contacte.`
    case 'quote':
      return `Tu objetivo es ayudar al cliente a armar un pedido/cotizacion. Pregunta que productos le interesan, cantidades, y luego sugeri que solicite una cotizacion formal.`
    case 'whatsapp':
      return `Tu objetivo es guiar al cliente a escribir por WhatsApp para cerrar la compra. ${ctaText}`
    case 'external':
      return `Tu objetivo es guiar al cliente hacia la tienda online de la marca. ${ctaText}`
    case 'checkout':
      return `Tu objetivo es ayudar al cliente a elegir productos y completar su compra en la tienda.`
    case 'sample':
      return `Tu objetivo es ayudar al cliente a solicitar muestras de productos. Pregunta que le interesa y guialo a pedirlas.`
    default:
      return `Tu objetivo es ayudar al cliente con sus consultas sobre productos y guiarlo hacia la compra.`
  }
}

function getCTADescription(tenant: Tenant): string {
  if (tenant.cta_url) return `Sugeri visitar: ${tenant.cta_url}`
  if (tenant.phone) return `Sugeri escribir por WhatsApp al ${tenant.phone}`
  return 'Sugeri que se ponga en contacto con la marca'
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createAgentSession(
  tenantId: string,
  visitorId?: string,
): Promise<AgentSession> {
  const { data, error } = await db()
    .from('agent_sessions')
    .insert({
      tenant_id: tenantId,
      visitor_id: visitorId || null,
    })
    .select()
    .single()

  if (error || !data) throw new Error('Failed to create agent session')
  return data as AgentSession
}

export async function getSessionMessages(sessionId: string): Promise<AgentMessage[]> {
  const { data, error } = await db()
    .from('agent_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data as AgentMessage[]
}

export async function getAgentSession(sessionId: string): Promise<AgentSession | null> {
  const { data, error } = await db()
    .from('agent_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) return null
  return data as AgentSession
}

export async function getTenantSessions(
  tenantId: string,
  status?: 'active' | 'closed',
): Promise<(AgentSession & { message_count: number })[]> {
  let query = db()
    .from('agent_sessions')
    .select('*, agent_messages(count)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error || !data) return []

  return (data as any[]).map((s) => ({
    ...s,
    message_count: s.agent_messages?.[0]?.count ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Process Message (AI Chat)
// ---------------------------------------------------------------------------

export async function processMessage(
  tenantId: string,
  sessionId: string,
  message: string,
): Promise<string> {
  // 1. Save user message
  await db().from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
  })

  // 2. Get conversation history
  const history = await getSessionMessages(sessionId)

  // 3. Build system prompt
  const systemPrompt = await buildAgentContext(tenantId)

  // 4. Build Gemini messages
  const geminiHistory = history
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }))

  // 5. Call Gemini
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })

  const chat = model.startChat({
    history: geminiHistory.slice(0, -1), // exclude the last user message (we send it as the new one)
  })

  const result = await chat.sendMessage(message)
  const response = result.response.text()

  // 6. Save assistant message
  await db().from('agent_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: response,
  })

  // 7. Update session timestamp
  await db()
    .from('agent_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  return response
}
