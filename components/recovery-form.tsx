"use client";
import { EmailCodeForm } from "./email-code-form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authError } from "@/shared/locale";
import { useTranslation } from "./i18n/language-provider";
export type RecoveryMode = "forgot" | "reset" | "verify";
export function RecoveryForm({ mode, localMail = false }: { mode: RecoveryMode; localMail?: boolean }) {
  const token = useSearchParams().get("token") || "";
  if (mode === "verify" || mode === "forgot" || !token) return <EmailCodeForm mode={mode === "verify" ? "verify" : "forgot"} localMail={localMail} />;
  // Password links sent before the code-based flow remain usable until they expire.
  return <LegacyPasswordReset token={token} />;
}
function LegacyPasswordReset({ token }: { token: string }) {
  const t = useTranslation();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(false);
  return <div className="auth-recovery-page">
    {!done && <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(authError(data?.code, response.status));
        setMessage("Parol yangilandi. Endi kirishingiz mumkin.");
        setDone(true); setPassword("");
        history.replaceState(history.state, "", "/reset-password");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Ulanib bo‘lmadi."); } finally { setBusy(false); }
    }}>
      <label>{t("Yangi parol")}<span className="auth-password-field"><input name="newPassword" required value={password} onChange={e => setPassword(e.target.value)} type={visible ? "text" : "password"} minLength={12} maxLength={128} autoComplete="new-password" placeholder={t("Kamida 12 ta belgi")} /><button type="button" className="auth-password-toggle" aria-label={t(visible ? "Parolni yashirish" : "Parolni ko‘rsatish")} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button></span></label>
      <button type="submit" className="button primary full" disabled={busy}>{busy && <LoaderCircle size={18} className="spin"/>}{t(busy ? "Kuting…" : "Davom etish")}</button>
    </form>}
    {message && <p role="status" className="notice">{t(message)}</p>}
    <div className="auth-recovery-links"><Link href="/login">{t("Kirishga qaytish")}</Link>{!done && <Link href="/forgot-password">{t("Yangi kod so‘rash")}</Link>}</div>
  </div>;
}
