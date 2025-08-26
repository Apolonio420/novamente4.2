import { cookies } from "next/headers"
import { randomUUID } from "crypto"

const COOKIE = "anon_id"

export function getOrCreateAnonIdServer() {
  const store = cookies()
  const existing = store.get(COOKIE)?.value
  if (existing) return existing
  const id = randomUUID()
  store.set(COOKIE, id, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return id
}
