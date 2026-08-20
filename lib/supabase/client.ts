// Supabase client scaffold — replace with real @supabase/supabase-js when ready
// import { createClient as _createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Suppress unused variable warnings for env vars kept for future use
void SUPABASE_URL
void SUPABASE_ANON_KEY

type QueryBuilder = {
  select: (...args: unknown[]) => QueryBuilder
  insert: (...args: unknown[]) => QueryBuilder
  update: (...args: unknown[]) => QueryBuilder
  delete: (...args: unknown[]) => QueryBuilder
  upsert: (...args: unknown[]) => QueryBuilder
  eq: (...args: unknown[]) => QueryBuilder
  neq: (...args: unknown[]) => QueryBuilder
  gt: (...args: unknown[]) => QueryBuilder
  lt: (...args: unknown[]) => QueryBuilder
  gte: (...args: unknown[]) => QueryBuilder
  lte: (...args: unknown[]) => QueryBuilder
  like: (...args: unknown[]) => QueryBuilder
  ilike: (...args: unknown[]) => QueryBuilder
  in: (...args: unknown[]) => QueryBuilder
  order: (...args: unknown[]) => QueryBuilder
  limit: (...args: unknown[]) => QueryBuilder
  range: (...args: unknown[]) => QueryBuilder
  single: () => Promise<{ data: null; error: null }>
  maybeSingle: () => Promise<{ data: null; error: null }>
  then: (resolve: (v: { data: null; error: null }) => void) => Promise<void>
}

type StorageBucket = {
  download: (...args: unknown[]) => Promise<{ data: null; error: null }>
  upload: (...args: unknown[]) => Promise<{ data: null; error: null }>
  getPublicUrl: (...args: unknown[]) => { data: { publicUrl: string } }
}

type SupabaseStub = {
  from: (table: string) => QueryBuilder
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>
    getSession: () => Promise<{ data: { session: null }; error: null }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } }
  }
  storage: {
    from: (bucket: string) => StorageBucket
  }
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: null; error: null }>
}

function createStubClient(): SupabaseStub {
  const queryBuilder: QueryBuilder = {
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
    then: (resolve) => Promise.resolve({ data: null, error: null }).then(resolve),
  }

  return {
    from: (_table: string) => queryBuilder,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: (_bucket: string): StorageBucket => ({
        download: () => Promise.resolve({ data: null, error: null }),
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: (_fn: string, _args?: Record<string, unknown>) =>
      Promise.resolve({ data: null, error: null }),
  }
}

export function createClient(): SupabaseStub {
  return createStubClient()
}

const supabase = createStubClient()
export default supabase
