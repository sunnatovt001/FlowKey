"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "./i18n/language-provider";
type GoogleIdentity = { initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; auto_select: boolean; cancel_on_tap_outside: boolean; use_fedcm_for_prompt: boolean }) => void; prompt: () => void; cancel: () => void };
function identity() { return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id; }
export function GoogleOneTap({ clientId, nonce }: { clientId: string; nonce?: string }) {
  const pending = useRef(false);
  const mounted = useRef(true);
  const [error, setError] = useState(false);
  const initialize = useCallback(() => {
    const google = identity();
    if (!google || !mounted.current) return;
    google.initialize({ client_id: clientId, auto_select: false, cancel_on_tap_outside: true, use_fedcm_for_prompt: true,
      callback: async ({ credential }) => {
        if (!credential || pending.current || !mounted.current) return;
        pending.current = true;
        try {
          const response = await fetch("/api/auth/one-tap/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: credential, callbackURL: "/onboarding" }) });
          if (!response.ok) throw new Error();
          if (mounted.current) window.location.assign("/onboarding");
        } catch { if (mounted.current) setError(true); pending.current = false; }
      },
    });
    google.prompt();
  }, [clientId]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; identity()?.cancel(); }; }, []);
  return <><Script id="flowkey-google-identity" src="https://accounts.google.com/gsi/client" nonce={nonce} strategy="afterInteractive" onReady={initialize} />{error && <p className="auth-google-error" role="alert"><T>Google orqali kirib bo‘lmadi. Quyidagi Google tugmasidan foydalaning.</T></p>}</>;
}
