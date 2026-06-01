// @ts-nocheck
import { supabase } from "./supabase"
import { supabaseAdmin } from "./supabase-admin"
import { getCurrentUser } from "./auth"
import { v4 as uuidv4 } from "uuid"
import { put } from "@vercel/blob"
import { normalizeR2Key, toPublicR2Url } from "./r2"

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

    let query = (supabase.from("images") as any).select("*").order("created_at", { ascending: false }).limit(100)

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
export async function saveGeneratedImage(url: string, prompt: string, userId?: string, sessionId?: string): Promise<SavedImage | null> {
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

    // Normalizar URL a key limpio (sin firmas, sin proxy, sin query params)
    const cleanKey = normalizeR2Key(url)

    if (!cleanKey) {
      console.error("❌ Could not normalize URL to key:", url.substring(0, 100))
      return null
    }

    // Obtener la URL pública completa para guardar en la base de datos
    // Esto evita que el usuario vea "links locales" y permite ver la imagen directamente en Supabase
    const finalUrlToSave = toPublicR2Url(url)

    console.log("✅ Normalized URL to clean key:", cleanKey.substring(0, 100))
    console.log("🔗 URL to be saved in DB:", finalUrlToSave ? finalUrlToSave.substring(0, 100) : "null")

    const newImage: Record<string, unknown> = {
      id: imageId,
      url: finalUrlToSave,
      storage_key: cleanKey,
      prompt,
      user_id: finalUserId,
      has_bg_removed: false,
      url_without_bg: null,
    }

    // Save session_id for anonymous users so we can retrieve their history
    if (!finalUserId && sessionId) {
      newImage.session_id = sessionId
    }

    const { data, error } = await (supabase.from("images") as any).insert(newImage).select().single()

    if (error) {
      console.error("❌ Error saving image to Supabase:", error)
      return null
    }

    console.log("✅ Image saved successfully to database with permanent storage")

    // Devolver imagen con URL pública transformada (no el key)
    const publicUrl = toPublicR2Url(data.url || data.storage_key || cleanKey)
    const publicUrlWithoutBg = data.url_without_bg ? toPublicR2Url(data.url_without_bg) : null

    return {
      ...data,
      url: publicUrl, // Devolver URL pública al cliente
      hasBgRemoved: data.has_bg_removed || false,
      urlWithoutBg: publicUrlWithoutBg,
    }
  } catch (error) {
    console.error("❌ Exception in saveGeneratedImage:", error)
    return null
  }
}

