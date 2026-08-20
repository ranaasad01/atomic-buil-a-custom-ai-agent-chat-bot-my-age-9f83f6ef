"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, Filter, Clock, CheckCircle, XCircle, Loader, Globe, FileText, FileCode, Download, ChevronRight, Calendar, Activity, AlertCircle, BarChart2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import type from "@/lib/data";
type SessionStatus = any;
const SessionStatus: any = [];
type AgentMode = any;
const AgentMode: any = [];
type TestFramework = any;
const TestFramework: any = [];

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

const STATUS_FILTERS = ["all", "completed", "running", "error", "pending"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(s: number): string {
  if (s === 0) return "--";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function passRate(session: MockSession): number {
  if (session.total_tests === 0) return 0;
  return Math.round((session.passed / session.total_tests) * 100);
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; icon: React.ElementType; color: string; bg: string; dot: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  running: {
    label: "Running",
    icon: Loader,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
    dot: "bg-[var(--accent)]",
  },
  error: {
    label: "Error",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    dot: "bg-rose-400",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
};

const FRAMEWORK_LABELS: Record<TestFramework, string> = {
  playwright: "Playwright",
  cypress: "Cypress",
  both: "PW + Cypress",
};

const MODE_LABELS: Record<AgentMode, string> = {
  autonomous: "Autonomous",
  hybrid: "Hybrid",
  "instruction-driven": "Guided",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3",
        accent
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
          : "border-white/8 bg-white/4"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{label}</span>
        <Icon
          className={cn("h-4 w-4", accent ? "text-[var(--accent)]" : "text-white/30")}
          aria-hidden="true"
        />
      </div>
      <div className={cn("text-3xl font-bold tracking-tight", accent ? "text-[var(--accent)]" : "text-white")}>
        {value}
      </div>
      {sub && <div className="text-xs text-white/40">{sub}</div>}
    </div>
  );
}

function ArtifactBadge({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; label: string }> = {
    script: { icon: FileCode, label: "Script" },
    excel: { icon: FileText, label: "Excel" },
    "bug-report": { icon: AlertCircle, label: "Bugs" },
    log: { icon: Activity, label: "Log" },
  };
  const cfg = map[type] ?? { icon: Download, label: type };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

function PassBar({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? "bg-emerald-400" : rate >= 70 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <span className="text-xs font-medium text-white/60 w-8 text-right">{rate}%</span>
    </div>
  );
}

function SessionCard({ session }: { session: MockSession }) {
  const cfg = STATUS_CONFIG[session.status];
  const StatusIcon = cfg.icon;
  const rate = passRate(session);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link href={`/session/${session.id}`} className="block group">
        <div className="rounded-2xl border border-white/8 bg-white/4 hover:border-[var(--accent)]/30 hover:bg-white/6 transition-all duration-300 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(0,0,0,0.4)]">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    cfg.bg,
                    cfg.color
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                  {cfg.label}
                </span>
                <span className="text-xs text-white/30 font-mono">{FRAMEWORK_LABELS[session.test_framework]}</span>
                <span className="text-xs text-white/30">{MODE_LABELS[session.agent_mode]}</span>
              </div>
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors duration-200">
                {session.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Globe className="h-3 w-3 text-white/30 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-white/40 truncate font-mono">{session.target_url}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[var(--accent)] transition-colors duration-200 flex-shrink-0 mt-1" aria-hidden="true" />
          </div>

          {/* Stats row */}
          {session.total_tests > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/40">{session.total_tests} tests</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-medium">{session.passed} pass</span>
                  {session.failed > 0 && (
                    <span className="text-rose-400 font-medium">{session.failed} fail</span>
                  )}
                  {session.skipped > 0 && (
                    <span className="text-white/30">{session.skipped} skip</span>
                  )}
                </div>
              </div>
              <PassBar rate={rate} />
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {session.output_types.map((t) => (
                <ArtifactBadge key={t} type={t} />
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-white/30 flex-shrink-0">
              {session.duration_s > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatDuration(session.duration_s)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {formatDate(session.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HistoryPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");

  const frameworks = ["all", "playwright", "cypress", "both"] as const;

  const filtered = useMemo(() => {
    return MOCK_SESSIONS.filter((s) => {
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchFramework = frameworkFilter === "all" || s.test_framework === frameworkFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.target_url.toLowerCase().includes(q);
      return matchStatus && matchFramework && matchSearch;
    });
  }, [search, statusFilter, frameworkFilter]);

  const totalSessions = MOCK_SESSIONS.length;
  const completedSessions = MOCK_SESSIONS.filter((s) => s.status === "completed").length;
  const totalTests = MOCK_SESSIONS.reduce((acc, s) => acc + s.total_tests, 0);
  const totalPassed = MOCK_SESSIONS.reduce((acc, s) => acc + s.passed, 0);
  const overallRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Page header */}
        <Reveal>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">
                <Activity className="h-3 w-3" aria-hidden="true" />
                {t("history.badge")}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("history.heading")}
            </h1>
            <p className="mt-2 text-base text-white/50 max-w-xl">
              {t("history.subheading")}
            </p>
          </div>
        </Reveal>

        {/* Summary stats */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-10">
            <StatCard
              label={t("history.stats.sessions")}
              value={totalSessions}
              sub={`${completedSessions} completed`}
              icon={BarChart2}
              accent
            />
            <StatCard
              label={t("history.stats.totalTests")}
              value={totalTests.toLocaleString("en-US")}
              sub="across all sessions"
              icon={FileText}
            />
            <StatCard
              label={t("history.stats.passed")}
              value={totalPassed.toLocaleString("en-US")}
              sub={`${MOCK_SESSIONS.reduce((a, s) => a + s.failed, 0)} failed`}
              icon={CheckCircle}
            />
            <StatCard
              label={t("history.stats.passRate")}
              value={`${overallRate}%`}
              sub="overall success"
              icon={Activity}
              accent
            />
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={0.1}>
          <div className="mb-6 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("history.search.placeholder")}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition-all duration-200"
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <Filter className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
                <span className="text-xs text-white/30 font-medium">{t("history.filter.status")}</span>
              </div>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 capitalize",
                    statusFilter === f
                      ? "bg-[var(--accent)] text-black"
                      : "border border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                  )}
                >
                  {f === "all" ? t("history.filter.all") : f}
                </button>
              ))}

              <div className="w-px bg-white/10 mx-1" />

              <div className="flex items-center gap-1.5 mr-1">
                <span className="text-xs text-white/30 font-medium">{t("history.filter.framework")}</span>
              </div>
              {frameworks.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrameworkFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                    frameworkFilter === f
                      ? "bg-[var(--accent)] text-black"
                      : "border border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                  )}
                >
                  {f === "all" ? t("history.filter.all") : FRAMEWORK_LABELS[f as TestFramework]}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Results count */}
        <Reveal delay={0.12}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-white/40">
              {t("history.results.showing")}{" "}
              <span className="text-white/70 font-medium">{filtered.length}</span>{" "}
              {t("history.results.of")}{" "}
              <span className="text-white/70 font-medium">{MOCK_SESSIONS.length}</span>{" "}
              {t("history.results.sessions")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all duration-200"
            >
              {t("history.newSession")}
            </Link>
          </div>
        </Reveal>

        {/* Session list */}
        {filtered.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((session, i) => (
              <motion.div key={session.id} variants={fadeInUp}>
                <SessionCard session={session} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Reveal>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/4 py-20 text-center">
              <Search className="h-10 w-10 text-white/20 mb-4" aria-hidden="true" />
              <p className="text-base font-semibold text-white/50">{t("history.empty.title")}</p>
              <p className="mt-1 text-sm text-white/30">{t("history.empty.desc")}</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setFrameworkFilter("all");
                }}
                className="mt-5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-200"
              >
                {t("history.empty.reset")}
              </button>
            </div>
          </Reveal>
        )}

        {/* Bottom CTA */}
        <Reveal delay={0.08}>
          <div className="mt-12 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-white">{t("history.cta.title")}</h2>
              <p className="mt-1 text-sm text-white/50">{t("history.cta.desc")}</p>
            </div>
            <Link
              href="/"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-all duration-200 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
            >
              {t("history.cta.button")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

      </div>
    </main>
  );
}