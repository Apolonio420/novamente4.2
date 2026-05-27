'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, AlertTriangle, CheckCircle2, Loader2, Wand2, BookOpen, Package } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickDesignUploadProps {
  /** Called after the dialog/section is dismissed */
  onClose?: () => void
}

interface Warnings {
  noTransparency: boolean
  lowResolution: boolean
  lowResWidth?: number
  lowResHeight?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCEPT = 'image/png,image/svg+xml'
const MAX_BYTES = 10 * 1024 * 1024

function humanSize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

async function checkImageWarnings(file: File): Promise<Warnings> {
  const warnings: Warnings = { noTransparency: false, lowResolution: false }
  if (file.type === 'image/svg+xml') return warnings // SVG: skip checks

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (Math.max(w, h) < 1500) {
        warnings.lowResolution = true
        warnings.lowResWidth = w
        warnings.lowResHeight = h
      }

      // Check transparency via canvas (sample pixels)
      try {
        const canvas = document.createElement('canvas')
        const sampleSize = Math.min(w, h, 200)
        canvas.width = sampleSize
        canvas.height = sampleSize
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
          const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data
          let hasTransparent = false
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 240) { hasTransparent = true; break }
          }
          warnings.noTransparency = !hasTransparent
        }
      } catch {
        // canvas check failed silently
      }

      URL.revokeObjectURL(url)
      resolve(warnings)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(warnings) }
    img.src = url
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickDesignUpload({ onClose }: QuickDesignUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<Warnings | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setWarnings(null)
    setPreview(null)
    setFileName(null)
    setUploadedUrl(null)
  }

  const processFile = useCallback(async (file: File) => {
    resetState()

    // Format validation
    if (!['image/png', 'image/svg+xml'].includes(file.type)) {
      setError('Solo PNG o SVG. Otros formatos no están permitidos.')
      return
    }

    // Size validation
    if (file.size > MAX_BYTES) {
      setError(`Tu archivo pesa ${humanSize(file.size)}, el máximo es 10 MB.`)
      return
    }

    setFileName(file.name)

    // Generate preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Check warnings
    const w = await checkImageWarnings(file)
    setWarnings(w)

    // Upload
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', 'design')
      form.append('source', 'uploaded')

      const res = await authFetch('/api/partners/upload', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Error al subir el archivo.')
        setPreview(null)
        setFileName(null)
      } else {
        setUploadedUrl(json.url)
      }
    } catch {
      setError('Error de red al subir el archivo.')
      setPreview(null)
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleApplyMockup = () => {
    if (!uploadedUrl) return
    router.push(`/workspace/design-engine?uploadedDesignUrl=${encodeURIComponent(uploadedUrl)}`)
    onClose?.()
  }

  const handleSaveLibrary = () => {
    router.push('/workspace/design-library')
    onClose?.()
  }

  const handlePublishProduct = () => {
    if (!uploadedUrl) return
    router.push(`/workspace/catalog?prefilledDesignUrl=${encodeURIComponent(uploadedUrl)}`)
    onClose?.()
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Subí tu propio diseño</h3>
            <p className="text-xs text-zinc-500">PNG o SVG · máximo 10 MB</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop zone (only shown before upload) */}
      {!uploadedUrl && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors py-8 px-4 ${
            isDragging
              ? 'border-violet-500 bg-violet-500/5'
              : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/30'
          }`}
        >
          <Upload className="w-8 h-8 text-zinc-500" />
          <div className="text-center">
            <p className="text-sm text-zinc-300">Arrastrá tu archivo acá o <span className="text-violet-400 underline underline-offset-2">buscalo</span></p>
            <p className="text-xs text-zinc-600 mt-1">PNG · SVG · máx 10 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="flex flex-col items-center gap-3 py-6">
          {preview && (
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            Subiendo {fileName}…
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Warnings (non-blocking) */}
      {warnings && (warnings.noTransparency || warnings.lowResolution) && !error && (
        <div className="space-y-2">
          {warnings.noTransparency && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Tu diseño no tiene fondo transparente — se verá con el fondo del archivo sobre la prenda. Para mejor resultado, usá un PNG con fondo transparente.
              </p>
            </div>
          )}
          {warnings.lowResolution && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Tu diseño tiene baja resolución ({warnings.lowResWidth}×{warnings.lowResHeight}px). Para mejor calidad de impresión recomendamos 1500px o más en el lado largo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success: preview + 3 action buttons */}
      {uploadedUrl && !uploading && (
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="preview" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-100 truncate">{fileName}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Diseño subido. ¿Qué querés hacer?</p>
            </div>
          </div>

          {/* 3 action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleApplyMockup}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 p-3 transition-colors text-center"
            >
              <Wand2 className="w-5 h-5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">Aplicar a mockup</span>
              <span className="text-[10px] text-zinc-500 leading-tight">Elegí prenda y posición en el Studio</span>
            </button>

            <button
              onClick={handleSaveLibrary}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/60 p-3 transition-colors text-center"
            >
              <BookOpen className="w-5 h-5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">Guardar en Biblioteca</span>
              <span className="text-[10px] text-zinc-500 leading-tight">Queda guardado para reutilizar</span>
            </button>

            <button
              onClick={handlePublishProduct}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 p-3 transition-colors text-center"
            >
              <Package className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Publicar como producto</span>
              <span className="text-[10px] text-zinc-500 leading-tight">Abre el catálogo con el diseño cargado</span>
            </button>
          </div>

          {/* Upload another */}
          <button
            onClick={() => { resetState(); inputRef.current?.click() }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            Subir otro diseño
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  )
}
