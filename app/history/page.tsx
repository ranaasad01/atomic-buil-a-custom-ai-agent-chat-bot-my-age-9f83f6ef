"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Trash2, Download, Globe, FileCode, FileText, X, Check, Square, Eye, ExternalLink, Activity, Star, MessageSquare, User } from 'lucide-react';
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
import { useAuth } from "@/lib/supabase/auth-context";
import { getLongTermSessions, deleteSessionFromDB } from "@/lib/supabase/memory";

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
    created_at: "2025-01-15T12:10:00Z",
    updated_at: "2025-01-15T12:10:00Z",
    pass_count: 0,
    fail_count: 0,
    skip_count: 0,
    total_tests: 0,
    duration_ms: 0,
  },
  {
    id: "sess_08",
    target_url: "https://atlassian.com",
    title: "Atlassian Jira Smoke Test",
    agent_mode: "hybrid",
    test_framework: "playwright",
    output_types: ["script", "excel"],
    status: "completed",
    summary: null,
    created_at: "2025-01-10T07:15:00Z",
    updated_at: "2025-01-10T07:42:00Z",
    pass_count: 22,
    fail_count: 0,
    skip_count: 2,
    total_tests: 24,
    duration_ms: 162000,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function passRate(pass: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((pass / total) * 100);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    completed: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Completed",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    running: {
      icon: <Clock className="w-3.5 h-3.5 animate-spin" />,
      label: "Running",
      cls: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
    },
    error: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: "Error",
      cls: "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20",
    },
    pending: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: "Pending",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };
  const cfg = map[status] ?? map["pending"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        cfg.cls
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Output type pill ─────────────────────────────────────────────────────────

function OutputPill({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    script: { icon: <FileCode className="w-3 h-3" />, label: "Script" },
    excel: { icon: <FileText className="w-3 h-3" />, label: "Excel" },
    "bug-report": { icon: <AlertCircle className="w-3 h-3" />, label: "Bug Report" },
    log: { icon: <Activity className="w-3 h-3" />, label: "Logs" },
  };
  const cfg = map[type] ?? { icon: null, label: type };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--border)]/40 text-[var(--muted-foreground)] border border-[var(--border)]/60">
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Pass rate bar ────────────────────────────────────────────────────────────

function PassRateBar({ pass, total }: { pass: number; total: number }) {
  const rate = passRate(pass, total);
  const color =
    rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-[var(--destructive)]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]/60 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs text-[var(--muted-foreground)] tabular-nums w-8 text-right">
        {total === 0 ? "—" : `${rate}%`}
      </span>
    </div>
  );
}

// ─── Thread row (from localStorage) ──────────────────────────────────────────

