"use client";
import { Globe2 } from "lucide-react";
import { useLanguage, type Language } from "./language-provider";
export function LanguageSwitcher() {
  const {language, setLanguage} = useLanguage();
  const label = {uz: "Tilni tanlash", ru: "Выбрать язык", en: "Choose language"}[language];
  return <label className="language-switcher"><Globe2 size={16} aria-hidden="true"/><span className="sr-only">{label}</span><select aria-label={label} value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="uz">O‘zbekcha</option><option value="ru">Русский</option><option value="en">English</option></select></label>;
}
