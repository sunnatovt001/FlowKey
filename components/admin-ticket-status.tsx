"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ticketStates, type TicketState } from "@/server/admin-access";
export function AdminTicketStatus({
  id,
  status,
}: {
  id: string;
  status: TicketState;
}) {
  const router = useRouter();
  const pending = useRef(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(status),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="admin-ticket-status"
      method="post"
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setFailed(false);
        setMessage("");
        try {
          const response = await fetch(
            `/api/admin/tickets/${encodeURIComponent(id)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: selected,
                expectedStatus: status,
              }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            if (response.status === 409) router.refresh();
            throw Error(data?.error?.message || "Saqlab bo‘lmadi.");
          }
          if (data?.status !== selected)
            throw Error("Holat tasdiqlanmadi. Qayta urinib ko‘ring.");
          setMessage("Holat saqlandi.");
          router.refresh();
        } catch (error) {
          setFailed(true);
          setMessage(
            error instanceof Error ? error.message : "Ulanib bo‘lmadi.",
          );
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <label>
        Murojaat holati
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as TicketState)}
          disabled={busy}
        >
          {Object.entries(ticketStates).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button className="button primary" disabled={busy || selected === status}>
        {busy ? "Saqlanmoqda…" : "Holatni saqlash"}
      </button>
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "error" : undefined}
        >
          {message}
        </p>
      )}
    </form>
  );
}
