import { createClient } from "@supabase/supabase-js"

// Singleton para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }
  return supabaseInstance
}

// Tipos
interface Image {
  id: string
  url: string
  prompt: string
  optimizedPrompt?: string
  createdAt: string
  userId?: string
}

interface CartItem {
  id: string
  name: string
  garmentType: string
  color: string
  size: string
  price: number
  quantity: number
  imageUrl: string
  frontDesign?: string
  backDesign?: string
}

interface SaveImageData {
  url: string
  prompt: string
  optimizedPrompt?: string
  userId?: string | null
}

interface SaveImageParams {
  prompt: string
  imageUrl: string
  userId?: string
  sessionId?: string
  resolution?: string
  style?: string | null
}

interface ImageRecord {
  id: string
  url: string
  prompt: string
  optimized_prompt?: string
  user_id: string
  created_at: string
}

interface SavedImage {
  id: string
  prompt: string
  image_url: string
  user_id: string | null
  session_id: string | null
  resolution: string | null
  style: string | null
  created_at: string
}

// Función para generar ID único
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Función para obtener el ID de sesión anónima
function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "server_session"

  let sessionId = localStorage.getItem("anonymous_session_id")
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("anonymous_session_id", sessionId)
  }
  return sessionId
}

// Función para verificar si una URL de imagen ha expirado
function isImageUrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const seParam = urlObj.searchParams.get("se") // Azure Blob Storage expiry parameter

    if (!seParam) return false // Si no hay parámetro de expiración, asumimos que no expira

    const expiryDate = new Date(seParam)
    const now = new Date()

    // Considerar expirada si faltan menos de 10 minutos
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)

    return expiryDate <= tenMinutesFromNow
  } catch (error) {
    console.error("Error checking URL expiry:", error)
    return true // Si hay error, considerar expirada por seguridad
  }
}

// Almacenamiento local de respaldo (para desarrollo o si Supabase no está configurado)
const localImages: Image[] = []
let localCartItems: CartItem[] = []

// Función para guardar una imagen generada
export async function saveGeneratedImage(params: SaveImageParams): Promise<SavedImage> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("generated_images")
    .insert({
      prompt: params.prompt,
      image_url: params.imageUrl,
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      resolution: params.resolution || "1024x1024",
      style: params.style || null,
    })
    .select()
    .single()

  if (error) {
    console.error("❌ Error saving image to database:", error)
    throw new Error(`Failed to save image: ${error.message}`)
  }

  console.log("✅ Image saved to database:", data.id)
  return data
}

// Alias for backward compatibility
export const saveImage = saveGeneratedImage

export async function getImageById(id: string): Promise<SavedImage | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase.from("generated_images").select("*").eq("id", id).single()

  if (error) {
    console.error("❌ Error fetching image:", error)
    return null
  }

  return data
}

// Función para obtener imágenes recientes del usuario actual
export async function getRecentImages(userId?: string | null, limit = 12) {
  const supabase = getSupabaseClient()

  console.log("Getting recent images, limit:", limit)

  const actualUserId = userId || getAnonymousSessionId()
  console.log("Current userId:", actualUserId)

  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", actualUserId) // Solo usar user_id
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching from Supabase:", error)
      // Fallback a localStorage si Supabase falla
      return getFromLocalStorage(limit)
    }

    // Filtrar URLs expiradas de Azure Blob Storage
    const validImages =
      data?.filter((image) => {
        if (!image.url.includes("oaidalleapiprodscus.blob.core.windows.net")) {
          return true // No es de Azure, mantener
        }

        try {
          const url = new URL(image.url)
          const seParam = url.searchParams.get("se") // Parámetro de expiración
          if (!seParam) return true

          const expirationDate = new Date(seParam)
          const now = new Date()

          return expirationDate > now
        } catch {
          return false // URL malformada
        }
      }) || []

    console.log(`Fetched ${validImages.length} valid images from Supabase`)
    return validImages
  } catch (error) {
    console.error("Error in getRecentImages:", error)
    // Fallback completo a localStorage
    return getFromLocalStorage(limit)
  }
}

export async function getUserImages(userId: string, limit = 20): Promise<SavedImage[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("generated_images")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("❌ Error fetching user images:", error)
    return []
  }

  return data || []
}

