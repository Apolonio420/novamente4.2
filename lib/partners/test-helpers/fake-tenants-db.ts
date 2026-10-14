// Supabase falso (solo tabla `tenants`, una fila) para tests de concurrencia.
// Cada operación cede el control UNA vez (microtask) entre que se emite y que
// se resuelve, así dos llamadas lanzadas con Promise.all se entrelazan como dos
// webhooks reales: ambas leen antes de que cualquiera escriba. La lectura toma
// su snapshot al EMITIRSE (como un SELECT que ya corrió en la DB) y el UPDATE
// evalúa filtros y aplica el cambio en un único paso síncrono (como un UPDATE
// atómico por fila de Postgres).
export interface FakeTenantStore { tenant: any }

export function createFakeSupabase(store: FakeTenantStore) {
  const tick = () => Promise.resolve().then(() => {})
  return {
    from: () => ({
      select: (_cols?: string) => {
        const snapshot = store.tenant ? structuredClone(store.tenant) : null
        const q: any = {
          eq: () => q,
          single: async () => { await tick(); return { data: snapshot, error: null } },
          maybeSingle: async () => { await tick(); return { data: snapshot, error: null } },
        }
        return q
      },
      update: (u: any) => {
        const filters: Array<[string, any]> = []
        let wantRows = false
        const run = async () => {
          await tick()
          const t = store.tenant
          const ok = !!t && filters.every(([col, val]) => (col === 'id' ? true : (t[col] ?? null) === val))
          if (ok) store.tenant = { ...t, ...structuredClone(u) }
          return { data: wantRows ? (ok ? [{ id: t.id }] : []) : null, error: null }
        }
        const q: any = {
          eq: (col: string, val: any) => { filters.push([col, val]); return q },
          is: (col: string, val: any) => { filters.push([col, val]); return q },
          select: () => { wantRows = true; return q },
          then: (res: any, rej: any) => run().then(res, rej),
        }
        return q
      },
    }),
  }
}
