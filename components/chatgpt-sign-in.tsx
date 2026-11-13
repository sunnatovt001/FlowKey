"use client";
import { useState } from "react";
import { T, useTranslation } from "./i18n/language-provider";

/** Reserved provider: no redirect or identity claim until official access exists. */
export function ChatGPTSignIn() {
  const [open, setOpen] = useState(false);
  const t = useTranslation();
  return <>
    <button type="button" className="button secondary social-sign-in-button chatgpt-sign-in" aria-label="ChatGPT" aria-expanded={open} aria-controls="chatgpt-sign-in-status" title={t("ChatGPT orqali kirish hozircha mavjud emas")} onClick={() => setOpen(!open)}>
      <img src="/brands/openai.svg" width="22" height="22" alt="" aria-hidden="true" className="provider-brand-icon" />
      <span className="sr-only">ChatGPT</span>
    </button>
    {open && <p id="chatgpt-sign-in-status" className="auth-provider-notice" role="status"><T>ChatGPT orqali kirish hozircha mavjud emas. Boshqa kirish usulini tanlang.</T></p>}
  </>;
}
