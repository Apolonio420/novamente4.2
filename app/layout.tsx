import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
// Navbar, Footer, WhatsAppButton, PublicAssistantLoader, EmailCaptureLoader
// se renderizan ahora dentro de GlobalChrome (client) que decide si se muestran
// o no segun la ruta (se ocultan en /workspace/*).
import { GlobalChrome } from "@/components/GlobalChrome"
import { Toaster } from "@/components/Toaster"
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext"
import { Background } from "@/components/ui/Background"
import FacebookPixel from "@/components/FacebookPixel"
import GoogleAdsPixel from "@/components/GoogleAdsPixel"
import AttributionTracker from "@/components/AttributionTracker"
import { WebVitals } from "@/components/web-vitals"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.novamente.ar"),
  title: { default: "Novamente | Ropa personalizada con IA — Diseñá tu prenda en minutos", template: "%s · Novamente" },
  description:
    "Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Diseñá tu remera, hoodie o buzo en minutos con 37 estilos artísticos, estampado DTG premium y envíos a todo el país.",
  keywords: [
    "ropa personalizada",
    "remeras personalizadas Argentina",
    "diseño con IA",
    "indumentaria personalizada",
    "merchandising con IA",
    "estampado DTG",
    "hoodies personalizados",
    "remeras custom Buenos Aires",
    "diseño de indumentaria inteligencia artificial",
    "merch personalizado Argentina",
  ],
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/",
    title: "Novamente | Ropa personalizada con IA — Diseñá tu prenda en minutos",
    description: "La primera marca argentina de indumentaria personalizada con inteligencia artificial. 37 estilos artísticos, estampado DTG premium, envíos a todo el país.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Novamente — Ropa personalizada con inteligencia artificial" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente | Ropa personalizada con IA",
    description: "Diseñá tu remera, hoodie o buzo en minutos con inteligencia artificial. 37 estilos artísticos y estampado DTG premium.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/logo.png?v=3", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png?v=3",
    apple: "/logo.png?v=3",
  },
  alternates: { canonical: "https://www.novamente.ar/" },
  other: {
    "geo.region": "AR-B",
    "geo.placename": "Villa Martelli, Buenos Aires",
    "facebook-domain-verification": "sfeb3jb2brdts53tea9w908ipny7e0",
  },
}

// JSON-LD structured data for Organization + WebSite (site-wide)
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": "https://www.novamente.ar/#organization",
  name: "Novamente",
  url: "https://www.novamente.ar",
  logo: "https://www.novamente.ar/logo.png",
  image: "https://www.novamente.ar/novamente-logo.png",
  description: "Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Diseñá remeras, hoodies y buzos con 37 estilos artísticos y estampado DTG premium.",
  telephone: "+5492235169720",
  email: "contact@novamente.ar",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Villa Martelli",
    addressRegion: "Buenos Aires",
    postalCode: "1603",
    addressCountry: "AR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -34.5534,
    longitude: -58.5040,
  },
  areaServed: {
    "@type": "Country",
    name: "Argentina",
  },
  priceRange: "$21.800 - $55.000 ARS",
  currenciesAccepted: "ARS",
  paymentAccepted: "MercadoPago, Transferencia bancaria",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  sameAs: [
    "https://www.instagram.com/novamente.ar/",
    "https://x.com/Novamentear",
    "https://www.facebook.com/share/1CevJ8w7hK/",
    "https://wa.me/5492235169720",
  ],
  hasMerchantReturnPolicy: { "@id": "https://www.novamente.ar/#return-policy" },
  foundingDate: "2024",
  knowsAbout: [
    "Diseño de indumentaria con inteligencia artificial",
    "Estampado DTG (Direct to Garment)",
    "Merchandising personalizado",
    "Ropa personalizada on-demand",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "95",
    bestRating: "5",
    worstRating: "1",
  },
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    value: 5,
  },
  slogan: "Diseñá tu ropa personalizada con inteligencia artificial",
}

/**
 * MerchantReturnPolicy — va en el layout, NO en una página suelta.
 *
 * Todas las fichas de producto lo referencian por `@id`
 * (`hasMerchantReturnPolicy: { "@id": ".../#return-policy" }`), y una
 * referencia por @id solo resuelve si el nodo está en la MISMA página. Cuando
 * este nodo vivía solo en app/page.tsx, la referencia quedaba colgando en
 * /products, /malvinas, /buzos-egresados y las tiendas partner.
 */
const returnPolicyJsonLd = {
  "@context": "https://schema.org",
  "@type": "MerchantReturnPolicy",
  "@id": "https://www.novamente.ar/#return-policy",
  name: "Politica de devoluciones Novamente",
  applicableCountry: "AR",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 10,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.novamente.ar/#website",
  name: "Novamente",
  url: "https://www.novamente.ar",
  description: "Plataforma de indumentaria personalizada con IA. Diseñá tu prenda en minutos.",
  publisher: { "@id": "https://www.novamente.ar/#organization" },
  inLanguage: "es-AR",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.novamente.ar/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="facebook-domain-verification" content="sfeb3jb2brdts53tea9w908ipny7e0" />
        {/* LLMs.txt for AI discoverability */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt — AI-readable site summary" />
        <link rel="alternate" type="application/ld+json" href="/novamente-entity.json" title="Novamente entity profile" />
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fvsjvvyohaarivametxq.supabase.co" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.novamente.ar" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.mercadopago.com" />
        <link rel="dns-prefetch" href="https://pub-novamente.r2.dev" />
        {/* Preload LCP-critical resources */}
        <link rel="preload" as="image" href="/logo.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(returnPolicyJsonLd) }}
        />
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5PW4WF2B');`}
        </Script>
      </head>
      <body className={`min-h-screen bg-zinc-950 text-zinc-100 ${inter.className}`} suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5PW4WF2B"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-semibold">
          Saltar al contenido
        </a>
        <FacebookPixel />
        <GoogleAdsPixel />
        {/* Guarda los UTMs de la URL (last-touch, 30 días) para que el pedido
            sepa de qué campaña vino. No renderiza nada. */}
        <AttributionTracker />
        <WebVitals />
        <Background />
        <ImageHistoryProvider>
          {/* GlobalChrome oculta Navbar+Footer+flotantes para /workspace/*
              (el workspace tiene su propio chrome y necesita full-height sin
              capas extras que crean nested scrolls) */}
          <GlobalChrome>{children}</GlobalChrome>
          <Toaster />
        </ImageHistoryProvider>
      </body>
    </html>
  )
}
