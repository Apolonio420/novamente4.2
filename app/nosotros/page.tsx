import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Mail, MapPin, Phone, Sparkles, Users, Palette, Award } from 'lucide-react'
import { LandingHeroImage } from '@/components/LandingHeroImage'

export const metadata: Metadata = {
  title: 'Sobre Novamente — Ropa Personalizada con IA en Argentina',
  description:
    'Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Fundada en 2024 en Villa Martelli, Buenos Aires. Combinamos IA generativa con estampado DTG premium para crear prendas unicas bajo demanda. 37 estilos artisticos, envios a todo el pais.',
  openGraph: {
    title: 'Sobre Novamente — Ropa Personalizada con IA en Argentina',
    description:
      'Primera marca argentina de indumentaria personalizada con inteligencia artificial. Fundada en 2024 en Villa Martelli, Buenos Aires.',
    url: 'https://www.novamente.ar/nosotros',
    type: 'website',
    siteName: 'Novamente',
    images: [{ url: 'https://novamente.ar/novamente-logo.png', width: 512, height: 512, alt: 'Novamente Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Sobre Novamente — Ropa Personalizada con IA en Argentina',
    description:
      'Primera marca argentina de indumentaria personalizada con inteligencia artificial.',
  },
  alternates: { canonical: 'https://www.novamente.ar/nosotros' },
}

const STATS = [
  { value: '1,200+', label: 'Disenos creados', icon: Palette },
  { value: '95+', label: 'Clientes satisfechos', icon: Users },
  { value: '37', label: 'Estilos artisticos', icon: Sparkles },
  { value: '4.8/5', label: 'Rating promedio', icon: Award },
]

export default function NosotrosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': 'https://novamente.ar/#organization',
    name: 'Novamente',
    url: 'https://novamente.ar',
    logo: 'https://novamente.ar/novamente-logo.png',
    description: 'Primera marca argentina de indumentaria personalizada con inteligencia artificial',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Villa Martelli',
      addressLocality: 'Buenos Aires',
      postalCode: '1603',
      addressCountry: 'AR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -34.5534, longitude: -58.504 },
    telephone: '+5491126603080',
    email: 'contact@novamente.ar',
    priceRange: '$21,800 - $55,000 ARS',
    paymentAccepted: 'MercadoPago, Transferencia Bancaria',
    areaServed: { '@type': 'Country', name: 'Argentina' },
    sameAs: ['https://instagram.com/novamente.ar', 'https://twitter.com/Novamentear'],
    founder: [
      { '@type': 'Person', name: 'Juan Ignacio Sambuceti', jobTitle: 'Co-Fundador' },
      { '@type': 'Person', name: 'Valentin Nunez', jobTitle: 'Co-Fundador & Desarrollador' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '95',
      bestRating: '5',
      worstRating: '1',
    },
  }

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://www.novamente.ar/nosotros#webpage',
    name: 'Sobre Novamente — Ropa Personalizada con IA en Argentina',
    description: 'Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Fundada en 2024 en Villa Martelli, Buenos Aires.',
    url: 'https://www.novamente.ar/nosotros',
    isPartOf: { '@id': 'https://www.novamente.ar/#website' },
    about: { '@id': 'https://www.novamente.ar/#organization' },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable]'],
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.novamente.ar/' },
        { '@type': 'ListItem', position: 2, name: 'Sobre Nosotros', item: 'https://www.novamente.ar/nosotros' },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      {/* Navigation */}
      <nav className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
        <Link
          href="https://wa.me/5491162747588?text=Hola!%20Quiero%20saber%20m%C3%A1s%20sobre%20Novamente"
          target="_blank"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {/* Hero */}
        <header className="pt-8 pb-12">
          <LandingHeroImage
            src="/marketing/lifestyle/hero-nosotros-equipo.webp"
            alt="Equipo Novamente trabajando en el taller textil de Villa Martelli, Buenos Aires"
          />
          <div className="flex items-center gap-4 mb-8">
            <Image
              src="/novamente-logo.png"
              alt="Novamente Logo"
              width={56}
              height={56}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Sobre Novamente</h1>
              <p className="text-white/50 text-sm mt-1">Indumentaria personalizada con IA</p>
            </div>
          </div>

          {/* Citation block */}
          <blockquote className="border-l-4 border-purple-500 pl-6 py-4 bg-white/5 rounded-r-xl text-white/90 text-lg leading-relaxed">
            Novamente es la primera marca argentina de indumentaria personalizada con inteligencia
            artificial, fundada en 2024 en Villa Martelli, Buenos Aires. Combinamos tecnologia de
            generacion de imagenes con IA y estampado directo a tela (DTG) para producir prendas
            unicas bajo demanda. Cada diseno es creado en minutos mediante nuestro motor de IA con
            37 estilos artisticos disponibles, desde arte pop hasta acuarela japonesa.
          </blockquote>
        </header>

        {/* Nuestra Historia */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Nuestra Historia</h2>
          <div className="text-white/80 space-y-4 leading-relaxed">
            <p>
              Novamente nacio en 2024 con una vision clara: democratizar la indumentaria
              personalizada en Argentina. En un mercado donde las opciones de ropa custom eran
              caras, lentas o requerien pedidos minimos altos, vimos la oportunidad de combinar
              inteligencia artificial generativa con produccion local bajo demanda.
            </p>
            <p>
              Desde Villa Martelli, en el corazon del Gran Buenos Aires, comenzamos a desarrollar
              un sistema que permite a cualquier persona &mdash;desde un emprendedor hasta alguien
              que quiere una remera unica&mdash; disenar su prenda en minutos usando IA y recibirla
              en su puerta en dias, no semanas. Sin minimos, sin complicaciones, con precios en
              pesos y pago por MercadoPago.
            </p>
            <p>
              Hoy servimos tanto a clientes individuales (B2C) como a marcas y emprendedores (B2B)
              que quieren lanzar su linea de indumentaria sin inversion inicial en stock.
            </p>
          </div>
        </section>

        {/* Tecnologia */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Tecnologia</h2>
          <div className="text-white/80 space-y-4 leading-relaxed">
            <p>
              Nuestro motor de diseno, <strong className="text-white">Nano Banana 2</strong>, es un
              sistema de inteligencia artificial generativa optimizado para crear disenos textiles de
              alta calidad. A diferencia de generadores de imagenes genericos, Nano Banana 2 esta
              entrenado para producir arte que funciona especificamente sobre tela: colores vibrantes
              que sobreviven el proceso DTG, composiciones que se ven bien en el area de estampado,
              y estilos que traducen bien al medio textil.
            </p>
            <p>
              Ofrecemos <strong className="text-white">37 estilos artisticos</strong> curados,
              incluyendo pop art, acuarela japonesa, arte vectorial, cyberpunk, minimalismo,
              psicodelico, Art Nouveau, y muchos mas. Nuestro optimizador de prompts traduce las
              ideas del usuario en instrucciones precisas para la IA, asegurando resultados
              consistentes y de alta calidad.
            </p>
            <p>
              El estampado se realiza con tecnologia <strong className="text-white">DTG (Direct to
              Garment)</strong> premium, que imprime directamente sobre la tela con tintas a base de
              agua. El resultado es un estampado suave al tacto, con colores vibrantes que
              resisten 50 o mas lavados sin degradarse.
            </p>
          </div>
        </section>

        {/* Numeros */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Novamente en Numeros</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl p-5 text-center"
              >
                <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Equipo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">El Equipo</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Juan Ignacio */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/team/juan-ignacio.jpg"
                  alt="Juan Ignacio Sambuceti"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30"
                />
                <div>
                  <p className="text-white font-medium">Juan Ignacio Sambuceti</p>
                  <p className="text-purple-400 text-sm font-medium">Co-Fundador</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Juan Ignacio es el motor comercial y estrategico detras de Novamente. Con foco en el
                desarrollo de negocio y la relacion con clientes, se encarga de traducir las necesidades
                del mercado en soluciones concretas. Su vision emprendedora y su capacidad para conectar
                personas e ideas son el corazon del proyecto.
              </p>
            </div>

            {/* Valentin */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/team/valentin.jpg"
                  alt="Valentin Nunez"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30"
                />
                <div>
                  <p className="text-white font-medium">Valentin Nunez</p>
                  <p className="text-purple-400 text-sm font-medium">Co-Fundador &amp; Desarrollador</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Valentin es el arquitecto tecnico de Novamente. Diseno y construyo la plataforma desde
                cero, siendo responsable de toda la infraestructura, el desarrollo web y los sistemas que
                hacen posible la experiencia del usuario. Su pasion por la programacion y el detalle
                tecnico garantizan que todo funcione a la perfeccion.
              </p>
            </div>
          </div>
        </section>

        {/* Mision */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Nuestra Mision</h2>
          <div className="text-white/80 space-y-4 leading-relaxed">
            <p>
              Hacer accesible la indumentaria personalizada de alta calidad para todos. Creemos que
              cada persona merece poder expresar su identidad a traves de la ropa que usa, sin
              necesitar ser disenador, sin pedir cantidades minimas, y sin pagar precios prohibitivos.
            </p>
            <p>
              Para las marcas y emprendedores, nuestra mision es eliminar las barreras de entrada
              al mundo de la indumentaria custom: sin inversion inicial en stock, sin riesgo de
              inventario, con la tecnologia y calidad de produccion que antes solo estaba disponible
              para grandes empresas.
            </p>
          </div>
        </section>

        {/* Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Contacto</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="mailto:contact@novamente.ar"
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
            >
              <Mail className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-white/50 text-sm">contact@novamente.ar</p>
              </div>
            </Link>
            <Link
              href="https://wa.me/5491162747588"
              target="_blank"
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-white font-medium">WhatsApp</p>
                <p className="text-white/50 text-sm">+54 9 11 6274-7588</p>
              </div>
            </Link>
            <Link
              href="https://instagram.com/novamente.ar"
              target="_blank"
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors sm:col-span-1"
            >
              <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
              <div>
                <p className="text-white font-medium">Instagram</p>
                <p className="text-white/50 text-sm">@novamente.ar</p>
              </div>
            </Link>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
              <MapPin className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-white font-medium">Direccion</p>
                <p className="text-white/50 text-sm">Villa Martelli, Buenos Aires, Argentina (CP 1603)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer links */}
        <footer className="border-t border-white/10 pt-8 mt-12 flex flex-wrap gap-4 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          <Link href="/comparar" className="hover:text-white transition-colors">Comparativa</Link>
          <Link href="/guia-estampado" className="hover:text-white transition-colors">Guia de Estampado</Link>
          <Link href="/partners/join" className="hover:text-white transition-colors">Partners</Link>
          <Link href="/terminos" className="hover:text-white transition-colors">Terminos</Link>
          <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
        </footer>
      </main>
    </div>
  )
}
