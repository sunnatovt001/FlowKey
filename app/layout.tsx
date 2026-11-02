import type { Metadata } from "next";
import "./globals.css";
import { HelpChat } from "@/components/help-chat";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "FlowKey — Dasturchilar uchun sodda to‘lovlar",
    template: "%s · FlowKey",
  },
  description:
    "To‘lov integratsiyangizni yarating, sinang va kuzating. O‘zbekiston dasturchilari uchun to‘lov Unit muhiti. Haqiqiy pul ishlatilmaydi.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-scroll-behavior="smooth">
      <body>{children}<HelpChat /></body>
    </html>
  );
}
