"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function EndpointEditor({
  projectId,
  endpoint,
  onSecret,
}: {
  projectId: string;
  endpoint: {
    id: string;
    url: string;
    events: string[];
    disabledAt: string | null;
  };
  onSecret: (secret: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function request(path: string, body: unknown, method: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/projects/${projectId}/webhook-endpoints/${endpoint.id}${path}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Endpointni yangilab bo‘lmadi.");
      if (data.secret) onSecret(data.secret);
      setMessage("Endpoint yangilandi.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ulanib bo‘lmadi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details>
      <summary>Endpointni tahrirlash</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void request(
            "",
            {
              url: values.get("url"),
              events: values.getAll("events"),
              enabled: values.has("enabled"),
            },
            "PATCH",
          );
        }}
      >
        <label>
          Endpoint URL’i
          <input name="url" type="url" required defaultValue={endpoint.url} />
        </label>
        <fieldset>
          <legend>Hodisa obunalari</legend>
          {["payment.successful", "payment.failed", "payment.pending"].map(
            (type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  name="events"
                  value={type}
                  defaultChecked={endpoint.events.includes(type)}
                />
                {type}
              </label>
            ),
          )}
        </fieldset>
        <label>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={!endpoint.disabledAt}
          />{" "}
          Yoqilgan
        </label>
        <button disabled={busy} className="button secondary small">
          Endpointni saqlash
        </button>
      </form>
      <button
        disabled={busy || !!endpoint.disabledAt}
        type="button"
        className="button secondary small"
        onClick={() => {
          if (
            confirm(
              "Imzolash kaliti almashtirilsinmi? Almashtirgach qabul qiluvchi serverni darhol yangilang.",
            )
          )
            void request("/rotate-secret", {}, "POST");
        }}
      >
        Imzolash kalitini almashtirish
      </button>
      <p role="status">{message}</p>
    </details>
  );
}
