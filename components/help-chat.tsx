"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ArrowUp, X } from "lucide-react";
import { helpGuide } from "@/shared/help-guide";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "./i18n/language-provider";

type Message = { role: "user" | "assistant"; content: string; href?: string; label?: string; guide?: boolean };
export function HelpChat() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { language } = useLanguage();
  const copy = {
    uz: { open: "Yordamchini ochish", close: "Yordamchini yopish", question: "Savolingizni yozing…", send: "Yuborish", login: "Hisobga kirish", thinking: "Javob tayyorlanmoqda…", guide: "Qo‘llanma" },
    ru: { open: "Открыть помощника", close: "Закрыть помощника", question: "Напишите сообщение…", send: "Отправить", login: "Войти", thinking: "Готовлю ответ…", guide: "Справка" },
    en: { open: "Open assistant", close: "Close assistant", question: "Message FlowKey…", send: "Send", login: "Sign in", thinking: "Thinking…", guide: "Guide" },
  }[language];
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const hidden = pathname.startsWith("/pay/") || pathname.startsWith("/checkout/");
  useEffect(()=>{const show=()=>{if(!open){setChecking(true);setOpen(true);}else field.current?.focus();};window.addEventListener("flowkey:open-help",show);return ()=>window.removeEventListener("flowkey:open-help",show);},[open]);
  useEffect(() => {
    if (!open || hidden) return;
    const controller = new AbortController();
    field.current?.focus();
    fetch("/api/support/chat", { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setAvailable(data.available === true))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [open, hidden]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy, error]);
  useEffect(() => {
    if (!field.current) return;
    field.current.style.height = "auto";
    field.current.style.height = `${Math.min(field.current.scrollHeight, 132)}px`;
  }, [question, open]);
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  function appendGuide(value: string) {
    const reply = helpGuide(value);
    setMessages(previous => [...previous, { role: "assistant", content: reply.text, href: reply.href, label: reply.label, guide: true }]);
  }
  async function send(text = question) {
    const value = text.trim();
    if (!value || value.length > 1500 || busy || checking) return;
    setQuestion(""); setError(""); setNeedsLogin(false);
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 2000) }));
    while(history.length && new TextEncoder().encode(JSON.stringify({question:value,history,page:pathname})).byteLength>14000)history.shift();
    setMessages(previous => [...previous.slice(-18), { role: "user", content: value }]);
    if (!available) {
      appendGuide(value);
      field.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/support/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, history, page:pathname }), signal: AbortSignal.timeout(70000),
      });
      const data = await response.json();
      if (response.status === 502 || response.status === 503) {
        appendGuide(value);
        return;
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setNeedsLogin(true);
        throw new Error(data.error?.message || "Javob olinmadi. Qayta urinib ko‘ring.");
      }
      setMessages(previous => [...previous, { role: "assistant", content: data.answer }]);
    } catch (failure) {
      setMessages(previous => previous.slice(0, -1));
      setQuestion(current => current || value);
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "Javob kechikdi. Qayta urinib ko‘ring.");
    } finally { setBusy(false); field.current?.focus(); }
  }
  if (hidden) return null;
  return (
    <div className="help-chat">
      <AnimatePresence>
      {open && (
        <motion.section id="flowkey-help-panel" role="dialog" aria-labelledby="flowkey-help-title" className="help-chat-panel"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 18, scale: reducedMotion ? 1 : .96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : .97 }}
          transition={{ duration: reducedMotion ? 0 : .24, ease: [.22, 1, .36, 1] }}
          onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
          <header className="help-chat-header">
            <h2 id="flowkey-help-title">FlowKey</h2>
            <button type="button" aria-label={copy.close} onClick={close}><X size={21} /></button>
          </header>
          <div ref={log} className="help-chat-log" role="log" aria-live="polite" aria-relevant="additions text" aria-label="FlowKey chat">
            <AnimatePresence>{!messages.length && <motion.div key="welcome" className="help-chat-welcome" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : .9 }} transition={{ duration: reducedMotion ? 0 : .18 }}><Bot size={100} strokeWidth={1.3} /></motion.div>}</AnimatePresence>
            {messages.map((message, index) => <div key={index} className={`help-chat-message ${message.role}`}>
              {message.guide && <span className="help-chat-guide">{copy.guide}</span>}
              <p>{message.content}</p>
              {message.href && <Link href={message.href} onClick={close}>{message.label} <span aria-hidden="true">↗</span></Link>}
            </div>)}
            {busy && <p className="help-chat-thinking" role="status">{copy.thinking}</p>}
            {error && <div className="help-chat-error" role="alert">{error}{needsLogin && <Link href="/login" onClick={close}>{copy.login} ↗</Link>}</div>}
          </div>
          <form className="help-chat-compose" onSubmit={event => { event.preventDefault(); void send(); }}>
            <label className="sr-only" htmlFor="flowkey-help-question">{copy.question}</label>
            <div><textarea ref={field} id="flowkey-help-question" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1500} rows={1} placeholder={copy.question}
              onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} />
              <button type="submit" aria-label={copy.send} disabled={busy || checking || !question.trim()}><ArrowUp size={20} /></button></div>
          </form>
        </motion.section>
      )}
      </AnimatePresence>
      <button ref={launcher} type="button" className="help-chat-launcher" aria-label={open ? copy.close : copy.open} aria-expanded={open} aria-controls="flowkey-help-panel" onClick={() => { if (open) close(); else { setChecking(true); setOpen(true); } }}>
        {open ? <X size={22} aria-hidden="true" /> : <Bot size={25} aria-hidden="true" />}
      </button>
    </div>
  );
}