export async function getSessionImages(sessionId: string, limit = 20): Promise<SavedImage[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("generated_images")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("❌ Error fetching session images:", error)
    return []
  }

  return data || []
}

// Función para eliminar una imagen
export async function deleteImage(imageId: string, userId?: string | null) {
  const supabase = getSupabaseClient()

  const actualUserId = userId || getAnonymousSessionId()

  try {
    const { error } = await supabase.from("images").delete().eq("id", imageId).eq("user_id", actualUserId)

    if (error) {
      console.error("Error deleting image:", error)
      // Fallback a localStorage
      deleteFromLocalStorage(imageId)
      return true
    }

    return true
  } catch (error) {
    console.error("Error in deleteImage:", error)
    deleteFromLocalStorage(imageId)
    return true
  }
}

// Función para limpiar imágenes expiradas automáticamente
export async function cleanupExpiredImages() {
  try {
    const supabase = getSupabaseClient()
    const currentUserId = getAnonymousSessionId()
    const { data, error } = await supabase.from("images").select("id, url, created_at").eq("user_id", currentUserId)

    if (error) {
      console.error("Error fetching images for cleanup:", error)
      return
    }

    const expiredIds: string[] = []
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

    data.forEach((image: any) => {
      const createdAt = new Date(image.created_at)

      // Eliminar si la imagen tiene más de 3 días O si la URL ha expirado
      if (createdAt < threeDaysAgo || isImageUrlExpired(image.url)) {
        expiredIds.push(image.id)
      }
    })

    if (expiredIds.length > 0) {
      console.log(`Cleaning up ${expiredIds.length} expired images for user ${currentUserId}`)

      const { error: deleteError } = await supabase.from("images").delete().in("id", expiredIds)

      if (deleteError) {
        console.error("Error cleaning up expired images:", deleteError)
      } else {
        console.log(`Successfully cleaned up ${expiredIds.length} expired images`)
      }
    }
  } catch (error) {
    console.error("Error in cleanup process:", error)
  }
}

// Funciones para el carrito
export async function getCartItems() {
  const supabase = getSupabaseClient()
  // Intentar obtener de Supabase
  try {
    const { data, error } = await supabase.from("cart_items").select("*").order("created_at", { ascending: false })

    if (error) throw error

    // Convertir de snake_case a camelCase
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      garmentType: item.garment_type,
      color: item.color,
      size: item.size,
      price: Number.parseFloat(item.price),
      quantity: item.quantity,
      imageUrl: item.image_url,
      frontDesign: item.front_design,
      backDesign: item.back_design,
    }))
  } catch (error) {
    console.error("Error fetching cart from Supabase:", error)
    return getCartFromLocalStorage()
  }
}

export async function addToCart(item: Omit<CartItem, "id">) {
  const supabase = getSupabaseClient()
  const newItem = {
    ...item,
    id: `cart_${Date.now()}`,
  }

  // Intentar guardar en Supabase
  try {
    const { error } = await supabase.from("cart_items").insert([
      {
        id: newItem.id,
        name: newItem.name,
        garment_type: newItem.garmentType,
        color: newItem.color,
        size: newItem.size,
        price: newItem.price,
        quantity: newItem.quantity,
        image_url: newItem.imageUrl,
        front_design: newItem.frontDesign,
        back_design: newItem.backDesign,
      },
    ])

    if (error) throw error
    console.log("Item added to cart in Supabase:", newItem.id)
  } catch (error) {
    console.error("Error adding to cart in Supabase:", error)
    addToLocalCart(newItem)
  }

  return newItem
}

export async function removeFromCart(id: string) {
  const supabase = getSupabaseClient()
  // Intentar eliminar de Supabase
  try {
    const { error } = await supabase.from("cart_items").delete().eq("id", id)
    if (error) throw error
    console.log("Item removed from cart in Supabase:", id)
  } catch (error) {
    console.error("Error removing from cart in Supabase:", error)
    removeFromLocalCart(id)
  }
  return { success: true }
}

