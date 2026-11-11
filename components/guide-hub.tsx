"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Search,
  Info,
  FolderPlus,
  Plug,
  Activity,
  ArrowRight,
  KeyRound,
  Link2,
  Code2,
  Webhook,
  Layers,
  TriangleAlert,
  Plus,
  Download,
  MessageCircle,
  X,
  BookOpen,
  ShieldCheck,
  ReceiptText,
} from "lucide-react";
import {
  guideCategories,
  searchGuide,
  type GuideCategory,
} from "@/shared/guide";
import { roleAllows } from "@/shared/project-role";
type Section = { id: string; title: string; content: ReactNode };
const icons: Record<string, typeof KeyRound> = {
  "api-keys": KeyRound,
  "hosted-checkout": Link2,
  "script-button": Code2,
  webhooks: Webhook,
  "payment-status": Layers,
  "error-handling": TriangleAlert,
  introduction: Code2,
  authentication: ShieldCheck,
  "create-payment": ReceiptText,
  "retrieve-payment": Search,
  "quick-start": BookOpen,
};
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
function snapshot() {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}
function setTopic(id: string) {
  const url = new URL(window.location.href);
  url.hash = id;
  window.history.pushState(null, "", url);
  window.dispatchEvent(new Event("hashchange"));
}
export function GuideHub({
  workspace,
  projectId,
  role,
  sections,
}: {
  workspace: boolean;
  projectId: string;
  role: string;
  sections: Section[];
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState<GuideCategory>("start");
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  const selected = sections.find((section) => section.id === hash);
  const detail = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const results = searchGuide(query, category),
    technical = !workspace || roleAllows(role, "technical");
  const suffix = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
  const developers =
    workspace && technical ? `/developers${suffix}` : "#api-keys";
  const steps = [
    {
      title: "Loyiha yarating",
      text: "Mahsulotingizni qo‘shing.",
      action: "Boshlash",
      href: workspace
        ? role === "owner"
          ? `/settings${suffix}#create-project`
          : "#quick-start"
        : "/signup",
      icon: FolderPlus,
    },
    {
      title: "Ulash usulini tanlang",
      text: "API, havola yoki tugma.",
      action: "Ulash",
      href: workspace ? developers : "#hosted-checkout",
      icon: Plug,
    },
    {
      title: "Natijani tekshiring",
      text: "Tranzaksiya va webhook holati.",
      action: "Ko‘rish",
      href: workspace ? `/transactions${suffix}` : "#payment-status",
      icon: Activity,
    },
  ];
  useEffect(() => {
    if (!selected) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    detail.current?.scrollIntoView({
      block: "start",
      behavior: reduced ? "instant" : "smooth",
    });
    detail.current?.focus({ preventScroll: true });
  }, [selected]);
  function show(id: string) {
    setTopic(id);
  }
  const Root = workspace ? "div" : "main";
  return (
    <Root
      className={`guide-hub ${workspace ? "guide-hub-workspace" : "guide-hub-public"}`}
    >
      <header className="guide-heading">
        <div>
          <h1>Qo‘llanma</h1>
          <p>Kerakli mavzuni tanlang va bosqichma-bosqich ulang.</p>
        </div>
        <div className="guide-search">
          <Search size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="guide-search">
            Qo‘llanmadan qidirish
          </label>
          <input
            ref={search}
            id="guide-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (selected) setTopic("");
            }}
            maxLength={120}
            placeholder="Nimani qidiryapsiz?"
            aria-controls="guide-topics"
          />
          {query && (
            <button
              type="button"
              aria-label="Qidiruvni tozalash"
              onClick={() => {
                setQuery("");
                search.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>
      <div className="guide-environment" role="note">
        <Info size={19} aria-hidden="true" />
        Haqiqiy pul operatsiyalari ulanmagan
      </div>
      <section
        className="guide-start guide-card"
        aria-labelledby="guide-start-title"
      >
        <h2 id="guide-start-title">3 qadamda boshlang</h2>
        <ol className="guide-steps">
          {steps.map(({ title, text, action, href, icon: Icon }, index) => (
            <li key={title}>
              <span className="guide-step-number">{index + 1}</span>
              <div className="guide-step-card">
                <Icon size={29} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <Link href={href}>
                    {action}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="guide-step-arrow"
                  size={20}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </section>
      <section className="guide-topic-area" aria-label="Qo‘llanma mavzulari">
        <div className="guide-filters" role="group" aria-label="Mavzu turi">
          {guideCategories.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setQuery("");
                if (selected) setTopic("");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="sr-only" role="status">
          {results.length} ta mavzu topildi
        </span>
        <div id="guide-topics" className="guide-topic-grid">
          {results.map((topic) => {
            const Icon = icons[topic.id] || BookOpen;
            return (
              <a
                key={topic.id}
                className="guide-topic guide-card"
                href={`#${topic.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  show(topic.id);
                }}
              >
                <Icon
                  size={26}
                  className="guide-topic-icon"
                  aria-hidden="true"
                />
                <div>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                </div>
                <ArrowRight
                  size={19}
                  className="guide-topic-arrow"
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </div>
        {!results.length && (
          <div className="guide-empty guide-card">
            <Search size={27} aria-hidden="true" />
            <h3>Mavzu topilmadi</h3>
            <p>Boshqa so‘z bilan qidirib ko‘ring.</p>
            <button
              className="button secondary"
              onClick={() => {
                setQuery("");
                setCategory("start");
                search.current?.focus();
              }}
            >
              Qidiruvni tozalash
            </button>
          </div>
        )}
      </section>
      {selected && (
        <section
          ref={detail}
          id={selected.id}
          tabIndex={-1}
          className="guide-detail guide-card"
          aria-labelledby="guide-detail-title"
        >
          <header>
            <h2 id="guide-detail-title">{selected.title}</h2>
            <button
              type="button"
              aria-label="Mavzuni yopish"
              onClick={() => {
                setTopic("");
                const trigger = document.querySelector<HTMLAnchorElement>(
                  `.guide-topic[href="#${selected.id}"]`,
                );
                (trigger || search.current)?.focus();
              }}
            >
              <X size={20} />
            </button>
          </header>
          <div className="guide-article">{selected.content}</div>
        </section>
      )}
      <div className="guide-bottom">
        <section
          className="guide-reference guide-card"
          aria-labelledby="guide-reference-title"
        >
          <h2 id="guide-reference-title">Dasturchilar uchun</h2>
          <details>
            <summary>
              <Code2 size={19} aria-hidden="true" />
              <span>API manzili va autentifikatsiya</span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <div className="guide-reference-links">
              {["introduction", "authentication", "api-keys"].map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    show(id);
                  }}
                >
                  {sections.find((section) => section.id === id)?.title}
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </details>
          <details>
            <summary>
              <Activity size={19} aria-hidden="true" />
              <span>So‘rov va javob misollari</span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <div className="guide-reference-links">
              {[
                "quick-start",
                "create-payment",
                "retrieve-payment",
                "hosted-checkout",
                "webhooks",
                "error-handling",
              ].map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    show(id);
                  }}
                >
                  {sections.find((section) => section.id === id)?.title}
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </details>
          <a
            className="guide-download"
            href="/api/openapi"
            download="flowkey-openapi.json"
          >
            <Download size={19} aria-hidden="true" />
            <span>OpenAPI spetsifikatsiyasi</span>
            <Download size={17} aria-hidden="true" />
          </a>
        </section>
        <aside className="guide-help guide-card">
          <h2>Yordam kerakmi?</h2>
          <p>AI yordamchiga savol bering.</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => window.dispatchEvent(new Event("flowkey:open-help"))}
          >
            <MessageCircle size={19} aria-hidden="true" />
            Savol berish
          </button>
        </aside>
      </div>
    </Root>
  );
}
