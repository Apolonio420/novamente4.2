"use client";

/**
 * UI client-side del drop. Usa Navbar/Footer globales del root layout,
 * el cartStore Zustand existente y rutea a /checkout (MercadoPago).
 */
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, ExternalLink, Check, Palette, Ruler } from "lucide-react";
import { type Drop, garmentLabel } from "./drop-types";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

// Tabla de talles — alineada con app/products/[id]/page.tsx (SIZE_CHARTS).
type SizeChart = { sizes: string[]; width: string[]; length: string[] };
const SIZE_CHARTS: Record<string, SizeChart> = {
  hoodie: {
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    width: ["64", "66", "68", "70", "72", "74"],
    length: ["67", "69", "71", "73", "75", "77"],
  },
  "remera-classic": {
    sizes: ["S", "M", "L", "XL", "XXL"],
    width: ["48", "52", "56", "58", "60"],
    length: ["63", "68", "72", "75", "77"],
  },
  "remera-oversize": {
    sizes: ["2XS", "XS", "S", "M", "L", "XL", "2XL"],
    width: ["55", "57", "59", "61", "63", "66", "69"],
    length: ["69", "71", "73", "75", "77", "79", "81"],
  },
};

function getSizeChartForGarment(garmentKey: string | null): SizeChart {
  if (!garmentKey) return SIZE_CHARTS["remera-classic"]!;
  if (garmentKey.startsWith("hoodie")) return SIZE_CHARTS.hoodie!;
  if (garmentKey.includes("oversize")) return SIZE_CHARTS["remera-oversize"]!;
  return SIZE_CHARTS["remera-classic"]!;
}

interface GarmentMeta {
  category: "remera" | "hoodie" | "musculosa";
  price: number;
  garmentType: string;
  colorEs: string;
}

/**
 * Mapeo del garmentKey del robot a producto real del catálogo (para precio,
 * categoría y tipo). Mantenido en sync con lib/catalog.ts.
 */
const GARMENT_META: Record<string, GarmentMeta> = {
  "tshirt-black":          { category: "remera",   price: 28600, garmentType: "aldea-classic-tshirt",   colorEs: "Negra" },
  "tshirt-white":          { category: "remera",   price: 28600, garmentType: "aldea-classic-tshirt",   colorEs: "Blanca" },
  "tshirt-caramel":        { category: "remera",   price: 28600, garmentType: "aldea-classic-tshirt",   colorEs: "Caramel" },
  "tshirt-black-oversize": { category: "remera",   price: 31000, garmentType: "aura-oversize-tshirt",   colorEs: "Negra (oversize)" },
  "tshirt-white-oversize": { category: "remera",   price: 31000, garmentType: "aura-oversize-tshirt",   colorEs: "Blanca (oversize)" },
  "hoodie-black":          { category: "hoodie",   price: 55000, garmentType: "buzo-hoodie-unisex",     colorEs: "Negro" },
  "hoodie-cream":          { category: "hoodie",   price: 55000, garmentType: "buzo-hoodie-unisex",     colorEs: "Crema" },
  "hoodie-gray":           { category: "hoodie",   price: 55000, garmentType: "buzo-hoodie-unisex",     colorEs: "Gris" },
  "hoodie-caramel":        { category: "hoodie",   price: 55000, garmentType: "buzo-hoodie-unisex",     colorEs: "Caramel" },
};

function formatPrice(p: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(p);
}

