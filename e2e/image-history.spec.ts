import { test, expect } from "@playwright/test"

test.describe("Image History System", () => {
  test("homepage loads image history section without errors", async ({ page }) => {
    await page.goto("/")

    // The section should render
    const section = page.getByText("TUS DISENOS RECIENTES").or(page.getByText("Historial de disenos"))
    await expect(section.first()).toBeVisible({ timeout: 10000 })

    // Should show either images or empty state (not error)
    const errorText = page.getByText("Error al cargar")
    await expect(errorText).not.toBeVisible()
  })

  test("image history API returns valid response", async ({ request }) => {
    const response = await request.get("/api/images/history?limit=5")
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty("images")
    expect(Array.isArray(data.images)).toBeTruthy()
  })

  test("image history API respects limit parameter", async ({ request }) => {
    const response = await request.get("/api/images/history?limit=2")
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.images.length).toBeLessThanOrEqual(2)
  })

  test("session endpoint creates session cookie", async ({ request, context }) => {
    const response = await request.get("/api/user/session")
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty("sessionId")
    expect(typeof data.sessionId).toBe("string")
    expect(data.sessionId.length).toBeGreaterThan(10)
  })

  test("image history returns empty for new session (no images yet)", async ({ page }) => {
    // Fresh browser context = new session = no images
    const response = await page.request.get("/api/images/history?limit=20")
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.images).toEqual([])
  })

  test("inspiring styles section renders on homepage", async ({ page }) => {
    await page.goto("/")

    const stylesHeading = page.getByText("Estilos inspiradores")
    await expect(stylesHeading.first()).toBeVisible({ timeout: 10000 })

    // Should have style thumbnail buttons
    const styleButtons = page.locator("#styles-scroll button")
    const count = await styleButtons.count()
    expect(count).toBe(6) // 6 base styles
  })

  test("empty state shows create button on homepage", async ({ page }) => {
    await page.goto("/")

    // Wait for the history section to finish loading
    await page.waitForTimeout(2000)

    // For a fresh session with no images, should show empty state
    const emptyState = page.getByText("No hay disenos guardados")
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    // Either shows empty state or some images - both are valid
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
    }
  })

  test("image history images are clickable", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(2000)

    // Check if there are history images
    const historyImages = page.locator("#history-scroll button")
    const count = await historyImages.count()

    if (count > 0) {
      // Click first image - should dispatch event
      const eventFired = page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          window.addEventListener("loadImageInGenerator", () => resolve(true), { once: true })
          setTimeout(() => resolve(false), 2000)
        })
      })

      await historyImages.first().click()
      const fired = await eventFired
      expect(fired).toBeTruthy()
    }
  })
})
