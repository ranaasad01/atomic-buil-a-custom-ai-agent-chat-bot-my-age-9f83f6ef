"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, FileText, Terminal, AlertCircle, ChevronDown, ChevronRight, Eye, Activity, Star, Circle } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import type, { Session, AgentStep, TestResult, Artifact } from "@/lib/data";
type StepStatus = any;
const StepStatus: any = [];
type TestStatus = any;
const TestStatus: any = [];
type ArtifactType = any;
const ArtifactType: any = [];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SESSION: Session = {
  id: "sess_01hx9k2m3n4p5q6r7s8t9u0v",
  target_url: "https://demo.playwright.dev/todomvc",
  title: "TodoMVC End-to-End Test Suite",
  agent_mode: "autonomous",
  test_framework: "playwright",
  output_types: ["script", "excel", "bug-report"],
  status: "completed",
  summary: {
    total: 18,
    passed: 15,
    failed: 2,
    skipped: 1,
    duration_ms: 47320,
    coverage_areas: ["Navigation", "CRUD Operations", "Filtering", "Persistence"],
  },
  created_at: "2024-06-12T09:14:00Z",
  updated_at: "2024-06-12T09:14:47Z",
};

const MOCK_STEPS: AgentStep[] = [
  {
    id: "step_01",
    session_id: MOCK_SESSION.id,
    step_index: 0,
    step_type: "crawl",
    title: "Crawling target URL",
    detail: "Navigating to https://demo.playwright.dev/todomvc and mapping DOM structure.",
    status: "complete",
    created_at: "2024-06-12T09:14:00Z",
    completed_at: "2024-06-12T09:14:05Z",
  },
  {
    id: "step_02",
    session_id: MOCK_SESSION.id,
    step_index: 1,
    step_type: "analyze",
    title: "Analyzing page interactions",
    detail: "Identified 12 interactive elements: input fields, buttons, checkboxes, filters.",
    status: "complete",
    created_at: "2024-06-12T09:14:05Z",
    completed_at: "2024-06-12T09:14:11Z",
  },
  {
    id: "step_03",
    session_id: MOCK_SESSION.id,
    step_index: 2,
    step_type: "plan",
    title: "Generating test plan",
    detail: "Created 18 test cases across 4 coverage areas based on user stories.",
    status: "complete",
    created_at: "2024-06-12T09:14:11Z",
    completed_at: "2024-06-12T09:14:16Z",
  },
  {
    id: "step_04",
    session_id: MOCK_SESSION.id,
    step_index: 3,
    step_type: "execute",
    title: "Running Playwright test suite",
    detail: "Executing 18 tests in headless Chromium. Capturing screenshots on failure.",
    status: "complete",
    created_at: "2024-06-12T09:14:16Z",
    completed_at: "2024-06-12T09:14:43Z",
  },
  {
    id: "step_05",
    session_id: MOCK_SESSION.id,
    step_index: 4,
    step_type: "report",
    title: "Generating artifacts",
    detail: "Writing Playwright script, Excel test case sheet, and bug report.",
    status: "complete",
    created_at: "2024-06-12T09:14:43Z",
    completed_at: "2024-06-12T09:14:47Z",
  },
];

