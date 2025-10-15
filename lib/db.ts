import { supabase } from "./supabase"
import { getCurrentUser } from "./auth"
import { v4 as uuidv4 } from "uuid"
import { put } from "@vercel/blob"

export interface SavedImage {
  id: string
  key: string
  url: string
  prompt: string
  created_at: string
  user_id: string | null
  storage_url: string | null
  expires_at: string | null
  urlWithoutBg?: string | null
  hasBgRemoved?: boolean
}

export interface CartItem {
  id: string
  imageUrl: string
  garmentType: string
  garmentColor: string
  size: string
  quantity: number
  price: number
  designPosition: {
    x: number
    y: number
    scale: number
    rotation: number
  }
}

async function checkImageExists(url: string, prompt: string, userId?: string): Promise<SavedImage | null> {
  try {
    console.log("🔍 Checking if image exists with URL:", url.substring(0, 50) + "...")
    const key = createImageKey(url, prompt)
    console.log("🔑 Generated key:", key)

    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(100)

    if (userId) {
      query = query.eq("user_id", userId)
    } else {
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.log("⚠️ Error searching for existing images:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("📭 No existing images found for user")
      return null
    }

    console.log(`🔍 Checking ${data.length} existing images for duplicates...`)

    for (const existingImage of data) {
      const existingKey = createImageKey(existingImage.url, existingImage.prompt)
      if (existingKey === key) {
        console.log("🔍 Found existing image with same key:", existingImage.id)
        return {
          ...existingImage,
          hasBgRemoved: existingImage.has_bg_removed || false,
          urlWithoutBg: existingImage.url_without_bg || null,
        }
      }
    }

    console.log("✨ No duplicate found, image is unique")
    return null
  } catch (error) {
    console.log("⚠️ Error checking for existing image:", error)
    return null
  }
}

// Export que necesitas - saveGeneratedImage
export async function saveGeneratedImage(url: string, prompt: string, userId?: string): Promise<SavedImage | null> {
  try {
    console.log("💾 Saving image to database with parameters:", {
      urlType: typeof url,
      urlLength: typeof url === "string" ? url.length : "N/A",
      promptType: typeof prompt,
      promptLength: typeof prompt === "string" ? prompt.length : "N/A",
      userId,
    })

    // Validar que url sea string
    if (typeof url !== "string" || !url) {
      console.error("❌ URL must be a valid string. Received:", typeof url, url)
      return null
    }

    // Validar que prompt sea string
    if (typeof prompt !== "string" || !prompt) {
      console.error("❌ Prompt must be a valid string. Received:", typeof prompt, prompt)
      return null
    }

    const finalUserId = userId || null
    const key = createImageKey(url, prompt)

    // Evitar duplicados sin depender de una columna 'key' en la BD
    const existing = await checkImageExists(url, prompt, finalUserId)
    if (existing) {
      console.log("♻️ Image already exists (by computed key):", existing.id)
      return existing
    }

    // Evitar guardar base64 muy grandes (límite ~1MB)
    if (typeof url === 'string' && url.startsWith('data:')) {
      const base64 = url.split(',')[1] || ''
      const approxBytes = Math.floor(base64.length * 0.75)
      if (approxBytes > 1_000_000) {
        console.error("⚠️ Skipping save: base64 image too large (>", approxBytes, "bytes)")
        return null
      }
    }

    // (Opcional) Si fuera una URL temporal de DALL·E se podría archivar aquí,
    // pero no dependemos de columnas inexistentes en BD para expiración.

    const imageId = uuidv4()
    
    // Convertir URL temporal a estable inmediatamente si es necesario
    let finalUrl = url
    if (url.includes("X-Amz-Algorithm") || url.includes("X-Amz-Signature")) {
      try {
        const urlMatch = url.match(/\/novamente\/([^\/]+)\/([^\/]+)\/([^\?]+)/)
        if (urlMatch) {
          const [, category, uuid, filename] = urlMatch
          const key = `${category}/${uuid}/${filename}`
          finalUrl = `/api/r2-public?key=${encodeURIComponent(key)}`
          console.log("✅ Converted new image URL to stable proxy:", imageId)
        }
      } catch (conversionError) {
        console.error("⚠️ Error converting new image URL:", conversionError)
      }
    } else if (url.includes("pub-") && url.includes("r2.dev")) {
      try {
        const urlMatch = url.match(/\/processed\/([^\/]+)\/([^\?]+)/)
        if (urlMatch) {
          const [, uuid, filename] = urlMatch
          const key = `processed/${uuid}/${filename}`
          finalUrl = `/api/r2-public?key=${encodeURIComponent(key)}`
          console.log("✅ Converted new public URL to stable proxy:", imageId)
        }
      } catch (conversionError) {
        console.error("⚠️ Error converting new public URL:", conversionError)
      }
    }
    
    const newImage = {
      id: imageId,
      url: finalUrl,
      prompt,
      user_id: finalUserId,
      has_bg_removed: false,
      url_without_bg: null,
    }

    const { data, error } = await supabase.from("images").insert(newImage).select().single()

    if (error) {
      console.error("❌ Error saving image to Supabase:", error)
      return null
    }

    console.log("✅ Image saved successfully to database with permanent storage")
    return {
      ...data,
      hasBgRemoved: data.has_bg_removed || false,
      urlWithoutBg: data.url_without_bg || null,
    }
  } catch (error) {
    console.error("❌ Exception in saveGeneratedImage:", error)
    return null
  }
}

export async function saveImageWithoutBackground(imageId: string, urlWithoutBg: string): Promise<boolean> {
  try {
    console.log("🎭 Saving background-removed version for image:", imageId)

    // Update in database
    const { error } = await supabase
      .from("images")
      .update({
        url_without_bg: urlWithoutBg,
        has_bg_removed: true,
      })
      .eq("id", imageId)

    if (error) {
      console.error("❌ Error updating image in Supabase:", error)

      // Fallback to localStorage for anonymous users
      if (typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          const imageIndex = localImages.findIndex((img: SavedImage) => img.id === imageId)

          if (imageIndex !== -1) {
            localImages[imageIndex] = {
              ...localImages[imageIndex],
              urlWithoutBg: urlWithoutBg,
              hasBgRemoved: true,
            }
            localStorage.setItem("saved_images", JSON.stringify(localImages))
            console.log("✅ Background-removed version saved to localStorage as fallback")
            return true
          }
        } catch (localError) {
          console.error("❌ Error updating localStorage:", localError)
        }
      }
      return false
    }

    // Also update localStorage if available
    if (typeof window !== "undefined") {
      try {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        const imageIndex = localImages.findIndex((img: SavedImage) => img.id === imageId)

        if (imageIndex !== -1) {
          localImages[imageIndex] = {
            ...localImages[imageIndex],
            urlWithoutBg: urlWithoutBg,
            hasBgRemoved: true,
          }
          localStorage.setItem("saved_images", JSON.stringify(localImages))
          console.log("🔄 Also updated localStorage with background-removed version")
        }
      } catch (localError) {
        console.error("⚠️ Could not update localStorage:", localError)
      }
    }

    console.log("✅ Background-removed version saved successfully")
    return true
  } catch (error) {
    console.error("❌ Error in saveImageWithoutBackground:", error)
    return false
  }
}

