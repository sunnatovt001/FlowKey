import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/language-provider";
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
      <body><LanguageProvider>{children}<HelpChat /></LanguageProvider></body>
    </html>
  );
}
