"use client"

import { useEffect, useRef, useState } from "react"
import { Star, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Review {
  id: string
  customer_name: string
  rating: number
  title: string | null
  body: string | null
  verified_purchase: boolean
  created_at: string
}

function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${i} estrellas`}
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= value ? "fill-amber-400 text-amber-400" : "text-zinc-500"}
          />
        </button>
      ))}
    </div>
  )
}

/** Lee un parámetro de la URL en el primer render (sin efecto: evita un repintado). */
function initialParam(key: string): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get(key)
}

export function ProductReviews({ tenantSlug, productId }: { tenantSlug: string; productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  // El link post-entrega trae ?review=1 (abre el formulario) y ?t=<token>
  // (compra verificada). Se leen en el primer render; como el componente
  // devuelve null hasta `loaded`, server y cliente pintan lo mismo y no hay
  // desajuste de hidratación.
  const [showForm, setShowForm] = useState(() => initialParam("review") === "1")
  const [token] = useState<string | null>(() => initialParam("t"))
  /** Lo dice el server en la respuesta del GET — no alcanza con que haya token. */
  const [tokenValid, setTokenValid] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [honeypot, setHoneypot] = useState("")

  const sectionRef = useRef<HTMLElement | null>(null)
  const scrolledRef = useRef(false)

  useEffect(() => {
    const qs = new URLSearchParams({ tenant: tenantSlug, product: productId })
    if (token) qs.set("t", token)
    fetch(`/api/public/reviews?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || [])
        setAvg(d.avg ?? null)
        setTokenValid(d.tokenValid === true)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [tenantSlug, productId, token])

  // Una vez montado con el formulario abierto por deep-link, llevamos la vista
  // hasta acá: el cliente llega desde el celular y la sección está al final.
  useEffect(() => {
    if (!loaded || !showForm || scrolledRef.current) return
    scrolledRef.current = true
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [loaded, showForm])

  const submit = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, productId, name, email, rating, body: text, token, website: honeypot }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Error")
      setSent(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  if (!loaded) return null

  return (
    <section ref={sectionRef} id="opiniones" className="mt-12 border-t border-white/10 pt-8 scroll-mt-24">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Opiniones</h2>
          {avg != null && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Stars value={Math.round(avg)} /> {avg} · {reviews.length} reseña{reviews.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {!showForm && !sent && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Escribir reseña
          </Button>
        )}
      </div>

      {sent ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 mb-6">
          ¡Gracias! Tu reseña se publica apenas la revise la marca.
        </div>
      ) : showForm ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 mb-6">
          {tokenValid && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tu reseña va a figurar como compra verificada
            </p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-300">Tu puntuación:</span>
            <Stars value={rating} size={22} onChange={setRating} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Tu nombre *" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <Input placeholder="Email (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </div>
          <textarea
            placeholder="Contanos qué te pareció (calidad, talle, estampa…)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1500}
            rows={3}
            className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          {/* honeypot: invisible para el usuario, los bots lo completan */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={sending || name.trim().length < 2} size="sm">
              {sending ? "Enviando…" : "Publicar reseña"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Todavía no hay reseñas de este producto. ¡Sé el primero en opinar!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size={14} />
                  <span className="text-sm font-medium">{r.customer_name}</span>
                  {r.verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Compra verificada
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {r.title && <p className="text-sm font-semibold mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
