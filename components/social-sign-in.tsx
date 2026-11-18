"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatGPTSignIn } from "./chatgpt-sign-in";
import { TelegramSignIn } from "./telegram-sign-in";
import { T } from "./i18n/language-provider";
import { LoaderCircle } from "lucide-react";

function GitHubIcon() {
  return <img src="/brands/github.svg" width="22" height="22" alt="" aria-hidden="true" className="provider-brand-icon" />;
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
  available, compact = false, iconOnly = false,
}: {
  available?: { google: boolean; github: boolean };
  compact?: boolean;
  iconOnly?: boolean;
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
    <div className={iconOnly ? "social-sign-in social-sign-in-icons" : "social-sign-in"}>
      {(["google", "github"] as const).map((provider) => {
        const name = provider === "google" ? "Google" : "GitHub";
        return (
          <button
            key={provider}
            type="button"
            className="button secondary social-sign-in-button"
            aria-label={iconOnly ? (provider === "google" ? "Google" : "GitHub") : undefined}
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
            <span className={iconOnly ? "sr-only" : undefined}><T>{name + " orqali kirish"}</T></span>
            {!providers[provider] && <small><T>Sozlanmagan</T></small>}
          </button>
        );
      })}
      <TelegramSignIn available={providers.telegram} iconOnly={iconOnly} />
      {iconOnly && <ChatGPTSignIn />}
      {(error || callbackError) && (
        <p className="error" role="alert">
          <T>{error || callbackError}</T>
        </p>
      )}
      {!compact && <div className="auth-divider">
        <span>yoki</span>
      </div>}
    </div>
  );
}
