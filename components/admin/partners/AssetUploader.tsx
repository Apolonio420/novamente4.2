"use client"

import { useRef, useState } from "react"

interface Props {
  label: string
  hint?: string
  partnerId: string
  assetType: "root" | "products"
  suggestedFilename?: string    // e.g. "logo.png" — overridable by user
  currentUrl?: string
  onUploaded: (url: string) => void
}

export default function AssetUploader({
  label,
  hint,
  partnerId,
  assetType,
  suggestedFilename,
  currentUrl,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!partnerId) {
      setError("Primero ingresá el slug del partner.")
      return
    }
    setError(null)
    setUploading(true)

    const filename = suggestedFilename ?? file.name

    const fd = new FormData()
    fd.append("file", file)
    fd.append("partnerId", partnerId)
    fd.append("assetType", assetType)
    fd.append("filename", filename)

    try {
      const res = await fetch("/api/admin/assets", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setPreview(data.url)
      onUploaded(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir")
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg p-4 cursor-pointer transition-colors group"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="preview"
              className="w-16 h-16 object-contain rounded bg-zinc-800"
              onError={() => setPreview(null)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 font-mono truncate">{preview}</p>
              <p className="text-xs text-zinc-600 mt-0.5 group-hover:text-zinc-400 transition-colors">
                Clic para reemplazar
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-zinc-500 text-sm">
              {uploading ? "Subiendo..." : "Arrastrá o hacé clic para subir"}
            </p>
            {suggestedFilename && (
              <p className="text-zinc-600 text-xs mt-1 font-mono">{suggestedFilename}</p>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-zinc-900/70 rounded-lg flex items-center justify-center">
            <span className="text-xs text-zinc-300 animate-pulse">Subiendo...</span>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
