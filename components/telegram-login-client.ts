export type TelegramClientFlow = { flowId: string; code: string; url: string; expiresAt: number };
const key = "flowkey-telegram-sign-in";
let current: TelegramClientFlow | null = null;
export function saveTelegramClientFlow(flow: TelegramClientFlow) {
  current = flow;
  try { sessionStorage.setItem(key, JSON.stringify(flow)); } catch { /* SPA memory fallback. */ }
}
export function readTelegramClientFlow(): TelegramClientFlow | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const flow = JSON.parse(stored) as TelegramClientFlow;
      const url = new URL(flow.url);
      if (/^[a-f0-9]{32}$/.test(flow.flowId) && /^\d{6}$/.test(flow.code) && Number.isFinite(flow.expiresAt) && url.protocol === "https:" && url.hostname === "t.me") return flow;
    }
  } catch { /* Missing or unavailable browser storage. */ }
  return current;
}
export function clearTelegramClientFlow() { current = null; try { sessionStorage.removeItem(key); } catch {} }
