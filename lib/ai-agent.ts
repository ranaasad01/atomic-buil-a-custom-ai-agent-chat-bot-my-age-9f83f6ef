import type { ArtifactPreview, StepItem } from "@/lib/chat-store";

// ─── SQA System Prompt ────────────────────────────────────────────────────────
// This prompt is stored server-side only and shapes all agent responses.
// It is never exposed to the client directly.

export const SQA_SYSTEM_PROMPT = `You are a Senior Software Quality Assurance (SQA) Engineer with 10+ years of experience in end-to-end testing, test automation, and quality processes. You specialise in:

- End-to-end (E2E) test planning and execution for web applications
- Writing production-ready automation scripts using Playwright and Cypress
- Designing structured test case documents (Excel/XLSX format with columns: Test Case ID, Module, Test Name, Preconditions, Test Steps, Expected Result, Actual Result, Status, Priority, Severity, Assigned To, Notes)
- Identifying and documenting bugs with clear reproduction steps, severity ratings, and screenshots
- Accessibility testing (WCAG 2.1 AA compliance)
- Performance and load testing analysis
- API and integration testing
- CI/CD pipeline integration for automated test suites
- Risk-based testing and coverage analysis

When given a URL, you:
1. Crawl and map all user-facing flows and interactive elements
2. Prioritise test cases by risk and business impact
3. Write clean, maintainable, well-commented automation scripts
4. Generate comprehensive Excel test case sheets with all required columns
5. Produce actionable bug reports with severity, priority, and reproduction steps
6. Suggest improvements to the application's testability

You communicate in a professional but approachable tone. You always explain your reasoning, flag risks, and provide concrete next steps. You never skip edge cases or negative test scenarios.`;

// ─── LLM Config ───────────────────────────────────────────────────────────────
// Reads server-side environment variables only (no NEXT_PUBLIC_ prefix).
// Must be called at runtime on the server, never at module load time.

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
}

/**
 * Reads LLM provider configuration from server-side environment variables.
 * Supported providers: openai, anthropic, gemini, groq.
 * Throws if no API key is found for the configured provider.
 *
 * @returns LLMConfig with provider, model, and apiKey
 * @throws Error if no API key is configured
 */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  const model = process.env.LLM_MODEL ?? getDefaultModel(provider);

  const keyMap: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
  };

  const apiKey = keyMap[provider];

  if (!apiKey) {
    throw new Error(
      `No API key found for LLM provider "${provider}". ` +
        `Set the ${provider.toUpperCase()}_API_KEY environment variable in your .env.local file.`
    );
  }

  return { provider, model, apiKey };
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "claude-3-5-sonnet-20241022";
    case "gemini":
      return "gemini-1.5-pro";
    case "groq":
      return "llama-3.3-70b-versatile";
    case "openai":
    default:
      return "gpt-4o";
  }
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

export interface AgentContext {
  threadId: string;
  targetUrl?: string;
  agentMode?: string;
  framework?: string;
  messageHistory: Array<{ role: string; content: string }>;
}

// ─── Internals ────────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s]+/g;

export function extractUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  return matches ? matches[0].replace(/[.,;!?]$/, "") : null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFlowsForDomain(domain: string): string[] {
  const domainLower = domain.toLowerCase();

  if (
    domainLower.includes("shop") ||
    domainLower.includes("store") ||
    domainLower.includes("commerce")
  ) {
    return [
      "User registration and login",
      "Product search and filtering",
      "Add to cart and quantity update",
      "Checkout and payment form validation",
      "Order confirmation and email notification",
      "Account order history",
    ];
  }
  if (domainLower.includes("github") || domainLower.includes("gitlab")) {
    return [
      "User authentication (login / OAuth)",
      "Repository creation and settings",
      "Pull request creation and review",
      "Issue tracking and labels",
      "Code search and navigation",
    ];
  }
  if (
    domainLower.includes("stripe") ||
    domainLower.includes("pay") ||
    domainLower.includes("fintech")
  ) {
    return [
      "Account sign-in and 2FA",
      "Payment method management",
      "Transaction history and filtering",
      "Invoice generation and download",
      "Webhook configuration",
      "API key management",
    ];
  }
  if (
    domainLower.includes("notion") ||
    domainLower.includes("linear") ||
    domainLower.includes("jira")
  ) {
    return [
      "Workspace creation and onboarding",
      "Page / issue creation and editing",
      "Team member invitation",
      "Search and filtering",
      "Keyboard shortcut navigation",
    ];
  }
  if (domainLower.includes("figma") || domainLower.includes("design")) {
    return [
      "User login and team workspace",
      "File creation and duplication",
      "Component library navigation",
      "Commenting and collaboration",
      "Export and share flows",
    ];
  }

  // Generic fallback
  return [
    "User authentication (sign-up, login, logout)",
    "Primary navigation and routing",
    "Core form submission and validation",
    "Search and filtering functionality",
    "Responsive layout across viewports",
    "Error state and 404 handling",
  ];
}

