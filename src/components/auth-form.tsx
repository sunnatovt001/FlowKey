"use client";
import Link from "./site-link";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function AuthForm({ signup }: { signup: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
          const res = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(form)),
          });
          const data = await res.json() as {error:{message:string};redirect:string};
          if (!res.ok) throw new Error(data.error.message);
          window.location.assign(data.redirect);
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
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={signup ? "Kamida 12 ta belgi" : "Parolingiz"}
        />
      </label>
      {signup && (
        <p className="form-hint">
          Kamida 12 ta belgi ishlating. Bank yoki karta ma’lumotlari kerak emas.
        </p>
      )}
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
  );
}

