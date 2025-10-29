import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Clock, Package, Sparkles, Target, Zap } from "lucide-react"
import { WHATSAPP_URL, GENERATOR_URL, INTERNAL_LINKS } from "@/lib/config/links"
import AutoScrollGallery from "@/components/merchs/AutoScrollGallery"

export const metadata: Metadata = {
  title: "B2B Merchandising | NovaMente",
  description: "Potenciá tu marca con merchandising sin inversión inicial. Creá tu línea de productos con NovaMente y hacé que tu marca llegue a más personas.",
  openGraph: {
    title: "Potenciá tu marca con merchandising sin inversión inicial | NovaMente",
    description: "Creá tu línea de productos con NovaMente y hacé que tu marca llegue a más personas. Sin riesgo, sin stock y con dos formas de generar ingresos.",
    images: ["/novamente-logo.png"],
  },
}

export default function MerchsPage() {
  const benefits = [
    {
      icon: <Package className="h-6 w-6" />,
      title: "Sin inversión inicial",
      description: "No necesitás stock ni capital. Nosotros nos ocupamos de la producción, impresión y logística."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Potenciá tu marca",
      description: "Hacé que tu marca esté presente en cada lugar, evento o red social. Llevá tu identidad a nuevas audiencias con productos únicos."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Entrega rápida",
      description: "Producción y envío en 24–48 hs, con control de calidad y gestión automatizada."
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Diseños con IA a tu medida",
      description: "Creamos juntos la imagen que quieras para tu marca. Podés inspirarte, co-crear o dejar que nuestro generador te ayude a definir tu estilo."
    }
  ]

  const steps = [
    {
      number: "1",
      title: "Diseñamos juntos",
      description: "Te ayudamos a definir la imagen que querés para tu marca o negocio. Podés usar nuestro generador con IA o crear con nuestro equipo de diseño."
    },
    {
      number: "2", 
      title: "Elegís tus prendas y modalidad",
      description: "Seleccioná las prendas que más te representen (remeras, buzos, gorras, etc.) y elegí si querés vender como Partner o a precio B2B con tu propio margen."
    },
    {
      number: "3",
      title: "Lanzás tu línea",
      description: "Publicamos tus productos en nuestro catálogo o te damos tu propia página personalizada para que empieces a vender sin inversión inicial."
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="novamente-heading text-4xl md:text-6xl mb-6">
          Potenciá tu marca con merchandising sin inversión inicial
        </h1>
        <p className="text-muted-foreground max-w-4xl mx-auto text-lg md:text-xl mb-8">
          Creá tu línea de productos con NovaMente y hacé que tu marca llegue a más personas.
          <br />
          Diseñamos juntos tus prendas, las producimos bajo demanda y las entregamos en 24–48 hs.
          <br />
          <span className="text-primary font-medium">Sin riesgo, sin stock y con dos formas de generar ingresos.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              <ArrowRight className="h-4 w-4 mr-2" />
              Sumate como Partner
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Catálogo Actual
            </Button>
          </Link>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {benefits.map((benefit, index) => (
          <div key={index} className="text-center p-6 rounded-xl bg-card border">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
            <p className="text-muted-foreground text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Auto-scroll gallery */}
      <div className="mb-16">
        <AutoScrollGallery heightClass="h-60 md:h-80 lg:h-96" gapClass="gap-4 md:gap-6" pauseOnHover speedSec={34} />
      </div>

      {/* How it Works */}
      <div className="bg-secondary/30 rounded-xl p-8 mb-16">
        <h2 className="novamente-heading text-3xl text-center mb-8">¿Cómo funciona? Tres pasos simples.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto">
              Contactar por WhatsApp
            </Button>
          </Link>
          <Link href={GENERATOR_URL}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Probar el Generador
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Catálogo
            </Button>
          </Link>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8">
        <h2 className="novamente-heading text-3xl mb-4">
          Tu comunidad quiere vestir tu marca. Dejá que NovaMente lo haga posible.
        </h2>
        <p className="text-muted-foreground mb-6 max-w-3xl mx-auto text-lg">
          Sumate a la nueva forma de crecer con merchandising inteligente: sin riesgos, con tu esencia y con el respaldo de nuestra tecnología.
          <br />
          Hacemos que tus ideas se conviertan en productos reales, listos para el mundo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              <Users className="h-4 w-4 mr-2" />
              Chatear con nosotros
            </Button>
          </Link>
          <Link href={GENERATOR_URL}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Zap className="h-4 w-4 mr-2" />
              Probar Generador
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Catálogo Actual
            </Button>
          </Link>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          ¿Tenés dudas? Escribinos a{" "}
          <a href="mailto:contact@novamente.ar" className="text-primary hover:underline">
            contact@novamente.ar
          </a>
        </p>
      </div>
    </div>
  )
}
