import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    Check,
    Package,
    Palette,
    Rocket,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
} from "lucide-react"
import { WHATSAPP_MESSAGES, getWhatsAppLink } from "@/lib/config/links"
import StickyCTA from "@/components/merchs/StickyCTA"

export const metadata: Metadata = {
    title: "Lanzá tu marca de ropa gratis, sin stock",
    description:
        "Te damos un ecommerce con tu marca y producimos por vos. Vendés online, ganás margen real, sin stock. Activación gratis en el día.",
    openGraph: {
        title: "Lanzá tu marca de ropa gratis — Sin stock ni inversión | Novamente",
        description: "Tu marca, tu ecommerce, tu merch. Producimos y enviamos por vos.",
        images: ["/marketing/lifestyle/hero-otono-streetwear.webp"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Lanzá tu marca de ropa gratis — Novamente",
        description: "Tu marca, tu ecommerce, sin stock. Activación gratis.",
    },
    alternates: { canonical: "https://www.novamente.ar/merchs" },
}

const earningsExample = [
    { label: "Vendés una remera oversize a", value: "$39.900", muted: false },
    { label: "Costo Novamente (lo que nos pagás)", value: "$24.696", muted: true },
    { label: "Tu ganancia neta", value: "$15.204", muted: false, highlight: true },
]

const faqs = [
    {
        q: "¿Es gratis de verdad? ¿Dónde está la trampa?",
        a: "Sí, gratis. Vos ponés el diseño y la marca, nosotros ponemos la plataforma y la producción. Cobramos el costo de cada prenda solo cuando hay una venta. Si no vendés, no pagás nada.",
    },
    {
        q: "No tengo stock ni capital. ¿Cómo funciona?",
        a: "Esa es la idea. Tu cliente compra en tu tienda, nosotros producimos esa prenda específica, la imprimimos y la enviamos. Vos cobrás la venta y pagás solo el costo de producción. Cero stock, cero inversión inicial.",
    },
    {
        q: "¿Cuánto tardo en tener mi tienda online?",
        a: "Activamos tu cuenta el mismo día. En 24-48hs tenés tu storefront con tu logo, colores y los productos que elijas listo para vender.",
    },
    {
        q: "¿Y si no vendo nada el primer mes?",
        a: "No pasa nada. El plan Gratis no tiene mínimos ni cargos mensuales. Probás, ajustás, y cuando despegues escalás al plan que te sirva.",
    },
]

export default function MerchsPage() {
    return (
        <div className="bg-white min-h-screen">
            <StickyCTA />

            {/* HERO con form inline */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
                <div className="relative container mx-auto px-4 pt-8 pb-12 md:pt-14 md:pb-20">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start">
                        {/* Left: copy */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 mb-5 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Plan Gratis activo · sin tarjeta
                            </div>

                            <h1 className="novamente-heading text-4xl md:text-6xl mb-5 text-black leading-[1.05]">
                                Tu marca de ropa,{" "}
                                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    vendiendo en 48hs
                                </span>
                            </h1>

                            <p className="text-gray-700 text-lg md:text-xl mb-6 max-w-xl mx-auto lg:mx-0">
                                Te damos tu propio ecommerce y producimos cada venta por vos.{" "}
                                <span className="text-gray-900 font-semibold">
                                    Sin stock, sin inversión inicial, sin riesgo.
                                </span>
                            </p>

                            {/* Trust strip */}
                            <ul className="grid grid-cols-2 gap-2 max-w-md mx-auto lg:mx-0 mb-6 text-sm">
                                <li className="flex items-center gap-2 text-gray-700">
                                    <Check className="h-4 w-4 text-violet-600 shrink-0" />
                                    Tienda lista en 48hs
                                </li>
                                <li className="flex items-center gap-2 text-gray-700">
                                    <Check className="h-4 w-4 text-violet-600 shrink-0" />
                                    Producción on-demand
                                </li>
                                <li className="flex items-center gap-2 text-gray-700">
                                    <Check className="h-4 w-4 text-violet-600 shrink-0" />
                                    Envío a todo el país
                                </li>
                                <li className="flex items-center gap-2 text-gray-700">
                                    <Check className="h-4 w-4 text-violet-600 shrink-0" />
                                    Cobrás vos, directo
                                </li>
                            </ul>

                            {/* Mobile CTA — el form va abajo en mobile */}
                            <div className="lg:hidden">
                                <Link href="/partners/join">
                                    <Button
                                        size="lg"
                                        className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
                                    >
                                        Empezá gratis
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Tomá 30 segundos · sin tarjeta
                                </p>
                            </div>

                            {/* Para quién (avatar callout) */}
                            <div className="hidden lg:block mt-8 pt-6 border-t border-gray-200">
                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">
                                    Pensado para
                                </p>
                                <p className="text-gray-700">
                                    Creadores de contenido · marcas personales · comunidades · emprendedores · equipos · eventos
                                </p>
                            </div>
                        </div>

                        {/* Right: CTAs (desktop) + mockup */}
                        <div className="space-y-5">
                            <div className="hidden lg:flex flex-col sm:flex-row gap-3">
                                <Link href="/partners/join" className="flex-1">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
                                    >
                                        Empezá gratis
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                                <Link
                                    href={getWhatsAppLink(WHATSAPP_MESSAGES.PARTNER)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full h-14 text-base font-semibold bg-gray-900 border-gray-900 text-white hover:bg-gray-800 hover:text-white hover:border-gray-800"
                                    >
                                        Hablar con un asesor
                                    </Button>
                                </Link>
                            </div>
                            <p className="hidden lg:block text-xs text-gray-500 text-center">
                                ¿Ya tenés tu workspace?{" "}
                                <Link href="/login" className="text-violet-600 font-semibold hover:underline">
                                    Iniciá sesión
                                </Link>
                            </p>

                            <div className="hidden md:block relative">
                                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent blur-2xl" />
                                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                                    <Image
                                        src="/marketing/lifestyle/hero-otono-streetwear.webp"
                                        alt="Tu marca lista para vender"
                                        width={1200}
                                        height={700}
                                        priority
                                        className="aspect-[16/10] w-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cómo ganás plata — ejemplo concreto */}
            <section className="container mx-auto px-4 py-12 md:py-16">
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-2">
                        El modelo, en una mirada
                    </p>
                    <h2 className="novamente-heading text-3xl md:text-4xl text-gray-900">
                        Cómo se gana plata sin tocar stock
                    </h2>
                </div>

                <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-10 items-center max-w-5xl mx-auto">
                    {/* Card de ejemplo */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <p className="font-semibold text-gray-900">Ejemplo real por venta</p>
                        </div>
                        <ul className="space-y-3">
                            {earningsExample.map((row) => (
                                <li
                                    key={row.label}
                                    className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                                        row.highlight
                                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                                            : row.muted
                                              ? "bg-gray-50 text-gray-600"
                                              : "bg-gray-50 text-gray-900"
                                    }`}
                                >
                                    <span className="text-sm md:text-base">{row.label}</span>
                                    <span className="text-lg md:text-xl font-bold tabular-nums">
                                        {row.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Vos definís el precio. El margen lo elegís vos.
                        </p>
                    </div>

                    {/* Pasos del flujo */}
                    <ol className="space-y-4">
                        {[
                            {
                                t: "Tu cliente compra en tu tienda",
                                d: "Pagás $0 hasta que hay venta.",
                            },
                            {
                                t: "Nos pagás el costo con esa misma venta",
                                d: "Usás la plata de tu cliente. Cero inversión, cero riesgo.",
                            },
                            {
                                t: "Producimos y enviamos a tu cliente",
                                d: "Imprimimos en 24-48hs y te queda el margen completo.",
                            },
                        ].map((s, i) => (
                            <li key={i} className="flex gap-4">
                                <span className="shrink-0 w-9 h-9 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="font-semibold text-gray-900">{s.t}</p>
                                    <p className="text-gray-600 text-sm">{s.d}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Qué incluye gratis */}
            <section className="container mx-auto px-4 pb-12 md:pb-16">
                <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 md:p-10">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h2 className="novamente-heading text-2xl md:text-4xl text-gray-900 mb-2">
                            Todo esto en tu cuenta gratis
                        </h2>
                        <p className="text-gray-600">Sin contratos. Sin tarjeta. Sin trampa.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                icon: <Store className="h-5 w-5" />,
                                title: "Tu ecommerce",
                                desc: "Storefront con tu logo, colores y dominio.",
                            },
                            {
                                icon: <ShoppingBag className="h-5 w-5" />,
                                title: "Catálogo premium",
                                desc: "Remeras, buzos, gorras y más con tu diseño.",
                            },
                            {
                                icon: <Package className="h-5 w-5" />,
                                title: "Producción on-demand",
                                desc: "Producimos cada venta, sin mínimos ni stock.",
                            },
                            {
                                icon: <Palette className="h-5 w-5" />,
                                title: "Diseños con IA",
                                desc: "Generador incluido para acelerar tu marca.",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl bg-white border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition"
                            >
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 mb-3">
                                    {item.icon}
                                </div>
                                <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Garantías / risk reversal */}
            <section className="container mx-auto px-4 pb-12 md:pb-16">
                <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {[
                        {
                            icon: <ShieldCheck className="h-6 w-6" />,
                            title: "Cero riesgo",
                            desc: "Si no vendés, no pagás. Sin cargos mensuales.",
                        },
                        {
                            icon: <Truck className="h-6 w-6" />,
                            title: "Entregamos por vos",
                            desc: "Producción, packaging y envío a todo el país.",
                        },
                        {
                            icon: <Rocket className="h-6 w-6" />,
                            title: "Lista en 48hs",
                            desc: "Activación el mismo día. Tienda online en 2 días.",
                        },
                    ].map((g) => (
                        <div
                            key={g.title}
                            className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start gap-4"
                        >
                            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center">
                                {g.icon}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{g.title}</p>
                                <p className="text-sm text-gray-600">{g.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ — mata objeciones */}
            <section className="container mx-auto px-4 pb-12 md:pb-16">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="novamente-heading text-3xl md:text-4xl text-gray-900 mb-2">
                            Lo que casi todos preguntan
                        </h2>
                        <p className="text-gray-600">Las dudas reales antes de arrancar.</p>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <details
                                key={i}
                                className="group rounded-2xl border border-gray-200 bg-white p-5 open:border-violet-300 open:shadow-sm"
                            >
                                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                                    <span className="font-semibold text-gray-900">{f.q}</span>
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold group-open:rotate-45 transition-transform">
                                        +
                                    </span>
                                </summary>
                                <p className="text-gray-700 mt-3 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA final con form */}
            <section className="container mx-auto px-4 pb-16 md:pb-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-fuchsia-600 p-6 md:p-12 shadow-2xl shadow-violet-500/30">
                    <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,white,transparent_40%),radial-gradient(circle_at_70%_80%,white,transparent_40%)]" />
                    <div className="relative grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-12 items-center">
                        <div className="text-white text-center md:text-left">
                            <Rocket className="h-10 w-10 mb-4 mx-auto md:mx-0 opacity-90" />
                            <h2 className="novamente-heading text-3xl md:text-5xl mb-4 leading-tight">
                                Tu comunidad ya quiere usar tu marca
                            </h2>
                            <p className="text-white/90 text-base md:text-lg max-w-md mx-auto md:mx-0 mb-4">
                                Activá tu tienda gratis hoy. Si funciona, escalás. Si no, no perdiste nada.
                            </p>
                            <ul className="hidden md:block space-y-2 text-white/90">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Sin tarjeta de crédito
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Sin compromiso mensual
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Respuesta en el día
                                </li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <Link href="/partners/join" className="w-full">
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-base font-semibold bg-white text-violet-700 hover:bg-gray-100 shadow-lg"
                                >
                                    Empezá gratis
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                            <Link
                                href={getWhatsAppLink(WHATSAPP_MESSAGES.PARTNER)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full h-14 text-base font-semibold bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
                                >
                                    Hablar con un asesor
                                </Button>
                            </Link>
                            <p className="text-xs text-white/80 text-center">
                                ¿Ya tenés tu workspace?{" "}
                                <Link href="/login" className="text-white font-semibold underline">
                                    Iniciá sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mayorista — link discreto */}
            <section className="container mx-auto px-4 pb-16">
                <div className="border-t border-gray-200 pt-8 text-center">
                    <p className="text-sm text-gray-500">
                        ¿Necesitás merch por cantidad para empresa, equipo o evento?{" "}
                        <Link
                            href={getWhatsAppLink(WHATSAPP_MESSAGES.MAYORISTA)}
                            target="_blank"
                            className="text-violet-600 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                            Cotizar pedido mayorista
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </p>
                </div>
            </section>

            {/* Spacer para sticky CTA mobile */}
            <div className="md:hidden h-24" />
        </div>
    )
}
