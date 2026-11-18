"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, Clock3, FolderOpen, House, LayoutGrid, LoaderCircle, LockKeyhole, PlugZap, ReceiptText, RefreshCw, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { statusLabel } from "@/shared/locale";

type Data = {
  user: { name: string | null; email: string };
  projects: { id: string; name: string; role: string }[]; selected: string | null;
  dashboard: null | { volume: string; successful: number; pending: number; failed: number; total: number; keyCount: number; webhook: { text: string; tone: string }; days: { date: string; count: string; volume: string }[] };
  payments: { id: string; amountMinor: string; status: string; createdAt: string }[];
  tickets: { id: string; summary: string; resolutionStatus: string; createdAt: string }[];
};
type WebApp = { initData: string; colorScheme?: string; ready(): void; expand(): void; setHeaderColor(color: string): void; setBackgroundColor(color: string): void; onEvent(name: string, fn: () => void): void; offEvent(name: string, fn: () => void): void; HapticFeedback?: { selectionChanged(): void } };
declare global { interface Window { Telegram?: { WebApp?: WebApp } } }
const tabs = [{ id: "home", label: "Asosiy", icon: House }, { id: "payments", label: "To‘lovlar", icon: ReceiptText }, { id: "projects", label: "Loyihalar", icon: LayoutGrid }, { id: "profile", label: "Profil", icon: UserRound }] as const;
type Tab = typeof tabs[number]["id"];
const amount = (minor: string) => { const n = BigInt(minor); return new Intl.NumberFormat("uz-UZ").format(n / 100n) + (n % 100n ? `.${String(n % 100n).padStart(2, "0")}` : ""); };
const date = (value: string) => new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(new Date(value));
export function MiniApp({ nonce }: { nonce?: string }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("7");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<Data["payments"][number] | null>(null);
  const [dark, setDark] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async (project?: string, period = "7") => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/miniapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: window.Telegram?.WebApp?.initData || undefined, project, range: period }), signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) });
      const value = await res.json();
      if (!res.ok) { if (res.status === 401 || res.status === 403) setData(null); throw new Error(value.error?.message || "Ma’lumotlarni yuklab bo‘lmadi."); }
      setData(value);
    } catch (e) { if (!request.signal.aborted) setError(e instanceof Error ? e.message : "Ulanishni tekshirib, qayta urining."); }
    finally { if (!request.signal.aborted) setBusy(false); }
  }, []);
  useEffect(() => {
    const app = window.Telegram?.WebApp;
    const theme = () => setDark(app?.colorScheme === "dark");
    app?.ready(); app?.expand(); theme(); app?.setHeaderColor("#faf6fd"); app?.setBackgroundColor("#faf6fd"); app?.onEvent("themeChanged", theme);
    const startup = window.setTimeout(() => { void load(); }, 0);
    return () => { window.clearTimeout(startup); controller.current?.abort(); app?.offEvent("themeChanged", theme); };
  }, [load, sdkReady]);
  useEffect(() => { if (detail) dialog.current?.showModal(); }, [detail]);
  const navigate = (next: Tab) => { setTab(next); window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); window.scrollTo({ top: 0, behavior: "instant" }); };
  const project = data?.projects.find(p => p.id === data.selected);
  const dashboard = data?.dashboard;
  const href = (path: string) => `${path}${data?.selected ? `?project=${encodeURIComponent(data.selected)}` : ""}`;
  const rows = data?.payments.filter(p => (status === "all" || p.status === status) && p.id.toLowerCase().includes(query.toLowerCase().trim())) || [];
  const paymentRows = (payments: Data["payments"]) => <div className="mini-payments">{payments.map(p => <button className="mini-payment" key={p.id} onClick={() => setDetail(p)}><span className={`mini-payment-icon ${p.status}`}><ArrowDownLeft size={20} /></span><span className="mini-payment-copy"><strong>{amount(p.amountMinor)} <small>UZS</small></strong><span>{date(p.createdAt)}</span></span><span className={`mini-status ${p.status}`}>{statusLabel(p.status)}</span><ChevronRight size={16} /></button>)}</div>;
  return <><Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" nonce={nonce} onReady={() => setSdkReady(true)} /><main className={`mini-app${dark ? " mini-dark" : ""}`}>
    <div className="mini-shell">
      <header className="mini-header"><Link href="/miniapp" aria-label="FlowKey Business"><Image src="/brand-desktop-420.webp" width={158} height={58} alt="FlowKey" priority /></Link><span className="mini-business">Business</span><button className="mini-avatar" aria-label="Profilni ochish" onClick={() => navigate("profile")}>{data?.user.name?.[0]?.toUpperCase() || <UserRound size={20} />}</button></header>
      {busy && !data ? <section className="mini-gate" aria-live="polite"><LoaderCircle className="mini-spin" size={30} /><h1>Hisobingiz ochilmoqda</h1><p>FlowKey ma’lumotlari xavfsiz yuklanmoqda.</p></section> : !data ? <section className="mini-gate"><Image className="mini-gate-art" src="/auth-flowkey-clear.webp" width={520} height={280} alt="" /><span className="mini-eyebrow">FLOWKEY BUSINESS</span><h1>Biznesingiz.<br />Har doim yoningizda.</h1><p>To‘lovlar, loyihalar va yordam — bitta ilovada.</p><div className="mini-notice" role="alert"><LockKeyhole size={20} /><span>{error || "Davom etish uchun FlowKey hisobingizga kiring."}</span></div><Link className="mini-primary" href="/login">FlowKey’ga kirish <ArrowRight size={18} /></Link><button className="mini-secondary" onClick={() => load()}>Qayta tekshirish <RefreshCw size={16} /></button><p className="mini-caption">Telegram’da ishlatish uchun saytdagi Sozlamalar → Telegram orqali hisobingizni ulang.</p></section> : <>
        <div className="mini-project-bar"><label><span>Loyiha</span><select aria-label="Loyihani tanlash" value={data.selected || ""} disabled={busy || !data.projects.length} onChange={e => { setDetail(null); void load(e.target.value, range); }}>{data.projects.length ? data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="">Loyiha yo‘q</option>}</select></label><span className="mini-unit"><ShieldCheck size={14} /> Unit</span><button className="mini-icon-button" aria-label="Ma’lumotlarni yangilash" disabled={busy} onClick={() => load(data.selected || undefined, range)}><RefreshCw size={18} className={busy ? "mini-spin" : ""} /></button></div>
        {error && <div className="mini-notice mini-error" role="alert">{error} <button onClick={() => load(data.selected || undefined, range)}>Qayta urinish</button></div>}
        <div className="mini-content" aria-busy={busy}>
        {tab === "home" && <><div className="mini-title"><div><span className="mini-eyebrow">XUSH KELIBSIZ</span><h1>Salom, {data.user.name?.split(" ")[0] || "hamkor"}!</h1></div><span className="mini-sun" aria-hidden="true">✦</span></div><p className="mini-subtitle">Loyihangizdagi eng muhim yangiliklar.</p>
          <section className="mini-volume"><div className="mini-volume-top"><span>To‘lovlar hajmi</span><label className="mini-range"><span className="sr-only">Hisobot davri</span><select value={range} disabled={busy} onChange={e => { setRange(e.target.value); void load(data.selected || undefined, e.target.value); }}><option value="7">7 kun</option><option value="30">30 kun</option><option value="90">90 kun</option></select></label></div><strong>{amount(dashboard?.volume || "0")} <small>UZS</small></strong><p>Muvaffaqiyatli sinov to‘lovlari</p><div className="mini-chart" role="img" aria-label={`Oxirgi ${range} kun: ${dashboard?.total || 0} ta sinov to‘lovi`}>{dashboard?.days.map(d => { const max = Math.max(...dashboard.days.map(day => Number(day.count)), 1); return <span key={d.date} title={`${d.date}: ${d.count} ta`} style={{ height: `${Number(d.count) / max * 100}%` }} />; })}</div><div className="mini-chart-labels"><span>{dashboard?.days[0]?.date.slice(5).replace("-", "/") || "—"}</span><span>Bugun</span></div></section>
          <div className="mini-stats"><button onClick={() => { setStatus("successful"); navigate("payments"); }}><span className="mini-success"><Check size={17} /> O‘tgan</span><strong>{dashboard?.successful || 0}</strong></button><button onClick={() => { setStatus("pending"); navigate("payments"); }}><span className="mini-pending"><Clock3 size={17} /> Kutilmoqda</span><strong>{dashboard?.pending || 0}</strong></button><button onClick={() => { setStatus("failed"); navigate("payments"); }}><span className="mini-failed"><X size={17} /> O‘tmagan</span><strong>{dashboard?.failed || 0}</strong></button></div>
          <div className="mini-section-heading"><h2>Tezkor amallar</h2></div><div className="mini-shortcuts"><button onClick={() => navigate("projects")}><FolderOpen size={23} /><span>Loyihalar</span></button><Link href={href("/developers")}><PlugZap size={23} /><span>Integratsiya</span></Link><button onClick={() => navigate("profile")}><CircleHelp size={23} /><span>Yordam</span></button></div>
          <div className="mini-section-heading"><h2>Oxirgi to‘lovlar</h2><button onClick={() => { setStatus("all"); navigate("payments"); }}>Barchasi <ArrowRight size={15} /></button></div>{data.payments.length ? paymentRows(data.payments.slice(0, 4)) : <div className="mini-empty"><ReceiptText size={27} /><h3>Hali to‘lovlar yo‘q</h3><p>Birinchi sinov natijangiz shu yerda ko‘rinadi.</p><Link href={href("/testing")}>Sinov markazini ochish <ArrowUpRight size={15} /></Link></div>}
        </>}
        {tab === "payments" && <><div className="mini-title"><h1>To‘lovlar</h1><span className="mini-count">{data.payments.length}</span></div><p className="mini-subtitle">Oxirgi 50 ta sinov to‘lovi · Toshkent vaqti</p><label className="mini-search"><Search size={19} /><input aria-label="To‘lov ID’sini qidirish" placeholder="To‘lov ID’sini qidiring" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="mini-filters" aria-label="To‘lov holati">{[["all", "Barchasi"], ["successful", "O‘tgan"], ["pending", "Kutilmoqda"], ["failed", "O‘tmagan"]].map(([id, label]) => <button key={id} aria-pressed={status === id} onClick={() => setStatus(id)}>{label}</button>)}</div>{rows.length ? paymentRows(rows) : <div className="mini-empty"><Search size={28} /><h2>To‘lov topilmadi</h2><p>Qidiruv yoki tanlangan holatni o‘zgartiring.</p><button onClick={() => { setQuery(""); setStatus("all"); }}>Filtrlarni tozalash</button></div>}</>}
        {tab === "projects" && <><div className="mini-title"><h1>Loyihalar</h1><span className="mini-count">{data.projects.length}</span></div><p className="mini-subtitle">Kerakli loyihani tanlang va holatini kuzating.</p><div className="mini-project-list">{data.projects.map(p => <button key={p.id} disabled={busy} onClick={() => { void load(p.id, range); navigate("home"); }}><span className="mini-project-symbol">{p.name[0]}</span><span><strong>{p.name}</strong><small>{{ owner: "Loyiha egasi", developer: "Dasturchi", accountant: "Buxgalter" }[p.role] || p.role}</small></span>{p.id === data.selected ? <span className="mini-selected"><Check size={17} /> Tanlangan</span> : <ChevronRight size={18} />}</button>)}</div><Link className="mini-secondary" href="/projects/new">Yangi loyiha yaratish <ArrowRight size={18} /></Link>{dashboard && <section className="mini-connection"><h2>{project?.name} · Ulanish</h2><p><span>Faol API kalitlari</span><strong>{dashboard.keyCount} ta</strong></p><p><span>Webhook</span><strong>{dashboard.webhook.text}</strong></p><Link href={href("/developers")}>Ulanishni boshqarish <ArrowUpRight size={16} /></Link></section>}</>}
        {tab === "profile" && <><div className="mini-title"><h1>Profil va yordam</h1></div><div className="mini-profile"><span className="mini-avatar">{data.user.name?.[0] || "F"}</span><h2>{data.user.name || "FlowKey foydalanuvchisi"}</h2><p>{data.user.email}</p></div><div className="mini-link-list"><Link href={href("/settings")}><UserRound size={20} /><span>Hisob sozlamalari</span><ChevronRight size={18} /></Link><Link href={`${href("/settings")}#security`}><ShieldCheck size={20} /><span>Xavfsizlik va sessiyalar</span><ChevronRight size={18} /></Link><Link href="/guide"><CircleHelp size={20} /><span>Qo‘llanma</span><ChevronRight size={18} /></Link></div><div className="mini-section-heading"><h2>Murojaatlarim</h2></div>{data.tickets.length ? <div className="mini-tickets">{data.tickets.map(t => <article key={t.id}><span className="mini-status">{t.resolutionStatus === "resolved" ? "Hal qilingan" : t.resolutionStatus === "in_progress" ? "Ko‘rib chiqilmoqda" : "Yangi"}</span><h3>{t.summary}</h3><p>{date(t.createdAt)}</p></article>)}</div> : <div className="mini-empty"><CircleHelp size={26} /><h3>Qanday yordam kerak?</h3><p>Murojaatingiz hisobingizga bog‘lanib saqlanadi.</p></div>}<Link className="mini-primary" href={`${href("/settings")}#telegram`}>Yordamga murojaat qilish <ArrowRight size={18} /></Link></>}
        <aside className="mini-environment"><ShieldCheck size={17} /><p><strong>Sinov muhiti</strong><span>Haqiqiy pul yechilmaydi va o‘tkazilmaydi.</span></p></aside></div>
        <nav className="mini-bottom-nav" aria-label="Asosiy navigatsiya">{tabs.map(t => <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => navigate(t.id)}><t.icon size={22} strokeWidth={tab === t.id ? 2.5 : 1.7} /><span>{t.label}</span></button>)}</nav>
      </>}
    </div>
    <dialog ref={dialog} className="mini-dialog" onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} aria-labelledby="mini-payment-title">{detail && <><button className="mini-icon-button mini-dialog-close" autoFocus aria-label="Yopish" onClick={() => dialog.current?.close()}><X size={22} /></button><span className={`mini-status ${detail.status}`}>{statusLabel(detail.status)}</span><h2 id="mini-payment-title">{amount(detail.amountMinor)} UZS</h2><p>Sinov to‘lovi · {project?.name}</p><dl><dt>Sana · Toshkent</dt><dd>{date(detail.createdAt)}</dd><dt>To‘lov ID’si</dt><dd className="mini-id">{detail.id}</dd></dl><p className="mini-caption">Bu yozuv haqiqiy bank o‘tkazmasi emas.</p><button className="mini-primary" onClick={() => dialog.current?.close()}>Tushunarli <Check size={18} /></button></>}</dialog>
  </main></>;
}
