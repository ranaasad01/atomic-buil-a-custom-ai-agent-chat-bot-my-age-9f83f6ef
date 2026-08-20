"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Globe, Sparkles, Terminal, FileText, Download, ChevronDown, Check, Loader2, AlertCircle, Play, Settings, X, Plus, FileCode, Activity, Clock, Trash2, Menu, MessageSquare, ChevronLeft, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  getThreads, saveThread, deleteThread as removeThread,
  getMessages, saveMessage,
  type Thread, type ChatMessage as StoredMessage
} from "@/lib/chat-store";
import { runAgent } from "@/lib/ai-agent";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentMode = "autonomous" | "hybrid" | "instruction-driven";
type TestFramework = "playwright" | "cypress" | "both";

interface ArtifactPreview {
  type: "script" | "excel" | "bug-report" | "log";
  label: string;
  size: string;
  icon: "code" | "sheet" | "bug" | "log";
}

interface StepItem {
  id: string;
  title: string;
  status: "complete" | "running" | "pending" | "error";
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

// ─── Artifact icon map ────────────────────────────────────────────────────────

function ArtifactIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "code": return <FileCode className="w-3.5 h-3.5" />;
    case "sheet": return <FileText className="w-3.5 h-3.5" />;
    case "bug": return <AlertCircle className="w-3.5 h-3.5" />;
    default: return <Terminal className="w-3.5 h-3.5" />;
  }
}

// ─── Step status icon ─────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepItem["status"] }) {
  switch (status) {
    case "complete": return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    case "running": return <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />;
    case "error": return <X className="w-3.5 h-3.5 text-[var(--destructive)]" />;
    default: return <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />;
  }
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Render message content with basic markdown ───────────────────────────────

