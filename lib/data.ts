export interface NavLink {
  label: string;
  href: string;
  key: string;
}

export interface Brand {
  name: string;
  tagline: string;
  version: string;
}

export interface Session {
  id: string;
  target_url: string;
  title: string | null;
  agent_mode: string;
  test_framework: string;
  output_types: string[];
  status: string;
  summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentStep {
  id: string;
  session_id: string;
  step_index: number;
  step_type: string;
  title: string;
  detail: string | null;
  status: "running" | "complete" | "pending" | "error";
  created_at: string;
  completed_at: string | null;
}

export interface TestResult {
  id: string;
  session_id: string;
  test_case_id: string;
  test_name: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: "pass" | "fail" | "skip" | "pending";
  error_message: string | null;
  screenshot_path: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface Artifact {
  id: string;
  session_id: string;
  artifact_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  framework: string | null;
  created_at: string;
}

export const BRAND: Brand = {
  name: "QA Agent AI",
  tagline: "AI-powered end-to-end testing, one URL at a time.",
  version: "BETA",
};

export const navLinks: NavLink[] = [
  { label: "Chat", href: "/", key: "chat" },
  { label: "History", href: "/history", key: "history" },
];

export const AGENT_MODES = [
  { value: "autonomous", label: "Autonomous" },
  { value: "hybrid", label: "Hybrid" },
  { value: "instruction", label: "Instruction-driven" },
] as const;

export const TEST_FRAMEWORKS = [
  { value: "playwright", label: "Playwright" },
  { value: "cypress", label: "Cypress" },
  { value: "both", label: "Both" },
] as const;

export const OUTPUT_TYPES = [
  { value: "scripts", label: "Test Scripts" },
  { value: "excel", label: "Excel Test Cases" },
  { value: "bug_report", label: "Bug Report" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pass: "text-[var(--success)]",
  fail: "text-[var(--destructive)]",
  pending: "text-[var(--warning)]",
  running: "text-[var(--accent)]",
  complete: "text-[var(--success)]",
  error: "text-[var(--destructive)]",
};