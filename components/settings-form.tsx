"use client";
import { tashkentDate } from "@/shared/locale";
import { TelegramSettings } from "./telegram-settings";
import { AvatarSettings } from "./avatar";
import { IntegrationPrompts } from "./integration-prompts";
import { Code } from "./copy";
import { businessLabel, authError } from "@/shared/locale";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserRound,
  Package,
  FolderOpen,
  ShieldCheck,
  Send,
} from "lucide-react";
import "@/styles/settings.css";
const tabs = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "product", label: "Mahsulot", icon: Package },
  { id: "projects", label: "Loyihalar", icon: FolderOpen },
  { id: "security", label: "Xavfsizlik", icon: ShieldCheck },
  { id: "telegram", label: "Telegram", icon: Send },
] as const;
type SettingsTab = (typeof tabs)[number]["id"];
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
  joinedAt,
}: {
  name: string;
  email: string;
  business: { name: string; type: string } | null;
  projects: Project[];
  joinedAt: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const availableTabs = business
    ? tabs
    : tabs.filter((t) => !["product", "projects"].includes(t.id));
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      const target = hash === "create-project" ? "projects" : hash;
      if (
        tabs.some(
          (t) =>
            t.id === target &&
            (business || !["product", "projects"].includes(t.id)),
        )
      )
        setTab(target as SettingsTab);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [business]);
  const [created, setCreated] = useState<{ id: string; secret: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [sessions, setSessions] = useState<
    { id: string; userAgent?: string; createdAt: string; current?: boolean }[]
  >([]);
  async function send(path: string, data: unknown, method = "POST") {
    if (pending.current) return null;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(
          json?.code
            ? authError(json.code)
            : json?.error?.message || "Saqlab bo‘lmadi.",
        );
      if (
        !json ||
        typeof json !== "object" ||
        !(
          json.ok === true ||
          json.status === true ||
          typeof json.user?.id === "string" ||
          typeof json.id === "string"
        )
      )
        throw new Error("Natija tasdiqlanmadi. Holatni yangilab tekshiring.");
      setMessage(
        path === "/api/auth/change-password"
          ? "Parol yangilandi. Boshqa sessiyalar bekor qilindi."
          : path === "/api/auth/revoke-other-sessions"
            ? "Boshqa sessiyalar bekor qilindi."
            : "Muvaffaqiyatli saqlandi.",
      );
      if (path === "/api/settings/profile" || path === "/api/settings/business")
        router.refresh();
      if (
        path === "/api/auth/revoke-other-sessions" ||
        path === "/api/auth/change-password"
      )
        await fetch("/api/settings/sessions", { cache: "no-store" })
          .then(async (response) =>
            setSessions(response.ok ? await response.json() : []),
          )
          .catch(() => setSessions([]));
      return json;
    } catch (error) {
      setMessageError(true);
      setMessage(error instanceof Error ? error.message : "Ulanib bo‘lmadi.");
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const values = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return Object.fromEntries(new FormData(event.currentTarget));
  };
  const types = ["Startup", "Online platform", "Company", "Individual"];
  return (
    <div className="settings-hub">
      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Sozlamalar bo‘limlari"
      >
        {availableTabs.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            id={`settings-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`settings-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => {
              setTab(id);
              setMessage("");
              window.history.replaceState(null, "", `#${id}`);
            }}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % availableTabs.length;
              else if (event.key === "ArrowLeft")
                next =
                  (index + availableTabs.length - 1) % availableTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = availableTabs.length - 1;
              else return;
              event.preventDefault();
              const target = availableTabs[next].id;
              setTab(target);
              setMessage("");
              window.history.replaceState(null, "", `#${target}`);
              document.getElementById(`settings-tab-${target}`)?.focus();
            }}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {message && (
        <p
          role={messageError ? "alert" : "status"}
          className={messageError ? "error" : "notice"}
        >
          {message}
        </p>
      )}
      <div
        role="tabpanel"
        id="settings-panel-profile"
        aria-labelledby="settings-tab-profile"
        hidden={tab !== "profile"}
        tabIndex={0}
      >
        <section className="panel settings-panel settings-profile">
          <h2>Profil ma’lumotlari</h2>
          <AvatarSettings email={email} />
          {email.endsWith("@telegram.flowkey.invalid") && (
            <p className="notice">
              Bu hisob Telegram orqali yaratilgan. Qayta kirish uchun Telegram
              tugmasidan foydalaning.
            </p>
          )}
          <form
            method="post"
            aria-busy={busy}
            onSubmit={(event) => {
              void send("/api/settings/profile", values(event), "PATCH");
            }}
          >
            <label>
              Ism
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
              <input
                value={
                  email.endsWith("@telegram.flowkey.invalid")
                    ? "Ulanmagan · Telegram orqali kirish"
                    : email
                }
                disabled
              />
            </label>
            <button disabled={busy} className="button primary">
              Profilni saqlash
            </button>
          </form>
        </section>
        <details className="panel settings-account-details">
          <summary>Hisob tafsilotlari</summary>
          <dl className="detail-list">
            <div>
              <dt>Ro‘yxatdan o‘tgan sana</dt>
              <dd>{joinedAt}</dd>
            </div>
            <div>
              <dt>Mahsulot</dt>
              <dd>{business?.name || "—"}</dd>
            </div>
            <div>
              <dt>Mahsulot turi</dt>
              <dd>{business ? businessLabel(business.type) : "—"}</dd>
            </div>
          </dl>
        </details>
      </div>
      <div
        role="tabpanel"
        id="settings-panel-product"
        aria-labelledby="settings-tab-product"
        hidden={!business || tab !== "product"}
        tabIndex={0}
      >
        <section className="panel settings-panel">
          <h2>Mahsulot</h2>
          <form
            method="post"
            aria-busy={busy}
            onSubmit={(event) => {
              void send("/api/settings/business", values(event), "PATCH");
            }}
          >
            <label>
              Mahsulot nomi
              <input
                name="businessName"
                defaultValue={business?.name || ""}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              Mahsulot turi
              <select
                name="businessType"
                defaultValue={business?.type || "Startup"}
              >
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
      </div>
      <div
        role="tabpanel"
        id="settings-panel-security"
        aria-labelledby="settings-tab-security"
        hidden={tab !== "security"}
        tabIndex={0}
      >
        <section className="panel settings-panel">
          <h2>Parol va sessiyalar</h2>
          <form
            method="post"
            aria-busy={busy}
            onSubmit={async (event) => {
              const form = event.currentTarget;
              const data = values(event);
              const result = await send("/api/auth/change-password", {
                ...data,
                revokeOtherSessions: true,
              });
              if (result) form.reset();
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
                setMessageError(true);
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
                {session.current ? (
                  <strong>Joriy sessiya</strong>
                ) : (
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await send("/api/settings/sessions", { id: session.id })
                      )
                        setSessions((current) =>
                          current.filter((item) => item.id !== session.id),
                        );
                    }}
                  >
                    Sessiyani bekor qilish
                  </button>
                )}
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
      </div>
      <div
        role="tabpanel"
        id="settings-panel-telegram"
        aria-labelledby="settings-tab-telegram"
        hidden={tab !== "telegram"}
        tabIndex={0}
      >
        <TelegramSettings />
      </div>
      <div
        role="tabpanel"
        id="settings-panel-projects"
        aria-labelledby="settings-tab-projects"
        hidden={!business || tab !== "projects"}
        tabIndex={0}
      >
        <section className="panel settings-panel" data-tour="create-project">
          <h2 id="create-project">Loyiha yaratish</h2>

          <form
            method="post"
            aria-busy={busy}
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
            <button
              className="button secondary"
              onClick={() => setCreated(null)}
            >
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
                  method="post"
                  aria-busy={busy}
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