export async function updateCartItem(id: string, quantity: number) {
  const supabase = getSupabaseClient()
  // Intentar actualizar en Supabase
  try {
    const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id)

    if (error) throw error
    console.log("Cart item updated in Supabase:", id)
  } catch (error) {
    console.error("Error updating cart in Supabase:", error)
    updateLocalCartItem(id, quantity)
  }
  return { success: true }
}

export async function clearCart() {
  const supabase = getSupabaseClient()
  // Intentar limpiar en Supabase
  try {
    // En un entorno real con autenticación, eliminaríamos solo los items del usuario actual
    const { error } = await supabase.from("cart_items").delete().neq("id", "placeholder")
    if (error) throw error
    console.log("Cart cleared in Supabase")
  } catch (error) {
    console.error("Error clearing cart in Supabase:", error)
    clearLocalCart()
  }
  return { success: true }
}

// Funciones auxiliares para el almacenamiento local
function saveToLocalStorage(newImage: Image) {
  console.log("Saving to localStorage")

  // Cargar imágenes existentes
  let localImages: Image[] = []
  if (typeof localStorage !== "undefined") {
    try {
      const storedImages = localStorage.getItem("novamente_images")
      if (storedImages) {
        localImages = JSON.parse(storedImages)
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e)
    }
  }

  // Añadir la nueva imagen al principio
  localImages.unshift(newImage)

  // Limitar a 20 imágenes para evitar problemas de memoria
  if (localImages.length > 20) {
    localImages = localImages.slice(0, 20)
  }

  // Guardar en localStorage si está disponible (solo en el cliente)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_images", JSON.stringify(localImages))
      console.log("Saved to localStorage, count:", localImages.length)
    } catch (e) {
      console.error("Error saving to localStorage:", e)
    }
  }
}

function getFromLocalStorage(limit: number) {
  console.log("Getting from localStorage")

  // Si estamos en el cliente y hay datos en localStorage, cargarlos
  let localImages: Image[] = []
  if (typeof localStorage !== "undefined") {
    try {
      const storedImages = localStorage.getItem("novamente_images")
      if (storedImages) {
        localImages = JSON.parse(storedImages)
        console.log("Loaded from localStorage, count:", localImages.length)
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e)
    }
  }

  return localImages.slice(0, limit)
}

function deleteFromLocalStorage(id: string) {
  console.log("Deleting from localStorage:", id)

  // Cargar imágenes existentes
  let localImages: Image[] = []
  if (typeof localStorage !== "undefined") {
    try {
      const storedImages = localStorage.getItem("novamente_images")
      if (storedImages) {
        localImages = JSON.parse(storedImages)
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e)
    }
  }

  // Filtrar la imagen a eliminar
  localImages = localImages.filter((image) => image.id !== id)

  // Guardar en localStorage
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_images", JSON.stringify(localImages))
      console.log("Updated localStorage after deletion, count:", localImages.length)
    } catch (e) {
      console.error("Error updating localStorage:", e)
    }
  }
}

function getCartFromLocalStorage() {
  if (typeof localStorage !== "undefined" && localCartItems.length === 0) {
    try {
      const storedCart = localStorage.getItem("novamente_cart")
      if (storedCart) {
        localCartItems = JSON.parse(storedCart)
      }
    } catch (e) {
      console.error("Error loading cart from localStorage:", e)
    }
  }
  return localCartItems
}

function addToLocalCart(newItem: CartItem) {
  localCartItems.push(newItem)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_cart", JSON.stringify(localCartItems))
    } catch (e) {
      console.error("Error saving cart to localStorage:", e)
    }
  }
}

function removeFromLocalCart(id: string) {
  localCartItems = localCartItems.filter((item) => item.id !== id)
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_cart", JSON.stringify(localCartItems))
    } catch (e) {
      console.error("Error updating cart in localStorage:", e)
    }
  }
}

function updateLocalCartItem(id: string, quantity: number) {
  localCartItems = localCartItems.map((item) => (item.id === id ? { ...item, quantity } : item))
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_cart", JSON.stringify(localCartItems))
    } catch (e) {
      console.error("Error updating cart in localStorage:", e)
    }
  }
}

function clearLocalCart() {
  localCartItems = []
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("novamente_cart", JSON.stringify(localCartItems))
    } catch (e) {
      console.error("Error clearing cart in localStorage:", e)
    }
  }
}
