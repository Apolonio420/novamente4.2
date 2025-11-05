export const MERCHS_GALLERY = [
  // Usamos las imágenes nuevas provistas (Gemini_* e IMG_*). 
  { src: "/merchs/Gemini_Generated_Image_1miq231miq231miq.png", alt: "Merch Gemini 1" },
  { src: "/merchs/Gemini_Generated_Image_2eltrm2eltrm2elt.png", alt: "Merch Gemini 2" },
  { src: "/merchs/Gemini_Generated_Image_34v3934v3934v393.png", alt: "Merch Gemini 3" },
  { src: "/merchs/Gemini_Generated_Image_da70nkda70nkda70.png", alt: "Merch Gemini 4" },
  { src: "/merchs/Gemini_Generated_Image_hn2xkphn2xkphn2x.png", alt: "Merch Gemini 5" },
  { src: "/merchs/Gemini_Generated_Image_mzw9evmzw9evmzw9.png", alt: "Merch Gemini 6" },
  { src: "/merchs/Gemini_Generated_Image_n1qqgzn1qqgzn1qq.png", alt: "Merch Gemini 7" },
  { src: "/merchs/Gemini_Generated_Image_ro3xrrro3xrrro3x.png", alt: "Merch Gemini 8" },
  { src: "/merchs/Gemini_Generated_Image_rqglqhrqglqhrqgl.png", alt: "Merch Gemini 9" },
  { src: "/merchs/IMG_2242.jpg", alt: "Merch IMG 2242" },
  { src: "/merchs/IMG_2256.jpg", alt: "Merch IMG 2256" },
] as const

export type MerchGalleryItem = (typeof MERCHS_GALLERY)[number]