function renderMessageContent(content: string): React.ReactNode {
  const lines = content.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pi}>{part.slice(2, -2)}</strong>;
      }
      return <span key={pi}>{part}</span>;
    });
    return (
      <span key={li}>
        {rendered}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Date grouping helpers ────────────────────────────────────────────────────

function getDateGroup(dateStr: string): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

function groupThreadsByDate(threads: Thread[]): Record<string, Thread[]> {
  const groups: Record<string, Thread[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const t of threads) {
    const group = getDateGroup(t.updatedAt || t.createdAt);
    groups[group].push(t);
  }
  return groups;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [inputUrl, setInputUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [outputs, setOutputs] = useState<string[]>(["script", "excel"]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeThreadIdRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Load threads on mount
  useEffect(() => {
    setThreads(getThreads());
  }, []);

  // Load messages when activeThreadId changes
  useEffect(() => {
    if (activeThreadId === null) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }
    const stored = getMessages(activeThreadId);
    if (stored.length === 0) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }
    const converted: UiMessage[] = stored.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.createdAt),
      artifacts: [],
      steps: [],
    }));
    setMessages(converted);
  }, [activeThreadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Refresh threads list
  const refreshThreads = useCallback(() => {
    setThreads(getThreads());
  }, []);

  // New chat
  const handleNewChat = useCallback(() => {
    setActiveThreadId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputUrl("");
    setInputText("");
    setError(null);
  }, []);

  // Select thread
  const handleSelectThread = useCallback((thread: Thread) => {
    setActiveThreadId(thread.id);
    setError(null);
  }, []);

  // Delete thread
  const handleDeleteThread = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeThread(id);
      refreshThreads();
      if (id === activeThreadIdRef.current) {
        setActiveThreadId(null);
        setMessages([WELCOME_MESSAGE]);
        setError(null);
      }
    },
    [refreshThreads]
  );

  // Toggle output option
  const toggleOutput = useCallback((id: string) => {
    setOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setError(null);

    // Determine or create thread
    let threadId = activeThreadIdRef.current;
    const isNewThread = !threadId;

    if (isNewThread) {
      threadId = Date.now().toString();
      const newThread: Thread = {
        id: threadId,
        title: text.slice(0, 40),
        targetUrl: inputUrl,
        agentMode,
        framework,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveThread(newThread);
      setActiveThreadId(threadId);
    }

    const tid = threadId!;

    // Save user message to store
    const userMsgId = `user-${Date.now()}`;
    const storedUserMsg: StoredMessage = {
      id: userMsgId,
      threadId: tid,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    saveMessage(storedUserMsg);

    // Add user message to UI
    const userUiMsg: UiMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    // Add typing indicator
    const typingMsg: UiMessage = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => {
      const base = prev.filter((m) => m.id !== "typing");
      return [...base, userUiMsg, typingMsg];
    });
    setInputText("");
    setIsLoading(true);

    try {
      const result = await runAgent({
        url: inputUrl,
        instruction: text,
        agentMode,
        framework,
        outputTypes: outputs,
        threadId: tid,
      });

      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantUiMsg: UiMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: result.content ?? "Task completed.",
        timestamp: new Date(),
        steps: result.steps ?? [],
        artifacts: result.artifacts ?? [],
      };

      // Save assistant message
      const storedAssistantMsg: StoredMessage = {
        id: assistantMsgId,
        threadId: tid,
        role: "assistant",
        content: result.content ?? "Task completed.",
        createdAt: new Date().toISOString(),
      };
      saveMessage(storedAssistantMsg);

      // Update thread title if first message
      if (isNewThread) {
        const thread = getThreads().find((t) => t.id === tid);
        if (thread) {
          saveThread({ ...thread, title: text.slice(0, 40), updatedAt: new Date().toISOString() });
        }
      }

      setMessages((prev) =>
        prev.filter((m) => m.id !== "typing").concat(assistantUiMsg)
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errMsg);
      setMessages((prev) => prev.filter((m) => m.id !== "typing"));
    } finally {
      setIsLoading(false);
      refreshThreads();
    }
  }, [inputText, inputUrl, agentMode, framework, outputs, isLoading, refreshThreads]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Current thread title
  const currentThread = threads.find((t) => t.id === activeThreadId);
  const currentTitle = currentThread?.title ?? "New Chat";

  // Grouped threads
  const groupedThreads = groupThreadsByDate(threads);
  const GROUP_ORDER = ["Today", "Yesterday", "Earlier"] as const;

  return (
    <div
      style={{ height: "calc(100vh - 64px)" }}
      className="flex flex-row overflow-hidden bg-[var(--background)]"
    >
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 shrink-0",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        {/* Sidebar header */}
        <div className="flex flex-col gap-2 p-3 border-b border-[var(--border)] shrink-0">
          {/* Logo row */}
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--primary)] shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-[var(--foreground)] truncate">QA Agent AI</span>
          </div>

          {/* New Chat button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[var(--primary)]/50 text-[var(--primary)] hover:bg-[var(--primary)]/10 text-sm font-medium transition-colors duration-200"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto py-2">
          {threads.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40" />
              <p className="text-xs text-[var(--muted-foreground)] opacity-60">No chats yet</p>
            </div>
          ) : (
            GROUP_ORDER.map((group) => {
              const groupThreads = groupedThreads[group];
              if (!groupThreads || groupThreads.length === 0) return null;
              return (
                <div key={group} className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] opacity-60">
                    {group}
                  </p>
                  {groupThreads.map((thread) => {
                    const isActive = thread.id === activeThreadId;
                    return (
                      <button
                        key={thread.id}
                        onClick={() => handleSelectThread(thread)}
                        className={cn(
                          "group w-full flex items-center gap-2 px-3 py-2 text-left transition-colors duration-150 rounded-lg mx-1",
                          isActive
                            ? "bg-[var(--primary)]/15 text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-[var(--foreground)]"
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        <span className="flex-1 text-xs truncate">{thread.title || "Untitled"}</span>
                        <button
                          onClick={(e) => handleDeleteThread(e, thread.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-[var(--destructive)] transition-all"
                          title="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">{currentTitle}</h2>
            {activeThreadId && currentThread?.targetUrl && (
              <p className="text-xs text-[var(--muted-foreground)] truncate font-mono">{currentThread.targetUrl}</p>
            )}
          </div>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              settingsOpen
                ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                : "hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
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
              className="overflow-hidden border-b border-[var(--border)] bg-[var(--card)]/60 shrink-0"
            >
              <div className="px-4 py-3 flex flex-wrap gap-6">
                {/* Agent mode */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Agent Mode</p>
                  <div className="flex items-center gap-1.5">
                    {AGENT_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setAgentMode(m.value)}
                        title={m.desc}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          agentMode === m.value
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-white/5 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framework */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Framework</p>
                  <div className="flex items-center gap-1.5">
                    {FRAMEWORKS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFramework(f.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          framework === f.value
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-white/5 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Outputs</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {OUTPUT_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => toggleOutput(o.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          outputs.includes(o.id)
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-white/5 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
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

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Avatar */}
                {msg.role !== "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-tr-sm"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm"
                  )}
                >
                  {msg.isTyping ? (
                    <TypingDots />
                  ) : (
                    <>
                      <div>{renderMessageContent(msg.content)}</div>

                      {/* Steps */}
                      {msg.steps && msg.steps.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                          {msg.steps.map((step) => (
                            <div key={step.id} className="flex items-center gap-2 text-xs">
                              <StepIcon status={step.status} />
                              <span className={cn(
                                step.status === "complete" ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                              )}>{step.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Artifacts */}
                      {msg.artifacts && msg.artifacts.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                          {msg.artifacts.map((art, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                            >
                              <ArtifactIcon icon={art.icon} />
                              <span className="flex-1 truncate">{art.label}</span>
                              <span className="text-[var(--muted-foreground)] shrink-0">{art.size}</span>
                              <button className="p-0.5 hover:text-[var(--accent)] transition-colors">
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[var(--foreground)]">U</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts — shown when no active thread */}
        {!activeThreadId && messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputText(prompt)}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          {/* URL input */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <input
                type="url"
                placeholder="https://your-site.com (optional)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40 font-mono"
              />
            </div>
          </div>

          {/* Text input + send */}
          <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--primary)]/30">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Describe what to test…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none max-h-32 leading-relaxed"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 shrink-0",
                inputText.trim() && !isLoading
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
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
