// Valida la firma X-Hub-Signature-256 que Meta manda en cada POST del webhook
// de WhatsApp Cloud API (HMAC SHA-256 del body CRUDO con el App Secret).
// Hallazgo de auditoría: el webhook no validaba firma → cualquiera que
// descubriera la URL podía inyectar mensajes falsos.
//
// Comportamiento intencional:
// - META_APP_SECRET seteada + firma inválida/ausente/malformada → rechaza (fail-closed).
// - META_APP_SECRET seteada + firma válida → acepta.
// - META_APP_SECRET NO seteada → acepta igual pero con console.error ruidoso
//   (fail-open). Esto es a propósito: si el fix se deployara ANTES de cargar
//   la env var en Vercel, fail-closed tumbaría el webhook entero en producción.
//   El warning es la señal de que falta cargar la env var.
import { createHmac, timingSafeEqual } from 'crypto'

const SIGNATURE_PREFIX = 'sha256='

export type SignatureVerification =
  | { ok: true; reason: 'valid_signature' | 'no_secret_configured_fail_open' }
  | { ok: false; reason: 'missing_signature_header' | 'malformed_signature_header' | 'signature_mismatch' }

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined
): SignatureVerification {
  if (!appSecret) {
    console.error(
      '⚠️⚠️⚠️ META_APP_SECRET no está seteada — el webhook de WhatsApp está aceptando requests SIN validar la firma de Meta (fail-open). ' +
        'Cargar META_APP_SECRET (App Secret de la app de Meta) en las env vars ANTES de que esto quede expuesto en producción sin monitoreo.'
    )
    return { ok: true, reason: 'no_secret_configured_fail_open' }
  }

  if (!signatureHeader) {
    return { ok: false, reason: 'missing_signature_header' }
  }

  if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return { ok: false, reason: 'malformed_signature_header' }
  }

  const expectedHex = signatureHeader.slice(SIGNATURE_PREFIX.length)
  if (!/^[0-9a-f]+$/i.test(expectedHex)) {
    return { ok: false, reason: 'malformed_signature_header' }
  }

  const computedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')

  const expectedBuf = Buffer.from(expectedHex, 'hex')
  const computedBuf = Buffer.from(computedHex, 'hex')

  // timingSafeEqual exige buffers del mismo largo — un largo distinto ya es
  // mismatch, pero lo cortamos ANTES de invocarla para no tirar excepción.
  if (expectedBuf.length !== computedBuf.length) {
    return { ok: false, reason: 'signature_mismatch' }
  }

  return timingSafeEqual(expectedBuf, computedBuf)
    ? { ok: true, reason: 'valid_signature' }
    : { ok: false, reason: 'signature_mismatch' }
}
