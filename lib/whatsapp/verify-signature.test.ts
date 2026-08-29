import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'crypto'
import { verifyMetaWebhookSignature } from './verify-signature'

const SECRET = 'super-secret'
const BODY = JSON.stringify({ hello: 'world' })

function sign(body: string, secret: string) {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`
}

describe('verifyMetaWebhookSignature', () => {
  it('firma correcta con el secret correcto → ok', () => {
    const result = verifyMetaWebhookSignature(BODY, sign(BODY, SECRET), SECRET)
    expect(result).toEqual({ ok: true, reason: 'valid_signature' })
  })

  it('firma calculada con OTRO secret → mismatch', () => {
    const result = verifyMetaWebhookSignature(BODY, sign(BODY, 'wrong-secret'), SECRET)
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('firma calculada sobre OTRO body → mismatch', () => {
    const result = verifyMetaWebhookSignature(BODY, sign('{"different":"payload"}', SECRET), SECRET)
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('header ausente → missing_signature_header', () => {
    const result = verifyMetaWebhookSignature(BODY, null, SECRET)
    expect(result).toEqual({ ok: false, reason: 'missing_signature_header' })
  })

  it('header sin prefijo sha256= → malformed_signature_header', () => {
    const result = verifyMetaWebhookSignature(BODY, 'deadbeef', SECRET)
    expect(result).toEqual({ ok: false, reason: 'malformed_signature_header' })
  })

  it('header con hex inválido tras el prefijo → malformed_signature_header', () => {
    const result = verifyMetaWebhookSignature(BODY, 'sha256=not-hex-zzz', SECRET)
    expect(result).toEqual({ ok: false, reason: 'malformed_signature_header' })
  })

  it('largo de firma distinto al esperado (hex más corto) → mismatch sin tirar excepción', () => {
    const result = verifyMetaWebhookSignature(BODY, 'sha256=deadbeef', SECRET)
    expect(result).toEqual({ ok: false, reason: 'signature_mismatch' })
  })

  it('sin secret configurado → fail-open (ok=true) + console.error ruidoso', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = verifyMetaWebhookSignature(BODY, null, undefined)
    expect(result).toEqual({ ok: true, reason: 'no_secret_configured_fail_open' })
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('META_APP_SECRET'))
    errorSpy.mockRestore()
  })

  it('sin secret configurado, incluso con firma presente → sigue en fail-open', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = verifyMetaWebhookSignature(BODY, sign(BODY, SECRET), undefined)
    expect(result.ok).toBe(true)
    errorSpy.mockRestore()
  })
})
