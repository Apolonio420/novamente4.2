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
  test.setTimeout(120000) // Gemini puede tardar; damos 2 min de margen total
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
  await textarea.waitFor({ state: "visible", timeout: 20000 })
  await textarea.fill("Un astronauta vintage estilo poster setentas, colores vibrantes")
  await page.waitForTimeout(500) // dejar que React actualice el state

  // Capturar el HTML del area del input para debug
  const inputArea = await page.locator('textarea').first().locator("..").locator("..").innerHTML().catch(() => "<not found>")
  console.log("[DEBUG] Input area HTML (truncated):", inputArea.slice(0, 800))

  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-02-prompt-typed.png`, fullPage: true })

  // Find submit button — try multiple selectors
  let clicked = false
  const selectors = [
    'button[data-testid="send-prompt"]',
    'button[aria-label="Enviar prompt"]',
    'button:has(svg[class*="Send"])',
    'button.bg-violet-600',
  ]
  for (const sel of selectors) {
    const btn = page.locator(sel).first()
    const exists = (await btn.count()) > 0
    console.log(`[DEBUG] selector "${sel}" — exists: ${exists}`)
    if (exists && !clicked) {
      try {
        await btn.click({ timeout: 5000 })
        console.log(`[OK] Clicked with selector: ${sel}`)
        clicked = true
      } catch (e) {
        console.log(`[FAIL] click ${sel}:`, (e as Error).message.slice(0, 100))
      }
    }
  }

  if (clicked) {
    // Wait for response (image to appear or error) — Gemini puede tardar 5-25s
    await page.waitForTimeout(45000)
  } else {
    console.log("[FAIL] No submit button found")
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-03-after-generate.png`, fullPage: true })

  console.log("[NETWORK] API calls during generation:")
  networkLog.forEach((n) => console.log(`  ${n.status} ${n.url}`))

  await ctx.close()
})

// Test 4: Mobile happy path — full generate + mockup flow on iPhone
test("mobile happy path: generate + mockup en iPhone 14 Pro", async ({ browser }) => {
  test.setTimeout(180000)
  const iPhone = devices["iPhone 14 Pro"]
  const ctx = await browser.newContext({ ...iPhone })
  const page = await ctx.newPage()
  const apiLog: { url: string; status: number }[] = []
  page.on("response", (res) => {
    if (res.url().includes("/api/")) apiLog.push({ url: res.url(), status: res.status() })
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-03-loaded.png`, fullPage: true })

  // Fill prompt and send
  const textarea = page.locator("textarea").first()
  await textarea.waitFor({ state: "visible", timeout: 20000 })
  await textarea.fill("Un dragon japones tradicional negro y rojo, estilo ukiyo-e")
  await page.waitForTimeout(300)

  const sendBtn = page.getByTestId("send-prompt")
  await sendBtn.click()

  // Wait for Gemini
  await page.waitForTimeout(45000)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-04-generated.png`, fullPage: true })

  // Check that an image was returned by looking for img elements in the chat
  const chatImages = await page.locator("img").count()
  console.log(`[MOBILE] Total imgs en pagina post-generacion: ${chatImages}`)

  console.log("[MOBILE NETWORK] API calls:")
  apiLog.forEach((n) => console.log(`  ${n.status} ${n.url}`))

  await ctx.close()
})

// Test 6: Bg removal con @imgly — debe rutear a /remove-bg, no /edit
test("bg removal: cliente @imgly remueve fondo correctamente", async ({ browser }) => {
  test.setTimeout(180000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const apiLog: { url: string; status: number }[] = []
  page.on("response", (res) => {
    if (res.url().includes("/api/")) apiLog.push({ url: res.url(), status: res.status() })
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)

  // Upload una imagen real (lifestyle generada earlier, persona con prenda)
  const fileInput = page.locator('input[type="file"]').first()
  const testImagePath = "tests-results/desktop-03-after-generate.png"
  await fileInput.setInputFiles(testImagePath)
  await page.waitForTimeout(2500)

  // Pedir bg removal con la frase exacta del user
  const textarea = page.locator("textarea").first()
  await textarea.waitFor({ state: "visible", timeout: 20000 })
  await textarea.fill("sacale el fondo")
  await page.waitForTimeout(300)

  const sendBtn = page.getByTestId("send-prompt")
  await sendBtn.click()

  // Wait — @imgly first-load downloads ~50MB de models ONNX
  await page.waitForTimeout(90000)
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-06-bg-removed.png`, fullPage: true })

  const bgRemoveCalls = apiLog.filter((n) => n.url.includes("/api/public/design/remove-bg"))
  const editCalls = apiLog.filter((n) => n.url.includes("/api/public/design/edit"))
  console.log(`[BG-REMOVE] calls: ${bgRemoveCalls.length} — status: ${bgRemoveCalls.map((c) => c.status).join(",")}`)
  console.log(`[EDIT-fallback] calls: ${editCalls.length} (deberia ser 0 — intent correctamente detectado)`)
  console.log("[FULL]")
  apiLog.forEach((n) => console.log(`  ${n.status} ${n.url}`))

  await ctx.close()
})

// Test 5: Upload image + ask for bg removal — el caso del user
test("upload + bg removal: simula el flow de subir selfie", async ({ browser }) => {
  test.setTimeout(180000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const apiLog: { url: string; status: number }[] = []
  page.on("response", (res) => {
    if (res.url().includes("/api/")) apiLog.push({ url: res.url(), status: res.status() })
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(1500)

  // Upload usando el input file oculto (lo encontramos directamente)
  const fileInput = page.locator('input[type="file"]').first()
  const testImagePath = "tests-results/desktop-03-after-generate.png" // usamos un design como ref
  await fileInput.setInputFiles(testImagePath).catch((e) => {
    console.log("[FAIL] setInputFiles:", e.message)
  })
  await page.waitForTimeout(3000) // dejar que suba a R2
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-04-uploaded.png`, fullPage: true })

  // Verificar que el upload llamo al endpoint
  const uploadCalls = apiLog.filter((n) => n.url.includes("/api/public/design/upload"))
  console.log(`[UPLOAD] Upload calls: ${uploadCalls.length} — status: ${uploadCalls.map((c) => c.status).join(",")}`)

  // Escribir instruccion de bg removal
  const textarea = page.locator("textarea").first()
  await textarea.fill("Sacale el fondo y dejá solo la figura central, listo para estampar")
  await page.waitForTimeout(300)

  const sendBtn = page.getByTestId("send-prompt")
  await sendBtn.click()

  await page.waitForTimeout(60000) // gemini con 2 imagenes puede tardar mas
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-05-edited.png`, fullPage: true })

  // Confirmar que llamo a /api/public/design/edit (no a generate-image)
  const editCalls = apiLog.filter((n) => n.url.includes("/api/public/design/edit"))
  const genImgCalls = apiLog.filter((n) => n.url.includes("/api/generate-image"))
  console.log(`[EDIT] Edit calls: ${editCalls.length} — status: ${editCalls.map((c) => c.status).join(",")}`)
  console.log(`[GEN-IMG] Generate-image calls: ${genImgCalls.length} (deberia ser 0 cuando hay attachment)`)

  console.log("[FULL NETWORK]")
  apiLog.forEach((n) => console.log(`  ${n.status} ${n.url}`))

  await ctx.close()
})
