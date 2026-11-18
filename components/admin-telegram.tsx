"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminTelegram({
  linked,
  expiresAt,
  botUsername,
}: {
  linked: boolean;
  expiresAt: string | null;
  botUsername: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function change(enabled: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/telegram", {
        method: enabled ? "POST" : "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error?.message || "Sozlab bo‘lmadi.");
      setMessage(
        enabled
          ? "Telegram admin boshqaruvi 15 daqiqaga yoqildi. Botga /panel yozing."
          : "Telegram admin boshqaruvi yopildi.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ulanib bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel admin-panel">
      <h2>Telegram orqali boshqarish</h2>
      <p>
        {linked
          ? "Admin Telegram hisobingiz ulangan."
          : "Avval Hisob sozlamalarida o‘z admin hisobingizni Telegram’ga ulang."}
      </p>
      <p>
        {expiresAt
          ? `Ruxsat tugashi: ${new Date(expiresAt).toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent" })} · Toshkent vaqti`
          : "Telegram admin boshqaruvi hozir yopiq."}
      </p>
      <p>
        Murojaatlar, ularning holati, foydalanuvchilar va loyihalarni botdan
        ko‘rasiz. Parolni Telegram’ga yubormang.
      </p>
      <div className="admin-actions">
        <button
          className="button primary"
          disabled={busy || !linked}
          onClick={() => void change(true)}
        >
          {busy ? "Saqlanmoqda…" : "15 daqiqaga yoqish"}
        </button>
        <button
          className="button secondary"
          disabled={busy || !linked || !expiresAt}
          onClick={() => void change(false)}
        >
          Ruxsatni bekor qilish
        </button>
        {botUsername && (
          <a
            className="button secondary"
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Botni ochish
          </a>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
