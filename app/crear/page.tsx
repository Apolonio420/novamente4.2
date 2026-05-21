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
  // Snapshot del context cuando se generó el mockup actual.
  // Si garment/color/side actuales no coinciden, mostramos "stale".
  mockupGeneratedFor: {
    garmentType: string
    garmentColor: string
    side: "front" | "back"
    designUrl: string
  } | null
  designHistory: string[] // últimos 5 design URLs generados
  garmentType: string
  garmentColor: string
  side: "front" | "back"
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
  })
  const [tryOnOpen, setTryOnOpen] = useState(false)
  const cartCount = useCart((s) => s.items.length)
  const [socialProof, setSocialProof] = useState<{
    designsLast24h: number
    totalOrders: number
  } | null>(null)

  // Cargar social proof una vez al montar (cacheado 5min server-side)
  useEffect(() => {
    fetch("/api/public/social-proof")
      .then((r) => r.json())
      .then((d) => setSocialProof({ designsLast24h: d.designsLast24h ?? 0, totalOrders: d.totalOrders ?? 0 }))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-base font-semibold tracking-tight">Diseñá tu prenda</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              aria-label="Carrito"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTryOnOpen(true)}
              disabled={!session.currentMockupUrl}
              className="border-zinc-700"
            >
              <Camera className="mr-2 h-3.5 w-3.5" /> Try-on
            </Button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mx-auto max-w-7xl px-4 pb-3 flex gap-2 overflow-x-auto">
          <ModeTab active={mode === "chat"} onClick={() => setMode("chat")} icon={<Sparkles className="h-4 w-4" />}>
            Chat con IA
          </ModeTab>
          <ModeTab
            active={mode === "canvas"}
            onClick={() => setMode("canvas")}
            icon={<Pencil className="h-4 w-4" />}
            disabled={!session.currentDesignUrl}
          >
            Canvas
          </ModeTab>
          <ModeTab
            active={mode === "lifestyle"}
            onClick={() => setMode("lifestyle")}
            icon={<User className="h-4 w-4" />}
            disabled={!session.currentMockupUrl}
          >
            Lifestyle
          </ModeTab>
        </div>
      </div>

      {/* Trust signals bar — conversion booster: garantía + envío + cuotas + ARG */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-3 overflow-x-auto text-[11px] text-zinc-400">
          <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="text-green-400">✓</span> Si no te gusta, te lo rehacemos gratis
          </span>
          <span className="text-zinc-700">·</span>
          <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
            🚚 Envío BA $7.000 · Resto $9.000
          </span>
          <span className="text-zinc-700">·</span>
          <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
            💳 3 cuotas sin interés con Mercado Pago
          </span>
          <span className="text-zinc-700">·</span>
          <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
            🇦🇷 100% argentino · Producción a pedido
          </span>
          {/* Social proof real — solo mostrar si hay actividad relevante */}
          {socialProof && socialProof.designsLast24h >= 5 && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {socialProof.designsLast24h} diseños creados últimas 24h
              </span>
            </>
          )}
          {socialProof && socialProof.totalOrders >= 10 && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
                ⭐ +{socialProof.totalOrders} personas ya tienen su Novamente
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mode content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {mode === "chat" && <DesignChat session={session} setSession={setSession} />}
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

function ModeTab({
  active,
  onClick,
  icon,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "border-white bg-white text-zinc-950"
          : "border-zinc-700 bg-transparent text-zinc-300 hover:border-zinc-500"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
