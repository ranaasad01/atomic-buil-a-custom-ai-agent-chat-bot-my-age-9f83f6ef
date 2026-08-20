"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Clock, Download, ChevronDown, ChevronRight, FileText, Terminal, Table, Activity, Globe, Calendar, Layers, Settings, AlertCircle, Check, X, Minus } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { type Session, type Message, type AgentStep, type TestResult, type Artifact } from "@/lib/data";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { getMessages, getThreads, type ChatMessage as StoredMessage, type Thread } from "@/lib/chat-store";

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
    step_type: "generate",
    title: "Generating test cases",
    detail: "Writing 12 test cases covering all discovered flows plus accessibility checks.",
    status: "complete",
    created_at: "2024-06-12T09:15:20Z",
    completed_at: "2024-06-12T09:16:45Z",
  },
  {
    id: "step_004",
    session_id: MOCK_SESSION.id,
    step_index: 3,
    step_type: "execute",
    title: "Executing test suite",
    detail: "Running 12 Playwright test cases against the live site.",
    status: "complete",
    created_at: "2024-06-12T09:16:45Z",
    completed_at: "2024-06-12T09:19:30Z",
  },
  {
    id: "step_005",
    session_id: MOCK_SESSION.id,
    step_index: 4,
    step_type: "report",
    title: "Generating artifacts",
    detail: "Compiling test scripts, Excel sheet, and bug report from results.",
    status: "complete",
    created_at: "2024-06-12T09:19:30Z",
    completed_at: "2024-06-12T09:19:55Z",
  },
];

const MOCK_TEST_RESULTS: TestResult[] = [
  {
    id: "tr_001",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-001",
    test_name: "Add a new todo item",
    description: "Verify that typing in the input and pressing Enter creates a new todo.",
    category: "CRUD",
    priority: "high",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 820,
    created_at: "2024-06-12T09:17:00Z",
  },
  {
    id: "tr_002",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-002",
    test_name: "Mark todo as complete",
    description: "Click the checkbox to toggle completion state.",
    category: "CRUD",
    priority: "high",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 640,
    created_at: "2024-06-12T09:17:05Z",
  },
  {
    id: "tr_003",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-003",
    test_name: "Delete a todo item",
    description: "Hover over a todo and click the destroy button.",
    category: "CRUD",
    priority: "high",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 710,
    created_at: "2024-06-12T09:17:10Z",
  },
  {
    id: "tr_004",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-004",
    test_name: "Edit todo on double-click",
    description: "Double-click a todo label to enter edit mode and save changes.",
    category: "CRUD",
    priority: "medium",
    status: "fail",
    error_message: "Element not interactable: .edit input not visible after dblclick event.",
    screenshot_path: null,
    duration_ms: 1240,
    created_at: "2024-06-12T09:17:20Z",
  },
  {
    id: "tr_005",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-005",
    test_name: "Filter: All todos",
    description: "Click 'All' filter and verify all todos are shown.",
    category: "Filter",
    priority: "medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 530,
    created_at: "2024-06-12T09:17:30Z",
  },
  {
    id: "tr_006",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-006",
    test_name: "Filter: Active todos",
    description: "Click 'Active' filter and verify only incomplete todos are shown.",
    category: "Filter",
    priority: "medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 490,
    created_at: "2024-06-12T09:17:35Z",
  },
  {
    id: "tr_007",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-007",
    test_name: "Filter: Active count badge",
    description: "Verify the item count badge updates correctly when todos are toggled.",
    category: "Filter",
    priority: "low",
    status: "fail",
    error_message: "Expected badge text '3 items left' but received '3 item left' (missing plural).",
    screenshot_path: null,
    duration_ms: 880,
    created_at: "2024-06-12T09:17:45Z",
  },
  {
    id: "tr_008",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-008",
    test_name: "Clear completed todos",
    description: "Click 'Clear completed' and verify completed todos are removed.",
    category: "CRUD",
    priority: "medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 620,
    created_at: "2024-06-12T09:17:55Z",
  },
  {
    id: "tr_009",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-009",
    test_name: "Toggle all todos",
    description: "Click the toggle-all checkbox to mark all todos complete.",
    category: "CRUD",
    priority: "medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 750,
    created_at: "2024-06-12T09:18:05Z",
  },
  {
    id: "tr_010",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-010",
    test_name: "Persist todos on reload",
    description: "Reload the page and verify todos are still present via localStorage.",
    category: "Persistence",
    priority: "high",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 1100,
    created_at: "2024-06-12T09:18:20Z",
  },
  {
    id: "tr_011",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-011",
    test_name: "Keyboard navigation on input",
    description: "Verify the main input is focusable and operable via keyboard only.",
    category: "Accessibility",
    priority: "high",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 430,
    created_at: "2024-06-12T09:18:30Z",
  },
  {
    id: "tr_012",
    session_id: MOCK_SESSION.id,
    test_case_id: "TC-012",
    test_name: "ARIA label on main input",
    description: "Verify the main input has an accessible aria-label attribute.",
    category: "Accessibility",
    priority: "medium",
    status: "pass",
    error_message: null,
    screenshot_path: null,
    duration_ms: 310,
    created_at: "2024-06-12T09:18:35Z",
  },
];

