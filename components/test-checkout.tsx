"use client";
import { useState } from "react";
import { PaymentLinks } from "./payment-links";
export function TestCheckout({
  projectId,
  links,
}: {
  projectId: string;
  links: { id: string; title: string; url: string; disabled: boolean }[];
}) {
  const [method, setMethod] = useState("Havola");
  return (
    <div className="testing-checkout">
      <div
        className="testing-methods"
        role="group"
        aria-label="Sahifa sinovi usuli"
      >
        {["Havola", "Tugma", "Script"].map((name) => (
          <button
            type="button"
            key={name}
            className="button secondary"
            aria-pressed={method === name}
            onClick={() => setMethod(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <p>
        {method === "Havola"
          ? "Sahifa yarating va havolani ochib to‘lov natijalarini sinang."
          : method === "Tugma"
            ? "Tugma kodini saytingizga joylang yoki sahifani ochib tekshiring."
            : "Script kodini saytingizga joylab, to‘lov oynasini tekshiring."}
      </p>
      <PaymentLinks projectId={projectId} links={links} method={method} />
    </div>
  );
}
