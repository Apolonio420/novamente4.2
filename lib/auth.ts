import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

// Función para verificar límite de generación
export async function checkGenerationLimit(userId?: string): Promise<{ canGenerate: boolean; remaining: number }> {
  try {
    if (!userId) {
      // Para usuarios anónimos, permitir 3 generaciones por día
      const today = new Date().toDateString()
      const storageKey = `generation_limit_${today}`
      const used = Number.parseInt(localStorage.getItem(storageKey) || "0")
      const limit = 3

      return {
        canGenerate: used < limit,
        remaining: Math.max(0, limit - used),
      }
    }

    // Para usuarios autenticados, verificar en la base de datos
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("user_generation_limits")
      .select("generations_used")
      .eq("user_id", userId)
      .eq("date", today)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking generation limit:", error)
      return { canGenerate: true, remaining: 10 }
    }

    const used = data?.generations_used || 0
    const limit = 10 // Límite para usuarios autenticados

    return {
      canGenerate: used < limit,
      remaining: Math.max(0, limit - used),
    }
  } catch (error) {
    console.error("Error in checkGenerationLimit:", error)
    return { canGenerate: true, remaining: 10 }
  }
}

// Función para configurar política de retención de imágenes
export async function setupImageRetentionPolicy(): Promise<void> {
  try {
    console.log("Setting up image retention policy...")

    // Esta función se ejecutaría en el servidor para configurar
    // políticas de limpieza automática de imágenes antiguas

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase.from("images").delete().lt("created_at", thirtyDaysAgo.toISOString())

    if (error) {
      console.error("Error setting up retention policy:", error)
    } else {
      console.log("✅ Image retention policy applied successfully")
    }
  } catch (error) {
    console.error("Error in setupImageRetentionPolicy:", error)
  }
}

// Función para incrementar contador de generaciones
export async function incrementGenerationCount(userId?: string): Promise<void> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      const today = new Date().toDateString()
      const storageKey = `generation_limit_${today}`
      const used = Number.parseInt(localStorage.getItem(storageKey) || "0")
      localStorage.setItem(storageKey, (used + 1).toString())
      return
    }

    // Para usuarios autenticados, actualizar en la base de datos
    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase.from("user_generation_limits").upsert(
      {
        user_id: userId,
        date: today,
        generations_used: 1,
      },
      {
        onConflict: "user_id,date",
        ignoreDuplicates: false,
      },
    )

    if (error) {
      console.error("Error incrementing generation count:", error)
    }
  } catch (error) {
    console.error("Error in incrementGenerationCount:", error)
  }
}

// Función para login con Google
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in signInWithGoogle:", error)
    throw error
  }
}

// Función para logout
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }

    // Limpiar localStorage
    localStorage.removeItem("saved_images")
    localStorage.removeItem("cart_items")

    // Recargar la página para limpiar el estado
    window.location.reload()
  } catch (error) {
    console.error("Error in signOut:", error)
    throw error
  }
}

// Función para obtener la sesión actual
export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}
