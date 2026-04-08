'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface BioEditorProps {
  currentBio: string
  onSave: (newBio: string) => Promise<void>
}

const MAX_CHARS = 500

export default function BioEditor({ currentBio, onSave }: BioEditorProps) {
  const [bio, setBio] = useState(currentBio)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value)
  }, [])

  const charCount = useMemo(
    () => ({
      current: bio.length,
      isExceeded: bio.length > MAX_CHARS,
    }),
    [bio]
  )

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = useCallback(async () => {
    if (!bio.trim()) {
      showToast('La bio no puede estar vacía.', 'error')
      return
    }
    setIsLoading(true)
    try {
      await onSave(bio)
      showToast('Bio actualizada correctamente.', 'success')
    } catch (error) {
      console.error('Failed to save bio:', error)
      showToast('Error al guardar la bio. Intentá de nuevo.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [bio, onSave])

  return (
    <Card className="w-full max-w-3xl bg-zinc-900 border-zinc-800 shadow-2xl">
      <CardContent className="p-6 space-y-6">
        {toast && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300'
                : 'border-red-500/30 bg-red-950/90 text-red-300'
            }`}
          >
            {toast.message}
          </div>
        )}

        <h2 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3">
          Bio del partner
        </h2>

        <div className="space-y-2">
          <Label htmlFor="bio-textarea" className="text-zinc-300">
            Descripción
          </Label>
          <Textarea
            id="bio-textarea"
            value={bio}
            onChange={handleChange}
            placeholder="Escribí una descripción que represente a tu marca..."
            className="min-h-[150px] bg-zinc-800 border-zinc-700 text-white focus-visible:ring-zinc-500 resize-y"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
          <span className={`text-sm ${charCount.isExceeded ? 'text-red-400 font-semibold' : 'text-zinc-400'}`}>
            {charCount.current} / {MAX_CHARS}
            {charCount.isExceeded && ' — excedido'}
          </span>

          <Button
            onClick={handleSave}
            disabled={isLoading || !bio.trim() || charCount.isExceeded}
            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar bio'
            )}
          </Button>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">Vista previa</h3>
          <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 whitespace-pre-wrap min-h-[100px]">
            {bio || <span className="text-zinc-500">Sin descripción...</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
