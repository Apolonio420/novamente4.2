import { test, expect } from "@playwright/test"

test.describe("Public Assistant (Nova)", () => {
  test("FAB button renders on homepage", async ({ page }) => {
    await page.goto("/")
    const fab = page.getByRole("button", { name: /abrir asistente|nova/i })
    await expect(fab).toBeVisible({ timeout: 10000 })
  })

  test("click FAB opens chat panel", async ({ page }) => {
    await page.goto("/")
    const fab = page.getByRole("button", { name: /abrir asistente|nova/i })
    await fab.click()

    // Panel should show with header
    await expect(page.getByText("Nova")).toBeVisible()
    await expect(page.getByText("Asistente IA")).toBeVisible()
    await expect(page.getByPlaceholder(/escribi/i)).toBeVisible()
  })

  test("shows welcome message with quick actions", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /abrir asistente|nova/i }).click()

    await expect(page.getByText("Hola! Soy Nova")).toBeVisible()
    await expect(page.getByText("Ver productos")).toBeVisible()
    await expect(page.getByText("Como funciona?")).toBeVisible()
  })

  test("full-screen toggle works", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /abrir asistente|nova/i }).click()

    // Click maximize
    await page.getByTitle("Pantalla completa").click()
    // Panel should be full viewport
    const panel = page.locator(".fixed.inset-0")
    await expect(panel).toBeVisible()

    // Click minimize
    await page.getByTitle("Minimizar").click()
    await expect(panel).not.toBeVisible()
  })

  test("chat API returns valid SSE response", async ({ request }) => {
    const res = await request.post("/api/assistant/chat", {
      data: { query: "hola", history: [] },
      headers: { Accept: "application/json" },
    })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty("text")
    expect(data.text.length).toBeGreaterThan(0)
  })

  test("close button hides panel", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /abrir asistente|nova/i }).click()
    await expect(page.getByText("Nova")).toBeVisible()

    await page.getByTitle("Cerrar").click()
    // FAB should be visible again
    await expect(page.getByRole("button", { name: /abrir asistente|nova/i })).toBeVisible()
  })

  test("clear chat button works", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /abrir asistente|nova/i }).click()
    await page.getByTitle("Limpiar chat").click()
    // Should show welcome message (empty state)
    await expect(page.getByText("Hola! Soy Nova")).toBeVisible()
  })

  test("FAB not visible on workspace routes", async ({ page }) => {
    await page.goto("/workspace", { waitUntil: "domcontentloaded" })
    // PublicAssistant should not render on workspace
    const fab = page.getByRole("button", { name: /abrir asistente|nova/i })
    await expect(fab).not.toBeVisible({ timeout: 3000 })
  })
})
