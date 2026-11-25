"use client";
import "@/styles/auth-review.css";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import { SocialSignIn } from "./social-sign-in";
import { LanguageSwitcher } from "./i18n/language-switcher";
import { T } from "./i18n/language-provider";
import { GoogleOneTap } from "./google-one-tap";
import { AuthStepTransition } from "./auth-step-transition";
import { RecoveryForm, type RecoveryMode } from "./recovery-form";
import { TelegramLoginScreen } from "./telegram-login-screen";
type Mode = "login" | "signup" | "telegram" | RecoveryMode;
export function AuthScreen({ signup = false, mode: providedMode, localMail = false, available = {google:false,github:false}, googleClientId, nonce }: { signup?: boolean; mode?: Mode; localMail?: boolean; available?: { google: boolean; github: boolean }; googleClientId?: string; nonce?: string }) {
  const mode = providedMode || (signup ? "signup" : "login");
  const titles = { login: "FlowKey’ga kirish", signup: "FlowKey’da hisob yaratish", forgot: "Parolni tiklash", reset: "Yangi parol o‘rnatish", verify: "Pochtani tasdiqlash", telegram: "Telegram orqali kirish" };
  const normal = mode === "login" || mode === "signup";
  return <main className="auth-scene">
    <div className="auth-scene-language"><LanguageSwitcher /></div>
    <AuthStepTransition stepKey={mode}><section className="auth-card" aria-labelledby="auth-heading">
      <header className="auth-card-header"><Link href="/" aria-label="FlowKey"><img src="/brand-symbol-128.webp" width="64" height="64" alt="FlowKey" /></Link><h1 id="auth-heading"><T>{titles[mode]}</T></h1></header>
      {normal ? <><AuthForm signup={mode === "signup"} /><div className="auth-method-divider"><span><T>yoki</T></span></div><SocialSignIn available={available} compact iconOnly /></> : mode === "telegram" ? <TelegramLoginScreen /> : <RecoveryForm mode={mode} localMail={localMail} />}
    </section></AuthStepTransition>
    <p className="auth-scene-note"><T>Faqat sinov. Haqiqiy pul ishlatilmaydi.</T></p>
    {normal && googleClientId && <GoogleOneTap clientId={googleClientId} nonce={nonce} />}
  </main>;
}
