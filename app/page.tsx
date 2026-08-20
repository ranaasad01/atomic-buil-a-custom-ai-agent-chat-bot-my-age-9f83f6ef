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
      <Reveal className="relative overflow-hidden">
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-24 text-center">
          {/* Background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/8 blur-[120px]" />
            <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
          </div>

          {/* Badge */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {t("hero.badge")}
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="max-w-4xl text-balance text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-6xl lg:text-7xl"
          >
            {t("hero.headline1")}{" "}
            <span className="text-[var(--accent)]">{t("hero.headlineAccent")}</span>{" "}
            {t("hero.headline2")}
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[hsl(var(--muted-foreground))]"
          >
            {t("hero.subhead")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_24px_rgba(var(--accent-rgb),0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {t("hero.cta.primary")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-7 py-3.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[var(--accent)]/50 hover:bg-[hsl(var(--card))]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {t("hero.cta.secondary")}
            </Link>
          </motion.div>

          {/* Framework pills */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-14 flex flex-wrap items-center justify-center gap-3"
          >
            {FRAMEWORKS.map((fw) => (
              <motion.span
                key={fw.name}
                variants={scaleIn}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium",
                  fw.color
                )}
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                {fw.name}
                <span className="opacity-60">· {fw.tag}</span>
              </motion.span>
            ))}
          </motion.div>
        </section>
      </Reveal>

      {/* ── Stats bar ── */}
      <Reveal>
        <section
          id="stats"
          className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-[hsl(var(--border))] sm:grid-cols-4 sm:divide-y-0">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center px-8 py-10 text-center">
                <span className="text-4xl font-bold text-[var(--accent)]">{s.value}</span>
                <span className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Capabilities ── */}
      <Reveal>
        <section id="features" className="bg-[hsl(var(--background))] px-4 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("features.eyebrow")}
              </span>
              <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                {t("features.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("features.subhead")}
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.title}
                    variants={fadeInUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={cn(
                      "group relative rounded-2xl border p-6 transition-all duration-300",
                      "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.18)]",
                      cap.accent
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)]/70"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[var(--accent)]/30"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl",
                        cap.accent
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--accent)]/10 text-[var(--accent)]"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">{cap.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{cap.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── How it works ── */}
      <Reveal>
        <section
          id="how-it-works"
          className="bg-[hsl(var(--card))] px-4 py-24 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("howItWorks.eyebrow")}
              </span>
              <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                {t("howItWorks.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("howItWorks.subhead")}
              </p>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div
                aria-hidden="true"
                className="absolute left-[28px] top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-[var(--accent)]/60 via-[var(--accent)]/20 to-transparent md:block"
              />

              <div className="flex flex-col gap-10">
                {HOW_IT_WORKS.map((step, i) => (
                  <Reveal key={step.step} delay={i * 0.1}>
                    <div className="flex items-start gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-lg font-bold text-[var(--accent)]">
                          {step.step}
                        </div>
                      </div>
                      <div className="pt-2">
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{step.title}</h3>
                        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{step.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Chat preview / product demo ── */}
      <Reveal>
        <section
          id="demo"
          className="bg-[hsl(var(--background))] px-4 py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              {/* Copy */}
              <div>
                <span className="mb-3 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {t("demo.eyebrow")}
                </span>
                <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                  {t("demo.heading")}
                </h2>
                <p className="mt-5 text-pretty text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("demo.body")}
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    t("demo.bullet1"),
                    t("demo.bullet2"),
                    t("demo.bullet3"),
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-[hsl(var(--foreground))]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/"
                  className="group mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {t("demo.cta")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>

              {/* Mock chat UI */}
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-3xl bg-[var(--accent)]/5 blur-2xl"
                />
                <div className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_16px_48px_-12px_rgba(0,0,0,0.28)] overflow-hidden">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/60 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                    <span className="ml-3 text-xs text-[hsl(var(--muted-foreground))]">QA Agent AI — Chat</span>
                  </div>
                  {/* Messages */}
                  <div className="flex flex-col gap-4 p-5">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-black">
                        Test the checkout flow on https://shop.example.com and generate a Playwright script + Excel test cases.
                      </div>
                    </div>
                    {/* Agent thinking */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="rounded-2xl rounded-tl-sm border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-xs text-[hsl(var(--foreground))]">
                          Crawling shop.example.com... Found 14 routes. Mapping checkout flow.
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Generating Playwright script...
                        </div>
                      </div>
                    </div>
                    {/* Agent result */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-xs text-[hsl(var(--foreground))]">
                        Done. 23 test cases written, 2 bugs found. Your Playwright script and Excel sheet are ready to download.
                      </div>
                    </div>
                    {/* Artifact pills */}
                    <div className="flex flex-wrap gap-2 pl-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                        <Code2 className="h-3 w-3" aria-hidden="true" /> checkout.spec.ts
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                        <FileSpreadsheet className="h-3 w-3" aria-hidden="true" /> test-cases.xlsx
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                        <Bug className="h-3 w-3" aria-hidden="true" /> 2 bugs
                      </span>
                    </div>
                  </div>
                  {/* Input bar */}
                  <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/60 px-4 py-3">
                    <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5">
                      <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                      <span className="flex-1 text-xs text-[hsl(var(--muted-foreground))]">Paste a URL or describe what to test...</span>
                      <ArrowRight className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section
          id="testimonials"
          className="bg-[hsl(var(--card))] px-4 py-24 md:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("testimonials.eyebrow")}
              </span>
              <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
                {t("testimonials.heading")}
              </h2>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {TESTIMONIALS.map((t_item, i) => (
                <motion.div
                  key={t_item.author}
                  variants={fadeInUp}
                  className="flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.14)]"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: t_item.stars }).map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-[hsl(var(--foreground))]">
                    &ldquo;{t_item.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">
                      {t_item.author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[hsl(var(--foreground))]">{t_item.author}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{t_item.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal>
        <section
          id="cta"
          className="relative overflow-hidden bg-[hsl(var(--background))] px-4 py-24 md:py-32"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/6 blur-[100px]" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10">
              <MessageSquare className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
              {t("cta.heading")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t("cta.body")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_32px_rgba(var(--accent-rgb),0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {t("cta.button")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-4 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                {t("cta.secondary")}
              </Link>
            </div>
            <p className="mt-6 text-xs text-[hsl(var(--muted-foreground))]">
              {t("cta.footnote")}
            </p>
          </div>
        </section>
      </Reveal>
    </main>
  );
}