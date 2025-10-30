export const MERCHS_GALLERY = [
  { src: "/merchs/nm-merch-001.webp", alt: "NovaMente merch 001", orientation: "landscape" },
  { src: "/merchs/nm-merch-002.webp", alt: "NovaMente merch 002", orientation: "portrait" },
  { src: "/merchs/nm-merch-003.webp", alt: "NovaMente merch 003", orientation: "landscape" },
  { src: "/merchs/nm-merch-004.webp", alt: "NovaMente merch 004", orientation: "portrait" },
  { src: "/merchs/nm-merch-005.webp", alt: "NovaMente merch 005", orientation: "landscape" },
  { src: "/merchs/nm-merch-006.webp", alt: "NovaMente merch 006", orientation: "portrait" },
  { src: "/merchs/nm-merch-007.webp", alt: "NovaMente merch 007", orientation: "landscape" },
  { src: "/merchs/nm-merch-008.webp", alt: "NovaMente merch 008", orientation: "portrait" },
] as const

export type MerchGalleryItem = (typeof MERCHS_GALLERY)[number]


