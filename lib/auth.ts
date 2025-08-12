"use server"

import { createClient } from "@supabase/supabase-js"
import type { cookies } from "next/headers"

// Singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return null
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

export async function getCurrentUser(cookieStore: ReturnType<typeof cookies>) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return null

    const sessionCookie = cookieStore.get("sb-access-token")?.value

    if (!sessionCookie) {
      return null
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionCookie)

    if (error) {
      console.error("Error getting user:", error.message)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export async function checkGenerationLimit(sessionId: string): Promise<{ limitReached: boolean; count: number }> {
  // Validación de entrada
  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    console.log("Invalid sessionId provided to checkGenerationLimit")
    return { limitReached: false, count: 0 }
  }

  const cleanSessionId = sessionId.trim()

  try {
    // Test de conexión a Supabase
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log("Supabase client not available")
      return { limitReached: false, count: 0 }
    }

    // Verificar que la conexión funcione usando la tabla correcta 'images'
    const { error: connectionError } = await supabase.from("images").select("id").limit(1)
    if (connectionError) {
      console.error("Supabase connection test failed:", connectionError.message)
      return { limitReached: false, count: 0 }
    }

    // Contar imágenes para la sesión usando solo user_id (como en versiones anteriores)
    const { count, error } = await supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("user_id", cleanSessionId) // Solo usar user_id

    if (error) {
      console.error(`Error counting images for session: ${cleanSessionId}`, error.message)
      return { limitReached: false, count: 0 }
    }

    // Validar que count sea un número válido
    const validCount = typeof count === "number" && count >= 0 ? count : 0

    console.log(`Session ${cleanSessionId} has generated ${validCount} images`)

    return {
      limitReached: validCount >= 3,
      count: validCount,
    }
  } catch (error) {
    console.error(`Error counting images for session: ${cleanSessionId}`, error)
    // Siempre devolver un objeto válido, nunca lanzar excepción
    return { limitReached: false, count: 0 }
  }
}

export async function setupImageRetentionPolicy() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log("Supabase client not available for retention policy")
      return
    }

    // Eliminar imágenes de más de 15 días usando la tabla correcta 'images'
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    const { error } = await supabase.from("images").delete().lt("created_at", fifteenDaysAgo.toISOString())

    if (error) {
      console.error("Error in image retention policy:", error.message)
    } else {
      console.log("Image retention policy executed successfully")
    }
  } catch (error) {
    console.error("Error setting up image retention policy:", error)
  }
}
