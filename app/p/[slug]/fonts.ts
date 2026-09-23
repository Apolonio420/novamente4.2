/**
 * Fuentes de encabezado del storefront de partners (Fase 2).
 *
 * El panel (`/workspace/branding`) guarda `tenants.font_preference`, pero el
 * storefront público (`/p/[slug]`) lo ignoraba y siempre renderizaba Inter
 * (auditoría de tiendas). Este módulo carga con `next/font/google` SOLO acá
 * (no en `app/layout.tsx`, que sigue siendo Inter global) un set corto de
 * fuentes y las aplica a los encabezados (h1/h2 del storefront + nombre de
 * producto). El cuerpo del texto se queda en Inter (heredada de layout) para
 * legibilidad — nunca se sobreescribe.
 *
 * El mapeo de `font_preference` → fuente vive en `lib/partners/heading-font.ts`
 * (pura, testeable sin next/font). Acá solo se resuelve la clave a la fuente
 * real cargada.
 *
 * bold → Archivo Black: display bold legible en castellano con acentos — se
 * descartó Bebas Neue por ser versalitas, peor lectura que un display normal.
 */
import { Poppins, Playfair_Display, Archivo_Black } from 'next/font/google'
import { headingFontKey } from '@/lib/partners/heading-font'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

/** className a aplicar en h1/h2/nombre de producto según `tenant.font_preference`. '' = sin cambios (Inter heredado). */
export function headingFontClassName(fontPreference: string | null | undefined): string {
  switch (headingFontKey(fontPreference)) {
    case 'poppins':
      return poppins.className
    case 'playfair':
      return playfair.className
    case 'archivo-black':
      return archivoBlack.className
    default:
      return ''
  }
}
