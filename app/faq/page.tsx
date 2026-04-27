export const revalidate = 86400 // ISR: revalidate daily

import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Preguntas Frecuentes — Ropa personalizada con IA",
  description:
    "Respondemos todas tus dudas sobre Novamente: precios, envíos, diseño con inteligencia artificial, estampado DTG, pedidos mayoristas y más. Indumentaria personalizada en Argentina.",
  openGraph: {
    title: "FAQ — Novamente | Ropa personalizada con IA",
    description: "Todo lo que necesitás saber sobre ropa personalizada con inteligencia artificial en Argentina.",
    url: "https://www.novamente.ar/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Novamente | Ropa personalizada con IA",
    description: "Todo lo que necesitás saber sobre ropa personalizada con inteligencia artificial en Argentina.",
  },
  alternates: { canonical: "https://www.novamente.ar/faq" },
}

const FAQ_ITEMS = [
  {
    category: "Sobre Novamente",
    questions: [
      {
        q: "¿Qué es Novamente?",
        a: "Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Fundada en 2024, permite a cualquier persona diseñar remeras, hoodies, buzos, musculosas y lienzos usando 37 estilos artísticos generados por IA. Producimos on-demand con estampado DTG premium y enviamos a todo el país. Más de 1.200 diseños creados por más de 95 clientes satisfechos.",
      },
      {
        q: "¿Dónde están ubicados?",
        a: "Nuestra base de operaciones está en Villa Martelli, Buenos Aires, Argentina (CP 1603). Desde ahí producimos y despachamos todos los pedidos a nivel nacional.",
      },
      {
        q: "¿Qué diferencia a Novamente de otras marcas de ropa personalizada?",
        a: "Novamente es la única marca en Argentina que combina diseño con inteligencia artificial, estampado DTG premium y producción on-demand. No necesitás saber diseñar: describís tu idea, elegís un estilo artístico y la IA genera un diseño profesional en menos de 30 segundos. Además, no hay mínimos de cantidad ni stock — cada prenda se produce al pedido.",
      },
    ],
  },
  {
    category: "Diseño con IA",
    questions: [
      {
        q: "¿Cómo funciona el diseño con inteligencia artificial?",
        a: "El proceso tiene 3 pasos simples: 1) Describís tu idea en texto (por ejemplo: 'un lobo cósmico con galaxias'). 2) Elegís uno de los 37 estilos artísticos disponibles (watercolor, pixel art, anime, street art, minimalista, entre otros). 3) Nuestra IA Nano Banana 2 genera un diseño vectorial optimizado para estampado textil en menos de 30 segundos. No necesitás conocimientos de diseño gráfico.",
      },
      {
        q: "¿Cuántos estilos artísticos hay disponibles?",
        a: "Tenemos 37 estilos artísticos disponibles, incluyendo: Watercolor, Pixel Art, Anime, Street Art, Pop Art, Minimalista, Retro/Vintage, Graffiti, Art Nouveau, Cyberpunk, Psychedelic, Geometric, Tribal, Art Deco, Botanical y muchos más. Cada estilo está optimizado para producir diseños que se ven espectaculares en estampado textil.",
      },
      {
        q: "¿Puedo subir mi propio diseño en vez de usar la IA?",
        a: "Sí, además del generador con IA podés subir tu propia imagen o logo. El sistema detecta automáticamente si querés hacer una estampa con tu imagen y la adapta para estampado DTG. Es ideal para logos de empresas, ilustraciones propias o fotografías.",
      },
      {
        q: "¿El diseño generado es único?",
        a: "Sí, cada diseño generado por la IA es completamente único y original. No se repiten diseños entre clientes. El diseño es tuyo una vez que lo generás.",
      },
    ],
  },
  {
    category: "Productos y precios",
    questions: [
      {
        q: "¿Qué productos ofrecen?",
        a: "Nuestro catálogo incluye: Hoodies Oversize (Buzos Hoodie Unisex (desde $55.000), Buzos Cuello Redondo/Crewneck (desde $43.000), Remeras Oversize Aura (desde $31.000), Remeras Classic Fit Aldea (desde $28.600), Remeras Crop Mujer (desde $23.500), Remeras Clásicas Mujer (desde $28.600), Musculosas Bali (desde $21.800) y Lienzos Premium ($59.900). Todos disponibles en múltiples colores.",
      },
      {
        q: "¿Cuánto cuesta una remera personalizada con IA?",
        a: "Las remeras personalizadas arrancan desde $28.600 ARS para el modelo Aldea Classic Fit y $31.000 ARS para la Aura Oversize. Los precios incluyen el diseño personalizado con IA y estampado DTG de alta calidad. No hay cargos adicionales por el diseño.",
      },
      {
        q: "¿Cuánto cuesta un hoodie personalizado?",
        a: "Los hoodies comienzan en $55.000 ARS para el Buzo Hoodie Oversize y $60.000 ARS para el Buzo Hoodie Oversize premium. Disponibles en negro, blanco, caramel, crema, gris melange y stone wash. Incluyen diseño con IA y estampado DTG.",
      },
      {
        q: "¿Tienen talles para todos?",
        a: "Sí, nuestras prendas oversize se adaptan a diferentes cuerpos. Cada producto tiene tabla de medidas detallada visible en la página de productos. Los talles disponibles varían según el modelo.",
      },
    ],
  },
  {
    category: "Estampado DTG",
    questions: [
      {
        q: "¿Qué es el estampado DTG?",
        a: "DTG (Direct to Garment) es la tecnología de impresión textil más avanzada disponible. Imprime directamente sobre la fibra de algodón usando tintas especiales, logrando colores vibrantes, alta definición fotográfica y durabilidad excepcional en cada lavado.",
      },
      {
        q: "¿Por qué DTG es mejor que serigrafía o sublimación?",
        a: "El DTG ofrece varias ventajas: 1) No tiene límite de colores como la serigrafía. 2) Permite detalles fotográficos imposibles con otras técnicas. 3) No requiere costos de setup ni mínimos de cantidad. 4) La tinta penetra la fibra del algodón, no queda como una capa encima. 5) Resiste lavados manteniendo la intensidad del color. La sublimación solo funciona en poliéster; nosotros usamos algodón 100% premium.",
      },
      {
        q: "¿Cuántos lavados resiste el estampado?",
        a: "Nuestros estampados DTG están diseñados para durar. Siguiendo las instrucciones de cuidado (lavar del revés, agua fría, no usar secadora), el estampado mantiene su calidad por más de 50 lavados. Usamos tintas de grado profesional sobre algodón 100% optimizado para DTG.",
      },
    ],
  },
  {
    category: "Envíos y producción",
    questions: [
      {
        q: "¿Hacen envíos a todo el país?",
        a: "Sí, realizamos envíos a toda la Argentina. Los costos de envío son: AMBA (área metropolitana) $5.500, Interior de Buenos Aires $7.000 y resto del país $9.000. Despachamos desde Villa Martelli, Buenos Aires.",
      },
      {
        q: "¿Cuánto tarda en llegar mi pedido?",
        a: "El tiempo total desde que hacés el pedido hasta recibirlo es de 5 a 10 días hábiles. Esto incluye la producción (estampado DTG) y el envío. Cada prenda se produce on-demand al recibir el pedido.",
      },
      {
        q: "¿Cómo pago?",
        a: "Aceptamos pagos a través de MercadoPago (tarjeta de crédito, débito, efectivo en punto de pago) y transferencia bancaria. El proceso de pago es seguro y los precios publicados son finales.",
      },
    ],
  },
  {
    category: "Partners y mayoristas",
    questions: [
      {
        q: "¿Qué es el programa Novamente Partners?",
        a: "Novamente Partners es nuestra plataforma para empresas, marcas y emprendedores que quieren crear su propia línea de merchandising sin inversión inicial. Incluye storefront personalizada con tu marca, diseño con IA, producción on-demand, precios mayoristas y envío. Nosotros producimos y enviamos; vos solo vendés.",
      },
      {
        q: "¿Cuánto cuesta ser Partner?",
        a: "Hay 3 planes: Starter (gratis, hasta 10 productos y 20 leads/mes), Growth ($25 USD/mes, productos ilimitados, SEO completo, Design Engine) y Pro ($100 USD/mes, chatbot WhatsApp, Meta Ads, analytics avanzado). Todos incluyen acceso a precios mayoristas.",
      },
      {
        q: "¿Hacen pedidos mayoristas para empresas?",
        a: "Sí, tanto a través del programa Partners como por pedidos directos. Contactanos por WhatsApp al +54 9 11 2660-3080 o por email a contact@novamente.ar para cotizaciones personalizadas.",
      },
    ],
  },
]

