import { test, expect, devices } from "@playwright/test"

const BASE_URL = "https://www.novamente.ar/crear"
const SCREENSHOT_DIR = "tests-results"

// Test 1: Desktop — layout y elementos visibles
test("desktop: page loads and core elements render", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`)
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })

  // Wait for hydration
  await page.waitForTimeout(2000)

  // Screenshot full page
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-01-initial.png`, fullPage: true })

  // Check the tabs are visible
  const chatTab = page.getByText(/Chat con IA/i)
  await expect(chatTab).toBeVisible()
  console.log("[OK] Chat tab visible")

  // Check no floating WhatsApp button (we hide it on /crear)
  const whatsappBtn = page.locator('a[href*="wa.me"]').first()
  const whatsappCount = await page.locator('a[href*="wa.me"]').count()
  console.log(`[INFO] WhatsApp links count: ${whatsappCount} (deberia ser bajo, idealmente solo en navbar/footer)`)

  // Check no PublicAssistant chat bubble
  const assistantBubble = page.locator('[data-public-assistant]').count()
  console.log(`[INFO] Public assistant elements: ${await assistantBubble}`)

  // Print console errors (if any)
  if (errors.length > 0) {
    console.log("[WARN] Page errors:", errors)
  }

  await ctx.close()
})

// Test 2: Mobile — viewport iPhone 14 Pro
test("mobile: page renders correctly on iPhone viewport", async ({ browser }) => {
  const iPhone = devices["iPhone 14 Pro"]
  const ctx = await browser.newContext({ ...iPhone })
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-01-initial.png`, fullPage: true })

  // Check no WhatsApp floating button
  const whatsappBtn = page.locator('a[href*="wa.me"]').filter({ hasNotText: "Volver" })
  const count = await whatsappBtn.count()
  console.log(`[MOBILE] WhatsApp button count: ${count}`)

  // Check the chat input is visible at the bottom
  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible()
  console.log("[OK] Mobile textarea visible")

  // Type a prompt
  await textarea.fill("Un leon minimalista negro sobre fondo blanco")
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-02-typed.png`, fullPage: true })

  if (errors.length > 0) console.log("[WARN] Mobile errors:", errors)
  await ctx.close()
})

// Test 3: Chat happy path — generar un diseño desde texto
test("happy path: generar diseño con prompt simple", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const networkLog: { url: string; status: number }[] = []
  page.on("response", (res) => {
    if (res.url().includes("/api/")) {
      networkLog.push({ url: res.url(), status: res.status() })
    }
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(1500)

  const textarea = page.locator('textarea').first()
  await textarea.fill("Un astronauta vintage estilo poster setentas, colores vibrantes")
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-02-prompt-typed.png`, fullPage: true })

  // Find and click submit button by testid
  const submitBtn = page.getByTestId("send-prompt")
  await submitBtn.click()

  // Wait for response (image to appear or error) — Gemini puede tardar 5-25s
  await page.waitForTimeout(40000)

  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-03-after-generate.png`, fullPage: true })

  // Log network calls to /api/
  console.log("[NETWORK] API calls during generation:")
  networkLog.forEach((n) => console.log(`  ${n.status} ${n.url}`))

  await ctx.close()
})
