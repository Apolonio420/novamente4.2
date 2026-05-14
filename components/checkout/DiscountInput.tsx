"use client"

import { useState } from "react"
import { Tag, Check, X, Loader2 } from "lucide-react"

interface DiscountInputProps {
  subtotal: number
  onApply: (data: { code: string; discountARS: number; finalARS: number; codeId: string; codeLabel: string }) => void
  onRemove: () => void
  applied: { code: string; discountARS: number; codeLabel: string } | null
}

export function DiscountInput({ subtotal, onApply, onRemove, applied }: DiscountInputProps) {
  const [code, setCode] = useState("")
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = async () => {
    if (!code.trim()) return
    setError(null)
    setValidating(true)
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }),
      })
      const data = await res.json()
      if (!data.valid) {
        setError(data.reason || "Codigo no valido")
        return
      }
      onApply({
        code: code.trim().toUpperCase(),
        discountARS: data.discountARS,
        finalARS: data.finalARS,
        codeId: data.codeId,
        codeLabel: data.codeLabel,
      })
      setCode("")
    } catch {
      setError("Error validando codigo")
    } finally {
      setValidating(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-bold tracking-wider text-emerald-300">{applied.code}</span>
          <span className="text-xs text-emerald-400/80">{applied.codeLabel}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1"
          aria-label="Quitar codigo"
        >
          <X className="w-3 h-3" />
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span className="text-xs text-zinc-400">Codigo de descuento</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleValidate()
            }
          }}
          placeholder="HOTSALE15"
          maxLength={32}
          className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          disabled={validating}
        />
        <button
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md border border-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