// Función para obtener imágenes recientes
export async function getRecentImages(userId?: string, limit = 20): Promise<SavedImage[]> {
  try {
    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    } else {
      if (typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          if (localImages.length > 0) {
            return localImages.slice(0, limit)
          }
        } catch (localError) {
          console.error("Error reading from localStorage:", localError)
        }
      }
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching from Supabase:", error)

      // Fallback a localStorage
      if (typeof window !== "undefined") {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        return localImages.slice(0, limit)
      }
      return []
    }

    return (data || []).map((item) => ({
      ...item,
      hasBgRemoved: item.has_bg_removed || false,
      urlWithoutBg: item.url_without_bg || null,
    }))
  } catch (error) {
    console.error("Error in getRecentImages:", error)

    // Fallback a localStorage
    if (typeof window !== "undefined") {
      const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      return localImages.slice(0, limit)
    }
    return []
  }
}

// Función para obtener una imagen por ID
export async function getImageById(id: string): Promise<SavedImage | null> {
  try {
    const { data, error } = await supabase.from("images").select("*").eq("id", id).single()

    if (error) {
      console.error("❌ Error fetching image by ID:", error)
      return null
    }

    return {
      ...data,
      hasBgRemoved: data.has_bg_removed || false,
      urlWithoutBg: data.url_without_bg || null,
    }
  } catch (error) {
    console.error("❌ Error in getImageById:", error)
    return null
  }
}

