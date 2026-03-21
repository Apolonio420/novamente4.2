"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Gift, Loader2, Check, Mail } from "lucide-react"

const STORAGE_KEY = "nvm_email_popup"
const DISMISS_DAYS = 7
const SUBMITTED_DAYS = 90
const SHOW_DELAY_MS = 15000 // 15 seconds

function isDismissed(): boolean {
  if (typeof window === "undefined") return true
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false
  try {
    const { until } = JSON.parse(raw)
    return Date.now() < until
  } catch {
    return false
  }
}

function setDismissed(days: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ until: Date.now() + days * 86400000 })
  )
}

export function EmailCapturePopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (isDismissed()) return
    // Don't show on workspace/admin pages
    if (window.location.pathname.startsWith("/workspace") || window.location.pathname.startsWith("/admin")) return

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const close = useCallback((days: number) => {
    setVisible(false)
    setDismissed(days)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "popup_10off" }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al registrar")
      }

      setStatus("success")
      setDismissed(SUBMITTED_DAYS)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Intenta de nuevo")
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Obtene 10% de descuento"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => close(DISMISS_DAYS)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

          {/* Close button */}
          <button
            onClick={() => close(DISMISS_DAYS)}
            className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 pt-8 text-center">
            {status === "success" ? (
              /* Success state */
              <div className="space-y-4 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Listo, tu descuento esta en camino
                </h3>
                <p className="text-sm text-zinc-400">
                  Revisa tu email para tu codigo de <span className="text-green-400 font-semibold">10% OFF</span>.
                  Usalo en tu proxima compra.
                </p>
                <button
                  onClick={() => close(SUBMITTED_DAYS)}
                  className="mt-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  Empezar a disenar
                </button>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20">
                  <Gift className="h-7 w-7 text-violet-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                  10% OFF en tu primera compra
                </h3>
                <p className="text-sm text-zinc-400 mb-5">
                  Dejanos tu email y te enviamos el codigo de descuento.
                  Valido para cualquier prenda personalizada.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-xs text-red-400">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Quiero mi 10% OFF"
                    )}
                  </button>
                </form>

                <p className="mt-3 text-xs text-zinc-500">
                  Sin spam. Solo ofertas y novedades de Novamente.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
