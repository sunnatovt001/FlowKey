"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Server,
  Link2,
  Code2,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  Webhook,
} from "lucide-react";
import { PaymentLinks } from "./payment-links";
import { DeveloperTools, type DeveloperToolsData } from "./developer-tools";
import { IntegrationAssist } from "./integration-assist";
import { Code } from "./copy";
import "@/styles/integration-hub.css";
const choices = [
  {
    id: "api",
    name: "API orqali",
    description: "Server orqali to‘lov yarating.",
    Icon: Server,
  },
  {
    id: "hosted",
    name: "Tayyor sahifa",
    description: "To‘lov havolasini ulashing.",
    Icon: Link2,
  },
  {
    id: "embed",
    name: "Saytga joylash",
    description: "Tugma yoki script qo‘shing.",
    Icon: Code2,
  },
] as const;
export function IntegrationChooser({
  projectId,
  links,
  tools,
}: {
  projectId: string;
  links: { id: string; title: string; url: string; disabled: boolean }[];
  tools: DeveloperToolsData;
}) {
  const query = useSearchParams();
  const [method, setMethod] = useState<"api" | "hosted" | "embed">("api");
  const [step, setStep] = useState(query.get("tab") === "webhooks" ? 2 : 1);
  const [webhooks, setWebhooks] = useState(query.get("tab") === "webhooks");
  const [embed, setEmbed] = useState("Tugma");
  const activeKeys = tools.keys.filter((k) => !k.revokedAt).length;
  const activeEndpoints = tools.endpoints.filter((e) => !e.disabledAt).length;
  const used = tools.keys
    .map((k) => k.lastUsedAt)
    .filter((date): date is string => !!date)
    .sort()
    .at(-1);
  const tab = step === 2 && webhooks ? "webhooks" : "keys";
  return (
    <section className="integration-hub" data-tour="integration">
      <p className="integration-intro">
        Saytingizga mos ulash usulini tanlang.
      </p>
      <div
        className="integration-methods"
        role="group"
        aria-label="Ulash usuli"
      >
        {choices.map(({ id, name, description, Icon }) => (
          <button
            type="button"
            key={id}
            aria-pressed={method === id}
            onClick={() => setMethod(id)}
          >
            <Icon size={28} aria-hidden="true" />
            <span>
              <strong>{name}</strong>
              <span>{description}</span>
            </span>
            {method === id && (
              <Check
                size={17}
                className="integration-choice-check"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
      <div className="integration-layout">
        <div className="integration-main">
          <div className="panel integration-workflow">
            <div hidden={method !== "api"}>
              <ol
                className="integration-progress"
                style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}
                aria-label="Ulash bosqichlari"
              >
                {["Kalit olish", "Ulanish"].map((label, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      aria-current={step === index + 1 ? "step" : undefined}
                      onClick={() => {
                        setStep(index + 1);
                        if (index + 1 !== 2) setWebhooks(false);
                      }}
                    >
                      <span>{index + 1}</span>
                      {label}
                    </button>
                  </li>
                ))}
              </ol>
              {step === 2 && !webhooks && (
                <section className="integration-connect">
                  <h2>Serveringizga ulang</h2>
                  <p>Kalitni serverdagi muhit o‘zgaruvchisiga kiriting.</p>
                  <Code>{"FLOWKEY_API_KEY=<SIZNING_MAXFIY_KALITINGIZ>"}</Code>
                  <details>
                    <summary>Bearer token qanday ishlaydi?</summary>
                    <p>
                      API kalitingiz so‘rovning Authorization sarlavhasida
                      Bearer token sifatida yuboriladi. Alohida token yaratish
                      shart emas.
                    </p>
                    <Code>{"Authorization: Bearer <FLOWKEY_API_KEY>"}</Code>
                  </details>
                  <p>
                    <Link href={`/guide?project=${projectId}#create-payment`}>
                      API so‘rovi va kod namunasi →
                    </Link>
                  </p>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => setWebhooks(true)}
                  >
                    <Webhook size={18} />
                    Webhookni sozlash
                  </button>
                </section>
              )}
              <div hidden={step === 2 && !webhooks}>
                <DeveloperTools {...tools} tab={tab} guided hideDeliveries />
              </div>
              {step === 1 && (
                <details className="integration-key-help">
                  <summary>API kalitini qayerga qo‘yaman?</summary>
                  <p>
                    Serveringizning .env fayliga FLOWKEY_API_KEY sifatida
                    saqlang. Frontend kodiga va AI suhbatiga kiritmang. Yangi
                    kalit faqat bir marta ko‘rsatiladi.
                  </p>
                </details>
              )}
            </div>
            {method === "hosted" && (
              <>
                <h2>Tayyor to‘lov sahifasi</h2>
                <p className="integration-note">
                  Sahifa yarating va uning havolasini mijozingizga yuboring.
                </p>
                <PaymentLinks
                  projectId={projectId}
                  links={links}
                  method="Havola"
                />
              </>
            )}
            {method === "embed" && (
              <>
                <h2>Saytingizga joylang</h2>
                <div
                  className="integration-embed-tabs"
                  role="group"
                  aria-label="Saytga joylash usuli"
                >
                  {["Tugma", "Script"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="button secondary"
                      aria-pressed={embed === name}
                      onClick={() => setEmbed(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div
                  className="integration-embed-explanation"
                  aria-live="polite"
                >
                  <h3>
                    {embed === "Script"
                      ? "Script orqali ulash"
                      : "Tugma orqali ulash"}
                  </h3>
                  <p>
                    {embed === "Script"
                      ? "Script saytingizga to‘lash tugmasini qo‘shadi va to‘lov oynasini shu sahifada ochadi."
                      : "HTML tugma to‘lov sahifasini yangi oynada ochadi."}
                  </p>
                  {!links.some((link) => !link.disabled) && (
                    <p className="integration-embed-next">
                      Avval sahifa nomi va summani kiriting. Sahifa yaratilgach,{" "}
                      {embed === "Script" ? "script" : "tugma"} kodi shu yerda
                      chiqadi.
                    </p>
                  )}
                </div>
                <PaymentLinks
                  projectId={projectId}
                  links={links}
                  method={embed}
                />
              </>
            )}
          </div>
          {method === "api" && (
            <>
              <div className="panel integration-ai-panel">
                <IntegrationAssist projectId={projectId} />
              </div>
              <div className="integration-step-footer">
                <span>{step} / 2 qadam</span>
                <div>
                  {step > 1 && (
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => {
                        setStep((s) => s - 1);
                        setWebhooks(false);
                      }}
                    >
                      <ArrowLeft size={16} />
                      Orqaga
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      className="button primary"
                      type="button"
                      disabled={step === 1 && !activeKeys}
                      onClick={() => {
                        setStep((s) => s + 1);
                        setWebhooks(false);
                      }}
                    >
                      Keyingi qadam
                      <ArrowRight size={17} />
                    </button>
                  ) : (
                    <Link
                      className="button secondary"
                      href={`/testing?project=${projectId}&area=payments`}
                    >
                      Sinov markazida tekshirish
                      <ArrowRight size={17} />
                    </Link>
                  )}
                </div>
              </div>
              {step === 1 && !activeKeys && (
                <p className="integration-note">
                  Davom etish uchun API kaliti yarating.
                </p>
              )}
            </>
          )}
        </div>
        <aside className="integration-sidebar">
          <Link
            className="button secondary"
            href={`/testing?project=${projectId}&area=${method === "api" ? "payments" : "checkout"}`}
          >
            Sinov markazi
            <ArrowRight size={16} />
          </Link>
          <section className="panel integration-connection">
            <h2>Ulanish holati</h2>
            <dl>
              <div>
                <dt>
                  <span
                    className={
                      activeKeys ? "connection-dot active" : "connection-dot"
                    }
                  />
                  API kaliti
                </dt>
                <dd>{activeKeys ? `${activeKeys} ta faol` : "Yaratilmagan"}</dd>
              </div>
              <div>
                <dt>
                  <span
                    className={
                      activeEndpoints
                        ? "connection-dot active"
                        : "connection-dot"
                    }
                  />
                  Webhook
                </dt>
                <dd>
                  {activeEndpoints ? `${activeEndpoints} ta faol` : "Ulanmagan"}
                </dd>
              </div>
              <div>
                <dt>
                  <span
                    className={
                      used ? "connection-dot active" : "connection-dot"
                    }
                  />
                  API so‘rovi
                </dt>
                <dd>{used ? "Qayd etilgan" : "Kutilmoqda"}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setMethod("api");
                setStep(2);
                setWebhooks(true);
              }}
            >
              Webhookni sozlash
              <ArrowRight size={16} />
            </button>
          </section>
          <section className="integration-unit-note">
            <ShieldCheck size={23} />
            <div>
              <strong>Unit muhiti</strong>
              <p>Haqiqiy pul o‘tkazilmaydi.</p>
            </div>
          </section>
          <Link
            className="integration-guide-link"
            href={`/guide?project=${projectId}`}
          >
            <BookOpen size={17} />
            Qo‘llanmani ochish
          </Link>
        </aside>
      </div>
    </section>
  );
}
