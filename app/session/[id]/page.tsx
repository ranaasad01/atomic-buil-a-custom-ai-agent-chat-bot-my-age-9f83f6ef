"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, ChevronDown, ChevronRight, FileText, Terminal, Table, Activity, Globe, Calendar, Layers, Settings, AlertCircle, Check, X, Minus } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { type Session, type Message, type AgentStep, type TestResult, type Artifact } from "@/lib/data";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

type SessionStatus = "completed" | "running" | "error" | "pending";
type TestStatus = "pass" | "fail" | "skip" | "pending";
type StepStatus = "complete" | "running" | "pending" | "error";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SESSION: Session = {
  id: "sess_01hx9z2k3m4n5p6q7r8s9t0u",
  target_url: "https://demo.playwright.dev/todomvc",
  title: "TodoMVC End-to-End Test Suite",
  agent_mode: "autonomous",
  test_framework: "playwright",
  output_types: ["script", "excel", "bug-report"],
  status: "completed",
  summary: {
    total: 12,
    passed: 10,
    failed: 2,
    skipped: 0,
    duration_ms: 18420,
  },
  created_at: "2024-06-12T09:14:32Z",
  updated_at: "2024-06-12T09:19:55Z",
};

const MOCK_MESSAGES: Message[] = [
  {
    id: "msg_001",
    session_id: MOCK_SESSION.id,
    role: "user",
    content:
      "Please run a full end-to-end test on https://demo.playwright.dev/todomvc. I want Playwright scripts, an Excel test case sheet, and a bug report.",
    metadata: null,
    created_at: "2024-06-12T09:14:32Z",
  },
  {
    id: "msg_002",
    session_id: MOCK_SESSION.id,
    role: "assistant",
    content:
      "Got it! I'll crawl the TodoMVC app, identify all interactive elements and user flows, then generate Playwright test scripts, a structured Excel test case sheet, and a bug report. Starting now.",
    metadata: null,
    created_at: "2024-06-12T09:14:35Z",
  },
  {
    id: "msg_003",
    session_id: MOCK_SESSION.id,
    role: "assistant",
    content:
      "Page crawl complete. Discovered 6 primary user flows: Add Todo, Complete Todo, Delete Todo, Filter by Status, Edit Todo, Clear Completed. Generating test cases for each flow now.",
    metadata: { step: "crawl_complete", flows_found: 6 },
    created_at: "2024-06-12T09:15:10Z",
  },
  {
    id: "msg_004",
    session_id: MOCK_SESSION.id,
    role: "user",
    content: "Also check for accessibility issues on the main input field.",
    metadata: null,
    created_at: "2024-06-12T09:15:45Z",
  },
  {
    id: "msg_005",
    session_id: MOCK_SESSION.id,
    role: "assistant",
    content:
      "Accessibility check added to the suite. I'll verify ARIA labels, keyboard navigation, and focus management on the input field. Running all 12 test cases now.",
    metadata: null,
    created_at: "2024-06-12T09:15:48Z",
  },
  {
    id: "msg_006",
    session_id: MOCK_SESSION.id,
    role: "assistant",
    content:
      "Test run complete. 10 passed, 2 failed. The failures are in the 'Edit Todo on double-click' and 'Filter: Active count badge' scenarios. Full artifacts are ready for download below.",
    metadata: { passed: 10, failed: 2, duration_ms: 18420 },
    created_at: "2024-06-12T09:19:55Z",
  },
];

const MOCK_STEPS: AgentStep[] = [
  {
    id: "step_001",
    session_id: MOCK_SESSION.id,
    step_index: 0,
    step_type: "crawl",
    title: "Crawling target URL",
    detail: "Navigating to https://demo.playwright.dev/todomvc and mapping DOM structure.",
    status: "complete",
    created_at: "2024-06-12T09:14:36Z",
    completed_at: "2024-06-12T09:14:58Z",
  },
  {
    id: "step_002",
    session_id: MOCK_SESSION.id,
    step_index: 1,
    step_type: "analyze",
    title: "Analyzing user flows",
    detail: "Identified 6 distinct user flows from interactive elements and navigation patterns.",
    status: "complete",
    created_at: "2024-06-12T09:14:58Z",
    completed_at: "2024-06-12T09:15:20Z",
  },
  {
    id: "step_003",
    session_id: MOCK_SESSION.id,
    step_index: 2,
    step_type: "plan",
    title: "Generating test plan",
    detail: "Created 12 test cases covering all 6 user flows plus accessibility checks.",
    status: "complete",
    created_at: "2024-06-12T09:15:20Z",
    completed_at: "2024-06-12T09:15:50Z",
  },
  {
    id: "step_004",
    session_id: MOCK_SESSION.id,
    step_index: 3,
    step_type: "execute",
    title: "Running Playwright test suite",
    detail: "Executing 12 tests in headless Chromium. Capturing screenshots on failure.",
    status: "complete",
    created_at: "2024-06-12T09:15:50Z",
    completed_at: "2024-06-12T09:19:30Z",
  },
  {
    id: "step_005",
    session_id: MOCK_SESSION.id,
    step_index: 4,
    step_type: "report",
    title: "Generating artifacts",
    detail: "Writing Playwright script, Excel test case sheet, and bug report.",
    status: "complete",
    created_at: "2024-06-12T09:19:30Z",
    completed_at: "2024-06-12T09:19:55Z",
  },
];

