"use client";
import { useRef, useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uzsToMinor } from "@/server/checkout-validation";
export function OperationForm({
  endpoint,
  action,
  label,
  children,
  fixed = {},
  amountName,
}: {
  endpoint: string;
  action: string;
  label: string;
  children?: ReactNode;
  fixed?: Record<string, string | number | boolean>;
  amountName?: string;
}) {
  const router = useRouter();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [requestKey, setRequestKey] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (
      ["remove", "revoke"].includes(action) &&
      !confirm(
        action === "remove"
          ? "Bu a’zoning loyihaga kirishi bekor qilinsinmi?"
          : "Bu taklif bekor qilinsinmi?",
      )
    )
      return;
    pending.current = true;
    const form = event.currentTarget,
      values = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    const key = requestKey || crypto.randomUUID();
    setRequestKey(key);
    try {
      const data: Record<string, unknown> = { action, ...fixed };
      for (const [name, value] of values.entries()) data[name] = value;
      if (values.has("consent")) data.consent = true;
      if (amountName) {
        data.amountMinor = uzsToMinor(String(values.get(amountName)));
        delete data[amountName];
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setRequestKey(undefined);
        throw new Error(result?.error?.message || "Amal bajarilmadi.");
      }
      if (
        !result ||
        typeof result !== "object" ||
        !(result.ok === true || Object.hasOwn(result, "data"))
      )
        throw new Error("Natija tasdiqlanmadi. Holatni yangilab tekshiring.");
      form.reset();
      setRequestKey(undefined);
      setSuccess("Saqlandi.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Aloqani tekshirib, qayta urinib ko‘ring.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      method="post"
      className={children ? "operation-form" : "operation-inline"}
      onSubmit={submit}
      onChange={() => setRequestKey(undefined)}
      aria-busy={busy}
    >
      {children}
      <button className="button secondary" disabled={busy} type="submit">
        {busy ? "Bajarilmoqda…" : label}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="operation-success" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
