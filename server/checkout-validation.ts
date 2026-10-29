import { z } from "zod";
z.config(z.locales.uz());
export const checkoutInput = z.object({
  title: z.string().trim().min(1).max(120),
  amount_minor: z.number().int().positive().max(1_000_000_000),
  currency: z.literal("UZS"),
}).strict();
export const checkoutOutcome = z.object({ result: z.enum(["successful", "failed", "pending"]) }).strict();
export function paymentButton(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("To‘lov sahifasi manzili noto‘g‘ri.");
  const safe = parsed.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<a href="${safe}" target="_blank" rel="noopener noreferrer">FlowKey orqali to‘lash (sinov)</a>`;
}
export function uzsToMinor(value: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value.trim())) throw new Error("UZS summasini ko‘pi bilan ikkita kasr xonasi bilan kiriting.");
  const [whole, fraction = ""] = value.trim().split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (minor < 1 || minor > 1_000_000_000) throw new Error("Summa 0,01 va 10 000 000 so‘m oralig‘ida bo‘lishi kerak.");
  return minor;
}
