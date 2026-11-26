"use client";
import { tashkentDate } from "@/shared/locale";
import { IntegrationPrompts } from "./integration-prompts";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  KeyRound,
  ArrowUpRight,
  LoaderCircle,
  RotateCcw,
  Webhook,
  Trash2,
} from "lucide-react";
import { CopyButton, Code } from "./copy";
import { Empty, Status } from "./ui";
import { EndpointEditor } from "./endpoint-editor";
type Key = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt?: string | null;
};
type Endpoint = {
  id: string;
  url: string;
  events: string[];
  disabledAt: string | null;
};
type Delivery = {
  history?: {
    attemptNumber: number;
    responseCode: number | null;
    error: string | null;
  }[];
  id: string;
  event: string;
  attempts: number;
  status: string;
  responseCode: number | null;
  error: string | null;
  createdAt: string;
  endpoint: { url: string };
};
export type DeveloperToolsData = {
  projectId: string;
  keys: Key[];
  endpoints: Endpoint[];
  deliveries: Delivery[];
};
export function DeveloperTools({
  projectId,
  tab,
  keys,
  endpoints,
  deliveries,
  guided = false,
  hideDeliveries = false,
  hideEndpointSetup = false,
}: {
  projectId: string;
  tab: string;
  keys: Key[];
  endpoints: Endpoint[];
  deliveries: Delivery[];
  guided?: boolean;
  hideDeliveries?: boolean;
  hideEndpointSetup?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newSecret, setNewSecret] = useState<{
    kind: string;
    value: string;
  } | null>(null);
  const [response, setResponse] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [showKeyForm, setShowKeyForm] = useState(false);
  async function request(
    resource: string,
    data: unknown,
    method = "POST",
    id?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/${resource}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(id ? { "Idempotency-Key": id } : {}),
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message || "So‘rov bajarilmadi.");
      router.refresh();
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ulanib bo‘lmadi.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className={guided ? "developer-tools guided-tools" : "developer-tools"}
    >
      {!guided && (
        <nav className="tabs" aria-label="Dasturchi vositalari">
          {[
            ["keys", "API kalitlari"],
            ["sandbox", "Unit"],
            ["webhooks", "Webhooklar"],
          ].map(([id, title]) => (
            <Link
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              href={`/developers?project=${projectId}&tab=${id}`}
              key={id}
            >
              {title}
            </Link>
          ))}
        </nav>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {newSecret && (
        <div className="secret-notice" role="status">
          <strong>
            Saqlab oling: {newSecret.kind}. Bu faqat bir marta ko‘rsatiladi.
          </strong>
          <p>
            Ishonchli joyda saqlang. Bu sahifadan chiqqach, uni qayta ko‘rib
            bo‘lmaydi.
          </p>
          <div>
            <code>{newSecret.value}</code>
            <CopyButton value={newSecret.value} />
          </div>
          {!guided && newSecret.kind === "API kalit" && (
            <IntegrationPrompts projectId={projectId} method="API kaliti" />
          )}
          <button className="text-link" onClick={() => setNewSecret(null)}>
            Saqladim — maxfiy kalitni yashirish
          </button>
        </div>
      )}
      {tab === "keys" && (
        <section className="panel" id="api-keys">
          {!guided && (
            <IntegrationPrompts projectId={projectId} method="API kaliti" />
          )}
          <div className="panel-heading">
            <div>
              <h2>
                {guided ? "API kalitlari" : "Unit API kalitlari"}
              </h2>
              <p>
                So‘rovlarni serveringizdan tasdiqlang. Maxfiy kalitlarni
                brauzerga yubormang.
              </p>
            </div>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => setShowKeyForm(!showKeyForm)}
            >
              <Plus size={16} /> Yangi kalit yaratish
            </button>
          </div>
          {showKeyForm && (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const r = await request("keys", { name: form.get("name") });
                if (r) {
                  setNewSecret({ kind: "API kalit", value: r.secret });
                  setShowKeyForm(false);
                }
              }}
            >
              <label>
                Kalit nomi
                <input
                  autoFocus
                  name="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Lokal ishlab chiqish"
                />
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? "Yaratilmoqda…" : "Sinov kaliti yaratish"}
              </button>
            </form>
          )}
          {keys.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nomi</th>
                    <th>Maxfiy kalit</th>
                    <th>Yaratilgan sana</th>
                    <th>Holat</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td>
                        <KeyRound size={15} /> {k.name}
                      </td>
                      <td>{k.prefix}••••••••</td>
                      <td>{tashkentDate(k.createdAt, false)}</td>
                      <td>
                        <Status status={k.revokedAt ? "revoked" : "active"} />
                      </td>
                      <td>
                        {!k.revokedAt && (
                          <button
                            disabled={busy}
                            className="danger-link"
                            onClick={() =>
                              request("keys", { id: k.id }, "DELETE")
                            }
                          >
                            Bekor qilish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Birinchi ulanish kalitdan boshlanadi.">
              Sinov so‘rovlarini tasdiqlash uchun API kaliti yarating. Uni
              istalgan payt bekor qilib, yangisini olishingiz mumkin.
            </Empty>
          )}
          <div className="panel-note">
            Faqat kalitning xeshi saqlanadi. Yaratilgandan keyin faqat
            niqoblangan boshlanish qismi ko‘rinadi.
          </div>
        </section>
      )}
      {tab === "sandbox" && (
        <div className="sandbox-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Sinov to‘lovi yaratish</h2>
                <p>Bazadagi haqiqiy yozuv. Sinov tariqasidagi to‘lov.</p>
              </div>
            </div>
            <form
              className="panel-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const amount = String(form.get("amount"));
                if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
                  setError(
                    "Summani ko‘pi bilan ikkita kasr xonasi bilan kiriting.",
                  );
                  return;
                }
                const [whole, frac = ""] = amount.split(".");
                const amountMinor =
                  Number(whole) * 100 + Number(frac.padEnd(2, "0"));
                const r = await request(
                  "payments",
                  {
                    amount_minor: amountMinor,
                    currency: "UZS",
                    result: form.get("result"),
                  },
                  "POST",
                  requestId,
                );
                if (r) {
                  setResponse(JSON.stringify(r, null, 2));
                  setRequestId(crypto.randomUUID());
                }
              }}
            >
              <label>
                Sinov summasi
                <div className="amount-input">
                  <input
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="Summani kiriting"
                    required
                  />
                  <span>UZS</span>
                </div>
              </label>
              <p className="form-hint">
                Ko‘pi bilan 10 000 000 so‘m. Haqiqiy pul o‘tkazilmaydi.
              </p>
              <label>
                Sinov natijasi
                <select name="result">
                  <option value="successful">Muvaffaqiyat</option>
                  <option value="failed">Xato</option>
                  <option value="pending">Kutilmoqda</option>
                </select>
              </label>
              <p className="form-hint">
                Har bir so‘rov idempotency kalitidan foydalanadi. Tarmoq
                xatosida qayta urinish o‘sha kalit bilan bajariladi.
              </p>
              <button className="button primary full" disabled={busy}>
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {busy ? "To‘lov yaratilmoqda…" : "Sinov to‘lovi yaratish"}
              </button>
              <Link
                href={`/transactions?project=${projectId}`}
                className="text-link"
              >
                Tranzaksiyalarni ko‘rish <ArrowUpRight size={15} />
              </Link>
            </form>
          </section>
          <section className="panel response-panel">
            <div className="panel-heading">
              <div>
                <h2>API javobi</h2>
                <p>To‘lov API’si bilan bir xil javob shakli.</p>
              </div>
              <span className="sandbox-label">JSON</span>
            </div>
            {response ? (
              <Code>{response}</Code>
            ) : (
              <Empty title="Javobingiz shu yerda ko‘rinadi.">
                Summa va natijani tanlang, so‘ng birinchi sinov to‘lovini
                yarating.
              </Empty>
            )}
            <div className="panel-note">
              <Link href={`/guide?project=${projectId}#create-payment`}>
                Kodingizdan shu endpointga murojaat qiling{" "}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>
        </div>
      )}
      {tab === "webhooks" && (
        <>
          {!hideEndpointSetup && (
            <section className="panel" id="webhooks">
              <div className="panel-heading">
                <div>
                  <h2>Webhook endpointlari</h2>
                  <p>
                    Imzolangan sinov hodisalari ochiq HTTPS endpointingizga
                    yetkaziladi.
                  </p>
                </div>
                <Webhook size={22} />
              </div>
              <form
                className="panel-form webhook-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const element = e.currentTarget;
                  const form = new FormData(element);
                  const r = await request("webhooks", {
                    url: form.get("url"),
                    events: form.getAll("events"),
                  });
                  if (r) {
                    setNewSecret({
                      kind: "webhook imzolash kaliti",
                      value: r.secret,
                    });
                    element.reset();
                  }
                }}
              >
                <label>
                  Endpoint URL’i
                  <input
                    required
                    type="url"
                    name="url"
                    placeholder="https://api.your-product.uz/webhooks/flowza"
                  />
                </label>
                <fieldset>
                  <legend>Sinov hodisalari</legend>
                  {["successful", "failed", "pending"].map((s) => (
                    <label className="checkbox" key={s}>
                      <input
                        type="checkbox"
                        name="events"
                        value={`payment.${s}`}
                        defaultChecked
                      />
                      payment.{s}
                    </label>
                  ))}
                </fieldset>
                <button className="button primary" disabled={busy}>
                  <Plus size={16} />
                  {busy ? "Qo‘shilmoqda…" : "Endpoint qo‘shish"}
                </button>
              </form>
              {endpoints.length > 0 && (
                <div className="endpoint-list">
                  {endpoints.map((e) => (
                    <div key={e.id}>
                      <div>
                        <strong>{e.url}</strong>
                        <p>{e.events.join(" · ")}</p>
                        <EndpointEditor
                          projectId={projectId}
                          endpoint={e}
                          onSecret={(value) =>
                            setNewSecret({
                              kind: "webhook imzolash kaliti",
                              value,
                            })
                          }
                        />
                      </div>
                      <Status status={e.disabledAt ? "disabled" : "active"} />
                      {!e.disabledAt && (
                        <button
                          className="icon-button danger-link"
                          aria-label={`${e.url} endpointini o‘chirish`}
                          disabled={busy}
                          onClick={() =>
                            request("webhooks", { id: e.id }, "DELETE")
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="panel-note">
                Faqat HTTPS 443-porti. Xususiy manzillar, IP qiymatlar, xavfli
                DNS va yo‘naltirishlar bloklanadi.{" "}
                <Link href={`/guide?project=${projectId}#webhooks`}>
                  Imzolash va tekshirish qo‘llanmasi
                </Link>
              </div>
            </section>
          )}
          {!hideDeliveries && (
            <section className="panel delivery-panel">
              <div className="panel-heading">
                <div>
                  <h2>Yetkazish urinishlari</h2>
                  <p>
                    Fon ishchisi navbatdagi hodisalarni avtomatik yuboradi.
                    Cheklangan takrorlash bilan jami besh urinish.
                  </p>
                </div>
              </div>
              {deliveries.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Hodisa</th>
                        <th>Endpoint</th>
                        <th>Holat</th>
                        <th>Javob</th>
                        <th>Urinishlar</th>
                        <th>Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((d) => (
                        <tr key={d.id}>
                          <td>
                            {d.event}
                            <small>{d.id}</small>
                          </td>
                          <td className="url-cell">
                            {d.endpoint.url}
                            {d.error && (
                              <small className="red">{d.error}</small>
                            )}
                          </td>
                          <td>
                            <Status status={d.status} />
                          </td>
                          <td>{d.responseCode ?? "—"}</td>
                          <td>
                            {d.attempts} / 5
                            <details>
                              <summary>Tarix</summary>
                              {d.history?.map((attempt) => (
                                <p key={attempt.attemptNumber}>
                                  #{attempt.attemptNumber}:{" "}
                                  {attempt.responseCode ?? "Javob yo‘q"}{" "}
                                  {attempt.error}
                                </p>
                              ))}
                            </details>
                          </td>
                          <td>
                            {["failed", "queued"].includes(d.status) &&
                              d.attempts < 5 && (
                                <button
                                  disabled={busy}
                                  className="button secondary small"
                                  onClick={() =>
                                    request("deliveries", { id: d.id })
                                  }
                                >
                                  <RotateCcw size={14} />
                                  {d.attempts ? "Qayta urinish" : "Yuborish"}
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="Hali yetkazish urinishi yo‘q.">
                  Endpoint qo‘shing, so‘ng tanlangan natijali to‘lov yarating.
                  Hodisa shu yerda navbatga qo‘shiladi.
                </Empty>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
