"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const form = event.currentTarget;
        const data = new FormData(form);
        try {
          const response = await fetch("/api/admin-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.get("email"),
              password: data.get("password"),
            }),
          });
          const result = await response.json();
          if (!response.ok)
            throw Error(result.error?.message || "Kirish amalga oshmadi.");
          form.reset();
          router.replace("/admin");
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Ulanib bo‘lmadi.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Login
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label>
        Admin paroli
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      {message && <p role="alert">{message}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Tekshirilmoqda…" : "Admin panelga kirish"}
      </button>
    </form>
  );
}
export function AdminLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="button secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/admin-session", { method: "DELETE" });
          if (res.ok) {
            router.replace("/admin-login");
            router.refresh();
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      Admin sessiyasini yopish
    </button>
  );
}
