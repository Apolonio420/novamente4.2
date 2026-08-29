// Hallazgo de auditoría: el webhook de WhatsApp no validaba la firma
// X-Hub-Signature-256 de Meta — cualquiera que descubriera la URL podía
// inyectar mensajes falsos. Estos tests cubren los 3 caminos del fix:
// firma válida procesa, inválida rechaza con 401, y sin env var configurada
// procesa igual (fail-open) pero deja un warning ruidoso en consola.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

import { POST } from './route'

const APP_SECRET = 'test-app-secret'

// Body sin `entry[0].changes[0].value.messages[0]`: la ruta corta en
// "No Message" / 200 sin tocar Supabase, Gemini, ni el cliente de WhatsApp —
// justo lo que necesitamos para aislar la validación de firma del resto del
// pipeline (que ya tiene su propia cobertura / depende de servicios externos).
const HARMLESS_BODY = JSON.stringify({ entry: [{ changes: [{ value: {} }] }] })

function signatureFor(body: string, secret: string) {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`
}

function webhookRequest(body: string, signatureHeader?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (signatureHeader !== undefined) headers['x-hub-signature-256'] = signatureHeader
  return new NextRequest('http://localhost/api/webhooks/whatsapp', {
    method: 'POST',
    headers,
    body,
  })
}

describe('POST /api/webhooks/whatsapp — validación de firma X-Hub-Signature-256', () => {
  const originalSecret = process.env.META_APP_SECRET

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.META_APP_SECRET
    else process.env.META_APP_SECRET = originalSecret
  })

  it('firma válida (HMAC SHA-256 del body crudo con el App Secret): procesa normalmente', async () => {
    process.env.META_APP_SECRET = APP_SECRET
    const validSignature = signatureFor(HARMLESS_BODY, APP_SECRET)

    const res = await POST(webhookRequest(HARMLESS_BODY, validSignature))

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('No Message')
  })

  it('firma inválida: responde 401 sin procesar', async () => {
    process.env.META_APP_SECRET = APP_SECRET
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const badSignature = `sha256=${'0'.repeat(64)}`

    const res = await POST(webhookRequest(HARMLESS_BODY, badSignature))

    expect(res.status).toBe(401)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('firma ausente (header no enviado): responde 401', async () => {
    process.env.META_APP_SECRET = APP_SECRET
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(webhookRequest(HARMLESS_BODY))

    expect(res.status).toBe(401)
  })

  it('body alterado respecto al firmado (firma calculada sobre otro payload): responde 401', async () => {
    process.env.META_APP_SECRET = APP_SECRET
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Firma válida... pero para OTRO body. Simula un MITM/replay modificando el payload.
    const signatureForDifferentBody = signatureFor(JSON.stringify({ entry: [] }), APP_SECRET)

    const res = await POST(webhookRequest(HARMLESS_BODY, signatureForDifferentBody))

    expect(res.status).toBe(401)
  })

  it('sin META_APP_SECRET seteada: procesa igual (fail-open) pero deja warning ruidoso en consola', async () => {
    delete process.env.META_APP_SECRET
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(webhookRequest(HARMLESS_BODY))

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('No Message')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('META_APP_SECRET'))
  })
})
