"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, ChevronDown, ChevronRight, FileText, Terminal, Table, Activity, Globe, Calendar, Layers, Settings, AlertCircle, Check, X, Minus } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { Session, Message, AgentStep, TestResult, Artifact } from "@/lib/data";
type SessionStatus = any;
const SessionStatus: any = [];
type TestStatus = any;
const TestStatus: any = [];
type StepStatus = any;
const StepStatus: any = [];
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

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
    step_type: "generate",
    title: "Generating test cases",
    detail: "Writing 12 test cases covering all flows, edge cases, and accessibility checks.",
    status: "complete",
    created_at: "2024-06-12T09:15:20Z",
    completed_at: "2024-06-12T09:16:05Z",
  },
  {
    id: "step_004",
    session_id: MOCK_SESSION.id,
    step_index: 3,
    step_type: "execute",
    title: "Executing Playwright tests",
    detail: "Running all 12 test cases in headless Chromium.",
    status: "complete",
    created_at: "2024-06-12T09:16:05Z",
    completed_at: "2024-06-12T09:19:30Z",
  },
  {
    id: "step_005",
    session_id: MOCK_SESSION.id,
    step_index: 4,
    step_type: "report",
    title: "Compiling artifacts",
    detail: "Generating Playwright script file, Excel test case sheet, and bug report.",
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
    test_name: "Add a new todo item",
    description: "Type text in input and press Enter; item appears in list.",
    category: "Core Flow",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1240,
    created_at: "2024-06-12T09:16:10Z",
  },
  {
    id: "tr_002",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-002",
    test_name: "Mark todo as complete",
    description: "Click checkbox; item gets strikethrough styling.",
    category: "Core Flow",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 980,
    created_at: "2024-06-12T09:16:22Z",
  },
  {
    id: "tr_003",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-003",
    test_name: "Delete a todo item",
    description: "Hover item and click destroy button; item removed from list.",
    category: "Core Flow",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1100,
    created_at: "2024-06-12T09:16:35Z",
  },
  {
    id: "tr_004",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-004",
    test_name: "Edit todo on double-click",
    description: "Double-click item to enter edit mode; update text and press Enter.",
    category: "Core Flow",
    priority: "High",
    status: "fail",
    error_message: "TimeoutError: locator('.editing') not visible after 5000ms. Edit mode did not activate on double-click.",
    screenshot_path: "/screenshots/tc-004-fail.png",
    duration_ms: 5200,
    created_at: "2024-06-12T09:16:50Z",
  },
  {
    id: "tr_005",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-005",
    test_name: "Filter: Show All",
    description: "Click 'All' filter; all todos visible regardless of status.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 870,
    created_at: "2024-06-12T09:17:10Z",
  },
  {
    id: "tr_006",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-006",
    test_name: "Filter: Show Active",
    description: "Click 'Active' filter; only incomplete todos visible.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 920,
    created_at: "2024-06-12T09:17:22Z",
  },
  {
    id: "tr_007",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-007",
    test_name: "Filter: Show Completed",
    description: "Click 'Completed' filter; only done todos visible.",
    category: "Filtering",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 890,
    created_at: "2024-06-12T09:17:35Z",
  },
  {
    id: "tr_008",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-008",
    test_name: "Active count badge accuracy",
    description: "Badge shows correct count of remaining active todos.",
    category: "Filtering",
    priority: "Medium",
    status: "fail",
    error_message: "AssertionError: expected badge text '3 items left' but received '4 items left'. Count mismatch after completing an item.",
    screenshot_path: "/screenshots/tc-008-fail.png",
    duration_ms: 1450,
    created_at: "2024-06-12T09:17:50Z",
  },
  {
    id: "tr_009",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-009",
    test_name: "Clear completed todos",
    description: "Click 'Clear completed'; all done items removed from list.",
    category: "Bulk Actions",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1050,
    created_at: "2024-06-12T09:18:05Z",
  },
  {
    id: "tr_010",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-010",
    test_name: "Toggle all todos complete",
    description: "Click chevron toggle; all items marked complete simultaneously.",
    category: "Bulk Actions",
    priority: "Medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1180,
    created_at: "2024-06-12T09:18:20Z",
  },
  {
    id: "tr_011",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-011",
    test_name: "Input field ARIA label",
    description: "Main input has accessible placeholder and aria-label attribute.",
    category: "Accessibility",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 640,
    created_at: "2024-06-12T09:18:35Z",
  },
  {
    id: "tr_012",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-012",
    test_name: "Keyboard navigation through list",
    description: "Tab key cycles through todo items and action buttons.",
    category: "Accessibility",
    priority: "High",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1870,
    created_at: "2024-06-12T09:18:55Z",
  },
];

