"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Trash2, Download, Globe, FileCode, FileText, X, Check, Square, Eye, ExternalLink, Activity, Star, MessageSquare } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { type Session } from "@/lib/data";
import {
  getThreads,
  getMessages,
  deleteThread,
  type Thread,
  type ChatMessage,
} from "@/lib/chat-store";

type SessionStatus = "completed" | "running" | "error" | "pending";
type TestFramework = "playwright" | "cypress" | "both";
type AgentMode = "autonomous" | "hybrid" | "instruction-driven";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SESSIONS: (Session & {
  pass_count: number;
  fail_count: number;
  skip_count: number;
  total_tests: number;
  duration_ms: number;
})[] = [
  {
    id: "sess_01",
    target_url: "https://github.com",
    title: "GitHub Homepage E2E",
    agent_mode: "autonomous",
    test_framework: "playwright",
    output_types: ["script", "excel", "bug-report"],
    status: "completed",
    summary: { notes: "All critical paths verified." },
    created_at: "2025-01-15T09:22:00Z",
    updated_at: "2025-01-15T09:48:00Z",
    pass_count: 24,
    fail_count: 2,
    skip_count: 1,
    total_tests: 27,
    duration_ms: 156000,
  },
  {
    id: "sess_02",
    target_url: "https://stripe.com",
    title: "Stripe Checkout Flow",
    agent_mode: "hybrid",
    test_framework: "cypress",
    output_types: ["script", "excel"],
    status: "completed",
    summary: null,
    created_at: "2025-01-14T14:05:00Z",
    updated_at: "2025-01-14T14:31:00Z",
    pass_count: 18,
    fail_count: 0,
    skip_count: 3,
    total_tests: 21,
    duration_ms: 98000,
  },
  {
    id: "sess_03",
    target_url: "https://vercel.com",
    title: "Vercel Dashboard Tests",
    agent_mode: "instruction-driven",
    test_framework: "both",
    output_types: ["script", "log"],
    status: "error",
    summary: { error: "Timeout on auth redirect." },
    created_at: "2025-01-13T11:00:00Z",
    updated_at: "2025-01-13T11:12:00Z",
    pass_count: 5,
    fail_count: 8,
    skip_count: 0,
    total_tests: 13,
    duration_ms: 72000,
  },
  {
    id: "sess_04",
    target_url: "https://notion.so",
    title: "Notion Workspace Smoke Test",
    agent_mode: "autonomous",
    test_framework: "playwright",
    output_types: ["script", "excel", "bug-report", "log"],
    status: "running",
    summary: null,
    created_at: "2025-01-15T10:55:00Z",
    updated_at: "2025-01-15T11:02:00Z",
    pass_count: 9,
    fail_count: 1,
    skip_count: 0,
    total_tests: 10,
    duration_ms: 0,
  },
  {
    id: "sess_05",
    target_url: "https://linear.app",
    title: "Linear Issue Tracker Tests",
    agent_mode: "hybrid",
    test_framework: "playwright",
    output_types: ["script", "excel"],
    status: "completed",
    summary: null,
    created_at: "2025-01-12T08:30:00Z",
    updated_at: "2025-01-12T08:58:00Z",
    pass_count: 31,
    fail_count: 1,
    skip_count: 2,
    total_tests: 34,
    duration_ms: 168000,
  },
  {
    id: "sess_06",
    target_url: "https://figma.com",
    title: "Figma Editor Accessibility",
    agent_mode: "instruction-driven",
    test_framework: "cypress",
    output_types: ["bug-report", "log"],
    status: "completed",
    summary: null,
    created_at: "2025-01-11T16:20:00Z",
    updated_at: "2025-01-11T16:44:00Z",
    pass_count: 14,
    fail_count: 3,
    skip_count: 1,
    total_tests: 18,
    duration_ms: 144000,
  },
  {
    id: "sess_07",
    target_url: "https://shopify.com",
    title: "Shopify Storefront Regression",
    agent_mode: "autonomous",
    test_framework: "both",
    output_types: ["script", "excel", "bug-report"],
    status: "pending",
    summary: null,
    created_at: "2025-01-15T11:10:00Z",
    updated_at: "2025-01-15T11:10:00Z",
    pass_count: 0,
    fail_count: 0,
    skip_count: 0,
    total_tests: 0,
    duration_ms: 0,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  running: {
    label: "Running",
    icon: <Activity className="w-3.5 h-3.5" />,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10 border-[var(--accent)]/20",
  },
  error: {
    label: "Error",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-[var(--destructive)]",
    bg: "bg-[var(--destructive)]/10 border-[var(--destructive)]/20",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "text-[var(--muted-foreground)]",
    bg: "bg-white/5 border-white/10",
  },
};

const FRAMEWORK_COLORS: Record<string, string> = {
  playwright:
    "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  cypress: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  both: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const MODE_COLORS: Record<string, string> = {
  autonomous: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
  hybrid: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "instruction-driven": "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

// ─── Real Thread Card ─────────────────────────────────────────────────────────

interface RealThreadCardProps {
  thread: Thread;
  messageCount: number;
  onDelete: (id: string) => void;
}

function RealThreadCard({ thread, messageCount, onDelete }: RealThreadCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteThread(thread.id);
    onDelete(thread.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--primary)]/40 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug truncate">
            {thread.title ?? "Untitled Thread"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Globe className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" />
            <span className="text-xs text-[var(--muted-foreground)] truncate font-mono">
              {thread.targetUrl || "No URL set"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/home-chat-interface"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </Link>
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              confirmDelete
                ? "bg-[var(--destructive)]/20 text-[var(--destructive)] border-[var(--destructive)]/30 hover:bg-[var(--destructive)]/30"
                : "bg-white/5 text-[var(--muted-foreground)] border-white/10 hover:text-[var(--destructive)] hover:border-[var(--destructive)]/30"
            )}
            title={confirmDelete ? "Click again to confirm" : "Delete thread"}
          >
            <Trash2 className="w-3 h-3" />
            {confirmDelete ? "Confirm" : "Delete"}
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {thread.agentMode && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              MODE_COLORS[thread.agentMode] ?? "bg-white/5 text-[var(--muted-foreground)] border-white/10"
            )}
          >
            {thread.agentMode}
          </span>
        )}
        {thread.framework && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              FRAMEWORK_COLORS[thread.framework] ?? "bg-white/5 text-[var(--muted-foreground)] border-white/10"
            )}
          >
            {thread.framework}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white/5 text-[var(--muted-foreground)] border-white/10">
          <MessageSquare className="w-2.5 h-2.5" />
          {messageCount} {messageCount === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Footer timestamps */}
      <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Created {formatDate(thread.createdAt)}
        </span>
        <span className="text-[var(--border)]">·</span>
        <span>Updated {formatDate(thread.updatedAt)}</span>
      </div>
    </motion.div>
  );
}

