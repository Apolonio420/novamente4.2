'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  type?: string
  label?: string
  className?: string
}

export function ImageUpload({ value, onChange, type = 'other', label, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await authFetch('/api/partners/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false)
    }
  }, [type, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium text-zinc-300">{label}</p>}

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt={label || 'Upload'}
            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            dragOver
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-zinc-500 mb-2" />
              <p className="text-xs text-zinc-500">Arrastrá o hacé click para subir</p>
              <p className="text-xs text-zinc-600 mt-1">JPG, PNG, WebP. Max 5MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