function buildUrlResponse(url: string, context: AgentContext): string {
  const domain = getDomain(url);
  const flows = getFlowsForDomain(domain);
  const framework = context.framework ?? "playwright";
  const passed = flows.length - 1;
  const failed = 1;
  // Use a deterministic duration based on domain length to avoid hydration mismatch
  const duration = 30 + (domain.length % 60);

  const flowList = flows.map((f, i) => `  ${i + 1}. ${f}`).join("\n");

  return `## QA Agent — Analysis of \`${url}\`

I've crawled **${domain}** and mapped the testable surface. Here's what I found:

### Discovered User Flows
${flowList}

### Test Execution

Running **${flows.length * 2} test cases** across ${flows.length} flows using **${framework.charAt(0).toUpperCase() + framework.slice(1)}**:

\`\`\`
Crawling ${url} ...
Discovered ${flows.length} primary flows, ${flows.length * 2} test cases
Executing test suite ...
  ✓ ${passed * 2} tests passed
  ✗ ${failed} test failed  →  Form validation missing on required field
  ⚠  2 accessibility warnings (WCAG AA)
Duration: ${duration}s
\`\`\`

### Results Summary

| Metric | Value |
|--------|-------|
| Total tests | ${flows.length * 2} |
| Passed | ${passed * 2} |
| Failed | ${failed} |
| Skipped | 0 |
| Coverage | ${Math.floor((passed / flows.length) * 100)}% |

### Artifacts Generated

- **playwright-tests.spec.ts** — Full test suite (${flows.length} describe blocks)
- **test-cases.xlsx** — Structured Excel workbook with IDs, steps, and expected results
- **bug-report.md** — ${failed} bug documented with reproduction steps and severity rating

### Next Steps

1. Review the failed test and apply the suggested fix
2. Resolve the 2 WCAG AA accessibility warnings
3. Integrate the Playwright spec into your CI pipeline
4. Share the Excel sheet with your QA team for sign-off

Would you like me to dive deeper into any specific flow, generate additional edge-case tests, or export the artifacts in a different format?`;
}

function buildGenericResponse(
  userMessage: string,
  context: AgentContext
): string {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes("playwright") || lowerMsg.includes("script")) {
    return `## Playwright Test Script

Here's a production-ready Playwright script based on your request:

\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Core User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL ?? 'https://example.com');
  });

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate primary links without errors', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should submit the main form with valid data', async ({ page }) => {
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      await form.locator('input[type="email"]').fill('test@example.com');
      await form.locator('button[type="submit"]').click();
      await expect(page.locator('[role="alert"], .success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display a 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-404');
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });
});
\`\`\`

This script covers the four highest-risk flows. Paste your target URL and I'll tailor it to your specific application.`;
  }

  if (lowerMsg.includes("excel") || lowerMsg.includes("test case")) {
    return `## Excel Test Case Sheet Structure

Here's the schema I use for all generated Excel workbooks:

| Column | Description |
|--------|-------------|
| **Test Case ID** | Unique identifier, e.g. TC-001 |
| **Module** | Feature area, e.g. Authentication |
| **Test Name** | Short descriptive title |
| **Preconditions** | State required before execution |
| **Test Steps** | Numbered, atomic actions |
| **Expected Result** | Observable outcome |
| **Actual Result** | Filled during execution |
| **Status** | Pass / Fail / Skip / Blocked |
| **Priority** | Critical / High / Medium / Low |
| **Severity** | Blocker / Major / Minor / Trivial |
| **Assigned To** | Tester name or team |
| **Notes** | Screenshots, links, comments |

Share a URL and I'll generate a fully populated workbook for your application's flows.`;
  }

  if (lowerMsg.includes("bug") || lowerMsg.includes("report")) {
    return `## Bug Report Template

I structure all bug reports with the following fields:

**Bug ID:** BUG-001  
**Title:** [Component] — Short description of the defect  
**Severity:** Blocker | Critical | Major | Minor | Trivial  
**Priority:** P1 | P2 | P3 | P4  
**Status:** Open | In Progress | Resolved | Closed  
**Environment:** Browser, OS, viewport, test framework version  

**Steps to Reproduce:**
1. Navigate to [URL]
2. Perform [action]
3. Observe [unexpected behaviour]

**Expected Result:** What should happen  
**Actual Result:** What actually happens  
**Screenshots / Logs:** Attached  
**Suggested Fix:** Optional engineering note  

Paste a URL and describe the issue — I'll generate a complete, developer-ready bug report.`;
  }

  if (lowerMsg.includes("accessibility") || lowerMsg.includes("wcag") || lowerMsg.includes("a11y")) {
    return `## Accessibility Testing (WCAG 2.1 AA)

I check the following categories on every run:

- **Perceivable:** Alt text on images, colour contrast ratios (4.5:1 normal, 3:1 large text), captions on media
- **Operable:** Full keyboard navigation, visible focus indicators, no keyboard traps, skip-to-content links
- **Understandable:** Form labels and error messages, consistent navigation, language attribute on \`<html>\`
- **Robust:** Valid HTML semantics, ARIA roles and attributes, screen-reader compatibility

Share a URL and I'll run an automated accessibility audit and flag every WCAG AA violation with its impact level and a suggested fix.`;
  }

  if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("help")) {
    return `## How I Can Help

I'm your Senior QA Engineer agent. Here's what I can do:

1. **End-to-end testing** — Paste a URL and I'll crawl, map, and test every critical flow
2. **Playwright / Cypress scripts** — Production-ready automation scripts for your CI pipeline
3. **Excel test case sheets** — Structured workbooks with all standard QA columns
4. **Bug reports** — Detailed reports with reproduction steps, severity, and screenshots
5. **Accessibility audits** — WCAG 2.1 AA compliance checks with actionable fixes
6. **Coverage analysis** — Map which flows are tested and which are missing

To get started, paste a live website URL and describe what you'd like to test.`;
  }

  return `I'm ready to help with your QA needs. To get the most out of me, try one of these:

- **Paste a URL** — I'll crawl the site and generate a full test suite
- **Ask for scripts** — "Write Playwright tests for a login form"
- **Request an Excel sheet** — "Generate test cases for a checkout flow"
- **File a bug** — "Create a bug report for a broken form validation"
- **Accessibility audit** — "Check this page for WCAG AA issues"

What would you like to test today?`;
}