// ─── Mock Session Card ────────────────────────────────────────────────────────

type MockSession = (typeof MOCK_SESSIONS)[number];

interface MockSessionCardProps {
  session: MockSession;
  isExpanded: boolean;
  onToggle: () => void;
}

function MockSessionCard({ session, isExpanded, onToggle }: MockSessionCardProps) {
  const status = session.status as SessionStatus;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const passRate =
    session.total_tests > 0
      ? Math.round((session.pass_count / session.total_tests) * 100)
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--primary)]/30 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]"
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        {/* Status indicator */}
        <div
          className={cn(
            "mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg border shrink-0",
            cfg.bg,
            cfg.color
          )}
        >
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + URL */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug truncate">
                {session.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" />
                <span className="text-xs text-[var(--muted-foreground)] truncate font-mono">
                  {session.target_url}
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--muted-foreground)] shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                cfg.bg,
                cfg.color
              )}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                FRAMEWORK_COLORS[session.test_framework] ??
                  "bg-white/5 text-[var(--muted-foreground)] border-white/10"
              )}
            >
              {session.test_framework}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                MODE_COLORS[session.agent_mode] ??
                  "bg-white/5 text-[var(--muted-foreground)] border-white/10"
              )}
            >
              {session.agent_mode}
            </span>
            {session.total_tests > 0 && (
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {session.pass_count}/{session.total_tests} passed
              </span>
            )}
            <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">
              {formatDate(session.created_at)} · {formatTime(session.created_at)}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 space-y-4">
              {/* Pass rate bar */}
              {session.total_tests > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--muted-foreground)]">Pass rate</span>
                    <span className="text-xs font-semibold text-[var(--foreground)]">{passRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {session.pass_count} passed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--destructive)] inline-block" />
                      {session.fail_count} failed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      {session.skip_count} skipped
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.duration_ms)}
                    </span>
                  </div>
                </div>
              )}

              {/* Output types */}
              <div className="flex flex-wrap gap-1.5">
                {session.output_types.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[var(--muted-foreground)] border border-white/10"
                  >
                    {type === "script" && <FileCode className="w-2.5 h-2.5" />}
                    {type === "excel" && <FileText className="w-2.5 h-2.5" />}
                    {type === "bug-report" && <AlertCircle className="w-2.5 h-2.5" />}
                    {type === "log" && <Activity className="w-2.5 h-2.5" />}
                    {type}
                  </span>
                ))}
              </div>

              {/* Summary note */}
              {session.summary && "notes" in session.summary && session.summary.notes && (
                <p className="text-xs text-[var(--muted-foreground)] italic">
                  {session.summary.notes as string}
                </p>
              )}
              {session.summary && "error" in session.summary && session.summary.error && (
                <p className="text-xs text-[var(--destructive)]">
                  ⚠ {session.summary.error as string}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/session/${session.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Session
                </Link>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-[var(--muted-foreground)] border border-white/10 hover:text-[var(--foreground)] transition-colors">
                  <Download className="w-3 h-3" />
                  Download All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: SessionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "running", label: "Running" },
  { value: "error", label: "Error" },
  { value: "pending", label: "Pending" },
];

export default function HistoryPage() {
  const t = useTranslations();

  // Real threads from localStorage
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadMessageCounts, setThreadMessageCounts] = useState<Record<string, number>>({});

  // Mock session state
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<"threads" | "sessions">("threads");

  // Load real threads
  useEffect(() => {
    const stored = getThreads();
    setThreads(stored);
    const counts: Record<string, number> = {};
    stored.forEach((t) => {
      counts[t.id] = getMessages(t.id).length;
    });
    setThreadMessageCounts(counts);
  }, []);

  const handleDeleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filter mock sessions
  const filteredSessions = useMemo(() => {
    return MOCK_SESSIONS.filter((s) => {
      const matchesSearch =
        search.trim() === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.target_url.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  // Filter real threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (search.trim() === "") return true;
      const title = t.title ?? "";
      return (
        title.toLowerCase().includes(search.toLowerCase()) ||
        (t.targetUrl ?? "").toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [threads, search]);

  // Summary stats
  const stats = useMemo(() => ({
    totalSessions: MOCK_SESSIONS.length,
    completedSessions: MOCK_SESSIONS.filter((s) => s.status === "completed").length,
    totalThreads: threads.length,
    totalTests: MOCK_SESSIONS.reduce((acc, s) => acc + s.total_tests, 0),
  }), [threads.length]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page header ── */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  History
                </p>
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Test History
                </h1>
                <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-lg">
                  Browse your chat threads and past test sessions. Review artifacts, results, and session details.
                </p>
              </div>
              <Link
                href="/home-chat-interface"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary)]/90 transition-colors shrink-0"
              >
                <Globe className="w-4 h-4" />
                New Session
              </Link>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Chat Threads", value: stats.totalThreads, icon: MessageSquare },
                { label: "Test Sessions", value: stats.totalSessions, icon: Activity },
                { label: "Completed", value: stats.completedSessions, icon: CheckCircle },
                { label: "Total Tests", value: stats.totalTests, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center"
                >
                  <Icon className="w-4 h-4 text-[var(--accent)] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] w-fit mb-6">
          {(["threads", "sessions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {tab === "threads" ? "Chat Threads" : "Mock Sessions"}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder={activeTab === "threads" ? "Search threads..." : "Search sessions..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 transition-all"
            />
          </div>

          {activeTab === "sessions" && (
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    statusFilter === f.value
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "threads" ? (
            <motion.div
              key="threads"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {filteredThreads.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No chat threads yet</p>
                  <p className="text-sm mt-1">Start a new session to see your threads here.</p>
                  <Link
                    href="/home-chat-interface"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary)]/90 transition-colors"
                  >
                    Start chatting
                  </Link>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <RealThreadCard
                    key={thread.id}
                    thread={thread}
                    messageCount={threadMessageCounts[thread.id] ?? 0}
                    onDelete={handleDeleteThread}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {filteredSessions.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No sessions match your filters</p>
                  <p className="text-sm mt-1">Try adjusting your search or status filter.</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <MockSessionCard
                    key={session.id}
                    session={session}
                    isExpanded={expandedSession === session.id}
                    onToggle={() =>
                      setExpandedSession((prev) =>
                        prev === session.id ? null : session.id
                      )
                    }
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
