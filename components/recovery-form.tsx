"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authError } from "@/shared/locale";
import { useTranslation } from "./i18n/language-provider";
export type RecoveryMode = "forgot" | "reset" | "verify";
export function RecoveryForm({ mode, localMail = false }: { mode: RecoveryMode; localMail?: boolean }) {
  const t = useTranslation();
  const token = useSearchParams().get("token") || "";
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(false);
  const invalidReset = mode === "reset" && !token;
  return <div className="auth-recovery-page">
    {invalidReset ? <p className="notice">{t("Havola noto‘g‘ri yoki muddati tugagan. Yangi havola so‘rang.")}</p> : !done && <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const endpoint = mode === "reset" ? "reset-password" : mode === "verify" ? "send-verification-email" : "request-password-reset";
        const body = mode === "reset" ? { token, newPassword: value } : mode === "verify" ? { email: value.trim().toLowerCase(), callbackURL: "/onboarding" } : { email: value.trim().toLowerCase(), redirectTo: `${location.origin}/reset-password` };
        const response = await fetch(`/api/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(authError(data?.code, response.status));
        setMessage(mode === "reset" ? "Parol yangilandi. Endi kirishingiz mumkin." : "Agar hisob mavjud va talabga mos bo‘lsa, xat yuborish so‘raldi.");
        setDone(true);
        if (mode === "reset") history.replaceState(history.state, "", "/reset-password");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Ulanib bo‘lmadi."); } finally { setBusy(false); }
    }}>
      <label>{t(mode === "reset" ? "Yangi parol" : "Hisob elektron pochtasi")}<span className={mode === "reset" ? "auth-password-field" : undefined}><input name={mode === "reset" ? "newPassword" : "email"} required value={value} onChange={e => setValue(e.target.value)} type={mode === "reset" ? visible ? "text" : "password" : "email"} minLength={mode === "reset" ? 12 : undefined} maxLength={mode === "reset" ? 128 : 254} autoComplete={mode === "reset" ? "new-password" : "email"} placeholder={mode === "reset" ? t("Kamida 12 ta belgi") : "email@example.com"}/>{mode === "reset" && <button type="button" className="auth-password-toggle" aria-label={t(visible ? "Parolni yashirish" : "Parolni ko‘rsatish")} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button>}</span></label>
      <button type="submit" className="button primary full" disabled={busy}>{busy && <LoaderCircle size={18} className="spin"/>}{t(busy ? "Kuting…" : "Davom etish")}</button>
    </form>}
    {message && <p role="status" className="notice">{t(message)}</p>}
    <div className="auth-recovery-links"><Link href="/login">{t("Kirishga qaytish")}</Link>{mode === "reset" && !done && <Link href="/forgot-password">{t("Yangi havola so‘rash")}</Link>}{mode === "forgot" && <Link href="/verify-email">{t("Pochtani tasdiqlash")}</Link>}</div>
    {localMail && done && mode !== "reset" && <p className="form-hint">{t("Local rejim: xat local-data/mail papkasiga saqlanadi.")}</p>}
  </div>;
}
