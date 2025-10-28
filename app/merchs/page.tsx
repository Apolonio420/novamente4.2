import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Clock, Percent, Package } from "lucide-react"
import { WHATSAPP_URL, GENERATOR_URL, INTERNAL_LINKS } from "@/lib/config/links"

export const metadata: Metadata = {
  title: "B2B Merchandising | NovaMente",
  description: "Sumate como partner de NovaMente. Sin inversión inicial, ganancias del 50%, entrega en 24-48hs. Merchandising B2B para mayoristas.",
  openGraph: {
    title: "B2B Merchandising | NovaMente",
    description: "Sumate como partner de NovaMente. Sin inversión inicial, ganancias del 50%, entrega en 24-48hs.",
    images: ["/opengraph-image.png"],
  },
}

export default function MerchsPage() {
  const benefits = [
    {
      icon: <Package className="h-6 w-6" />,
      title: "Sin inversión inicial",
      description: "No necesitás stock ni capital para empezar. Nosotros manejamos la producción y logística."
    },
    {
      icon: <Percent className="h-6 w-6" />,
      title: "50% de ganancias",
      description: "Parte equitativa de las ventas. Cuanto más vendas, más ganás."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Entrega rápida",
      description: "24-48 horas para productos personalizados. Sin esperas largas."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Soporte completo",
      description: "Te acompañamos en todo el proceso con herramientas y capacitación."
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="novamente-heading text-4xl md:text-6xl mb-6">B2B MERCHANDISING</h1>
        <p className="text-muted-foreground max-w-4xl mx-auto text-lg md:text-xl mb-8">
          Sumate como partner de NovaMente y llevá merchandising personalizado a tus clientes. 
          Sin inversión inicial, ganancias del 50% y entrega en 24-48 horas.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto">
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

      {/* How it Works */}
      <div className="bg-secondary/30 rounded-xl p-8 mb-16">
        <h2 className="novamente-heading text-3xl text-center mb-8">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">1</div>
            <h3 className="text-lg font-semibold mb-2">Te registrás</h3>
            <p className="text-muted-foreground">Completás el formulario y recibís acceso a tu panel de partner.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">2</div>
            <h3 className="text-lg font-semibold mb-2">Promocionás</h3>
            <p className="text-muted-foreground">Mostrás nuestros productos a tus clientes usando nuestras herramientas de marketing.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">3</div>
            <h3 className="text-lg font-semibold mb-2">Ganás</h3>
            <p className="text-muted-foreground">Recibís el 50% de cada venta. Pagos semanales automáticos.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8">
        <h2 className="novamente-heading text-3xl mb-4">¿Listo para empezar?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Unite a la revolución del merchandising personalizado. Sin riesgos, solo oportunidades.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
