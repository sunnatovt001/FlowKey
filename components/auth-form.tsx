"use client";
import { AuthPasswordIcon } from "./auth-password-icon";
import { T, useTranslation } from "./i18n/language-provider";
import { authError } from "@/shared/locale";
import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
export function AuthForm({
  signup,
}: {
  signup: boolean;
}) {
  const router = useRouter();
  const t = useTranslation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            const values = Object.fromEntries(form);
            const res = await fetch(
              `/api/auth/${signup ? "sign-up/email" : "sign-in/email"}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...values,
                  email: String(values.email).trim().toLowerCase(),
                  name: String(values.email).split("@")[0],
                  callbackURL: "/onboarding",
                }),
              },
            );
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              if (data?.code === "EMAIL_NOT_VERIFIED" || (signup && (res.status >= 500 || String(data?.code).startsWith("USER_ALREADY_EXISTS")))) {
                try { sessionStorage.setItem("flowkey-verify-email", String(values.email).trim().toLowerCase()); sessionStorage.removeItem("flowkey-verify-sent"); } catch { /* Email can be entered on next screen. */ }
                router.push("/verify-email");
                return;
              }
              throw new Error(authError(data?.code, res.status));
            }
            if (!data)
              throw new Error(
                "Kirish xizmati javobi to‘liq kelmadi. Qayta urinib ko‘ring.",
              );
            if (signup) {
              try {
                sessionStorage.setItem("flowkey-verify-email", String(values.email).trim().toLowerCase());
                sessionStorage.setItem("flowkey-verify-sent", "1");
              } catch { /* The verification page also accepts manual email entry. */ }
              router.push("/verify-email");
              setLoading(false);
            } else {
              router.push("/onboarding");
              router.refresh();
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Ulanib bo‘lmadi. Qayta urinib ko‘ring.",
            );
            setLoading(false);
          }
        }}
      >
        <label>
          <T>Elektron pochta manzili</T>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            maxLength={254}
          />
        </label>
        <label>
          <T>Parol</T>
          <span className="auth-password-field"><input
            required
            name="password"
            type={visible ? "text" : "password"} data-visible={visible}
            minLength={12}
            maxLength={128}
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder={t(signup ? "Kamida 12 ta belgi" : "Parolingiz")}
          />
          <button type="button" className="auth-password-toggle" aria-label={t(visible ? "Parolni yashirish" : "Parolni ko‘rsatish")} aria-pressed={visible} onClick={() => setVisible(!visible)}><AuthPasswordIcon visible={visible} /></button></span>
        </label>
        {signup && <p className="form-hint"><T>Kamida 12 ta belgi.</T></p>}
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        <button className="button primary full" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : null}
          {t(loading ? "Kuting…" : signup ? "Hisob yaratish" : "Kirish")}

        </button>

      </form>
      <div className="auth-access-links"><Link className="auth-forgot-link" href="/forgot-password">{t("Parolni unutdingizmi?")}</Link>
        <p className="form-bottom">
          {t(signup ? "Hisobingiz bormi?" : "FlowKey’da yangimisiz?")}{" "}
          <Link href={signup ? "/login" : "/signup"}>
            {t(signup ? "Kirish" : "Hisob yarating")}
          </Link>
        </p>
      </div>
    </>
  );
}
