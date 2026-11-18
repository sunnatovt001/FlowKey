"use client";

import { Ellipsis, UserRoundPlus, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export function TeamInvite({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button className="button primary team-invite" onClick={() => dialog.current?.showModal()}>
        <UserRoundPlus size={19} aria-hidden="true" /> A’zo taklif qilish
      </button>
      <dialog ref={dialog} className="team-dialog" aria-labelledby="team-invite-title">
        <div className="team-dialog-heading">
          <h2 id="team-invite-title">A’zo taklif qilish</h2>
          <button type="button" className="team-icon-button" aria-label="Yopish" onClick={() => dialog.current?.close()}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

export function TeamDirectory({ members, invitations, count }: {
  members: ReactNode; invitations: ReactNode; count: number;
}) {
  const [current, setCurrent] = useState<"members" | "invitations">("members");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = [
    { id: "members", label: "A’zolar" },
    { id: "invitations", label: "Kutilayotgan takliflar" },
  ] as const;
  return (
    <section className="team-directory">
      <div className="team-tabs" role="tablist" aria-label="Jamoa">
        {tabs.map(({ id, label }, index) => (
          <button key={id} ref={node => { buttons.current[index] = node; }}
            id={`team-${id}-tab`} type="button" role="tab"
            aria-selected={current === id} aria-controls={`team-${id}`}
            tabIndex={current === id ? 0 : -1} onClick={() => setCurrent(id)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
              setCurrent(tabs[next].id);
              buttons.current[next]?.focus();
            }}>
            {label}{id === "invitations" && count > 0 && <span className="team-count">{count}</span>}
          </button>
        ))}
      </div>
      {tabs.map(({ id }) => (
        <div key={id} id={`team-${id}`} role="tabpanel" aria-labelledby={`team-${id}-tab`} hidden={current !== id}>
          {id === "members" ? members : invitations}
        </div>
      ))}
    </section>
  );
}

export function TeamActions({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="team-row-actions" onKeyDown={event => {
      if (event.key !== "Escape") return;
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }}>
      <summary className="team-icon-button" aria-label={label}>
        <Ellipsis size={21} aria-hidden="true" />
      </summary>
      <div className="team-action-options">{children}</div>
    </details>
  );
}
