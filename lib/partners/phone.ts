/**
 * Normalizador de teléfono de partner — bug reportado (auditoría workspace
 * 08/10/2026): app/api/partners/settings/route.ts guardaba `phone` tal cual
 * lo tipeara el partner, y la tienda pública construye el link de WhatsApp
 * con `tenant.phone.replace(/\D/g, '')` (app/p/[slug]/page.tsx ~604,
 * [product]/page.tsx ~157) — un celular argentino sin el "9" de WhatsApp, o
 * con el "15"/"0" de marcación local, genera un wa.me roto o que no cae en
 * el chat del partner.
 *
 * Reglas (Argentina, el caso mayoritario — hay partners en Uruguay y otros
 * países, por eso el fallback internacional):
 *  - El número nacional argentino (código de área + abonado) SIEMPRE tiene
 *    10 dígitos en total, sin importar si el área es de 2, 3 o 4 dígitos
 *    (CABA/GBA "11" + 8 dígitos, "221" La Plata + 7, "2920" + 6, etc.). Esa
 *    invariante es la que permite reconocer las formas sin tabla de áreas.
 *  - Formato de WhatsApp de destino: "549" + área + abonado (13 dígitos).
 *  - Formas de entrada aceptadas (todas se normalizan al formato de arriba):
 *      "54" + 10 dígitos (sin el 9)              → se inserta el 9
 *      "549" + 10 dígitos (ya correcto)          → se devuelve igual
 *      "0" + área + abonado (11 dígitos)         → se sacan el "0"
 *      "0" + área + "15" + abonado (13 dígitos)  → se saca "0" y el "15"
 *      área + abonado directo (10 dígitos)       → se antepone "549"
 *      "15" + abonado sin área (10 dígitos)      → se asume área "11"
 *        (CABA/GBA: es el uso más común de "15" sin código de área, y
 *        ningún código de área argentino arranca con "15")
 *  - Un número con "+" y código de país que NO es Argentina (ej. Uruguay
 *    +598) se acepta tal cual, sin tocar — hay partners en otros países.
 *  - `country` (tenants.country, ej. 'UY') es un desempate opcional: si el
 *    partner tiene el país cargado como no-AR, no se intenta la lógica
 *    argentina y se valida como internacional genérico aunque no haya "+".
 */

export interface PhoneNormalizationResult {
  ok: boolean
  /** Valor normalizado a guardar. `null` = el partner borró el teléfono. */
  value?: string | null
  /** Mensaje en español, solo cuando ok === false. */
  error?: string
}

const AR_LOCAL_LENGTH = 10 // código de área + abonado, SIEMPRE 10 dígitos en Argentina
const INVALID_MESSAGE =
  'Teléfono inválido: revisá el código de área y la cantidad de dígitos. Para números fuera de Argentina, escribilo con "+" y el código de país (ej. +598...).'

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Busca el separador "15" insertado después del código de área en un resto
 * de 12 dígitos ("área" + "15" + "abonado"). El área puede ser de 2, 3 o 4
 * dígitos — se prueba en ese orden (2 cubre la mayoría de los casos,
 * CABA/GBA) hasta encontrar "15" en la posición correspondiente.
 */
function stripAreaCode15(rest12: string): string | null {
  for (const areaLen of [2, 3, 4]) {
    if (rest12.slice(areaLen, areaLen + 2) === '15') {
      return rest12.slice(0, areaLen) + rest12.slice(areaLen + 2)
    }
  }
  return null
}

/** Intenta reconocer `digits` como un celular argentino y devuelve "549" + 10 dígitos, o null. */
function normalizeArgentina(digits: string): string | null {
  if (digits.startsWith('54')) {
    const afterCountry = digits.slice(2)
    if (afterCountry.startsWith('9') && afterCountry.length === 1 + AR_LOCAL_LENGTH) {
      return `54${afterCountry}` // ya viene en formato WhatsApp
    }
    if (afterCountry.length === AR_LOCAL_LENGTH) {
      return `549${afterCountry}` // le falta el 9
    }
    return null
  }

  if (digits.startsWith('0')) {
    const rest = digits.slice(1)
    if (rest.length === AR_LOCAL_LENGTH) {
      return `549${rest}` // "0" + área + abonado, sin "15"
    }
    if (rest.length === AR_LOCAL_LENGTH + 2) {
      const extracted = stripAreaCode15(rest)
      if (extracted) return `549${extracted}`
    }
    return null
  }

  // Área + "15" + abonado sin el "0" adelante (ej. "11 15 2345 6789"), la
  // forma más común de copiar un celular argentino.
  if (digits.length === AR_LOCAL_LENGTH + 2) {
    const extracted = stripAreaCode15(digits)
    if (extracted) return `549${extracted}`
    return null
  }

  if (digits.length === AR_LOCAL_LENGTH) {
    if (digits.startsWith('15')) {
      // Sin código de área: se asume CABA/GBA ("11"), el caso de uso real de
      // "15" sin área. Ningún código de área argentino empieza con "15".
      return `549` + '11' + digits.slice(2)
    }
    return `549${digits}` // área + abonado directo
  }

  return null
}

/**
 * Normaliza un teléfono de partner para guardar en `tenants.phone`.
 * `country` (opcional) es `tenants.country` tal cual lo manda el form de
 * Configuración (ej. 'AR', 'UY', 'CL'...) — un desempate para no forzar la
 * heurística argentina sobre un partner que ya declaró otro país.
 */
export function normalizePartnerPhone(
  raw: string | null | undefined,
  opts?: { country?: string | null },
): PhoneNormalizationResult {
  if (raw == null) return { ok: true, value: null }
  const trimmed = String(raw).trim()
  if (trimmed === '') return { ok: true, value: null }

  const hasPlus = trimmed.startsWith('+')
  const isNonArCountry = !!opts?.country && opts.country.toUpperCase() !== 'AR'

  if (hasPlus) {
    const digits = onlyDigits(trimmed)
    if (digits.startsWith('54')) {
      const ar = normalizeArgentina(digits)
      if (ar) return { ok: true, value: ar }
      return { ok: false, error: INVALID_MESSAGE }
    }
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, error: INVALID_MESSAGE }
    }
    return { ok: true, value: digits }
  }

  let digits = onlyDigits(trimmed)

  // "00" como prefijo de marcación internacional (equivalente a "+").
  if (digits.startsWith('00') && digits.length > AR_LOCAL_LENGTH + 2) {
    digits = digits.slice(2)
    if (digits.startsWith('54')) {
      const ar = normalizeArgentina(digits)
      if (ar) return { ok: true, value: ar }
      return { ok: false, error: INVALID_MESSAGE }
    }
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, error: INVALID_MESSAGE }
    }
    return { ok: true, value: digits }
  }

  // El partner ya declaró un país no-argentino: no se intenta la heurística
  // AR (que asumiría de más), se valida como internacional genérico.
  if (isNonArCountry) {
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, error: INVALID_MESSAGE }
    }
    return { ok: true, value: digits }
  }

  const ar = normalizeArgentina(digits)
  if (ar) return { ok: true, value: ar }

  return { ok: false, error: INVALID_MESSAGE }
}
