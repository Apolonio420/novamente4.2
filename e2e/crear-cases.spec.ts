import { test, expect, devices } from "@playwright/test"
import fs from "fs"
import path from "path"

const BASE = "https://www.novamente.ar/crear"
const OUT = "tests-results/cases"

fs.mkdirSync(OUT, { recursive: true })

type Captured = { design?: string; mockup?: string; bgRemove?: string; edit?: string; upload?: string; tryOn?: string }

function setupNetworkCapture(page: import("@playwright/test").Page): Captured {
  const captured: Captured = {}
  page.on("response", async (res) => {
    const url = res.url()
    try {
      if (url.includes("/api/generate-image") && res.request().method() === "POST") {
        const json = await res.json().catch(() => null)
        if (json?.images?.[0]?.url) captured.design = json.images[0].url
      } else if (url.includes("/api/generate-mockup")) {
        const json = await res.json().catch(() => null)
        const m = json?.publicUrl ?? json?.mockupUrl
        if (m) captured.mockup = m
      } else if (url.includes("/api/public/design/edit")) {
        const json = await res.json().catch(() => null)
        if (json?.images?.[0]?.url) captured.edit = json.images[0].url
        if (json?.images?.[0]?.url) captured.design = json.images[0].url
      } else if (url.includes("/api/public/design/remove-bg")) {
        const json = await res.json().catch(() => null)
        if (json?.images?.[0]?.url) captured.bgRemove = json.images[0].url
        if (json?.images?.[0]?.url) captured.design = json.images[0].url
      } else if (url.includes("/api/public/design/upload")) {
        const json = await res.json().catch(() => null)
        if (json?.url) captured.upload = json.url
      } else if (url.includes("/api/public/design/try-on")) {
        const json = await res.json().catch(() => null)
        if (json?.tryOnUrl) captured.tryOn = json.tryOnUrl
      }
    } catch {}
  })
  return captured
}

async function downloadIf(url: string | undefined, label: string) {
  if (!url) return false
  const full = url.startsWith("http") ? url : `https://www.novamente.ar${url}`
  try {
    const res = await fetch(full)
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path.join(OUT, `${label}.png`), buf)
    return true
  } catch {
    return false
  }
}

async function settle(page: import("@playwright/test").Page) {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)
}

// ============================================================
// CASE 1 — Generación texto + prenda oscura (calavera mexicana)
// ============================================================
test("C01 — calavera mexicana sobre prenda negra (print-ready dark)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  await page.locator("textarea").first().fill("calavera mexicana con flores y catrinas, estilo día de los muertos colorido")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  // Auto mockup (default es aldea-classic-tshirt + black)
  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C01-page.png`, fullPage: true })
  await downloadIf(cap.design, "C01-design")
  await downloadIf(cap.mockup, "C01-mockup")
  console.log("[C01] design=", cap.design, "mockup=", cap.mockup)
  await ctx.close()
})

// ============================================================
// CASE 2 — Generación texto + prenda clara (tipografía)
// ============================================================
test("C02 — tipografía sobre prenda blanca (print-ready light)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Cambiar a remera blanca usando el color picker (segundo dot del primer card)
  const whiteSwatch = page.locator('button[title="Blanco"]').first()
  await whiteSwatch.click().catch(() => {})
  await page.waitForTimeout(500)

  await page.locator("textarea").first().fill("frase tipográfica 'NUNCA MAS' en estilo brutalista con detalles ornamentales")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C02-page.png`, fullPage: true })
  await downloadIf(cap.design, "C02-design")
  await downloadIf(cap.mockup, "C02-mockup")
  console.log("[C02] design=", cap.design, "mockup=", cap.mockup)
  await ctx.close()
})

// ============================================================
// CASE 3 — Estilo noir/dark con boost automático
// ============================================================
test("C03 — lobo gothic estilo noir (DARK_STYLE_BOOST)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  await page.locator("textarea").first().fill("lobo nocturno gothic con humo y luna llena, estilo noir cinematográfico")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C03-page.png`, fullPage: true })
  await downloadIf(cap.design, "C03-design")
  await downloadIf(cap.mockup, "C03-mockup")
  console.log("[C03] design=", cap.design, "mockup=", cap.mockup)
  await ctx.close()
})

