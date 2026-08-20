"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { Globe, FileSpreadsheet, Code2, Bug, Zap, CheckCircle2, ArrowRight, Play, Shield, BarChart3, Layers, MessageSquare, Clock, Star } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    icon: Globe,
    title: "Live URL Testing",
    desc: "Paste any live website URL and the agent crawls, maps, and tests every critical user flow automatically.",
    accent: true,
  },
  {
    icon: Code2,
    title: "Script Generation",
    desc: "Generates production-ready Playwright or Cypress test scripts you can drop straight into your CI pipeline.",
    accent: false,
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Test Cases",
    desc: "Exports a structured Excel workbook with test case IDs, steps, expected results, and priority ratings.",
    accent: false,
  },
  {
    icon: Bug,
    title: "Bug Reports",
    desc: "Captures screenshots, console errors, and network failures, then formats them into actionable bug reports.",
    accent: false,
  },
  {
    icon: Shield,
    title: "Coverage Analysis",
    desc: "Maps every route and interaction, then shows you exactly which flows are covered and which are missing.",
    accent: false,
  },
  {
    icon: BarChart3,
    title: "Test Analytics",
    desc: "Tracks pass/fail trends across sessions so you can spot regressions before they reach production.",
    accent: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Share a URL",
    desc: "Type or paste the URL of any live website into the chat. The agent accepts staging, production, or localhost tunnels.",
  },
  {
    step: "02",
    title: "Describe your goal",
    desc: "Tell the agent what to test: a checkout flow, a login form, a full regression sweep. Plain English works perfectly.",
  },
  {
    step: "03",
    title: "Agent executes",
    desc: "QA Agent AI crawls the site, runs interactions, captures evidence, and streams live progress back to you.",
  },
  {
    step: "04",
    title: "Download artifacts",
    desc: "Grab your test scripts, Excel sheets, and bug reports from the session panel. Ready to share with your team.",
  },
];

