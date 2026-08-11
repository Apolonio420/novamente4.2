import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

// Mock supabaseAdmin con dos colas independientes:
//  - state.countQueue: para las 3 consultas (minute, day-ip, day-global) que
//    guardPublicImageGen dispara en paralelo via Promise.all (terminan en
//    `.gt()`). Se evaluan sincronicamente en orden, asi que la cola respeta
//    ese orden. Ver lib/partners/orders.test.ts para el mismo patron de
//    vi.hoisted + vi.mock('@/lib/supabase-admin', ...) usado en el repo.
//  - state.budgetPages: para el chequeo de tope MENSUAL en USD (termina en
//    `.range()`, paginando de a BUDGET_PAGE_SIZE). Cada llamada a `.range()`
//    hace shift() de una "pagina" (array de filas {cost_usd}); si la cola
//    esta vacia devuelve pagina vacia (gasto 0).
const h = vi.hoisted(() => {
  const state = {
    countQueue: [] as number[],
    forceError: false,
    budgetPages: [] as { cost_usd: number }[][],
    forceBudgetError: false,
    insertCalls: [] as any[],
    // Args de cada llamada a `.gte()` — sirve para verificar el piso de
    // fecha (`created_at >= ...`) que arma startOfBudgetWindowIso() sin
    // tener que aplicar el filtro de verdad en el mock (no hay DB real).
    gteCalls: [] as any[][],
  }
  const chain: any = {
    from: () => chain,
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    gt: () =>
      Promise.resolve(
        state.forceError
          ? { data: null, error: { message: "db down" }, count: null }
          : { data: null, error: null, count: state.countQueue.shift() ?? 0 },
      ),
    gte: (...args: any[]) => {
      state.gteCalls.push(args)
      return chain
    },
    range: () =>
      Promise.resolve(
        state.forceBudgetError
          ? { data: null, error: { message: "budget db down" } }
          : { data: state.budgetPages.shift() ?? [], error: null },
      ),
    insert: (row: any) => {
      state.insertCalls.push(row)
      return Promise.resolve({ error: null })
    },
  }
  return { chain, state }
})

vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: h.chain }))
vi.mock("@/lib/notifications", () => ({ notifyError: vi.fn().mockResolvedValue(undefined) }))

function makeReq(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers({ "x-forwarded-for": "1.2.3.4", ...headers }) } as unknown as NextRequest
}

/** Encola [minuteCount, dayIpCount, dayGlobalCount, weekIpCount] para la proxima llamada. */
function queueCounts(minute: number, dayIp: number, dayGlobal: number, weekIp = 0) {
  h.state.countQueue.push(minute, dayIp, dayGlobal, weekIp)
}

/** Encola una "pagina" de filas api_usage (una llamada a `.range()`) con los cost_usd dados. */
function queueBudgetPage(costsUsd: number[]) {
  h.state.budgetPages.push(costsUsd.map((cost_usd) => ({ cost_usd })))
}

const ORIGINAL_ENV = { ...process.env }

// El chequeo de tope mensual cachea el total en una variable module-level
// con TTL 60s (getCachedMonthlySpendUsd). Sin resetear el modulo entre
// tests, el segundo test reusaria el gasto cacheado del primero y los
// resultados de allowed/blocked quedarian pisados por el test anterior.
// vi.resetModules() + re-import dinamico da un modulo (y su cache) fresco
// en cada test, sin tocar produccion con exports solo-para-test.
let guardPublicImageGen: typeof import("./public-image-guard").guardPublicImageGen

beforeEach(async () => {
  h.state.countQueue = []
  h.state.forceError = false
  h.state.budgetPages = []
  h.state.forceBudgetError = false
  h.state.insertCalls = []
  h.state.gteCalls = []
  process.env.PUBLIC_IMAGEGEN_ENABLED = "true"
  delete process.env.PUBLIC_IMAGEGEN_DAILY_CAP
  delete process.env.PUBLIC_GEMINI_BUDGET_USD
  delete process.env.PUBLIC_BUDGET_EPOCH
  delete process.env.INTERNAL_API_SECRET

  vi.resetModules()
  ;({ guardPublicImageGen } = await import("./public-image-guard"))
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.useRealTimers()
})