// ============================================================
// CASE 4 — Iteración (generar + cambiar)
// ============================================================
test("C04 — iteración: generar → 'más colorido'", async ({ browser }) => {
  test.setTimeout(180000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Generate base
  await page.locator("textarea").first().fill("dragón japonés ukiyo-e tradicional")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  // Capture base
  const baseDesign = cap.design
  await downloadIf(baseDesign, "C04-design-base")

  // Iterate
  await page.locator("textarea").first().fill("hacelo mucho más colorido con flores y olas vibrantes")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/public/design/edit") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C04-page.png`, fullPage: true })
  await downloadIf(cap.design, "C04-design-iterated")
  console.log("[C04] base=", baseDesign, "iterated=", cap.design)
  await ctx.close()
})

// ============================================================
// CASE 5 — Orientación vertical
// ============================================================
test("C05 — orientación vertical (768x1024)", async ({ browser }) => {
  test.setTimeout(90000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Click vertical orientation
  await page.locator('button:has-text("Vertical")').first().click()
  await page.waitForTimeout(500)

  await page.locator("textarea").first().fill("guitarra eléctrica con llamas verticales saliendo del mástil")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C05-page.png`, fullPage: true })
  await downloadIf(cap.design, "C05-design")
  console.log("[C05] design=", cap.design)
  await ctx.close()
})

// ============================================================
// CASE 6 — Orientación horizontal
// ============================================================
test("C06 — orientación horizontal (1024x768)", async ({ browser }) => {
  test.setTimeout(90000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  await page.locator('button:has-text("Horizontal")').first().click()
  await page.waitForTimeout(500)

  await page.locator("textarea").first().fill("paisaje montañoso al atardecer con cordillera y un ave volando")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C06-page.png`, fullPage: true })
  await downloadIf(cap.design, "C06-design")
  console.log("[C06] design=", cap.design)
  await ctx.close()
})

// ============================================================
// CASE 7 — Upload foto + "Solo el sujeto" (bg removal)
// ============================================================
test("C07 — upload foto + Solo el sujeto (bg removal)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Upload imagen real (uso un mockup del catalog para simular foto)
  const localPath = path.join(process.cwd(), "tests-results", "lifestyle-04-amigos-collage-blanca-16x9.png")
  const useThis = fs.existsSync(localPath)
    ? localPath
    : "tests-results/desktop-03-after-generate.png"

  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(useThis)
  await page.waitForResponse((r) => r.url().includes("/api/public/design/upload"), { timeout: 30000 })
  await page.waitForTimeout(2000)

  await downloadIf(cap.upload, "C07-upload-original")

  // Click chip "Solo el sujeto"
  await page.locator('button:has-text("Solo el sujeto")').click()
  await page.waitForResponse((r) => r.url().includes("/api/public/design/remove-bg") && r.status() === 200, { timeout: 90000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C07-page.png`, fullPage: true })
  await downloadIf(cap.bgRemove, "C07-bg-removed")
  console.log("[C07] upload=", cap.upload, "bgRemove=", cap.bgRemove)
  await ctx.close()
})

// ============================================================
// CASE 8 — Upload foto + "Foto entera" + auto-mockup
// ============================================================
test("C08 — upload foto + Foto entera (tal cual + auto-mockup)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles("tests-results/desktop-03-after-generate.png")
  await page.waitForResponse((r) => r.url().includes("/api/public/design/upload"), { timeout: 30000 })
  await page.waitForTimeout(1500)

  // Click chip "Foto entera"
  await page.locator('button:has-text("Foto entera")').click()
  // El intent "tal cual" saltea Gemini → solo dispara mockup automatico
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C08-page.png`, fullPage: true })
  await downloadIf(cap.mockup, "C08-mockup")
  console.log("[C08] upload=", cap.upload, "mockup=", cap.mockup)
  await ctx.close()
})

