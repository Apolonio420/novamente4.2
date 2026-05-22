/**
 * Playwright fixture: obtener un access token de Supabase para un usuario partner
 * de prueba, listo para usar en `Authorization: Bearer <token>` contra las APIs
 * del workspace.
 *
 * Setup requerido (.env.local o .env.test):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   E2E_PARTNER_EMAIL
 *   E2E_PARTNER_PASSWORD
 *
 * El usuario debe existir en Supabase Auth y tener un tenant asociado en la
 * tabla de tenants (ver lib/partners/tenant.ts). Si no estan seteadas las
 * variables, los tests que la usen se skipean.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const E2E_PARTNER_EMAIL = process.env.E2E_PARTNER_EMAIL ?? ""
export const E2E_PARTNER_PASSWORD = process.env.E2E_PARTNER_PASSWORD ?? ""

export function hasPartnerAuthCreds(): boolean {
  return Boolean(
    SUPABASE_URL && SUPABASE_ANON_KEY && E2E_PARTNER_EMAIL && E2E_PARTNER_PASSWORD,
  )
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getPartnerAccessToken(): Promise<string> {
  if (!hasPartnerAuthCreds()) {
    throw new Error(
      "Partner E2E creds missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_PARTNER_EMAIL, E2E_PARTNER_PASSWORD.",
    )
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: E2E_PARTNER_EMAIL,
      password: E2E_PARTNER_PASSWORD,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Supabase password sign-in failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  return json.access_token
}