describe("guardPublicImageGen", () => {
  it("allows a normal request under every limit and records it (ip_hash, not raw ip)", async () => {
    queueCounts(0, 0, 0)
    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
    expect(h.state.insertCalls).toHaveLength(1)
    const row = h.state.insertCalls[0]
    expect(row.endpoint_family).toBe("generate-image")
    expect(row.ip_hash).not.toBe("1.2.3.4")
    expect(row.ip_hash).toMatch(/^[0-9a-f]{32}$/)
  })

  it("blocks immediately when the kill-switch is off, without touching the DB", async () => {
    process.env.PUBLIC_IMAGEGEN_ENABLED = "false"

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.status).toBe(503)
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("bypasses every check when the internal secret header matches", async () => {
    process.env.INTERNAL_API_SECRET = "topsecret"

    const result = await guardPublicImageGen(makeReq({ "x-internal-secret": "topsecret" }), "generate-image")

    expect(result).toEqual({ allowed: true, exempt: true })
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("does NOT bypass when the internal secret header is wrong", async () => {
    process.env.INTERNAL_API_SECRET = "topsecret"
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq({ "x-internal-secret": "wrong" }), "generate-image")

    expect(result.allowed).toBe(true)
    expect((result as any).exempt).toBeUndefined()
  })

  it("blocks at 10 requests/minute per IP+endpoint", async () => {
    queueCounts(10, 3, 3)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(429)
      expect(result.message).toMatch(/minuto/i)
    }
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("blocks at 60 requests/day per IP+endpoint", async () => {
    queueCounts(2, 60, 10)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(429)
      expect(result.message).toMatch(/limite diario/i)
    }
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("blocks at the global daily cap (default 400) across all IPs/endpoints", async () => {
    queueCounts(0, 0, 400)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(429)
      // Es un tope NUESTRO: al visitante le tiene que llegar un error comun,
      // sin numeros ni "llegaste al tope", y con la salida por WhatsApp.
      expect(result.message).toMatch(/no pudimos generar/i)
      expect(result.message).toMatch(/escribinos/i)
      expect(result.message).not.toMatch(/tope|limite|límite/i)
    }
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("respects PUBLIC_IMAGEGEN_DAILY_CAP override", async () => {
    process.env.PUBLIC_IMAGEGEN_DAILY_CAP = "5"
    queueCounts(0, 0, 5)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
  })

  it("allows just under the global cap and still lets the request through", async () => {
    process.env.PUBLIC_IMAGEGEN_DAILY_CAP = "5"
    queueCounts(0, 0, 4)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
  })

  it("falls back to the in-memory limiter when the DB check throws, instead of failing open unbounded", async () => {
    h.state.forceError = true

    // Distinta IP para no compartir el contador en memoria con otros tests
    // del mismo endpointFamily.
    const req = makeReq({ "x-forwarded-for": "9.9.9.9" })

    for (let i = 0; i < 10; i++) {
      const r = await guardPublicImageGen(req, "fallback-test-family")
      expect(r.allowed).toBe(true)
    }
    const eleventh = await guardPublicImageGen(req, "fallback-test-family")
    expect(eleventh.allowed).toBe(false)
  })
})

describe("guardPublicImageGen — tope mensual USD (PUBLIC_GEMINI_BUDGET_USD)", () => {
  it("allows when the monthly spend is well under budget", async () => {
    process.env.PUBLIC_GEMINI_BUDGET_USD = "25"
    queueBudgetPage([1, 2]) // total gastado = 3
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
  })

  it("blocks when the monthly spend has reached the budget, without touching the request-cap DB queries", async () => {
    process.env.PUBLIC_GEMINI_BUDGET_USD = "5"
    queueBudgetPage([5]) // total gastado = 5 >= tope 5

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(429)
      // Idem: nada de "de este mes" — a alguien que entra por primera vez le
      // suena a que el limite es suyo, y encima no es su culpa.
      expect(result.message).toMatch(/no pudimos generar/i)
      expect(result.message).not.toMatch(/este mes/i)
      expect(result.message).not.toMatch(/tope|limite|límite/i)
    }
    // No debe haber insertado fila de request-cap: cortamos antes de esas queries.
    expect(h.state.insertCalls).toHaveLength(0)
    // No debe haber consumido la cola de counts del tope de requests.
    expect(h.state.countQueue).toHaveLength(0)
  })

  it("allows when just under the budget", async () => {
    process.env.PUBLIC_GEMINI_BUDGET_USD = "5"
    queueBudgetPage([4.99])
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
  })

  it("PUBLIC_GEMINI_BUDGET_USD <= 0 disables the monthly check entirely", async () => {
    process.env.PUBLIC_GEMINI_BUDGET_USD = "0"
    queueBudgetPage([999999]) // si el chequeo corriera, esto bloquearia cualquier tope positivo
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
    // La pagina encolada no se toco: el chequeo de presupuesto ni siquiera corrio.
    expect(h.state.budgetPages).toHaveLength(1)
  })

  it("fails OPEN when the budget query errors (does not block generation on a DB hiccup)", async () => {
    h.state.forceBudgetError = true
    queueCounts(0, 0, 0)
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("paginates past the default 1000-row page to sum the full monthly spend", async () => {
    process.env.PUBLIC_GEMINI_BUDGET_USD = "25"
    // Pagina 1: 1000 filas de 0.02 = 20. Pagina 2: 10 filas de 0.6 = 6. Total 26 >= 25.
    queueBudgetPage(Array.from({ length: 1000 }, () => 0.02))
    queueBudgetPage(Array.from({ length: 10 }, () => 0.6))

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    // Confirma que efectivamente consumio ambas paginas (pagino de verdad).
    expect(h.state.budgetPages).toHaveLength(0)
  })
})

describe("guardPublicImageGen — PUBLIC_BUDGET_EPOCH (gasto pre-epoch no cuenta)", () => {
  it("floors the query at the epoch, not at the start of the month, when the epoch falls mid-month", async () => {
    // "Dia del deploy": 2026-07-17 es el default real de getBudgetEpochIso,
    // pero lo seteamos explicito para no depender del reloj del sistema.
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"))
    process.env.PUBLIC_BUDGET_EPOCH = "2026-07-17"
    queueBudgetPage([1])
    queueCounts(0, 0, 0)

    await guardPublicImageGen(makeReq(), "generate-image")

    // El piso de la query es el EPOCH (17), no el inicio del mes (01) — el
    // gasto de julio anterior al deploy (ej. los ~$26.87 pre-existentes)
    // queda fuera de la ventana que suma el guard.
    expect(h.state.gteCalls).toHaveLength(1)
    expect(h.state.gteCalls[0]).toEqual(["created_at", "2026-07-17T00:00:00.000Z"])
  })

  it("does NOT block on launch day even if the month-to-date spend (pre-epoch) already exceeds the budget", async () => {
    // Simula el escenario real que motivo el fix: julio ya sumaba $26.87
    // ANTES del deploy. Ese gasto vive en filas con created_at < epoch, que
    // la query real filtraria (`created_at >= epoch`). Como el mock no
    // aplica el filtro por si solo, lo modelamos encolando SOLO el gasto
    // post-epoch ($2) — que es lo que la query de verdad devolveria.
    process.env.PUBLIC_GEMINI_BUDGET_USD = "25"
    process.env.PUBLIC_BUDGET_EPOCH = "2026-07-17"
    queueBudgetPage([2]) // gasto post-epoch, bien por debajo del tope de 25
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
  })

  it("falls back to the start of the calendar month once the epoch is in the past (next months are unaffected)", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-05T00:00:00.000Z"))
    process.env.PUBLIC_BUDGET_EPOCH = "2026-07-17" // epoch del mes de arranque, ya en el pasado
    queueBudgetPage([1])
    queueCounts(0, 0, 0)

    await guardPublicImageGen(makeReq(), "generate-image")

    expect(h.state.gteCalls).toHaveLength(1)
    expect(h.state.gteCalls[0]).toEqual(["created_at", "2026-08-01T00:00:00.000Z"])
  })

  it("an invalid PUBLIC_BUDGET_EPOCH falls back to the default (2026-07-17) instead of throwing", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"))
    process.env.PUBLIC_BUDGET_EPOCH = "not-a-date"
    queueBudgetPage([1])
    queueCounts(0, 0, 0)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
    expect(h.state.gteCalls[0]).toEqual(["created_at", "2026-07-17T00:00:00.000Z"])
  })
})

describe("guardPublicImageGen — cupo semanal por visitante (PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR)", () => {
  it("blocks the visitor at the weekly quota without blocking anybody else", async () => {
    queueCounts(0, 0, 0, 20)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(429)
      // El mensaje tiene que hablarle a ESE visitante, no sonar a tope global.
      expect(result.message).toMatch(/20 diseños de esta semana/i)
    }
    expect(h.state.insertCalls).toHaveLength(0)
  })

  it("allows the design just under the weekly quota", async () => {
    queueCounts(0, 0, 0, 19)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
    expect(h.state.insertCalls).toHaveLength(1)
  })

  it("counts generating and editing against the same weekly quota", async () => {
    queueCounts(0, 0, 0, 20)

    const result = await guardPublicImageGen(makeReq(), "design-edit")

    expect(result.allowed).toBe(false)
  })

  it("does NOT apply the weekly quota to accessory families like try-on", async () => {
    queueCounts(0, 0, 0, 999)

    const result = await guardPublicImageGen(makeReq(), "try-on")

    expect(result.allowed).toBe(true)
  })

  it("respects the PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR override", async () => {
    process.env.PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR = "3"
    queueCounts(0, 0, 0, 3)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.message).toMatch(/3 diseños/i)
  })

  it("PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR <= 0 disables the weekly quota entirely", async () => {
    process.env.PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR = "0"
    queueCounts(0, 0, 0, 5000)

    const result = await guardPublicImageGen(makeReq(), "generate-image")

    expect(result.allowed).toBe(true)
  })
})