// Full FAQ JSON-LD schema
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.flatMap((category) =>
    category.questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    }))
  ),
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Preguntas Frecuentes", item: "https://www.novamente.ar/faq" },
  ],
}

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.novamente.ar/faq#webpage",
  name: "Preguntas Frecuentes — Novamente",
  description: "Respondemos todas tus dudas sobre Novamente: precios, envíos, diseño con inteligencia artificial, estampado DTG, pedidos mayoristas y más.",
  url: "https://www.novamente.ar/faq",
  isPartOf: { "@id": "https://www.novamente.ar/#website" },
  about: { "@id": "https://www.novamente.ar/#organization" },
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "summary", "details p"],
  },
  mainEntity: FAQ_ITEMS.flatMap((category) =>
    category.questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    }))
  ),
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">PREGUNTAS FRECUENTES</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Todo lo que necesitás saber sobre ropa personalizada con inteligencia artificial en Argentina.
          Respondemos las dudas más comunes sobre diseño con IA, precios, envíos, estampado DTG y el programa Partners.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {FAQ_ITEMS.map((category) => (
          <section key={category.category}>
            <h2 className="text-2xl font-bold mb-6 text-primary border-b border-white/10 pb-3">
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.questions.map((item) => (
                <details
                  key={item.q}
                  className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors"
                >
                  <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center gap-4">
                    <span>{item.q}</span>
                    <span className="text-primary group-open:rotate-45 transition-transform text-2xl flex-shrink-0">+</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <div className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8 border border-primary/10">
          <h3 className="novamente-heading text-2xl mb-4">¿TENÉS OTRA PREGUNTA?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Si no encontraste lo que buscabas, contactanos directamente y te respondemos al toque.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button className="rounded-lg">Consultá por WhatsApp</Button>
            </Link>
            <Link href="/#generator-section">
              <Button variant="outline" className="rounded-lg">
                Empezar a Diseñar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
