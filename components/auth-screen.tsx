"use client";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import { SocialSignIn } from "./social-sign-in";
import { LanguageSwitcher } from "./i18n/language-switcher";
import { T } from "./i18n/language-provider";
import { GoogleOneTap } from "./google-one-tap";
export function AuthScreen({ signup, localMail, available, googleClientId, nonce }: { signup: boolean; localMail: boolean; available: { google: boolean; github: boolean }; googleClientId?: string; nonce?: string }) {
  return <main className="auth-scene">
    <div className="auth-scene-language"><LanguageSwitcher /></div>
    <section className="auth-card" aria-labelledby="auth-heading">
      <header className="auth-card-header"><Link href="/" aria-label="FlowKey"><img src="/brand-symbol-128.webp" width="64" height="64" alt="FlowKey" /></Link><h1 id="auth-heading"><T>{signup ? "FlowKey’da hisob yaratish" : "FlowKey’ga kirish"}</T></h1></header>
      <AuthForm signup={signup} localMail={localMail} />
      <div className="auth-method-divider"><span><T>yoki</T></span></div>
      <SocialSignIn available={available} compact iconOnly />
    </section>
    <p className="auth-scene-note"><T>Faqat sinov. Haqiqiy pul ishlatilmaydi.</T></p>
    {googleClientId && <GoogleOneTap clientId={googleClientId} nonce={nonce} />}
  </main>;
}
