'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Upload,
  Loader2,
  Video as VideoIcon,
  X,
  Calendar,
  Send,
  AlertCircle,
} from 'lucide-react'

const MAX_MB = 287
const ALLOWED = ['video/mp4', 'video/quicktime', 'video/webm']

export default function TikTokPostPage() {
  const router = useRouter()
  const params = useSearchParams()
  const initialMode = params.get('mode') === 'schedule' ? 'schedule' : 'now'

  const [mode, setMode] = useState<'now' | 'schedule'>(initialMode)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/partners/login?redirect=/workspace/integrations/tiktok/post'
        return
      }
      const res = await fetch('/api/partners/integrations/tiktok/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json().catch(() => ({ connected: false }))
      setConnected(Boolean(data?.connected))
    }
    check()
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFile(f: File | null) {
    setError(null)
    if (!f) return
    if (!ALLOWED.includes(f.type)) {
      setError('Formato no soportado. Usá mp4, mov o webm.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera ${MAX_MB}MB.`)
      return
    }
    setFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleSubmit() {
    if (!file) {
      setError('Subí un video primero.')
      return
    }
    if (mode === 'schedule' && !scheduledAt) {
      setError('Elegí día y hora para programar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión expirada')

      const fd = new FormData()
      fd.append('video', file)
      fd.append('caption', caption)
      fd.append('mode', mode)
      if (mode === 'schedule') fd.append('scheduled_at', new Date(scheduledAt).toISOString())

      const res = await fetch('/api/partners/integrations/tiktok/post', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      router.push('/workspace/integrations/tiktok?posted=1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar')
    } finally {
      setSubmitting(false)
    }
  }

  if (connected === false) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-200 mb-1">TikTok no está conectado</p>
            <p className="text-sm text-amber-200/70 mb-4">
              Conectá tu cuenta antes de publicar.
            </p>
            <Button asChild className="bg-violet-600 hover:bg-violet-700">
              <Link href="/workspace/integrations/tiktok">Ir a la integración</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/workspace/integrations/tiktok"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a TikTok
      </Link>

      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Publicar en TikTok</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Subí el video, escribí el caption y publicá ahora o programá para más tarde.
      </p>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/40 p-1 mb-6">
        <button
          onClick={() => setMode('now')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'now' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Send className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Publicar ahora
        </button>
        <button
          onClick={() => setMode('schedule')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'schedule' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Programar
        </button>
      </div>

      <div className="space-y-5">
        {/* Uploader */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Video</label>
          {!file ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/50 bg-zinc-900/40 p-10 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-300 mb-1">
                Arrastrá un video o <span className="text-violet-400">elegí un archivo</span>
              </p>
              <p className="text-xs text-zinc-500">mp4, mov o webm · hasta {MAX_MB}MB</p>
              <input
                ref={inputRef}
                type="file"
                accept={ALLOWED.join(',')}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex gap-4">
              <div className="w-32 aspect-[9/16] rounded-lg bg-black overflow-hidden shrink-0">
                {previewUrl && (
                  <video src={previewUrl} className="w-full h-full object-cover" controls muted />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <VideoIcon className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB · {file.type}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Quitar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Caption
            <span className="ml-2 text-xs font-normal text-zinc-500">
              {caption.length}/2200
            </span>
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
            rows={4}
            placeholder="Escribí el caption con #hashtags y @menciones…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none"
          />
        </div>

        {/* Scheduled at */}
        {mode === 'schedule' && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Hora local de Argentina. Mínimo 5 minutos en el futuro.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !file}
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : mode === 'now' ? (
              <Send className="w-4 h-4 mr-2" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            {submitting
              ? 'Procesando…'
              : mode === 'now'
                ? 'Publicar ahora'
                : 'Programar publicación'}
          </Button>
        </div>
      </div>
    </div>
  )
}