const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "art_001",
    session_id: MOCK_SESSION.id,
    artifact_type: "script",
    file_name: "todomvc.spec.ts",
    storage_path: "/artifacts/todomvc.spec.ts",
    mime_type: "text/typescript",
    size_bytes: 4820,
    framework: "playwright",
    created_at: "2024-06-12T09:19:40Z",
  },
  {
    id: "art_002",
    session_id: MOCK_SESSION.id,
    artifact_type: "excel",
    file_name: "test-cases-todomvc.xlsx",
    storage_path: "/artifacts/test-cases-todomvc.xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 18240,
    framework: null,
    created_at: "2024-06-12T09:19:45Z",
  },
  {
    id: "art_003",
    session_id: MOCK_SESSION.id,
    artifact_type: "bug-report",
    file_name: "bug-report-todomvc.pdf",
    storage_path: "/artifacts/bug-report-todomvc.pdf",
    mime_type: "application/pdf",
    size_bytes: 92100,
    framework: null,
    created_at: "2024-06-12T09:19:52Z",
  },
  {
    id: "art_004",
    session_id: MOCK_SESSION.id,
    artifact_type: "log",
    file_name: "agent-run.log",
    storage_path: "/artifacts/agent-run.log",
    mime_type: "text/plain",
    size_bytes: 7340,
    framework: null,
    created_at: "2024-06-12T09:19:55Z",
  },
];

const PLAYWRIGHT_SCRIPT = `import { test, expect } from '@playwright/test';

const BASE_URL = 'https://demo.playwright.dev/todomvc';

test.describe('TodoMVC — QA Agent AI Generated Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/TodoMVC/);
  });

  // TC-001: Add a new todo item
  test('Add a new todo item', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Buy groceries');
    await input.press('Enter');
    const items = page.locator('.todo-list li');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Buy groceries');
  });

  // TC-002: Mark todo as complete
  test('Mark todo as complete', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Read a book');
    await input.press('Enter');
    await page.locator('.todo-list li .toggle').click();
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
  });

  // TC-003: Delete a todo item
  test('Delete a todo item', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Temporary task');
    await input.press('Enter');
    const item = page.locator('.todo-list li').first();
    await item.hover();
    await item.locator('.destroy').click();
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });

  // TC-004: Edit todo on double-click [FAIL]
  test('Edit todo on double-click', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Original text');
    await input.press('Enter');
    const item = page.locator('.todo-list li label').first();
    await item.dblclick();
    const editInput = page.locator('.todo-list li .edit');
    await expect(editInput).toBeVisible({ timeout: 5000 });
    await editInput.fill('Updated text');
    await editInput.press('Enter');
    await expect(page.locator('.todo-list li label')).toContainText('Updated text');
  });

  // TC-005: Filter — Show All
  test('Filter: Show All', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Task A'); await input.press('Enter');
    await input.fill('Task B'); await input.press('Enter');
    await page.locator('.todo-list li .toggle').first().click();
    await page.locator('.filters a', { hasText: 'All' }).click();
    await expect(page.locator('.todo-list li')).toHaveCount(2);
  });

  // TC-008: Active count badge [FAIL]
  test('Active count badge accuracy', async ({ page }) => {
    const input = page.locator('.new-todo');
    for (const t of ['A', 'B', 'C', 'D']) {
      await input.fill(t); await input.press('Enter');
    }
    await page.locator('.todo-list li .toggle').first().click();
    const badge = page.locator('.todo-count strong');
    await expect(badge).toHaveText('3');
  });

  // TC-011: Input field ARIA label
  test('Input field ARIA label', async ({ page }) => {
    const input = page.locator('.new-todo');
    await expect(input).toHaveAttribute('placeholder', 'What needs to be done?');
  });

  // TC-012: Keyboard navigation
  test('Keyboard navigation through list', async ({ page }) => {
    const input = page.locator('.new-todo');
    await input.fill('Nav test'); await input.press('Enter');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ─── Status Badges ────────────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; cls: string }> = {
    completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    running: { label: "Running", cls: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30" },
    pending: { label: "Pending", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    error: { label: "Error", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function TestStatusIcon({ status }: { status: TestStatus }) {
  if (status === "pass") return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === "fail") return <X className="h-4 w-4 text-red-400" />;
  if (status === "skip") return <Minus className="h-4 w-4 text-yellow-400" />;
  return <Clock className="h-4 w-4 text-white/40" />;
}

function StepStatusDot({ status }: { status: StepStatus }) {
  const cls: Record<StepStatus, string> = {
    complete: "bg-emerald-400",
    running: "bg-[var(--accent)] animate-pulse",
    pending: "bg-white/20",
    error: "bg-red-400",
  };
  return <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${cls[status]}`} />;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaBar({ session }: { session: Session }) {
  const summary = session.summary as Record<string, number> | null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-[var(--accent)]" />
          <a
            href={session.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-[var(--accent)] transition-colors underline underline-offset-2 truncate max-w-[260px]"
          >
            {session.target_url}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Calendar className="h-4 w-4" />
          {formatDate(session.created_at)}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Layers className="h-4 w-4" />
          <span className="capitalize">{session.test_framework}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Settings className="h-4 w-4" />
          <span className="capitalize">{session.agent_mode}</span>
        </div>
      </div>
      <SessionStatusBadge status={session.status} />
      {summary && (
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400 font-semibold">{summary.passed} passed</span>
          <span className="text-red-400 font-semibold">{summary.failed} failed</span>
          <span className="text-white/40">{formatDuration(summary.duration_ms)}</span>
        </div>
      )}
    </div>
  );
}

