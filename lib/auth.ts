import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email?: string
  name?: string
  avatar?: string
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      avatar: user.user_metadata?.avatar_url,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Función para verificar límite de generación
export async function checkGenerationLimit(userId?: string): Promise<{
  canGenerate: boolean
  remaining: number
  limit: number
}> {
  const limit = 10 // Límite diario para usuarios anónimos

  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      const today = new Date().toDateString()
      const stored = localStorage.getItem("generation_count")
      const data = stored ? JSON.parse(stored) : { date: today, count: 0 }

      if (data.date !== today) {
        // Nuevo día, resetear contador
        data.date = today
        data.count = 0
        localStorage.setItem("generation_count", JSON.stringify(data))
      }

      const remaining = Math.max(0, limit - data.count)
      return {
        canGenerate: data.count < limit,
        remaining,
        limit,
      }
    }

    // Para usuarios autenticados, verificar en la base de datos
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from("images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if (error) {
      console.error("Error checking generation limit:", error)
      return { canGenerate: true, remaining: limit, limit }
    }

    const userLimit = 50 // Límite más alto para usuarios autenticados
    const remaining = Math.max(0, userLimit - (count || 0))

    return {
      canGenerate: (count || 0) < userLimit,
      remaining,
      limit: userLimit,
    }
  } catch (error) {
    console.error("Error in checkGenerationLimit:", error)
    return { canGenerate: true, remaining: limit, limit }
  }
}

// Función para incrementar el contador de generaciones
export async function incrementGenerationCount(userId?: string): Promise<void> {
  try {
    if (!userId) {
      // Para usuarios anónimos, usar localStorage
      const today = new Date().toDateString()
      const stored = localStorage.getItem("generation_count")
      const data = stored ? JSON.parse(stored) : { date: today, count: 0 }

      if (data.date !== today) {
        data.date = today
        data.count = 1
      } else {
        data.count += 1
      }

      localStorage.setItem("generation_count", JSON.stringify(data))
    }
    // Para usuarios autenticados, el contador se incrementa automáticamente al guardar la imagen
  } catch (error) {
    console.error("Error incrementing generation count:", error)
  }
}

// Función para iniciar sesión
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: "No user returned" }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error signing in:", error)
    return { user: null, error: "Error signing in" }
  }
}

// Función para registrarse
export async function signUp(
  email: string,
  password: string,
  name?: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email,
        },
      },
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: "No user returned" }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error signing up:", error)
    return { user: null, error: "Error signing up" }
  }
}

// Función para cerrar sesión
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error signing out:", error)
    return { error: "Error signing out" }
  }
}

// Función para configurar política de retención de imágenes
export async function setupImageRetentionPolicy(): Promise<void> {
  try {
    // Esta función se ejecutaría en el servidor para configurar políticas de limpieza automática
    console.log("Image retention policy setup - this would run on server")
  } catch (error) {
    console.error("Error setting up image retention policy:", error)
  }
}
