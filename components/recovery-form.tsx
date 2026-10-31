"use client";
import { authError } from "@/shared/locale";
import { useSyncExternalStore, useState } from "react";
const subscribe = () => () => {};
export function RecoveryForm({ localMail = false }: { localMail?: boolean }) {
  const [selectedMode, setMode] = useState("");
  const search = useSyncExternalStore(
    subscribe,
    () => location.search,
    () => "",
  );
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";
  const mode =
    selectedMode ||
    (token
      ? "reset"
      : params.get("mode") === "verify" || params.has("error")
        ? "verify"
        : "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section aria-label="Hisobni tiklash">
      <p>
        <button
          type="button"
          className="button secondary small"
          onClick={() => setMode("forgot")}
        >
          Parolni unutdingizmi?
        </button>{" "}
        <button
          type="button"
          className="button secondary small"
          onClick={() => setMode("verify")}
        >
          Pochtani tasdiqlash
        </button>
      </p>
      {!mode && message && <p role="status">{message}</p>}
      {mode && (
        <fieldset disabled={busy}>
          <legend>
            {mode === "reset"
              ? "Yangi parol o‘rnatish"
              : mode === "verify"
                ? "Tasdiqlash xatini qayta yuborish"
                : "Parolni tiklash"}
          </legend>
          <label>
            {mode === "reset" ? "Yangi parol" : "Hisob elektron pochtasi"}
            <input
              id="recovery-value"
              type={mode === "reset" ? "password" : "email"}
              minLength={mode === "reset" ? 12 : undefined}
              maxLength={mode === "reset" ? 128 : 254}
              autoComplete={mode === "reset" ? "new-password" : "email"}
            />
          </label>
          {mode === "reset" && (
            <p className="form-hint">
              Yangi parol kamida 12 ta belgidan iborat bo‘lsin.
            </p>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={async () => {
              const value = (
                document.getElementById("recovery-value") as HTMLInputElement
              ).value;
              if (!value) {
                setMessage(
                  "Elektron pochtangiz yoki yangi parolingizni kiriting.",
                );
                return;
              }
              setBusy(true);
              setMessage("");
              try {
                const endpoint =
                  mode === "reset"
                    ? "reset-password"
                    : mode === "verify"
                      ? "send-verification-email"
                      : "request-password-reset";
                const body =
                  mode === "reset"
                    ? { token, newPassword: value }
                    : mode === "verify"
                      ? {
                          email: value.trim().toLowerCase(),
                          callbackURL: "/onboarding",
                        }
                      : {
                          email: value.trim().toLowerCase(),
                          redirectTo: `${location.origin}/login`,
                        };
                const response = await fetch(`/api/auth/${endpoint}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });
                const data = await response.json().catch(() => null);
                if (!response.ok)
                  throw new Error(authError(data?.code, response.status));
                setMessage(
                  mode === "reset"
                    ? "Parol yangilandi. Endi kirishingiz mumkin."
                    : "Agar hisob mavjud va talabga mos bo‘lsa, xat yuborish so‘raldi.",
                );
                if (mode === "reset") history.replaceState(null, "", "/login");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Ulanib bo‘lmadi.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Kuting…" : "Davom etish"}
          </button>
          <p role="status">{message}</p>
          {localMail && mode !== "reset" && (
            <p className="form-hint">
              Local rejim: xat Gmail’ga yuborilmaydi. Tiklash yoki tasdiqlash
              havolasi kompyuteringizdagi <code>local-data/mail</code> papkasiga
              saqlanadi.
            </p>
          )}
        </fieldset>
      )}
    </section>
  );
}
