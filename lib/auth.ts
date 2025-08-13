import { createSupabaseClient } from "@/lib/supabase-client"

export interface User {
  id: string
  email?: string
  name?: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseClient()
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
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function checkGenerationLimit(userId: string): Promise<{ canGenerate: boolean; remaining: number }> {
  try {
    const supabase = createSupabaseClient()

    // Check how many images the user has generated today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("generated_images")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if (error) {
      console.error("Error checking generation limit:", error)
      return { canGenerate: true, remaining: 10 } // Default to allowing generation
    }

    const generatedToday = data?.length || 0
    const dailyLimit = 10 // Free users get 10 generations per day
    const remaining = Math.max(0, dailyLimit - generatedToday)

    return {
      canGenerate: remaining > 0,
      remaining,
    }
  } catch (error) {
    console.error("Error in checkGenerationLimit:", error)
    return { canGenerate: true, remaining: 10 }
  }
}

export async function setupImageRetentionPolicy() {
  try {
    const supabase = createSupabaseClient()

    // This would typically be done via database migrations
    // For now, we'll just log that the policy should be set up
    console.log("Image retention policy should be configured in the database")

    // Example policy (would be in SQL migration):
    // DELETE FROM generated_images WHERE created_at < NOW() - INTERVAL '7 days' AND user_id IS NULL;
    // DELETE FROM generated_images WHERE created_at < NOW() - INTERVAL '30 days' AND user_id IS NOT NULL;

    return true
  } catch (error) {
    console.error("Error setting up retention policy:", error)
    return false
  }
}
