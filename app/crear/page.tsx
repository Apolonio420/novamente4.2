"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Pencil, User, Camera, ArrowLeft, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cartStore"

// Client-side only — Konva no funciona en SSR
const DesignChat = dynamic(() => import("./DesignChat").then(m => m.DesignChat), { ssr: false })
const DesignCanvas = dynamic(() => import("./DesignCanvas").then(m => m.DesignCanvas), { ssr: false })
const LifestylePanel = dynamic(() => import("./LifestylePanel").then(m => m.LifestylePanel), { ssr: false })
const TryOnModal = dynamic(() => import("./TryOnModal").then(m => m.TryOnModal), { ssr: false })

export type DesignSession = {
  sessionId: string | null
  currentDesignUrl: string | null
  frontDesignUrl: string | null
  backDesignUrl: string | null
  currentMockupUrl: string | null
  mockupGeneratedFor: {
    garmentType: string
    garmentColor: string
    side: "front" | "back"
    designUrl: string
  } | null
  designHistory: string[]
  garmentType: string
  garmentColor: string
  side: "front" | "back"
  printArea: "R1" | "R2" | "R3"
}

export type Mode = "chat" | "canvas" | "lifestyle"

export default function CrearPage() {
  const [mode, setMode] = useState<Mode>("chat")
  const [session, setSession] = useState<DesignSession>({
    sessionId: null,
    currentDesignUrl: null,
    frontDesignUrl: null,
    backDesignUrl: null,
    currentMockupUrl: null,
    mockupGeneratedFor: null,
    designHistory: [],
    garmentType: "aldea-classic-tshirt",
    garmentColor: "black",
    side: "front",
    printArea: "R2",
  })
  const [tryOnOpen, setTryOnOpen] = useState(false)
  const cartCount = useCart((s) => s.items.length)
  const [socialProof, setSocialProof] = useState<{
    designsLast24h: number
    totalOrders: number
  } | null>(null)
  // Prompt precargado desde la landing (?prompt=...) — leído de window para
  // evitar el requisito de Suspense de useSearchParams
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  // Imagen propia precargada desde la landing (?image=...) — diseño directo
  const [initialImage, setInitialImage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/public/social-proof")
      .then((r) => r.json())
      .then((d) => setSocialProof({ designsLast24h: d.designsLast24h ?? 0, totalOrders: d.totalOrders ?? 0 }))
      .catch(() => {})
    try {
      const sp = new URLSearchParams(window.location.search)
      const p = sp.get("prompt")
      if (p && p.trim().length >= 3) setInitialPrompt(p.trim().slice(0, 500))
      const img = sp.get("image")
      // Aceptamos URLs http(s) o rutas relativas same-origin (ej. /api/proxy-image?key=...)
      // que es lo que devuelve /api/public/design/upload.
      if (img && (/^https?:\/\//i.test(img) || img.startsWith("/"))) setInitialImage(img)
    } catch { /* noop */ }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ============================================================ */}
      {/* Top bar — modern, slim, gradient                              */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        {/* Subtle gradient overlay for modern feel */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-600/[0.06] to-transparent" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-4">
          {/* Row 1: nav + title + actions */}
          <div className="flex h-12 sm:h-14 items-center justify-between gap-2">
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="inline-flex items-center justify-center rounded-full p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 transition active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">
                Diseñá tu prenda
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/cart"
                aria-label="Carrito"
                className="relative inline-flex items-center justify-center rounded-full p-2 text-zinc-300 hover:text-white hover:bg-white/5 transition active:scale-95"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white ring-2 ring-zinc-950">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                aria-label="Try-on"
                onClick={() => setTryOnOpen(true)}
                disabled={!session.currentMockupUrl}
                className="inline-flex items-center justify-center rounded-full p-2 -mr-2 text-zinc-300 hover:text-white hover:bg-white/5 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Row 2: segmented control */}
          <div className="pb-2.5">
            <div
              role="tablist"
              aria-label="Modo de diseño"
              className="relative grid grid-cols-3 gap-1 rounded-full bg-zinc-900/80 ring-1 ring-white/5 p-1"
            >
              <SegTab
                active={mode === "chat"}
                onClick={() => setMode("chat")}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                label="Chat IA"
              />
              <SegTab
                active={mode === "canvas"}
                onClick={() => setMode("canvas")}
                icon={<Pencil className="h-3.5 w-3.5" />}
                label="Canvas"
                disabled={!session.currentDesignUrl}
              />
              <SegTab
                active={mode === "lifestyle"}
                onClick={() => setMode("lifestyle")}
                icon={<User className="h-3.5 w-3.5" />}
                label="Lifestyle"
                disabled={!session.currentMockupUrl}
              />
            </div>
          </div>
        </div>

        {/* Trust signals — single compact row, scrollable on mobile */}
        <div className="border-t border-white/5 bg-zinc-950/60">
          <div className="mx-auto max-w-7xl">
            <div
              className="flex items-center gap-4 overflow-x-auto px-3 sm:px-4 py-1.5 text-[10.5px] text-zinc-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
            >
              <span className="shrink-0 whitespace-nowrap" role="listitem">
                🇦🇷 100% argentino
              </span>
              <span className="shrink-0 whitespace-nowrap" role="listitem">
                🚚 Envío BA $7.000 · Resto $9.000
              </span>
              <span className="shrink-0 whitespace-nowrap" role="listitem">
                💳 Mercado Pago
              </span>
              {socialProof && socialProof.designsLast24h >= 5 && (
                <span className="shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap text-emerald-400" role="listitem">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {socialProof.designsLast24h} diseños · 24h
                </span>
              )}
              {socialProof && socialProof.totalOrders >= 10 && (
                <span className="shrink-0 whitespace-nowrap" role="listitem">
                  ⭐ +{socialProof.totalOrders} clientes
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mode content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        {mode === "chat" && <DesignChat session={session} setSession={setSession} initialPrompt={initialPrompt} initialImage={initialImage} />}
        {mode === "canvas" && <DesignCanvas session={session} setSession={setSession} />}
        {mode === "lifestyle" && <LifestylePanel session={session} />}
      </main>

      {/* Try-on modal */}
      {tryOnOpen && (
        <TryOnModal session={session} onClose={() => setTryOnOpen(false)} />
      )}
    </div>
  )
}

// ============================================================
// Segmented tab — modern pill inside container
// ============================================================
function SegTab({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="tab"
      onClick={onClick}
      disabled={disabled}
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
        active
          ? "bg-white text-zinc-950 shadow-lg shadow-black/20"
          : "text-zinc-400 hover:text-zinc-100 active:scale-[0.97]"
      }`}
    >
      <span className={active ? "text-zinc-950" : "text-zinc-500"}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
