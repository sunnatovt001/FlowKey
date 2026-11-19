"use client";
import Link from "next/link";
import { useId, useRef, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, Eye, EyeOff, KeyRound, LoaderCircle, Mail, MailCheck, MailPen, RotateCw, Send, ShieldCheck } from "lucide-react";
import { useTranslation } from "./i18n/language-provider";
import { authError } from "@/shared/locale";

function subscribeStorage(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("pageshow", notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener("pageshow", notify); };
}
const emptyStorage = () => "[null,null]";
const serverReady = () => false;
const browserReady = () => true;
export function EmailCodeForm({ mode, localMail = false }: { mode: "verify" | "forgot"; localMail?: boolean }) {
  const t = useTranslation();
  const router = useRouter();
  const key = mode === "verify" ? "flowkey-verify" : "flowkey-reset";
  const saved = useSyncExternalStore(subscribeStorage, () => {
    try { return JSON.stringify([sessionStorage.getItem(`${key}-email`), sessionStorage.getItem(`${key}-sent`)]); }
    catch { return emptyStorage(); }
  }, emptyStorage);
  const [savedEmail, savedSent] = JSON.parse(saved) as [string | null, string | null];
  const [enteredEmail, setEmail] = useState<string | null>(null);
  const email = enteredEmail ?? savedEmail ?? "";
  const [code, setCode] = useState("");
  const [selection, setSelection] = useState<[number, number]>([0, 0]);
  const codeId = useId();
  const [password, setPassword] = useState("");
  const [sentOverride, setSent] = useState<boolean | null>(null);
  const sent = sentOverride ?? Boolean(savedEmail && savedSent === "1");
  const [busy, setBusy] = useState(false);
  const ready = useSyncExternalStore(subscribeStorage, browserReady, serverReady);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wait, setWait] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sent) field.current?.focus();
  }, [sent]);
  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  async function request(path: string, body: Record<string, string>) {
    const response = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(authError(data?.code, response.status));
    if (!data) throw new Error("Ulanib bo‘lmadi. Qayta urinib ko‘ring.");
    return data;
  }
  async function send() {
    if (busy || wait) return;
    setBusy(true); setError(""); setNotice("");
    const address = email.trim().toLowerCase();
    try {
      await request(mode === "verify" ? "email-otp/send-verification-otp" : "email-otp/request-password-reset", mode === "verify" ? { email: address, type: "email-verification" } : { email: address });
      setEmail(address); setCode(""); setSelection([0, 0]); setSent(true); setWait(60);
      setNotice("Agar hisob mavjud bo‘lsa, 6 xonali kod yuborildi. Spam papkasini ham tekshiring.");
      try { sessionStorage.setItem(`${key}-email`, address); sessionStorage.setItem(`${key}-sent`, "1"); } catch { /* Current page state still works. */ }
      field.current?.focus();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Ulanib bo‘lmadi."); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request(mode === "verify" ? "email-otp/verify-email" : "email-otp/reset-password", mode === "verify" ? { email, otp: code } : { email, otp: code, password });
      try { sessionStorage.removeItem(`${key}-email`); sessionStorage.removeItem(`${key}-sent`); } catch { /* No secrets are stored here. */ }
      setCode(""); setPassword("");
      if (mode === "verify") { router.push("/onboarding"); router.refresh(); }
      else setDone(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Ulanib bo‘lmadi."); }
    finally { setBusy(false); }
  }
  function changeEmail() {
    setSent(false); setCode(""); setSelection([0, 0]); setPassword(""); setError(""); setNotice("");
    try { sessionStorage.removeItem(`${key}-sent`); } catch { /* Ignore disabled storage. */ }
  }
  const SubmitIcon = sent ? (mode === "verify" ? ShieldCheck : KeyRound) : Send;
  const submitLabel = busy
    ? "Kuting…"
    : sent
      ? mode === "verify" ? "Pochtani tasdiqlash" : "Parolni yangilash"
      : "Kod yuborish";

  return (
    <div className="auth-email-code">
      {done ? (
        <p role="status" className="auth-code-feedback notice">
          <CheckCircle2 size={18} aria-hidden="true" />
          {t("Parol yangilandi. Endi kirishingiz mumkin.")}
        </p>
      ) : (
        <>
          <form onSubmit={event => { event.preventDefault(); void (sent ? confirm() : send()); }}>
            {sent ? (
              <>
                <div className="auth-code-destination">
                  <div className="auth-code-mail-icon"><MailCheck size={23} aria-hidden="true" /></div>
                  <p>{t("Xatdagi 6 xonali kodni kiriting.")}</p>
                  <strong>{email}</strong>
                  <span id={`${codeId}-expiry`} className="auth-code-expiry">
                    <Clock3 size={13} aria-hidden="true" />
                    {t("Kod 10 daqiqa amal qiladi.")}
                  </span>
                </div>
                <label htmlFor={codeId}>
                  {t("Tasdiqlash kodi")}
                  <span className="auth-code-field" data-invalid={Boolean(error)}>
                    <span className="auth-code-digits" aria-hidden="true">
                      {Array.from({ length: 6 }, (_, index) => (
                        <span
                          key={index}
                          data-filled={Boolean(code[index])}
                          data-active={index === Math.min(selection[0], 5)}
                          data-selected={index >= selection[0] && index < selection[1]}
                        >
                          {code[index] || "·"}
                        </span>
                      ))}
                    </span>
                    <input
                      ref={field}
                      id={codeId}
                      className="auth-code-input"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      minLength={6}
                      maxLength={6}
                      required
                      aria-invalid={Boolean(error)}
                      aria-describedby={`${codeId}-expiry${error ? ` ${codeId}-error` : ""}`}
                      value={code}
                      onSelect={event => {
                        const input = event.currentTarget;
                        setSelection([input.selectionStart ?? code.length, input.selectionEnd ?? code.length]);
                      }}
                      onChange={event => {
                        const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                        const cursor = Math.min(event.target.selectionStart ?? next.length, next.length);
                        setSelection([cursor, cursor]);
                        setCode(next);
                        setError("");
                      }}
                      onPaste={event => {
                        const digits = event.clipboardData.getData("text").replace(/\D/g, "");
                        if (digits.length !== 6) return;
                        event.preventDefault();
                        setCode(digits);
                        setSelection([6, 6]);
                        setError("");
                        const input = event.currentTarget;
                        requestAnimationFrame(() => input.setSelectionRange(6, 6));
                      }}
                    />
                  </span>
                </label>
                {mode === "forgot" && (
                  <label>
                    {t("Yangi parol")}
                    <span className="auth-password-field">
                      <input required name="newPassword" type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} placeholder={t("Kamida 12 ta belgi")} value={password} onChange={event => setPassword(event.target.value)} />
                      <button type="button" className="auth-password-toggle" aria-label={t(visible ? "Parolni yashirish" : "Parolni ko‘rsatish")} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
                        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </span>
                  </label>
                )}
              </>
            ) : (
              <label>
                {t("Hisob elektron pochtasi")}
                <span className="auth-code-address">
                  <Mail size={17} aria-hidden="true" />
                  <input required name="email" type="email" autoComplete="email" maxLength={254} placeholder="email@example.com" value={email} onChange={event => setEmail(event.target.value)} />
                </span>
              </label>
            )}
            {error && <p id={`${codeId}-error`} className="auth-code-feedback error" role="alert"><CircleAlert size={18} aria-hidden="true" />{t(error)}</p>}
            {notice && <p className="auth-code-feedback notice" role="status"><CheckCircle2 size={18} aria-hidden="true" />{t(notice)}</p>}
            <button type="submit" className="button primary full auth-code-submit" disabled={!ready || busy || (sent && code.length !== 6) || (!sent && wait > 0)}>
              {busy ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <SubmitIcon size={18} aria-hidden="true" />}
              {t(submitLabel)}
            </button>
          </form>
          {sent && (
            <div className="auth-code-actions">
              <button type="button" disabled={busy || wait > 0} onClick={() => void send()}>
                <RotateCw size={16} aria-hidden="true" />
                <span>{t("Kodni qayta yuborish")}{wait > 0 ? ` (${wait})` : ""}</span>
              </button>
              <button type="button" disabled={busy} onClick={changeEmail}>
                <MailPen size={16} aria-hidden="true" />
                <span>{t("Pochtani o‘zgartirish")}</span>
              </button>
            </div>
          )}
          {localMail && sent && <p className="form-hint auth-code-local">{t("Local rejim: xat local-data/mail papkasiga saqlanadi.")}</p>}
        </>
      )}
      <div className="auth-code-back">
        <Link href="/login"><ArrowLeft size={16} aria-hidden="true" />{t("Kirishga qaytish")}</Link>
      </div>
    </div>
  );
}
