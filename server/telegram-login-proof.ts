import { createHash, timingSafeEqual } from "node:crypto";

export const telegramFlowLifetime = 10 * 60 * 1000;
export const telegramFlowCookie = process.env.NODE_ENV === "production"
  ? "__Secure-flowkey-telegram-login" : "flowkey-telegram-login";
export const digestTelegramProof = (value: string) => createHash("sha256").update(value).digest("hex");
export function equalTelegramSecret(actual: string, expected: string) {
  const a = Buffer.from(digestTelegramProof(actual));
  const b = Buffer.from(digestTelegramProof(expected));
  return timingSafeEqual(a, b);
}
export function validTelegramBrowserProof(cookie: string | null | undefined, flowId: string, proofHash: string) {
  if (!cookie || !/^[a-f0-9]{32}$/.test(flowId)) return false;
  if (cookie.split(".").length !== 2) return false;
  const [id, proof] = cookie.split(".");
  return id === flowId && /^[A-Za-z0-9_-]{43}$/.test(proof || "") && equalTelegramSecret(digestTelegramProof(proof), proofHash);
}
export function privateTelegramSender(chat: { id: number; type: string }, from: { id: number; is_bot?: boolean }) {
  return chat.type === "private" && Number.isSafeInteger(from.id) && from.id > 0 && !from.is_bot && chat.id === from.id;
}
