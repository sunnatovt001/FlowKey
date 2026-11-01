"use client";
import { authError } from "@/shared/locale";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { RecoveryForm } from "./recovery-form";
import { useRouter } from "next/navigation";
export function AuthForm({
  signup,
  localMail = false,
}: {
  signup: boolean;
  localMail?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
            if (!res.ok) throw new Error(authError(data?.code, res.status));
            if (!data)
              throw new Error(
                "Kirish xizmati javobi to‘liq kelmadi. Qayta urinib ko‘ring.",
              );
            if (signup) {
              setMessage(
                "Davom etishdan oldin elektron pochtangizni tasdiqlang.",
              );
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
          Elektron pochta manzili
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="siz@kompaniya.uz"
            maxLength={254}
          />
        </label>
        <label>
          Parol
          <input
            required
            name="password"
            type={visible ? "text" : "password"}
            minLength={12}
            maxLength={128}
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder={signup ? "Kamida 12 ta belgi" : "Parolingiz"}
          />
        </label>
        <button
          type="button"
          className="button secondary small"
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Yashirish" : "Ko‘rsatish"} — parol
        </button>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {signup && <p className="form-hint">Kamida 12 ta belgi.</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : null}
          {loading ? "Kuting…" : signup ? "Hisob yaratish" : "Kirish"}
          {!loading && <ArrowRight size={16} />}
        </button>
        <p className="form-bottom">
          {signup ? "Hisobingiz bormi?" : "FlowKey’da yangimisiz?"}{" "}
          <Link href={signup ? "/login" : "/signup"}>
            {signup ? "Kirish" : "Hisob yarating"}
          </Link>
        </p>
      </form>
      <RecoveryForm localMail={localMail} />
    </>
  );
}
