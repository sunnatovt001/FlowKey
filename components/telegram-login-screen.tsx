"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useLanguage, useTranslation } from "./i18n/language-provider";
import { clearTelegramClientFlow, readTelegramClientFlow, type TelegramClientFlow } from "./telegram-login-client";
type State = { phase: "loading" | "pending" | "awaiting" | "error" | "done"; flow?: TelegramClientFlow; transient?: boolean; retryable?: boolean };
export function TelegramLoginScreen() {
  const t = useTranslation();
  const { language } = useLanguage();
  const copy = {
    uz: { waiting: "Telegram’da kirishni tasdiqlang", detail: "Botda Start tugmasini bosing va kirishni tasdiqlang. FlowKey avtomatik ochiladi.", code: "Kod" },
    ru: { waiting: "Подтвердите вход в Telegram", detail: "Нажмите Start в боте и подтвердите вход. FlowKey откроется автоматически.", code: "Код" },
    en: { waiting: "Confirm sign-in in Telegram", detail: "Tap Start in the bot and confirm. FlowKey will open automatically.", code: "Code" },
  }[language];
  const [state, setState] = useState<State>({ phase: "loading" });
  const resumeRef = useRef<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function post(path: string, body: unknown) {
      return fetch(`/api/auth/telegram/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
    }
    async function begin() {
      if (resumeRef.current === null) resumeRef.current = new URLSearchParams(location.hash.slice(1)).get("telegram_token") || "";
      const token = resumeRef.current;
      if (token) {
        // Opaque one-use return credential stays out of access logs and referrers.
        history.replaceState(history.state, "", location.pathname);
        await Promise.resolve();
        if (cancelled) return;
        try {
          const response = await post("resume", { resumeToken: token });
          const data = await response.json();
          if (!response.ok || data.url !== "/onboarding") throw new Error();
          if (!cancelled) { setState({ phase: "done" }); window.location.assign("/onboarding"); }
        } catch { if (!cancelled) setState({ phase: "error" }); }
        return;
      }
      const flow = readTelegramClientFlow();
      await Promise.resolve();
      if (!flow || flow.expiresAt <= Date.now()) { if (!cancelled) setState({ phase: "error" }); return; }
      if (!cancelled) setState({ phase: "pending", flow });
      let failures = 0;
      async function poll() {
        if (cancelled) return;
        if (flow!.expiresAt <= Date.now()) { setState({ phase: "error", flow: flow! }); return; }
        try {
          const response = await post("status", { flowId: flow!.flowId });
          if (response.status === 400 || response.status === 403) { setState({ phase: "error", flow: flow! }); return; }
          if (!response.ok) throw new Error();
          const data = await response.json();
          failures = 0;
          if (data.status === "confirmed") {
            const complete = await post("complete", { flowId: flow!.flowId });
            const result = await complete.json();
            if (!complete.ok || result.url !== "/onboarding") throw new Error();
            if (!cancelled) { clearTelegramClientFlow(); setState({ phase: "done" }); window.location.assign("/onboarding"); }
            return;
          }
          if (!cancelled) setState({ phase: data.status === "awaiting" ? "awaiting" : "pending", flow: flow! });
        } catch {
          if (cancelled) return;
          failures++;
          if (failures >= 5) { setState({ phase: "error", flow: flow!, retryable: true }); return; }
          setState(previous => ({ ...previous, transient: true }));
        }
        if (!cancelled) timer = setTimeout(poll, failures ? Math.min(10000, failures * 2000) : 2000);
      }
      void poll();
    }
    void begin();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [retry]);
  const waiting = state.phase === "pending" || state.phase === "awaiting";
  return (
    <div className="telegram-auth-screen telegram-auth-handoff">
      <div className="telegram-handoff-symbol" aria-hidden="true">
        {state.phase === "loading" ? <LoaderCircle className="spin" size={25} /> :
          state.phase === "done" ? <CheckCircle2 size={25} /> :
          <img src="/brands/telegram.svg" alt="" width={28} height={28} />}
      </div>
      <p className="telegram-handoff-status" role="status">
        {waiting ? copy.waiting : t(state.phase === "loading" ? "Kirishni tayyorlayapmiz…" : state.phase === "done" ? "Kirish tasdiqlandi. Davom etyapmiz…" : "Kirish havolasi eskirgan yoki ishlatilgan. Qayta boshlang.")}
      </p>
      {waiting && state.flow && <>
        <p className="telegram-handoff-detail">{state.phase === "awaiting"
          ? t("Saytdagi va botdagi kod bir xil bo‘lsin.")
          : copy.detail}</p>
        <span className="telegram-handoff-code">{copy.code}<strong>{state.flow.code}</strong></span>
        <a className="button primary full telegram-handoff-open" href={state.flow.url} target="_blank" rel="noopener noreferrer">
          {t("Telegram’ni ochish")} <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </>}
      {state.transient && waiting && <p className="form-hint">{t("Ulanish uzildi. Avtomatik qayta tekshiryapmiz…")}</p>}
      {state.phase === "error" && state.flow && state.retryable && <button className="button secondary full" type="button" onClick={() => setRetry(n => n + 1)}>{t("Qayta tekshirish")}</button>}
      <Link className="text-link" href="/login" onClick={() => clearTelegramClientFlow()}>
        {t(state.phase === "error" ? "Kirishni qayta boshlash" : "Kirishga qaytish")}
      </Link>
    </div>
  );
}