// Función para eliminar una imagen
export async function deleteImage(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("images").delete().eq("id", id)

    if (error) {
      console.error("Error deleting from Supabase:", error)

      // Fallback a localStorage
      if (typeof window !== "undefined") {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        const filteredImages = localImages.filter((img: SavedImage) => img.id !== id)
        localStorage.setItem("saved_images", JSON.stringify(filteredImages))
      }

      return true
    }

    return true
  } catch (error) {
    console.error("Error in deleteImage:", error)

    // Fallback a localStorage
    if (typeof window !== "undefined") {
      const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      const filteredImages = localImages.filter((img: SavedImage) => img.id !== id)
      localStorage.setItem("saved_images", JSON.stringify(filteredImages))
    }

    return true
  }
}

// Funciones del carrito
export async function getCartItems(userId?: string): Promise<CartItem[]> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      if (typeof window !== "undefined") {
        const cartItems = localStorage.getItem("cart_items")
        return cartItems ? JSON.parse(cartItems) : []
      }
      return []
    }

    const { data, error } = await supabase.from("cart_items").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error fetching cart items:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCartItems:", error)
    return []
  }
}

export async function addToCart(item: Omit<CartItem, "id">, userId?: string): Promise<boolean> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      if (typeof window !== "undefined") {
        const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
        const newItem: CartItem = {
          ...item,
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        }
        existingItems.push(newItem)
        localStorage.setItem("cart_items", JSON.stringify(existingItems))
      }
      return true
    }

    const { error } = await supabase.from("cart_items").insert({
      ...item,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding to cart:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in addToCart:", error)
    return false
  }
}

export async function removeFromCart(itemId: string, userId?: string): Promise<boolean> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      if (typeof window !== "undefined") {
        const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
        const filteredItems = existingItems.filter((item: CartItem) => item.id !== itemId)
        localStorage.setItem("cart_items", JSON.stringify(filteredItems))
      }
      return true
    }

    const { error } = await supabase.from("cart_items").delete().eq("id", itemId).eq("user_id", userId)

    if (error) {
      console.error("Error removing from cart:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in removeFromCart:", error)
    return false
  }
}

export async function updateCartItem(itemId: string, updates: Partial<CartItem>, userId?: string): Promise<boolean> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      if (typeof window !== "undefined") {
        const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
        const itemIndex = existingItems.findIndex((item: CartItem) => item.id === itemId)

        if (itemIndex !== -1) {
          existingItems[itemIndex] = { ...existingItems[itemIndex], ...updates }
          localStorage.setItem("cart_items", JSON.stringify(existingItems))
          return true
        }
      }

      return false
    }

    const { error } = await supabase.from("cart_items").update(updates).eq("id", itemId).eq("user_id", userId)

    if (error) {
      console.error("Error updating cart item:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateCartItem:", error)
    return false
  }
}

// Función para limpiar imágenes antiguas
export async function cleanupOldImages(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase.from("images").delete().lt("created_at", thirtyDaysAgo.toISOString())

    if (error) {
      console.error("Error cleaning up old images:", error)
    } else {
      console.log("✅ Old images cleaned up successfully")
    }
  } catch (error) {
    console.error("Error in cleanupOldImages:", error)
  }
}

// Función para obtener el historial de imágenes
export async function getImageHistory(limit = 20, sessionId?: string): Promise<SavedImage[]> {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || null

    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    } else {
      // Si no hay userId ni sessionId, no devolvemos imágenes compartidas globales
      query = query.eq("session_id", "__none__")
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error fetching image history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("❌ Error in getImageHistory:", error)
    return []
  }
}

