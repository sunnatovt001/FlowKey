"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState("Nusxalash");
  return (
    <button
      type="button"
      className="copy-button"
      aria-label={state}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("Nusxalandi");
          setTimeout(() => setState("Nusxalash"), 2000);
        } catch {
          setState("Belgilang va qo‘lda nusxalang");
        }
      }}
    >
      {state === "Nusxalandi" ? <Check size={15} /> : <Copy size={15} />} {state}
    </button>
  );
}
export function Code({ children }: { children: string }) {
  return (
    <div className="code-block">
      <CopyButton value={children} />
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}
