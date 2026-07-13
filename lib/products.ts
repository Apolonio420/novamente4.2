export interface Product {
    id: string
    name: string
    price: string
    description: string
    images: {
        main: string
        lifestyle: string[]
        measurements: string
    }
    category: string
    color: string
    available: boolean
}

export const PRODUCTS: Product[] = [
    {
        id: "aura-tshirt-blanco",
        name: "Aura Oversize T-Shirt - Blanco",
        price: "$31.000",
        description:
            "Remera oversize blanca en algodón 100% peinado de máxima pureza. Su composición natural es el canvas ideal para estampado DTG, ofreciendo una superficie perfecta donde los colores se expresan con máxima fidelidad. Ligera, cómoda y con excelente caída, diseñada para que tu arte digital cobre vida con durabilidad profesional.",
        images: {
            main: "/products/aura-tshirt-blanco-front.jpeg",
            lifestyle: ["/products/tshirt-blanca-lifestyle-1.jpeg", "/products/tshirt-blanca-lifestyle-2.jpeg"],
            measurements: "/products/size-charts/over.png",
        },
        category: "T-Shirts",
        color: "Blanco",
        available: true,
    },
    {
        id: "aura-tshirt-negro",
        name: "Aura Oversize T-Shirt - Negro",
        price: "$31.000",
        description:
            "Remera oversize negra de algodón 100% peinado premium. La fibra natural pre-tratada optimiza la adherencia de tintas DTG, creando contrastes impactantes ideales para diseños en colores vibrantes o neón. Corte amplio y moderno con base oscura que hace explotar la intensidad de cualquier estampado personalizado.",
        images: {
            main: "/products/aura-tshirt-negro-front.jpeg",
            lifestyle: ["/products/tshirt-negra-lifestyle-1.jpeg", "/products/tshirt-negra-lifestyle-2.jpeg"],
            measurements: "/products/size-charts/over.png",
        },
        category: "T-Shirts",
        color: "Negro",
        available: true,
    },
    {
        id: "aura-tshirt-caramel",
        name: "Aura Oversize T-Shirt - Caramel",
        price: "$31.000",
        description:
            "Remera oversize color caramelo en algodón 100% de fibra larga. Su composición natural permite una penetración profunda de las tintas DTG, garantizando estampados duraderos con colores que se integran perfectamente a la tela. Ideal para un estilo urbano y sobrio, con tono cálido que potencia cualquier diseño creativo.",
        images: {
            main: "/products/aura-tshirt-caramel-front.jpeg",
            lifestyle: ["/products/tshirt-caramel-lifestyle-1.jpeg", "/products/tshirt-caramel-lifestyle-2.jpeg"],
            measurements: "/products/size-charts/over.png",
        },
        category: "T-Shirts",
        color: "Caramel",
        available: true,
    },
    {
        id: "aldea-tshirt-negro",
        name: "Aldea Classic Fit T-Shirt - Negro",
        price: "$28.600",
        description:
            "Remera de corte clásico en algodón 100% negro de alta densidad. La estructura de fibra natural está optimizada para tecnología DTG, asegurando estampados precisos y resistentes al desgaste. Ajuste regular con tela suave y resistente, perfecta para un look más sutil donde tu diseño se luce con elegancia profesional.",
        images: {
            main: "/products/tshirt-aldea-negro-front.jpeg",
            lifestyle: ["/products/tshirt-aldea-negro-lifestyle-1.jpeg", "/products/tshirt-aldea-negro-lifestyle-2.jpeg"],
            measurements: "/products/tshirt-aldea-negro-medidas.png",
        },
        category: "T-Shirts",
        color: "Negro",
        available: true,
    },
    {
        id: "aura-tshirt-stone-wash",
        name: "Aura Oversize T-Shirt - Stone Wash",
        price: "$31.000",
        description: "Remera oversize con efecto lavado Stone Wash. Un acabado vintage auténtico sobre nuestro algodón premium de alto gramaje.",
        images: {
            main: "/products/aura-oversize-tshirt-stone-wash/main.png",
            lifestyle: [
                "/products/aura-oversize-tshirt-stone-wash/back.jpeg",
                "/products/aura-oversize-tshirt-stone-wash/lifestyle1.jpg",
                "/products/aura-oversize-tshirt-stone-wash/lifestyle2.jpg",
                "/products/aura-oversize-tshirt-stone-wash/lifestyle3.jpg"
            ],
            measurements: "/products/size-charts/over.png"
        },
        category: "T-Shirts",
        color: "Stone Wash",
        available: true
    },
    {
        id: "aldea-tshirt-blanco",
        name: "Aldea Classic Fit T-Shirt - Blanco",
        price: "$28.600",
        description:
            "Remera clásica blanca en algodón 100% de fibra premium con tejido liviano. La pureza del material garantiza una base perfecta para estampado DTG, donde cada detalle de tu diseño se reproduce con nitidez fotográfica. Una prenda atemporal que se adapta a cualquier estilo, con durabilidad que mantiene tu arte intacto.",
        images: {
            main: "/products/tshirt-aldea-blanco-front.jpeg",
            lifestyle: ["/products/tshirt-aldea-blanco-lifestyle-1.jpeg", "/products/tshirt-aldea-blanco-lifestyle-2.jpeg"],
            measurements: "/products/tshirt-aldea-blanco-medidas.png",
        },
        category: "T-Shirts",
        color: "Blanco",
        available: true,
    },
    {
        id: "aldea-tshirt-beige",
        name: "Aldea Classic Fit T-Shirt - Beige",
        price: "$28.600",
        description:
            "Remera clásica beige en algodón 100% peinado premium. Un tono cálido y versátil que combina con todo, con la misma base optimizada para estampado DTG de la línea Aldea. Corte regular atemporal para que tu diseño se luzca con un estilo relajado y elegante.",
        images: {
            main: "/products/tshirt-aldea-beige-front.jpeg",
            lifestyle: ["/products/tshirt-aldea-beige-back.jpeg"],
            measurements: "/products/tshirt-aldea-blanco-medidas.png",
        },
        category: "T-Shirts",
        color: "Beige",
        available: true,
    },
    {
        id: "lienzo",
        name: "Lienzo",
        price: "Desde $34.000",
        description:
            "Obra impresa en alta definición sobre lienzo 100% algodón. Personalizá con tu diseño propio o generado con IA. Ideal para decorar espacios con identidad. Disponible en 3 medidas: 20×30 cm ($34.000), 35×40 cm ($41.000) y 40×50 cm ($49.000). Formato enrollado, listo para enmarcar o tensar.",
        images: {
            main: "/products/lienzo-art-1.jpg",
            lifestyle: ["/products/lienzo-art-2.jpg", "/products/lienzo-art-3.jpg", "/products/lienzo-room.jpg"],
            measurements: "/products/lienzo-medidas.jpg",
        },
        category: "Arte",
        color: "Personalizable",
        available: true,
    },
    {
        id: "musculosa-bali-blanca",
        name: "Musculosa Bali - Blanca",
        price: "$21.800",
        description: "Musculosa de morley premium en color blanco. Confección suave y fresca, ideal para estampar tu diseño personalizado y lucirlo este verano. Corte moderno que se adapta a tu estilo.",
        images: {
            main: "/products/musculosa-bali-blanca/front.png",
            lifestyle: ["/products/musculosa-bali-blanca/back.png", "/products/musculosa-bali-blanca/Musculosa_Rib_Blanca_Lifestyle.png"],
            measurements: "/products/musculosa-bali-blanca/Medidas3.png"
        },
        category: "Musculosas",
        color: "Blanco",
        available: true
    },
    {
        id: "musculosa-bali-negra",
        name: "Musculosa Bali - Negra",
        price: "$21.800",
        description: "Musculosa de morley premium en color negro. La base oscura perfecta para resaltar diseños en colores vibrantes o blancos. Tela elástica y cómoda para uso diario.",
        images: {
            main: "/products/musculosa-bali-negra/Musculosa_Rib_Negra.png",
            lifestyle: ["/products/musculosa-bali-negra/Musculosa_Rib_Blanca_Lifestyle.png", "/products/musculosa-bali-negra/Musculosa_Urban.png"],
            measurements: "/products/musculosa-bali-negra/Medidas3.png"
        },
        category: "Musculosas",
        color: "Negro",
        // Bali solo viene en blanca y gris.
        available: false
    },
    {
        id: "musculosa-bali-gris",
        name: "Musculosa Bali - Gris",
        price: "$21.800",
        description: "Musculosa de morley premium en color gris. Un tono neutro y versátil que combina con todo. Textura suave y calce perfecto.",
        images: {
            main: "/products/musculosa-bali-gris/front.png",
            lifestyle: ["/products/musculosa-bali-gris/back.png", "/products/musculosa-bali-gris/Musculosa_Rib_Blanca_Lifestyle.png"],
            measurements: "/products/musculosa-bali-gris/Medidas3.png"
        },
        category: "Musculosas",
        color: "Gris",
        available: true
    },
    {
        id: "buzo-hoodie-negro",
        name: "Buzo Hoodie Oversize - Negro",
        price: "$55.000",
        description: "Buzo hoodie oversize en color negro. El básico definitivo con fit amplio y algodón frizado premium. Ideal para estampar.",
        images: {
            main: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
            lifestyle: ["/products/buzo-hoddie-unisex-negro/back.jpeg", "/products/buzo-hoddie-unisex-negro/Buzo_Unisex_Studio.png", "/products/buzo-hoddie-unisex-negro/Buzo_Hoodie_Negro_Hombre_Lifestyle.png"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Negro",
        available: true
    },
    {
        id: "buzo-hoodie-stone-wash",
        name: "Buzo Hoodie Oversize - Stone Wash",
        price: "$55.000",
        description: "Buzo hoodie con efecto lavado Stone Wash. Un estilo vintage y urbano único. Algodón premium frizado para máxima comodidad y abrigo.",
        images: {
            main: "/products/buzo-hoddie-unisex-stone-wash/mockups nuevos productos-13.png",
            lifestyle: ["/products/buzo-hoddie-unisex-stone-wash/back.jpeg", "/products/buzo-hoddie-unisex-stone-wash/Buzo_Unisex_Studio.png", "/products/buzo-hoddie-unisex-stone-wash/Buzo_Hoodie_Negro_Hombre_Lifestyle.png"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Stone Wash",
        available: true
    },
    {
        id: "buzo-hoodie-blanco",
        name: "Buzo Hoodie Oversize - Blanco",
        price: "$55.000",
        description: "Buzo hoodie oversize en color blanco. Lienzo perfecto para tus diseños más creativos. Algodón frizado de alta calidad.",
        images: {
            main: "/products/buzo-hoddie-unisex-blanco/mockups nuevos productos-11.png",
            lifestyle: ["/products/buzo-hoddie-unisex-blanco/Buzo_Unisex_Studio.png"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Blanco",
        available: true
    },
    {
        id: "buzo-hoodie-marron",
        name: "Buzo Hoodie Oversize - Marron",
        price: "$55.000",
        description: "Buzo hoodie oversize en marron, con capucha y bolsillo canguro. Algodon frizado premium, base calida para estampas DTG.",
        images: {
            main: "/products/buzo-hoddie-unisex-marron/front.jpeg",
            lifestyle: ["/products/buzo-hoddie-unisex-marron/back.jpeg"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Marron",
        available: true
    },
    {
        id: "buzo-hoodie-crema",
        name: "Buzo Hoodie Oversize - Crema",
        price: "$55.000",
        description: "Buzo hoodie oversize en crema, suave y neutro. Ideal para disenos coloridos o minimalistas con estampado DTG premium.",
        images: {
            main: "/products/buzo-hoddie-unisex-crema/front.jpeg",
            lifestyle: ["/products/buzo-hoddie-unisex-crema/back.jpeg"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Crema",
        available: true
    },
    {
        id: "buzo-hoodie-gris",
        name: "Buzo Hoodie Oversize - Gris Melange",
        price: "$55.000",
        description: "Buzo hoodie oversize gris melange, comodo y versatil. Algodon frizado premium listo para personalizar.",
        images: {
            main: "/products/buzo-hoddie-unisex-gris/front.jpeg",
            lifestyle: ["/products/buzo-hoddie-unisex-gris/back.jpeg"],
            measurements: "/products/size-charts/hoodie.png"
        },
        category: "Hoodies",
        color: "Gris Melange",
        available: true
    },
    {
        id: "remera-crop-negra",
        name: "Remera Crop Mujer - Negra",
        price: "$23.500",
        description: "Remera crop de corte moderno en color negro. Algodón suave con calce relajado. Ideal para combinar con todo.",
        images: {
            main: "/products/remera-crop-de-mujer-negra/mockups nuevos productos-4.png",
            lifestyle: ["/products/remera-crop-de-mujer-negra/back.jpeg", "/products/remera-crop-de-mujer-negra/crop-lifestyle.png", "/products/remera-crop-de-mujer-negra/crop-urban.png"],
            measurements: "/products/remera-crop-de-mujer-negra/Medidas1.png"
        },
        category: "Remeras Crop",
        color: "Negro",
        // La crop NO viene en negro — colores reales: amarillo, chocolate, gris melange, visón.
        available: false
    },
    {
        id: "remera-crop-chocolate",
        name: "Remera Crop Mujer - Chocolate",
        price: "$23.500",
        description: "Remera crop en color chocolate, tendencia de temporada. Tono cálido y elegante en algodón premium.",
        images: {
            main: "/products/remera-crop-de-mujer-chocolate/mockups nuevos productos-5.png",
            lifestyle: ["/products/remera-crop-de-mujer-chocolate/back.jpeg", "/products/remera-crop-de-mujer-chocolate/crop-lifestyle.png", "/products/remera-crop-de-mujer-chocolate/crop-urban.png"],
            measurements: "/products/remera-crop-de-mujer-chocolate/Medidas1.png"
        },
        category: "Remeras Crop",
        color: "Chocolate",
        available: true
    },
    {
        id: "remera-crop-gris",
        name: "Remera Crop Mujer - Gris Melange",
        price: "$23.500",
        description: "Remera crop clásica en gris melange. El básico infaltable con un toque urbano.",
        images: {
            main: "/products/remera-crop-de-mujer-gris/mockups nuevos productos-6.png",
            lifestyle: ["/products/remera-crop-de-mujer-gris/back.jpeg", "/products/remera-crop-de-mujer-gris/crop-lifestyle.png", "/products/remera-crop-de-mujer-gris/crop-urban.png"],
            measurements: "/products/remera-crop-de-mujer-gris/Medidas1.png"
        },
        category: "Remeras Crop",
        color: "Gris Melange",
        available: true
    },
    {
        id: "remera-crop-amarillo",
        name: "Remera Crop Mujer - Amarillo",
        price: "$23.500",
        description: "Remera crop en amarillo vibrante. Color lleno de energía para destacar tu outfit.",
        images: {
            main: "/products/remera-crop-de-mujer-amarillo/mockups nuevos productos-7.png",
            lifestyle: ["/products/remera-crop-de-mujer-amarillo/back.jpeg", "/products/remera-crop-de-mujer-amarillo/crop-lifestyle.png", "/products/remera-crop-de-mujer-amarillo/crop-urban.png"],
            measurements: "/products/remera-crop-de-mujer-amarillo/Medidas1.png"
        },
        category: "Remeras Crop",
        color: "Amarillo",
        available: true
    },
    {
        id: "remera-crop-vison",
        name: "Remera Crop Mujer - Visón",
        price: "$23.500",
        description: "Remera crop en visón, un tostado claro elegante y atemporal. Algodón suave con calce relajado.",
        images: {
            main: "/products/remera-crop-de-mujer-vison/front.png",
            lifestyle: ["/products/remera-crop-de-mujer-vison/back.png"],
            measurements: "/products/remera-crop-de-mujer-vison/Medidas1.png"
        },
        category: "Remeras Crop",
        color: "Visón",
        available: true
    },
    {
        id: "buzo-cuello-redondo-negro",
        name: "Buzo Cuello Redondo - Negro",
        price: "$43.000",
        description: "Buzo de cuello redondo estilo oversize en negro. Clásico y versátil, ideal para cualquier ocasión. Algodón premium.",
        images: {
            main: "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png",
            lifestyle: ["/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/back.jpeg", "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/Buzo_Cuello_Redondo_Negro_Mujer_Lifestyle.png"],
            measurements: "/products/size-charts/crewneck.png"
        },
        category: "Buzos (Crewneck)",
        color: "Negro",
        available: true
    },
    {
        id: "remera-clasica-mujer-blanca",
        name: "Remera Clásica Mujer - Blanca",
        price: "$28.600",
        description: "Remera clásica de mujer en blanco. Corte femenino y cómodo. Algodón suave perfecto para uso diario.",
        images: {
            main: "/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png",
            lifestyle: ["/products/remera-clasica-woman-blanca/back.jpeg", "/products/remera-clasica-woman-blanca/Remera_Woman_Urban.jpeg"],
            measurements: "/products/remera-clasica-woman-blanca/Medidas2.png"
        },
        category: "Remeras Mujer",
        color: "Blanca",
        available: true
    },
    {
        id: "buzo-cuello-redondo-blanco",
        name: "Buzo Cuello Redondo - Blanco",
        price: "$43.000",
        description: "Buzo de cuello redondo estilo oversize en blanco. Lienzo puro para tu creatividad. Algodón de alta calidad y fit relajado.",
        images: {
            main: "/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/mockups nuevos productos-9.png",
            lifestyle: ["/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/Buzo_Cuello_Redondo_Blanco_Mujer_Lifestyle.png"],
            measurements: "/products/size-charts/crewneck.png"
        },
        category: "Buzos (Crewneck)",
        color: "Blanco",
        available: true
    },
    {
        id: "buzo-cuello-redondo-stone-wash",
        name: "Buzo Cuello Redondo - Stone Wash",
        price: "$43.000",
        description: "Buzo de cuello redondo con efecto Stone Wash. Estilo único y textura premium frizada. Oversize y super cómodo.",
        images: {
            main: "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/mockups nuevos productos-10.png",
            lifestyle: ["/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/back.jpeg", "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/Buzo_Cuello_Redondo_Blanco_Mujer_Lifestyle.png"],
            measurements: "/products/size-charts/crewneck.png"
        },
        category: "Buzos (Crewneck)",
        color: "Stone Wash",
        available: true
    },
    {
        id: "remera-clasica-mujer-negra",
        name: "Remera Clásica Mujer - Negra",
        price: "$28.600",
        description: "Remera clásica de mujer en negro. El básico indispensable en algodón de alta densidad. Corte favorecedor.",
        images: {
            main: "/products/remera-clasica-woman-negra/mockups nuevos productos-3.png",
            lifestyle: ["/products/remera-clasica-woman-negra/back.jpeg", "/products/remera-clasica-woman-negra/Remera_Woman_Urban.jpeg"],
            measurements: "/products/remera-clasica-woman-negra/Medidas2.png"
        },
        category: "Remeras Mujer",
        color: "Negra",
        available: true
    },
    {
        id: "bambino-tshirt-blanco",
        name: "Bambino Remera Infantil - Blanco",
        price: "$23.500",
        description: "Remera infantil unisex en blanco, algodón peinado premium. Talles del 4 al 16, lista para estampar con el diseño que más le guste. La misma calidad Novamente, en versión kids.",
        images: {
            main: "/products/remera-infantil-blanco/front.jpg",
            lifestyle: ["/products/remera-infantil-blanco/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Blanco",
        available: true
    },
    {
        id: "bambino-tshirt-negro",
        name: "Bambino Remera Infantil - Negro",
        price: "$23.500",
        description: "Remera infantil unisex en negro, algodón peinado premium. Talles del 4 al 16. Base oscura que hace resaltar los diseños a todo color.",
        images: {
            main: "/products/remera-infantil-negro/front.jpg",
            lifestyle: ["/products/remera-infantil-negro/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Negro",
        available: true
    },
    {
        id: "bambino-tshirt-gris",
        name: "Bambino Remera Infantil - Gris",
        price: "$23.500",
        description: "Remera infantil unisex en gris melange, algodón peinado premium. Talles del 4 al 16. El básico cómodo para todos los días.",
        images: {
            main: "/products/remera-infantil-gris/front.jpg",
            lifestyle: ["/products/remera-infantil-gris/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Gris",
        available: true
    },
    {
        id: "bambino-tshirt-amarillo",
        name: "Bambino Remera Infantil - Amarillo",
        price: "$23.500",
        description: "Remera infantil unisex en amarillo vibrante, algodón peinado premium. Talles del 4 al 16. Color con energía para los más chicos.",
        images: {
            main: "/products/remera-infantil-amarillo/front.jpg",
            lifestyle: ["/products/remera-infantil-amarillo/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Amarillo",
        available: true
    },
    {
        id: "bambino-tshirt-celeste",
        name: "Bambino Remera Infantil - Celeste",
        price: "$23.500",
        description: "Remera infantil unisex en celeste, algodón peinado premium. Talles del 4 al 16. Un tono suave que queda bien con cualquier estampa.",
        images: {
            main: "/products/remera-infantil-celeste/front.jpg",
            lifestyle: ["/products/remera-infantil-celeste/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Celeste",
        available: true
    },
    {
        id: "bambino-tshirt-rosa",
        name: "Bambino Remera Infantil - Rosa",
        price: "$23.500",
        description: "Remera infantil unisex en rosa, algodón peinado premium. Talles del 4 al 16. Suave, cómoda y lista para personalizar.",
        images: {
            main: "/products/remera-infantil-rosa/front.jpg",
            lifestyle: ["/products/remera-infantil-rosa/back.jpg"],
            measurements: "/products/remera-infantil-medidas.png"
        },
        category: "Remeras Infantiles",
        color: "Rosa",
        available: true
    },
    {
        id: "bahia-totebag-crudo",
        name: "Bahía Totebag - Crudo",
        price: "$20.900",
        description: "Totebag de algodón crudo resistente, asas largas para llevar al hombro. Estampado DTG de alta definición. Medidas aprox. 40×35 cm.",
        images: {
            main: "/products/totebag-crudo/front.jpg",
            lifestyle: ["/products/totebag-crudo/back.jpg"],
            measurements: ""
        },
        category: "Accesorios",
        color: "Crudo",
        available: true
    },
    {
        id: "bahia-totebag-negro",
        name: "Bahía Totebag - Negro",
        price: "$20.900",
        description: "Totebag de algodón crudo resistente, asas largas para llevar al hombro. Estampado DTG de alta definición. Medidas aprox. 40×35 cm.",
        images: {
            main: "/products/totebag-negro/front.jpg",
            lifestyle: ["/products/totebag-negro/back.jpg"],
            measurements: ""
        },
        category: "Accesorios",
        color: "Negro",
        available: true
    }
]

export interface MetaCommerceProduct {
    id: string
    title: string
    description: string
    price: number
    currency: "ARS"
    inStock: boolean
    imageUrl: string
}

/**
 * Extrae el precio numérico de un string de precio de catálogo.
 * Robusto ante prefijos como "Desde $34.000" (toma el primer número).
 * "Desde $34.000" -> 34000 · "$55.000" -> 55000 · sin número -> 0
 */
export function parsePrice(priceStr: string): number {
    const match = priceStr.match(/[\d.]+/)
    return match ? parseInt(match[0].replace(/\./g, ""), 10) : 0
}

/**
 * Get products formatted for Meta Commerce feed
 * Converts relative image URLs to absolute URLs and extracts numeric price
 */
export function getPublishableProducts(): MetaCommerceProduct[] {
    const baseUrl = "https://www.novamente.ar"

    return PRODUCTS
        .filter(product => product.available)
        .map(product => {
            // Extract numeric price from string like "$55.000" -> 55000
            const numericPrice = parsePrice(product.price)

            // Convert relative image URL to absolute
            const imageUrl = product.images.main.startsWith("http")
                ? product.images.main
                : `${baseUrl}${product.images.main}`

            // Sanitize description: remove tabs and newlines
            const sanitizedDescription = product.description
                .replace(/[\t\n\r]/g, " ")
                .replace(/\s+/g, " ")
                .trim()

            return {
                id: product.id,
                title: product.name,
                description: sanitizedDescription,
                price: numericPrice,
                currency: "ARS" as const,
                inStock: product.available,
                imageUrl,
            }
        })
        .filter(product => {
            // Validate required fields
            if (!product.title || !product.price || !product.imageUrl) {
                console.warn(`[Meta Feed] Skipping product with missing data:`, product.id)
                return false
            }
            return true
        })
}
