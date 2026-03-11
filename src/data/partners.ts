/**
 * partners.ts
 * -----------
 * Single source of truth for all merch partners.
 * To add a new partner: push a new entry to the `partners` array.
 * To update/replace placeholder data: edit the relevant entry below.
 *
 * Asset convention:
 *   /public/partners/<slug>/logo.png
 *   /public/partners/<slug>/banner.png
 *   /public/partners/<slug>/products/<product-id>-front.png
 *   /public/partners/<slug>/products/<product-id>-back.png
 *
 * Falco keeps its existing assets under /public/falco/ unchanged.
 */

export interface ProductColor {
    name: string
    value: string
    hex: string
    images: {
        front: string
        back: string
    }
}

export interface ProductSizing {
    [size: string]: string
}

export interface Product {
    id: string
    name: string
    price: number          // numeric ARS
    priceLabel: string     // formatted string for listing cards, e.g. "$65.000"
    colors: ProductColor[]
    sizes: string[]
    category: string
    lifestyleImages: string[]
    description: string
    detailedDescription: string
    features: string[]
    sizing: ProductSizing
    brand: string          // display name
    brandValues: string    // short slogan shown on product page
    featured?: boolean
    /** Short description used in the product card grid */
    cardDescription: string
}

export interface Partner {
    id: string             // slug used in URL, e.g. "falco"
    name: string           // display name, e.g. "FALCO"
    slogan: string         // short one-liner
    description: string    // brand story paragraph 1
    values: string         // brand story paragraph 2
    mission: string        // brand story paragraph 3 (bold)
    logo: string           // path to logo shown in brand header and footer
    cardImage?: string     // optional: image shown in /merch listing card (falls back to logo)
    banner: string         // path to banner / watermark image
    instagramUrl?: string  // optional: if set, shows "Seguir" button in brand page
    featured?: boolean     // shows "Destacado" badge on /merch listing
    products: Product[]
}

