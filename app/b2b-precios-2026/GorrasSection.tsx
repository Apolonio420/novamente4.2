import Image from "next/image"
import { GORRAS, GORRAS_MIN_UNITS } from "./data"

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

// Seccion aparte de B2BCatalog/UnifiedPriceTable: las gorras son otra linea de
// producto (DTF, minimo 30u, 2 tramos de precio), no encajan en la estructura
// de 5 tiers desde 1 unidad en DTG que asume el catalogo de prendas.
export default function GorrasSection() {
  return (
    <section className="mb-14">
      <h2 className="novamente-heading text-2xl text-center mb-3">Gorras</h2>
      <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-6">
        Linea aparte del catalogo de prendas: la personalizacion es en{" "}
        <strong className="text-foreground">DTF</strong>, la tecnica correcta para gorra por su
        tela y construccion. Pedido minimo {GORRAS_MIN_UNITS} unidades, talle unico, precio con
        la personalizacion ya incluida.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GORRAS.map((g) => (
          <div key={g.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <Image
              src={g.image}
              alt={`${g.name} — vista de producto`}
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
            <div className="p-4 flex flex-col flex-1">
              <p className="font-semibold text-sm mb-1">{g.name}</p>
              <p className="text-xs text-muted-foreground mb-1">{g.fabric}</p>
              <p className="text-xs text-muted-foreground mb-2">Talle unico</p>
              <p className="text-xs text-muted-foreground mb-3">{g.colors}</p>
              {/* mt-auto: los precios quedan alineados al pie de las 4 cards
                  aunque las listas de colores tengan distinto largo. */}
              <div className="text-sm mt-auto pt-1">
                <p>
                  <span className="text-muted-foreground">30-99u</span>{" "}
                  <strong className="text-foreground">{formatPrice(g.prices.desde30)}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">100u+</span>{" "}
                  <strong className="text-foreground">{formatPrice(g.prices.desde100)}</strong>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-5 max-w-2xl mx-auto">
        Pedido minimo {GORRAS_MIN_UNITS} unidades por pedido. El precio incluye la
        personalizacion DTF de tamano estandar. Para cerrar un pedido de gorras se coordina por
        WhatsApp con un asesor.
      </p>
    </section>
  )
}
