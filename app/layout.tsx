import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import LocaleProvider from "@/components/LocaleProvider";
import LanguageToggle from "@/components/LanguageToggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, email: false, address: false },
  title: "QA Agent AI — Automated End-to-End Testing",
  description:
    "AI-powered end-to-end testing. Paste a URL, describe what to test, and let the agent crawl, script, and execute — delivering Playwright scripts and Excel test sheets in minutes.",
  keywords: ["QA automation", "AI testing", "Playwright", "end-to-end testing", "test scripts"],
  openGraph: {
    title: "QA Agent AI — Automated End-to-End Testing",
    description:
      "AI-powered end-to-end testing. Paste a URL, describe what to test, and let the agent do the rest.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased min-h-screen flex flex-col">
        <LocaleProvider>
          <LanguageToggle />
          <Navbar />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
