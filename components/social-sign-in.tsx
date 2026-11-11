"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TelegramSignIn } from "./telegram-sign-in";
import { T } from "./i18n/language-provider";
import { LoaderCircle } from "lucide-react";

function GitHubIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.13H3.05v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.71 9.4 5.95 12 5.95Z"
      />
    </svg>
  );
}

export function SocialSignIn({
  available, compact = false,
}: {
  available?: { google: boolean; github: boolean };
  compact?: boolean;
}) {
  const [providers, setProviders] = useState({ google: available?.google ?? false, github: available?.github ?? false, telegram: false });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/providers", { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) setProviders({ google: data.google === true, github: data.github === true, telegram: data.telegram === true });
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const [pending, setPending] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");
  const query = useSearchParams();
  const callbackError = query.get("error")
    ? query.get("error") === "account_not_linked"
      ? "Bu email uchun avval parol bilan kiring."
      : "Google yoki GitHub orqali kirib bo‘lmadi. Qayta urinib ko‘ring."
    : "";

  async function signIn(provider: "google" | "github") {
    setPending(provider);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          callbackURL: "/onboarding",
          newUserCallbackURL: "/onboarding",
          errorCallbackURL: "/login",
          disableRedirect: true,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.url !== "string") throw new Error();
      const target = new URL(data.url);
      const expectedHost =
        provider === "google" ? "accounts.google.com" : "github.com";
      if (target.protocol !== "https:" || target.hostname !== expectedHost)
        throw new Error();
      window.location.assign(target.href);
    } catch {
      setError("Kirishni boshlab bo‘lmadi. Qayta urinib ko‘ring.");
      setPending(null);
    }
  }

  return (
    <div className="social-sign-in">
      {(["google", "github"] as const).map((provider) => {
        const name = provider === "google" ? "Google" : "GitHub";
        return (
          <button
            key={provider}
            type="button"
            className="button secondary social-sign-in-button"
            disabled={!providers[provider] || pending !== null}
            title={
              !providers[provider]
                ? name + " orqali kirish hali sozlanmagan"
                : undefined
            }
            onClick={() => void signIn(provider)}
          >
            {pending === provider ? (
              <LoaderCircle className="spin" size={22} />
            ) : provider === "google" ? (
              <GoogleIcon />
            ) : (
              <GitHubIcon />
            )}
            <span><T>{name + " orqali kirish"}</T></span>
            {!providers[provider] && <small><T>Sozlanmagan</T></small>}
          </button>
        );
      })}
      <TelegramSignIn available={providers.telegram} />
      {(error || callbackError) && (
        <p className="error" role="alert">
          {error || callbackError}
        </p>
      )}
      {!compact && <div className="auth-divider">
        <span>yoki</span>
      </div>}
    </div>
  );
}
