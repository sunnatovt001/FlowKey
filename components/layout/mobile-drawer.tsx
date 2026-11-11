"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "../i18n/language-provider";
const labels={uz:{open:"Menyuni ochish",close:"Menyuni yopish",title:"Menyu"},ru:{open:"Открыть меню",close:"Закрыть меню",title:"Меню"},en:{open:"Open menu",close:"Close menu",title:"Menu"}};
export function MobileDrawer({children,id}:{children:ReactNode;id:string}){
 const {language}=useLanguage();const text=labels[language];
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(!open)return;const dialog=ref.current;if(!dialog)return;dialog.showModal();const previous=document.body.style.overflow;const previousRoot=document.documentElement.style.overflow;document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";return()=>{dialog.close();document.body.style.overflow=previous;document.documentElement.style.overflow=previousRoot}},[open]);
 function close(){setOpen(false)}
 return <><button className="mobile-menu-trigger" type="button" aria-label={text.open} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(true)}><Menu size={23}/></button>{open&&createPortal(<dialog className="mobile-drawer" ref={ref} id={id} aria-labelledby={`${id}-title`} onCancel={close} onClose={close} onClick={event=>{if(event.target===event.currentTarget)close();if((event.target as HTMLElement).closest('a[href]'))close()}}><header className="drawer-heading"><strong id={`${id}-title`}>{text.title}</strong><button type="button" className="drawer-close" aria-label={text.close} onClick={close} autoFocus><X size={22}/></button></header><div className="drawer-content">{children}</div></dialog>,document.body)}</>;
}
