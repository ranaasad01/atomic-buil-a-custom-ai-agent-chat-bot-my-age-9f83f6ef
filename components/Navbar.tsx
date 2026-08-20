"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { navLinks, BRAND } from "@/lib/data";
import { navbarVariants, staggerFast, fadeIn } from "@/lib/motion";
import { Menu, X, Zap, Activity, LogIn, LogOut } from 'lucide-react';
import { useAuth } from "@/lib/supabase/auth-context";

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

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
                            layoutId="nav-active-pill"
                            className="absolute inset-0 rounded-lg bg-[var(--primary)]/10 -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}

                {/* Desktop auth button */}
                <motion.li variants={fadeIn}>
                  {!loading && (
                    user ? (
                      <button
                        onClick={() => void signOut()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--primary)]/90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <LogIn className="w-4 h-4" aria-hidden="true" />
                        Sign In
                      </Link>
                    )
                  )}
                </motion.li>
              </motion.ul>
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden glass border-b border-[var(--border)]"
          >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4" aria-label="Mobile navigation">
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <li key={link.key}>
                      <Link
                        href={getLinkHref(link.href)}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "text-[var(--foreground)] bg-[var(--primary)]/15"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {isActive && (
                          <Activity className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                        )}
                        {navT[link.key] ?? link.label}
                      </Link>
                    </li>
                  );
                })}

                {/* Mobile auth button */}
                {!loading && (
                  <li className="mt-2 pt-2 border-t border-[var(--border)]">
                    {user ? (
                      <button
                        onClick={() => { void signOut(); setMobileOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all duration-200"
                      >
                        <LogIn className="w-4 h-4" aria-hidden="true" />
                        Sign In
                      </Link>
                    )}
                  </li>
                )}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