// ---------------------------------------------------------------------------
// FALCO – existing data preserved exactly as-is
// ---------------------------------------------------------------------------
const falco: Partner = {
    id: "falco",
    name: "FALCO",
    slogan: "Libertad. Identidad. Argentina que avanza.",
    description:
        "FALCO es una marca nacida del espíritu de uno de los integrantes de 'Las Tres Anclas', un grupo emblemático que representa una nueva etapa para Argentina: la del renacer económico, la libertad individual y el crecimiento sostenido.",
    values:
        "Su identidad refleja valores como la lealtad, el patriotismo y la prosperidad, alineados con un momento histórico marcado por el cambio de rumbo del país: equilibrio fiscal, baja de la inflación y desarrollo real.",
    mission: "FALCO no es solo ropa: es símbolo de una visión renovadora y de un presente que proyecta futuro.",
    logo: "/falco/halcon-negro.png",
    cardImage: "/falco/halcon-logo.png",
    banner: "/falco/anclas-watermark.png",
    featured: true,
    products: [
        {
            id: "hoodie-tres-anclas",
            name: 'Hoodie "Tres Anclas" Oversized',
            price: 65000,
            priceLabel: "$65.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/hoodie-tres-anclas-negro-front.png",
                        back: "/falco/products/hoodie-tres-anclas-negro-back.png",
                    },
                },
                {
                    name: "Crema",
                    value: "crema",
                    hex: "#F5F5DC",
                    images: {
                        front: "/falco/products/hoodie-tres-anclas-crema-front.png",
                        back: "/falco/products/hoodie-tres-anclas-crema-back.png",
                    },
                },
                {
                    name: "Caramel",
                    value: "caramel",
                    hex: "#D2691E",
                    images: {
                        front: "/falco/products/hoodie-tres-anclas-caramel-front.png",
                        back: "/falco/products/hoodie-tres-anclas-caramel-back.png",
                    },
                },
                {
                    name: "Gris Melange",
                    value: "gris-melange",
                    hex: "#808080",
                    images: {
                        front: "/falco/products/hoodie-tres-anclas-gris-front.png",
                        back: "/falco/products/hoodie-tres-anclas-gris-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Hoodies",
            lifestyleImages: [
                "/falco/products/hoodie-tres-anclas-lifestyle-milei.jpeg",
                "/falco/products/hoodie-tres-anclas-medidas.png",
            ],
            description:
                'El Hoodie "Tres Anclas" Oversized representa la fuerza y los valores de FALCO: libertad, crecimiento y patriotismo. Confeccionado en algodón premium con el icónico diseño de las tres anclas en la espalda y el logo del halcón en el frente.',
            detailedDescription:
                "Este hoodie oversized es más que una prenda: es un símbolo de la nueva Argentina que avanza. Las tres anclas representan la unidad, la estabilidad y la fuerza, mientras que el halcón simboliza la libertad y la visión de futuro. Cada hoodie está confeccionado con materiales de primera calidad para garantizar durabilidad y comodidad.",
            features: [
                "Algodón 100% premium de 320gsm",
                "Corte oversized unisex",
                "Interior frisa suave y abrigada",
                'Diseño "Tres Anclas" bordado en la espalda',
                "Logo halcón FALCO bordado en el frente",
                "Capucha ajustable con cordones",
                "Bolsillo canguro amplio",
                "Costuras reforzadas para mayor durabilidad",
                "Puños y dobladillo en rib elástico",
            ],
            sizing: {
                S: "Largo: 73cm | Ancho: 68cm | Manga: 55cm",
                M: "Largo: 75.5cm | Ancho: 70cm | Manga: 56cm",
                L: "Largo: 78cm | Ancho: 72cm | Manga: 57cm",
                XL: "Largo: 80.5cm | Ancho: 84cm | Manga: 58cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            featured: true,
            cardDescription:
                'Hoodie oversize con el icónico diseño "Tres Anclas" de FALCO. Símbolo de unidad, fuerza y prosperidad.',
        },
        {
            id: "remera-oversize-tres-anclas",
            name: 'Remera "Tres Anclas" Oversized',
            price: 42000,
            priceLabel: "$42.000",
            colors: [
                {
                    name: "Caramel",
                    value: "caramel",
                    hex: "#D2691E",
                    images: {
                        front: "/falco/products/remera-tres-anclas-caramel-front.png",
                        back: "/falco/products/remera-tres-anclas-caramel-back.png",
                    },
                },
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/remera-tres-anclas-negro-front.png",
                        back: "/falco/products/remera-tres-anclas-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/falco/products/remera-tres-anclas-blanco-front.png",
                        back: "/falco/products/remera-tres-anclas-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: ["/falco/products/remera-tres-anclas-medidas.png"],
            description:
                'La Remera "Tres Anclas" Oversized combina comodidad y simbolismo en una prenda versátil. Con el icónico diseño de las tres anclas en la espalda y el halcón FALCO en el frente, representa los valores fundamentales de unidad, estabilidad y libertad.',
            detailedDescription:
                "Esta remera oversized es perfecta para el uso diario, confeccionada en algodón premium que garantiza comodidad y durabilidad. El diseño minimalista del halcón en el frente se complementa con el poderoso símbolo de las tres anclas en la espalda, creando una prenda que trasciende la moda para convertirse en una declaración de principios.",
            features: [
                "Algodón 100% premium de 180gsm",
                "Corte oversized unisex",
                "Cuello redondo reforzado",
                'Diseño "Tres Anclas" estampado en la espalda',
                "Logo halcón FALCO estampado en el frente",
                "Costuras laterales para mejor ajuste",
                "Dobladillo y puños en rib",
                "Tacto suave y transpirable",
                "Resistente al lavado y uso frecuente",
            ],
            sizing: {
                S: "Pecho: 53cm | Largo: 70cm",
                M: "Pecho: 55cm | Largo: 73cm",
                L: "Pecho: 58cm | Largo: 75cm",
                XL: "Pecho: 60cm | Largo: 78cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            cardDescription:
                'Remera oversize con el icónico diseño "Tres Anclas" de FALCO. Símbolo de unidad, fuerza y prosperidad.',
        },
        {
            id: "remera-classic-tres-anclas",
            name: 'Remera "Tres Anclas" Corte Clásico',
            price: 38000,
            priceLabel: "$38.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/remera-classic-tres-anclas-negro-front.png",
                        back: "/falco/products/remera-classic-tres-anclas-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/falco/products/remera-classic-tres-anclas-blanco-front.png",
                        back: "/falco/products/remera-classic-tres-anclas-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL", "XXL"],
            category: "Remeras",
            lifestyleImages: ["/falco/products/remera-classic-tres-anclas-medidas.png"],
            description:
                'La Remera "Tres Anclas" Corte Clásico representa la elegancia atemporal de FALCO. Con un diseño sobrio que combina el logo distintivo en el frente y las tres anclas en la espalda, simboliza lealtad, orden y libertad en un corte tradicional y versátil.',
            detailedDescription:
                "Esta remera de corte clásico está diseñada para quienes buscan un estilo más tradicional sin renunciar al simbolismo de FALCO. El corte regular y la calidad premium del algodón la convierten en una prenda perfecta para el uso diario, mientras que los diseños sutiles pero significativos la distinguen como una pieza de identidad y valores.",
            features: [
                "Algodón 100% premium de 180gsm",
                "Corte clásico regular fit",
                "Cuello redondo reforzado",
                'Diseño "Tres Anclas" estampado en la espalda',
                "Logo FALCO estampado en el pecho",
                "Costuras laterales para mejor ajuste",
                "Dobladillo y puños en rib",
                "Tacto suave y transpirable",
                "Diseño atemporal y versátil",
            ],
            sizing: {
                S: "Largo: 63cm | Ancho: 48cm",
                M: "Largo: 68cm | Ancho: 52cm",
                L: "Largo: 72cm | Ancho: 56cm",
                XL: "Largo: 75cm | Ancho: 58cm",
                XXL: "Largo: 77cm | Ancho: 60cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            cardDescription:
                'Remera de corte clásico con el diseño "Tres Anclas". Elegancia y patriotismo en cada detalle.',
        },
        {
            id: "remera-emision-falco",
            name: 'Remera "Emisión" FALCO',
            price: 37000,
            priceLabel: "$37.000",
            colors: [
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/falco/products/remera-emision-blanco-front.png",
                        back: "/placeholder.svg?height=600&width=600&text=Emisión+Blanco+Back&bg=hsl(0,0%,95%)",
                    },
                },
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/remera-emision-negro-front.png",
                        back: "/placeholder.svg?height=600&width=600&text=Emisión+Negro+Back&bg=hsl(0,0%,15%)",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [],
            description:
                'La Remera "Emisión" presenta un diseño tipográfico disruptivo con la fórmula matemática de expansión monetaria. Combina estilo callejero con conciencia política, ideal para quienes buscan una estética irónica y provocativa.',
            detailedDescription:
                'Esta remera oversize lleva estampada la fórmula "Emisión = iPR + CR - [SP + %ROx(k+i)]", representando el concepto económico de expansión monetaria con una impronta irónica. El diseño tipográfico central se complementa con el pequeño halcón FALCO en el pecho, creando una prenda que fusiona conciencia económica con identidad patriótica.',
            features: [
                "Algodón 100% premium de 180gsm",
                "Corte oversized unisex",
                "Cuello redondo reforzado",
                'Estampa tipográfica "EMISIÓN" central',
                "Fórmula económica matemática estampada",
                "Logo halcón FALCO pequeño en el pecho",
                "Diseño conceptual y disruptivo",
                "Tacto suave y transpirable",
                "Mensaje político-económico sutil",
            ],
            sizing: {
                S: "Pecho: 53cm | Largo: 70cm",
                M: "Pecho: 55cm | Largo: 73cm",
                L: "Pecho: 58cm | Largo: 75cm",
                XL: "Pecho: 60cm | Largo: 78cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            cardDescription:
                'Diseño tipográfico "EMISIÓN" con fórmula económica. Estilo callejero con conciencia política y estética disruptiva.',
        },
        {
            id: "remera-classic-falco",
            name: 'Remera Classic "FALCO"',
            price: 33000,
            priceLabel: "$33.000",
            colors: [
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/falco/products/remera-falco-blanco-front.png",
                        back: "/placeholder.svg?height=600&width=600&text=FALCO+Blanco+Back&bg=hsl(0,0%,95%)",
                    },
                },
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/remera-falco-negro-front.png",
                        back: "/placeholder.svg?height=600&width=600&text=FALCO+Negro+Back&bg=hsl(0,0%,15%)",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/falco/products/remera-falco-lifestyle-blanco-1.png",
                "/falco/products/remera-falco-lifestyle-blanco-2.png",
                "/falco/products/remera-falco-lifestyle-negro.png",
            ],
            description:
                "La Remera Classic FALCO presenta el diseño más puro de la marca: el logo del halcón centrado en el pecho. Ideal para quienes buscan un look limpio, urbano y patriótico con estilo minimalista e identidad fuerte.",
            detailedDescription:
                "Esta remera de corte clásico representa la esencia minimalista de FALCO. Con el logo del halcón perfectamente centrado en el pecho, transmite los valores de libertad y visión de futuro de manera sutil pero poderosa. Su diseño limpio la convierte en una pieza versátil que se adapta a cualquier ocasión, desde el uso casual hasta eventos más formales.",
            features: [
                "Algodón 100% premium de 180gsm",
                "Corte clásico regular fit",
                "Cuello redondo reforzado",
                "Logo halcón FALCO centrado en el pecho",
                "Diseño minimalista y atemporal",
                "Costuras laterales para mejor ajuste",
                "Dobladillo y puños en rib",
                "Tacto suave y transpirable",
                "Versatilidad para uso diario",
            ],
            sizing: {
                S: "Pecho: 50cm | Largo: 68cm",
                M: "Pecho: 52cm | Largo: 70cm",
                L: "Pecho: 55cm | Largo: 72cm",
                XL: "Pecho: 58cm | Largo: 74cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            cardDescription: "Diseño clásico con logo FALCO centrado. Look limpio, urbano y patriótico con identidad fuerte.",
        },
        {
            id: "gorra-falco",
            name: "Gorra FALCO",
            price: 35000,
            priceLabel: "$35.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/falco/products/gorra-falco-frontal.png",
                        back: "/falco/products/gorra-falco-lateral.png",
                    },
                },
            ],
            sizes: ["Talle único"],
            category: "Accesorios",
            lifestyleImages: [],
            description:
                "La Gorra FALCO combina estilo urbano con inspiración patriótica. Confeccionada en gabardina premium con bordado del icónico halcón en la parte frontal, representa libertad y visión de futuro en un diseño sobrio y versátil.",
            detailedDescription:
                "Esta gorra de 6 paneles está diseñada para completar cualquier conjunto del catálogo FALCO. El bordado del halcón en hilo blanco sobre fondo negro crea un contraste elegante y distintivo. Su construcción premium y cierre ajustable la convierten en el accesorio perfecto para quienes buscan calidad y simbolismo en cada detalle.",
            features: [
                "Gabardina 100% algodón premium",
                "Construcción de 6 paneles estructurados",
                "Bordado del halcón FALCO en hilo blanco",
                "Visera pre-curvada para protección solar",
                "Cierre ajustable con hebilla metálica",
                "Banda interior absorbente",
                "Ojales de ventilación bordados",
                "Diseño unisex versátil",
                "Resistente al uso diario",
            ],
            sizing: {
                "Talle único": "Circunferencia: 56-62cm ajustable | Visera: 7.5cm",
            },
            brand: "FALCO",
            brandValues: "Libertad. Identidad. Argentina que avanza.",
            cardDescription:
                "Gorra urbana con bordado del halcón FALCO. Diseño sobrio y versátil, ideal para completar cualquier conjunto.",
        },
    ],
}

