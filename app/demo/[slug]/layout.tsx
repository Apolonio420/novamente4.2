import type { Metadata } from "next"
import { DEMO_INFO } from "./demos"

// Fallback: el mismo asset que usa el layout raiz para openGraph/twitter
// (no hay logo/imagen propia por demo, asi que heredamos el default del sitio).
const DEFAULT_OG_IMAGE = "https://www.novamente.ar/novamente-logo.png"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const demo = DEMO_INFO[slug]

  if (!demo) {
    return {
      title: "Demo — Novamente",
      description: "Probá en vivo el asistente de IA de Novamente para atención por WhatsApp.",
    }
  }

  const title = `Demo — ${demo.name} · Novamente`
  const description = `Probá en vivo el asistente de IA de Novamente simulando a ${demo.name}. Chateá y mirá cómo respondería tu negocio por WhatsApp.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Novamente — Asistente de IA por WhatsApp" }],
      siteName: "Novamente",
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
