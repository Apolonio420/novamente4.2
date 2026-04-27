"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calculator, Minus, Plus, ShoppingBag, MessageCircle,
  Palette, Truck, CheckCircle2, ArrowRight, Sparkles
} from "lucide-react"

const COTIZADOR_PRODUCTS = [
  { id: "buzo-hoodie", name: "Buzo Hoodie Oversize", price: 60000, category: "Hoodies" },
  { id: "buzo-hoodie", name: "Buzo Hoodie Oversize", price: 55000, category: "Buzos" },
  { id: "buzo-cuello", name: "Buzo Cuello Redondo", price: 43000, category: "Buzos" },
  { id: "aura-oversize", name: "Aura Oversize T-Shirt", price: 31000, category: "Remeras" },
  { id: "aldea-classic", name: "Aldea Classic Fit T-Shirt", price: 28600, category: "Remeras" },
  { id: "clasica-mujer", name: "Remera Clasica Mujer", price: 28600, category: "Remeras" },
  { id: "crop-mujer", name: "Remera Crop Mujer", price: 23500, category: "Remeras" },
  { id: "musculosa-bali", name: "Musculosa Bali", price: 21800, category: "Musculosas" },
]

function getDiscount(qty: number): number {
  if (qty >= 100) return 0.15
  if (qty >= 25) return 0.10
  if (qty >= 10) return 0.05
  return 0
}

function formatARS(n: number): string {
  return `$${Math.round(n).toLocaleString("es-AR")}`
}

export default function CotizadorCalculator() {
  const [selectedProduct, setSelectedProduct] = useState(COTIZADOR_PRODUCTS[3])
  const [quantity, setQuantity] = useState(10)

  const calc = useMemo(() => {
    const discount = getDiscount(quantity)
    const unitPrice = selectedProduct.price
    const discountedUnit = unitPrice * (1 - discount)
    const subtotal = unitPrice * quantity
    const total = discountedUnit * quantity
    const savings = subtotal - total
    return { discount, unitPrice, discountedUnit, subtotal, total, savings }
  }, [selectedProduct, quantity])

  const whatsappMessage = encodeURIComponent(
    `Hola! Quiero cotizar:\n` +
    `- Producto: ${selectedProduct.name}\n` +
    `- Cantidad: ${quantity} unidades\n` +
    `- Precio unitario: ${formatARS(calc.discountedUnit)}\n` +
    `- Total estimado: ${formatARS(calc.total)}\n` +
    (calc.discount > 0 ? `- Descuento: ${Math.round(calc.discount * 100)}% (ahorro ${formatARS(calc.savings)})\n` : "") +
    `\nMe gustaria confirmar disponibilidad y coordinar el pedido.`
  )

  return (
    <div className="space-y-8">
      {/* Product Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          1. Elegí tu producto
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COTIZADOR_PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedProduct.id === p.id
                  ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
              }`}
            >
              <div className="text-sm font-semibold text-white truncate">{p.name}</div>
              <div className="text-xs text-zinc-400 mt-1">{p.category}</div>
              <div className="text-amber-400 font-bold mt-2">{formatARS(p.price)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          2. Elegí la cantidad
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <Minus className="w-5 h-5 text-white" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
            className="w-24 h-12 text-center text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={() => setQuantity(Math.min(999, quantity + 1))}
            className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
          {/* Quick quantity buttons */}
          <div className="flex gap-2 ml-4">
            {[1, 10, 25, 50, 100].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quantity === q
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Discount Tiers */}
        <div className="flex gap-3 flex-wrap">
          {[
            { min: 10, max: 24, pct: 5 },
            { min: 25, max: 99, pct: 10 },
            { min: 100, max: null, pct: 15 },
          ].map((tier) => (
            <div
              key={tier.pct}
              className={`px-4 py-2 rounded-lg text-sm ${
                calc.discount === tier.pct / 100
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-zinc-800/50 border border-zinc-700 text-zinc-500"
              }`}
            >
              {tier.min}{tier.max ? `-${tier.max}` : "+"} un. = <span className="font-bold">{tier.pct}% OFF</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Tu Presupuesto</h3>
            {calc.discount > 0 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {Math.round(calc.discount * 100)}% OFF aplicado
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-zinc-400">
                <span>Producto</span>
                <span className="text-white font-medium">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Precio unitario</span>
                <span className="text-white">
                  {calc.discount > 0 && (
                    <span className="line-through text-zinc-500 mr-2">{formatARS(calc.unitPrice)}</span>
                  )}
                  {formatARS(calc.discountedUnit)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Cantidad</span>
                <span className="text-white font-medium">{quantity} un.</span>
              </div>
              {calc.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Ahorro total</span>
                  <span className="font-bold">-{formatARS(calc.savings)}</span>
                </div>
              )}
              <div className="border-t border-zinc-700 pt-3 flex justify-between">
                <span className="text-lg text-white font-semibold">Total estimado</span>
                <span className="text-2xl font-black text-amber-400">{formatARS(calc.total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                Estampado DTG premium incluido
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Palette className="w-4 h-4 text-purple-400 shrink-0" />
                Diseno con IA — colores ilimitados
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                Envio a todo el pais (desde $5.500)
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                Sin minimo de compra — desde 1 unidad
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              asChild
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-base font-semibold h-14"
            >
              <a
                href={`https://wa.me/5491162376081?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Pedir por WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-base font-semibold h-14"
            >
              <Link href="/design">
                <Palette className="w-5 h-5 mr-2" />
                Disenar Ahora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
