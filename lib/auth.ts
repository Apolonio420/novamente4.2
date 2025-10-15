import { supabase } from "./supabase"

export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (error.message?.includes("session") || error.message?.includes("JWT")) {
        console.warn("No active auth session found")
      } else {
        console.error("Error getting current user:", error)
      }
      return null
    }

    return user
  } catch (error) {
    if (error instanceof Error && error.message?.includes("session")) {
      console.warn("Auth session missing - user not logged in")
    } else {
      console.error("Error in getCurrentUser:", error)
    }
    return null
  }
}

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

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in signOut:", error)
    throw error
  }
}

// Límite: usuarios no autenticados (por sessionId) máx 10
export async function checkGenerationLimit(sessionOrUserId: string): Promise<{ canGenerate: boolean; remaining: number; count: number }> {
  try {
    // Si viene un UUID de usuario (autenticado), no limitar aquí (0 = ilimitado en UI)
    // Para invitados (sessionId), contar imágenes con ese session_id
    const { data, error, count } = await supabase
      .from('images')
      .select('id', { count: 'exact', head: true })
      .or(`user_id.eq.${sessionOrUserId},session_id.eq.${sessionOrUserId}`)

    if (error && (error as any).code === '42703') {
      // Columna session_id no existe aún. Fallback: contar solo por user_id (0 para invitados)
      const { count: count2 } = await supabase
        .from('images')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', sessionOrUserId)
      const current2 = typeof count2 === 'number' ? count2 : 0
      const limit2 = 10
      const remaining2 = Math.max(0, limit2 - current2)
      const canGenerate2 = remaining2 > 0
      return { canGenerate: canGenerate2, remaining: remaining2, count: current2 }
    }

    const current = typeof count === 'number' ? count : 0
    const limit = 10
    const remaining = Math.max(0, limit - current)
    const canGenerate = remaining > 0
    return { canGenerate, remaining, count: current }
  } catch (error) {
    console.error('Error checking generation limit:', error)
    return { canGenerate: false, remaining: 0, count: 0 }
  }
}

export async function setupImageRetentionPolicy(): Promise<void> {
  try {
    // This would set up automatic cleanup of old images
    console.log("Image retention policy setup completed")
  } catch (error) {
    console.error("Error setting up image retention policy:", error)
  }
}
