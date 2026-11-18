"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function AdminTicketReply({ id }: { id: string }) {
  const router = useRouter();
  const pending = useRef(false),
    key = useRef<string | null>(null);
  const [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  return (
    <form
      className="admin-ticket-status"
      method="post"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError("");
        setNotice("");
        key.current ??= crypto.randomUUID();
        try {
          const response = await fetch(
            `/api/admin/tickets/${encodeURIComponent(id)}/replies`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content, requestKey: key.current }),
            },
          );
          const result = await response.json();
          if (!response.ok)
            throw Error(result?.error?.message || "Javob saqlanmadi.");
          if (
            typeof result?.id !== "string" ||
            typeof result?.content !== "string"
          )
            throw Error("Javob tasdiqlanmadi. Qayta urinib ko‘ring.");
          setContent("");
          key.current = null;
          setNotice("Javob saqlandi. Foydalanuvchi uni saytda ko‘radi.");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Ulanib bo‘lmadi.");
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <label>
        Foydalanuvchiga javob
        <textarea
          required
          minLength={2}
          maxLength={2000}
          rows={5}
          disabled={busy}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            key.current = null;
          }}
          placeholder="Muammoning yechimi yoki keyingi qadamni yozing"
        />
      </label>
      <button
        className="button primary"
        disabled={busy || content.trim().length < 2}
      >
        {busy ? "Saqlanmoqda…" : "Javobni yuborish"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </form>
  );
}
