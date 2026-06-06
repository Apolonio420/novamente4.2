import { test, expect } from '@playwright/test'

/**
 * Flujo de recuperación de contraseña de partners.
 *
 * El flujo completo (mail → token de recovery → setear clave) no se puede
 * testear E2E sin un token real de Supabase, así que cubrimos lo determinístico:
 *  1. Entry point en el login ("Olvidé mi contraseña")
 *  2. La página /partners/reset-password existe y maneja sin crashear el caso
 *     "sin token" (enlace inválido/expirado) — el bug original era que esta
 *     página no existía.
 *  3. La validación client-side del form (clave corta / no coinciden), forzando
 *     la fase "ready" con una sesión sembrada en localStorage.
 */

// --- Helper: deriva la storageKey de Supabase y siembra una sesión fake ---
// supabase-js v2 guarda la sesión en `sb-<projectRef>-auth-token`.
function seedRecoverySessionScript(supabaseUrl: string) {
  const ref = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'sb'
  const nowSec = Math.floor(Date.now() / 1000)
  const session = {
    access_token: 'fake-access-token-for-e2e',
    refresh_token: 'fake-refresh-token-for-e2e',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSec + 3600, // futuro → getSession() lo devuelve sin pegarle al server
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e-recovery@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date(0).toISOString(),
    },
  }
  return {
    key: `sb-${ref}-auth-token`,
    value: JSON.stringify(session),
  }
}

test.describe('Partners — Recuperación de contraseña', () => {
  // ----------------------------------------------------------------------
  // 1. Entry point en el login
  // ----------------------------------------------------------------------
  test.describe('Login — entry point', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/partners/login')
    })

    test('muestra el botón "Olvidé mi contraseña"', async ({ page }) => {
      await expect(page.getByRole('button', { name: /olvidé mi contraseña/i })).toBeVisible()
    })

    test('sin email cargado, pedir reset muestra error pidiendo el email', async ({ page }) => {
      await page.getByRole('button', { name: /olvidé mi contraseña/i }).click()
      await expect(page.getByText(/ingresá tu email/i)).toBeVisible()
    })

    test('la página carga sin errores', async ({ page }) => {
      await expect(page.locator('body')).not.toContainText('Application error')
    })
  })

  // ----------------------------------------------------------------------
  // 2. Página de reset SIN token → estado "enlace inválido"
  // ----------------------------------------------------------------------
  test.describe('Reset page — sin token', () => {
    test('renderiza el título y verifica el enlace', async ({ page }) => {
      await page.goto('/partners/reset-password')
      await expect(page.getByRole('heading', { name: /restablecer contraseña/i })).toBeVisible()
      // Arranca verificando
      await expect(page.getByText(/verificando el enlace/i)).toBeVisible()
    })

    test('sin token válido cae en "enlace inválido o expirado" con link al login', async ({ page }) => {
      // La verificación tiene un timeout de 8s antes de declarar el link inválido.
      test.setTimeout(20000)
      await page.goto('/partners/reset-password')
      await expect(page.getByText(/enlace inválido o expirado/i)).toBeVisible({ timeout: 12000 })
      await expect(page.getByRole('link', { name: /volver al login/i }).first()).toBeVisible()
    })
  })

  // ----------------------------------------------------------------------
  // 3. Form (fase "ready") — validación client-side con sesión sembrada
  // ----------------------------------------------------------------------
  test.describe('Reset page — form con sesión de recovery', () => {
    test.beforeEach(async ({ page }) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      test.skip(!supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL no disponible para sembrar la sesión')
      const { key, value } = seedRecoverySessionScript(supabaseUrl!)
      await page.addInitScript(
        ([k, v]) => window.localStorage.setItem(k, v),
        [key, value] as const,
      )
      await page.goto('/partners/reset-password')
    })

    test('con sesión activa muestra el form de nueva contraseña', async ({ page }) => {
      await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel(/repetir contraseña/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /guardar contraseña/i })).toBeVisible()
    })

    test('rechaza contraseña de menos de 8 caracteres', async ({ page }) => {
      await page.getByLabel(/nueva contraseña/i).fill('corta')
      await page.getByLabel(/repetir contraseña/i).fill('corta')
      await page.getByRole('button', { name: /guardar contraseña/i }).click()
      await expect(page.getByText(/al menos 8 caracteres/i)).toBeVisible()
    })

    test('rechaza cuando las contraseñas no coinciden', async ({ page }) => {
      await page.getByLabel(/nueva contraseña/i).fill('claveLarga123')
      await page.getByLabel(/repetir contraseña/i).fill('otraClave123')
      await page.getByRole('button', { name: /guardar contraseña/i }).click()
      await expect(page.getByText(/no coinciden/i)).toBeVisible()
    })
  })
})