// ============================================================
// CASE 9 — Upload foto + "Convertir a dibujo"
// ============================================================
test("C09 — upload foto + Convertir a dibujo", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles("tests-results/desktop-03-after-generate.png")
  await page.waitForResponse((r) => r.url().includes("/api/public/design/upload"), { timeout: 30000 })
  await page.waitForTimeout(1500)

  await page.locator('button:has-text("Convertir a dibujo")').click()
  await page.waitForResponse((r) => r.url().includes("/api/public/design/edit") && r.status() === 200, { timeout: 90000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C09-page.png`, fullPage: true })
  await downloadIf(cap.edit, "C09-as-drawing")
  console.log("[C09] edit=", cap.edit)
  await ctx.close()
})

// ============================================================
// CASE 10 — Cambio de prenda (hoodie) + remockup
// ============================================================
test("C10 — generar + cambiar a hoodie negro + mockup", async ({ browser }) => {
  test.setTimeout(150000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Generate first
  await page.locator("textarea").first().fill("león minimalista con corona dorada, estilo emblema")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)
  await downloadIf(cap.design, "C10-design")

  // Switch to hoodie (cuarto card en el grid)
  await page.locator('button:has-text("Buzo Hoodie")').first().click()
  await page.waitForTimeout(500)

  // Probar en prenda
  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C10-page.png`, fullPage: true })
  await downloadIf(cap.mockup, "C10-mockup-hoodie")
  console.log("[C10] design=", cap.design, "mockup-hoodie=", cap.mockup)
  await ctx.close()
})

// ============================================================
// CASE 11 — Doble estampa (front + back diferentes)
// ============================================================
test("C11 — doble estampa: front + back distintos", async ({ browser }) => {
  test.setTimeout(180000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  // Front design
  await page.locator("textarea").first().fill("flor de loto minimalista negra")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)
  await downloadIf(cap.design, "C11-front-design")

  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 })
  await page.waitForTimeout(2000)
  await downloadIf(cap.mockup, "C11-front-mockup")

  // Switch to back side
  await page.locator('button:has-text("Espalda")').first().click()
  await page.waitForTimeout(500)

  // New design for back
  await page.locator("textarea").first().fill("paisaje montañoso ancho minimalista estilo line art")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/public/design/edit") && r.status() === 200, { timeout: 90000 }).catch(async () => {
    // Si no hay edit (porque se reseteo currentDesignUrl), espera generate-image
    await page.waitForResponse((r) => r.url().includes("/api/generate-image"), { timeout: 60000 }).catch(() => {})
  })
  await page.waitForTimeout(2000)
  await downloadIf(cap.design, "C11-back-design")

  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2000)
  await downloadIf(cap.mockup, "C11-back-mockup")

  await page.screenshot({ path: `${OUT}/C11-page.png`, fullPage: true })
  console.log("[C11] done")
  await ctx.close()
})

// ============================================================
// CASE 12 — Mobile iPhone full flow (generar + mockup)
// ============================================================
test("C12 — mobile iPhone full flow", async ({ browser }) => {
  test.setTimeout(150000)
  const iPhone = devices["iPhone 14 Pro"]
  const ctx = await browser.newContext({ ...iPhone })
  const page = await ctx.newPage()
  const cap = setupNetworkCapture(page)
  await settle(page)

  await page.locator("textarea").first().fill("zorro origami geométrico colorido")
  await page.getByTestId("send-prompt").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-image") && r.status() === 200, { timeout: 60000 })
  await page.waitForTimeout(2000)

  await page.locator("button:has-text('Probar en prenda')").click()
  await page.waitForResponse((r) => r.url().includes("/api/generate-mockup"), { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2000)

  await page.screenshot({ path: `${OUT}/C12-page.png`, fullPage: true })
  await downloadIf(cap.design, "C12-design-mobile")
  await downloadIf(cap.mockup, "C12-mockup-mobile")
  console.log("[C12] mobile design=", cap.design, "mockup=", cap.mockup)
  await ctx.close()
})