export async function saveImageWithoutBackground(imageId: string, urlWithoutBg: string): Promise<boolean> {
  try {
    console.log("🎭 Saving background-removed version for image:", imageId)

    // Normalizar la URL a key limpio antes de guardar
    const cleanKey = normalizeR2Key(urlWithoutBg)

    if (!cleanKey) {
      console.error("❌ Could not normalize urlWithoutBg:", urlWithoutBg.substring(0, 100))
      return false
    }

    // Obtener la URL pública completa para guardar
    const finalUrlToSave = toPublicR2Url(urlWithoutBg)

    // Update in database (guardar la URL pública completa)
    const { error } = await (supabase.from("images") as any)
      .update({
        url_without_bg: finalUrlToSave,
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
      url: toPublicR2Url(normalizeR2Key(item.url || item.storage_key || item.key || '')),
      hasBgRemoved: item.has_bg_removed || false,
      urlWithoutBg: item.url_without_bg ? toPublicR2Url(normalizeR2Key(item.url_without_bg)) : null,
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
      url: toPublicR2Url(normalizeR2Key(data.url || data.storage_key || data.key || '')),
      hasBgRemoved: data.has_bg_removed || false,
      urlWithoutBg: data.url_without_bg ? toPublicR2Url(normalizeR2Key(data.url_without_bg)) : null,
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
      if ((error as any).code === '42703' || (error as any).code === 'PGRST204') {
        // Columna session_id aún no existe en el entorno. Devolver vacío para invitados.
        return []
      }
      console.error("❌ Error fetching image history:", error)
      return []
    }

    // Devolver URLs públicas transformadas
    const { toPublicR2Url, normalizeR2Key } = await import('./r2')
    return (data || []).map((item) => ({
      ...item,
      url: toPublicR2Url(normalizeR2Key(item.url || item.storage_key || item.key || '')),
      hasBgRemoved: item.has_bg_removed || false,
      urlWithoutBg: item.url_without_bg ? toPublicR2Url(normalizeR2Key(item.url_without_bg)) : null,
    }))
  } catch (error) {
    console.error("❌ Error in getImageHistory:", error)
    return []
  }
}

// Función para obtener imágenes del usuario
export async function getUserImages(userId?: string, sessionId?: string): Promise<SavedImage[]> {
  try {
    // Mejorar logging para evitar confusión con undefined
    if (userId) {
      console.log("🔍 Getting user images for userId:", userId.substring(0, 8) + "...")
    } else if (sessionId) {
      console.log("🔍 Getting user images for sessionId:", sessionId.substring(0, 8) + "...")
    } else {
      // No hacer fetch si no hay userId ni sessionId - retornar vacío directamente
      // No loguear como error, solo skip silenciosamente
      return []
    }

    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(50)

    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      try {
        query = query.eq("session_id", sessionId)
      } catch {
        // Si no existe la columna, dejar query sin filtro adicional
      }
    } else {
      // Si no hay user ni session, no devolver nada
      // Ya retornamos vacío arriba, pero por seguridad
      return []
    }

    const { data, error } = await query

    if (error) {
      if ((error as any).code === '42703' || (error as any).code === 'PGRST204') {
        // Sin columna session_id: retornar vacío para evitar exponer imágenes globales
        return []
      }
      console.error("❌ Error fetching user images:", error)
      return []
    }

    // En cliente, usar proxy también
    if (typeof window !== 'undefined') {
      const { normalizeR2Key } = require('./r2')
      const clientImages = (data || []).map((item) => {
        const cleanKey = normalizeR2Key(item.storage_key || item.url || item.key || '')

        let imageUrl = item.url || ''
        if (cleanKey && !cleanKey.startsWith('data:')) {
          imageUrl = `/api/proxy-image?key=${encodeURIComponent(cleanKey)}`
        }

        const urlWithoutBgKey = item.url_without_bg ? normalizeR2Key(item.url_without_bg) : null

        return {
          ...item,
          url: imageUrl,
          key: cleanKey,
          hasBgRemoved: item.has_bg_removed || false,
          urlWithoutBg: urlWithoutBgKey ? `/api/proxy-image?key=${encodeURIComponent(urlWithoutBgKey)}` : null,
        }
      })
      return clientImages.slice(0, 20) as any
    }

    // En servidor, normalizar y usar proxy para imágenes
    const processedImages = (data || []).map((item) => {
      // Normalizar el key actual (puede ser URL firmada, proxy, o key limpio)
      const currentValue = item.url || item.storage_key || item.key || ''
      const cleanKey = normalizeR2Key(currentValue)

      // Usar proxy para imágenes de R2
      let imageUrl = ''
      if (cleanKey) {
        // Si el key parece ser de R2, usar proxy
        if (cleanKey.includes('images/') || cleanKey.includes('original/') || cleanKey.includes('processed/')) {
          imageUrl = `/api/proxy-image?key=${encodeURIComponent(cleanKey)}`
        } else {
          // Si no, usar la URL pública directamente (puede ser local o externa)
          imageUrl = toPublicR2Url(cleanKey) || cleanKey
        }
      }

      return {
        ...item,
        url: imageUrl,
        key: cleanKey, // Guardar el key limpio también
        hasBgRemoved: item.has_bg_removed || false,
        urlWithoutBg: item.url_without_bg ?
          (normalizeR2Key(item.url_without_bg) ?
            `/api/proxy-image?key=${encodeURIComponent(normalizeR2Key(item.url_without_bg))}` :
            null) :
          null,
      }
    })

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

// ============================================
// FUNCIONES DE PEDIDOS (ORDERS)
// ============================================

export interface OrderItem {
  item_name: string
  product_type: string
  product_color: string
  product_size: string
  quantity: number
  unit_price: number
  total_price: number
  image_url?: string | null
  mockup_url?: string | null
  front_mockup_url?: string | null
  back_mockup_url?: string | null
  front_design_url?: string | null
  back_design_url?: string | null
  front_stamp_size?: string | null
  back_stamp_size?: string | null
  front_stamp_position?: string | null
  back_stamp_position?: string | null
  design_position?: any
  custom_design?: any
  metadata?: any
}

export interface Order {
  id?: string
  order_number: string
  user_id?: string | null
  tenant_id?: string | null
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  customer_phone?: string | null
  customer_dni?: string | null
  customer_dni_type?: string | null
  shipping_address?: string | null
  shipping_city?: string | null
  shipping_postal_code?: string | null
  shipping_zone?: string | null // 'BA' | 'RESTO' — se guarda en metadata
  payment_method: 'mercadopago' | 'transferencia'
  payment_status?: string
  payment_id?: string | null
  external_reference?: string | null
  mercado_pago_preference_id?: string | null
  subtotal: number
  shipping_cost: number
  total: number
  currency?: string
  status?: string
  notes?: string | null
  metadata?: any
  items: OrderItem[]
}

/**
 * Genera un número de pedido único en formato NOV-YYYY-NNNN
 */
function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `NOV-${year}${month}${day}-${random}`
}

/**
 * Crea un nuevo pedido con todos sus items
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'order_number'>): Promise<Order | null> {
  try {
    console.log("📦 Creating order with", orderData.items.length, "items")

    const user = await getCurrentUser()
    const userId = user?.id || null

    // Generar número de pedido único
    let orderNumber = generateOrderNumber()
    let attempts = 0
    const maxAttempts = 10

    // Verificar que el número de pedido sea único
    while (attempts < maxAttempts) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .single()

      if (!existing) {
        break // Número único encontrado
      }

      orderNumber = generateOrderNumber()
      attempts++
    }

    if (attempts >= maxAttempts) {
      console.error("❌ Could not generate unique order number after", maxAttempts, "attempts")
      return null
    }

    // Preparar datos del pedido
    const orderInsert = {
      order_number: orderNumber,
      user_id: userId,
      tenant_id: orderData.tenant_id || null,
      customer_email: orderData.customer_email,
      customer_first_name: orderData.customer_first_name,
      customer_last_name: orderData.customer_last_name,
      customer_phone: orderData.customer_phone || null,
      // Express checkout: si la dirección/ciudad no vinieron pre-pago se completan
      // post-pago en /checkout/success · usamos placeholder para no romper NOT NULL
      shipping_address: orderData.shipping_address || 'PENDIENTE_POST_PAGO',
      shipping_city: orderData.shipping_city || 'PENDIENTE_POST_PAGO',
      shipping_postal_code: orderData.shipping_postal_code || null,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status || 'pending',
      payment_id: orderData.payment_id || null,
      external_reference: orderData.external_reference || null,
      mercado_pago_preference_id: orderData.mercado_pago_preference_id || null,
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shipping_cost,
      total: orderData.total,
      total_amount: orderData.total, // Populate legacy/alternative column
      currency: orderData.currency || 'ARS',
      status: orderData.status || 'pending',
      notes: orderData.notes || null,
      metadata: {
        ...(orderData.metadata || {}),
        ...(orderData.shipping_zone ? { shipping_zone: orderData.shipping_zone } : {}),
      },
      id: uuidv4(), // Explicitly generate ID to avoid "null value in column id" error
    }

    // Insertar pedido usando supabaseAdmin para bypass RLS
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderInsert)
      .select()
      .single()

    if (orderError) {
      console.error("❌ Error creating order:", orderError)
      return null
    }

    console.log("✅ Order created:", order.id, "Number:", order.order_number)

    // Insertar items del pedido
    const orderItems = orderData.items.map(item => ({
      id: uuidv4(), // Explicitly generate ID
      order_id: order.id,
      item_name: item.item_name,
      name: item.item_name, // Populate legacy/alternative column
      product_type: item.product_type,
      garment_type: item.product_type, // Populate legacy/alternative column
      product_color: item.product_color,
      color: item.product_color, // Populate legacy/alternative column
      product_size: item.product_size,
      size: item.product_size, // Populate legacy/alternative column
      quantity: item.quantity,
      unit_price: item.unit_price,
      price: item.unit_price, // Populate legacy/alternative column
      total_price: item.total_price,
      image_url: item.image_url || null,
      mockup_url: item.mockup_url || null,
      front_mockup_url: item.front_mockup_url || null,
      back_mockup_url: item.back_mockup_url || null,
      front_design_url: item.front_design_url || null,
      back_design_url: item.back_design_url || null,
      front_stamp_size: item.front_stamp_size || null,
      back_stamp_size: item.back_stamp_size || null,
      front_stamp_position: item.front_stamp_position || null,
      back_stamp_position: item.back_stamp_position || null,
      design_position: item.design_position || null,
      custom_design: item.custom_design || null,
      metadata: item.metadata || null,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error("❌ Error creating order items:", itemsError)
      // Intentar eliminar el pedido si falla la inserción de items
      await supabaseAdmin.from("orders").delete().eq("id", order.id)
      return null
    }

    console.log("✅ Order items created:", orderItems.length)

    // Obtener el pedido completo con items
    const fullOrder = await getOrderById(order.id)
    return fullOrder
  } catch (error) {
    console.error("❌ Exception in createOrder:", error)
    return null
  }
}

/**
 * Obtiene un pedido por ID con todos sus items
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("❌ Error fetching order:", orderError)
      return null
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (itemsError) {
      console.error("❌ Error fetching order items:", itemsError)
      return null
    }

    return {
      ...order,
      items: items || [],
    }
  } catch (error) {
    console.error("❌ Exception in getOrderById:", error)
    return null
  }
}

/**
 * Obtiene un pedido por número de pedido
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      console.error("❌ Error fetching order by number:", orderError)
      return null
    }

    return await getOrderById(order.id)
  } catch (error) {
    console.error("❌ Exception in getOrderByNumber:", error)
    return null
  }
}

/**
 * Obtiene pedidos por external_reference (usado por MercadoPago)
 */
export async function getOrderByExternalReference(externalReference: string): Promise<Order | null> {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("external_reference", externalReference)
      .single()

    if (orderError || !order) {
      console.error("❌ Error fetching order by external reference:", orderError)
      return null
    }

    return await getOrderById(order.id)
  } catch (error) {
    console.error("❌ Exception in getOrderByExternalReference:", error)
    return null
  }
}

