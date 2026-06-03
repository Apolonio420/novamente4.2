/**
 * Meta Conversions API (CAPI) — server-side event tracking.
 *
 * Sends Purchase events directly from our server to Meta, complementing
 * the client-side Pixel. Critical for accurate attribution in 2026
 * (iOS Safari ITP + adblockers block 30-50% of client-side Pixel events).
 *
 * Dedup is via `event_id`: when Pixel browser-side and CAPI server-side
 * fire the same event_id, Meta deduplicates and reconstructs the funnel.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { createHash } from 'crypto'

const CAPI_VERSION = 'v18.0'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined
  return sha256(email.trim().toLowerCase())
}

function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  // Meta expects digits only (E.164 without '+'), hashed.
  const digits = phone.replace(/\D/g, '')
  if (!digits) return undefined
  return sha256(digits)
}

export interface CapiUserData {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  externalId?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbc?: string | null
  fbp?: string | null
}

export interface CapiPurchaseData {
  orderId: string // → event_id for Pixel/CAPI dedup
  value: number
  currency: string
  items?: Array<{ id?: string; quantity?: number; price?: number }>
  eventTime?: number // unix seconds; defaults to now
  actionSource?: 'website' | 'chat' | 'physical_store' | 'system_generated' | 'other'
  eventSourceUrl?: string
}

export interface CapiResult {
  ok: boolean
  status?: number
  body?: unknown
  error?: string
  skipped?: 'not_configured'
}

/**
 * Send a Purchase event to Meta CAPI.
 *
 * Credential resolution order:
 *   1. Explicit pixelId/accessToken args (per-tenant routing)
 *   2. META_PIXEL_ID / META_CAPI_ACCESS_TOKEN env vars (global Novamente)
 *
 * Returns `{ ok: false, skipped: 'not_configured' }` silently when creds
 * are missing — so misconfiguration doesn't block payment processing.
 */
export async function sendCapiPurchase(
  purchase: CapiPurchaseData,
  user: CapiUserData,
  opts?: { pixelId?: string; accessToken?: string; testEventCode?: string }
): Promise<CapiResult> {
  const pixelId =
    opts?.pixelId ||
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const accessToken = opts?.accessToken || process.env.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken || pixelId.startsWith('<')) {
    return { ok: false, skipped: 'not_configured' }
  }

  const userData: Record<string, unknown> = {}
  const em = normalizeEmail(user.email)
  if (em) userData.em = [em]
  const ph = normalizePhone(user.phone)
  if (ph) userData.ph = [ph]
  if (user.firstName) userData.fn = [sha256(user.firstName.trim().toLowerCase())]
  if (user.lastName) userData.ln = [sha256(user.lastName.trim().toLowerCase())]
  if (user.externalId) userData.external_id = [sha256(user.externalId.trim().toLowerCase())]
  if (user.clientIpAddress) userData.client_ip_address = user.clientIpAddress
  if (user.clientUserAgent) userData.client_user_agent = user.clientUserAgent
  if (user.fbc) userData.fbc = user.fbc
  if (user.fbp) userData.fbp = user.fbp

  const customData: Record<string, unknown> = {
    currency: purchase.currency,
    value: purchase.value,
  }
  if (purchase.items?.length) {
    customData.content_ids = purchase.items.map((i) => i.id).filter(Boolean)
    customData.content_type = 'product'
    customData.contents = purchase.items.map((i) => ({
      id: i.id,
      quantity: i.quantity ?? 1,
      item_price: i.price,
    }))
    customData.num_items = purchase.items.reduce((s, i) => s + (i.quantity ?? 1), 0)
  }

  const event = {
    event_name: 'Purchase',
    event_time: purchase.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: purchase.orderId, // dedup key for Pixel + CAPI
    action_source: purchase.actionSource ?? 'website',
    event_source_url: purchase.eventSourceUrl,
    user_data: userData,
    custom_data: customData,
  }

  const body: Record<string, unknown> = {
    data: [event],
    access_token: accessToken,
  }
  if (opts?.testEventCode) {
    body.test_event_code = opts.testEventCode
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${CAPI_VERSION}/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const responseBody = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        body: responseBody,
        error: `Meta CAPI ${res.status}: ${JSON.stringify(responseBody).slice(0, 300)}`,
      }
    }

    return { ok: true, status: res.status, body: responseBody }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
