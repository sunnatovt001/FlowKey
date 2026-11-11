"use client";
import { useLanguage } from "@/components/i18n/language-provider";
const copy = { uz: ["Endi", "sodda."], ru: ["Теперь", "проще."], en: ["Made", "simple."] } as const;
export function HeroTagline() {
  const { language } = useLanguage();
  const [prefix, word] = copy[language];
  return <>{prefix} <span className="hero-color-word">{word}</span></>;
}