const MOCK_RESULTS: TestResult[] = [
  {
    id: "tr_01",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-001",
    test_name: "Page loads successfully",
    description: "Verify the TodoMVC app renders without errors.",
    category: "Navigation",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1240,
    created_at: "2024-06-12T09:14:16Z",
  },
  {
    id: "tr_02",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-002",
    test_name: "Add a new todo item",
    description: "Type in the input and press Enter to create a new item.",
    category: "CRUD Operations",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 980,
    created_at: "2024-06-12T09:14:17Z",
  },
  {
    id: "tr_03",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-003",
    test_name: "Mark todo as complete",
    description: "Click the checkbox to toggle completion state.",
    category: "CRUD Operations",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 760,
    created_at: "2024-06-12T09:14:18Z",
  },
  {
    id: "tr_04",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-004",
    test_name: "Edit existing todo item",
    description: "Double-click a todo to enter edit mode and save changes.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1120,
    created_at: "2024-06-12T09:14:19Z",
  },
  {
    id: "tr_05",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-005",
    test_name: "Delete a todo item",
    description: "Hover over item and click the destroy button.",
    category: "CRUD Operations",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 890,
    created_at: "2024-06-12T09:14:20Z",
  },
  {
    id: "tr_06",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-006",
    test_name: "Filter: show active todos",
    description: "Click 'Active' filter and verify only incomplete items are shown.",
    category: "Filtering",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1050,
    created_at: "2024-06-12T09:14:21Z",
  },
  {
    id: "tr_07",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-007",
    test_name: "Filter: show completed todos",
    description: "Click 'Completed' filter and verify only done items are shown.",
    category: "Filtering",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 930,
    created_at: "2024-06-12T09:14:22Z",
  },
  {
    id: "tr_08",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-008",
    test_name: "Clear completed todos",
    description: "Click 'Clear completed' and verify completed items are removed.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "fail",
    error_message:
      "Expected 0 completed items, found 1. 'Clear completed' button did not remove all items on first click.",
    screenshot_path: "/screenshots/tc-008-fail.png",
    duration_ms: 2340,
    created_at: "2024-06-12T09:14:23Z",
  },
  {
    id: "tr_09",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-009",
    test_name: "Toggle all todos complete",
    description: "Click the 'Mark all as complete' chevron and verify all items are checked.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1180,
    created_at: "2024-06-12T09:14:24Z",
  },
  {
    id: "tr_10",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-010",
    test_name: "Item count updates correctly",
    description: "Verify the footer item count reflects the number of active todos.",
    category: "Navigation",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 670,
    created_at: "2024-06-12T09:14:25Z",
  },
  {
    id: "tr_11",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-011",
    test_name: "Todos persist on page reload",
    description: "Add items, reload the page, and verify items are still present.",
    category: "Persistence",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 2100,
    created_at: "2024-06-12T09:14:26Z",
  },
  {
    id: "tr_12",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-012",
    test_name: "Completed state persists on reload",
    description: "Mark items complete, reload, and verify completion state is retained.",
    category: "Persistence",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 2280,
    created_at: "2024-06-12T09:14:28Z",
  },
  {
    id: "tr_13",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-013",
    test_name: "Empty input does not create todo",
    description: "Press Enter with an empty input and verify no item is added.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 540,
    created_at: "2024-06-12T09:14:30Z",
  },
  {
    id: "tr_14",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-014",
    test_name: "Escape key cancels edit",
    description: "Enter edit mode, press Escape, and verify original text is restored.",
    category: "CRUD Operations",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 810,
    created_at: "2024-06-12T09:14:31Z",
  },
  {
    id: "tr_15",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-015",
    test_name: "Keyboard accessibility: tab navigation",
    description: "Tab through all interactive elements and verify focus order.",
    category: "Navigation",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1560,
    created_at: "2024-06-12T09:14:32Z",
  },
  {
    id: "tr_16",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-016",
    test_name: "Filter URL hash updates",
    description: "Verify URL hash changes to #/active, #/completed on filter click.",
    category: "Navigation",
    priority: "Low",
    status: "fail",
    error_message:
      "URL hash did not update when clicking 'Active' filter. Expected '#/active', got '#/'.",
    screenshot_path: "/screenshots/tc-016-fail.png",
    duration_ms: 1890,
    created_at: "2024-06-12T09:14:34Z",
  },
  {
    id: "tr_17",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-017",
    test_name: "Whitespace-only input rejected",
    description: "Enter only spaces and verify no todo is created.",
    category: "CRUD Operations",
    priority: "Low",
    status: "skip",
    error_message: null,
    screenshot_path: null,
    duration_ms: null,
    created_at: "2024-06-12T09:14:36Z",
  },
  {
    id: "tr_18",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-018",
    test_name: "Long todo text wraps correctly",
    description: "Add a 200-character todo and verify it wraps without overflow.",
    category: "Navigation",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 720,
    created_at: "2024-06-12T09:14:37Z",
  },
];

const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "art_01",
    session_id: MOCK_SESSION.id,
    artifact_type: "script",
    file_name: "todomvc.spec.ts",
    storage_path: "/artifacts/todomvc.spec.ts",
    mime_type: "text/typescript",
    size_bytes: 8420,
    framework: "playwright",
    created_at: "2024-06-12T09:14:44Z",
  },
  {
    id: "art_02",
    session_id: MOCK_SESSION.id,
    artifact_type: "excel",
    file_name: "test-cases-todomvc.xlsx",
    storage_path: "/artifacts/test-cases-todomvc.xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 34816,
    framework: null,
    created_at: "2024-06-12T09:14:45Z",
  },
  {
    id: "art_03",
    session_id: MOCK_SESSION.id,
    artifact_type: "bug-report",
    file_name: "bug-report-todomvc.md",
    storage_path: "/artifacts/bug-report-todomvc.md",
    mime_type: "text/markdown",
    size_bytes: 2048,
    framework: null,
    created_at: "2024-06-12T09:14:46Z",
  },
  {
    id: "art_04",
    session_id: MOCK_SESSION.id,
    artifact_type: "log",
    file_name: "execution-log.txt",
    storage_path: "/artifacts/execution-log.txt",
    mime_type: "text/plain",
    size_bytes: 15360,
    framework: null,
    created_at: "2024-06-12T09:14:47Z",
  },
];

