/**
 * E2E UI: el editor de productos muestra el campo "Arte para estampar (print-ready)".
 * Planta la sesión (cookie + localStorage) para evitar el form de login. Screenshot.
 */
import { test, expect } from '@playwright/test'
import { E2E_PARTNER_EMAIL, E2E_PARTNER_PASSWORD, hasPartnerAuthCreds } from './fixtures/partner-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function passwordGrant() {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: E2E_PARTNER_EMAIL, password: E2E_PARTNER_PASSWORD }),
  })
  if (!res.ok) throw new Error(`grant ${res.status}`)
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; user: unknown }>
}

test.describe('Partner UI: campo de arte en el editor', () => {
  test.skip(!hasPartnerAuthCreds(), 'Faltan creds de partner E2E')

  test('editor de producto muestra "Arte para estampar" → screenshot', async ({ page }) => {
    test.setTimeout(90_000)
    const sess = await passwordGrant()
    const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
    const storageKey = `sb-${ref}-auth-token`
    const sessionObj = {
      access_token: sess.access_token,
      refresh_token: sess.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (sess.expires_in ?? 3600),
      expires_in: sess.expires_in,
      token_type: 'bearer',
      user: sess.user,
    }
    await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v) } catch { /* noop */ } }, [storageKey, JSON.stringify(sessionObj)] as [string, string])
    await page.request.post('/api/auth/set-session', { data: { access_token: sess.access_token, refresh_token: sess.refresh_token } }).catch(() => null)

    await page.goto('/workspace/catalog')
    const addBtn = page.getByRole('button', { name: 'Agregar producto' }).first()
    await expect(addBtn).toBeVisible({ timeout: 25_000 })
    await addBtn.click()

    const artLabel = page.getByText('Arte para estampar (print-ready)')
    await expect(artLabel).toBeVisible({ timeout: 10_000 })
    await artLabel.scrollIntoViewIfNeeded()
    await page.screenshot({ path: 'test-results/catalog-print-ready-field.png', fullPage: true })
  })
})
