import { createClient } from "@supabase/supabase-js"

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it in Project Settings.")
  }

  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please add it in Project Settings.")
  }

  return { supabaseUrl, supabaseServiceKey }
}

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

function createSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseAdminConfig()
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminInstance
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = createSupabaseAdminClient()
    return client[prop as keyof typeof client]
  },
})
