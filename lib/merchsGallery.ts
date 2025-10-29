export const MERCHS_GALLERY = [
  // Usamos imágenes existentes en /public para evitar 404. Se pueden reemplazar por /merchs/*.jpg cuando estén.
  { src: "/products/hoodie-negro-lifestyle-1.jpeg", alt: "Hoodie negro NovaMente", orientation: "landscape" as const },
  { src: "/products/hoodie-caramel-lifestyle-1.jpeg", alt: "Hoodie caramelo lifestyle", orientation: "landscape" as const },
  { src: "/products/tshirt-aldea-negro-lifestyle-1.jpeg", alt: "Remera negra lifestyle", orientation: "portrait" as const },
  { src: "/products/tshirt-aldea-blanco-lifestyle-1.jpeg", alt: "Remera blanca lifestyle", orientation: "portrait" as const },
  { src: "/garments/hoodie-model-front.jpeg", alt: "Hoodie frente sobre modelo", orientation: "portrait" as const },
  { src: "/garments/hoodie-model-back.jpeg", alt: "Hoodie dorso sobre modelo", orientation: "portrait" as const },
  { src: "/garments/tshirt-black-oversize-front.jpeg", alt: "Remera oversize negra frente", orientation: "portrait" as const },
  { src: "/garments/tshirt-white-oversize-front.jpeg", alt: "Remera oversize blanca frente", orientation: "portrait" as const },
] as const

export type MerchGalleryItem = (typeof MERCHS_GALLERY)[number]


