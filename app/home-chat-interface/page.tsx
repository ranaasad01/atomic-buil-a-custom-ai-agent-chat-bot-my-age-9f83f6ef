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
import type { ArtifactPreview, StepItem } from "@/lib/chat-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentMode = "autonomous" | "hybrid" | "instruction-driven";
type TestFramework = "playwright" | "cypress" | "both";

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

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <li key={i} className="ml-4 list-disc text-[var(--muted-foreground)]">
          {inlineFormat(line.slice(2))}
        </li>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(<h3 key={i} className="font-bold text-lg mt-2">{line.slice(2)}</h3>);
    } else if (line.startsWith("## ")) {
      nodes.push(<h4 key={i} className="font-semibold mt-2">{line.slice(3)}</h4>);
    } else if (line.trim() === "") {
      nodes.push(<br key={i} />);
    } else {
      nodes.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
  });

  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-[var(--foreground)] font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="px-1 py-0.5 rounded bg-[var(--border)]/60 text-[var(--accent)] font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: UiMessage }) {
  const isUser = msg.role === "user";
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
        isUser
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]"
      )}>
        {isUser ? "U" : <Zap className="w-4 h-4" />}
      </div>

      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm",
          isUser
            ? "bg-[var(--primary)] text-white rounded-tr-sm"
            : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm"
        )}>
          {msg.isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">{renderMarkdown(msg.content)}</div>
          )}
        </div>

        {/* Agent steps */}
        {!isUser && msg.steps && msg.steps.length > 0 && (
          <div className="w-full border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => setStepsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[var(--card)]/60 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                Agent steps ({msg.steps.length})
              </span>
              {stepsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <AnimatePresence>
              {stepsOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 py-2 space-y-1.5 bg-[var(--background)]/40">
                    {msg.steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 text-xs">
                        <StepStatusIcon status={step.status} />
                        <span className={cn(
                          step.status === "complete" ? "text-[var(--muted-foreground)]" :
                          step.status === "running" ? "text-[var(--foreground)]" :
                          "text-[var(--muted-foreground)]/60"
                        )}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Artifacts */}
        {!isUser && msg.artifacts && msg.artifacts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.artifacts.map((art, i) => (
              <button
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/40 transition-all group"
              >
                <span className="text-[var(--accent)] group-hover:scale-110 transition-transform">
                  <ArtifactIcon icon={art.icon} />
                </span>
                <span>{art.label}</span>
                <span className="text-[var(--muted-foreground)]/60">{art.size}</span>
                <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--muted-foreground)]/50 px-1">
          {msg.timestamp.getTime() === 0 ? "" : msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  // Sidebar / thread state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Message state
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Config panel
  const [configOpen, setConfigOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [outputs, setOutputs] = useState<string[]>(["script", "excel"]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load threads on mount
  useEffect(() => {
    const stored = getThreads();
    setThreads(stored);
    if (stored.length > 0) {
      setActiveThreadId(stored[0].id);
    }
  }, []);

  // Load messages when thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }
    const stored = getMessages(activeThreadId);
    if (stored.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    } else {
      const uiMsgs: UiMessage[] = stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(uiMsgs);
    }
  }, [activeThreadId]);

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

  const toggleOutput = useCallback((id: string) => {
    setOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  const createNewThread = useCallback(() => {
    const thread: Thread = {
      id: crypto.randomUUID(),
      title: "New session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveThread(thread);
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  }, []);

  const deleteThread = useCallback((id: string) => {
    removeThread(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      setActiveThreadId(null);
      setMessages([WELCOME_MESSAGE]);
    }
  }, [activeThreadId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Ensure we have an active thread
    let threadId = activeThreadId;
    if (!threadId) {
      const thread: Thread = {
        id: crypto.randomUUID(),
        title: text.slice(0, 40),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveThread(thread);
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      threadId = thread.id;
    }

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Save user message
    const storedUser: StoredMessage = {
      id: userMsg.id,
      threadId,
      role: "user",
      content: text,
      createdAt: userMsg.timestamp.toISOString(),
    };
    saveMessage(storedUser);

    // Typing indicator
    const typingId = crypto.randomUUID();
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
        outputs,
        threadId,
      });

      const assistantMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
        steps: result.steps,
        artifacts: result.artifacts,
      };

      setMessages((prev) => prev.filter((m) => m.id !== typingId).concat(assistantMsg));

      // Save assistant message
      const storedAssistant: StoredMessage = {
        id: assistantMsg.id,
        threadId,
        role: "assistant",
        content: result.content,
        createdAt: assistantMsg.timestamp.toISOString(),
      };
      saveMessage(storedAssistant);
    } catch (err) {
      console.error("Agent error:", err);
      setMessages((prev) =>
        prev.filter((m) => m.id !== typingId).concat({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeThreadId, targetUrl, agentMode, framework, outputs]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[var(--background)]">
      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)]/60 flex flex-col overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Sessions</span>
              <button
                onClick={createNewThread}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                title="New session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
              {threads.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)] text-center py-8 px-4">
                  No sessions yet. Start a conversation to create one.
                </p>
              ) : (
                threads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      activeThreadId === t.id
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                    onClick={() => setActiveThreadId(t.id)}
                  >
                    <span className="flex-1 text-xs truncate">{t.title ?? "Untitled"}</span>
                    <span className="text-[10px] opacity-60 shrink-0">{formatRelativeTime(t.updatedAt)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-[var(--destructive)] transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]/40 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* URL bar */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--background)]/60 border border-[var(--border)] text-sm">
            <Globe className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 text-xs"
            />
            {targetUrl && (
              <button onClick={() => setTargetUrl("")} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Config toggle */}
          <button
            onClick={() => setConfigOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              configOpen
                ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                : "bg-white/5 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Config
          </button>
        </div>

        {/* Config panel */}
        <AnimatePresence>
          {configOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-[var(--border)] bg-[var(--card)]/30"
            >
              <div className="px-4 py-3 flex flex-wrap gap-6">
                {/* Agent mode */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">Agent Mode</p>
                  <div className="flex gap-1.5">
                    {AGENT_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setAgentMode(m.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          agentMode === m.value
                            ? "bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30"
                            : "bg-white/5 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">Framework</p>
                  <div className="flex gap-1.5">
                    {FRAMEWORKS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFramework(f.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          framework === f.value
                            ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30"
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">Outputs</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {OUTPUT_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => toggleOutput(o.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          outputs.includes(o.id)
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 rounded-full text-xs border border-[var(--border)] bg-[var(--card)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 pb-4 shrink-0">
          <div className="flex items-end gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 focus-within:border-[var(--primary)]/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to test… (Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 leading-relaxed max-h-40 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "flex-shrink-0 p-2 rounded-xl transition-all",
                input.trim() && !isLoading
                  ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
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
          <p className="text-[10px] text-[var(--muted-foreground)]/40 text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
