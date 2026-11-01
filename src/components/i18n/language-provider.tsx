"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages } from "./messages";
export type Language = "uz" | "ru" | "en";
const LanguageContext = createContext<{language: Language; setLanguage: (language: Language) => void}>({language: "uz", setLanguage: () => {}});
const storageKey = "flowkey-language";
export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, updateLanguage] = useState<Language>("uz");
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved === "uz" || saved === "ru" || saved === "en") { updateLanguage(saved); document.documentElement.lang = saved; } } catch { /* Storage may be disabled. */ }
  }, []);
  function setLanguage(value: Language) {
    updateLanguage(value);
    document.documentElement.lang = value;
    try { localStorage.setItem(storageKey, value); } catch { /* Selection still works in memory. */ }
  }
  return <LanguageContext.Provider value={{language, setLanguage}}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
export function T({children}: {children: string}) {
  const {language} = useLanguage();
  return language === "uz" ? children : messages[children]?.[language] ?? children;
}
