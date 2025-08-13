import { supabase } from "./supabase"

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

    if (error) {
      console.log("No authenticated user:", error.message)
      return null
    }

    return user
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
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Función para registrarse
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Función para cerrar sesión
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
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
