"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage, type Language } from "./language-provider";
const options: {value: Language; label: string; short: string; flag: "uz" | "ru" | "us"}[] = [{value:"uz",label:"O‘zbekcha",short:"UZ",flag:"uz"},{value:"ru",label:"Русский",short:"RU",flag:"ru"},{value:"en",label:"English",short:"EN",flag:"us"}];
export function LanguageSwitcher() {
  const {language,setLanguage}=useLanguage();
  const menuId=useId();
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const menu=useRef<HTMLDivElement>(null);
  const label={uz:"Tilni tanlash",ru:"Выбрать язык",en:"Choose language"}[language];
  useEffect(()=>{if(!open)return;function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false)}document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside)},[open]);
  function focusOption(index:number){const items=menu.current?.querySelectorAll<HTMLButtonElement>("button");if(items?.length)items[(index+items.length)%items.length].focus()}
  return <div className="locale-control" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}} onKeyDown={e=>{if(e.key==="Escape"){setOpen(false);trigger.current?.focus()}}}>
    <button ref={trigger} className="locale-trigger" type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={()=>setOpen(!open)} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setOpen(true);requestAnimationFrame(()=>focusOption(0))}}}><img className="locale-flag" src={`/flags/${options.find(x=>x.value===language)?.flag}.svg`} alt="" aria-hidden="true" width="22" height="22"/><span>{options.find(x=>x.value===language)?.label}</span><ChevronDown size={14} className={open?"turned":""}/></button>
    {open&&<div id={menuId} className="locale-menu" role="menu" aria-label={label} ref={menu} onKeyDown={e=>{const items=Array.from(menu.current?.querySelectorAll("button")??[]);const index=items.indexOf(document.activeElement as HTMLButtonElement);if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();focusOption(index+(e.key==="ArrowDown"?1:-1))}if(e.key==="Home"){e.preventDefault();focusOption(0)}if(e.key==="End"){e.preventDefault();focusOption(2)}}}>
      {options.map(option=><button type="button" role="menuitemradio" aria-checked={language===option.value} key={option.value} className={language===option.value?"selected":""} onClick={()=>{setLanguage(option.value);setOpen(false);trigger.current?.focus()}}><img className="locale-flag" src={`/flags/${option.flag}.svg`} alt="" aria-hidden="true" width="22" height="22"/><span>{option.label}</span>{language===option.value&&<Check size={15}/>}</button>)}
    </div>}
  </div>;
}
