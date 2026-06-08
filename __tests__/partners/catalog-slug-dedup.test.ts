import { describe, it, expect, beforeEach, vi } from "vitest"

/**
 * Regresión del bug "No se pudo crear el producto" (colisión de slug).
 *
 * partner_products tiene UNIQUE (tenant_id, slug). Antes, createProduct derivaba
 * el slug del nombre sin dedup: si el partner reusaba un nombre (reintento tras un
 * éxito no percibido, o dos productos legítimos con el mismo nombre) el insert
 * tiraba 23505 → createProduct devolvía null → 500 genérico.
 *
 * Ahora dedupea con sufijo (-2, -3, …) y reintenta una vez ante una carrera 23505.
 */

// Estado compartido con el mock (hoisted para que el factory de vi.mock lo vea).
const state = vi.hoisted(() => ({
  existingSlugs: [] as string[],
  inserted: [] as Array<{ slug: string; name: string }>,
  forceConflictOnce: false,
  conflictConsumed: false,
}))

vi.mock("@/lib/supabase-admin", () => {
  const builder: any = {
    _pendingInsert: null as null | { slug: string; name: string },
    from() { return builder },
    select() { return builder },
    eq() { return builder },
    // Terminal de generateUniqueSlug: devuelve los slugs existentes que matchean base%
    like(_col: string, pattern: string) {
      const base = pattern.replace(/%$/, "")
      const data = state.existingSlugs
        .filter((s) => s === base || s.startsWith(base))
        .map((slug) => ({ slug }))
      return Promise.resolve({ data, error: null })
    },
    insert(row: { slug: string; name: string }) {
      builder._pendingInsert = row
      return builder
    },
    async single() {
      const row = builder._pendingInsert!
      builder._pendingInsert = null
      // Simula una carrera 23505 en el primer insert si el test lo pide
      if (state.forceConflictOnce && !state.conflictConsumed) {
        state.conflictConsumed = true
        return { data: null, error: { code: "23505" } }
      }
      // Constraint UNIQUE (tenant_id, slug)
      if (state.existingSlugs.includes(row.slug)) {
        return { data: null, error: { code: "23505" } }
      }
      state.existingSlugs.push(row.slug)
      state.inserted.push(row)
      return { data: { id: `prod-${row.slug}`, ...row }, error: null }
    },
  }
  return { supabaseAdmin: builder }
})

import { createProduct } from "@/lib/partners/catalog"

describe("createProduct — dedup de slug", () => {
  beforeEach(() => {
    state.existingSlugs = []
    state.inserted = []
    state.forceConflictOnce = false
    state.conflictConsumed = false
  })

  it("primer producto usa el slug base del nombre", async () => {
    const p = await createProduct("tenant-1", { name: "Remera Boca Retro" })
    expect(p).not.toBeNull()
    expect(p!.slug).toBe("remera-boca-retro")
  })

  it("reusar el mismo nombre sufija -2, -3 en vez de chocar", async () => {
    const p1 = await createProduct("tenant-1", { name: "Remera Boca" })
    const p2 = await createProduct("tenant-1", { name: "Remera Boca" })
    const p3 = await createProduct("tenant-1", { name: "Remera Boca" })
    expect(p1!.slug).toBe("remera-boca")
    expect(p2!.slug).toBe("remera-boca-2")
    expect(p3!.slug).toBe("remera-boca-3")
    // Ninguno devolvió null → no más 500 por colisión
    expect([p1, p2, p3].every((p) => p !== null)).toBe(true)
  })

  it("ante una carrera 23505 reintenta con sufijo aleatorio y no devuelve null", async () => {
    state.forceConflictOnce = true
    const p = await createProduct("tenant-1", { name: "Remera Carrera" })
    expect(p).not.toBeNull()
    expect(p!.slug.startsWith("remera-carrera")).toBe(true)
  })

  it("nombre sin caracteres alfanuméricos cae en slug 'producto'", async () => {
    const p = await createProduct("tenant-1", { name: "★★★" })
    expect(p).not.toBeNull()
    expect(p!.slug).toBe("producto")
  })

  it("nombres legítimamente distintos conservan su propio slug base", async () => {
    const a = await createProduct("tenant-1", { name: "Buzo Oversize" })
    const b = await createProduct("tenant-1", { name: "Remera Clasica" })
    expect(a!.slug).toBe("buzo-oversize")
    expect(b!.slug).toBe("remera-clasica")
  })
})