function ThreadRow({
  thread,
  onDelete,
}: {
  thread: Thread;
  onDelete: (id: string) => void;
}) {
  const messages = getMessages(thread.id);
  const userMessages = messages.filter((m) => m.role === "user");
  const lastMsg = messages[messages.length - 1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] transition-all duration-200"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {thread.title ?? "Untitled session"}
          </p>
          <span className="flex-shrink-0 text-xs text-[var(--muted-foreground)]">
            {formatDate(thread.createdAt)}
          </span>
        </div>
        {thread.targetUrl && (
          <p className="text-xs text-[var(--accent)] truncate mt-0.5">{thread.targetUrl}</p>
        )}
        {lastMsg && (
          <p className="text-xs text-[var(--muted-foreground)] truncate mt-1 leading-relaxed">
            {lastMsg.content.slice(0, 120)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {userMessages.length} message{userMessages.length !== 1 ? "s" : ""}
          </span>
          {thread.framework && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {thread.framework}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/session/${thread.id}`}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
          title="View session"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(thread.id)}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
          title="Delete thread"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── DB Session row (from Supabase) ──────────────────────────────────────────

interface DbSession {
  id: string;
  title?: string | null;
  target_url?: string | null;
  created_at?: string;
  status?: string;
  framework?: string | null;
  message_count?: number;
}

function DbSessionRow({
  session,
  onDelete,
}: {
  session: DbSession;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--card)]/60 hover:border-[var(--accent)]/40 hover:bg-[var(--card)] transition-all duration-200"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
        <Star className="w-4 h-4 text-[var(--accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {session.title ?? "Untitled session"}
          </p>
          {session.created_at && (
            <span className="flex-shrink-0 text-xs text-[var(--muted-foreground)]">
              {formatDate(session.created_at)}
            </span>
          )}
        </div>
        {session.target_url && (
          <p className="text-xs text-[var(--accent)] truncate mt-0.5">{session.target_url}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {session.status && <StatusBadge status={session.status} />}
          {session.framework && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {session.framework}
            </span>
          )}
          <span className="text-xs text-[var(--accent)]/70 font-medium">Cloud saved</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/session/${session.id}`}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
          title="View session"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(session.id)}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
          title="Delete session"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Session card (mock data) ─────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function SessionCard({
  session,
  isSelected,
  onSelect,
  onDelete,
}: {
  session: (typeof MOCK_SESSIONS)[number];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={cn(
        "rounded-xl border transition-all duration-200",
        isSelected
          ? "border-[var(--primary)]/60 bg-[var(--card)]"
          : "border-[var(--border)] bg-[var(--card)]/60 hover:border-[var(--primary)]/30 hover:bg-[var(--card)]"
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(session.id)}
          className="flex-shrink-0 mt-0.5 w-4 h-4 rounded border border-[var(--border)] flex items-center justify-center hover:border-[var(--primary)] transition-colors"
          aria-label={isSelected ? "Deselect" : "Select"}
        >
          {isSelected && <Check className="w-3 h-3 text-[var(--primary)]" />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                {session.title ?? "Untitled session"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Globe className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
                <a
                  href={session.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline truncate"
                >
                  {session.target_url}
                </a>
              </div>
            </div>
            <StatusBadge status={session.status} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(session.created_at)} {formatTime(session.created_at)}
            </span>
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(session.duration_ms)}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              {session.agent_mode}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {session.test_framework}
            </span>
          </div>

          {/* Pass rate */}
          {session.total_tests > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {session.pass_count} passed / {session.fail_count} failed / {session.skip_count} skipped
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">{session.total_tests} total</span>
              </div>
              <PassRateBar pass={session.pass_count} total={session.total_tests} />
            </div>
          )}

          {/* Output types */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {session.output_types.map((t) => (
              <OutputPill key={t} type={t} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/session/${session.id}`}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            title="View session"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            title="Expand"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded summary */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]/60">
              <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-lg font-bold text-emerald-400">{session.pass_count}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Passed
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--destructive)]/5 border border-[var(--destructive)]/10">
                  <p className="text-lg font-bold text-[var(--destructive)]">{session.fail_count}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Failed
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-lg font-bold text-amber-400">{session.skip_count}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Skipped
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                  <p className="text-lg font-bold text-[var(--primary)]">{session.total_tests}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Total
                  </p>
                </div>
              </div>
              {session.summary && (
                <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {JSON.stringify(session.summary)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const t = useTranslations();
  const { user } = useAuth();

  // ── State ──
  const [threads, setThreads] = useState<Thread[]>([]);
  const [dbSessions, setDbSessions] = useState<DbSession[]>([]);
  const [mockSessions, setMockSessions] = useState(MOCK_SESSIONS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"sessions" | "threads" | "cloud">("sessions");
  const [mounted, setMounted] = useState(false);

  // ── Mount guard (localStorage is client-only) ──
  useEffect(() => {
    setMounted(true);
    setThreads(getThreads());
  }, []);

  // ── Load Supabase sessions when user changes ──
  useEffect(() => {
    if (!user) {
      setDbSessions([]);
      return;
    }
    getLongTermSessions(user.id)
      .then((sessions) => {
        setDbSessions(Array.isArray(sessions) ? (sessions as DbSession[]) : []);
      })
      .catch(() => {
        setDbSessions([]);
      });
  }, [user]);

  // ── Delete handlers ──
  const handleDeleteThread = useCallback(
    async (id: string) => {
      deleteThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (user) {
        try {
          await deleteSessionFromDB(id);
        } catch {
          // non-fatal
        }
      }
    },
    [user]
  );

  const handleDeleteDbSession = useCallback(
    async (id: string) => {
      setDbSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await deleteSessionFromDB(id);
      } catch {
        // non-fatal
      }
    },
    []
  );

  const handleDeleteMock = useCallback((id: string) => {
    setMockSessions((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setMockSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // ── Filtered mock sessions ──
  const filteredSessions = useMemo(() => {
    return mockSessions.filter((s) => {
      const matchSearch =
        search === "" ||
        (s.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        s.target_url.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchFramework =
        frameworkFilter === "all" || s.test_framework === frameworkFilter;
      return matchSearch && matchStatus && matchFramework;
    });
  }, [mockSessions, search, statusFilter, frameworkFilter]);

  // ── Filtered threads ──
  const filteredThreads = useMemo(() => {
    if (search === "") return threads;
    return threads.filter(
      (t) =>
        (t.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.targetUrl ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [threads, search]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = mockSessions.length;
    const completed = mockSessions.filter((s) => s.status === "completed").length;
    const errors = mockSessions.filter((s) => s.status === "error").length;
    const totalTests = mockSessions.reduce((acc, s) => acc + s.total_tests, 0);
    const totalPassed = mockSessions.reduce((acc, s) => acc + s.pass_count, 0);
    return { total, completed, errors, totalTests, totalPassed };
  }, [mockSessions]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Page header ── */}
        <Reveal>
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                Session History
              </h1>
              <p className="text-[var(--muted-foreground)] mt-1 text-sm">
                Browse past QA runs, review results, and download artifacts.
              </p>
            </div>

            {/* Signed-in badge */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)] font-medium">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{user.email}</span>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Stats row ── */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Sessions", value: stats.total, color: "text-[var(--foreground)]" },
              { label: "Completed", value: stats.completed, color: "text-emerald-400" },
              { label: "Errors", value: stats.errors, color: "text-[var(--destructive)]" },
              {
                label: "Pass Rate",
                value:
                  stats.totalTests > 0
                    ? `${Math.round((stats.totalPassed / stats.totalTests) * 100)}%`
                    : "—",
                color: "text-[var(--accent)]",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/60"
              >
                <p className={cn("text-2xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Tabs ── */}
        <Reveal delay={0.08}>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--card)]/60 border border-[var(--border)] w-fit mb-6">
            {([
              { key: "sessions", label: "Mock Sessions", count: filteredSessions.length },
              { key: "threads", label: "Chat History", count: filteredThreads.length },
              ...(user
                ? [{ key: "cloud", label: "Cloud Sessions", count: dbSessions.length }]
                : []),
            ] as { key: string; label: string; count: number }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  activeTab === tab.key
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-[var(--border)]/60 text-[var(--muted-foreground)]"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── Filters ── */}
        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--card)]/60 border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter (sessions tab only) */}
            {activeTab === "sessions" && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[var(--card)]/60 border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
                >
                  <option value="all">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="error">Error</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={frameworkFilter}
                  onChange={(e) => setFrameworkFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[var(--card)]/60 border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-colors"
                >
                  <option value="all">All frameworks</option>
                  <option value="playwright">Playwright</option>
                  <option value="cypress">Cypress</option>
                  <option value="both">Both</option>
                </select>
              </>
            )}

            {/* Bulk delete */}
            {selectedIds.size > 0 && activeTab === "sessions" && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm font-medium hover:bg-[var(--destructive)]/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedIds.size} selected
              </button>
            )}
          </div>
        </Reveal>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {/* Sessions tab */}
          {activeTab === "sessions" && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {filteredSessions.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No sessions match your filters.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isSelected={selectedIds.has(session.id)}
                      onSelect={handleSelect}
                      onDelete={handleDeleteMock}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* Threads tab */}
          {activeTab === "threads" && (
            <motion.div
              key="threads"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {!mounted ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-40 animate-spin" />
                  <p className="text-sm">Loading chat history...</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    {search ? "No threads match your search." : "No chat sessions yet. Start a conversation in the Chat tab."}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredThreads.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      onDelete={handleDeleteThread}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* Cloud sessions tab (only shown when signed in) */}
          {activeTab === "cloud" && user && (
            <motion.div
              key="cloud"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {dbSessions.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted-foreground)]">
                  <Star className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No cloud sessions found for your account.</p>
                  <p className="text-xs mt-1 opacity-60">
                    Sessions are saved to the cloud as you chat.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {dbSessions.map((session) => (
                    <DbSessionRow
                      key={session.id}
                      session={session}
                      onDelete={handleDeleteDbSession}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
