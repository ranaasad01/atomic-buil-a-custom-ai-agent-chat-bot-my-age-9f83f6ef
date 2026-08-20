"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, Filter, Clock, CheckCircle, XCircle, Loader, Globe, FileText, FileCode, Download, ChevronRight, Calendar, Activity, AlertCircle, BarChart2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeInUp } from "@/lib/motion";

type SessionStatus = "completed" | "running" | "error" | "pending";
type AgentMode = "autonomous" | "hybrid" | "instruction-driven";
type TestFramework = "playwright" | "cypress" | "both";

interface MockSession {
  id: string;
  target_url: string;
  title: string;
  agent_mode: AgentMode;
  test_framework: TestFramework;
  output_types: string[];
  status: SessionStatus;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_s: number;
  created_at: string;
}

const MOCK_SESSIONS: MockSession[] = [
  {
    id: "sess_01",
    target_url: "https://shop.example.com",
    title: "E-Commerce Checkout Flow",
    agent_mode: "autonomous",
    test_framework: "playwright",
    output_types: ["script", "excel", "bug-report"],
    status: "completed",
    total_tests: 42,
    passed: 38,
    failed: 3,
    skipped: 1,
    duration_s: 187,
    created_at: "2025-01-15T10:22:00Z",
  },
  {
    id: "sess_02",
    target_url: "https://dashboard.saas.io",
    title: "SaaS Dashboard Regression",
    agent_mode: "hybrid",
    test_framework: "cypress",
    output_types: ["script", "excel"],
    status: "completed",
    total_tests: 61,
    passed: 61,
    failed: 0,
    skipped: 0,
    duration_s: 312,
    created_at: "2025-01-14T15:05:00Z",
  },
  {
    id: "sess_03",
    target_url: "https://portal.fintech.app",
    title: "Fintech Login & Auth",
    agent_mode: "instruction-driven",
    test_framework: "playwright",
    output_types: ["script", "bug-report", "log"],
    status: "error",
    total_tests: 18,
    passed: 11,
    failed: 7,
    skipped: 0,
    duration_s: 94,
    created_at: "2025-01-13T09:48:00Z",
  },
  {
    id: "sess_04",
    target_url: "https://blog.media.co",
    title: "Media Blog Navigation",
    agent_mode: "autonomous",
    test_framework: "both",
    output_types: ["script", "excel"],
    status: "running",
    total_tests: 24,
    passed: 14,
    failed: 0,
    skipped: 0,
    duration_s: 0,
    created_at: "2025-01-15T11:55:00Z",
  },
  {
    id: "sess_05",
    target_url: "https://app.crm.tools",
    title: "CRM Contact Management",
    agent_mode: "hybrid",
    test_framework: "playwright",
    output_types: ["script", "excel", "bug-report"],
    status: "completed",
    total_tests: 55,
    passed: 49,
    failed: 5,
    skipped: 1,
    duration_s: 241,
    created_at: "2025-01-12T14:30:00Z",
  },
  {
    id: "sess_06",
    target_url: "https://store.retail.com",
    title: "Retail Product Search",
    agent_mode: "autonomous",
    test_framework: "cypress",
    output_types: ["script", "excel"],
    status: "completed",
    total_tests: 33,
    passed: 30,
    failed: 2,
    skipped: 1,
    duration_s: 158,
    created_at: "2025-01-11T08:15:00Z",
  },
  {
    id: "sess_07",
    target_url: "https://admin.platform.dev",
    title: "Admin Panel Smoke Test",
    agent_mode: "instruction-driven",
    test_framework: "playwright",
    output_types: ["script", "log"],
    status: "pending",
    total_tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration_s: 0,
    created_at: "2025-01-15T12:10:00Z",
  },
  {
    id: "sess_08",
    target_url: "https://booking.travel.io",
    title: "Travel Booking Workflow",
    agent_mode: "autonomous",
    test_framework: "both",
    output_types: ["script", "excel", "bug-report", "log"],
    status: "completed",
    total_tests: 78,
    passed: 71,
    failed: 4,
    skipped: 3,
    duration_s: 429,
    created_at: "2025-01-10T16:45:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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
    icon: Loader,
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

const OUTPUT_ICONS: Record<string, React.ElementType> = {
  script: FileCode,
  excel: FileText,
  "bug-report": AlertCircle,
  log: Activity,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        cfg.color,
        cfg.bg,
        cfg.border
      )}
    >
      <Icon
        className={cn("w-3 h-3", status === "running" && "animate-spin")}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}

