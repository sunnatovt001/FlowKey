"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage, type Language } from "./language-provider";

const options = [
  { value: "uz", label: "O‘zbekcha", flag: "uz" },
  { value: "ru", label: "Русский", flag: "ru" },
  { value: "en", label: "English", flag: "us" },
] as const satisfies readonly { value: Language; label: string; flag: string }[];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const label = { uz: "Tilni tanlash", ru: "Выбрать язык", en: "Choose language" }[language];
  const current = options.find(option => option.value === language) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!(event.target instanceof Node) || !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function focusOption(index: number) {
    const items = menu.current?.querySelectorAll<HTMLButtonElement>("button");
    if (items?.length) items[(index + items.length) % items.length].focus();
  }

  return (
    <div className="locale-control" data-open={open} ref={root}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={event => {
        if (event.key !== "Escape" || !open) return;
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }}>
      <button ref={trigger} className="locale-trigger" type="button" aria-label={label}
        aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => focusOption(event.key === "ArrowDown" ? 0 : options.length - 1));
        }}>
        <img className="locale-flag" src={`/flags/${current.flag}.svg`} alt="" width={22} height={22} />
        <span>{current.label}</span>
        <ChevronDown size={14} className={open ? "turned" : ""} aria-hidden="true" />
      </button>
      <div id={menuId} className="locale-menu" role="menu" aria-label={label} ref={menu} inert={!open}
        onKeyDown={event => {
          const items = Array.from(menu.current?.querySelectorAll("button") ?? []);
          const index = items.indexOf(document.activeElement as HTMLButtonElement);
          const position = {
            ArrowDown: index + 1,
            ArrowUp: index - 1,
            Home: 0,
            End: items.length - 1,
          }[event.key];
          if (position === undefined) return;
          event.preventDefault();
          focusOption(position);
        }}>
        {options.map(option => (
          <button key={option.value} type="button" role="menuitemradio" aria-checked={language === option.value}
            className={language === option.value ? "selected" : ""}
            onClick={() => {
              setLanguage(option.value);
              setOpen(false);
              trigger.current?.focus();
            }}>
            <img className="locale-flag" src={`/flags/${option.flag}.svg`} alt="" width={22} height={22} />
            <span>{option.label}</span>
            {language === option.value && <Check size={15} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
