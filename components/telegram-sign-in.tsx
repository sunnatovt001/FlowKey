"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "./i18n/language-provider";
import { saveTelegramClientFlow } from "./telegram-login-client";
const copy = {
  uz: { login: "Telegram orqali kirish", error: "Telegram’ni ochib bo‘lmadi. Qayta urinib ko‘ring.", unavailable: "Sozlanmagan" },
  ru: { login: "Войти через Telegram", error: "Не удалось открыть Telegram. Попробуйте ещё раз.", unavailable: "Не настроено" },
  en: { login: "Continue with Telegram", error: "Could not open Telegram. Please try again.", unavailable: "Not configured" },
};
export function TelegramSignIn({ available, iconOnly = false }: { available: boolean; iconOnly?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const text = copy[language];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    // Open during the user gesture, before awaiting the network (Logic Coin flow).
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/telegram/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }), signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok || !/^[a-f0-9]{32}$/.test(data.flowId) || !/^\d{6}$/.test(data.code) || !Number.isFinite(data.expiresIn) || data.expiresIn <= 0 || data.expiresIn > 600) throw new Error();
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "t.me") throw new Error();
      saveTelegramClientFlow({ flowId: data.flowId, code: data.code, url: url.href, expiresAt: Date.now() + data.expiresIn * 1000 });
      if (popup && !popup.closed) popup.location.replace(url.href);
      router.push("/telegram-login");
    } catch { popup?.close(); setError(text.error); setPending(false); }
  }
  return <div className="telegram-sign-in">
    <button className="button secondary social-sign-in-button" type="button" aria-label={iconOnly ? "Telegram" : undefined} disabled={!available || pending} onClick={() => void start()}>
      {pending ? <LoaderCircle size={22} className="spin" /> : <img src="/brands/telegram.svg" width="22" height="22" alt="" aria-hidden="true" className="provider-brand-icon" />}<span className={iconOnly ? "sr-only" : undefined}>{text.login}</span>{!available && <small>{text.unavailable}</small>}
    </button>
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
