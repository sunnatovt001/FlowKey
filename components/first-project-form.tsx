"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { Code } from "./copy";
import { IntegrationPrompts } from "./integration-prompts";
export function FirstProjectForm({
  backHref,
  onBack,
}: {
  backHref: string;
  onBack?: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; secret: string } | null>(
    null,
  );
  const pending = useRef(false),
    result = useRef<HTMLElement>(null);
  if (created)
    return (
      <section
        className="project-setup-card project-setup-result"
        ref={result}
        tabIndex={-1}
        aria-labelledby="project-result-title"
      >
        <CheckCircle2
          size={30}
          className="project-setup-success"
          aria-hidden="true"
        />
        <h2 id="project-result-title">Loyihangiz tayyor</h2>
        <p>API kaliti faqat bir marta ko‘rsatiladi. Uni xavfsiz saqlang.</p>
        <Code>{created.secret}</Code>
        <p className="project-setup-key-note">
          Kalitni AI suhbatiga yoki brauzer kodiga joylamang.
        </p>
        <IntegrationPrompts projectId={created.id} method="API kaliti" />
        <Link
          className="button primary full"
          href={`/developers?project=${created.id}`}
        >
          Loyihani ulash <ArrowRight size={18} />
        </Link>
        <Link
          className="project-setup-back"
          href={`/dashboard?project=${created.id}`}
        >
          Dashboard’ga o‘tish
        </Link>
      </section>
    );
  return (
    <>
      <form
        className="project-setup-card"
        aria-busy={busy}
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setError("");
          const values = Object.fromEntries(new FormData(e.currentTarget));
          try {
            const response = await fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            const data = await response.json();
            if (!response.ok)
              throw Error(
                data.error?.message ||
                  "Loyiha yaratilmadi. Qayta urinib ko‘ring.",
              );
            setCreated({ id: data.id, secret: data.secret });
            requestAnimationFrame(() => result.current?.focus());
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Ulanishni tekshirib, qayta urinib ko‘ring.",
            );
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
      >
        <label htmlFor="first-project-name">Loyiha nomi</label>
        <input
          id="first-project-name"
          name="projectName"
          required
          minLength={2}
          maxLength={100}
          placeholder="Masalan, mening ilovam"
          autoComplete="off"
          disabled={busy}
        />
        <label htmlFor="first-project-website">
          Veb-sayt <span>(ixtiyoriy)</span>
        </label>
        <input
          id="first-project-website"
          name="website"
          type="url"
          maxLength={500}
          placeholder="https://saytingiz.uz"
          autoComplete="url"
          disabled={busy}
        />
        <p className="project-setup-key-note">
          <KeyRound size={19} aria-hidden="true" />
          API kaliti avtomatik yaratiladi.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Yaratilmoqda…
            </>
          ) : (
            <>
              Loyiha yaratish <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
      {onBack ? (
        <button
          type="button"
          className="project-setup-back setup-back-button"
          onClick={onBack}
          disabled={busy}
        >
          <ArrowLeft size={18} />
          Orqaga
        </button>
      ) : (
        <Link className="project-setup-back" href={backHref}>
          <ArrowLeft size={18} />
          Orqaga
        </Link>
      )}
    </>
  );
}
