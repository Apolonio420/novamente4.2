import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

// Mock supabaseAdmin con una cola de counts para simular las 3 consultas
// (minute, day-ip, day-global) que guardPublicImageGen dispara en paralelo
// via Promise.all — se evaluan sincronicamente en orden, asi que la cola
// respeta ese orden. Ver lib/partners/orders.test.ts para el mismo patron
// de vi.hoisted + vi.mock('@/lib/supabase-admin', ...) usado en el repo.
const h = vi.hoisted(() => {
  const state = {
    countQueue: [] as number[],
    forceError: false,
    insertCalls: [] as any[],
  }
  const chain: any = {
    from: () => chain,
    select: () => chain,
    eq: () => chain,
    gt: () =>
      Promise.resolve(
        state.forceError
          ? { data: null, error: { message: "db down" }, count: null }
          : { data: null, error: null, count: state.countQueue.shift() ?? 0 },
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

import { guardPublicImageGen } from "./public-image-guard"

function makeReq(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers({ "x-forwarded-for": "1.2.3.4", ...headers }) } as unknown as NextRequest
}

/** Encola [minuteCount, dayIpCount, dayGlobalCount] para la proxima llamada. */
function queueCounts(minute: number, dayIp: number, dayGlobal: number) {
  h.state.countQueue.push(minute, dayIp, dayGlobal)
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  h.state.countQueue = []
  h.state.forceError = false
  h.state.insertCalls = []
  process.env.PUBLIC_IMAGEGEN_ENABLED = "true"
  delete process.env.PUBLIC_IMAGEGEN_DAILY_CAP
  delete process.env.INTERNAL_API_SECRET
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
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
      expect(result.message).toMatch(/generacion de imagenes/i)
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