function PassRateBar({
  passed,
  failed,
  skipped,
  total,
}: {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}) {
  if (total === 0) return <span className="text-xs text-[var(--muted-foreground)]">No tests yet</span>;
  const passW = (passed / total) * 100;
  const failW = (failed / total) * 100;
  const skipW = (skipped / total) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5 w-full">
        <div className="bg-emerald-400 h-full" style={{ width: `${passW}%` }} />
        <div className="bg-[var(--destructive)] h-full" style={{ width: `${failW}%` }} />
        <div className="bg-amber-400 h-full" style={{ width: `${skipW}%` }} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          {passed} passed
        </span>
        {failed > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--destructive)] inline-block" />
            {failed} failed
          </span>
        )}
        {skipped > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {skipped} skipped
          </span>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: MockSession }) {
  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={`/session/${session.id}`}
        className="group block rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_8px_32px_-8px_rgba(99,102,241,0.15)] transition-all duration-300"
      >
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug truncate group-hover:text-[var(--primary)] transition-colors">
                {session.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Globe className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
                <span className="text-xs text-[var(--muted-foreground)] truncate">
                  {session.target_url}
                </span>
              </div>
            </div>
            <StatusBadge status={session.status} />
          </div>

          {/* Pass rate bar */}
          <div className="mb-4">
            <PassRateBar
              passed={session.passed}
              failed={session.failed}
              skipped={session.skipped}
              total={session.total_tests}
            />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {formatDate(session.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatTime(session.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" aria-hidden="true" />
              {formatDuration(session.duration_s)}
            </span>
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" aria-hidden="true" />
              {session.total_tests} tests
            </span>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
            {/* Framework + mode tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                {session.test_framework}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[var(--muted-foreground)] border border-[var(--border)]">
                {session.agent_mode}
              </span>
            </div>

            {/* Output type icons */}
            <div className="flex items-center gap-1.5">
              {session.output_types.map((type) => {
                const Icon = OUTPUT_ICONS[type] ?? FileText;
                return (
                  <span
                    key={type}
                    title={type}
                    className="p-1 rounded bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Icon className="w-3 h-3" aria-hidden="true" />
                  </span>
                );
              })}
              <ChevronRight
                className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all ml-1"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </Link>
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

export default function HistoryPastSessionsPage() {
  const t = useTranslations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [frameworkFilter, setFrameworkFilter] = useState<TestFramework | "all">("all");

  const filtered = useMemo(() => {
    return MOCK_SESSIONS.filter((s) => {
      const matchesSearch =
        search.trim() === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.target_url.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesFramework =
        frameworkFilter === "all" || s.test_framework === frameworkFilter;
      return matchesSearch && matchesStatus && matchesFramework;
    });
  }, [search, statusFilter, frameworkFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const total = MOCK_SESSIONS.length;
    const completed = MOCK_SESSIONS.filter((s) => s.status === "completed").length;
    const totalTests = MOCK_SESSIONS.reduce((acc, s) => acc + s.total_tests, 0);
    const totalPassed = MOCK_SESSIONS.reduce((acc, s) => acc + s.passed, 0);
    return { total, completed, totalTests, totalPassed };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page header ── */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  Session Archive
                </p>
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Past Sessions
                </h1>
                <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-lg">
                  Browse every test run the agent has completed. Filter by status or framework, then open any session to review artifacts and results.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary)]/90 transition-colors shrink-0"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                New Session
              </Link>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Total Sessions", value: stats.total, icon: Activity },
                { label: "Completed", value: stats.completed, icon: CheckCircle },
                { label: "Tests Run", value: stats.totalTests, icon: BarChart2 },
                { label: "Tests Passed", value: stats.totalPassed, icon: Download },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                    <Icon className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--foreground)] leading-none">{value}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search by title or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/60 focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SessionStatus | "all")}
                className="pl-9 pr-8 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors appearance-none cursor-pointer"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Framework filter */}
            <div className="relative">
              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value as TestFramework | "all")}
                className="px-4 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 focus:ring-1 focus:ring-[var(--primary)]/30 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Frameworks</option>
                <option value="playwright">Playwright</option>
                <option value="cypress">Cypress</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </Reveal>

        {/* Results count */}
        <Reveal delay={0.05}>
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Showing <span className="text-[var(--foreground)] font-medium">{filtered.length}</span> of{" "}
            <span className="text-[var(--foreground)] font-medium">{MOCK_SESSIONS.length}</span> sessions
          </p>
        </Reveal>

        {/* ── Session grid ── */}
        {filtered.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filtered.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </motion.div>
        ) : (
          <Reveal delay={0.1}>
            <div className="mt-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-full bg-[var(--card)] border border-[var(--border)]">
                <Search className="w-8 h-8 text-[var(--muted-foreground)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[var(--foreground)] font-semibold">No sessions found</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setFrameworkFilter("all");
                }}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
