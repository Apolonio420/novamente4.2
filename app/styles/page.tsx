import { StyleGallery } from "@/components/StyleGallery"

export default function StylesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">GALERÍA DE ESTILOS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Explorá nuestra colección completa de estilos artísticos. Cada estilo está diseñado para inspirar tus
          creaciones y ayudarte a encontrar el look perfecto para tu prenda personalizada.
        </p>
      </div>

      <StyleGallery directToCustomization={true} />
    </div>
  )
}