const MOCK_SCRIPT = `import { test, expect } from '@playwright/test';

test.describe('TodoMVC - End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('TC-001: Page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/TodoMVC/);
    await expect(page.locator('.new-todo')).toBeVisible();
  });

  test('TC-002: Add a new todo item', async ({ page }) => {
    await page.locator('.new-todo').fill('Buy groceries');
    await page.keyboard.press('Enter');
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    await expect(page.locator('.todo-list li label')).toHaveText('Buy groceries');
  });

  test('TC-003: Mark todo as complete', async ({ page }) => {
    await page.locator('.new-todo').fill('Write tests');
    await page.keyboard.press('Enter');
    await page.locator('.todo-list li .toggle').click();
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
  });

  test('TC-008: Clear completed todos', async ({ page }) => {
    await page.locator('.new-todo').fill('Task A');
    await page.keyboard.press('Enter');
    await page.locator('.todo-list li .toggle').click();
    await page.locator('.clear-completed').click();
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });
});`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function totalDuration(steps: AgentStep[]): string {
  const start = new Date(steps[0]?.created_at ?? "").getTime();
  const end = new Date(steps[steps.length - 1]?.completed_at ?? "").getTime();
  return formatDuration(end - start);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TestStatus | SessionStatus | StepStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    pass: { label: "Pass", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    fail: { label: "Fail", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    skip: { label: "Skip", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    pending: { label: "Pending", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    running: { label: "Running", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    complete: { label: "Done", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    error: { label: "Error", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "complete") return <CheckCircle className="h-5 w-5 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-5 w-5 text-red-400" />;
  if (status === "running") return <Activity className="h-5 w-5 text-blue-400 animate-pulse" />;
  return <Circle className="h-5 w-5 text-zinc-600" />;
}

function ArtifactIcon({ type }: { type: ArtifactType }) {
  if (type === "script") return <Terminal className="h-5 w-5 text-[var(--accent)]" />;
  if (type === "excel") return <FileText className="h-5 w-5 text-emerald-400" />;
  if (type === "bug-report") return <AlertCircle className="h-5 w-5 text-red-400" />;
  return <FileText className="h-5 w-5 text-zinc-400" />;
}

function PriorityDot({ priority }: { priority: string | null }) {
  const map: Record<string, string> = {
    High: "bg-red-400",
    Medium: "bg-yellow-400",
    Low: "bg-zinc-500",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${map[priority ?? "Low"] ?? "bg-zinc-500"}`}
      title={priority ?? "Low"}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const session = MOCK_SESSION;
  const steps = MOCK_STEPS;
  const results = MOCK_RESULTS;
  const artifacts = MOCK_ARTIFACTS;

  const summary = session.summary as {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
    coverage_areas: string[];
  };

  const [activeTab, setActiveTab] = useState<"results" | "script" | "steps">("results");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(results.map((r) => r.category ?? "Other")))];

  const filteredResults =
    categoryFilter === "All"
      ? results
      : results.filter((r) => r.category === categoryFilter);

  const passRate = Math.round((summary.passed / summary.total) * 100);

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Back nav ── */}
        <Reveal>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>
        </Reveal>

        {/* ── Header ── */}
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] truncate">
                  {session.title ?? "Untitled Session"}
                </h1>
                <StatusBadge status={session.status} />
              </div>
              <a
                href={session.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                {session.target_url}
              </a>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {formatDate(session.created_at)} &middot; {session.agent_mode} mode &middot;{" "}
                {session.test_framework}
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── Stat Cards ── */}
        <Reveal delay={0.1}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8"
          >
            {[
              { label: "Total Tests", value: summary.total, color: "text-[hsl(var(--foreground))]" },
              { label: "Passed", value: summary.passed, color: "text-emerald-400" },
              { label: "Failed", value: summary.failed, color: "text-red-400" },
              { label: "Pass Rate", value: `${passRate}%`, color: "text-[var(--accent)]" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.2)]"
              >
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* ── Pass Rate Bar ── */}
        <Reveal delay={0.12}>
          <div className="mb-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">Test Coverage Overview</span>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Duration: {formatDuration(summary.duration_ms)} &middot; {totalDuration(steps)} agent time
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-[hsl(var(--border))] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${passRate}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.coverage_areas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Artifacts ── */}
        <Reveal delay={0.14}>
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-3">
              Generated Artifacts
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {artifacts.map((art) => (
                <motion.div
                  key={art.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_-4px_rgba(0,0,0,0.18)] hover:border-[var(--accent)]/40 transition-colors duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                    <ArtifactIcon type={art.artifact_type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                      {art.file_name}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {art.size_bytes ? formatBytes(art.size_bytes) : "—"}
                      {art.framework ? ` · ${art.framework}` : ""}
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[var(--accent)] transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Tabs ── */}
        <Reveal delay={0.16}>
          <div className="mb-6 flex gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 w-fit">
            {(["results", "script", "steps"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[var(--accent)] text-black shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {tab === "results" ? "Test Results" : tab === "script" ? "Script Preview" : "Agent Steps"}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── Tab: Test Results ── */}
        {activeTab === "results" && (
          <Reveal delay={0.18}>
            <div>
              {/* Category filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      categoryFilter === cat
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results table */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_16px_-4px_rgba(0,0,0,0.18)]">
                <div className="hidden sm:grid grid-cols-[80px_1fr_120px_80px_80px_80px] gap-4 px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                  {["ID", "Test Name", "Category", "Priority", "Duration", "Status"].map((h) => (
                    <span key={h} className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      {h}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-[hsl(var(--border))]">
                  {filteredResults.map((result) => (
                    <div key={result.id}>
                      <button
                        onClick={() =>
                          setExpandedResult(expandedResult === result.id ? null : result.id)
                        }
                        className="w-full text-left"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px_80px_80px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-[hsl(var(--background))]/50 transition-colors duration-150">
                          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                            {result.test_case_id}
                          </span>
                          <div className="flex items-center gap-2">
                            {result.status === "pass" ? (
                              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                            ) : result.status === "fail" ? (
                              <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                            ) : (
                              <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
                            )}
                            <span className="text-sm text-[hsl(var(--foreground))] font-medium">
                              {result.test_name}
                            </span>
                          </div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {result.category ?? "—"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <PriorityDot priority={result.priority} />
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {result.priority ?? "—"}
                            </span>
                          </div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {result.duration_ms != null ? formatDuration(result.duration_ms) : "—"}
                          </span>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={result.status} />
                            {result.error_message && (
                              <ChevronDown
                                className={`h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${
                                  expandedResult === result.id ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded error */}
                      {expandedResult === result.id && result.error_message && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-5 pb-4"
                        >
                          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-red-400 mb-1">Error Details</p>
                                <p className="text-xs text-red-300/80 leading-relaxed">
                                  {result.error_message}
                                </p>
                                {result.screenshot_path && (
                                  <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                                    Screenshot: <span className="font-mono">{result.screenshot_path}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {result.description && (
                            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                              {result.description}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Tab: Script Preview ── */}
        {activeTab === "script" && (
          <Reveal delay={0.18}>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_16px_-4px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                    todomvc.spec.ts
                  </span>
                  <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    Playwright
                  </span>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30 transition-colors duration-200">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
              <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-[hsl(var(--foreground))]/80 font-mono bg-[hsl(var(--background))]/60">
                <code>{MOCK_SCRIPT}</code>
              </pre>
              <div className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Full script contains 18 test cases across 4 describe blocks. Download to view complete file.
                </span>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Tab: Agent Steps ── */}
        {activeTab === "steps" && (
          <Reveal delay={0.18}>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.15)]"
                >
                  <button
                    onClick={() =>
                      setExpandedStep(expandedStep === step.id ? null : step.id)
                    }
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[hsl(var(--background))]/40 transition-colors duration-150"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs font-bold text-[hsl(var(--muted-foreground))]">
                      {step.step_index + 1}
                    </div>
                    <StepIcon status={step.status} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{step.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                        {step.step_type}
                        {step.completed_at
                          ? ` · completed ${formatDate(step.completed_at)}`
                          : ""}
                      </p>
                    </div>
                    <StatusBadge status={step.status} />
                    <ChevronRight
                      className={`h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${
                        expandedStep === step.id ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {expandedStep === step.id && step.detail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="px-5 pb-4 border-t border-[hsl(var(--border))]"
                    >
                      <p className="pt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                        {step.detail}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </Reveal>
        )}

        {/* ── Bottom CTA ── */}
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.15)]">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                Run a new test on this URL
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Re-test with updated instructions or a different framework.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            >
              <Activity className="h-4 w-4" />
              New Session
            </Link>
          </div>
        </Reveal>

      </div>
    </main>
  );
}