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
    case "error": return <X className="w-3.5 h-3.5 text-[var(--destructive)]" />;
    default: return <div className="w-3.5 h-3.5 rounded-full border border-[var(--border)]" />;
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-[var(--foreground)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const codeParts = part.split(/(` + "`" + `[^` + "`" + `]+` + "`" + `)/g).map((cp, k) => {
        if (cp.startsWith("`") && cp.endsWith("`")) {
          return (
            <code
              key={k}
              className="px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--accent)] font-mono text-xs border border-[var(--border)]"
            >
              {cp.slice(1, -1)}
            </code>
          );
        }
        return cp;
      });
      return <span key={j}>{codeParts}</span>;
    });

    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
          <span>{parts.map((p, j) => <span key={j}>{p}</span>)}</span>
        </div>
      );
    }
    if (line === "") return <div key={i} className="h-2" />;
    return <div key={i}>{parts}</div>;
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatPage() {
  // ── Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // ── Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [outputs, setOutputs] = useState<string[]>(["script", "excel", "bug-report"]);

  // ── Messages
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState<Record<string, boolean>>({});

  // ── Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Load threads on mount
  useEffect(() => {
    setThreads(getThreads());
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  // Load thread messages
  const loadThread = useCallback((thread: Thread) => {
    setActiveThreadId(thread.id);
    setTargetUrl(thread.targetUrl);
    setAgentMode(thread.agentMode as AgentMode);
    setFramework(thread.framework as TestFramework);
    const stored = getMessages(thread.id);
    const uiMsgs: UiMessage[] = stored.map((m: StoredMessage) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.createdAt),
    }));
    setMessages(uiMsgs.length > 0 ? uiMsgs : [WELCOME_MESSAGE]);
    setSidebarOpen(false);
  }, []);

  // New chat
  const handleNewChat = useCallback(() => {
    setActiveThreadId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setTargetUrl("");
    setAgentMode("autonomous");
    setFramework("playwright");
    setOutputs(["script", "excel", "bug-report"]);
  }, []);

  // Delete thread
  const handleDeleteThread = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeThread(id);
      setThreads(getThreads());
      if (activeThreadId === id) handleNewChat();
    },
    [activeThreadId, handleNewChat]
  );

  // Toggle output
  const toggleOutput = (id: string) => {
    setOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  // Send message
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    let threadId = activeThreadId;
    if (!threadId) {
      threadId = `thread_${Date.now()}`;
      const newThread: Thread = {
        id: threadId,
        title: text.slice(0, 50),
        targetUrl: targetUrl || "(no URL)",
        agentMode,
        framework,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveThread(newThread);
      setActiveThreadId(threadId);
      setThreads(getThreads());
    }

    const userMsg: UiMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev.filter((m) => m.id !== "welcome"), userMsg]);
    setInput("");
    setIsLoading(true);

    saveMessage({
      id: userMsg.id,
      threadId,
      role: "user",
      content: text,
      createdAt: userMsg.timestamp.toISOString(),
    });

    const typingId = `typing_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", content: "", timestamp: new Date(), isTyping: true },
    ]);

    try {
      const result = await runAgent({
        userMessage: text,
        targetUrl,
        agentMode,
        framework,
        outputTypes: outputs,
        threadId,
      });

      const assistantMsg: UiMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
        steps: result.steps ?? [],
        artifacts: result.artifacts ?? [],
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        assistantMsg,
      ]);

      saveMessage({
        id: assistantMsg.id,
        threadId,
        role: "assistant",
        content: assistantMsg.content,
        createdAt: assistantMsg.timestamp.toISOString(),
      });

      const thread = getThreads().find((t) => t.id === threadId);
      if (thread) {
        saveThread({ ...thread, title: text.slice(0, 50), updatedAt: new Date().toISOString() });
        setThreads(getThreads());
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `**Error:** ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeThreadId, targetUrl, agentMode, framework, outputs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const isWelcomeOnly = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)]">
      {/* ── Mobile sidebar backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed md:relative z-30 md:z-auto flex flex-col w-[260px] h-full bg-[#0d1424] border-r border-[var(--border)] flex-shrink-0"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-[0_0_12px_var(--primary-glow)]">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-[var(--foreground)] tracking-tight">
                  QA Agent AI
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors md:hidden"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat button */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {threads.length === 0 ? (
                <div className="text-center py-10 text-[var(--muted-foreground)] text-xs px-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                  No conversations yet.
                  <br />
                  Start a new chat above.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => loadThread(thread)}
                      className={cn(
                        "group relative flex flex-col gap-0.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                        activeThreadId === thread.id
                          ? "bg-[var(--primary)]/10 border-l-2 border-[var(--primary)]"
                          : "hover:bg-white/5 border-l-2 border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium text-[var(--foreground)] truncate flex-1 leading-tight">
                          {thread.title || "Untitled"}
                        </span>
                        <button
                          onClick={(e) => handleDeleteThread(thread.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all flex-shrink-0"
                          aria-label="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-[var(--muted-foreground)] truncate">
                        {thread.targetUrl !== "(no URL)" ? thread.targetUrl : "No URL set"}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]/60">
                        {formatRelativeTime(thread.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-[var(--muted-foreground)]">AI Powered</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-sm flex-shrink-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* URL display */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0" />
            <span className="text-xs text-[var(--muted-foreground)] truncate">
              {targetUrl || "No URL set — configure in settings"}
            </span>
          </div>

          {/* Badges */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20">
              {agentMode}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {framework}
            </span>
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "p-2 rounded-lg transition-colors flex-shrink-0",
              settingsOpen
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
            )}
            aria-label="Toggle settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              key="settings"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="bg-[var(--card)] border-b border-[var(--border)] p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* URL */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                      Target URL
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] focus-within:border-[var(--primary)]/60 transition-colors">
                      <Globe className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                      <input
                        ref={urlInputRef}
                        type="url"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                      />
                      {targetUrl && (
                        <button
                          onClick={() => setTargetUrl("")}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Agent Mode */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                        Agent Mode
                      </label>
                      <div className="space-y-1.5">
                        {AGENT_MODES.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setAgentMode(m.value)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all text-xs",
                              agentMode === m.value
                                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
                                : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors",
                                agentMode === m.value
                                  ? "border-[var(--primary)] bg-[var(--primary)]"
                                  : "border-[var(--border)]"
                              )}
                            />
                            <div>
                              <div className="font-medium">{m.label}</div>
                              <div className="text-[10px] opacity-70">{m.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Framework */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                          Framework
                        </label>
                        <div className="flex gap-1.5">
                          {FRAMEWORKS.map((f) => (
                            <button
                              key={f.value}
                              onClick={() => setFramework(f.value)}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                framework === f.value
                                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/50"
                              )}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Outputs */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                          Outputs
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {OUTPUT_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => toggleOutput(o.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border transition-all",
                                outputs.includes(o.id)
                                  ? "border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--foreground)]"
                                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-3 h-3 rounded border flex items-center justify-center flex-shrink-0",
                                  outputs.includes(o.id)
                                    ? "bg-[var(--primary)] border-[var(--primary)]"
                                    : "border-[var(--border)]"
                                )}
                              >
                                {outputs.includes(o.id) && (
                                  <Check className="w-2 h-2 text-white" />
                                )}
                              </div>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto">
          {isWelcomeOnly ? (
            /* Empty / welcome state */
            <div className="flex flex-col items-center justify-center h-full px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_32px_var(--primary-glow)]"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2
                  className="text-2xl font-bold mb-2 tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--accent))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Ready to Test
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
                  Paste a URL, describe your testing goal, and let the AI agent handle the rest — from crawling to scripts to Excel sheets.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-2.5 rounded-xl text-xs text-[var(--muted-foreground)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)] hover:bg-[var(--primary)]/5 transition-all text-left leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Message list */
            <div className="px-4 py-4 space-y-5 max-w-4xl mx-auto w-full">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx === messages.length - 1 ? 0.05 : 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                      msg.role === "user"
                        ? "bg-[var(--primary)] shadow-[0_0_12px_var(--primary-glow)]"
                        : "bg-[var(--accent)]/15 border border-[var(--accent)]/30"
                    )}
                  >
                    {msg.role === "user" ? (
                      <span className="text-white text-xs font-bold">U</span>
                    ) : (
                      <Zap className="w-4 h-4 text-[var(--accent)]" />
                    )}
                  </div>

                  {/* Bubble + metadata */}
                  <div
                    className={cn(
                      "flex flex-col gap-1.5 max-w-[80%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Role + timestamp */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                        {msg.role === "user" ? "You" : "QA Agent"}
                      </span>
                      {msg.timestamp.getTime() !== 0 && (
                        <span className="text-[10px] text-[var(--muted-foreground)]/50">
                          {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === "user"
                          ? "text-white rounded-tr-sm"
                          : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]"
                      )}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, var(--primary), #7c3aed)" }
                          : {}
                      }
                    >
                      {msg.isTyping ? (
                        /* Typing indicator */
                        <div className="flex items-center gap-1.5 py-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-[var(--accent)]"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {renderMarkdown(msg.content)}
                        </div>
                      )}
                    </div>

                    {/* Agent steps */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl overflow-hidden">
                        <button
                          onClick={() =>
                            setStepsExpanded((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                            Agent Steps ({msg.steps.length})
                          </span>
                          {stepsExpanded[msg.id] ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <AnimatePresence>
                          {stepsExpanded[msg.id] && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-2 space-y-1.5 border-t border-[var(--border)]">
                                {msg.steps.map((step) => (
                                  <div key={step.id} className="flex items-center gap-2 py-1">
                                    <StepStatusIcon status={step.status} />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        step.status === "complete"
                                          ? "text-[var(--foreground)]"
                                          : step.status === "running"
                                          ? "text-[var(--accent)]"
                                          : step.status === "error"
                                          ? "text-[var(--destructive)]"
                                          : "text-[var(--muted-foreground)]"
                                      )}
                                    >
                                      {step.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Artifacts */}
                    {msg.artifacts && msg.artifacts.length > 0 && (
                      <div className="w-full grid grid-cols-2 gap-2">
                        {msg.artifacts.map((art, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors group cursor-default"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                              <ArtifactIcon icon={art.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-[var(--foreground)] truncate">
                                {art.label}
                              </div>
                              <div className="text-[10px] text-[var(--muted-foreground)]">
                                {art.size}
                              </div>
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-all"
                              aria-label="Download artifact"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--background)] p-3 md:p-4">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Quick prompt chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)] bg-[var(--card)] transition-all whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* URL input */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] focus-within:border-[var(--primary)]/60 transition-colors">
              <Globe className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com — paste target URL here"
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
              {targetUrl && (
                <button
                  onClick={() => setTargetUrl("")}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Clear URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Textarea + send button */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what to test... (Ctrl+Enter to send)"
                  rows={1}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)]/60 resize-none transition-colors leading-relaxed"
                  style={{ minHeight: "44px", maxHeight: "160px" }}
                />
                {input.length > 0 && (
                  <div className="absolute bottom-2 right-3 text-[10px] text-[var(--muted-foreground)]/50 pointer-events-none">
                    {input.length}
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                title="Send (Ctrl+Enter)"
                aria-label="Send message"
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
    </div>
  );
}
