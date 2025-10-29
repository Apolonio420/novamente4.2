export const MERCHS_GALLERY = [
  { src: "/merchs/nm-merch-001.jpg", alt: "Hoodie negro NovaMente", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-002.jpg", alt: "Hoodie caramelo lifestyle", orientation: "landscape" as const },
  { src: "/merchs/nm-merch-003.jpg", alt: "Remera negra lifestyle", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-004.jpg", alt: "Remera blanca lifestyle", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-005.jpg", alt: "Hoodie frente sobre modelo", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-006.jpg", alt: "Hoodie dorso sobre modelo", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-007.jpg", alt: "Remera oversize negra frente", orientation: "portrait" as const },
  { src: "/merchs/nm-merch-008.jpg", alt: "Remera oversize blanca frente", orientation: "portrait" as const },
] as const

export type MerchGalleryItem = (typeof MERCHS_GALLERY)[number]