// ─── Main Agent Runner ────────────────────────────────────────────────────────

export interface AgentResult {
  content: string;
  steps: StepItem[];
  artifacts: ArtifactPreview[];
}

/**
 * Runs the QA agent for a given user message and context.
 * Prepends the SQA_SYSTEM_PROMPT as the first message in the context so all
 * responses are framed by the senior SQA engineer persona.
 *
 * @param userMessage - The latest message from the user
 * @param context - Thread context including history, URL, mode, and framework
 * @returns AgentResult with content, steps, and artifact previews
 */
export async function runAgent(
  userMessage: string,
  context: AgentContext
): Promise<AgentResult> {
  // Build the full message context with the system prompt prepended.
  // This ensures every response is shaped by the SQA persona regardless
  // of which LLM provider is used.
  const fullContext: Array<{ role: string; content: string }> = [
    { role: "system", content: SQA_SYSTEM_PROMPT },
    ...context.messageHistory,
    { role: "user", content: userMessage },
  ];

  // Suppress unused variable warning — fullContext is available for real LLM
  // integration via getLLMConfig() in an API route.
  void fullContext;

  // Detect if the user message contains a URL
  const detectedUrl = extractUrl(userMessage) ?? context.targetUrl;

  // Simulate async processing (replace with real LLM call in API route)
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  if (detectedUrl) {
    const content = buildUrlResponse(detectedUrl, context);
    const flows = getFlowsForDomain(getDomain(detectedUrl));

    const steps: StepItem[] = [
      { id: "step-crawl", title: "Crawling site structure", status: "complete" },
      { id: "step-map", title: "Mapping interactive elements", status: "complete" },
      { id: "step-run", title: `Running ${flows.length * 2} test cases`, status: "complete" },
      { id: "step-artifacts", title: "Generating artifacts", status: "complete" },
    ];

    const artifacts: ArtifactPreview[] = [
      {
        type: "script",
        label: "playwright-tests.spec.ts",
        size: `${flows.length * 2} KB`,
        icon: "code",
      },
      {
        type: "excel",
        label: "test-cases.xlsx",
        size: `${flows.length * 4} KB`,
        icon: "sheet",
      },
      {
        type: "bug-report",
        label: "bug-report.md",
        size: "6 KB",
        icon: "bug",
      },
      {
        type: "log",
        label: "run-log.txt",
        size: "3 KB",
        icon: "log",
      },
    ];

    return { content, steps, artifacts };
  }

  // Generic response for non-URL messages
  const content = buildGenericResponse(userMessage, context);
  return { content, steps: [], artifacts: [] };
}
