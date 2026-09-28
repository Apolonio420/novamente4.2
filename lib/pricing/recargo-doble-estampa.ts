/**
 * Recargo por estampar la SEGUNDA cara de una prenda (frente + dorso/nuca).
 *
 * Fuente única del número: lo usan el checkout (/crear, `lib/checkout/precio-real.ts`)
 * y el costo del partner (`lib/partners/partner-cost.ts`). Vive en un módulo sin
 * dependencias para que ambos lo importen sin ciclos (precio-real importa de
 * lib/partners/variants, que a su vez necesita este número).
 *
 * Política 29/08: $3.500 por prenda, el MISMO número que cotiza el bot y que
 * muestra /crear. La totebag Bahía lleva $5.000 (la 2da cara es otra pasada
 * completa). Para el partner (decisión Juan 27/09/2026): se cobra completo por
 * cualquier prenda estampada en las dos caras, sin importar el tamaño de cada
 * estampa (una nuca de 7 cm cuenta igual).
 */
export const RECARGO_DOBLE_ESTAMPA = 3500
export const RECARGO_DOBLE_ESTAMPA_TOTE = 5000

/** Recargo por dorso según prenda ($5.000 tote · $3.500 el resto). */
export function recargoDorsoPara(garmentKey: string | null | undefined): number {
  const k = String(garmentKey ?? '').toLowerCase()
  return k.includes('tote') || k.includes('bahia') ? RECARGO_DOBLE_ESTAMPA_TOTE : RECARGO_DOBLE_ESTAMPA
}
