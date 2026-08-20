"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, FileText, Terminal, AlertCircle, ChevronDown, ChevronRight, Eye, Activity, Star, Circle } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { type Session, type AgentStep, type TestResult, type Artifact } from "@/lib/data";

type StepStatus = "complete" | "running" | "pending" | "error";
type TestStatus = "pass" | "fail" | "skip" | "pending";
type ArtifactType = "script" | "excel" | "bug-report" | "log";

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
    test_name: "Delete a todo item",
    description: "Hover over item and click the destroy button.",
    category: "CRUD Operations",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 890,
    created_at: "2024-06-12T09:14:19Z",
  },
  {
    id: "tr_05",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-005",
    test_name: "Edit todo on double-click",
    description: "Double-click a todo item to enter edit mode and save changes.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "fail",
    error_message: "Element not interactable: .edit input not focused after dblclick event.",
    screenshot_path: "/screenshots/tc-005-fail.png",
    duration_ms: 3200,
    created_at: "2024-06-12T09:14:20Z",
  },
  {
    id: "tr_06",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-006",
    test_name: "Filter: All todos",
    description: "Click the 'All' filter and verify all items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 640,
    created_at: "2024-06-12T09:14:21Z",
  },
  {
    id: "tr_07",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-007",
    test_name: "Filter: Active todos",
    description: "Click the 'Active' filter and verify only incomplete items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 710,
    created_at: "2024-06-12T09:14:22Z",
  },
  {
    id: "tr_08",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-008",
    test_name: "Filter: Completed todos",
    description: "Click the 'Completed' filter and verify only done items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 680,
    created_at: "2024-06-12T09:14:23Z",
  },
  {
    id: "tr_09",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-009",
    test_name: "Active count badge updates",
    description: "Verify the item count badge reflects the number of active todos.",
    category: "Filtering",
    priority: "Low",
    status: "fail",
    error_message: "Expected badge text '3 items left' but received '3 item left' (missing plural).",
    screenshot_path: "/screenshots/tc-009-fail.png",
    duration_ms: 1540,
    created_at: "2024-06-12T09:14:24Z",
  },
  {
    id: "tr_10",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-010",
    test_name: "Clear completed button",
    description: "Click 'Clear completed' and verify completed items are removed.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 820,
    created_at: "2024-06-12T09:14:25Z",
  },
  {
    id: "tr_11",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-011",
    test_name: "Toggle all todos",
    description: "Click the toggle-all checkbox to mark all items complete.",
    category: "CRUD Operations",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 930,
    created_at: "2024-06-12T09:14:26Z",
  },
  {
    id: "tr_12",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-012",
    test_name: "Todos persist on reload",
    description: "Reload the page and verify todos are still present via localStorage.",
    category: "Persistence",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 2100,
    created_at: "2024-06-12T09:14:27Z",
  },
  {
    id: "tr_13",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-013",
    test_name: "Empty state message",
    description: "Verify placeholder text appears when no todos exist.",
    category: "Navigation",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 540,
    created_at: "2024-06-12T09:14:28Z",
  },
  {
    id: "tr_14",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-014",
    test_name: "Keyboard navigation",
    description: "Tab through interactive elements and verify focus order.",
    category: "Navigation",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1870,
    created_at: "2024-06-12T09:14:29Z",
  },
  {
    id: "tr_15",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-015",
    test_name: "Input field ARIA label",
    description: "Verify the main input has an accessible aria-label attribute.",
    category: "Navigation",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 430,
    created_at: "2024-06-12T09:14:30Z",
  },
  {
    id: "tr_16",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-016",
    test_name: "Completed state persists after filter",
    description: "Mark item complete, switch filters, verify state is preserved.",
    category: "Persistence",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1120,
    created_at: "2024-06-12T09:14:31Z",
  },
  {
    id: "tr_17",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-017",
    test_name: "Long todo text wraps correctly",
    description: "Add a 200-character todo and verify it wraps without overflow.",
    category: "Navigation",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 670,
    created_at: "2024-06-12T09:14:32Z",
  },
  {
    id: "tr_18",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-018",
    test_name: "Escape key cancels edit",
    description: "Enter edit mode and press Escape to cancel without saving.",
    category: "CRUD Operations",
    priority: "Low",
    status: "skip",
    error_message: null,
    screenshot_path: null,
    duration_ms: null,
    created_at: "2024-06-12T09:14:33Z",
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
    size_bytes: 14336,
    framework: "playwright",
    created_at: "2024-06-12T09:14:47Z",
  },
  {
    id: "art_02",
    session_id: MOCK_SESSION.id,
    artifact_type: "excel",
    file_name: "test-cases.xlsx",
    storage_path: "/artifacts/test-cases.xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 28672,
    framework: null,
    created_at: "2024-06-12T09:14:47Z",
  },
  {
    id: "art_03",
    session_id: MOCK_SESSION.id,
    artifact_type: "bug-report",
    file_name: "bug-report.pdf",
    storage_path: "/artifacts/bug-report.pdf",
    mime_type: "application/pdf",
    size_bytes: 6144,
    framework: null,
    created_at: "2024-06-12T09:14:47Z",
  },
];

