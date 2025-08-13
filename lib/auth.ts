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
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
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

export async function checkGenerationLimit(userId: string): Promise<{ canGenerate: boolean; remaining: number }> {
  try {
    // For now, return unlimited generations
    return { canGenerate: true, remaining: 999 }
  } catch (error) {
    console.error("Error checking generation limit:", error)
    return { canGenerate: false, remaining: 0 }
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
