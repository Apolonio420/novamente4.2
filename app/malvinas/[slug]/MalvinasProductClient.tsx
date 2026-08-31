"use client"

/**
 * UI de compra de un producto Malvinas. Usa Navbar/Footer globales del root
 * layout, el cartStore Zustand existente y rutea a /checkout (MercadoPago) —
 * mismo patrón que app/drops/[id]/DropClient.tsx. No toca el motor de pagos,
 * solo lo consume.
 */
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Zap, MessageCircle, Ruler, Check } from "lucide-react"
import { SIZE_CHARTS, type MalvinasProduct, type SizeChartKey } from "@/lib/malvinas-products"
import { getWhatsAppLink } from "@/lib/config/links"
import { ProductViewPixel } from "@/components/product-view-pixel"
import { SHIPPING, ENVIO_DISTANCIA } from "@/lib/shipping-config"

function formatPrice(p: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(p)
}

export default function MalvinasProductClient({ product }: { product: MalvinasProduct }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [colorIndex, setColorIndex] = useState(0)
  const [size, setSize] = useState<string>("")
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showLifestyle, setShowLifestyle] = useState(Boolean(product.lifestyle))

  const selectedColor = product.colors[colorIndex]
  const hasColors = product.colors.length > 1
  // Lo que no es ropa (lienzo, totebag) no tiene tabla de talles: usa sizeOptions
  // (medida + precio propio) en su lugar, ver interfaz MalvinasProduct.
  const isSizedByPrice = Boolean(product.sizeOptions && product.sizeOptions.length > 0)
  const sizeChart = isSizedByPrice ? undefined : SIZE_CHARTS[product.garmentType as SizeChartKey]
  const sizeLabel = product.sizeLabel ?? "Talle"
  const currentPrice = isSizedByPrice
    ? (product.sizeOptions!.find((o) => o.size === size)?.price ?? product.sizeOptions![0].price)
    : product.price
  const heroImg = showLifestyle && product.lifestyle ? product.lifestyle : selectedColor.image

  const ensureSizeSelected = (): boolean => {
    if (!size) {
      toast({
        title: `Elegí ${isSizedByPrice ? "una medida" : "un talle"}`,
        description: `Antes de seguir, marcá ${isSizedByPrice ? "tu medida" : "tu talle"} abajo.`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const buildCartItem = () => ({
    id: `malvinas-${product.slug}-${selectedColor.name}-${size}-${Date.now()}`,
    name: `${product.name} — Serie Malvinas`,
    garmentType: product.garmentType,
    color: selectedColor.name,
    size,
    price: currentPrice,
    quantity: qty,
    image: selectedColor.image,
    mockupUrl: selectedColor.image,
  })

  const handleAddToCart = () => {
    if (!ensureSizeSelected()) return
    setAdding(true)
    addItem(buildCartItem())
    toast({
      title: "Agregado al carrito",
      description: `${product.name} · ${selectedColor.name} · ${sizeLabel} ${size} · ${formatPrice(currentPrice * qty)}`,
    })
    setTimeout(() => setAdding(false), 800)
  }

  const handleBuyNow = () => {
    if (!ensureSizeSelected()) return
    addItem(buildCartItem())
    router.push("/checkout")
  }

  const waHref = getWhatsAppLink(
    `Hola Novamente! Tengo una duda sobre "${product.name}" de la Serie Malvinas (${selectedColor.name}). (ref · NV-MALVINAS-PDP)`
  )

  return (
    <>
    <ProductViewPixel id={product.slug} name={product.name} price={product.price} category="malvinas" />
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Link
          href="/malvinas#disenos"
          className="mb-6 inline-block text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
        >
          &larr; Volver a Serie Malvinas
        </Link>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Galería */}
          <div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white">
              <Image
                src={heroImg}
                alt={`${product.name} — ${selectedColor.name}, Serie Malvinas Novamente`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.lifestyle && (
                <button
                  type="button"
                  onClick={() => setShowLifestyle(true)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-zinc-900 ${
                    showLifestyle ? "border-white" : "border-transparent opacity-60"
                  }`}
                  aria-label="Ver foto lifestyle"
                >
                  <Image src={product.lifestyle} alt="Lifestyle" fill sizes="150px" className="object-cover" />
                </button>
              )}
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setColorIndex(i)
                    setShowLifestyle(false)
                  }}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-white ${
                    !showLifestyle && colorIndex === i ? "border-white" : "border-transparent opacity-60"
                  }`}
                  aria-label={`Ver color ${c.name}`}
                >
                  <Image src={c.image} alt={c.name} fill sizes="150px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info + Compra */}
          <div className="flex flex-col">
            <Badge className="w-fit bg-sky-400/10 text-sky-200 border border-sky-400/20">
              {product.collection} · Serie Malvinas
            </Badge>

            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">{product.garmentLabel}</p>

            <div className="mt-5 text-3xl font-bold">
              {/* "Desde" solo si hay más de una medida con precio distinto (lienzo). El totebag
                  tiene tamaño único: mostrar "Desde $20.900" ahí confunde. */}
              {isSizedByPrice && !size && product.sizeOptions!.length > 1 ? "Desde " : ""}
              {formatPrice(currentPrice)}
            </div>
            <p className="text-xs text-zinc-500">
              6 cuotas sin interés de {formatPrice(currentPrice / 6)} · Estampado DTG incluido
            </p>

            <p className="mt-6 leading-relaxed text-zinc-200">{product.blurb}</p>

            {/* Color */}
            {hasColors && (
              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Color</p>
                  <span className="text-xs text-zinc-400">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColorIndex(i)
                        setShowLifestyle(false)
                      }}
                      title={c.name}
                      aria-label={`Color ${c.name}`}
                      aria-pressed={colorIndex === i}
                      className={`relative h-12 w-12 rounded-full border-2 transition ${
                        colorIndex === i ? "border-white shadow-md scale-105" : "border-zinc-700 hover:border-zinc-400"
                      }`}
                      style={{ backgroundColor: c.code }}
                    >
                      {colorIndex === i && (
                        <span
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: c.code === "#f5f5f5" ? "#000" : "#fff" }}
                        >
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Talle / Medida */}
            <div className="mt-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">{sizeLabel}</p>
              <div className="flex flex-wrap gap-2">
                {isSizedByPrice
                  ? product.sizeOptions!.map((opt) => (
                      <button
                        key={opt.size}
                        type="button"
                        onClick={() => setSize(opt.size)}
                        className={`min-w-[5rem] rounded-md border px-4 py-2 text-sm font-semibold transition ${
                          size === opt.size
                            ? "border-white bg-white text-zinc-950"
                            : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
                        }`}
                        aria-pressed={size === opt.size}
                      >
                        {opt.size}
                      </button>
                    ))
                  : sizeChart!.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`min-w-[3rem] rounded-md border px-4 py-2 text-sm font-semibold transition ${
                          size === s
                            ? "border-white bg-white text-zinc-950"
                            : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
                        }`}
                        aria-pressed={size === s}
                      >
                        {s}
                      </button>
                    ))}
              </div>
              {/* Nota de ficha técnica: es propia de cada producto sin talle de ropa, NO de
                  "tiene sizeOptions" — con esa condición la del lienzo se colaba en el totebag. */}
              {product.garmentType === "lienzo-premium" && (
                <p className="mt-2 text-xs text-zinc-500">
                  Formato enrollado, listo para enmarcar o tensar · lienzo 100% algodón, impresión DTG.
                </p>
              )}
              {product.garmentType === "totebag" && (
                <p className="mt-2 text-xs text-zinc-500">
                  Lona de algodón crudo, asas largas para el hombro · impresión DTG.
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Cantidad</p>
              <div className="inline-flex items-center rounded-md border border-zinc-700">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-zinc-300 hover:bg-zinc-800"
                  aria-label="Restar"
                >
                  &minus;
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  className="px-4 py-2 text-zinc-300 hover:bg-zinc-800"
                  aria-label="Sumar"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleBuyNow} size="lg" className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100">
                <Zap className="mr-2 h-5 w-5" />
                Comprar ahora
              </Button>
              <Button
                onClick={handleAddToCart}
                size="lg"
                variant="outline"
                disabled={adding}
                className="flex-1 border-zinc-600 text-zinc-100 hover:bg-zinc-800"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {adding ? "Agregado" : "Agregar al carrito"}
              </Button>
            </div>

            {/* WhatsApp — discreto, solo para dudas */}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              ¿Dudas? Escribinos por WhatsApp
            </a>

            {/* Tabla de talles — solo prendas (el lienzo usa sizeOptions, sin tabla cm ancho/largo de ropa) */}
            {sizeChart && (
              <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-200">
                  <Ruler className="h-4 w-4 text-sky-300" />
                  Tabla de talles
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="px-2 py-2 text-left font-semibold">Talle</th>
                        <th className="px-2 py-2 text-center font-semibold">Ancho (cm)</th>
                        <th className="px-2 py-2 text-center font-semibold">Largo (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.sizes.map((s, i) => (
                        <tr key={s} className="border-b border-zinc-800/60 last:border-0">
                          <td className="px-2 py-2 font-bold text-zinc-100">{s}</td>
                          <td className="px-2 py-2 text-center text-zinc-300">{sizeChart.width[i]}</td>
                          <td className="px-2 py-2 text-center text-zinc-300">{sizeChart.length[i]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  * Las medidas pueden variar &plusmn;1 cm. Si dudás entre dos talles, elegí el más grande.
                </p>
                <a
                  href="/guia-de-talles-novamente.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200 transition-colors"
                >
                  <Ruler className="w-4 h-4" />
                  Descargar guía de talles completa (PDF)
                </a>
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">
              <div>
                <p className="font-semibold text-zinc-100">Producción DTG</p>
                <p className="mt-1">Estampa premium directo sobre la tela.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Sin stock</p>
                <p className="mt-1">Lo producimos cuando lo pedís.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Envíos AR</p>
                <p className="mt-1">
                  AMBA 3-5 días desde ${ENVIO_DISTANCIA.AMBA_MIN.toLocaleString("es-AR")} · resto 7-10 días.
                  Gratis desde ${SHIPPING.FREE_THRESHOLD.toLocaleString("es-AR")}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </>
  )
}