const MOCK_SCRIPT = `import { test, expect } from '@playwright/test';

test.describe('TodoMVC End-to-End Suite', () => {
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

  test('TC-004: Delete a todo item', async ({ page }) => {
    await page.locator('.new-todo').fill('Temporary task');
    await page.keyboard.press('Enter');
    await page.locator('.todo-list li').hover();
    await page.locator('.todo-list li .destroy').click();
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });

  test('TC-012: Todos persist on reload', async ({ page }) => {
    await page.locator('.new-todo').fill('Persistent task');
    await page.keyboard.press('Enter');
    await page.reload();
    await expect(page.locator('.todo-list li')).toHaveCount(1);
  });
});
`;

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

function getStepStatusIcon(status: StepStatus) {
  switch (status) {
    case "complete": return <CheckCircle className="w-4 h-4 text-[var(--success)]" />;
    case "running": return <Clock className="w-4 h-4 text-[var(--accent)] animate-spin" />;
    case "error": return <XCircle className="w-4 h-4 text-[var(--destructive)]" />;
    default: return <Circle className="w-4 h-4 text-[var(--muted-foreground)]" />;
  }
}

function getTestStatusBadge(status: TestStatus) {
  const map: Record<TestStatus, { label: string; cls: string }> = {
    pass: { label: "PASS", cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" },
    fail: { label: "FAIL", cls: "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20" },
    skip: { label: "SKIP", cls: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" },
    pending: { label: "PENDING", cls: "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)] border-[var(--muted-foreground)]/20" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

function getArtifactIcon(type: ArtifactType) {
  switch (type) {
    case "script": return <Terminal className="w-5 h-5 text-[var(--accent)]" />;
    case "excel": return <FileText className="w-5 h-5 text-emerald-400" />;
    case "bug-report": return <AlertCircle className="w-5 h-5 text-[var(--destructive)]" />;
    default: return <Activity className="w-5 h-5 text-[var(--muted-foreground)]" />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "overview" | "results" | "script" | "artifacts";

export default function SessionDetailArtifactsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const summary = MOCK_SESSION.summary as {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
    coverage_areas: string[];
  };

  const passRate = summary.total > 0
    ? Math.round((summary.passed / summary.total) * 100)
    : 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    { id: "results", label: `Results (${summary.total})`, icon: <CheckCircle className="w-4 h-4" /> },
    { id: "script", label: "Script", icon: <Terminal className="w-4 h-4" /> },
    { id: "artifacts", label: "Artifacts", icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Reveal>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </Reveal>

        {/* Session header */}
        <Reveal delay={0.05}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20">
                    COMPLETED
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">{MOCK_SESSION.id}</span>
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mb-1">
                  {MOCK_SESSION.title}
                </h1>
                <a
                  href={MOCK_SESSION.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--accent)] hover:underline font-mono truncate block"
                >
                  {MOCK_SESSION.target_url}
                </a>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-3xl font-bold text-[var(--foreground)]">{passRate}%</div>
                  <div className="text-xs text-[var(--muted-foreground)]">pass rate</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(summary.duration_ms)}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-[var(--border)]">
              {[
                { label: "Total", value: summary.total, color: "text-[var(--foreground)]" },
                { label: "Passed", value: summary.passed, color: "text-[var(--success)]" },
                { label: "Failed", value: summary.failed, color: "text-[var(--destructive)]" },
                { label: "Skipped", value: summary.skipped, color: "text-[var(--warning)]" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-700"
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={0.08}>
          <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent steps */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent)]" />
                  Agent Steps
                </h2>
                <div className="space-y-2">
                  {MOCK_STEPS.map((step) => (
                    <div key={step.id}>
                      <button
                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        {getStepStatusIcon(step.status as StepStatus)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--foreground)] truncate">{step.title}</div>
                          <div className="text-xs text-[var(--muted-foreground)] font-mono">
                            Step {step.step_index + 1} · {step.step_type}
                          </div>
                        </div>
                        {expandedStep === step.id
                          ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
                      </button>
                      {expandedStep === step.id && step.detail && (
                        <div className="mx-3 mb-2 px-3 py-2 bg-[var(--background)] rounded-lg text-xs text-[var(--muted-foreground)] leading-relaxed border border-[var(--border)]">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Session metadata */}
              <div className="flex flex-col gap-6">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[var(--accent)]" />
                    Session Details
                  </h2>
                  <dl className="space-y-3">
                    {[
                      { label: "Agent Mode", value: MOCK_SESSION.agent_mode },
                      { label: "Framework", value: MOCK_SESSION.test_framework },
                      { label: "Started", value: formatDate(MOCK_SESSION.created_at) },
                      { label: "Completed", value: formatDate(MOCK_SESSION.updated_at) },
                      { label: "Duration", value: formatDuration(summary.duration_ms) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4">
                        <dt className="text-xs text-[var(--muted-foreground)]">{item.label}</dt>
                        <dd className="text-xs font-medium text-[var(--foreground)] font-mono capitalize">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[var(--accent)]" />
                    Coverage Areas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {summary.coverage_areas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Results Tab ── */}
          {activeTab === "results" && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  Test Results
                </h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {MOCK_RESULTS.map((result) => (
                  <div key={result.id}>
                    <button
                      onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-xs font-mono text-[var(--muted-foreground)] w-16 shrink-0">
                        {result.test_case_id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--foreground)] truncate">{result.test_name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {result.category} · {result.priority} priority
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {result.duration_ms !== null && (
                          <span className="text-xs text-[var(--muted-foreground)] font-mono hidden sm:inline">
                            {formatDuration(result.duration_ms)}
                          </span>
                        )}
                        {getTestStatusBadge(result.status as TestStatus)}
                        {expandedResult === result.id
                          ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                          : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />}
                      </div>
                    </button>
                    {expandedResult === result.id && (
                      <div className="px-5 pb-4 bg-[var(--background)]/50">
                        {result.description && (
                          <p className="text-xs text-[var(--muted-foreground)] mb-2 leading-relaxed">
                            {result.description}
                          </p>
                        )}
                        {result.error_message && (
                          <div className="flex items-start gap-2 p-3 bg-[var(--destructive)]/5 border border-[var(--destructive)]/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-[var(--destructive)] shrink-0 mt-0.5" />
                            <p className="text-xs text-[var(--destructive)] font-mono leading-relaxed">
                              {result.error_message}
                            </p>
                          </div>
                        )}
                        {result.screenshot_path && (
                          <div className="mt-2 text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Screenshot: <span className="font-mono">{result.screenshot_path}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Script Tab ── */}
          {activeTab === "script" && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[var(--accent)]" />
                  todomvc.spec.ts
                </h2>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-[var(--foreground)] leading-relaxed overflow-x-auto bg-[var(--background)]/60 whitespace-pre">
                <code>{MOCK_SCRIPT}</code>
              </pre>
            </div>
          )}

          {/* ── Artifacts Tab ── */}
          {activeTab === "artifacts" && (
            <div className="space-y-4">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {MOCK_ARTIFACTS.map((artifact) => (
                  <motion.div
                    key={artifact.id}
                    variants={scaleIn}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4 hover:border-[var(--primary)]/40 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                        {getArtifactIcon(artifact.artifact_type as ArtifactType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {artifact.file_name}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">
                          {artifact.artifact_type.replace("-", " ")}
                          {artifact.framework ? ` · ${artifact.framework}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--muted-foreground)] font-mono">
                        {artifact.size_bytes !== null ? formatBytes(artifact.size_bytes) : "—"}
                      </span>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-[var(--accent)]" />
                  Download All
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                  Download all artifacts as a single ZIP archive, ready to share with your team or drop into your CI pipeline.
                </p>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" />
                  Download session.zip
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