// ---------------------------------------------------------------------------
// PLACEHOLDER PARTNER 1 — replace with real data when available
// ---------------------------------------------------------------------------
const novamenteOriginals: Partner = {
    id: "novamente-originals",
    name: "NOVAMENTE ORIGINALS",
    slogan: "Diseño con propósito. Hecho en Argentina.",
    description:
        "Novamente Originals es la línea de indumentaria propia de Novamente, creada para quienes valoran el diseño local, la calidad y la identidad cultural. Cada prenda es una expresión del movimiento creativo argentino.",
    values:
        "Producción local, materiales sustentables y diseños únicos realizados en colaboración con artistas argentinos. Una marca pensada para quienes quieren vestir con significado.",
    mission: "Novamente Originals: donde el diseño se convierte en declaración.",
    logo: "/partners/novamente-originals/logo.png",
    banner: "/partners/novamente-originals/banner.png",
    cardImage: "/partners/novamente-originals/card.png",
    instagramUrl: "https://www.instagram.com/novamente.ar/",
    featured: false,
    products: [
        {
            id: "remera-novamente-originals",
            name: "Remera Oversize Novamente Originals",
            price: 40000,
            priceLabel: "$40.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-originals/products/remera-novamente-originals-negro-front.png",
                        back: "/partners/novamente-originals/products/remera-novamente-originals-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png",
                        back: "/partners/novamente-originals/products/remera-novamente-originals-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/novamente-originals/products/remera-novamente-originals-lifestyle-flor.jpg",
                "/partners/novamente-originals/products/remera-novamente-originals-talles.png",
            ],
            description: "Remera oversize premium de Novamente Originals. Algodón suave, calce amplio y estampa de alta definición.",
            detailedDescription:
                "Remera oversize pensada para uso diario: calce relajado, tela premium y terminaciones prolijas. Ideal para combinar con outfits urbanos. Estampado durable y cómodo al tacto.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable y suave",
                "Producción local",
            ],
            sizing: {
                S: "Pecho: 50cm | Largo: 68cm",
                M: "Pecho: 52cm | Largo: 70cm",
                L: "Pecho: 55cm | Largo: 72cm",
                XL: "Pecho: 58cm | Largo: 74cm",
            },
            brand: "NOVAMENTE ORIGINALS",
            brandValues: "Diseño con propósito. Hecho en Argentina.",
            featured: true,
            cardDescription: "Remera Oversize — calce amplio, algodón premium, estampa durable.",
        },
        {
            id: "buzo-novamente-originals",
            name: "Buzo Oversize Novamente Originals",
            price: 65000,
            priceLabel: "$65.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png",
                        back: "/partners/novamente-originals/products/buzo-novamente-originals-negro-back.png",
                    },
                },
                {
                    name: "Gris",
                    value: "gris",
                    hex: "#9CA3AF",
                    images: {
                        front: "/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png",
                        back: "/partners/novamente-originals/products/buzo-novamente-originals-gris-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Hoodies",
            lifestyleImages: [
                "/partners/novamente-originals/products/buzo-novamente-originals-lifestyle-1.png",
                "/partners/novamente-originals/products/buzo-novamente-originals-lifestyle-2.png",
                "/partners/novamente-originals/products/buzo-novamente-originals-talles.png",
            ],
            description: "Buzo oversize premium de Novamente Originals. Algodón pesado, calce amplio y estampa de alta definición.",
            detailedDescription:
                "Buzo oversize pensado para el uso diario: tela premium de algodón 100%, calce relajado y terminaciones prolijas. Estampado durable y cómodo al tacto. Producción 100% local.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable y suave",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "NOVAMENTE ORIGINALS",
            brandValues: "Diseño con propósito. Hecho en Argentina.",
            featured: false,
            cardDescription: "Buzo Oversize — calce amplio, algodón premium, estampa durable.",
        },
        {
            id: "japon-novamente-originals",
            name: "Remera Japón Novamente Originals",
            price: 40000,
            priceLabel: "$40.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-originals/products/japon-novamente-originals-negro-front.png",
                        back: "/partners/novamente-originals/products/japon-novamente-originals-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/novamente-originals/products/japon-novamente-originals-blanco-front.png",
                        back: "/partners/novamente-originals/products/japon-novamente-originals-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/novamente-originals/products/japon-novamente-originals-lifestyle-1.jpg",
                "/partners/novamente-originals/products/japon-novamente-originals-talles.png",
            ],
            description: "Remera Japón de Novamente Originals. Diseño gráfico de edición limitada, algodón suave y estampa de alta definición.",
            detailedDescription:
                "La Remera Japón combina gráfica de impacto con comodidad diaria: tela de algodón 100%, corte regular y estampado durable. Una pieza de colección con identidad propia.",
            features: [
                "Algodón premium 100%",
                "Diseño gráfico de edición limitada",
                "Estampado durable y suave",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "NOVAMENTE ORIGINALS",
            brandValues: "Diseño con propósito. Hecho en Argentina.",
            featured: false,
            cardDescription: "Remera Japón — diseño gráfico de edición limitada, algodón premium.",
        },
    ],
}

