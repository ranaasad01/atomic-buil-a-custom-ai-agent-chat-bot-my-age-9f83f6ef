// ─── Types ────────────────────────────────────────────────────────────────────

export interface Thread {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  targetUrl?: string;
  agentMode?: string;
  framework?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

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

// ─── Storage keys ─────────────────────────────────────────────────────────────

const THREADS_KEY = "qa_threads";
const MESSAGES_KEY = "qa_messages";

// ─── Thread helpers ───────────────────────────────────────────────────────────

export function getThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    return raw ? (JSON.parse(raw) as Thread[]) : [];
  } catch {
    return [];
  }
}

export function saveThread(thread: Thread): void {
  if (typeof window === "undefined") return;
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    threads[idx] = thread;
  } else {
    threads.unshift(thread);
  }
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

export function deleteThread(id: string): void {
  if (typeof window === "undefined") return;
  const threads = getThreads().filter((t) => t.id !== id);
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  // Also delete messages for this thread
  const messages = getAllMessages().filter((m) => m.threadId !== id);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// ─── Message helpers ──────────────────────────────────────────────────────────

function getAllMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function getMessages(threadId: string): ChatMessage[] {
  return getAllMessages().filter((m) => m.threadId === threadId);
}

export function saveMessage(message: ChatMessage): void {
  if (typeof window === "undefined") return;
  const messages = getAllMessages();
  const idx = messages.findIndex((m) => m.id === message.id);
  if (idx >= 0) {
    messages[idx] = message;
  } else {
    messages.push(message);
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}
