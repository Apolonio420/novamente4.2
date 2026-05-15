import { Metadata } from "next"
import SchedulerPageContent from "../tiktok/page"

export const metadata: Metadata = {
  title: "Scheduler de redes para marcas — Novamente",
  description:
    "Programá y publicá videos en tus redes sociales desde Novamente. Cada marca conecta su propia cuenta y publica drops, lookbooks y behind the scenes en su calendario.",
  alternates: { canonical: "https://www.novamente.ar/partners/scheduler" },
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/partners/scheduler",
    title: "Scheduler de redes para marcas — Novamente",
    description:
      "Programá y publicá videos en tus redes sociales desde Novamente. Multi-cuenta, multi-marca, calendario unificado.",
    images: [
      {
        url: "https://www.novamente.ar/novamente-logo.png",
        width: 1200,
        height: 630,
        alt: "Novamente — Scheduler de redes para marcas",
      },
    ],
    siteName: "Novamente",
    locale: "es_AR",
  },
}

export default function SchedulerPage() {
  return <SchedulerPageContent />
}
