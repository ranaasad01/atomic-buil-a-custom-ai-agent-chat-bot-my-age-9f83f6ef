"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, Globe, Sparkles, Terminal, FileText, Download, ChevronDown, Check, Loader2, AlertCircle, Play, Settings, X, Plus, FileCode, Activity, Clock, Star } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import type from "@/lib/data";
type AgentMode = any;
const AgentMode: any = [];
type TestFramework = any;
const TestFramework: any = [];
type MessageRole = any;
const MessageRole: any = [];

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
    timestamp: new Date(Date.now() - 60000),
    steps: [],
    artifacts: [],
  },
];

const MOCK_AGENT_RESPONSE = (url: string): ChatMessage => ({
  id: `agent-${Date.now()}`,
  role: "assistant",
  content: `I've analyzed **${url}** and completed the test run. Here's what I found:\n\n- **12 test cases** executed across 4 modules\n- **10 passed**, 1 failed, 1 skipped\n- Critical issue found in the checkout flow: form validation missing on email field\n- Accessibility: 3 WCAG AA warnings detected\n\nArtifacts are ready for download below.`,
  timestamp: new Date(),
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
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const artifactIconVariants: Record<string, React.ReactNode> = {
  code: <FileCode className="h-4 w-4" />,
  sheet: <FileText className="h-4 w-4" />,
  bug: <AlertCircle className="h-4 w-4" />,
  log: <Terminal className="h-4 w-4" />,
};

const artifactColors: Record<string, string> = {
  script: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  excel: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bug-report": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  log: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function ArtifactChip({ artifact }: { artifact: ArtifactPreview }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
        artifactColors[artifact.type]
      )}
    >
      {artifactIconVariants[artifact.icon]}
      <span>{artifact.label}</span>
      <span className="opacity-60">{artifact.size}</span>
      <Download className="h-3 w-3 opacity-60" />
    </motion.button>
  );
}

function StepBadge({ step }: { step: StepItem }) {
  const icons = {
    complete: <Check className="h-3 w-3" />,
    running: <Loader2 className="h-3 w-3 animate-spin" />,
    pending: <Clock className="h-3 w-3 opacity-40" />,
    error: <AlertCircle className="h-3 w-3" />,
  };
  const colors = {
    complete: "text-emerald-400",
    running: "text-[var(--accent)]",
    pending: "text-slate-500",
    error: "text-rose-400",
  };
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", colors[step.status])}>
      {icons[step.status]}
      <span>{step.title}</span>
    </div>
  );
}

const typingVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

