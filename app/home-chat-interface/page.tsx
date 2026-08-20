"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, Globe, Sparkles, Terminal, FileText, Download, ChevronDown, Check, Loader2, AlertCircle, Play, Settings, X, Plus, FileCode, Activity, Clock, Star } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

type AgentMode = "autonomous" | "hybrid" | "instruction-driven";
type TestFramework = "playwright" | "cypress" | "both";
type MessageRole = "user" | "assistant" | "system";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  artifacts?: ArtifactPreview[];
  steps?: StepItem[];
}

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Run a full end-to-end test on this URL",
  "Generate Playwright test scripts",
  "Create an Excel test case sheet",
  "Find accessibility issues",
  "Check all form validations",
  "Test login and auth flows",
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

const MOCK_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I'm your QA Agent. Paste any live website URL and tell me what you'd like to test. I can run end-to-end tests, write automation scripts in Playwright or Cypress, generate Excel test case sheets, and produce detailed bug reports.",
    timestamp: new Date(0),
    steps: [],
    artifacts: [],
  },
];

function makeMockAgentResponse(url: string): ChatMessage {
  return {
    id: `agent-resp`,
    role: "assistant",
    content: `I've analyzed **${url}** and completed the test run. Here's what I found:\n\n- **12 test cases** executed across 4 modules\n- **10 passed**, 1 failed, 1 skipped\n- Critical issue found in the checkout flow: form validation missing on email field\n- Accessibility: 3 WCAG AA warnings detected\n\nArtifacts are ready for download below.`,
    timestamp: new Date(0),
    steps: [
      { id: "s1", title: "Crawling site structure", status: "complete" },
      { id: "s2", title: "Identifying interactive elements", status: "complete" },
      { id: "s3", title: "Running test scenarios", status: "complete" },
      { id: "s4", title: "Generating artifacts", status: "complete" },
    ],
    artifacts: [
      { type: "script", label: "playwright-tests.spec.ts", size: "14 KB", icon: "code" },
      { type: "excel", label: "test-cases.xlsx", size: "28 KB", icon: "sheet" },
      { type: "bug-report", label: "bug-report.pdf", size: "6 KB", icon: "bug" },
      { type: "log", label: "run-log.txt", size: "3 KB", icon: "log" },
    ],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const artifactIconMap: Record<string, React.ReactNode> = {
  code: <FileCode className="w-4 h-4" />,
  sheet: <FileText className="w-4 h-4" />,
  bug: <AlertCircle className="w-4 h-4" />,
  log: <Terminal className="w-4 h-4" />,
};

function ArtifactChip({ artifact }: { artifact: ArtifactPreview }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] transition-all duration-200 cursor-pointer group">
      <span className="text-[var(--accent)] group-hover:text-[var(--accent)]">
        {artifactIconMap[artifact.icon]}
      </span>
      <span className="font-mono text-[var(--foreground)] truncate max-w-[120px]">{artifact.label}</span>
      <span className="text-[var(--muted-foreground)]">{artifact.size}</span>
      <Download className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function StepBadge({ step }: { step: StepItem }) {
  const statusConfig = {
    complete: { icon: <Check className="w-3 h-3" />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    running: { icon: <Loader2 className="w-3 h-3 animate-spin" />, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" },
    pending: { icon: <Clock className="w-3 h-3" />, color: "text-[var(--muted-foreground)]", bg: "bg-white/5" },
    error: { icon: <AlertCircle className="w-3 h-3" />, color: "text-[var(--destructive)]", bg: "bg-[var(--destructive)]/10" },
  };
  const cfg = statusConfig[step.status];
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>
      {cfg.icon}
      <span>{step.title}</span>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
          isUser
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
        )}
      >
        {isUser ? "U" : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-[var(--primary)] text-white rounded-tr-sm"
              : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm"
          )}
        >
          {message.isTyping ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>

        {/* Steps */}
        {message.steps && message.steps.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.steps.map((step) => (
              <StepBadge key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {message.artifacts.map((artifact) => (
              <ArtifactChip key={artifact.label} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({
  agentMode,
  setAgentMode,
  framework,
  setFramework,
  outputs,
  toggleOutput,
  onClose,
}: {
  agentMode: AgentMode;
  setAgentMode: (m: AgentMode) => void;
  framework: TestFramework;
  setFramework: (f: TestFramework) => void;
  outputs: string[];
  toggleOutput: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="absolute right-0 top-full mt-2 z-50 w-80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--foreground)]">Session Settings</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Agent Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Agent Mode</label>
        <div className="flex flex-col gap-1">
          {AGENT_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setAgentMode(mode.value)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150",
                agentMode === mode.value
                  ? "bg-[var(--primary)]/15 text-[var(--foreground)] border border-[var(--primary)]/30"
                  : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-[var(--foreground)] border border-transparent"
              )}
            >
              <span>{mode.label}</span>
              <span className="text-xs opacity-60">{mode.desc}</span>
              {agentMode === mode.value && <Check className="w-3.5 h-3.5 text-[var(--primary)] ml-2" />}
            </button>
          ))}
        </div>
      </div>

      {/* Framework */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Test Framework</label>
        <div className="flex gap-1">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.value}
              onClick={() => setFramework(fw.value)}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border",
                framework === fw.value
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30"
                  : "text-[var(--muted-foreground)] hover:bg-white/5 border-transparent"
              )}
            >
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Output Types</label>
        <div className="grid grid-cols-2 gap-1">
          {OUTPUT_OPTIONS.map((opt) => {
            const active = outputs.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleOutput(opt.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all duration-150 border",
                  active
                    ? "bg-[var(--primary)]/10 text-[var(--foreground)] border-[var(--primary)]/20"
                    : "text-[var(--muted-foreground)] hover:bg-white/5 border-transparent"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center", active ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]")}>
                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeChatInterfacePage() {
  const t = useTranslations();

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [outputs, setOutputs] = useState<string[]>(["script", "excel", "bug-report"]);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function validateUrl(value: string): boolean {
    try {
      const u = new URL(value);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }

  const toggleOutput = useCallback((id: string) => {
    setOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (url && !validateUrl(url)) {
      setUrlError("Please enter a valid URL starting with https://");
      return;
    }
    setUrlError("");

    const userMsg: ChatMessage = {
      id: `user-${messages.length}`,
      role: "user",
      content: url ? `${trimmed}\n\nURL: ${url}` : trimmed,
      timestamp: new Date(),
    };

    const typingMsg: ChatMessage = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInput("");
    setIsLoading(true);
    setShowQuickPrompts(false);

    await new Promise((r) => setTimeout(r, 2200));

    const agentMsg = makeMockAgentResponse(url || "the target website");
    setMessages((prev) => [...prev.filter((m) => m.id !== "typing"), agentMsg]);
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-6 gap-4">
      {/* ── Header ── */}
      <Reveal>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] pulse-glow" />
            <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">QA Agent</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            Talk to your QA Agent
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            Paste a URL, describe what to test, and the agent will crawl, script, and execute — streaming results live.
          </p>
        </div>
      </Reveal>

      {/* ── URL Bar ── */}
      <Reveal delay={0.05}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] focus-within:border-[var(--accent)]/50 transition-colors">
            <Globe className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
              placeholder="https://your-website.com"
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
            />
            {url && (
              <button onClick={() => { setUrl(""); setUrlError(""); }} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {urlError && (
            <p className="text-xs text-[var(--destructive)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {urlError}
            </p>
          )}
        </div>
      </Reveal>

      {/* ── Chat Window ── */}
      <Reveal delay={0.1} className="flex-1">
        <div className="flex flex-col gap-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden" style={{ minHeight: "420px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ maxHeight: "520px", minHeight: "320px" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <AnimatePresence>
            {showQuickPrompts && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="px-4 pb-2 flex flex-wrap gap-1.5"
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all duration-150"
                  >
                    {prompt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Row */}
          <div className="border-t border-[var(--border)] p-3 flex items-end gap-2">
            {/* Settings toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className={cn(
                  "p-2 rounded-lg border transition-all duration-150",
                  showSettings
                    ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                )}
                aria-label="Session settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <SettingsPanel
                    agentMode={agentMode}
                    setAgentMode={setAgentMode}
                    framework={framework}
                    setFramework={setFramework}
                    outputs={outputs}
                    toggleOutput={toggleOutput}
                    onClose={() => setShowSettings(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what to test, or ask a question..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none leading-relaxed py-1.5 max-h-32 overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              disabled={isLoading}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center",
                isLoading || !input.trim()
                  ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 glow-primary"
              )}
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
      </Reveal>

      {/* ── Status Bar ── */}
      <Reveal delay={0.15}>
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Mode: <span className="text-[var(--foreground)] font-medium">{AGENT_MODES.find((m) => m.value === agentMode)?.label}</span>
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              <span className="text-[var(--foreground)] font-medium">{FRAMEWORKS.find((f) => f.value === framework)?.label}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {outputs.length} output{outputs.length !== 1 ? "s" : ""} selected
          </span>
        </div>
      </Reveal>
    </div>
  );
}
