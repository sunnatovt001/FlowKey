"use client";
import { useEffect, useState } from "react";
import { Send, LoaderCircle } from "lucide-react";
import { useLanguage } from "./i18n/language-provider";
const copy = {
  uz: { login: "Telegram orqali kirish", open: "Telegram’da ochish", check: "Botda shu kodni tekshiring va kirishni tasdiqlang:", waiting: "Tasdiqdan so‘ng shu oynaga qayting.", retry: "Qayta boshlash", error: "Kirishni yakunlab bo‘lmadi. Qayta urinib ko‘ring.", unavailable: "Sozlanmagan" },
  ru: { login: "Войти через Telegram", open: "Открыть Telegram", check: "Проверьте этот код в боте и подтвердите вход:", waiting: "После подтверждения вернитесь в это окно.", retry: "Начать заново", error: "Не удалось завершить вход. Попробуйте ещё раз.", unavailable: "Не настроено" },
  en: { login: "Continue with Telegram", open: "Open Telegram", check: "Check this code in the bot and confirm sign in:", waiting: "Return to this window after confirming.", retry: "Start again", error: "Could not complete sign in. Please try again.", unavailable: "Not configured" },
};
type Flow = { flowId: string; code: string; url: string; expiresIn: number; started: number };
export function TelegramSignIn({ available, iconOnly = false }: { available: boolean; iconOnly?: boolean }) {
  const { language } = useLanguage();
  const text = copy[language];
  const [flow, setFlow] = useState<Flow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setFlow(null); setError(""); setPending(true);
    try {
      const response = await fetch("/api/auth/telegram/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }) });
      const data = await response.json();
      if (!response.ok || !/^[a-f0-9]{32}$/.test(data.flowId) || !/^\d{6}$/.test(data.code)) throw new Error();
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "t.me") throw new Error();
      setFlow({ ...data, started: Date.now() });
    } catch { setError(text.error); } finally { setPending(false); }
  }
  useEffect(() => {
    if (!flow) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        if (Date.now() > flow!.started + flow!.expiresIn * 1000) throw new Error();
        const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flowId: flow!.flowId }), signal: controller.signal };
        const response = await fetch("/api/auth/telegram/status", options);
        const data = await response.json();
        if (!response.ok) throw new Error();
        if (data.status === "confirmed") {
          const complete = await fetch("/api/auth/telegram/complete", options);
          const result = await complete.json();
          if (!complete.ok || result.url !== "/onboarding") throw new Error();
          if (!cancelled) window.location.assign("/onboarding");
          return;
        }
        if (!cancelled) timer = setTimeout(poll, 2000);
      } catch {
        if (!cancelled) { setError(text.error); setFlow(null); }
      }
    }
    timer = setTimeout(poll, 2000);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [flow, text.error]);
  return <div className="telegram-sign-in">
    <button className="button secondary social-sign-in-button" type="button" aria-label={iconOnly ? "Telegram" : undefined} disabled={!available || pending} onClick={() => void start()}>
      {pending ? <LoaderCircle size={22} className="spin" /> : <Send size={22} />}<span className={iconOnly ? "sr-only" : undefined}>{flow ? text.retry : text.login}</span>{!available && <small>{text.unavailable}</small>}
    </button>
    {flow && <div className="telegram-login-flow" role="status"><p>{text.check}</p><strong className="telegram-login-code">{flow.code}</strong><a className="button primary" href={flow.url} target="_blank" rel="noopener noreferrer" data-keep-menu-open>{text.open}</a><p>{text.waiting}</p></div>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