function TypingIndicator() {
  return (
    <motion.div
      variants={typingVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex items-center gap-1 px-4 py-3"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-[var(--accent)]/60"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        </div>
      )}

      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-[var(--accent)] text-black font-medium rounded-tr-sm"
              : "bg-white/5 border border-white/10 text-white/85 rounded-tl-sm"
          )}
        >
          {renderContent(msg.content)}
        </div>

        {msg.steps && msg.steps.length > 0 && (
          <div className="flex flex-col gap-1 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Agent Steps
            </p>
            {msg.steps.map((step) => (
              <StepBadge key={step.id} step={step} />
            ))}
          </div>
        )}

        {msg.artifacts && msg.artifacts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.artifacts.map((a) => (
              <ArtifactChip key={a.label} artifact={a} />
            ))}
          </div>
        )}

        <span className="text-[10px] text-white/25">
          {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15">
          <span className="text-xs font-bold text-white/70">U</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

interface SettingsPanelProps {
  agentMode: AgentMode;
  setAgentMode: (m: AgentMode) => void;
  framework: TestFramework;
  setFramework: (f: TestFramework) => void;
  outputs: string[];
  toggleOutput: (id: string) => void;
  onClose: () => void;
}

function SettingsPanel({
  agentMode,
  setAgentMode,
  framework,
  setFramework,
  outputs,
  toggleOutput,
  onClose,
}: SettingsPanelProps) {
  const panelVariants: Variants = {
    hidden: { opacity: 0, x: 24, scale: 0.97 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-white/10 bg-[#0f1117] shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Session Settings</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Agent Mode
          </p>
          <div className="space-y-1">
            {AGENT_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setAgentMode(m.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150",
                  agentMode === m.value
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-white/60 hover:bg-white/5 border border-transparent"
                )}
              >
                <span className="font-medium">{m.label}</span>
                <span className="opacity-60">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Test Framework
          </p>
          <div className="flex gap-2">
            {FRAMEWORKS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFramework(f.value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all duration-150",
                  framework === f.value
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Output Types
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {OUTPUT_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => toggleOutput(o.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-150",
                  outputs.includes(o.id)
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/10 text-white/50 hover:border-white/20"
                )}
              >
                {outputs.includes(o.id) && <Check className="h-3 w-3" />}
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeChatInterfacePage() {
  const t = useTranslations();

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>("autonomous");
  const [framework, setFramework] = useState<TestFramework>("playwright");
  const [outputs, setOutputs] = useState<string[]>(["script", "excel", "bug-report"]);
  const [sessionActive, setSessionActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const toggleOutput = (id: string) => {
    setOutputs((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && !urlValue.trim()) return;

    const userContent = urlValue.trim()
      ? `${urlValue.trim()}\n\n${text || "Run a full end-to-end test on this URL."}`
      : text;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setSessionActive(true);

    await new Promise((r) => setTimeout(r, 2800));

    setIsTyping(false);
    const agentMsg = MOCK_AGENT_RESPONSE(urlValue.trim() || "https://example.com");
    setMessages((prev) => [...prev, agentMsg]);
    setUrlValue("");
  }, [inputValue, urlValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleNewSession = () => {
    setMessages(MOCK_INITIAL_MESSAGES);
    setSessionActive(false);
    setUrlValue("");
    setInputValue("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[hsl(var(--background))]">
      {/* ── Top bar ── */}
      <Reveal>
        <div className="flex items-center justify-between border-b border-white/8 bg-white/2 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">
                {t("chat.title")}
              </h1>
              <p className="text-[10px] text-white/40">
                {sessionActive ? t("chat.sessionActive") : t("chat.sessionIdle")}
              </p>
            </div>
            {sessionActive && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("chat.live")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleNewSession}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("chat.newSession")}
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowSettings((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200",
                  showSettings
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white/90"
                )}
              >
                <Settings className="h-3.5 w-3.5" />
                {t("chat.settings")}
              </motion.button>

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
          </div>
        </div>
      </Reveal>

      {/* ── Config strip ── */}
      <Reveal>
        <div className="flex items-center gap-3 border-b border-white/5 bg-white/1 px-4 py-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
            {t("chat.configLabel")}
          </span>
          <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-2 py-0.5 text-[10px] text-[var(--accent)] font-medium capitalize">
            {agentMode}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50 font-medium capitalize">
            {framework}
          </span>
          {outputs.map((o) => (
            <span
              key={o}
              className="rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[10px] text-white/40 font-medium capitalize"
            >
              {o}
            </span>
          ))}
        </div>
      </Reveal>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-start gap-3"
            >
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick prompts (shown when no session active) ── */}
      <AnimatePresence>
        {!sessionActive && (
          <motion.div
            key="quick-prompts"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-4 pb-2"
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {t("chat.quickPrompts")}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/55 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-all duration-200"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <Reveal>
        <div className="border-t border-white/8 bg-white/2 px-4 py-4 backdrop-blur-sm">
          {/* URL input */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 focus-within:border-[var(--accent)]/40 transition-all duration-200">
            <Globe className="h-4 w-4 shrink-0 text-white/30" />
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder={t("chat.urlPlaceholder")}
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
            />
            {urlValue && (
              <button
                onClick={() => setUrlValue("")}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Message input */}
          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 focus-within:border-[var(--accent)]/40 transition-all duration-200">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.messagePlaceholder")}
                rows={2}
                className="w-full resize-none bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none leading-relaxed"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleSend}
              disabled={isTyping || (!inputValue.trim() && !urlValue.trim())}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                isTyping || (!inputValue.trim() && !urlValue.trim())
                  ? "bg-white/8 text-white/25 cursor-not-allowed"
                  : "bg-[var(--accent)] text-black hover:brightness-110 shadow-[0_0_20px_var(--accent)/30]"
              )}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </motion.button>
          </div>

          <p className="mt-2 text-center text-[10px] text-white/20">
            {t("chat.disclaimer")}
          </p>
        </div>
      </Reveal>
    </div>
  );
}