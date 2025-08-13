import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface SavedImage {
  id: string
  url: string
  prompt: string
  optimized_prompt?: string
  user_id?: string
  created_at: string
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

// Export que necesitas - saveGeneratedImage
export async function saveGeneratedImage(imageData: {
  url: string
  prompt: string
  optimizedPrompt?: string
  userId?: string
}): Promise<SavedImage | null> {
  try {
    console.log("Saving image:", imageData)

    const { data, error } = await supabase
      .from("images")
      .insert({
        url: imageData.url,
        prompt: imageData.prompt,
        optimized_prompt: imageData.optimizedPrompt,
        user_id: imageData.userId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving to Supabase:", error)

      // Fallback a localStorage
      const fallbackImage: SavedImage = {
        id: `local_${Date.now()}`,
        url: imageData.url,
        prompt: imageData.prompt,
        optimized_prompt: imageData.optimizedPrompt,
        user_id: imageData.userId,
        created_at: new Date().toISOString(),
      }

      const existingImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      existingImages.unshift(fallbackImage)
      localStorage.setItem("saved_images", JSON.stringify(existingImages.slice(0, 50)))

      return fallbackImage
    }

    console.log("✅ Image saved to Supabase:", data)
    return data
  } catch (error) {
    console.error("❌ Error saving to database:", error)

    // Fallback a localStorage
    const fallbackImage: SavedImage = {
      id: `local_${Date.now()}`,
      url: imageData.url,
      prompt: imageData.prompt,
      optimized_prompt: imageData.optimizedPrompt,
      user_id: imageData.userId,
      created_at: new Date().toISOString(),
    }

    const existingImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
    existingImages.unshift(fallbackImage)
    localStorage.setItem("saved_images", JSON.stringify(existingImages.slice(0, 50)))

    return fallbackImage
  }
}

// Alias para compatibilidad
export const saveImage = saveGeneratedImage

// Función para obtener imágenes recientes
export async function getRecentImages(userId?: string, limit = 20): Promise<SavedImage[]> {
  try {
    let query = supabase.from("images").select("*").order("created_at", { ascending: false }).limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    } else {
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching from Supabase:", error)

      // Fallback a localStorage
      const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      return localImages.slice(0, limit)
    }

    return data || []
  } catch (error) {
    console.error("Error in getRecentImages:", error)

    // Fallback a localStorage
    const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
    return localImages.slice(0, limit)
  }
}

// Función para obtener una imagen por ID
export async function getImageById(id: string): Promise<SavedImage | null> {
  try {
    const { data, error } = await supabase.from("images").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching image by ID:", error)

      // Fallback a localStorage
      const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      return localImages.find((img: SavedImage) => img.id === id) || null
    }

    return data
  } catch (error) {
    console.error("Error in getImageById:", error)

    // Fallback a localStorage
    const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
    return localImages.find((img: SavedImage) => img.id === id) || null
  }
}

// Función para eliminar una imagen
export async function deleteImage(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("images").delete().eq("id", id)

    if (error) {
      console.error("Error deleting from Supabase:", error)

      // Fallback a localStorage
      const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
      const filteredImages = localImages.filter((img: SavedImage) => img.id !== id)
      localStorage.setItem("saved_images", JSON.stringify(filteredImages))

      return true
    }

    return true
  } catch (error) {
    console.error("Error in deleteImage:", error)

    // Fallback a localStorage
    const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
    const filteredImages = localImages.filter((img: SavedImage) => img.id !== id)
    localStorage.setItem("saved_images", JSON.stringify(filteredImages))

    return true
  }
}

// Funciones del carrito
export async function getCartItems(userId?: string): Promise<CartItem[]> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      const cartItems = localStorage.getItem("cart_items")
      return cartItems ? JSON.parse(cartItems) : []
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
      const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
      const newItem: CartItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      }
      existingItems.push(newItem)
      localStorage.setItem("cart_items", JSON.stringify(existingItems))
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
      const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
      const filteredItems = existingItems.filter((item: CartItem) => item.id !== itemId)
      localStorage.setItem("cart_items", JSON.stringify(filteredItems))
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
      const existingItems = JSON.parse(localStorage.getItem("cart_items") || "[]")
      const itemIndex = existingItems.findIndex((item: CartItem) => item.id === itemId)

      if (itemIndex !== -1) {
        existingItems[itemIndex] = { ...existingItems[itemIndex], ...updates }
        localStorage.setItem("cart_items", JSON.stringify(existingItems))
        return true
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

// Función para obtener imágenes del usuario
export async function getUserImages(userId?: string): Promise<SavedImage[]> {
  return getRecentImages(userId, 20)
}

// Función para contar generaciones por sesión
export async function countGenerationsBySession(sessionId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from("images")
      .select("*", { count: "exact", head: true })
      .is("user_id", null)
      .gte("created_at", today.toISOString())

    if (error) {
      console.error("Error counting generations:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in countGenerationsBySession:", error)
    return 0
  }
}

// Función para limpiar imágenes expiradas
export async function cleanupExpiredImages(): Promise<void> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 15)

    const { data, error } = await supabase
      .from("images")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select("id")

    if (error) {
      console.error("Error cleaning up expired images:", error)
      return
    }

    console.log(`🧹 Cleaned up ${data?.length || 0} expired images`)
  } catch (error) {
    console.error("Error in cleanupExpiredImages:", error)
  }
}
