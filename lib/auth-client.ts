import { supabase } from "./supabase"

export function getClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found")
    return null
  }

  return supabase
}

export function useSupabaseAuth() {
  const supabaseClient = getClientSupabase()

  return {
    supabase: supabaseClient,
    signIn: async (email: string, password: string) => {
      if (!supabaseClient) return { error: "Supabase not configured" }
      return await supabaseClient.auth.signInWithPassword({ email, password })
    },
    signUp: async (email: string, password: string) => {
      if (!supabaseClient) return { error: "Supabase not configured" }
      return await supabaseClient.auth.signUp({ email, password })
    },
    signOut: async () => {
      if (!supabaseClient) return { error: "Supabase not configured" }
      return await supabaseClient.auth.signOut()
    },
    getUser: async () => {
      if (!supabaseClient) return { data: { user: null }, error: "Supabase not configured" }
      return await supabaseClient.auth.getUser()
    },
  }
}