const MOCK_RESULTS: TestResult[] = [
  {
    id: "tr_001",
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
    created_at: "2024-06-12T09:15:50Z",
  },
  {
    id: "tr_002",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-002",
    test_name: "Add a new todo item",
    description: "Type in the input and press Enter to create a new item.",
    category: "CRUD",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 870,
    created_at: "2024-06-12T09:15:52Z",
  },
  {
    id: "tr_003",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-003",
    test_name: "Mark todo as complete",
    description: "Click the checkbox to toggle completion state.",
    category: "CRUD",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 640,
    created_at: "2024-06-12T09:15:54Z",
  },
  {
    id: "tr_004",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-004",
    test_name: "Delete a todo item",
    description: "Hover over item and click the destroy button.",
    category: "CRUD",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 720,
    created_at: "2024-06-12T09:15:56Z",
  },
  {
    id: "tr_005",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-005",
    test_name: "Edit todo on double-click",
    description: "Double-click a todo item to enter edit mode and save changes.",
    category: "CRUD",
    priority: "Medium",
    status: "fail",
    error_message: "Element not editable: .todo-list li.editing input.edit — timeout 5000ms exceeded.",
    screenshot_path: "/screenshots/tc-005-fail.png",
    duration_ms: 5120,
    created_at: "2024-06-12T09:16:00Z",
  },
  {
    id: "tr_006",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-006",
    test_name: "Filter: All todos",
    description: "Click 'All' filter and verify all items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 530,
    created_at: "2024-06-12T09:16:10Z",
  },
  {
    id: "tr_007",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-007",
    test_name: "Filter: Active todos",
    description: "Click 'Active' filter and verify only incomplete items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 490,
    created_at: "2024-06-12T09:16:12Z",
  },
  {
    id: "tr_008",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-008",
    test_name: "Filter: Active count badge",
    description: "Verify the item count badge updates correctly when filtering.",
    category: "Filtering",
    priority: "Low",
    status: "fail",
    error_message: "Expected '3 items left' but received '2 items left'. Count mismatch after toggle.",
    screenshot_path: "/screenshots/tc-008-fail.png",
    duration_ms: 1890,
    created_at: "2024-06-12T09:16:15Z",
  },
  {
    id: "tr_009",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-009",
    test_name: "Filter: Completed todos",
    description: "Click 'Completed' filter and verify only done items are shown.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 510,
    created_at: "2024-06-12T09:16:18Z",
  },
  {
    id: "tr_010",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-010",
    test_name: "Clear completed todos",
    description: "Click 'Clear completed' and verify completed items are removed.",
    category: "CRUD",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 680,
    created_at: "2024-06-12T09:16:20Z",
  },
  {
    id: "tr_011",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-011",
    test_name: "Toggle all todos",
    description: "Click the toggle-all checkbox to mark all items complete.",
    category: "CRUD",
    priority: "Low",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 760,
    created_at: "2024-06-12T09:16:22Z",
  },
  {
    id: "tr_012",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-012",
    test_name: "Input field ARIA label",
    description: "Verify the main input has a proper aria-label for screen readers.",
    category: "Accessibility",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 320,
    created_at: "2024-06-12T09:16:24Z",
  },
];

const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "art_001",
    session_id: MOCK_SESSION.id,
    artifact_type: "script",
    file_name: "todomvc.spec.ts",
    storage_path: "/artifacts/sess_01hx9z2k3m4n5p6q7r8s9t0u/todomvc.spec.ts",
    mime_type: "text/typescript",
    size_bytes: 14336,
    framework: "playwright",
    created_at: "2024-06-12T09:19:40Z",
  },
  {
    id: "art_002",
    session_id: MOCK_SESSION.id,
    artifact_type: "excel",
    file_name: "test-cases.xlsx",
    storage_path: "/artifacts/sess_01hx9z2k3m4n5p6q7r8s9t0u/test-cases.xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 28672,
    framework: null,
    created_at: "2024-06-12T09:19:45Z",
  },
  {
    id: "art_003",
    session_id: MOCK_SESSION.id,
    artifact_type: "bug-report",
    file_name: "bug-report.pdf",
    storage_path: "/artifacts/sess_01hx9z2k3m4n5p6q7r8s9t0u/bug-report.pdf",
    mime_type: "application/pdf",
    size_bytes: 6144,
    framework: null,
    created_at: "2024-06-12T09:19:50Z",
  },
];