const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "art_001",
    session_id: MOCK_SESSION.id,
    artifact_type: "script",
    file_name: "playwright-tests.spec.ts",
    storage_path: "/artifacts/playwright-tests.spec.ts",
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
    storage_path: "/artifacts/test-cases.xlsx",
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
    storage_path: "/artifacts/bug-report.pdf",
    mime_type: "application/pdf",
    size_bytes: 6144,
    framework: null,
    created_at: "2024-06-12T09:19:50Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
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

function statusColor(status: string): string {
  switch (status) {
    case "pass":
    case "complete":
    case "completed":
      return "text-[var(--success)]";
    case "fail":
    case "error":
      return "text-[var(--destructive)]";
    case "running":
      return "text-[var(--accent)]";
    default:
      return "text-[var(--warning)]";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "pass":
    case "complete":
    case "completed":
      return "bg-[var(--success)]/10 border-[var(--success)]/20";
    case "fail":
    case "error":
      return "bg-[var(--destructive)]/10 border-[var(--destructive)]/20";
    case "running":
      return "bg-[var(--accent)]/10 border-[var(--accent)]/20";
    default:
      return "bg-[var(--warning)]/10 border-[var(--warning)]/20";
  }
}

function StatusIcon({ status, className }: { status: string; className?: string }) {
  const cls = `w-4 h-4 ${statusColor(status)} ${className ?? ""}`;
  switch (status) {
    case "pass":
    case "complete":
    case "completed":
      return <CheckCircle className={cls} />;
    case "fail":
    case "error":
      return <XCircle className={cls} />;
    case "running":
      return <Activity className={`${cls} animate-pulse`} />;
    case "skip":
      return <Minus className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

const tabVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─── Derived message type for display ────────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "results" | "artifacts">("overview");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Real data state (loaded from localStorage via chat-store)
  const [realSession, setRealSession] = useState<Session | null>(null);
  const [realMessages, setRealMessages] = useState<DisplayMessage[] | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setDataLoaded(true);
      return;
    }

    try {
      const threads = getThreads();
      const matchedThread = threads.find((t: Thread) => t.id === sessionId);

      if (matchedThread) {
        // Build a Session object from the thread
        const sessionFromThread: Session = {
          id: matchedThread.id,
          target_url: matchedThread.targetUrl ?? "",
          title: matchedThread.title ?? "Untitled Session",
          agent_mode: matchedThread.agentMode ?? "autonomous",
          test_framework: matchedThread.framework ?? "playwright",
          output_types: ["script", "excel", "bug-report"],
          status: "completed",
          summary: null,
          created_at: matchedThread.createdAt ?? new Date().toISOString(),
          updated_at: matchedThread.updatedAt ?? new Date().toISOString(),
        };
        setRealSession(sessionFromThread);

        // Load messages for this thread
        const storedMessages = getMessages(sessionId);
        const displayMessages: DisplayMessage[] = storedMessages.map((m: StoredMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.createdAt ?? new Date().toISOString(),
        }));
        setRealMessages(displayMessages);
      }
    } catch (err) {
      console.error("Failed to load session from chat-store:", err);
    } finally {
      setDataLoaded(true);
    }
  }, [sessionId]);

  // Resolve which data to display
  const session = realSession ?? MOCK_SESSION;
  const displayMessages: DisplayMessage[] =
    realMessages ??
    MOCK_MESSAGES.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }));
  const steps = MOCK_STEPS;
  const testResults = MOCK_TEST_RESULTS;
  const artifacts = MOCK_ARTIFACTS;

  const summary = session.summary as Record<string, number> | null;
  const totalTests = summary?.total ?? testResults.length;
  const passedTests = summary?.passed ?? testResults.filter((r) => r.status === "pass").length;
  const failedTests = summary?.failed ?? testResults.filter((r) => r.status === "fail").length;
  const skippedTests = summary?.skipped ?? testResults.filter((r) => r.status === "skip").length;
  const durationMs = summary?.duration_ms ?? 0;

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "messages", label: "Messages", icon: Terminal },
    { id: "results", label: "Test Results", icon: Table },
    { id: "artifacts", label: "Artifacts", icon: FileText },
  ] as const;

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <Activity className="w-5 h-5 animate-pulse text-[var(--accent)]" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Back + Header ── */}
        <Reveal>
          <div className="mb-8">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to History
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusBg(session.status)
                    } ${statusColor(session.status)}`}
                  >
                    <StatusIcon status={session.status} className="w-3 h-3" />
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">
                    {session.id.slice(0, 20)}...
                  </span>
                  {realSession && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                      Live Session
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight text-balance">
                  {session.title ?? "Untitled Session"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                    <Globe className="w-3.5 h-3.5" />
                    <a
                      href={session.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--accent)] transition-colors truncate max-w-xs"
                    >
                      {session.target_url}
                    </a>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(session.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                    <Layers className="w-3.5 h-3.5" />
                    {session.test_framework}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                    <Settings className="w-3.5 h-3.5" />
                    {session.agent_mode}
                  </span>
                </div>
              </div>

              {/* Stats strip */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center px-4 py-2 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20">
                  <div className="text-xl font-bold text-[var(--success)]">{passedTests}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Passed</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20">
                  <div className="text-xl font-bold text-[var(--destructive)]">{failedTests}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Failed</div>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                  <div className="text-xl font-bold text-[var(--warning)]">{skippedTests}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Skipped</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-6 border-b border-[var(--border)] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                  isActive
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Steps */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <h2 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[var(--accent)]" />
                    Agent Steps
                  </h2>
                  <div className="space-y-2">
                    {steps.map((step) => (
                      <div key={step.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                        <button
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
                        >
                          <StatusIcon status={step.status} />
                          <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                            {step.title}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] font-mono mr-2">
                            Step {step.step_index + 1}
                          </span>
                          {expandedStep === step.id ? (
                            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                          )}
                        </button>
                        {expandedStep === step.id && step.detail && (
                          <div className="px-4 pb-3 pt-0 border-t border-[var(--border)] bg-[var(--background)]/40">
                            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-2">
                              {step.detail}
                            </p>
                            {step.completed_at && (
                              <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">
                                Completed: {formatDate(step.completed_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="space-y-4">
                {/* Stats card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <h2 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent)]" />
                    Summary
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Total Tests</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">{totalTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Passed</span>
                      <span className="text-sm font-semibold text-[var(--success)]">{passedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Failed</span>
                      <span className="text-sm font-semibold text-[var(--destructive)]">{failedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Skipped</span>
                      <span className="text-sm font-semibold text-[var(--warning)]">{skippedTests}</span>
                    </div>
                    {durationMs > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                        <span className="text-sm text-[var(--muted-foreground)]">Duration</span>
                        <span className="text-sm font-semibold text-[var(--foreground)]">{formatDuration(durationMs)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pass rate bar */}
                  {totalTests > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
                        <span>Pass rate</span>
                        <span>{Math.round((passedTests / totalTests) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--success)] transition-all duration-700"
                          style={{ width: `${(passedTests / totalTests) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Config card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                  <h2 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[var(--accent)]" />
                    Configuration
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Framework</span>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 capitalize">{session.test_framework}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Agent Mode</span>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 capitalize">{session.agent_mode}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Outputs</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {session.output_types.map((ot) => (
                          <span
                            key={ot}
                            className="px-2 py-0.5 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                          >
                            {ot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Conversation
                </h2>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                  {displayMessages.length} messages
                </span>
                {realMessages && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                    Live data
                  </span>
                )}
              </div>
              <div className="divide-y divide-[var(--border)]">
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`px-6 py-4 ${
                      msg.role === "user" ? "bg-[var(--background)]/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          msg.role === "user"
                            ? "text-[var(--primary)]"
                            : msg.role === "system"
                            ? "text-[var(--warning)]"
                            : "text-[var(--accent)]"
                        }`}
                      >
                        {msg.role === "user" ? "You" : msg.role === "system" ? "System" : "QA Agent"}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results Tab */}
          {activeTab === "results" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
                <Table className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">Test Results</h2>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                  {testResults.length} test cases
                </span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {testResults.map((result) => (
                  <div key={result.id} className="overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedResult(expandedResult === result.id ? null : result.id)
                      }
                      className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/3 transition-colors"
                    >
                      <StatusIcon status={result.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--muted-foreground)]">
                            {result.test_case_id}
                          </span>
                          {result.category && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--border)] text-[var(--muted-foreground)]">
                              {result.category}
                            </span>
                          )}
                          {result.priority && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                result.priority === "high"
                                  ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                                  : result.priority === "medium"
                                  ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                  : "bg-[var(--border)] text-[var(--muted-foreground)]"
                              }`}
                            >
                              {result.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 truncate">
                          {result.test_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {result.duration_ms !== null && (
                          <span className="text-xs text-[var(--muted-foreground)] font-mono">
                            {result.duration_ms}ms
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
                      <div className="px-6 pb-4 border-t border-[var(--border)] bg-[var(--background)]/40">
                        {result.description && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-3 leading-relaxed">
                            {result.description}
                          </p>
                        )}
                        {result.error_message && (
                          <div className="mt-3 p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-3.5 h-3.5 text-[var(--destructive)]" />
                              <span className="text-xs font-semibold text-[var(--destructive)]">Error</span>
                            </div>
                            <p className="text-xs font-mono text-[var(--destructive)]/80 leading-relaxed">
                              {result.error_message}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artifacts Tab */}
          {activeTab === "artifacts" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Downloadable Artifacts</h2>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                    {artifacts.length} files
                  </span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 shrink-0">
                        <FileText className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {artifact.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {artifact.artifact_type}
                          </span>
                          {artifact.size_bytes !== null && (
                            <>
                              <span className="text-[var(--border)]">·</span>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {formatBytes(artifact.size_bytes)}
                              </span>
                            </>
                          )}
                          {artifact.framework && (
                            <>
                              <span className="text-[var(--border)]">·</span>
                              <span className="text-xs text-[var(--muted-foreground)] capitalize">
                                {artifact.framework}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatDate(artifact.created_at)}
                        </span>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                          onClick={() => {
                            // In a real app, trigger download from storage_path
                            console.log("Download:", artifact.storage_path);
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
