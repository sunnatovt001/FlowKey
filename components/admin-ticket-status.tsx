"use client";
import { useState } from "react";
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
  const [selected, setSelected] = useState(status),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="admin-ticket-status"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
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
          if (!response.ok)
            throw Error(data.error?.message || "Saqlab bo‘lmadi.");
          setMessage("Holat saqlandi.");
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Ulanib bo‘lmadi.",
          );
        } finally {
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
      {message && <p role="status">{message}</p>}
    </form>
  );
}
