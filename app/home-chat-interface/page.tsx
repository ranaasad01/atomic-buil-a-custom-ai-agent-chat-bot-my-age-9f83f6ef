"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Globe, Sparkles, Download, Check, Loader2, X, Plus, FileCode, Trash2, Menu, Zap, ChevronDown, ChevronRight, Settings, Bug, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  getThreads, saveThread, deleteThread as removeThread,
  getMessages, saveMessage,
  type Thread, type ChatMessage as StoredMessage
} from "@/lib/chat-store";
import { runAgent } from "@/lib/ai-agent";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  persistSession,
  persistMessage,
  getLongTermSessions,
  getLongTermMessages,
  addShortTermMessage,
  getShortTermMessages,
  clearShortTermMemory,
  type MemoryMessage,
} from "@/lib/supabase/memory";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentMode = "autonomous" | "hybrid" | "instruction-driven";
type TestFramework = "playwright" | "cypress" | "both";

interface ArtifactPreview {
  id: string;
  label: string;
  icon: string;
  size?: string;
  downloadUrl?: string;
}

interface StepItem {
  id: string;
  title: string;
  status: "pending" | "running" | "complete" | "error";
  description?: string;
}

interface UiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  artifacts?: ArtifactPreview[];
  steps?: StepItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Run a full end-to-end test",
  "Generate Playwright scripts",
  "Create Excel test cases",
  "Find accessibility issues",
  "Check form validations",
  "Test login flows",
];

const AGENT_MODES: { value: AgentMode; label: string; desc: string }[] = [
  { value: "autonomous", label: "Autonomous", desc: "Agent decides all steps" },
  { value: "hybrid", label: "Hybrid", desc: "Agent + your guidance" },
  { value: "instruction-driven", label: "Instruction-driven", desc: "You direct every step" },
];

const FRAMEWORKS: { value: TestFramework; label: string }[] = [
  { value: "playwright", label: "Playwright" },
  { value: "cypress", label: "Cypress" },
  { value: "both", label: "Both" },
];

const OUTPUT_OPTIONS = [
  { id: "script", label: "Test Scripts" },
  { id: "excel", label: "Excel Sheet" },
  { id: "bug-report", label: "Bug Report" },
  { id: "log", label: "Run Logs" },
];

const WELCOME_MESSAGE: UiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your **QA Agent AI**. Paste any live website URL and tell me what you'd like to test.\n\nI can:\n- Run **end-to-end tests** on any live site\n- Write **Playwright or Cypress** automation scripts\n- Generate **Excel test case sheets**\n- Produce detailed **bug reports** with evidence\n\nGet started by entering a URL and describing your testing goal below.",
  timestamp: new Date(0),
  steps: [],
  artifacts: [],
};

// ─── Helper: format relative time (stable, no Date.now() during render) ───────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Artifact icon ────────────────────────────────────────────────────────────

function ArtifactIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "code": return <FileCode className="w-4 h-4" />;
    case "sheet": return <span className="text-sm">📊</span>;
    case "bug": return <Bug className="w-4 h-4" />;
    default: return <span className="text-sm">📄</span>;
  }
}

// ─── Step status icon ─────────────────────────────────────────────────────────

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "complete": return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    case "running": return <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />;
    case "error": return <AlertCircle className="w-3.5 h-3.5 text-[var(--destructive)]" />;
    default: return <div className="w-3.5 h-3.5 rounded-full border border-[var(--border)]" />;
  }
}

// ─── Markdown renderer (minimal) ──────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="text-[var(--foreground)] font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Inline code
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={j} className="px-1 py-0.5 rounded bg-white/10 font-mono text-[var(--accent)] text-xs">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    if (line.startsWith("- ")) {
      nodes.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
          <span>{rendered}</span>
        </div>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(<p key={i} className="font-bold text-base text-[var(--foreground)] mt-2 mb-1">{rendered}</p>);
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(<p key={i} className="leading-relaxed">{rendered}</p>);
    }
  });

  return nodes;
}

