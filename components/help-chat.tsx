"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ArrowUp, X, RotateCcw, BookOpen, MessageCircle } from "lucide-react";
import { helpGuide, helpSuggestions } from "@/shared/help-guide";

type Message = { role: "user" | "assistant"; content: string; href?: string; label?: string; guide?: boolean };
export function HelpChat() {
  const pathname = usePathname();
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
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  async function send(text = question) {
    const value = text.trim();
    if (!value || value.length > 1500 || busy || checking) return;
    setQuestion(""); setError(""); setNeedsLogin(false);
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 2000) }));
    while(history.length && new TextEncoder().encode(JSON.stringify({question:value,history,page:pathname})).byteLength>14000)history.shift();
    setMessages(previous => [...previous.slice(-18), { role: "user", content: value }]);
    if (!available) {
      const reply = helpGuide(value);
      setMessages(previous => [...previous, { role: "assistant", content: reply.text, href: reply.href, label: reply.label, guide: true }]);
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
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setNeedsLogin(true);
        if (response.status === 503) setAvailable(false);
        throw new Error(data.error?.message || "Javob olinmadi. Qayta urinib ko‘ring.");
      }
      setMessages(previous => [...previous, { role: "assistant", content: data.answer }]);
    } catch (failure) {
      setQuestion(value);
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "Javob kechikdi. Qayta urinib ko‘ring.");
    } finally { setBusy(false); field.current?.focus(); }
  }
  if (hidden) return null;
  return (
    <div className="help-chat">
      {open && (
        <section id="flowkey-help-panel" role="dialog" aria-labelledby="flowkey-help-title" className="help-chat-panel"
          onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
          <header className="help-chat-header">
            <span className="help-chat-mark"><Bot size={22} aria-hidden="true" /></span>
            <div><h2 id="flowkey-help-title">FlowKey yordamchi</h2><p>{checking ? "Tekshirilmoqda…" : available ? "AI yordamchi" : "Qo‘llanma rejimi"}</p></div>
            <button type="button" aria-label="Suhbatni tozalash" disabled={busy || !messages.length} onClick={() => { setMessages([]); setError(""); setNeedsLogin(false); }}><RotateCcw size={17} /></button>
            <button type="button" aria-label="Yordamchini yopish" onClick={close}><X size={21} /></button>
          </header>
          <div ref={log} className="help-chat-log" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Yordamchi bilan suhbat">
            {!messages.length && <div className="help-chat-welcome"><MessageCircle size={28} aria-hidden="true" /><h3>Qanday yordam beray?</h3><p>FlowKey bo‘yicha savolingizni yozing.</p>
              <div className="help-chat-suggestions">{helpSuggestions.map(text => <button type="button" key={text} disabled={checking} onClick={() => void send(text)}>{text}<span aria-hidden="true">↗</span></button>)}</div>
            </div>}
            {messages.map((message, index) => <div key={index} className={`help-chat-message ${message.role}`}>
              <span className="help-chat-speaker">{message.role === "user" ? "Siz" : message.guide ? "Qo‘llanma javobi" : "FlowKey AI"}</span>
              <p>{message.content}</p>
              {message.href && <Link href={message.href} onClick={close}>{message.label} <span aria-hidden="true">↗</span></Link>}
            </div>)}
            {busy && <p className="help-chat-thinking" role="status">Javob tayyorlanmoqda…</p>}
            {error && <div className="help-chat-error" role="alert">{error}{needsLogin && <Link href="/login" onClick={close}>Hisobga kirish ↗</Link>}</div>}
          </div>
          <form className="help-chat-compose" onSubmit={event => { event.preventDefault(); void send(); }}>
            <label className="sr-only" htmlFor="flowkey-help-question">Savolingiz</label>
            <div><textarea ref={field} id="flowkey-help-question" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1500} rows={2} placeholder="Savolingizni yozing…"
              onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} />
              <button type="submit" aria-label="Savolni yuborish" disabled={busy || checking || !question.trim()}><ArrowUp size={20} /></button></div>
            <p>{available ? "Parol yoki maxfiy kalit yubormang." : "AI hali ulanmagan. Hozir tayyor qo‘llanma javoblari beriladi."}</p>
          </form>
          <Link className="help-chat-docs" href="/docs" onClick={close}><BookOpen size={14} /> Qo‘llanmani ochish</Link>
        </section>
      )}
      <button ref={launcher} type="button" className="help-chat-launcher" aria-label={open ? "Yordamchini yopish" : "AI yordamchini ochish"} aria-expanded={open} aria-controls="flowkey-help-panel" onClick={() => { if (open) close(); else { setChecking(true); setOpen(true); } }}>
        {open ? <X size={22} aria-hidden="true" /> : <><Bot size={23} aria-hidden="true" /><span>AI yordamchi</span></>}
      </button>
    </div>
  );
}
