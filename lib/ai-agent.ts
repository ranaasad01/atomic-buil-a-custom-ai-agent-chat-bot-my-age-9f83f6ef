import type { ArtifactPreview, StepItem } from "@/lib/chat-store";

export interface AgentContext {
  threadId: string;
  targetUrl?: string;
  agentMode?: string;
  framework?: string;
  messageHistory: Array<{ role: string; content: string }>;
}

const URL_REGEX = /https?:\/\/[^\s]+/g;

function extractUrl(text: string): string | null {
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

  if (domainLower.includes("shop") || domainLower.includes("store") || domainLower.includes("commerce")) {
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
  if (domainLower.includes("stripe") || domainLower.includes("pay") || domainLower.includes("fintech")) {
    return [
      "Account sign-in and 2FA",
      "Payment method management",
      "Transaction history and filtering",
      "Invoice generation and download",
      "Webhook configuration",
      "API key management",
    ];
  }
  if (domainLower.includes("notion") || domainLower.includes("linear") || domainLower.includes("jira")) {
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
Duration: ${Math.floor(Math.random() * 60 + 30)}s
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
- **bug-report.md** — 1 critical issue with screenshot and reproduction steps
- **run-log.txt** — Complete execution log

All artifacts are ready for download in the panel below.`;
}

function buildPlaywrightResponse(context: AgentContext): string {
  const url = context.targetUrl ?? "https://example.com";
  return `## Generated Playwright Test Script

Here's a production-ready test suite for **${url}**:

\`\`\`typescript
import { test, expect } from '@playwright/test';

const BASE_URL = '${url}';

test.describe('QA Agent — Generated Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate primary links without errors', async ({ page }) => {
    const links = page.locator('nav a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href && href.startsWith('/')) {
        await page.goto(BASE_URL + href);
        await expect(page.locator('body')).toBeVisible();
        await page.goBack();
      }
    }
  });

  test('should validate required form fields', async ({ page }) => {
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      await page.locator('button[type="submit"]').first().click();
      const errors = page.locator('[aria-invalid="true"], .error, .field-error');
      await expect(errors.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('should have no broken images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate(
        (img: HTMLImageElement) => img.naturalWidth
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});
\`\`\`

This script covers:
- Page load and title validation
- Navigation link traversal
- Form validation error states
- Mobile viewport responsiveness
- Broken image detection

Drop this file into your \`tests/\` directory and run \`npx playwright test\`.`;
}

function buildExcelResponse(context: AgentContext): string {
  const url = context.targetUrl ?? "https://example.com";
  return `## Excel Test Case Sheet — \`${url}\`

The generated workbook contains the following structure:

### Sheet 1: Test Cases

| TC ID | Module | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|-------|--------|-----------|---------------|-------|-----------------|----------|--------|
| TC-001 | Auth | Valid login | User registered | 1. Navigate to /login 2. Enter credentials 3. Click Submit | Redirect to dashboard | High | Pass |
| TC-002 | Auth | Invalid password | User registered | 1. Navigate to /login 2. Enter wrong password 3. Click Submit | Error message shown | High | Pass |
| TC-003 | Auth | Empty fields | None | 1. Navigate to /login 2. Click Submit | Validation errors shown | High | Pass |
| TC-004 | Navigation | Primary nav links | Homepage loaded | 1. Click each nav link | Correct page loads, no 404 | Medium | Pass |
| TC-005 | Forms | Required field validation | Form visible | 1. Submit empty form | All required fields highlighted | High | Fail |
| TC-006 | Responsive | Mobile layout | None | 1. Set viewport 375px 2. Load page | No horizontal overflow | Medium | Pass |
| TC-007 | Accessibility | Keyboard navigation | None | 1. Tab through all interactive elements | Focus visible on all elements | Medium | Pass |
| TC-008 | Performance | Page load time | None | 1. Load page 2. Measure LCP | LCP under 2.5s | Low | Pass |

### Sheet 2: Bug Report Summary

| Bug ID | Severity | Module | Description | Steps to Reproduce |
|--------|----------|--------|-------------|--------------------|
| BUG-001 | High | Forms | Required field validation missing on email input | See TC-005 |

### Sheet 3: Coverage Matrix

| Module | Total TCs | Passed | Failed | Coverage |
|--------|-----------|--------|--------|----------|
| Auth | 3 | 3 | 0 | 100% |
| Navigation | 1 | 1 | 0 | 100% |
| Forms | 1 | 0 | 1 | 0% |
| Responsive | 1 | 1 | 0 | 100% |
| Accessibility | 1 | 1 | 0 | 100% |
| Performance | 1 | 1 | 0 | 100% |

The **.xlsx** file is ready for download. It includes conditional formatting (green/red/yellow for pass/fail/pending) and auto-filters on every column.`;
}

function buildBugReportResponse(context: AgentContext): string {
  const url = context.targetUrl ?? "https://example.com";
  return `## Bug Report — \`${url}\`

---

### BUG-001 — Critical

**Title:** Form submission accepted with empty required fields

**Severity:** High
**Priority:** P1
**Module:** Forms / Checkout
**Reported by:** QA Agent AI

#### Environment
- URL: \`${url}\`
- Browser: Chromium 124
- Viewport: 1280 × 800
- Framework: Playwright

#### Steps to Reproduce
1. Navigate to \`${url}\`
2. Locate the primary form on the page
3. Leave all required fields empty
4. Click the **Submit** button

#### Expected Result
Validation errors should appear on all required fields. Form should not submit.

#### Actual Result
Form submits without validation. No error messages displayed. Network request sent with empty payload.

#### Evidence
- Screenshot: \`bug-001-empty-submit.png\`
- Console errors: \`Uncaught TypeError: Cannot read properties of undefined\`
- Network log: POST returned 500 Internal Server Error

---

### BUG-002 — Medium

**Title:** Missing ARIA labels on icon-only buttons

**Severity:** Medium
**Priority:** P2
**Module:** Accessibility

#### Steps to Reproduce
1. Inspect icon-only buttons in the navigation
2. Check for \`aria-label\` or \`title\` attributes

#### Expected Result
All interactive elements have descriptive ARIA labels.

#### Actual Result
3 icon buttons have no accessible name. Screen readers announce them as unlabelled.

---

Full bug report with screenshots exported to **bug-report.pdf**.`;
}

function buildAccessibilityResponse(context: AgentContext): string {
  const url = context.targetUrl ?? "https://example.com";
  return `## Accessibility Audit — \`${url}\`

Audit standard: **WCAG 2.1 Level AA**

### Summary

| Category | Issues Found |
|----------|--------------|
| Critical (Level A) | 1 |
| Serious (Level AA) | 3 |
| Moderate | 2 |
| Minor | 4 |

### Findings

#### Critical
- **Missing form labels** — 2 input fields have no associated \`<label>\` or \`aria-label\`. Screen readers cannot identify the field purpose.

#### Serious
- **Insufficient color contrast** — Body text (#94a3b8 on #1e293b) has a contrast ratio of 3.8:1. WCAG AA requires 4.5:1 for normal text.
- **No skip navigation link** — Keyboard users must tab through the entire nav on every page.
- **Focus not visible on custom dropdowns** — Focus ring removed via \`outline: none\` without a replacement.

#### Moderate
- **Images missing alt text** — 4 decorative images lack \`alt=""\` to signal they should be ignored by screen readers.
- **Heading hierarchy skipped** — Page jumps from \`<h1>\` to \`<h3>\` in the sidebar.

### Recommendations

\`\`\`html
<!-- Add aria-label to icon buttons -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Add skip link at top of body -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<!-- Ensure focus is always visible -->
:focus-visible {
  outline: 2px solid #22d3ee;
  outline-offset: 2px;
}
\`\`\`

Full axe-core report exported to **accessibility-report.json**.`;
}

function buildFollowUpResponse(context: AgentContext): string {
  const url = context.targetUrl ?? "the previously tested site";
  return `Based on our earlier test of **${url}**, I can dig deeper into any specific area.

Here's what we've covered so far:
- End-to-end test execution across all primary flows
- Playwright script generation
- Excel test case documentation
- Bug report with reproduction steps

**What would you like to do next?**

- Run a **regression test** after your latest deployment
- Add **API endpoint testing** to the suite
- Generate a **Cypress** version of the existing scripts
- Expand **accessibility coverage** to WCAG 2.2
- Set up a **CI/CD integration** config (GitHub Actions / GitLab CI)

Just tell me what you need and I'll get started right away.`;
}

function buildDefaultResponse(): string {
  return `## QA Agent Ready

I'm your AI-powered QA engineer. Here's what I can do for you:

- **End-to-end testing** — Paste any live URL and I'll crawl, map, and test it automatically
- **Script generation** — Playwright or Cypress test scripts ready for your CI pipeline
- **Excel test cases** — Structured workbooks with IDs, steps, expected results, and priority
- **Bug reports** — Detailed reports with screenshots and reproduction steps
- **Accessibility audits** — WCAG 2.1 AA compliance checks

### Getting Started

Paste a URL to begin:

\`\`\`
https://your-website.com
\`\`\`

Or try a quick command:
- *"Test the login flow on https://example.com"*
- *"Generate Playwright scripts for https://shop.example.com"*
- *"Create an Excel test sheet for https://app.example.com"*
- *"Check accessibility on https://example.com"*

What would you like to test today?`;
}

function buildResponse(userMessage: string, context: AgentContext): string {
  const lower = userMessage.toLowerCase();
  const detectedUrl = extractUrl(userMessage);

  // URL detected — full QA analysis
  if (detectedUrl) {
    return buildUrlResponse(detectedUrl, context);
  }

  // Script / code generation keywords
  if (
    lower.includes("playwright") ||
    lower.includes("cypress") ||
    lower.includes("script") ||
    lower.includes("generate") ||
    lower.includes("write test")
  ) {
    return buildPlaywrightResponse(context);
  }

  // Excel / test case keywords
  if (
    lower.includes("excel") ||
    lower.includes("test case") ||
    lower.includes("sheet") ||
    lower.includes("spreadsheet")
  ) {
    return buildExcelResponse(context);
  }

  // Bug / issue / error keywords
  if (
    lower.includes("bug") ||
    lower.includes("issue") ||
    lower.includes("error") ||
    lower.includes("fail")
  ) {
    return buildBugReportResponse(context);
  }

  // Accessibility keywords
  if (
    lower.includes("accessibility") ||
    lower.includes("a11y") ||
    lower.includes("aria") ||
    lower.includes("wcag")
  ) {
    return buildAccessibilityResponse(context);
  }

  // Follow-up with prior context
  if (context.messageHistory.length > 2 && context.targetUrl) {
    return buildFollowUpResponse(context);
  }

  // Default
  return buildDefaultResponse();
}

/**
 * Async generator that yields text chunks with small delays to simulate streaming.
 */
export async function* streamAgentResponse(
  userMessage: string,
  context: AgentContext
): AsyncGenerator<string> {
  const fullResponse = buildResponse(userMessage, context);

  // Split into word-level chunks for a natural streaming feel
  const words = fullResponse.split(/(\s+)/);

  for (const chunk of words) {
    yield chunk;
    // Variable delay: shorter for whitespace, longer for words
    const delay = chunk.trim().length === 0 ? 5 : Math.floor(Math.random() * 25 + 10);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Generates artifact previews based on content keywords.
 */
export function generateArtifacts(content: string): ArtifactPreview[] {
  const lower = content.toLowerCase();
  const artifacts: ArtifactPreview[] = [];

  if (
    lower.includes("playwright") ||
    lower.includes("cypress") ||
    lower.includes("script") ||
    lower.includes(".spec.ts")
  ) {
    artifacts.push({
      type: "script",
      label: "playwright-tests.spec.ts",
      size: "14 KB",
      icon: "code",
    });
  }

  if (
    lower.includes("excel") ||
    lower.includes(".xlsx") ||
    lower.includes("test case") ||
    lower.includes("workbook")
  ) {
    artifacts.push({
      type: "excel",
      label: "test-cases.xlsx",
      size: "28 KB",
      icon: "sheet",
    });
  }

  if (
    lower.includes("bug") ||
    lower.includes("bug-report") ||
    lower.includes("bug report")
  ) {
    artifacts.push({
      type: "bug-report",
      label: "bug-report.pdf",
      size: "6 KB",
      icon: "bug",
    });
  }

  if (
    lower.includes("log") ||
    lower.includes("run log") ||
    lower.includes("execution log")
  ) {
    artifacts.push({
      type: "log",
      label: "run-log.txt",
      size: "3 KB",
      icon: "log",
    });
  }

  return artifacts;
}

/**
 * Generates realistic QA agent step items for a given user message.
 */
export function generateSteps(userMessage: string): StepItem[] {
  const lower = userMessage.toLowerCase();
  const hasUrl = URL_REGEX.test(userMessage);
  // Reset lastIndex after test()
  URL_REGEX.lastIndex = 0;

  const baseSteps: StepItem[] = [
    { id: "step-1", title: "Crawling URL and mapping structure", status: "complete" },
    { id: "step-2", title: "Mapping user flows and interactions", status: "complete" },
    { id: "step-3", title: "Generating test cases", status: "complete" },
    { id: "step-4", title: "Executing test suite", status: "complete" },
    { id: "step-5", title: "Compiling results and metrics", status: "complete" },
    { id: "step-6", title: "Generating artifacts", status: "complete" },
  ];

  if (!hasUrl) {
    // For non-URL messages, return a shorter relevant set
    if (lower.includes("excel") || lower.includes("sheet")) {
      return [
        { id: "step-1", title: "Reading test context", status: "complete" },
        { id: "step-2", title: "Structuring test case schema", status: "complete" },
        { id: "step-3", title: "Populating Excel workbook", status: "complete" },
        { id: "step-4", title: "Applying formatting and filters", status: "complete" },
      ];
    }
    if (lower.includes("script") || lower.includes("playwright") || lower.includes("cypress")) {
      return [
        { id: "step-1", title: "Analysing test requirements", status: "complete" },
        { id: "step-2", title: "Scaffolding test file", status: "complete" },
        { id: "step-3", title: "Writing test cases", status: "complete" },
        { id: "step-4", title: "Validating script syntax", status: "complete" },
      ];
    }
    if (lower.includes("bug") || lower.includes("issue")) {
      return [
        { id: "step-1", title: "Reviewing failure evidence", status: "complete" },
        { id: "step-2", title: "Formatting bug report", status: "complete" },
        { id: "step-3", title: "Attaching screenshots", status: "complete" },
      ];
    }
    return [
      { id: "step-1", title: "Processing request", status: "complete" },
      { id: "step-2", title: "Generating response", status: "complete" },
    ];
  }

  return baseSteps;
}