const MOCK_SCRIPT = `import { test, expect } from '@playwright/test';

test.describe('TodoMVC End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('TC-001: Page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/TodoMVC/);
    await expect(page.locator('.todoapp')).toBeVisible();
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

  test('TC-012: Input field ARIA label', async ({ page }) => {
    const input = page.locator('.new-todo');
    await expect(input).toHaveAttribute('aria-label', /new todo/i);
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

function getStatusIcon(status: SessionStatus) {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-[var(--success)]" />;
    case "running": return <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />;
    case "error": return <XCircle className="w-4 h-4 text-[var(--destructive)]" />;
    case "pending": return <Clock className="w-4 h-4 text-[var(--warning)]" />;
    default: return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
  }
}

function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "completed": return "Completed";
    case "running": return "Running";
    case "error": return "Error";
    case "pending": return "Pending";
    default: return status;
  }
}

function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case "completed": return "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20";
    case "running": return "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20";
    case "error": return "text-[var(--destructive)] bg-[var(--destructive)]/10 border-[var(--destructive)]/20";
    case "pending": return "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20";
    default: return "text-[var(--muted-foreground)] bg-white/5 border-[var(--border)]";
  }
}

function getTestStatusIcon(status: TestStatus) {
  switch (status) {
    case "pass": return <Check className="w-3.5 h-3.5 text-[var(--success)]" />;
    case "fail": return <X className="w-3.5 h-3.5 text-[var(--destructive)]" />;
    case "skip": return <Minus className="w-3.5 h-3.5 text-[var(--warning)]" />;
    case "pending": return <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />;
    default: return null;
  }
}

function getTestStatusColor(status: TestStatus): string {
  switch (status) {
    case "pass": return "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20";
    case "fail": return "text-[var(--destructive)] bg-[var(--destructive)]/10 border-[var(--destructive)]/20";
    case "skip": return "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20";
    case "pending": return "text-[var(--muted-foreground)] bg-white/5 border-[var(--border)]";
    default: return "text-[var(--muted-foreground)] bg-white/5 border-[var(--border)]";
  }
}

function getStepIcon(status: StepStatus) {
  switch (status) {
    case "complete": return <CheckCircle className="w-4 h-4 text-[var(--success)]" />;
    case "running": return <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />;
    case "error": return <AlertCircle className="w-4 h-4 text-[var(--destructive)]" />;
    case "pending": return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
    default: return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
  }
}

function getArtifactIcon(type: string) {
  switch (type) {
    case "script": return <Terminal className="w-5 h-5 text-[var(--accent)]" />;
    case "excel": return <Table className="w-5 h-5 text-emerald-400" />;
    case "bug-report": return <FileText className="w-5 h-5 text-orange-400" />;
    default: return <FileText className="w-5 h-5 text-[var(--muted-foreground)]" />;
  }
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "chat" | "steps" | "results" | "script" | "artifacts";

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const session = MOCK_SESSION;
  const summary = session.summary as {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
  } | null;

  function handleCopyScript() {
    navigator.clipboard.writeText(MOCK_SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Layers className="w-4 h-4" /> },
    { id: "chat", label: "Chat", icon: <Activity className="w-4 h-4" /> },
    { id: "steps", label: "Agent Steps", icon: <Settings className="w-4 h-4" /> },
    { id: "results", label: "Test Results", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "script", label: "Script", icon: <Terminal className="w-4 h-4" /> },
    { id: "artifacts", label: "Artifacts", icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Header ── */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/40 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-4">
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mt-0.5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-semibold text-[var(--foreground)] truncate">
                  {session.title ?? "Untitled Session"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    getStatusColor(session.status as SessionStatus)
                  }`}
                >
                  {getStatusIcon(session.status as SessionStatus)}
                  {getStatusLabel(session.status as SessionStatus)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <a
                  href={session.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {session.target_url}
                </a>
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(session.created_at)}
                </span>
                {summary && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(summary.duration_ms)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)]/15 text-[var(--foreground)] border border-[var(--primary)]/30"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Stats row */}
            {summary && (
              <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Tests", value: summary.total, color: "text-[var(--foreground)]" },
                  { label: "Passed", value: summary.passed, color: "text-[var(--success)]" },
                  { label: "Failed", value: summary.failed, color: "text-[var(--destructive)]" },
                  { label: "Skipped", value: summary.skipped, color: "text-[var(--warning)]" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center"
                  >
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Session info */}
            <motion.div
              variants={fadeInUp}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6"
            >
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Session Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Session ID", value: session.id },
                  { label: "Agent Mode", value: session.agent_mode },
                  { label: "Framework", value: session.test_framework },
                  { label: "Output Types", value: session.output_types.join(", ") },
                  { label: "Created", value: formatDate(session.created_at) },
                  { label: "Updated", value: formatDate(session.updated_at) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-[var(--muted-foreground)] mb-0.5">{item.label}</dt>
                    <dd className="text-sm text-[var(--foreground)] font-mono break-all">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>

            {/* Pass rate bar */}
            {summary && summary.total > 0 && (
              <motion.div
                variants={fadeInUp}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Pass Rate</h2>
                  <span className="text-sm font-bold text-[var(--success)]">
                    {Math.round((summary.passed / summary.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--success)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(summary.passed / summary.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                    {summary.passed} passed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--destructive)]" />
                    {summary.failed} failed
                  </span>
                  {summary.skipped > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
                      {summary.skipped} skipped
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4 max-w-3xl"
          >
            {MOCK_MESSAGES.map((msg) => (
              <motion.div
                key={msg.id}
                variants={fadeInUp}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                  }`}
                >
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-[var(--foreground)]"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Steps Tab */}
        {activeTab === "steps" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3 max-w-3xl"
          >
            {MOCK_STEPS.map((step) => (
              <motion.div
                key={step.id}
                variants={fadeInUp}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedStep(expandedStep === step.id ? null : step.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  {getStepIcon(step.status as StepStatus)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] font-mono">
                        Step {step.step_index + 1}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
                        {step.step_type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {step.title}
                    </p>
                  </div>
                  {step.completed_at && (
                    <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                      {formatDuration(
                        new Date(step.completed_at).getTime() -
                          new Date(step.created_at).getTime()
                      )}
                    </span>
                  )}
                  {expandedStep === step.id ? (
                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  )}
                </button>
                {expandedStep === step.id && step.detail && (
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--muted-foreground)] mt-3 leading-relaxed">
                      {step.detail}
                    </p>
                    {step.completed_at && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-2">
                        Completed: {formatDate(step.completed_at)}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {MOCK_RESULTS.map((result) => (
              <motion.div
                key={result.id}
                variants={fadeInUp}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedResult(expandedResult === result.id ? null : result.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${
                      getTestStatusColor(result.status as TestStatus)
                    }`}
                  >
                    {getTestStatusIcon(result.status as TestStatus)}
                    {result.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono shrink-0">
                    {result.test_case_id}
                  </span>
                  <span className="text-sm text-[var(--foreground)] flex-1 truncate">
                    {result.test_name}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    {result.category && (
                      <span className="hidden sm:inline text-xs text-[var(--muted-foreground)] bg-white/5 px-2 py-0.5 rounded">
                        {result.category}
                      </span>
                    )}
                    {result.duration_ms !== null && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDuration(result.duration_ms)}
                      </span>
                    )}
                    {expandedResult === result.id ? (
                      <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                    )}
                  </div>
                </button>
                {expandedResult === result.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">
                    {result.description && (
                      <p className="text-sm text-[var(--muted-foreground)] mt-3 leading-relaxed">
                        {result.description}
                      </p>
                    )}
                    {result.error_message && (
                      <div className="mt-3 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-[var(--destructive)]" />
                          <span className="text-xs font-semibold text-[var(--destructive)]">Error</span>
                        </div>
                        <p className="text-xs text-[var(--destructive)]/80 font-mono leading-relaxed">
                          {result.error_message}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                      {result.priority && <span>Priority: {result.priority}</span>}
                      {result.category && <span>Category: {result.category}</span>}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Script Tab */}
        {activeTab === "script" && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">todomvc.spec.ts</span>
                <span className="text-xs text-[var(--muted-foreground)] bg-white/5 px-2 py-0.5 rounded">
                  Playwright
                </span>
              </div>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/25 transition-colors"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
            <pre
              ref={codeRef}
              className="p-4 text-xs font-mono text-[var(--foreground)] overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto"
            >
              <code>{MOCK_SCRIPT}</code>
            </pre>
          </motion.div>
        )}

        {/* Artifacts Tab */}
        {activeTab === "artifacts" && (
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
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4 hover:border-[var(--primary)]/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-colors">
                    {getArtifactIcon(artifact.artifact_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {artifact.file_name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">
                      {artifact.artifact_type.replace("-", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>{artifact.size_bytes ? formatBytes(artifact.size_bytes) : "—"}</span>
                  {artifact.framework && (
                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-2 py-0.5 rounded-full capitalize">
                      {artifact.framework}
                    </span>
                  )}
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
