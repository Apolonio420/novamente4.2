import { supabase } from "./supabase"
import { getCurrentUser } from "./auth"
import { v4 as uuidv4 } from "uuid"

export interface SavedImage {
  id: string
  url: string
  prompt: string
  created_at: string
  user_id: string | null
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

    const existingImage = await checkImageExists(url, prompt, userId)
    if (existingImage) {
      console.log("♻️ Image already exists, returning existing record:", existingImage.id)

      // Aún guardar en localStorage para usuarios anónimos si no está ahí
      if (!userId && typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          const existsInLocal = localImages.some((img: SavedImage) => img.id === existingImage.id)

          if (!existsInLocal) {
            localImages.unshift(existingImage)
            if (localImages.length > 50) {
              localImages.splice(50)
            }
            localStorage.setItem("saved_images", JSON.stringify(localImages))
            console.log("💾 Added existing image to localStorage for sync")
          }
        } catch (localError) {
          console.error("❌ Error syncing to localStorage:", localError)
        }
      }

      return existingImage
    }

    const imageId = uuidv4()
    const newImage: SavedImage = {
      id: imageId,
      url: url,
      prompt: prompt,
      created_at: new Date().toISOString(),
      user_id: userId || null,
      hasBgRemoved: false,
      urlWithoutBg: null,
    }

    if (!userId && typeof window !== "undefined") {
      try {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        localImages.unshift(newImage)
        // Keep only last 50 images in localStorage
        if (localImages.length > 50) {
          localImages.splice(50)
        }
        localStorage.setItem("saved_images", JSON.stringify(localImages))
        console.log("💾 Image also saved to localStorage for anonymous user")
      } catch (localError) {
        console.error("❌ Error saving to localStorage:", localError)
      }
    }

    const { data, error } = await supabase
      .from("images")
      .insert({
        id: imageId,
        url: url,
        prompt: prompt,
        user_id: userId || null,
        has_bg_removed: false,
        url_without_bg: null,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving image to Supabase:", error)

      if (!userId && typeof window !== "undefined") {
        console.log("✅ Image saved to localStorage as fallback for anonymous user")
        return newImage
      }

      // Para usuarios autenticados, intentar guardar en localStorage como fallback
      if (typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          localImages.unshift(newImage)
          if (localImages.length > 50) {
            localImages.splice(50)
          }
          localStorage.setItem("saved_images", JSON.stringify(localImages))
          console.log("✅ Image saved to localStorage as fallback")
          return newImage
        } catch (localError) {
          console.error("❌ Error saving to localStorage:", localError)
        }
      }
      return null
    }

    console.log("✅ Image saved successfully to database:", {
      id: data.id,
      url: data.url.substring(0, 50) + "...",
      prompt: data.prompt,
    })

    return {
      ...data,
      hasBgRemoved: data.has_bg_removed || false,
      urlWithoutBg: data.url_without_bg || null,
    }
  } catch (error) {
    console.error("❌ Exception in saveGeneratedImage:", error)

    if (typeof window !== "undefined") {
      try {
        const imageId = uuidv4()
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        const newImage: SavedImage = {
          id: imageId,
          url: url,
          prompt: prompt,
          created_at: new Date().toISOString(),
          user_id: userId || null,
          hasBgRemoved: false,
          urlWithoutBg: null,
        }
        localImages.unshift(newImage)
        if (localImages.length > 50) {
          localImages.splice(50)
        }
        localStorage.setItem("saved_images", JSON.stringify(localImages))
        console.log("✅ Image saved to localStorage after exception")
        return newImage
      } catch (localError) {
        console.error("❌ Error in exception fallback:", localError)
      }
    }
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
export async function getImageHistory(limit = 20): Promise<SavedImage[]> {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || null

    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    } else {
      // For anonymous users, get recent images (fallback)
      query = query.is("user_id", null)
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
export async function getUserImages(userId?: string): Promise<SavedImage[]> {
  try {
    console.log("🔍 Getting user images for userId:", userId)

    if (!userId) {
      console.log("👤 No userId provided, checking both database and localStorage...")

      let dbImages: SavedImage[] = []
      try {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .is("user_id", null)
          .order("created_at", { ascending: false })
          .limit(50)

        if (!error && data) {
          console.log("✅ Found", data.length, "anonymous images in database")

          // Filtrar URLs expiradas
          const validDbImages = data.filter((item) => !isDalleUrlExpired(item.url))
          console.log(`🧹 Filtered out ${data.length - validDbImages.length} expired images from database`)

          dbImages = validDbImages.map((item) => ({
            ...item,
            hasBgRemoved: item.has_bg_removed || false,
            urlWithoutBg: item.url_without_bg || null,
          }))
        }
      } catch (dbError) {
        console.log("⚠️ Could not fetch from database:", dbError)
      }

      let localImages: SavedImage[] = []
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("saved_images") || "[]")
          console.log("📱 Found", stored.length, "images in localStorage")

          // Filtrar URLs expiradas
          const validImages = stored.filter((image: SavedImage) => !isDalleUrlExpired(image.url))

          if (validImages.length !== stored.length) {
            console.log(`🧹 Cleaned ${stored.length - validImages.length} expired images from localStorage`)
            localStorage.setItem("saved_images", JSON.stringify(validImages))
          }

          localImages = validImages
        } catch (localError) {
          console.error("❌ Error reading localStorage:", localError)
        }
      }

      const seenKeys = new Set<string>()
      const uniqueImages: SavedImage[] = []

      console.log("🔄 Starting deduplication process with Set...")

      // Procesar imágenes de la base de datos primero (tienen prioridad)
      dbImages.forEach((image, index) => {
        const key = createImageKey(image.url, image.prompt)
        console.log(`[v0] DB Image ${index}: key="${key}", id="${image.id}"`)
        console.log(`[v0] Set size before check: ${seenKeys.size}`)
        console.log(`[v0] Set contains key: ${seenKeys.has(key)}`)
        console.log(`[v0] Set keys: [${Array.from(seenKeys).join(", ")}]`)

        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          uniqueImages.push(image)
          console.log(`[v0] ✅ Added DB image (unique key) - Set size now: ${seenKeys.size}`)
        } else {
          console.log(`[v0] ❌ Skipping duplicate DB image: ${key}`)
        }
      })

      // Procesar imágenes de localStorage solo si no existen ya
      localImages.forEach((image, index) => {
        const key = createImageKey(image.url, image.prompt)
        console.log(`[v0] Local Image ${index}: key="${key}", id="${image.id}"`)
        console.log(`[v0] Set size before check: ${seenKeys.size}`)
        console.log(`[v0] Set contains key: ${seenKeys.has(key)}`)

        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          uniqueImages.push(image)
          console.log(`[v0] ✅ Added localStorage image (unique key) - Set size now: ${seenKeys.size}`)
        } else {
          console.log(`[v0] ❌ Skipping duplicate localStorage image: ${key}`)
        }
      })

      // Ordenar por fecha de creación (más recientes primero)
      uniqueImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log("🎯 Deduplication complete:")
      console.log(`[v0] DB images processed: ${dbImages.length}`)
      console.log(`[v0] Local images processed: ${localImages.length}`)
      console.log(`[v0] Total before dedup: ${dbImages.length + localImages.length}`)
      console.log(`[v0] Unique after dedup: ${uniqueImages.length}`)
      console.log(`[v0] Set size: ${seenKeys.size}`)
      console.log(`[v0] Returning: ${uniqueImages.slice(0, 20).length} images`)

      return uniqueImages.slice(0, 20)
    }

    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("❌ Error fetching user images:", error)
      return []
    }

    // Filtrar URLs expiradas para usuarios autenticados también
    const validImages = (data || []).filter((item) => !isDalleUrlExpired(item.url))
    console.log(
      `✅ Found ${validImages.length} valid user images (${(data?.length || 0) - validImages.length} expired filtered out)`,
    )

    return validImages.slice(0, 20).map((item) => ({
      ...item,
      hasBgRemoved: item.has_bg_removed || false,
      urlWithoutBg: item.url_without_bg || null,
    }))
  } catch (error) {
    console.error("❌ Error in getUserImages:", error)

    if (typeof window !== "undefined") {
      try {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        const validImages = localImages.filter((image: SavedImage) => !isDalleUrlExpired(image.url))
        console.log("🔄 Fallback: Found", validImages.length, "valid images in localStorage")
        return validImages.slice(0, 20)
      } catch (localError) {
        console.error("❌ Error in fallback localStorage read:", localError)
      }
    }

    return []
  }
}

// Función para limpiar imágenes expiradas
export async function cleanupExpiredImages(): Promise<void> {
  try {
    console.log("🧹 Starting cleanup of expired images...")

    const { data, error } = await supabase
      .from("images")
      .select("id, url")
      .contains("url", "oaidalleapiprodscus.blob.core.windows.net")

    if (error) {
      console.error("❌ Error fetching images for cleanup:", error)
      return
    }

    if (!data || data.length === 0) {
      console.log("✅ No DALL-E images found for cleanup")
      return
    }

    const expiredIds: string[] = []
    data.forEach((image) => {
      if (isDalleUrlExpired(image.url)) {
        expiredIds.push(image.id)
      }
    })

    if (expiredIds.length === 0) {
      console.log("✅ No expired images found")
      return
    }

    const { error: deleteError } = await supabase.from("images").delete().in("id", expiredIds)

    if (deleteError) {
      console.error("❌ Error deleting expired images:", deleteError)
    } else {
      console.log(`✅ Successfully deleted ${expiredIds.length} expired images from database`)
    }
  } catch (error) {
    console.error("❌ Error in cleanupExpiredImages:", error)
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
