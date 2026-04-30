import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Sparkles, Eye, Shield, Users, BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: "TikTok Scheduler para creadores de moda — Novamente Studio",
  description:
    "Programá y publicá videos de moda en TikTok desde Novamente Studio. Cada marca conecta su propia cuenta y publica drops, lookbooks y behind the scenes en su calendario.",
  alternates: { canonical: "https://www.novamente.ar/partners/tiktok" },
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/partners/tiktok",
    title: "TikTok Scheduler para creadores de moda — Novamente Studio",
    description:
      "Programá y publicá videos de moda en TikTok desde Novamente Studio. Multi-cuenta, multi-marca, calendario unificado.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Novamente Studio TikTok Scheduler" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
}

const FEATURES = [
  {
    icon: Calendar,
    title: "Programación de videos",
    description:
      "Subí tu video, escribí el caption y elegí cuándo publica. El video sale solo a la hora pactada en tu cuenta.",
  },
  {
    icon: Users,
    title: "Multi-cuenta para tu marca",
    description:
      "Conectá la cuenta de TikTok de tu marca, de tu equipo, o varias cuentas si manejás más de un proyecto. Cada cuenta es independiente.",
  },
  {
    icon: Sparkles,
    title: "Generación con IA opcional",
    description:
      "Si lo querés, generá videos cortos automáticamente desde tus mockups y prendas. O subí los tuyos.",
  },
  {
    icon: BarChart3,
    title: "Métricas básicas",
    description:
      "Vistas, likes y comentarios de cada post programado, en un dashboard simple.",
  },
  {
    icon: Eye,
    title: "Vista previa antes de publicar",
    description:
      "Aprobás cada video desde el dashboard antes de que salga, o lo dejás en piloto automático si querés.",
  },
  {
    icon: Shield,
    title: "Tus tokens son tuyos",
    description:
      "Conectás vos tu cuenta vía OAuth oficial de TikTok. Podés desconectarla cuando quieras desde tu workspace.",
  },
]

export default function TikTokSchedulerPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="border-b bg-gradient-to-b from-violet-50 to-white">
        <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
          <Badge className="mb-4 bg-violet-100 text-violet-700 hover:bg-violet-100">
            Novamente Studio · Integración oficial TikTok
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            TikTok scheduling para marcas de moda argentinas
          </h1>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto mb-8">
            Programá tus drops, lookbooks y videos behind the scenes en TikTok directamente desde tu workspace de
            Novamente. Cada marca conecta su propia cuenta de TikTok y publica en su feed con un calendario unificado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700">
              <Link href="/partners/join">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/partners/login">Ya tengo cuenta — entrar</Link>
            </Button>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            Tier gratuito disponible. Conexión oficial con TikTok vía OAuth — sin compartir tu contraseña.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-12">Para quién es esto</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Marcas de ropa independientes</h3>
            <p className="text-sm text-zinc-600">
              Si tenés tu propia marca y usás TikTok para mostrar drops, fittings o detrás de escena —
              programá todo desde un solo lugar.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Creadores y diseñadores</h3>
            <p className="text-sm text-zinc-600">
              Diseñás prendas custom o capsule drops. Subí tus videos, programá el lanzamiento, y enfocate en
              crear sin tener que estar pendiente del horario de publicación.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Equipos pequeños</h3>
            <p className="text-sm text-zinc-600">
              Una persona programa, otra revisa. Calendar compartido, aprobación opcional. Cada cuenta de
              TikTok queda atada al usuario que la conectó.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 border-y">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Qué incluye</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-lg p-6 border">
                <f.icon className="h-8 w-8 text-violet-600 mb-3" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-8">Cómo funciona</h2>
        <ol className="space-y-6">
          {[
            { n: 1, t: "Creá tu cuenta en Novamente Studio", d: "Sign-up con email y contraseña en /partners/join. Es gratis para arrancar." },
            { n: 2, t: "Conectá tu TikTok", d: "Dentro de tu workspace, vas a Integraciones → TikTok → Conectar. Te lleva a la pantalla oficial de TikTok donde autorizás permisos." },
            { n: 3, t: "Subí o generá tu video", d: "Subís el .mp4 directamente o usás nuestro generador de videos a partir de tus mockups." },
            { n: 4, t: "Programá la publicación", d: "Elegís fecha y hora, escribís el caption, y listo. El video sale solo en tu cuenta a esa hora." },
            { n: 5, t: "Mirá los resultados", d: "El dashboard muestra qué se publicó, vistas y engagement básico." },
          ].map((s) => (
            <li key={s.n} className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center">
                {s.n}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{s.t}</h3>
                <p className="text-sm text-zinc-600">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-violet-600 text-white">
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Empezá hoy, gratis</h2>
          <p className="text-lg text-violet-100 mb-8">
            Tier free incluye 1 cuenta de TikTok conectada y hasta 5 publicaciones programadas por mes.
            Sin tarjeta requerida.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/partners/join">
              Crear cuenta gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Novamente Studio es una plataforma de Novamente SAS. La integración de TikTok cumple con los{" "}
          <Link href="https://www.tiktok.com/legal/page/global/terms-of-service/en" className="underline">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="https://www.tiktok.com/legal/page/global/privacy-policy/en" className="underline">
            Política de Privacidad
          </Link>{" "}
          de TikTok. Mirá nuestros{" "}
          <Link href="/terminos" className="underline">
            términos
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="underline">
            privacidad
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
