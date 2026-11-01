"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { messages } from "./messages";
export type Language = "uz" | "ru" | "en";
const LanguageContext = createContext<{language: Language; setLanguage: (language: Language) => void}>({language: "uz", setLanguage: () => {}});
const storageKey = "flowkey-language";
const languageEvent = "flowkey-language-change";
let activeLanguage: Language | undefined;
function languageSnapshot(): Language {
  if (activeLanguage) return activeLanguage;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "uz" || saved === "ru" || saved === "en") return saved;
  } catch { /* Storage may be disabled. */ }
  return "uz";
}
function subscribeLanguage(notify: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) {
      activeLanguage = undefined;
      notify();
    }
  };
  window.addEventListener("storage", storageChanged);
  window.addEventListener(languageEvent, notify);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(languageEvent, notify);
  };
}
const serverLanguage = (): Language => "uz";
export function LanguageProvider({children}: {children: ReactNode}) {
  const language = useSyncExternalStore(subscribeLanguage, languageSnapshot, serverLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function setLanguage(value: Language) {
    activeLanguage = value;
    try { localStorage.setItem(storageKey, value); } catch { /* Selection still works in memory. */ }
    window.dispatchEvent(new Event(languageEvent));
  }
  return <LanguageContext.Provider value={{language, setLanguage}}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
export function T({children}: {children: string}) {
  const {language} = useLanguage();
  return language === "uz" ? children : messages[children]?.[language] ?? children;
}
