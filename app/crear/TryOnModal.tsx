"use client"

import { useCallback, useRef, useState } from "react"
import { X, Upload, Loader2, RefreshCw, Download, ShoppingCart, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DesignSession } from "./page"

type Step = "consent" | "upload" | "result"

interface Props {
  session: DesignSession
  onClose: () => void
}

export function TryOnModal({ session, onClose }: Props) {
  const [step, setStep] = useState<Step>("consent")
  const [consentChecked, setConsentChecked] = useState(false)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [selfieR2Key, setSelfieR2Key] = useState<string | null>(null)
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  function handleFileSelect(file: File) {
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      setError("Solo se aceptan imágenes JPG o PNG")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5 MB")
      return
    }
    setError(null)
    setSelfieFile(file)
    setSelfiePreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  async function uploadSelfieToR2(file: File): Promise<{ r2Key: string; publicUrl: string }> {
    // Get a presigned upload URL from our own API
    const ext = file.type === "image/jpeg" ? "jpg" : "png"
    const key = `v1/selfies/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`

    const presignRes = await fetch("/api/public/design/presign-selfie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, contentType: file.type }),
    })

    if (!presignRes.ok) {
      // Fallback: upload via form (base64 inside body — only for small files)
      // Convert to base64 and pass directly to try-on endpoint isn't allowed per spec.
      // So we surface a clear error.
      throw new Error("No se pudo obtener URL de subida. Intentá nuevamente.")
    }

    const { uploadUrl, publicUrl } = await presignRes.json()

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    })
    if (!putRes.ok) throw new Error("Error subiendo la selfie")

    return { r2Key: key, publicUrl }
  }

  async function handleGenerate() {
    if (!selfieFile || !session.currentMockupUrl) return
    setLoading(true)
    setError(null)

    try {
      // 1. Upload selfie to R2
      const { r2Key, publicUrl: selfieUrl } = await uploadSelfieToR2(selfieFile)
      setSelfieR2Key(r2Key)

      // 2. Call try-on API
      const res = await fetch("/api/public/design/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl,
          mockupUrl: session.currentMockupUrl,
          consentGiven: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.tryOnUrl) {
        throw new Error(data.error || "Error generando try-on")
      }

      setTryOnUrl(data.tryOnUrl)
      setStep("result")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    setTryOnUrl(null)
    setStep("upload")
  }

  async function handleDownload() {
    if (!tryOnUrl) return
    const link = document.createElement("a")
    link.href = tryOnUrl
    link.download = `novamente-tryon-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleBuy() {
    // Close modal — focus on cart button in the chat panel
    onClose()
    // Small delay to let the modal close before trying to scroll/focus
    setTimeout(() => {
      const cartBtn = document.querySelector<HTMLButtonElement>("[data-add-to-cart]")
      if (cartBtn) {
        cartBtn.scrollIntoView({ behavior: "smooth", block: "center" })
        cartBtn.focus()
      }
    }, 300)
  }

  async function cleanup() {
    if (selfieR2Key) {
      // Best-effort deletion — don't block close on this
      fetch(`/api/public/design/cleanup-selfie?key=${encodeURIComponent(selfieR2Key)}`, {
        method: "DELETE",
      }).catch(() => {})
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold">Probate la remera</h2>
          <button
            onClick={cleanup}
            className="text-zinc-400 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6">
          {/* STEP 1 — Consent */}
          {step === "consent" && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Para mostrarte cómo te queda esta remera, necesitamos procesar una foto tuya.
                La imagen se procesa con IA (Gemini de Google) y se elimina al cerrar esta
                ventana. No la usamos para entrenar modelos ni la compartimos con terceros.
              </p>
              <p className="text-xs text-zinc-500">
                Tu privacidad está protegida bajo la{" "}
                <a
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-300"
                >
                  Política de Privacidad
                </a>{" "}
                y la Ley 25.326 de Protección de Datos Personales (Argentina).
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setConsentChecked((v) => !v)}
                  className="mt-0.5 text-zinc-300 shrink-0"
                  aria-checked={consentChecked}
                  role="checkbox"
                >
                  {consentChecked ? (
                    <CheckSquare className="h-5 w-5 text-white" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <span className="text-sm text-zinc-300">
                  Acepto el procesamiento de mi imagen con fines de visualización de productos
                  (Ley 25.326)
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-700"
                  onClick={cleanup}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100"
                  disabled={!consentChecked}
                  onClick={() => setStep("upload")}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 — Upload selfie */}
          {step === "upload" && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-400">
                Subí una foto tuya (de frente, con buena luz) y la IA va a ponerte la remera
                encima.
              </p>

              {/* Drop zone */}
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition ${
                  selfiePreview
                    ? "border-zinc-600"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                {selfiePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selfiePreview}
                    alt="Selfie preview"
                    className="max-h-52 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-zinc-500" />
                    <p className="text-sm text-zinc-400 text-center">
                      Arrastrá una foto o hacé click para seleccionar
                    </p>
                    <p className="text-xs text-zinc-600">JPG o PNG · máx. 5 MB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button
                className="w-full bg-white text-zinc-950 hover:bg-zinc-100"
                disabled={!selfieFile || loading}
                onClick={handleGenerate}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Generar try-on"
                )}
              </Button>
            </div>
          )}

          {/* STEP 3 — Result */}
          {step === "result" && tryOnUrl && (
            <div className="space-y-5">
              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-500 text-center">Antes</p>
                  {selfiePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selfiePreview}
                      alt="Selfie original"
                      className="w-full rounded-lg object-cover aspect-square"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-500 text-center">Después</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tryOnUrl}
                    alt="Try-on resultado"
                    className="w-full rounded-lg object-cover aspect-square"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-sm"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Regenerar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Descargar
                  </Button>
                </div>
                <Button
                  className="w-full bg-white text-zinc-950 hover:bg-zinc-100 text-sm"
                  onClick={handleBuy}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  Comprar esta remera
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