function ChatReplay({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="h-8 w-8 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center flex-shrink-0 mt-1">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
            </div>
          )}
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-white rounded-tr-sm"
                : "bg-white/5 border border-white/10 text-white/85 rounded-tl-sm"
            }`}
          >
            <p>{msg.content}</p>
            <p className="mt-1.5 text-xs text-white/30">{formatDate(msg.created_at)}</p>
          </div>
          {msg.role === "user" && (
            <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-white/60">U</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

type ArtifactTab = "results" | "script" | "excel";

function ArtifactsPanel({ results, script }: { results: TestResult[]; script: string }) {
  const [activeTab, setActiveTab] = useState<ArtifactTab>("results");

  const tabs: { id: ArtifactTab; label: string; icon: React.ReactNode }[] = [
    { id: "results", label: "Test Results", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "script", label: "Playwright Script", icon: <Terminal className="h-4 w-4" /> },
    { id: "excel", label: "Excel Preview", icon: <Table className="h-4 w-4" /> },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "results" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 text-left font-medium w-8"></th>
                  <th className="pb-3 text-left font-medium">ID</th>
                  <th className="pb-3 text-left font-medium">Test Name</th>
                  <th className="pb-3 text-left font-medium">Category</th>
                  <th className="pb-3 text-left font-medium">Priority</th>
                  <th className="pb-3 text-left font-medium">Duration</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((r) => (
                  <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-2">
                      <TestStatusIcon status={r.status} />
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-white/40">{r.test_case_id}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-white/90 font-medium">{r.test_name}</p>
                        {r.error_message && (
                          <p className="text-red-400/80 text-xs mt-0.5 max-w-xs truncate">{r.error_message}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-white/50">{r.category ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          r.priority === "High"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-white/50">{formatDuration(r.duration_ms)}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          r.status === "pass"
                            ? "text-emerald-400"
                            : r.status === "fail"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "script" && (
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-mono">todomvc.spec.ts</span>
                <span className="text-xs bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 px-2 py-0.5 rounded-full">
                  Playwright
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
            </div>
            <pre className="bg-black/40 border border-white/10 rounded-xl p-5 overflow-x-auto text-xs leading-relaxed font-mono text-white/75 max-h-[480px] overflow-y-auto">
              <code>{script}</code>
            </pre>
          </div>
        )}

        {activeTab === "excel" && (
          <div className="overflow-x-auto">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/60">test-cases-todomvc.xlsx — Preview (first 8 rows)</span>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-600/20 border border-emerald-500/30">
                  {["Test Case ID", "Test Name", "Description", "Category", "Priority", "Expected Result", "Status", "Duration"].map(
                    (h) => (
                      <th
                        key={h}
                        className="border border-white/10 px-3 py-2 text-left text-white/70 font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {MOCK_RESULTS.slice(0, 8).map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border border-white/5 ${i % 2 === 0 ? "bg-white/3" : "bg-white/[0.015]"} hover:bg-white/8 transition-colors`}
                  >
                    <td className="border border-white/5 px-3 py-2 font-mono text-white/50">{r.test_case_id}</td>
                    <td className="border border-white/5 px-3 py-2 text-white/80 whitespace-nowrap">{r.test_name}</td>
                    <td className="border border-white/5 px-3 py-2 text-white/50 max-w-[200px] truncate">{r.description}</td>
                    <td className="border border-white/5 px-3 py-2 text-white/60">{r.category}</td>
                    <td className="border border-white/5 px-3 py-2">
                      <span className={r.priority === "High" ? "text-red-400" : "text-yellow-400"}>{r.priority}</span>
                    </td>
                    <td className="border border-white/5 px-3 py-2 text-white/50 max-w-[160px] truncate">
                      {r.description}
                    </td>
                    <td className="border border-white/5 px-3 py-2">
                      <span className={r.status === "pass" ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="border border-white/5 px-3 py-2 font-mono text-white/40">{formatDuration(r.duration_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StepsTimeline({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-semibold text-white">Agent Reasoning Steps</span>
          <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{steps.length}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/10" />
            <div className="flex flex-col gap-5">
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex gap-4 pl-1"
                >
                  <StepStatusDot status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white/90">{step.title}</p>
                      <span className="text-xs text-white/30 font-mono capitalize bg-white/5 px-2 py-0.5 rounded">
                        {step.step_type}
                      </span>
                    </div>
                    {step.detail && <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{step.detail}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-white/25">
                      <span>Started {formatDate(step.created_at)}</span>
                      {step.completed_at && <span>Done {formatDate(step.completed_at)}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadPanel({ artifacts }: { artifacts: Artifact[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    script: <Terminal className="h-5 w-5 text-[var(--accent)]" />,
    excel: <Table className="h-5 w-5 text-emerald-400" />,
    "bug-report": <AlertCircle className="h-5 w-5 text-red-400" />,
    log: <FileText className="h-5 w-5 text-white/50" />,
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="text-sm font-semibold text-white">Download Artifacts</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {artifacts.map((art) => (
          <motion.button
            key={art.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all duration-200 group"
          >
            {iconMap[art.artifact_type] ?? <FileText className="h-5 w-5 text-white/40" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                {art.file_name}
              </p>
              <p className="text-xs text-white/35">{formatBytes(art.size_bytes)}</p>
            </div>
            <Download className="h-4 w-4 text-white/25 group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function SummaryStats({ summary }: { summary: Record<string, number> | null }) {
  if (!summary) return null;
  const total = summary.total ?? 0;
  const passed = summary.passed ?? 0;
  const failed = summary.failed ?? 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const stats = [
    { label: "Total Tests", value: String(total), icon: <Layers className="h-5 w-5" />, cls: "text-white/80" },
    { label: "Passed", value: String(passed), icon: <CheckCircle className="h-5 w-5" />, cls: "text-emerald-400" },
    { label: "Failed", value: String(failed), icon: <XCircle className="h-5 w-5" />, cls: "text-red-400" },
    { label: "Pass Rate", value: `${passRate}%`, icon: <Activity className="h-5 w-5" />, cls: "text-[var(--accent)]" },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={scaleIn}
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
        >
          <div className={`flex justify-center mb-1 ${s.cls}`}>{s.icon}</div>
          <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
          <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const session = MOCK_SESSION;
  const summary = session.summary as Record<string, number> | null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Breadcrumb */}
        <Reveal>
          <nav className="flex items-center gap-2 text-sm text-white/40">
            <Link href="/history" className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              History
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/70 truncate max-w-[300px]">{session.title ?? session.target_url}</span>
          </nav>
        </Reveal>

        {/* Page Title */}
        <Reveal delay={0.05}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {session.title ?? "Session Detail"}
              </h1>
              <p className="text-sm text-white/45 mt-1 font-mono">{session.id}</p>
            </div>
            <SessionStatusBadge status={session.status} />
          </div>
        </Reveal>

        {/* Meta Bar */}
        <Reveal delay={0.08}>
          <MetaBar session={session} />
        </Reveal>

        {/* Summary Stats */}
        <Reveal delay={0.1}>
          <SummaryStats summary={summary} />
        </Reveal>

        {/* Main Grid: Chat + Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Replay */}
          <Reveal className="lg:col-span-2" delay={0.12}>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 h-full">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-white">Chat Replay</h2>
                <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                  {MOCK_MESSAGES.length} messages
                </span>
              </div>
              <ChatReplay messages={MOCK_MESSAGES} />
            </div>
          </Reveal>

          {/* Steps Timeline */}
          <Reveal delay={0.15}>
            <StepsTimeline steps={MOCK_STEPS} />
          </Reveal>
        </div>

        {/* Artifacts Panel */}
        <Reveal delay={0.18}>
          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--accent)]" />
              Artifacts
            </h2>
            <ArtifactsPanel results={MOCK_RESULTS} script={PLAYWRIGHT_SCRIPT} />
          </div>
        </Reveal>

        {/* Download Panel */}
        <Reveal delay={0.2}>
          <DownloadPanel artifacts={MOCK_ARTIFACTS} />
        </Reveal>

      </div>
    </main>
  );
}