/**
 * chat-store.ts
 * Lightweight localStorage-backed store for chat threads and messages.
 * All reads/writes are synchronous and safe to call from useEffect.
 */

export interface Thread {
  id: string;
  title: string;
  targetUrl: string;
  agentMode: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

// ─── Types used by ai-agent.ts ────────────────────────────────────────────────

export interface ArtifactPreview {
  type: "script" | "excel" | "bug-report" | "log";
  label: string;
  size: string;
  icon: "code" | "sheet" | "bug" | "log";
}

export interface StepItem {
  id: string;
  title: string;
  status: "complete" | "running" | "pending" | "error";
}

const THREADS_KEY = "qa_agent_threads";
const MESSAGES_PREFIX = "qa_agent_messages_";

// ─── Thread helpers ───────────────────────────────────────────────────────────

export function getThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThread(thread: Thread): void {
  if (typeof window === "undefined") return;
  try {
    const threads = getThreads();
    const idx = threads.findIndex((t) => t.id === thread.id);
    if (idx >= 0) {
      threads[idx] = thread;
    } else {
      threads.unshift(thread);
    }
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch (err) {
    console.error("chat-store: failed to save thread", err);
  }
}

export function deleteThread(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const threads = getThreads().filter((t) => t.id !== id);
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    localStorage.removeItem(MESSAGES_PREFIX + id);
  } catch (err) {
    console.error("chat-store: failed to delete thread", err);
  }
}

export function getThread(id: string): Thread | null {
  return getThreads().find((t) => t.id === id) ?? null;
}

// ─── Message helpers ──────────────────────────────────────────────────────────

export function getMessages(threadId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_PREFIX + threadId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessage(message: ChatMessage): void {
  if (typeof window === "undefined") return;
  try {
    const messages = getMessages(message.threadId);
    const idx = messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      messages[idx] = message;
    } else {
      messages.push(message);
    }
    localStorage.setItem(
      MESSAGES_PREFIX + message.threadId,
      JSON.stringify(messages)
    );

    // Update thread's updatedAt timestamp
    const thread = getThread(message.threadId);
    if (thread) {
      saveThread({ ...thread, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error("chat-store: failed to save message", err);
  }
}

export function deleteMessage(threadId: string, messageId: string): void {
  if (typeof window === "undefined") return;
  try {
    const messages = getMessages(threadId).filter((m) => m.id !== messageId);
    localStorage.setItem(
      MESSAGES_PREFIX + threadId,
      JSON.stringify(messages)
    );
  } catch (err) {
    console.error("chat-store: failed to delete message", err);
  }
}

export function clearMessages(threadId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MESSAGES_PREFIX + threadId);
  } catch (err) {
    console.error("chat-store: failed to clear messages", err);
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
