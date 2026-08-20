import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemoryMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface MemorySession {
  id: string
  user_id: string
  title: string | null
  target_url: string | null
  agent_mode: string | null
  test_framework: string | null
  status?: string
  summary: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ─── Short-term memory (in-memory, current session only) ──────────────────────

const shortTermStore = new Map<string, MemoryMessage[]>()

export function getShortTermMessages(sessionId: string): MemoryMessage[] {
  return shortTermStore.get(sessionId) ?? []
}

export function addShortTermMessage(sessionId: string, msg: MemoryMessage): void {
  const existing = shortTermStore.get(sessionId) ?? []
  shortTermStore.set(sessionId, [...existing, msg])
}

export function clearShortTermMemory(sessionId: string): void {
  shortTermStore.delete(sessionId)
}

// ─── Long-term memory (Supabase-persisted) ────────────────────────────────────

export async function persistSession(
  session: Omit<MemorySession, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
): Promise<{ data: MemorySession | null; error: unknown }> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('chat_sessions')
    .upsert({ ...session, updated_at: now, created_at: session.created_at ?? now })
    .select()
    .single()
  return { data: data as MemorySession | null, error }
}

export async function persistMessage(
  msg: Omit<MemoryMessage, 'created_at'> & { created_at?: string }
): Promise<{ data: MemoryMessage | null; error: unknown }> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('chat_messages')
    .upsert({ ...msg, created_at: msg.created_at ?? now })
    .select()
    .single()
  return { data: data as MemoryMessage | null, error }
}

export async function getLongTermSessions(userId: string): Promise<MemorySession[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return (data as MemorySession[]) ?? []
}

export async function getLongTermMessages(sessionId: string): Promise<MemoryMessage[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  return (data as MemoryMessage[]) ?? []
}

export async function deleteSessionFromDB(sessionId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('chat_messages').delete().eq('session_id', sessionId)
  await supabase.from('chat_sessions').delete().eq('id', sessionId)
}
