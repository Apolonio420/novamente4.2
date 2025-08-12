import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getClientSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found")
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export function useSupabaseAuth() {
  const supabase = getClientSupabase()

  return {
    supabase,
    signIn: async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase not configured" }
      return await supabase.auth.signInWithPassword({ email, password })
    },
    signUp: async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase not configured" }
      return await supabase.auth.signUp({ email, password })
    },
    signOut: async () => {
      if (!supabase) return { error: "Supabase not configured" }
      return await supabase.auth.signOut()
    },
    getUser: async () => {
      if (!supabase) return { data: { user: null }, error: "Supabase not configured" }
      return await supabase.auth.getUser()
    },
  }
}