export default function DropClient({ drop }: { drop: Drop }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [activeImg, setActiveImg] = useState<"lifestyle" | "mockup" | "print">(
    drop.lifestyleUrl ? "lifestyle" : drop.mockupUrl ? "mockup" : "print",
  );
  const [usingDesign, setUsingDesign] = useState(false);
  const [adding, setAdding] = useState(false);

  const meta = GARMENT_META[drop.garmentKey ?? ""] ?? {
    category: "remera" as const,
    price: 28600,
    garmentType: "aldea-classic-tshirt",
    colorEs: "Negra",
  };
  const productName = garmentLabel(drop.garmentKey);

  const ensureSizeSelected = (): boolean => {
    if (!size) {
      toast({
        title: "Elegí un talle",
        description: "Antes de seguir, marcá tu talle abajo.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const buildCartItem = () => ({
    id: `drop-${drop.id}-${size}-${Date.now()}`,
    name: `${productName} · Drop ${drop.id.slice(-6).toUpperCase()}`,
    garmentType: meta.garmentType,
    color: meta.colorEs,
    size,
    price: meta.price,
    quantity: qty,
    image: drop.mockupUrl ?? drop.lifestyleUrl ?? "",
    mockupUrl: drop.mockupUrl ?? undefined,
    frontMockup: drop.mockupUrl ?? undefined,
  });

  const handleAddToCart = () => {
    if (!ensureSizeSelected()) return;
    setAdding(true);
    addItem(buildCartItem());
    toast({
      title: "Agregado al carrito",
      description: `${productName} · Talle ${size} · ${formatPrice(meta.price * qty)}`,
    });
    setTimeout(() => setAdding(false), 800);
  };

  const handleBuyNow = () => {
    if (!ensureSizeSelected()) return;
    addItem(buildCartItem());
    router.push("/checkout");
  };

  const heroImg =
    activeImg === "lifestyle" && drop.lifestyleUrl
      ? drop.lifestyleUrl
      : activeImg === "print" && drop.printUrl
      ? drop.printUrl
      : drop.mockupUrl ?? drop.lifestyleUrl ?? drop.printUrl ?? "";

  const sizeChart = getSizeChartForGarment(drop.garmentKey);

  const handleUseDesign = async () => {
    if (!drop.printUrl) {
      toast({
        title: "Diseño no disponible",
        description: "Este drop no tiene el print solo guardado.",
        variant: "destructive",
      });
      return;
    }
    setUsingDesign(true);
    try {
      const r = await fetch(`/api/drops/${drop.id}/use-design`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { imageId } = (await r.json()) as { imageId: string };
      router.push(`/design/${imageId}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "No pude abrir el diseñador",
        description: "Intentá de nuevo en un momento.",
        variant: "destructive",
      });
      setUsingDesign(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
        >
          ← Volver al sitio
        </Link>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* ── Galería ──────────────────────────────────────────── */}
          <div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-900">
              {heroImg ? (
                <Image
                  src={heroImg}
                  alt={drop.caption || productName}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={
                    activeImg === "lifestyle" ? "object-cover" : "object-contain p-4 bg-white"
                  }
                />
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {drop.lifestyleUrl ? (
                <button
                  onClick={() => setActiveImg("lifestyle")}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                    activeImg === "lifestyle" ? "border-white" : "border-transparent opacity-60"
                  }`}
                  aria-label="Vista lifestyle"
                >
                  <Image src={drop.lifestyleUrl} alt="Lifestyle" fill sizes="200px" className="object-cover" />
                </button>
              ) : null}
              {drop.mockupUrl ? (
                <button
                  onClick={() => setActiveImg("mockup")}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-zinc-900 ${
                    activeImg === "mockup" ? "border-white" : "border-transparent opacity-60"
                  }`}
                  aria-label="Packshot prenda"
                >
                  <Image src={drop.mockupUrl} alt="Packshot" fill sizes="200px" className="object-contain p-2" />
                </button>
              ) : null}
              {drop.printUrl ? (
                <button
                  onClick={() => setActiveImg("print")}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-white ${
                    activeImg === "print" ? "border-white" : "border-transparent opacity-60"
                  }`}
                  aria-label="Diseño solo"
                >
                  <Image src={drop.printUrl} alt="Diseño" fill sizes="200px" className="object-contain p-2" />
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Info + Compra ────────────────────────────────────── */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-400/10 text-amber-300 border border-amber-500/20">
                <Sparkles className="mr-1 h-3 w-3" /> Drop único · Generado con IA
              </Badge>
              {drop.tweetUrl ? (
                <a
                  href={drop.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                >
                  Ver en X <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              {productName}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Color: <span className="text-zinc-200">{meta.colorEs}</span>
            </p>

            <div className="mt-5 text-3xl font-bold">{formatPrice(meta.price)}</div>
            <p className="text-xs text-zinc-500">Cuotas con MercadoPago · Envíos a todo el país</p>

            <p className="mt-6 whitespace-pre-line leading-relaxed text-zinc-200">
              {drop.copy}
            </p>

            {drop.hashtags?.length ? (
              <p className="mt-3 text-sm text-zinc-500">
                {drop.hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            ) : null}

            {/* Talle */}
            <div className="mt-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Talle
              </p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] rounded-md border px-4 py-2 text-sm font-semibold transition ${
                      size === s
                        ? "border-white bg-white text-zinc-950"
                        : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Cantidad
              </p>
              <div className="inline-flex items-center rounded-md border border-zinc-700">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-zinc-300 hover:bg-zinc-800"
                  aria-label="Restar"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button
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
              <Button
                onClick={handleBuyNow}
                size="lg"
                className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Comprar ahora
              </Button>
              <Button
                onClick={handleAddToCart}
                size="lg"
                variant="outline"
                disabled={adding}
                className="flex-1 border-zinc-600 text-zinc-100 hover:bg-zinc-800"
              >
                {adding ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Agregado
                  </>
                ) : (
                  "Agregar al carrito"
                )}
              </Button>
            </div>

            {drop.printUrl ? (
              <Button
                onClick={handleUseDesign}
                disabled={usingDesign}
                size="lg"
                variant="outline"
                className="mt-3 w-full border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
              >
                <Palette className="mr-2 h-5 w-5" />
                {usingDesign ? "Abriendo diseñador…" : "Usar este diseño en otra prenda"}
              </Button>
            ) : null}

            {/* Tabla de talles */}
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-200">
                <Ruler className="h-4 w-4 text-amber-300" />
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
                * Las medidas pueden variar ±1 cm. Si dudás entre dos talles, elegí el más grande.
              </p>
              <a
                href="/guia-de-talles-novamente.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Ruler className="w-4 h-4" />
                Descargar guía de talles completa (PDF)
              </a>
            </div>

            <Link
              href="/design"
              className="mt-4 text-center text-sm text-zinc-400 hover:text-zinc-200"
            >
              ¿Querés diseñar el tuyo desde cero? Probá el creador con IA →
            </Link>

            <div className="mt-10 grid grid-cols-3 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">
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
                <p className="mt-1">AMBA en 3-5 días, resto del país 7-10.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
