"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/data";
import { fadeInUp, scaleIn, staggerContainer } from "@/lib/motion";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message ?? "Sign in failed. Please check your credentials.");
          return;
        }
        router.push("/home-chat-interface");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message ?? "Sign up failed. Please try again.");
          return;
        }
        setSuccessMessage("Check your email to confirm your account.");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
    setSuccessMessage(null);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: "#0f172a" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(34,211,238,0.15) 50%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <motion.div
          variants={scaleIn}
          className="rounded-2xl border p-8 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_16px_48px_-8px_rgba(0,0,0,0.5)]"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
          }}
        >
          {/* Logo */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-3 mb-8"
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl relative"
              style={{
                background: "#6366f1",
                boxShadow: "0 0 20px rgba(99,102,241,0.35), 0 0 40px rgba(99,102,241,0.1)",
              }}
            >
              <Zap className="w-6 h-6 text-white" aria-hidden="true" />
              <motion.span
                className="absolute inset-0 rounded-xl"
                style={{ background: "#22d3ee" }}
                animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="text-center">
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: "#f8fafc" }}
              >
                {BRAND.name}
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: "#94a3b8" }}
              >
                AI-powered end-to-end testing
              </p>
            </div>
          </motion.div>

          {/* Mode toggle tabs */}
          <motion.div
            variants={fadeInUp}
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "rgba(15,23,42,0.6)" }}
          >
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: mode === m ? "#6366f1" : "transparent",
                  color: mode === m ? "#f8fafc" : "#94a3b8",
                  boxShadow:
                    mode === m
                      ? "0 0 12px rgba(99,102,241,0.3)"
                      : "none",
                }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </motion.div>

          {/* Success message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border"
              style={{
                background: "rgba(34,197,94,0.08)",
                borderColor: "rgba(34,197,94,0.25)",
              }}
            >
              <CheckCircle2
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "#22c55e" }}
              />
              <p className="text-sm" style={{ color: "#22c55e" }}>
                {successMessage}
              </p>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.25)",
              }}
            >
              <AlertCircle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "#ef4444" }}
              />
              <p className="text-sm" style={{ color: "#ef4444" }}>
                {error}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            variants={fadeInUp}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: "#f8fafc" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border outline-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    borderColor: "#334155",
                    color: "#f8fafc",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#22d3ee";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(34,211,238,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334155";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: "#f8fafc" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "Min. 6 characters"}
                  disabled={loading}
                  className="w-full rounded-xl pl-10 pr-11 py-2.5 text-sm border outline-none transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    borderColor: "#334155",
                    color: "#f8fafc",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#22d3ee";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(34,211,238,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334155";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                  style={{ color: "#94a3b8" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "#6366f1",
                color: "#f8fafc",
                boxShadow: "0 0 16px rgba(99,102,241,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#818cf8";
                  e.currentTarget.style.boxShadow =
                    "0 0 24px rgba(99,102,241,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
                e.currentTarget.style.boxShadow =
                  "0 0 16px rgba(99,102,241,0.35)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                </>
              ) : (
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </motion.form>

          {/* Mode toggle link */}
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-center text-sm"
            style={{ color: "#94a3b8" }}
          >
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium transition-colors hover:underline focus-visible:outline-none"
                  style={{ color: "#22d3ee" }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium transition-colors hover:underline focus-visible:outline-none"
                  style={{ color: "#22d3ee" }}
                >
                  Sign in
                </button>
              </>
            )}
          </motion.p>

          {/* Demo bypass */}
          <motion.div
            variants={fadeInUp}
            className="mt-4 pt-4 border-t"
            style={{ borderColor: "#334155" }}
          >
            <button
              type="button"
              onClick={() => router.push("/home-chat-interface")}
              className="w-full py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-white/5 focus-visible:outline-none"
              style={{
                borderColor: "#334155",
                color: "#94a3b8",
              }}
            >
              Continue as demo
            </button>
          </motion.div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-center text-xs"
          style={{ color: "#94a3b8" }}
        >
          By continuing, you agree to our{" "}
          <span style={{ color: "#6366f1" }}>Terms of Service</span> and{" "}
          <span style={{ color: "#6366f1" }}>Privacy Policy</span>.
        </motion.p>
      </motion.div>
    </div>
  );
}
