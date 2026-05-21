import { NextRequest, NextResponse } from "next/server"

/**
 * Daily health-check for /crear conversion flow.
 *
 * Runs via Vercel cron at 14:00 UTC (11:00 AR). Verifies:
 *   1. /crear renders
 *   2. /api/public/social-proof responds
 *   3. /api/generate-image returns a valid image URL
 *   4. /api/public/design/mockup-lifestyle composes with that design
 *
 * If anything fails, sends a Telegram alert to OPS chat.
 * Cost target: < $0.10 USD/run (1 gen-image + 1 mockup).
 */

export const runtime = "nodejs"
export const maxDuration = 300

const ORIGIN = "https://www.novamente.ar"
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_OPS
const CHAT_ID = process.env.TELEGRAM_CHAT_ID_OPS

type CheckResult = {
  name: string
  ok: boolean
  status?: number
  detail?: string
  durationMs: number
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    return await p
  } finally {
    clearTimeout(t)
  }
}

async function check(name: string, fn: () => Promise<{ ok: boolean; status?: number; detail?: string }>): Promise<CheckResult> {
  const t0 = Date.now()
  try {
    const result = await withTimeout(fn(), 90_000)
    return { name, ...result, durationMs: Date.now() - t0 }
  } catch (e: any) {
    return {
      name,
      ok: false,
      detail: e?.name === "AbortError" ? "timeout (>90s)" : (e?.message ?? "unknown error"),
      durationMs: Date.now() - t0,
    }
  }
}

async function notifyTelegram(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
    })
  } catch (e) {
    console.error("[healthcheck] telegram failed", e)
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` if set; we also allow
  // manual GET in dev.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization") || ""
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const results: CheckResult[] = []
  let designUrl: string | null = null

  // 1. /crear HTML renders
  results.push(
    await check("crear-page", async () => {
      const r = await fetch(`${ORIGIN}/crear`, { cache: "no-store" })
      const text = await r.text()
      const hasHeading = /Dise[ñn]á tu prenda/i.test(text)
      return {
        ok: r.ok && hasHeading,
        status: r.status,
        detail: r.ok ? (hasHeading ? "ok" : "heading missing") : text.slice(0, 200),
      }
    }),
  )

  // 2. social-proof
  results.push(
    await check("social-proof", async () => {
      const r = await fetch(`${ORIGIN}/api/public/social-proof`, { cache: "no-store" })
      const body = await r.text()
      const hasKeys = /designsLast24h/.test(body) && /totalOrders/.test(body)
      return {
        ok: r.ok && hasKeys,
        status: r.status,
        detail: r.ok ? (hasKeys ? "ok" : "keys missing") : body.slice(0, 200),
      }
    }),
  )

  // 3. generate-image
  results.push(
    await check("generate-image", async () => {
      const r = await fetch(`${ORIGIN}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "simple geometric circle test, vector flat illustration",
          raw: true,
          garmentColor: "black",
        }),
        cache: "no-store",
      })
      const body = await r.text()
      if (!r.ok) return { ok: false, status: r.status, detail: body.slice(0, 200) }
      try {
        const json = JSON.parse(body)
        const url = json?.images?.[0]?.url
        if (json.success && url) {
          designUrl = url
          return { ok: true, status: r.status, detail: "ok" }
        }
        return { ok: false, status: r.status, detail: `no image url: ${body.slice(0, 200)}` }
      } catch {
        return { ok: false, status: r.status, detail: `invalid json: ${body.slice(0, 200)}` }
      }
    }),
  )

  // 4. mockup-lifestyle (only if we got a designUrl from step 3)
  if (designUrl) {
    results.push(
      await check("mockup-lifestyle", async () => {
        const r = await fetch(`${ORIGIN}/api/public/design/mockup-lifestyle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designUrl,
            garmentType: "aldea-classic-tshirt",
            garmentColor: "black",
            side: "front",
            printArea: "R2",
          }),
          cache: "no-store",
        })
        const body = await r.text()
        if (!r.ok) return { ok: false, status: r.status, detail: body.slice(0, 200) }
        try {
          const json = JSON.parse(body)
          const url = json?.publicUrl ?? json?.mockupUrl
          return url
            ? { ok: true, status: r.status, detail: "ok" }
            : { ok: false, status: r.status, detail: `no mockup url: ${body.slice(0, 200)}` }
        } catch {
          return { ok: false, status: r.status, detail: `invalid json: ${body.slice(0, 200)}` }
        }
      }),
    )
  } else {
    results.push({ name: "mockup-lifestyle", ok: false, detail: "skipped (no designUrl from step 3)", durationMs: 0 })
  }

  const failed = results.filter((r) => !r.ok)
  const date = new Date().toISOString().slice(0, 10)

  if (failed.length === 0) {
    console.log(`[healthcheck] OK ${date} all checks passed`)
    return NextResponse.json({ ok: true, date, results })
  }

  // Alert on failure
  const lines = [
    `🚨 <b>/crear health-check FAIL</b> (${date})`,
    "",
    ...failed.map((f) => `❌ <b>${f.name}</b> (${f.durationMs}ms${f.status ? `, ${f.status}` : ""})\n   ${f.detail || ""}`),
    "",
    `Pasaron: ${results.length - failed.length}/${results.length}`,
  ]
  await notifyTelegram(lines.join("\n"))

  console.error(`[healthcheck] FAIL`, JSON.stringify(results, null, 2))
  return NextResponse.json({ ok: false, date, results }, { status: 500 })
}
