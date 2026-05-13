"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Tag, Plus, Trash2, Power, PowerOff } from "lucide-react"

interface DiscountCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_ars: number
  max_uses: number | null
  uses_count: number
  starts_at: string
  ends_at: string | null
  active: boolean
  created_at: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('10')
  const [minPurchase, setMinPurchase] = useState('0')
  const [maxUses, setMaxUses] = useState('')
  const [endsAt, setEndsAt] = useState('')

  const load = () => {
    setLoading(true)
    authFetch('/api/partners/discounts')
      .then(r => r.json())
      .then(data => setCodes(data?.codes || []))
      .catch(() => setCodes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError(null)
    if (!code.trim()) {
      setError('El codigo es obligatorio')
      return
    }
    const value = parseFloat(discountValue)
    if (!isFinite(value) || value <= 0) {
      setError('El valor del descuento debe ser positivo')
      return
    }
    setCreating(true)
    try {
      const res = await authFetch('/api/partners/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          description: description.trim() || undefined,
          discount_type: discountType,
          discount_value: value,
          min_purchase_ars: parseFloat(minPurchase) || 0,
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error creando codigo')
        return
      }
      // Reset form
      setCode(''); setDescription(''); setDiscountValue('10'); setMinPurchase('0'); setMaxUses(''); setEndsAt('')
      load()
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (c: DiscountCode) => {
    await authFetch(`/api/partners/discounts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    load()
  }

  const handleDelete = async (c: DiscountCode) => {
    if (!confirm(`Borrar el codigo "${c.code}"?`)) return
    await authFetch(`/api/partners/discounts/${c.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-zinc-500">
          <Sparkles className="w-3 h-3" />
          Workspace
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Codigos de descuento</h1>
        <p className="text-sm text-zinc-400">
          Crea promociones para tu storefront. Los codigos se aplican manualmente por el cliente al
          checkout y descuentan del subtotal.
        </p>
      </header>

      {/* Create form */}
      <section className="mb-10 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Crear nuevo codigo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Codigo</Label>
            <Input id="code" placeholder="HOTSALE15" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={32} />
          </div>
          <div>
            <Label htmlFor="description">Descripcion (interna)</Label>
            <Input id="description" placeholder="Hot Sale Mayo 2026" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label>Tipo de descuento</Label>
            <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">Monto fijo (ARS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Valor</Label>
            <Input id="value" type="number" min="0" step={discountType === 'percentage' ? '1' : '100'} placeholder={discountType === 'percentage' ? '10' : '5000'} value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="min">Compra minima (ARS)</Label>
            <Input id="min" type="number" min="0" placeholder="0" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="maxUses">Maximo de usos (vacio = ilimitado)</Label>
            <Input id="maxUses" type="number" min="1" placeholder="100" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="endsAt">Vence el (opcional)</Label>
            <Input id="endsAt" type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creando...' : 'Crear codigo'}
          </Button>
        </div>
      </section>

      {/* List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Codigos activos</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-zinc-900 animate-pulse rounded-lg" />)}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-500">
            <Tag className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
            Todavia no creaste codigos. Empeza con uno arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map(c => (
              <article
                key={c.id}
                className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
                  c.active ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-950/50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <code className="text-lg font-bold tracking-widest">{c.code}</code>
                    <Badge variant={c.active ? 'default' : 'secondary'} className="text-[10px] uppercase">
                      {c.active ? 'Activo' : 'Pausado'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `-${fmt(c.discount_value)}`}
                    </Badge>
                  </div>
                  {c.description && <p className="text-sm text-zinc-400 mb-1">{c.description}</p>}
                  <p className="text-xs text-zinc-500">
                    {c.uses_count} / {c.max_uses ?? '∞'} usos
                    {c.min_purchase_ars > 0 && ` · min ${fmt(c.min_purchase_ars)}`}
                    {c.ends_at && ` · vence ${new Date(c.ends_at).toLocaleDateString('es-AR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleToggle(c)} title={c.active ? 'Pausar' : 'Activar'}>
                    {c.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-emerald-500" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} title="Borrar">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