// ---------------------------------------------------------------------------
// MINDSET
// ---------------------------------------------------------------------------
const mindset: Partner = {
    id: "mindset",
    name: "MINDSET",
    slogan: "Fe. Mentalidad. Disciplina.",
    description:
        "MINDSET es una marca de indumentaria construida sobre la convicción de que el carácter se forja desde adentro. Cada pieza lleva una intención: recordarte quién querés ser.",
    values:
        "Prendas pensadas para quienes eligen con propósito. Diseño sobrio, materiales premium y una estética que habla sin gritar. Porque la fortaleza real no necesita volumen.",
    mission: "MINDSET: vestir como una declaración de principios.",
    logo: "/partners/mindset/logo.png",
    banner: "/partners/mindset/banner.png",
    cardImage: "/partners/mindset/card.png",
    featured: false,
    products: [
        {
            id: "buzo-alce",
            name: "Buzo Alce — MINDSET",
            price: 65000,
            priceLabel: "$65.000",
            colors: [
                {
                    name: "Gris",
                    value: "gris",
                    hex: "#9CA3AF",
                    images: {
                        front: "/partners/mindset/products/buzo-alce-front-gris.png",
                        back: "/partners/mindset/products/buzo-alce-back-gris.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Hoodies",
            lifestyleImages: [
                "/partners/mindset/products/buzo-alce-talles.png",
            ],
            description: "Buzo Alce de MINDSET. Algodón premium, calce oversize y gráfica de identidad.",
            detailedDescription:
                "Buzo oversize de algodón 100%, confeccionado localmente. Diseño gráfico limpio con identidad MINDSET. Tela pesada, terminaciones prolijas y comodidad para el día a día.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "MINDSET",
            brandValues: "Fe. Mentalidad. Disciplina.",
            featured: false,
            cardDescription: "Buzo Alce — oversize, algodón premium, gris.",
        },
        {
            id: "buzo-pan",
            name: "Buzo Pan — MINDSET",
            price: 65000,
            priceLabel: "$65.000",
            colors: [
                {
                    name: "Crema",
                    value: "crema",
                    hex: "#EAD7C3",
                    images: {
                        front: "/partners/mindset/products/buzo-pan-front-crema.png",
                        back: "/partners/mindset/products/buzo-pan-back-crema.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Hoodies",
            lifestyleImages: [
                "/partners/mindset/products/buzo-pan-talles.png",
            ],
            description: "Buzo Pan de MINDSET. Tono crema, calce oversize y construcción premium.",
            detailedDescription:
                "Buzo oversize en tono crema de algodón 100%. Diseño minimalista con identidad MINDSET. Ideal para combinar con cualquier outfit urbano.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "MINDSET",
            brandValues: "Fe. Mentalidad. Disciplina.",
            featured: false,
            cardDescription: "Buzo Pan — oversize, algodón premium, crema.",
        },
        {
            id: "remera-oversize-fe-mindset",
            name: "Remera Oversize Fe — MINDSET",
            price: 40000,
            priceLabel: "$40.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/mindset/products/remera-oversize-fe-mindset-front-black.png",
                        back: "/partners/mindset/products/remera-oversize-fe-mindset-back-black.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/mindset/products/remera-oversize-fe-mindset-front-white.png",
                        back: "/partners/mindset/products/remera-oversize-fe-mindset-back-white.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/mindset/products/remera-oversize-fe-mindset-talles.png",
            ],
            description: "Remera Oversize Fe de MINDSET. Algodón suave, calce amplio y gráfica de convicción.",
            detailedDescription:
                "Remera oversize de algodón 100% con diseño Fe. Calce relajado, tela premium y estampado de alta definición. Para quienes llevan sus valores puestos.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable y suave",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "MINDSET",
            brandValues: "Fe. Mentalidad. Disciplina.",
            featured: true,
            cardDescription: "Remera Oversize Fe — algodón premium, negro o blanco.",
        },
        {
            id: "remera-oversize-pan-mindset",
            name: "Remera Oversize Pan — MINDSET",
            price: 40000,
            priceLabel: "$40.000",
            colors: [
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/mindset/products/remera-oversize-pan-mindset-front-white.png",
                        back: "/partners/mindset/products/remera-oversize-pan-mindset-back-white.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/mindset/products/remera-oversize-pan-mindset-talles.png",
            ],
            description: "Remera Oversize Pan de MINDSET. Blanco limpio, calce amplio y diseño gráfico de identidad.",
            detailedDescription:
                "Remera oversize blanca de algodón 100% con diseño Pan. Tela suave, estampado de alta definición y corte relajado para el uso diario.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium 100%",
                "Estampado durable y suave",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "MINDSET",
            brandValues: "Fe. Mentalidad. Disciplina.",
            featured: false,
            cardDescription: "Remera Oversize Pan — algodón premium, blanco.",
        },
    ],
}

// ---------------------------------------------------------------------------
// NOVAMENTE MUNDIAL — Colección Mundial 2026
// ---------------------------------------------------------------------------
const novamenteMundial: Partner = {
    id: "novamente-mundial",
    name: "NOVAMENTE MUNDIAL",
    slogan: "Colección Mundial 2026.",
    description:
        "Una cápsula inspirada en la previa del Mundial 2026: diseño urbano, identidad argentina y energía de torneo.",
    values:
        "Piezas pensadas para vivir la previa: gráficos potentes, colores sobrios y calces cómodos para todos los días.",
    mission: "Vestir el Mundial sin disfraz: estética, convicción y calle.",
    logo: "/partners/novamente-mundial/logo.png",
    banner: "/partners/novamente-mundial/banner.png",
    cardImage: "/partners/novamente-mundial/card.png",
    featured: true,
    products: [
        {
            id: "buzo-copa-novamente-mundial1",
            name: "Buzo Copa — Novamente Mundial",
            price: 65000,
            priceLabel: "$65.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png",
                        back: "/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-back.png",
                    },
                },
                {
                    name: "Gris",
                    value: "gris",
                    hex: "#9CA3AF",
                    images: {
                        front: "/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png",
                        back: "/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Hoodies",
            lifestyleImages: [
                "/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-talles.png",
            ],
            description: "Buzo oversize premium inspirado en la Copa y la previa mundialista.",
            detailedDescription:
                "Calce relajado, tela premium y estampa de alta definición. Diseñado para usarlo todos los días.",
            features: [
                "Calce oversize (relajado)",
                "Algodón premium",
                "Estampa durable",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "NOVAMENTE MUNDIAL",
            brandValues: "Colección Mundial 2026.",
            featured: false,
            cardDescription: "Buzo Copa — oversize, algodón premium, estampa durable.",
        },
        {
            id: "remera-copa-novamente-mundial1",
            name: "Remera Copa — Novamente Mundial",
            price: 40000,
            priceLabel: "$40.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png",
                        back: "/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png",
                        back: "/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/novamente-mundial/products/remera-copa-novamente-mundial1-talles.png",
            ],
            description: "Remera Copa de la colección Mundial 2026. Algodón premium y estampa de alta definición.",
            detailedDescription:
                "Remera de algodón 100% con estampado inspirado en la Copa. Calce regular, tela suave y terminaciones prolijas.",
            features: [
                "Algodón premium 100%",
                "Estampa durable",
                "Calce regular cómodo",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "NOVAMENTE MUNDIAL",
            brandValues: "Colección Mundial 2026.",
            featured: false,
            cardDescription: "Remera Copa — algodón premium, estampa durable, colección Mundial.",
        },
        {
            id: "remera-sticker-novamente-mundial3",
            name: "Remera Sticker — Novamente Mundial",
            price: 38000,
            priceLabel: "$38.000",
            colors: [
                {
                    name: "Negro",
                    value: "negro",
                    hex: "#000000",
                    images: {
                        front: "/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png",
                        back: "/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-back.png",
                    },
                },
                {
                    name: "Blanco",
                    value: "blanco",
                    hex: "#FFFFFF",
                    images: {
                        front: "/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png",
                        back: "/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-back.png",
                    },
                },
            ],
            sizes: ["S", "M", "L", "XL"],
            category: "Remeras",
            lifestyleImages: [
                "/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-talles.png",
            ],
            description: "Remera Sticker de la colección Mundial 2026. Gráfica de impacto, algodón premium.",
            detailedDescription:
                "Remera negra con diseño gráfico sticker pack. Algodón 100%, estampado de alta definición y calce regular.",
            features: [
                "Algodón premium 100%",
                "Diseño gráfico sticker pack",
                "Estampa durable",
                "Producción local",
            ],
            sizing: {
                S: "Ver tabla de talles en imágenes",
                M: "Ver tabla de talles en imágenes",
                L: "Ver tabla de talles en imágenes",
                XL: "Ver tabla de talles en imágenes",
            },
            brand: "NOVAMENTE MUNDIAL",
            brandValues: "Colección Mundial 2026.",
            featured: false,
            cardDescription: "Remera Sticker — gráfica de impacto, algodón premium, colección Mundial.",
        },
    ],
}

// ---------------------------------------------------------------------------
// EXPORTED PARTNERS ARRAY — order determines display in /merch
// ---------------------------------------------------------------------------
export const partners: Partner[] = [novamenteMundial, falco, novamenteOriginals, mindset]

/** Helper: find a partner by slug */
export function getPartnerById(id: string): Partner | undefined {
    return partners.find((p) => p.id === id)
}

/** Helper: find a product within a partner */
export function getProductById(
    partnerId: string,
    productId: string
): { partner: Partner; product: Product } | undefined {
    const partner = getPartnerById(partnerId)
    if (!partner) return undefined
    const product = partner.products.find((p) => p.id === productId)
    if (!product) return undefined
    return { partner, product }
}