// Función para obtener imágenes del usuario
export async function getUserImages(userId?: string, sessionId?: string): Promise<SavedImage[]> {
  try {
    console.log("🔍 Getting user images for userId:", userId)

    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(50)

    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    } else {
      // Si no hay user ni session, no devolver nada
      query = query.eq("session_id", "__none__")
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error fetching user images:", error)
      return []
    }

    // En cliente, no intentamos resolver/perfilar URLs de R2 (evita CORS/SDK en browser)
    if (typeof window !== 'undefined') {
      const clientImages = (data || []).map((item) => ({
        ...item,
        hasBgRemoved: item.has_bg_removed || false,
        urlWithoutBg: item.url_without_bg || null,
      }))
      return clientImages.slice(0, 20) as any
    }

    const processedImages = await Promise.all(
      (data || []).map(async (item) => {
        let finalUrl = item.url

        // Verificar si la URL es de R2 (temporal, permanente o pública antigua) y convertir a working URL
        if (item.url && (item.url.includes("r2.cloudflarestorage.com") || item.url.includes("r2.dev"))) {
          if (item.url.includes("X-Amz-Algorithm") || item.url.includes("X-Amz-Signature")) {
            // Es una URL temporal firmada. Persistimos una URL estable relativa que
            // siempre redirige a una URL válida sin volver a convertir cada vez.
            try {
              const urlMatch = item.url.match(/\/novamente\/([^\/]+)\/([^\/]+)\/([^\?]+)/)
              if (urlMatch) {
                const [, category, uuid, filename] = urlMatch
                const key = `${category}/${uuid}/${filename}`
                const proxyUrl = `/api/r2-public?key=${encodeURIComponent(key)}`
                finalUrl = proxyUrl
                console.log("✅ Converted signed URL to stable proxy URL:", item.id)
                await supabase.from("images").update({ url: proxyUrl }).eq("id", item.id)
              }
            } catch (conversionError) {
              console.error("⚠️ Error converting signed URL:", conversionError)
            }
          } else if (item.url.includes("pub-") && item.url.includes("r2.dev")) {
            // URL pública antigua → persistir URL proxy estable
            try {
              const urlMatch = item.url.match(/\/processed\/([^\/]+)\/([^\?]+)/)
              if (urlMatch) {
                const [, uuid, filename] = urlMatch
                const key = `processed/${uuid}/${filename}`
                const proxyUrl = `/api/r2-public?key=${encodeURIComponent(key)}`
                finalUrl = proxyUrl
                console.log("✅ Converted old public URL to stable proxy URL:", item.id)
                await supabase.from("images").update({ url: proxyUrl }).eq("id", item.id)
              }
            } catch (conversionError) {
              console.error("⚠️ Error converting old public URL:", conversionError)
            }
          } else {
            // Ya es una URL permanente de R2; evitar HEAD en SSR para no romper por fallas de red
            finalUrl = item.url
          }
        }

        return {
          ...item,
          url: finalUrl,
          hasBgRemoved: item.has_bg_removed || false,
          urlWithoutBg: item.url_without_bg || null,
        }
      }),
    )

    console.log("✅ Processed", processedImages.length, "images")
    return processedImages.slice(0, 20)
  } catch (error) {
    console.error("❌ Error in getUserImages:", error)
    return []
  }
}

