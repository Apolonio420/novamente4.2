import { supabase } from "./supabase"

export function getClientSupabase() {
  return supabase
}

export function useSupabaseAuth() {
  return {
    supabase,
    signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({ email, password })
    },
    signUp: async (email: string, password: string) => {
      return await supabase.auth.signUp({ email, password })
    },
    signOut: async () => {
      return await supabase.auth.signOut()
    },
    getUser: async () => {
      return await supabase.auth.getUser()
    },
  }
}
