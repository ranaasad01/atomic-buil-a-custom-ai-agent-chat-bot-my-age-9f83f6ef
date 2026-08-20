// Supabase server client scaffold — replace with real @supabase/ssr when ready
// import { createServerClient as _createServerClient } from '@supabase/ssr'

type SupabaseStub = {
  from: (table: string) => any
  auth: Record<string, any>
  storage: Record<string, any>
  rpc: (fn: string, args?: Record<string, unknown>) => any
}

function createStubClient(): SupabaseStub {
  const queryBuilder: any = {
    select: () => queryBuilder,
    insert: () => queryBuilder,
    update: () => queryBuilder,
    delete: () => queryBuilder,
    upsert: () => queryBuilder,
    eq: () => queryBuilder,
    neq: () => queryBuilder,
    gt: () => queryBuilder,
    lt: () => queryBuilder,
    gte: () => queryBuilder,
    lte: () => queryBuilder,
    like: () => queryBuilder,
    ilike: () => queryBuilder,
    in: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    range: () => queryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (v: { data: null; error: null }) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  }
  return {
    from: (_table: string) => queryBuilder,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: (_bucket: string) => ({
        download: () => Promise.resolve({ data: null, error: null }),
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: (_fn: string, _args?: Record<string, unknown>) =>
      Promise.resolve({ data: null, error: null }),
  }
}

export function createServerClient(): SupabaseStub {
  return createStubClient()
}

export async function createClient(): Promise<SupabaseStub> {
  return createStubClient()
}
