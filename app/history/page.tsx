"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Trash2, Download, Globe, FileCode, FileText, X, Check, Square, Eye, ExternalLink, Activity, Star } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import type, { Session } from "@/lib/data";
type SessionStatus = any;
const SessionStatus: any = [];
type TestFramework = any;
const TestFramework: any = [];
type AgentMode = any;
const AgentMode: any = [];

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
    target_url: "https://atlassian.com/jira",
    title: "Jira Project Management Flow",
    agent_mode: "hybrid",
    test_framework: "playwright",
    output_types: ["script", "excel"],
    status: "completed",
    summary: null,
    created_at: "2025-01-10T13:45:00Z",
    updated_at: "2025-01-10T14:22:00Z",
    pass_count: 22,
    fail_count: 4,
    skip_count: 2,
    total_tests: 28,
    duration_ms: 222000,
  },
];

const DATE_FILTERS = ["All time", "Today", "Last 7 days", "Last 30 days"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

const STATUS_OPTIONS: { value: SessionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "running", label: "Running" },
  { value: "error", label: "Error" },
  { value: "pending", label: "Pending" },
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const statusConfig: Record<
  SessionStatus,
  { label: string; color: string; glow: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  running: {
    label: "Running",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    glow: "shadow-[0_0_12px_rgba(96,165,250,0.25)]",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  error: {
    label: "Error",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
    glow: "shadow-[0_0_12px_rgba(248,113,113,0.25)]",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.2)]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

const frameworkConfig: Record<TestFramework, { label: string; color: string }> = {
  playwright: { label: "Playwright", color: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  cypress: { label: "Cypress", color: "text-teal-400 bg-teal-400/10 border-teal-400/30" },
  both: { label: "PW + Cypress", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
};

const agentModeLabel: Record<AgentMode, string> = {
  autonomous: "Autonomous",
  hybrid: "Hybrid",
  "instruction-driven": "Instructed",
};

const artifactIcons: Record<string, React.ReactNode> = {
  script: <FileCode className="h-3.5 w-3.5" />,
  excel: <FileText className="h-3.5 w-3.5" />,
  "bug-report": <AlertCircle className="h-3.5 w-3.5" />,
  log: <Activity className="h-3.5 w-3.5" />,
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

interface SessionCardProps {
  session: (typeof MOCK_SESSIONS)[number];
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  selectMode: boolean;
}

function SessionCard({ session, selected, onSelect, onOpen, selectMode }: SessionCardProps) {
  const cfg = statusConfig[session.status];
  const fw = frameworkConfig[session.test_framework];
  const passRate =
    session.total_tests > 0
      ? Math.round((session.pass_count / session.total_tests) * 100)
      : null;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => (selectMode ? onSelect(session.id) : onOpen(session.id))}
      className={cn(
        "group relative cursor-pointer rounded-2xl border bg-[hsl(var(--card))] p-5 transition-all duration-300",
        "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.16)]",
        "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_32px_-8px_rgba(0,0,0,0.24)]",
        selected
          ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/40"
          : "border-[hsl(var(--border))] hover:border-[var(--accent)]/40",
      )}
    >
      {/* Select checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(session.id);
        }}
        aria-label={selected ? "Deselect session" : "Select session"}
        className={cn(
          "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200",
          selected
            ? "border-[var(--accent)] bg-[var(--accent)] text-black"
            : "border-[hsl(var(--border))] bg-transparent opacity-0 group-hover:opacity-100",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <Globe className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
            {session.title ?? getHostname(session.target_url)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
            {getHostname(session.target_url)}
          </p>
        </div>
      </div>

      {/* Status + Framework badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            cfg.color,
            cfg.glow,
          )}
        >
          {cfg.icon}
          {cfg.label}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            fw.color,
          )}
        >
          {fw.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          {agentModeLabel[session.agent_mode]}
        </span>
      </div>

      {/* Pass/Fail bar */}
      {session.total_tests > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              {session.pass_count} pass / {session.fail_count} fail
            </span>
            {passRate !== null && (
              <span
                className={cn(
                  "font-semibold",
                  passRate >= 90
                    ? "text-emerald-400"
                    : passRate >= 70
                    ? "text-amber-400"
                    : "text-red-400",
                )}
              >
                {passRate}%
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/40">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${passRate ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Artifacts */}
      {session.output_types.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {session.output_types.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--muted))]/30 px-1.5 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
            >
              {artifactIcons[type] ?? null}
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--border))]/50 pt-3">
        <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Calendar className="h-3 w-3" />
          {formatDate(session.created_at)}
        </span>
        <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Clock className="h-3 w-3" />
          {formatDuration(session.duration_ms)}
        </span>
      </div>

      {/* View detail link */}
      <Link
        href={`/session/${session.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 hidden items-center gap-1 rounded-lg bg-[var(--accent)]/10 px-2 py-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-all duration-200 group-hover:flex group-hover:opacity-100 hover:bg-[var(--accent)]/20"
        aria-label="View session detail"
      >
        <Eye className="h-3 w-3" />
        View
      </Link>
    </motion.div>
  );
}

// ─── Session Preview Drawer ───────────────────────────────────────────────────

const drawerVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function SessionDrawer({
  session,
  onClose,
}: {
  session: (typeof MOCK_SESSIONS)[number] | null;
  onClose: () => void;
}) {
  if (!session) return null;
  const cfg = statusConfig[session.status];
  const fw = frameworkConfig[session.test_framework];

  return (
    <AnimatePresence>
      {session && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                  Session Preview
                </h2>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {session.id}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close preview"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]/40 hover:text-[hsl(var(--foreground))]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* URL */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Target URL
                </p>
                <a
                  href={session.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  {session.target_url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Status + Framework */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1.5 text-xs text-[hsl(var(--muted-foreground))]">Status</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      cfg.color,
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                  <p className="mb-1.5 text-xs text-[hsl(var(--muted-foreground))]">Framework</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      fw.color,
                    )}
                  >
                    {fw.label}
                  </span>
                </div>
              </div>

              {/* Stats */}
              {session.total_tests > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Test Results
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Passed", value: session.pass_count, color: "text-emerald-400" },
                      { label: "Failed", value: session.fail_count, color: "text-red-400" },
                      { label: "Skipped", value: session.skip_count, color: "text-amber-400" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center"
                      >
                        <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Details
                </p>
                {[
                  { label: "Agent Mode", value: agentModeLabel[session.agent_mode] },
                  { label: "Duration", value: formatDuration(session.duration_ms) },
                  { label: "Created", value: formatDate(session.created_at) },
                  { label: "Updated", value: formatDate(session.updated_at) },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 px-3 py-2"
                  >
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{row.label}</span>
                    <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Artifacts */}
              {session.output_types.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Artifacts
                  </p>
                  <div className="space-y-1.5">
                    {session.output_types.map((type) => (
                      <div
                        key={type}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 px-3 py-2"
                      >
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {artifactIcons[type] ?? null}
                        </span>
                        <span className="flex-1 text-xs font-medium capitalize text-[hsl(var(--foreground))]">
                          {type.replace("-", " ")}
                        </span>
                        <button
                          aria-label={`Download ${type}`}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary note */}
              {session.summary && typeof session.summary === "object" && (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-4">
                  <p className="mb-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Summary
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    {Object.values(session.summary).join(" ")}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-[hsl(var(--border))] px-6 py-4">
              <Link
                href={`/session/${session.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90"
              >
                <Eye className="h-4 w-4" />
                View Full Session
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {hasFilters ? (
          <Search className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
        ) : (
          <Activity className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
        )}
      </div>
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
        {hasFilters ? "No sessions match your filters" : "No test sessions yet"}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-[hsl(var(--muted-foreground))]">
        {hasFilters
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Start a new chat session to run your first end-to-end test against a live website."}
      </p>
      {!hasFilters && (
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90"
        >
          Start Testing
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ─── Bulk Actions Bar ─────────────────────────────────────────────────────────

const bulkBarVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function BulkActionsBar({
  count,
  onClear,
  onDelete,
  onExport,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <motion.div
      variants={bulkBarVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-black">
          {count}
        </span>
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
          session{count !== 1 ? "s" : ""} selected
        </span>
        <div className="mx-1 h-4 w-px bg-[hsl(var(--border))]" />
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]/40"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]/40 hover:text-[hsl(var(--foreground))]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const t = useTranslations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All time");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const openSession = useMemo(
    () => MOCK_SESSIONS.find((s) => s.id === openSessionId) ?? null,
    [openSessionId],
  );

  const filtered = useMemo(() => {
    return MOCK_SESSIONS.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.target_url.toLowerCase().includes(q) ||
        (s.title ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesDate =
        dateFilter === "All time" ||
        (dateFilter === "Today" && isToday(s.created_at)) ||
        (dateFilter === "Last 7 days" && isWithinDays(s.created_at, 7)) ||
        (dateFilter === "Last 30 days" && isWithinDays(s.created_at, 30));
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [search, statusFilter, dateFilter]);

  const hasFilters = search !== "" || statusFilter !== "all" || dateFilter !== "All time";

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleDelete = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleExport = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectMode = selectedIds.size > 0;

  // Summary stats
  const stats = useMemo(() => {
    const total = MOCK_SESSIONS.length;
    const completed = MOCK_SESSIONS.filter((s) => s.status === "completed").length;
    const errors = MOCK_SESSIONS.filter((s) => s.status === "error").length;
    const totalTests = MOCK_SESSIONS.reduce((acc, s) => acc + s.total_tests, 0);
    return { total, completed, errors, totalTests };
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <Reveal>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                <Activity className="h-3 w-3" />
                {t("history.badge")}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              {t("history.heading")}
            </h1>
            <p className="mt-2 text-base text-[hsl(var(--muted-foreground))]">
              {t("history.subheading")}
            </p>
          </div>
        </Reveal>

        {/* Summary stats */}
        <Reveal delay={0.05}>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("history.stats.total"), value: stats.total, icon: <Square className="h-4 w-4" />, color: "text-[hsl(var(--foreground))]" },
              { label: t("history.stats.completed"), value: stats.completed, icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-400" },
              { label: t("history.stats.errors"), value: stats.errors, icon: <XCircle className="h-4 w-4" />, color: "text-red-400" },
              { label: t("history.stats.tests"), value: stats.totalTests, icon: <Star className="h-4 w-4" />, color: "text-[var(--accent)]" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                <div className={cn("mb-1 flex items-center gap-1.5", stat.color)}>
                  {stat.icon}
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    {stat.label}
                  </span>
                </div>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Filter bar */}
        <Reveal delay={0.08}>
          <div className="sticky top-16 z-20 mb-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 p-3 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("history.filter.searchPlaceholder")}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] transition-colors hover:border-[var(--accent)]/40"
                >
                  <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                  <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                </button>
                <AnimatePresence>
                  {statusDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.3)]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setStatusFilter(opt.value);
                            setStatusDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[hsl(var(--muted))]/40",
                            statusFilter === opt.value
                              ? "text-[var(--accent)]"
                              : "text-[hsl(var(--foreground))]",
                          )}
                        >
                          {statusFilter === opt.value && <Check className="h-3.5 w-3.5" />}
                          <span className={statusFilter === opt.value ? "" : "ml-5"}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Date pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(Array.isArray(t.raw("history.datePills")) ? t.raw("history.datePills") : []).length === 0
                  ? DATE_FILTERS.map((df) => (
                      <button
                        key={df}
                        onClick={() => setDateFilter(df)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          dateFilter === df
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[var(--accent)]/40",
                        )}
                      >
                        {df}
                      </button>
                    ))
                  : DATE_FILTERS.map((df) => (
                      <button
                        key={df}
                        onClick={() => setDateFilter(df)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          dateFilter === df
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[var(--accent)]/40",
                        )}
                      >
                        {df}
                      </button>
                    ))}
              </div>
            </div>

            {/* Active filter summary */}
            {hasFilters && (
              <div className="mt-2 flex items-center gap-2 border-t border-[hsl(var(--border))]/50 pt-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDateFilter("All time");
                  }}
                  className="ml-auto text-xs text-[var(--accent)] hover:underline"
                >
                  {t("history.filter.clearAll")}
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {/* Session grid or empty state */}
        {filtered.length === 0 ? (
          <Reveal>
            <EmptyState hasFilters={hasFilters} />
          </Reveal>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selected={selectedIds.has(session.id)}
                onSelect={toggleSelect}
                onOpen={setOpenSessionId}
                selectMode={selectMode}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Session preview drawer */}
      <SessionDrawer
        session={openSession}
        onClose={() => setOpenSessionId(null)}
      />

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionsBar
            count={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}