// Función para limpiar imágenes expiradas
export async function cleanupExpiredImages(): Promise<{
  deleted: number
  archived: number
  duplicatesRemoved: number
}> {
  try {
    console.log("🧹 Starting cleanup of expired images...")

    let deleted = 0,
      archived = 0,
      duplicatesRemoved = 0

    // Delete expired images without storage_url
    const { data: expiredWithoutStorage } = await supabase
      .from("images")
      .select("id")
      .lt("expires_at", new Date().toISOString())
      .is("storage_url", null)

    if (expiredWithoutStorage?.length) {
      const { error } = await supabase
        .from("images")
        .delete()
        .in(
          "id",
          expiredWithoutStorage.map((img) => img.id),
        )

      if (!error) {
        deleted = expiredWithoutStorage.length
        console.log(`🗑️ Deleted ${deleted} expired images without storage`)
      }
    }

    // Try to archive expired images that still have accessible URLs
    const { data: expiredWithUrls } = await supabase
      .from("images")
      .select("*")
      .lt("expires_at", new Date().toISOString())
      .is("storage_url", null)
      .not("url", "is", null)

    for (const img of expiredWithUrls || []) {
      try {
        const filename = `cleanup-${img.id}`
        const storageUrl = await archiveExternalImageToPermanent(img.url, filename)

        await supabase.from("images").update({ storage_url: storageUrl }).eq("id", img.id)

        archived++
      } catch (archiveError) {
        console.error(`⚠️ Failed to archive expired image ${img.id}:`, archiveError)
      }
    }

    // Remove duplicates by key (keep newest)
    const { data: duplicates } = await supabase
      .from("images")
      .select("id, key, created_at")
      .order("created_at", { ascending: false })

    const seenKeys = new Set<string>()
    const duplicateIds: string[] = []

    duplicates?.forEach((img) => {
      if (seenKeys.has(img.key)) {
        duplicateIds.push(img.id)
      } else {
        seenKeys.add(img.key)
      }
    })

    if (duplicateIds.length) {
      const { error } = await supabase.from("images").delete().in("id", duplicateIds)

      if (!error) {
        duplicatesRemoved = duplicateIds.length
        console.log(`🔄 Removed ${duplicatesRemoved} duplicate images`)
      }
    }

    console.log(
      `✅ Cleanup complete: ${deleted} deleted, ${archived} archived, ${duplicatesRemoved} duplicates removed`,
    )
    return { deleted, archived, duplicatesRemoved }
  } catch (error) {
    console.error("❌ Error in cleanupExpiredImages:", error)
    return { deleted: 0, archived: 0, duplicatesRemoved: 0 }
  }
}

export async function archiveExternalImageToPermanent(url: string, filename: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const buf = await res.arrayBuffer()

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`generated/${filename}.png`, new Blob([buf]), { access: "public" })
    return blob.url // permanente
  } else {
    // Fallback to Supabase Storage
    const { data, error } = await supabase.storage
      .from("generated-images")
      .upload(`${filename}.png`, buf, { contentType: "image/png" })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from("generated-images").getPublicUrl(data.path)

    return publicUrl
  }
}

function isDalleUrlExpired(url: string): boolean {
  if (!url.includes("oaidalleapiprodscus.blob.core.windows.net")) {
    return false // No es una URL de DALL-E
  }

  try {
    const urlObj = new URL(url)
    const seParam = urlObj.searchParams.get("se")
    if (seParam) {
      const expirationTime = new Date(seParam)
      const now = new Date()
      // Agregar buffer de 30 minutos para evitar URLs que expiran pronto
      const bufferTime = new Date(now.getTime() + 30 * 60 * 1000)
      return bufferTime >= expirationTime
    }
  } catch (error) {
    console.log("⚠️ Could not parse URL for expiration check:", url.substring(0, 50))
  }

  return false
}

function createImageKey(url: string, prompt: string): string {
  try {
    const urlObj = new URL(url)
    // Para URLs de DALL-E, extraer el ID único de la imagen del pathname
    if (url.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      const pathname = urlObj.pathname
      const imageIdMatch = pathname.match(/img-([a-zA-Z0-9]+)/)
      if (imageIdMatch) {
        const imageId = imageIdMatch[0] // img-XXXXX
        return `dalle:${imageId}`
      }
      // Fallback al pathname completo si no se encuentra el patrón
      return `dalle:${pathname}`
    }
    // Para otras URLs, usar la URL completa con prompt
    return `${url}|${prompt.trim().toLowerCase()}`
  } catch (error) {
    // Fallback si no se puede parsear la URL
    console.log("⚠️ Could not parse URL for key creation, using full URL")
    return `${url}|${prompt.trim().toLowerCase()}`
  }
}
