import { createClient } from "@supabase/supabase-js"

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not available yet")
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

let supabaseInstance: ReturnType<typeof createClient> | null = null

function createSupabaseClient() {
  if (!supabaseInstance) {
    const config = getSupabaseConfig()
    if (!config) {
      return null
    }

    const { supabaseUrl, supabaseAnonKey } = config
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return supabaseInstance
}

export function getSupabase() {
  return createSupabaseClient()
}

const createMockQueryBuilder = () => {
  const mockResult = Promise.resolve({ data: [], error: new Error("Supabase not available") })
  const mockSingleResult = Promise.resolve({ data: null, error: new Error("Supabase not available") })

  const queryBuilder: any = {
    select: () => queryBuilder,
    eq: () => queryBuilder,
    is: () => queryBuilder,
    not: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    lt: () => queryBuilder,
    in: () => queryBuilder,
    single: () => mockSingleResult,
    then: (resolve: any) => mockResult.then(resolve),
    catch: (reject: any) => mockResult.catch(reject),
  }

  // Make it thenable so it can be awaited
  Object.defineProperty(queryBuilder, "then", {
    value: (resolve: any) => mockResult.then(resolve),
    writable: false,
  })

  return queryBuilder
}

const createMockSupabaseClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not available") }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: new Error("Supabase not available") }),
    signOut: () => Promise.resolve({ error: new Error("Supabase not available") }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: () => createMockQueryBuilder(),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: new Error("Supabase not available") }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: new Error("Supabase not available") }),
    }),
    delete: () => createMockQueryBuilder(),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: new Error("Supabase not available") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
})

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = createSupabaseClient()
    if (!client) {
      const mockClient = createMockSupabaseClient()
      return mockClient[prop as keyof typeof mockClient]
    }
    return client[prop as keyof typeof client]
  },
})

export default supabase
