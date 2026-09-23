/**
 * Fase 3 pieza C — mismo criterio que ya usaba `design-engine` para
 * `?uploadedDesignUrl=` (ver `isTrustedDesignUrl` ahí, 23/09/2026): antes de
 * inyectar una URL que viene de un query param en un flujo que después la
 * fetchea server-side, hay que confirmar que apunta a NUESTRO storage — si
 * no, un link armado con `?designUrl=<url-atacante>` podría hacer que el
 * servidor descargue algo arbitrario.
 *
 * Diseños/mockups pueden vivir en dos storages: Supabase (host de
 * `NEXT_PUBLIC_SUPABASE_URL`) o Cloudflare R2 (dominio público `*.r2.dev` —
 * `CLOUDFLARE_R2_PUBLIC_DOMAIN` no está expuesto como NEXT_PUBLIC, así que
 * client-side solo podemos chequear el patrón del dominio, no el valor
 * exacto; el servidor vuelve a validar todo en `from-design`/`mockup-preview`
 * de cualquier forma, esto es solo para no navegar/inyectar basura).
 */
export function isTrustedAssetUrl(raw: string | null | undefined): boolean {
  if (!raw) return false
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return false
    if (parsed.hostname.endsWith('.r2.dev')) return true
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname
    return !!supabaseHost && parsed.hostname === supabaseHost
  } catch {
    return false
  }
}
