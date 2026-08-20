"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navLinks, BRAND } from "@/lib/data";
import { footerVariants } from "@/lib/motion";
import { Zap, Code2 as Github, MessageCircle as Twitter, Briefcase as Linkedin } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const footerT = t.raw("footer") as Record<string, string>;

  function getLinkHref(href: string) {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  }

  function handleLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (href.startsWith("#") && pathname === "/") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="border-t border-[var(--border)] bg-[var(--card)]/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] glow-primary">
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-[var(--foreground)] tracking-tight">
                {BRAND.name}
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs">
              {BRAND.tagline}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
              >
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Navigation column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-wide uppercase">
              {footerT["nav_heading"] ?? "Navigation"}
            </h3>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={getLinkHref(link.href)}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                  >
                    {navT[link.key] ?? link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-wide uppercase">
              {footerT["product_heading"] ?? "Product"}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {footerT["playwright"] ?? "Playwright Support"}
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {footerT["cypress"] ?? "Cypress Support"}
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {footerT["excel"] ?? "Excel Test Sheets"}
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {footerT["ai_agent"] ?? "AI Agent Reasoning"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            {footerT["copyright"] ?? `© ${new Date().getFullYear()} QA Agent AI. All rights reserved.`}
          </p>
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span>{footerT["status"] ?? "All systems operational"}</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}