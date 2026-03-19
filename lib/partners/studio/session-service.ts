import { authFetch } from '@/lib/partners/auth-fetch'
import type { StudioMessage, StudioSession } from './types'

export interface SessionSummary {
  id: string
  title: string | null
  selectedStyle: string | null
  selectedGarment: string | null
  messageCount: number
  lastImageUrl: string | null
  createdAt: string
  updatedAt: string
}

const API_BASE = '/api/partners/design/sessions'

function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = 120_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return authFetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export async function fetchStudioSessions(): Promise<SessionSummary[]> {
  const res = await authFetch(API_BASE)
  if (!res.ok) return []
  const data = await res.json()
  return data.sessions || []
}

export async function fetchSessionMessages(sessionId: string): Promise<StudioMessage[]> {
  const res = await authFetch(`${API_BASE}/${sessionId}/messages`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.messages || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content || '',
    imageUrl: m.image_url,
    attachedImageUrl: m.attached_image_url,
    type: m.type || 'text',
    styleApplied: m.style_applied,
    styleName: m.style_name,
    promptUsed: m.prompt_used,
    garmentKey: m.garment_key,
    moderationStatus: m.moderation_status,
    error: m.error,
    timestamp: new Date(m.created_at).getTime(),
  }))
}

export async function createStudioSession(
  title?: string,
  style?: string,
  garment?: string,
): Promise<{ id: string }> {
  const res = await authFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, selectedStyle: style, selectedGarment: garment }),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function saveStudioMessage(
  sessionId: string,
  msg: Partial<StudioMessage>,
): Promise<void> {
  await authFetch(`${API_BASE}/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: msg.role,
      content: msg.content || '',
      image_url: msg.imageUrl,
      attached_image_url: msg.attachedImageUrl,
      type: msg.type || 'text',
      style_applied: msg.styleApplied,
      style_name: msg.styleName,
      prompt_used: msg.promptUsed,
      garment_key: msg.garmentKey,
      moderation_status: msg.moderationStatus,
      error: msg.error,
    }),
  })
}

export async function deleteStudioSession(sessionId: string): Promise<void> {
  await authFetch(`${API_BASE}/${sessionId}`, { method: 'DELETE' })
}

/**
 * Generate a design via the partner design API.
 */
export async function generateDesign(body: {
  prompt: string
  style?: string
  garmentColor?: string
  garmentType?: string
  sessionId?: string
}): Promise<any> {
  const res = await fetchWithTimeout('/api/partners/design/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

/**
 * Generate a mockup via the partner mockup API.
 */
export async function generateMockup(body: {
  designImageUrl: string
  garmentType: string
  garmentColor?: string
  side?: string
  sessionId?: string
}): Promise<any> {
  const res = await fetchWithTimeout('/api/partners/design/mockup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

/**
 * Get usage stats for the current tenant.
 */
export async function fetchUsageStats(): Promise<any> {
  const res = await authFetch('/api/partners/design/usage')
  if (!res.ok) return null
  return res.json()
}

/**
 * Publish an asset to a storefront slot.
 */
export async function publishToStorefront(body: {
  assetUrl: string
  slot: 'hero' | 'banner' | 'product_image'
  productId?: string
}): Promise<any> {
  const res = await authFetch('/api/partners/design/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}
