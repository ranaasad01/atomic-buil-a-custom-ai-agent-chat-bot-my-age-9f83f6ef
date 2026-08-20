"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { navLinks, BRAND } from "@/lib/data";
import { navbarVariants, staggerFast, fadeIn } from "@/lib/motion";
import { Menu, X, Zap, Activity } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (href.startsWith("#")) {
      if (pathname === "/") {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileOpen(false);
  }

  function getLinkHref(href: string) {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  }

  return (
    <motion.header
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 w-full"
    >
      {/* Backdrop blur bar */}
      <div className="glass border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] glow-primary"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
                {/* Cyan glow pulse */}
                <motion.span
                  className="absolute inset-0 rounded-lg bg-[var(--accent)] opacity-0"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              <span className="font-bold text-[var(--foreground)] tracking-tight text-base">
                {BRAND.name}
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
                {BRAND.version}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <motion.ul
                variants={staggerFast}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-1"
              >
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <motion.li key={link.key} variants={fadeIn}>
                      <Link
                        href={getLinkHref(link.href)}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                          isActive
                            ? "text-[var(--foreground)] bg-[var(--primary)]/15"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {navT[link.key] ?? link.label}
                        {isActive && (
                          <motion.span
                            layoutId="nav-active-indicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--primary)]"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>

              {/* Agent status indicator */}
              <div className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                <Activity className="w-3 h-3 text-[var(--success)]" aria-hidden="true" />
                <span>Agent Ready</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] pulse-glow" />
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden glass border-b border-[var(--border)] overflow-hidden"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.key}
                    href={getLinkHref(link.href)}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[var(--foreground)] bg-[var(--primary)]/15 border border-[var(--primary)]/20"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {navT[link.key] ?? link.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center gap-2 px-4 py-2 text-xs text-[var(--muted-foreground)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] pulse-glow" />
                <span>Agent Ready</span>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}