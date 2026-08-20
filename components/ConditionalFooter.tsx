"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/home-chat-interface") return null;
  return <Footer />;
}
