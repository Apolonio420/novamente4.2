"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Pencil, User, Camera, ArrowLeft } from "lucide-react"

// Client-side only — Konva no funciona en SSR
const DesignChat = dynamic(() => import("./DesignChat").then(m => m.DesignChat), { ssr: false })
const DesignCanvas = dynamic(() => import("./DesignCanvas").then(m => m.DesignCanvas), { ssr: false })
const LifestylePanel = dynamic(() => import("./LifestylePanel").then(m => m.LifestylePanel), { ssr: false })
const TryOnModal = dynamic(() => import("./TryOnModal").then(m => m.TryOnModal), { ssr: false })

export type DesignSession = {
  sessionId: string | null
  currentDesignUrl: string | null
  currentMockupUrl: string | null
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
    currentMockupUrl: null,
    garmentType: "aldea_classic_fit",
    garmentColor: "negro",
    side: "front",
  })
  const [tryOnOpen, setTryOnOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-base font-semibold tracking-tight">Diseñá tu prenda</h1>
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