/**
 * Actualiza un pedido existente
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<boolean> {
  try {
    const { items, ...orderUpdates } = updates

    // Actualizar pedido
    const updateData: any = {}
    if (orderUpdates.payment_status !== undefined) updateData.payment_status = orderUpdates.payment_status
    if (orderUpdates.payment_id !== undefined) updateData.payment_id = orderUpdates.payment_id
    if (orderUpdates.status !== undefined) updateData.status = orderUpdates.status
    if (orderUpdates.mercado_pago_preference_id !== undefined) updateData.mercado_pago_preference_id = orderUpdates.mercado_pago_preference_id
    if (orderUpdates.notes !== undefined) updateData.notes = orderUpdates.notes
    if (orderUpdates.metadata !== undefined) updateData.metadata = orderUpdates.metadata

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)

    if (error) {
      console.error("❌ Error updating order:", error)
      return false
    }

    console.log("✅ Order updated:", orderId)
    return true
  } catch (error) {
    console.error("❌ Exception in updateOrder:", error)
    return false
  }
}

/**
 * Obtiene todos los pedidos de un usuario
 */
export async function getUserOrders(userId?: string): Promise<Order[]> {
  try {
    if (!userId) {
      return []
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching user orders:", error)
      return []
    }

    // Obtener items para cada pedido
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true })

        return {
          ...order,
          items: items || [],
        }
      })
    )

    return ordersWithItems
  } catch (error) {
    console.error("❌ Exception in getUserOrders:", error)
    return []
  }
}
