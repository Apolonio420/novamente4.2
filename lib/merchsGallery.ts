export const MERCHS_GALLERY = [
  // Nuevas imágenes provistas por el usuario (colocar los archivos en /public/merchs/ con estos nombres)
  { src: "/merchs/nm-merch-009.webp", alt: "Hoodie caramelo BONFIRE SOCIETY (dorso)", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-010.webp", alt: "Remera azul AURA CLUB (dorso con caligrafía)", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-011.webp", alt: "Remera negra WILD SOL (pecho)", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-012.webp", alt: "Hoodie negro BONFIRE SOCIETY (dorso logo)", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-013.webp", alt: "Hoodie negro WILD SOL en puerta verde", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-014.webp", alt: "Remera negra AURA CLUB símbolo yin-yang", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-015.webp", alt: "Remera blanca BONFIRE SOCIETY fuego (frente)", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-016.webp", alt: "Hoodie negro AURA CLUB frente completo", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-017.webp", alt: "Remera blanca con águila (detalle pecho)", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-018.webp", alt: "Remera negra con águila (pecho)", orientation: "portrait" as const },
] as const

export type MerchGalleryItem = (typeof MERCHS_GALLERY)[number]