// ─── Code block renderer ──────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-[var(--border)]">
        <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-[var(--foreground)] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Message renderer ─────────────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  // Split on code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim() || "text";
          const code = lines.slice(1).join("\n");
          return <CodeBlock key={i} code={code} language={lang} />;
        }
        return <div key={i}>{renderMarkdown(part)}</div>;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();

  // ── State ──
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["script", "excel"]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load threads on mount ──
  useEffect(() => {
    async function loadThreads() {
      const localThreads = getThreads();

      if (user) {
        try {
          const dbSessions = await getLongTermSessions(user.id);
          // Merge: prefer DB data, deduplicate by id
          const dbMap = new Map<string, Thread>();
          dbSessions.forEach((s) => {
            dbMap.set(s.id, {
              id: s.id,
              title: s.title ?? null,
              createdAt: s.created_at,
              updatedAt: s.updated_at ?? s.created_at,
              targetUrl: s.target_url ?? undefined,
              agentMode: s.agent_mode ?? undefined,
              framework: s.test_framework ?? undefined,
            });
          });
          // Add local threads not in DB
          localThreads.forEach((t) => {
            if (!dbMap.has(t.id)) {
              dbMap.set(t.id, t);
            }
          });
          const merged = Array.from(dbMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setThreads(merged);
        } catch {
          setThreads(localThreads);
        }
      } else {
        setThreads(localThreads);
      }
    }
    loadThreads();
  }, [user]);

  // ── Scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-resize textarea ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ── New thread ──
  const newThread = useCallback(async () => {
    const id = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const thread: Thread = {
      id,
      title: "New session",
      createdAt: now,
      updatedAt: now,
      targetUrl: targetUrl || undefined,
      agentMode,
      framework,
    };
    saveThread(thread);

    if (user) {
      try {
        await persistSession({
          id,
          user_id: user.id,
          title: "New session",
          target_url: targetUrl || null,
          agent_mode: agentMode,
          test_framework: framework,
          status: "running",
          summary: null,
          created_at: now,
          updated_at: now,
        });
      } catch {
        // Non-fatal: local storage already saved
      }
    }

    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(id);
    setMessages([WELCOME_MESSAGE]);
    clearShortTermMemory(id);
  }, [targetUrl, agentMode, framework, user]);

  // ── Switch thread ──
  const switchThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId);

      if (user) {
        try {
          const dbMessages = await getLongTermMessages(threadId);
          if (dbMessages.length > 0) {
            const uiMessages: UiMessage[] = dbMessages.map((m) => ({
              id: m.id,
              role: m.role as UiMessage["role"],
              content: m.content,
              timestamp: new Date(m.created_at),
              artifacts: [],
              steps: [],
            }));
            setMessages([WELCOME_MESSAGE, ...uiMessages]);
            return;
          }
        } catch {
          // Fall through to local storage
        }
      }

      // Fallback: local storage
      const stored = getMessages(threadId);
      if (stored.length > 0) {
        const uiMessages: UiMessage[] = stored.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt),
          artifacts: [],
          steps: [],
        }));
        setMessages([WELCOME_MESSAGE, ...uiMessages]);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    },
    [user]
  );

  // ── Delete thread ──
  const handleDeleteThread = useCallback(
    (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      removeThread(threadId);
      clearShortTermMemory(threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([WELCOME_MESSAGE]);
      }
    },
    [activeThreadId]
  );

  // ── Toggle output ──
  const toggleOutput = useCallback((id: string) => {
    setSelectedOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  // ── Toggle step expansion ──
  const toggleStep = useCallback((msgId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    // Ensure we have an active thread
    let threadId = activeThreadId;
    if (!threadId) {
      const id = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const thread: Thread = {
        id,
        title: text.slice(0, 60),
        createdAt: now,
        updatedAt: now,
        targetUrl: targetUrl || undefined,
        agentMode,
        framework,
      };
      saveThread(thread);

      if (user) {
        try {
          await persistSession({
            id,
            user_id: user.id,
            title: text.slice(0, 60),
            target_url: targetUrl || null,
            agent_mode: agentMode,
            test_framework: framework,
            status: "running",
            summary: null,
            created_at: now,
            updated_at: now,
          });
        } catch {
          // Non-fatal
        }
      }

      setThreads((prev) => [thread, ...prev]);
      threadId = id;
      setActiveThreadId(id);
      clearShortTermMemory(id);
    }

    const userMsgId = `msg_${Date.now()}_u`;
    const now = new Date().toISOString();

    const userUiMsg: UiMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date(now),
    };

    setMessages((prev) => [...prev, userUiMsg]);

    // Persist user message
    const storedUserMsg: StoredMessage = {
      id: userMsgId,
      threadId,
      role: "user",
      content: text,
      createdAt: now,
    };
    saveMessage(storedUserMsg);

    if (user) {
      const memMsg: MemoryMessage = {
        id: userMsgId,
        session_id: threadId,
        user_id: user.id,
        role: "user",
        content: text,
        metadata: null,
        created_at: now,
      };
      addShortTermMessage(threadId, memMsg);
      try {
        await persistMessage(memMsg);
      } catch {
        // Non-fatal
      }
    }

    // Typing indicator
    const typingId = `typing_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", content: "", timestamp: new Date(), isTyping: true },
    ]);

    setIsLoading(true);

    try {
      // Build context from short-term memory
      const shortTermMsgs = getShortTermMessages(threadId);
      const contextMessages = shortTermMsgs.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      const result = await runAgent({
        userMessage: text,
        targetUrl: targetUrl || undefined,
        agentMode,
        framework,
        outputs: selectedOutputs,
        threadId,
      });

      const assistantMsgId = `msg_${Date.now()}_a`;
      const assistantNow = new Date().toISOString();

      // Map result artifacts to ArtifactPreview
      const artifactPreviews: ArtifactPreview[] = (result.artifacts ?? []).map(
        (a: { label: string; icon: string; size?: string; downloadUrl?: string }, idx: number) => ({
          id: `artifact_${idx}`,
          label: a.label,
          icon: a.icon,
          size: a.size,
          downloadUrl: a.downloadUrl,
        })
      );

      const assistantUiMsg: UiMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: result.content,
        timestamp: new Date(assistantNow),
        artifacts: artifactPreviews,
        steps: result.steps ?? [],
      };

      setMessages((prev) => prev.filter((m) => m.id !== typingId).concat(assistantUiMsg));

      // Persist assistant message
      const storedAssistantMsg: StoredMessage = {
        id: assistantMsgId,
        threadId,
        role: "assistant",
        content: result.content,
        createdAt: assistantNow,
      };
      saveMessage(storedAssistantMsg);

      if (user) {
        const memAssistantMsg: MemoryMessage = {
          id: assistantMsgId,
          session_id: threadId,
          user_id: user.id,
          role: "assistant",
          content: result.content,
          metadata: null,
          created_at: assistantNow,
        };
        addShortTermMessage(threadId, memAssistantMsg);
        try {
          await persistMessage(memAssistantMsg);
        } catch {
          // Non-fatal
        }
      }
    } catch (err) {
      const errorMsg: UiMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => prev.filter((m) => m.id !== typingId).concat(errorMsg));
      console.error("Agent error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeThreadId, targetUrl, agentMode, framework, selectedOutputs, user]);

  // ── Keyboard handler ──
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // ── Render ──
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)]">
      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--card)]/60 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--foreground)]">Sessions</span>
              <button
                onClick={() => void newThread()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
              {threads.length === 0 && (
                <p className="text-xs text-[var(--muted-foreground)] text-center py-8 px-4">
                  No sessions yet. Start a new one!
                </p>
              )}
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => void switchThread(thread.id)}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                    activeThreadId === thread.id
                      ? "bg-[var(--primary)]/15 text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-[var(--foreground)]"
                  )}
                >
                  <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--primary)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{thread.title ?? "Untitled"}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {formatRelativeTime(thread.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteThread(e, thread.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {user && (
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  Signed in as {user.email}
                </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]/40">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* URL input */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 max-w-lg">
            <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0" />
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none min-w-0"
            />
            {targetUrl && (
              <button onClick={() => setTargetUrl("")} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              settingsOpen
                ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-[var(--border)] bg-[var(--card)]/30"
            >
              <div className="px-4 py-4 flex flex-wrap gap-6">
                {/* Agent mode */}
                <div>
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Agent Mode</p>
                  <div className="flex gap-2">
                    {AGENT_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setAgentMode(m.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          agentMode === m.value
                            ? "bg-[var(--primary)] text-white"
                            : "bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                        title={m.desc}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framework */}
                <div>
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Framework</p>
                  <div className="flex gap-2">
                    {FRAMEWORKS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFramework(f.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          framework === f.value
                            ? "bg-[var(--accent)] text-[#0f172a]"
                            : "bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div>
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Outputs</p>
                  <div className="flex gap-2 flex-wrap">
                    {OUTPUT_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => toggleOutput(o.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          selectedOutputs.includes(o.id)
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role !== "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/25 flex items-center justify-center mt-0.5">
                  <Zap className="w-4 h-4 text-[var(--primary)]" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white rounded-tr-sm"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm"
                )}
              >
                {msg.isTyping ? (
                  <div className="flex items-center gap-1.5 py-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <MessageContent content={msg.content} />

                    {/* Steps */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <button
                          onClick={() => toggleStep(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-2"
                        >
                          {expandedSteps.has(msg.id) ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          {msg.steps.length} agent step{msg.steps.length !== 1 ? "s" : ""}
                        </button>
                        <AnimatePresence>
                          {expandedSteps.has(msg.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden space-y-1.5"
                            >
                              {msg.steps.map((step) => (
                                <div key={step.id} className="flex items-start gap-2">
                                  <StepStatusIcon status={step.status} />
                                  <div>
                                    <p className="text-xs font-medium text-[var(--foreground)]">{step.title}</p>
                                    {step.description && (
                                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{step.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Artifacts */}
                    {msg.artifacts && msg.artifacts.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Artifacts</p>
                        {msg.artifacts.map((artifact) => (
                          <div
                            key={artifact.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                          >
                            <ArtifactIcon icon={artifact.icon} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[var(--foreground)] truncate">{artifact.label}</p>
                              {artifact.size && (
                                <p className="text-[10px] text-[var(--muted-foreground)]">{artifact.size}</p>
                              )}
                            </div>
                            {artifact.downloadUrl && (
                              <a
                                href={artifact.downloadUrl}
                                download
                                className="p-1 rounded hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-[var(--primary)]">
                    {user?.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 focus-within:border-[var(--primary)]/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to test..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                input.trim() && !isLoading
                  ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                  : "bg-white/5 text-[var(--muted-foreground)] cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
