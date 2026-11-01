"use client";
import { tashkentDate } from "@/shared/locale";
import { TelegramSettings } from "./telegram-settings";
import { AvatarSettings } from "./avatar";
import { IntegrationPrompts } from "./integration-prompts";
import { Code } from "./copy";
import { businessLabel, authError } from "@/shared/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
type Project = {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  archivedAt: string | null;
};
export function SettingsForm({
  name,
  email,
  business,
  projects,
}: {
  name: string;
  email: string;
  business: { name: string; type: string };
  projects: Project[];
}) {
  const router = useRouter();
  const [created, setCreated] = useState<{ id: string; secret: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<
    { id: string; userAgent?: string; createdAt: string }[]
  >([]);
  async function send(path: string, data: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(
          json.code
            ? authError(json.code)
            : json.error?.message || "Saqlab bo‘lmadi.",
        );
      setMessage("Muvaffaqiyatli saqlandi.");
      return json;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ulanib bo‘lmadi.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  const values = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return Object.fromEntries(new FormData(event.currentTarget));
  };
  const types = ["Startup", "Online platform", "Company", "Individual"];
  return (
    <div className="settings-grid">
      <AvatarSettings email={email} />
      <TelegramSettings />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <section className="panel settings-panel">
        <h2>Hisob</h2>
        <form
          onSubmit={(event) => {
            void send("/api/settings/profile", values(event), "PATCH");
          }}
        >
          <label>
            Nomi
            <input
              name="name"
              defaultValue={name}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Elektron pochta
            <input value={email} disabled />
          </label>
          <button disabled={busy} className="button primary">
            Profilni saqlash
          </button>
        </form>
      </section>
      <section className="panel settings-panel">
        <h2>Mahsulot</h2>
        <form
          onSubmit={(event) => {
            void send("/api/settings/business", values(event), "PATCH");
          }}
        >
          <label>
            Mahsulot nomi
            <input
              name="businessName"
              defaultValue={business.name}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Mahsulot turi
            <select name="businessType" defaultValue={business.type}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {businessLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <button disabled={busy} className="button primary">
            Mahsulotni saqlash
          </button>
        </form>
      </section>
      <section className="panel settings-panel">
        <h2>Parol va sessiyalar</h2>
        <form
          onSubmit={(event) => {
            const data = values(event);
            void send("/api/auth/change-password", {
              ...data,
              revokeOtherSessions: true,
            });
          }}
        >
          <label>
            Joriy parol
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            Yangi parol
            <input
              type="password"
              name="newPassword"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy} className="button primary">
            Parolni o‘zgartirish
          </button>
        </form>
        <p>Parolni o‘zgartirish boshqa sessiyalarni bekor qiladi.</p>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            try {
              const response = await fetch("/api/settings/sessions");
              if (!response.ok) throw new Error();
              setSessions(await response.json());
            } catch {
              setMessage("Sessiyalarni yuklab bo‘lmadi.");
            }
          }}
        >
          Sessiyalarni yuklash
        </button>
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {session.userAgent || "Noma’lum qurilma"} ·{" "}
              {tashkentDate(session.createdAt)}{" "}
              <button
                disabled={busy}
                onClick={async () => {
                  if (await send("/api/settings/sessions", { id: session.id }))
                    setSessions((current) =>
                      current.filter((item) => item.id !== session.id),
                    );
                }}
              >
                Sessiyani bekor qilish
              </button>
            </li>
          ))}
        </ul>
        <button
          disabled={busy}
          className="button secondary"
          onClick={() => {
            void send("/api/auth/revoke-other-sessions", {});
          }}
        >
          Boshqa sessiyalarni bekor qilish
        </button>
      </section>
      <section className="panel settings-panel" data-tour="create-project">
        <h2 id="create-project">Loyiha yaratish</h2>

        <form
          onSubmit={async (event) => {
            const result = await send("/api/projects", values(event));
            if (result) {
              setCreated({ id: result.id, secret: result.secret });
              router.refresh();
            }
          }}
        >
          <ProjectFields />
          <button disabled={busy} className="button primary">
            Loyiha yaratish
          </button>
        </form>
      </section>
      {created && (
        <section className="panel settings-panel">
          <h2>Loyiha tayyor. API kalitingiz</h2>
          <p>
            Kalit faqat bir marta ko‘rsatiladi. Uni xavfsiz saqlang, AI
            suhbatiga yoki brauzer kodiga joylamang.
          </p>
          <Code>{created.secret}</Code>
          <IntegrationPrompts projectId={created.id} method="API kaliti" />
          <Link
            className="button primary"
            href={`/developers?project=${created.id}`}
          >
            Loyihani ulash
          </Link>
          <button className="button secondary" onClick={() => setCreated(null)}>
            Kalitni yashirish
          </button>
        </section>
      )}
      {projects.map((project) => (
        <section className="panel settings-panel" key={project.id}>
          <h2>
            {project.name}
            {project.archivedAt ? "· Arxivlangan" : ""}
          </h2>
          <code>{project.id}</code>
          <p>
            <Link href={`/transactions?project=${project.id}`}>
              Tranzaksiyalar tarixini ko‘rish
            </Link>
          </p>
          {!project.archivedAt && (
            <>
              <form
                onSubmit={(event) => {
                  void send(
                    `/api/projects/${project.id}`,
                    values(event),
                    "PATCH",
                  );
                }}
              >
                <ProjectFields project={project} />
                <button disabled={busy} className="button secondary">
                  Loyihani saqlash
                </button>
              </form>
              <button
                disabled={busy}
                className="button secondary danger-link"
                onClick={async () => {
                  if (
                    confirm(
                      "Loyiha arxivlansinmi? API kalitlar bekor qilinadi va yangi to‘lovlar bloklanadi. Tarix saqlanadi.",
                    )
                  ) {
                    const result = await send(
                      `/api/projects/${project.id}/archive`,
                      {},
                    );
                    if (result) {
                      router.push("/settings");
                      router.refresh();
                    }
                  }
                }}
              >
                Loyihani arxivlash
              </button>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
function ProjectFields({ project }: { project?: Project }) {
  return (
    <>
      <label>
        Loyiha nomi
        <input
          name="projectName"
          required
          minLength={2}
          maxLength={100}
          defaultValue={project?.name}
        />
      </label>
      <label>
        Veb-sayt (ixtiyoriy)
        <input
          name="website"
          type="url"
          defaultValue={project?.website || ""}
        />
      </label>
    </>
  );
}