const FRAMEWORKS = [
  { name: "Playwright", tag: "Microsoft", color: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20" },
  { name: "Cypress", tag: "Open Source", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { name: "Excel / XLSX", tag: "Universal", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { name: "JSON Reports", tag: "CI/CD Ready", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
];

const STATS = [
  { value: "10x", label: "Faster than manual QA" },
  { value: "95%", label: "Test coverage on first run" },
  { value: "3 min", label: "From URL to test suite" },
  { value: "100%", label: "Reproducible scripts" },
];

const TESTIMONIALS = [
  {
    quote: "We went from zero automated tests to a full Playwright suite in one afternoon. The Excel export alone saved us two days of documentation work.",
    author: "Priya Mehta",
    role: "QA Lead, FinTech startup",
    stars: 5,
  },
  {
    quote: "I pasted our staging URL, described the checkout flow, and got a working Cypress script in minutes. This is the future of QA.",
    author: "Daniel Osei",
    role: "Senior Engineer, E-commerce",
    stars: 5,
  },
  {
    quote: "The bug reports with screenshots are incredibly detailed. Our developers stopped asking for reproduction steps because everything is already there.",
    author: "Sofia Reyes",
    role: "Product Manager, SaaS platform",
    stars: 5,
  },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="flex flex-col">
      {/* ── Hero ── */}
      <Reveal>
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[var(--primary-glow)] blur-[120px] opacity-40" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-[var(--accent-glow)] blur-[100px] opacity-30" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25 tracking-wide">
                  <Zap className="w-3 h-3" />
                  AI-Powered QA Automation
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]"
              >
                Test any website{" "}
                <span className="gradient-text">end-to-end</span>{" "}
                in minutes
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-[var(--muted-foreground)] leading-relaxed max-w-xl text-pretty"
              >
                Paste a URL, describe what to test, and let the AI agent crawl, script, and execute. Get Playwright scripts, Excel test sheets, and bug reports delivered in a single conversation.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/home-chat-interface"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary)]/90 transition-all duration-300 glow-primary shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(99,102,241,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <Play className="w-4 h-4" />
                  Start Testing Free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-white/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  See how it works
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 pt-1">
                {["No credit card required", "Free tier available", "Works on any live URL"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: mock terminal */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="hidden lg:block"
            >
              <div className="gradient-border card-shadow rounded-2xl overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
                  <span className="w-3 h-3 rounded-full bg-[var(--destructive)] opacity-80" />
                  <span className="w-3 h-3 rounded-full bg-[var(--warning)] opacity-80" />
                  <span className="w-3 h-3 rounded-full bg-[var(--success)] opacity-80" />
                  <span className="ml-3 text-xs text-[var(--muted-foreground)] font-mono">qa-agent — session #42</span>
                </div>
                {/* Terminal body */}
                <div className="bg-[#0d1117] p-5 font-mono text-xs leading-relaxed min-h-[320px] space-y-2">
                  <p className="text-[var(--muted-foreground)]">$ qa-agent start --url https://demo.shop.com</p>
                  <p className="text-[var(--accent)]">✓ Crawling site structure...</p>
                  <p className="text-[var(--muted-foreground)] pl-2">Found 14 pages, 6 forms, 3 API endpoints</p>
                  <p className="text-[var(--accent)]">✓ Mapping test surface...</p>
                  <p className="text-[var(--muted-foreground)] pl-2">Identified: auth, cart, checkout, search</p>
                  <p className="text-[var(--accent)]">✓ Running 12 test cases...</p>
                  <p className="text-green-400 pl-2">PASS  login-flow.spec.ts (1.2s)</p>
                  <p className="text-green-400 pl-2">PASS  add-to-cart.spec.ts (0.8s)</p>
                  <p className="text-[var(--destructive)] pl-2">FAIL  checkout-email-validation.spec.ts</p>
                  <p className="text-[var(--accent)]">✓ Generating artifacts...</p>
                  <p className="text-green-400">playwright-tests.spec.ts  14 KB</p>
                  <p className="text-green-400">test-cases.xlsx           28 KB</p>
                  <p className="text-green-400">bug-report.pdf             6 KB</p>
                  <p className="text-[var(--muted-foreground)] mt-3">Session complete. 10 passed, 1 failed, 1 skipped.<span className="streaming-cursor" /></p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Stats bar ── */}
      <Reveal>
        <section className="border-y border-[var(--border)] bg-[var(--card)]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {STATS.map((stat) => (
                <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                  <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Capabilities ── */}
      <Reveal>
        <section id="features" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mb-4 tracking-wide">
                Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Everything your QA team needs
              </h2>
              <p className="mt-4 text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
                One agent. Every artifact. From raw URL to production-ready test suite.
              </p>
            </div>

            {/* Bento grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                const isLarge = i === 0;
                return (
                  <motion.div
                    key={cap.title}
                    variants={fadeInUp}
                    className={cn(
                      "relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col gap-4 card-shadow transition-all duration-300 hover:border-[var(--primary)]/40 hover:-translate-y-0.5",
                      isLarge && "md:col-span-2 md:row-span-1"
                    )}
                  >
                    {cap.accent && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5 pointer-events-none" />
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      cap.accent
                        ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                        : "bg-[var(--border)]/60 text-[var(--muted-foreground)]"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-1">{cap.title}</h3>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{cap.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── How it works ── */}
      <Reveal>
        <section id="how-it-works" className="py-24 md:py-32 bg-[var(--card)]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-4 tracking-wide">
                How it works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance text-[var(--foreground)]">
                From URL to test suite in 4 steps
              </h2>
              <p className="mt-4 text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
                No configuration files. No boilerplate. Just describe what you need.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {HOW_IT_WORKS.map((step) => (
                <motion.div
                  key={step.step}
                  variants={fadeInUp}
                  className="relative flex flex-col gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] card-shadow"
                >
                  <span className="text-4xl font-black text-[var(--primary)]/20 leading-none">{step.step}</span>
                  <h3 className="font-semibold text-[var(--foreground)]">{step.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Frameworks ── */}
      <Reveal>
        <section className="py-16 border-y border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold tracking-widest text-[var(--muted-foreground)] uppercase mb-8">
              Outputs supported
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {FRAMEWORKS.map((fw) => (
                <span
                  key={fw.name}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium",
                    fw.color
                  )}
                >
                  {fw.name}
                  <span className="opacity-60 text-xs">{fw.tag}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section id="testimonials" className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mb-4 tracking-wide">
                Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Loved by QA teams worldwide
              </h2>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {TESTIMONIALS.map((t) => (
                <motion.div
                  key={t.author}
                  variants={fadeInUp}
                  className="flex flex-col gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] card-shadow"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{t.author}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Bottom CTA ── */}
      <Reveal>
        <section className="py-24 md:py-32 bg-[var(--card)]/40 border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div variants={fadeInUp}>
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/15 flex items-center justify-center mx-auto mb-4 glow-primary">
                  <Zap className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance text-[var(--foreground)]">
                  Ready to automate your QA?
                </h2>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                Join teams shipping with confidence. Paste your first URL and have a full test suite ready before your next standup.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/home-chat-interface"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary)]/90 transition-all duration-300 glow-primary shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(99,102,241,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <Play className="w-4 h-4" />
                  Start Testing Free
                </Link>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-white/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <Clock className="w-4 h-4" />
                  View History
                </Link>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-xs text-[var(--muted-foreground)]">
                No credit card required. Free tier available.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
