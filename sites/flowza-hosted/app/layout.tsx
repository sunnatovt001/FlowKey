import type { Metadata } from "next";
import "./globals.css";
import { AppRoot } from "@/components/layout/app-root";
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
      <AppRoot>{children}</AppRoot>
    </html>
  );
}
