/**
 * Mapeo puro `tenants.font_preference` → clave de fuente de encabezado
 * (Fase 2 tiendas partner). Separado de `app/p/[slug]/fonts.ts` (que carga
 * las fuentes reales con `next/font/google`) para poder testearlo sin
 * depender de next/font en vitest.
 *
 * Relevamiento real de `font_preference` en `tenants` (23/09/2026): inter 43,
 * bold 15, playfair 7, serif 5, poppins 4, y valores sueltos/vacíos.
 */

export type HeadingFontKey = 'inter' | 'poppins' | 'playfair' | 'archivo-black'

/** 'inter' = sin override, se hereda el Inter global de app/layout.tsx. */
export function headingFontKey(fontPreference: string | null | undefined): HeadingFontKey {
  switch ((fontPreference || '').trim().toLowerCase()) {
    case 'poppins':
      return 'poppins'
    case 'playfair':
    case 'serif':
      return 'playfair'
    case 'bold':
      return 'archivo-black'
    default:
      return 'inter'
  }
}
