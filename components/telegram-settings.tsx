"use client";
import { useEffect, useState } from "react";
import { Send, Unplug, RefreshCw } from "lucide-react";
import { Code } from "./copy";
import { tashkentDate } from "@/shared/locale";
type State = {
  linked: boolean;
  linkedAt: string | null;
  botUsername: string | null;
  botConfigured: boolean;
  aiConfigured: boolean;
  adminConfigured: boolean;
};
type Ticket = {
  id: string;
  summary: string;
  status: string;
  resolutionStatus: string;
  replies: { id: string; content: string; createdAt: string }[];
  createdAt: string;
};
export function TelegramSettings() {
  const [state, setState] = useState<State | null>(null),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [link, setLink] = useState<{
      link: string | null;
      code: string;
      expiresAt: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [findings, setFindings] = useState<string[]>([]);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  async function load() {
    const [status, history] = await Promise.all([
      fetch("/api/telegram", { cache: "no-store" }),
      fetch("/api/support/tickets", { cache: "no-store" }),
    ]);
    if (!status.ok || !history.ok)
      throw new Error(
        "Telegram sozlamalarini yuklab bo‘lmadi. Qayta urinib ko‘ring.",
      );
    setState(await status.json());
    setTickets(await history.json());
  }
  useEffect(() => {
    // The state is populated only after authenticated network responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((e) => setError(e.message));
  }, []);
  async function send(path: string, method: string, data?: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(result.error?.message || "So‘rov bajarilmadi.");
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel settings-panel telegram-settings">
      <h2>Telegram yordamchi</h2>

      <p className="muted">
        Suhbatlar hisobingizda saqlanadi. Maxfiy kalitlar AI’ga yuborilmaydi.
      </p>
      {state && (
        <>
          <p>
            <strong>
              {state.linked
                ? "Telegram hisobingiz ulangan."
                : "Telegram hali ulanmagan."}
            </strong>{" "}
            {state.linkedAt && tashkentDate(state.linkedAt)}
          </p>
          {!state.botConfigured && (
            <p className="notice">
              Telegram bot hali sozlanmagan. Ulash uchun administrator sozlashni
              yakunlashi kerak.
            </p>
          )}
          {!state.aiConfigured && <p className="muted">AI hali sozlanmagan.</p>}
          <div className="avatar-actions">
            {state.linked ? (
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  if (await send("/api/telegram", "DELETE")) {
                    setLink(null);
                    setNotice("Telegram uzildi. Suhbat tarixi o‘chirildi.");
                    await load();
                  }
                }}
              >
                <Unplug size={16} /> Telegramni uzish
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy || !state.botConfigured || !state.botUsername}
                onClick={async () => {
                  const result = await send("/api/telegram", "POST");
                  if (result) setLink(result);
                }}
              >
                <Send size={16} /> Telegramni ulash
              </button>
            )}
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => load().catch((e) => setError(e.message))}
            >
              <RefreshCw size={16} /> Holatni yangilash
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                const result = await send("/api/support/diagnostics", "GET");
                if (result) setFindings(result.findings);
              }}
            >
              Hisobni tekshirish
            </button>
          </div>
        </>
      )}
      {link && (
        <div className="integration-prompts">
          <h3>Hisobni botga ulang</h3>
          <p>
            Havolani faqat o‘zingiz oching. Bir martalik kod 10 daqiqa amal
            qiladi.
          </p>
          {link.link && (
            <a
              className="button primary"
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram’da ochish
            </a>
          )}
          <p>Yoki botga shu buyruqni yuboring:</p>
          <Code>{`/start ${link.code}`}</Code>
          <p className="muted">
            Amal qilish muddati: {tashkentDate(link.expiresAt)}
          </p>
          <button className="text-link" onClick={() => setLink(null)}>
            Kodni yashirish
          </button>
        </div>
      )}
      {findings.length > 0 && (
        <div className="integration-prompts">
          <h3>Hisob tekshiruvi</h3>
          <ul>
            {findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <h3>Muammoni adminga yuborish</h3>
      <p>Tekshiruv natijalari va oxirgi bot xabarlari murojaatga qo‘shiladi.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const summary = String(new FormData(form).get("summary") || "");
          const result = await send("/api/support/tickets", "POST", {
            summary,
            requestKey,
          });
          if (result) {
            setRequestKey(crypto.randomUUID());
            form.reset();
            setNotice(
              `Murojaat saqlandi: ${result.id}. Adminga yetkazish navbatida.`,
            );
            await load();
          }
        }}
      >
        <label>
          Muammo tavsifi
          <textarea
            name="summary"
            minLength={5}
            maxLength={2000}
            required
            placeholder="Nima bo‘ldi va qaysi loyihada? Maxfiy kalit yozmang."
            disabled={busy}
          />
        </label>
        <button className="button primary" disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Adminga yuborish"}
        </button>
      </form>
      {state && !state.adminConfigured && (
        <p className="muted">
          Admin hali ulanmagan. Murojaat navbatda saqlanadi.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p role="status">{notice}</p>
      {tickets.length > 0 && (
        <div className="support-history">
          <h3>Murojaatlarim</h3>
          {tickets.map((t) => (
            <article key={t.id}>
              <strong>{t.summary}</strong>
              <p>
                {(
                  {
                    queued: "Yetkazish navbatida",
                    sent: "Admin Telegram’iga yetkazildi",
                    failed:
                      "Yetkazib bo‘lmadi — administrator tekshirishi kerak",
                  } as Record<string, string>
                )[t.status] || t.status}{" "}
                · {tashkentDate(t.createdAt)}
              </p>
              <p>
                {(
                  {
                    open: "Yangi",
                    in_progress: "Ko‘rib chiqilmoqda",
                    resolved: "Hal qilindi",
                  } as Record<string, string>
                )[t.resolutionStatus] || "Yangi"}
              </p>
              <small>{t.id}</small>
              {t.replies?.length === 20 && (
                <p className="muted">Oxirgi 20 ta javob</p>
              )}
              {t.replies?.map((reply) => (
                <div className="admin-conversation" key={reply.id}>
                  <strong>Administrator javobi</strong>
                  <p className="admin-message">{reply.content}</p>
                  <small>{tashkentDate(reply.createdAt)}</small>
                </div>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
