"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Trash2, Download, Globe, FileCode, FileText, X, Check, Square, Eye, ExternalLink, Activity, Star } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { type Session } from "@/lib/data";

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
  {
    id: "sess_08",
    target_url: "https://atlassian.com",
    title: "Atlassian Jira Smoke Test",
    agent_mode: "hybrid",
    test_framework: "playwright",
    output_types: ["script", "excel"],
    status: "completed",
    summary: null,
    created_at: "2025-01-10T13:00:00Z",
    updated_at: "2025-01-10T13:29:00Z",
    pass_count: 22,
    fail_count: 0,
    skip_count: 0,
    total_tests: 22,
    duration_ms: 174000,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  running: {
    label: "Running",
    icon: Activity,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
    border: "border-[var(--accent)]/20",
  },
  error: {
    label: "Error",
    icon: XCircle,
    color: "text-[var(--destructive)]",
    bg: "bg-[var(--destructive)]/10",
    border: "border-[var(--destructive)]/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

const FRAMEWORK_LABELS: Record<string, string> = {
  playwright: "Playwright",
  cypress: "Cypress",
  both: "Both",
};

const AGENT_MODE_LABELS: Record<string, string> = {
  autonomous: "Autonomous",
  hybrid: "Hybrid",
  "instruction-driven": "Instruction-driven",
};

const OUTPUT_ICONS: Record<string, React.ElementType> = {
  script: FileCode,
  excel: FileText,
  "bug-report": AlertCircle,
  log: FileText,
};

// ─── Card variants ────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

// ─── Session Card ─────────────────────────────────────────────────────────────

type MockSession = Session & {
  pass_count: number;
  fail_count: number;
  skip_count: number;
  total_tests: number;
  duration_ms: number;
};

function SessionCard({
  session,
  selected,
  onSelect,
  onDelete,
}: {
  session: MockSession;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = (session.status as SessionStatus) in STATUS_CONFIG
    ? (session.status as SessionStatus)
    : "pending";
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const passRate =
    session.total_tests > 0
      ? Math.round((session.pass_count / session.total_tests) * 100)
      : 0;

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "rounded-xl border transition-all duration-200",
        "bg-[var(--card)] border-[var(--border)]",
        selected && "ring-2 ring-[var(--primary)]/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(session.id)}
          className={cn(
            "mt-0.5 flex-shrink-0 w-5 h-5 rounded border transition-colors",
            selected
              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
              : "border-[var(--border)] hover:border-[var(--primary)]/60"
          )}
          aria-label={selected ? "Deselect session" : "Select session"}
        >
          {selected && <Check className="w-3 h-3 m-auto" />}
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--foreground)] text-sm truncate">
                {session.title ?? "Untitled Session"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-[var(--muted-foreground)] flex-shrink-0" />
                <span className="text-xs text-[var(--muted-foreground)] truncate">
                  {session.target_url}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
                cfg.bg,
                cfg.color,
                cfg.border
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Calendar className="w-3 h-3" />
              {formatDate(session.created_at)} · {formatTime(session.created_at)}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Clock className="w-3 h-3" />
              {formatDuration(session.duration_ms)}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              {FRAMEWORK_LABELS[session.test_framework] ?? session.test_framework}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-[var(--muted-foreground)] border border-[var(--border)]">
              {AGENT_MODE_LABELS[session.agent_mode] ?? session.agent_mode}
            </span>
          </div>

          {/* Test counts */}
          {session.total_tests > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-emerald-400">{session.pass_count} passed</span>
              {session.fail_count > 0 && (
                <span className="text-xs text-[var(--destructive)]">{session.fail_count} failed</span>
              )}
              {session.skip_count > 0 && (
                <span className="text-xs text-amber-400">{session.skip_count} skipped</span>
              )}
              <span className="text-xs text-[var(--muted-foreground)]">{session.total_tests} total</span>
              {/* Pass rate bar */}
              <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">{passRate}%</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/session/${session.id}`}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            aria-label="View session"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            aria-label="Download artifacts"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
            aria-label="Delete session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded: output types */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] mt-0">
              <p className="text-xs text-[var(--muted-foreground)] mt-3 mb-2 font-medium uppercase tracking-wide">
                Artifacts
              </p>
              <div className="flex flex-wrap gap-2">
                {session.output_types.map((type) => {
                  const Icon = OUTPUT_ICONS[type] ?? FileText;
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white/5 text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] transition-colors cursor-default"
                    >
                      <Icon className="w-3 h-3" />
                      {type === "script"
                        ? "Test Script"
                        : type === "excel"
                        ? "Excel Sheet"
                        : type === "bug-report"
                        ? "Bug Report"
                        : "Run Log"}
                    </span>
                  );
                })}
              </div>
              {session.summary && typeof session.summary === "object" && "notes" in session.summary && (
                <p className="mt-3 text-xs text-[var(--muted-foreground)] italic">
                  {String(session.summary.notes)}
                </p>
              )}
              {session.summary && typeof session.summary === "object" && "error" in session.summary && (
                <p className="mt-3 text-xs text-[var(--destructive)] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {String(session.summary.error)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/session/${session.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/25 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Full Session
                </Link>
              </div>
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [frameworkFilter, setFrameworkFilter] = useState<TestFramework | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        search === "" ||
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.target_url.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchFramework =
        frameworkFilter === "all" || s.test_framework === frameworkFilter;
      return matchSearch && matchStatus && matchFramework;
    });
  }, [sessions, search, statusFilter, frameworkFilter]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  }, [filtered, selectedIds.size]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const running = sessions.filter((s) => s.status === "running").length;
    const errors = sessions.filter((s) => s.status === "error").length;
    const totalTests = sessions.reduce((acc, s) => acc + s.total_tests, 0);
    const totalPassed = sessions.reduce((acc, s) => acc + s.pass_count, 0);
    return { total, completed, running, errors, totalTests, totalPassed };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Reveal>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  Session History
                </h1>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Browse, filter, and manage all your past QA agent runs.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-[0_0_16px_var(--primary-glow)]"
              >
                <Activity className="w-4 h-4" />
                New Session
              </Link>
            </div>
          </Reveal>

          {/* Stats row */}
          <Reveal delay={0.08}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Total Sessions", value: stats.total, color: "text-[var(--foreground)]" },
                { label: "Completed", value: stats.completed, color: "text-emerald-400" },
                { label: "Running", value: stats.running, color: "text-[var(--accent)]" },
                { label: "Errors", value: stats.errors, color: "text-[var(--destructive)]" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                >
                  <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <Reveal>
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions or URLs..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
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

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                showFilters
                  ? "bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter !== "all" || frameworkFilter !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-[var(--muted-foreground)]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--destructive)]/10 text-[var(--destructive)] border border-[var(--destructive)]/20 hover:bg-[var(--destructive)]/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete selected
                </button>
              </motion.div>
            )}
          </div>
        </Reveal>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                {/* Status filter */}
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "completed", "running", "error", "pending"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors capitalize",
                          statusFilter === s
                            ? "bg-[var(--primary)]/20 border-[var(--primary)]/40 text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                        )}
                      >
                        {s === "all" ? "All" : STATUS_CONFIG[s as SessionStatus]?.label ?? s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framework filter */}
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                    Framework
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "playwright", "cypress", "both"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFrameworkFilter(f)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          frameworkFilter === f
                            ? "bg-[var(--primary)]/20 border-[var(--primary)]/40 text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                        )}
                      >
                        {f === "all" ? "All" : FRAMEWORK_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {(statusFilter !== "all" || frameworkFilter !== "all") && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setFrameworkFilter("all");
                      }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select all row */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              {selectedIds.size === filtered.length && filtered.length > 0
                ? "Deselect all"
                : "Select all"}
            </button>
            <span className="text-xs text-[var(--muted-foreground)]">
              {filtered.length} session{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Session list */}
        {filtered.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                No sessions found
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                Try adjusting your search or filters, or start a new session.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/25 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Start a new session
              </Link>
            </div>
          </Reveal>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selected={selectedIds.has(session.id)}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
