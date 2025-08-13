import { supabase } from "./supabase"
import { getCurrentUser } from "./auth"
import { v4 as uuidv4 } from "uuid"

export interface SavedImage {
  id: string
  url: string
  prompt: string
  created_at: string
  user_id: string | null
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

    const imageId = uuidv4()

    const { data, error } = await supabase
      .from("images")
      .insert({
        id: imageId,
        url: url,
        prompt: prompt,
        user_id: userId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving image to Supabase:", error)

      if (typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          const newImage: SavedImage = {
            id: imageId,
            url: url,
            prompt: prompt,
            created_at: new Date().toISOString(),
            user_id: userId || null,
          }
          localImages.unshift(newImage)
          // Keep only last 50 images in localStorage
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
    return data
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

    return data || []
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

    return data
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
      console.log("👤 No userId provided, checking localStorage...")
      if (typeof window !== "undefined") {
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          console.log("📱 Found", localImages.length, "images in localStorage")
          return localImages.slice(0, 20)
        } catch (localError) {
          console.error("❌ Error reading localStorage:", localError)
        }
      }

      console.log("🔄 Trying to get recent anonymous images from database...")
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .is("user_id", null)
        .order("created_at", { ascending: false })
        .limit(20)

      if (!error && data) {
        console.log("✅ Found", data.length, "anonymous images in database")
        return data
      }

      return []
    }

    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("❌ Error fetching user images:", error)
      return []
    }

    console.log("✅ Found", data?.length || 0, "user images in database")
    return data || []
  } catch (error) {
    console.error("❌ Error in getUserImages:", error)

    if (typeof window !== "undefined") {
      try {
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        console.log("🔄 Fallback: Found", localImages.length, "images in localStorage")
        return localImages.slice(0, 20)
      } catch (localError) {
        console.error("❌ Error in fallback localStorage read:", localError)
      }
    }

    return []
  }
}
