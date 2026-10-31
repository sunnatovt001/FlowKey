"use client";
import { statusLabel } from "@/shared/locale";
import { useState, useSyncExternalStore } from "react";
const subscribeHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
export function CheckoutAction({ id, start = false }: { id: string; start?: boolean }) {
  const ready = useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(result: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(start ? `/api/payment-links/${id}` : `/api/checkout/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(start ? {} : { result }) });
      const data = await response.json() as { id?: string; status?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message || "To‘lovni bajarib bo‘lmadi.");
      if (start) { if (!data.id || !/^[a-f0-9]{64}$/.test(data.id)) throw new Error("To‘lov sessiyasi javobi noto‘g‘ri. Qayta urinib ko‘ring."); window.location.assign(`/checkout/${data.id}`); return; }
      setDone(true); setMessage(`Sinov to‘lovi: ${statusLabel(data.status || "")}. Tranzaksiya: ${data.id}. Pul o‘tkazilmadi.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Qayta urinib ko‘ring."); }
    finally { setBusy(false); }
  }
  return <div>{!start && !done && <p className="muted">Sinov natijasini tanlang. Karta ma’lumotlari kerak emas.</p>}
    <div className="nav-actions checkout-actions">{(start ? ["Sinov to‘lov sahifasiga o‘tish"] : ["successful", "failed", "pending"]).map(result => <button key={result} className="button primary" disabled={!ready || busy || done} onClick={() => submit(result)}>{!ready ? "Yuklanmoqda…" : busy ? "Bajarilmoqda…" : start ? result : statusLabel(result)}</button>)}</div>
    <p role="status" style={{ overflowWrap: "anywhere" }}>{message}</p>
  </div>;
}
