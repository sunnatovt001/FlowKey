"use client";
import { paymentDateLabel, paymentTimeLabel } from "@/shared/payments";
import { tashkentDate } from "@/shared/locale";
import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight, ReceiptText, ChevronRight } from "lucide-react";
import { money, Status } from "./ui";
import { CopyButton } from "./copy";
type Row = {
  id: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  status: string;
};
export function TransactionTable({
  rows,
  project,
}: {
  rows: Row[];
  project: string;
}) {
  const [selected, setSelected] = useState<Row | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected && !ref.current?.open) ref.current?.showModal();
    else if (!selected) ref.current?.close();
  }, [selected]);
  return (
    <>
      <div className="payments-table-wrap">
        <table className="payments-table">
          <thead>
            <tr>
              <th>To‘lov</th>
              <th className="payments-amount-column">Summa</th>
              <th>Holat</th>
              <th>
                Sana <span>· Toshkent</span>
              </th>
              <th>
                <span className="sr-only">Tafsilotlar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="payments-reference">
                    <span className="payments-receipt-icon">
                      <ReceiptText size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <button
                        className="payments-reference-button"
                        onClick={() => setSelected(t)}
                        aria-label={`To‘lov ${t.id} tafsilotlari`}
                      >
                        #{t.id.slice(0, 8)}
                        <ArrowUpRight size={13} />
                      </button>
                      <small>Sinov to‘lovi</small>
                    </div>
                  </div>
                </td>
                <td className="payments-row-amount">
                  {money(t.amountMinor)} <span>{t.currency}</span>
                </td>
                <td>
                  <Status status={t.status} />
                </td>
                <td>
                  <time dateTime={t.createdAt}>
                    {paymentDateLabel(t.createdAt)}
                    <small>{paymentTimeLabel(t.createdAt)}</small>
                  </time>
                </td>
                <td>
                  <button
                    className="payments-open-detail"
                    onClick={() => setSelected(t)}
                    aria-label={`${t.id.slice(0, 8)} to‘lov tafsilotlari`}
                  >
                    <span>Tafsilotlar</span>
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="payments-mobile-list" aria-label="To‘lovlar ro‘yxati">
        {rows.map((t) => (
          <article className="payments-mobile-payment" key={t.id}>
            <div className="payments-mobile-top">
              <strong>
                {money(t.amountMinor)} <small>{t.currency}</small>
              </strong>
              <Status status={t.status} />
            </div>
            <div className="payments-mobile-bottom">
              <div>
                <span>#{t.id.slice(0, 8)}</span>
                <time dateTime={t.createdAt}>{tashkentDate(t.createdAt)}</time>
              </div>
              <button
                onClick={() => setSelected(t)}
                aria-label={`${t.id.slice(0, 8)} to‘lov tafsilotlari`}
              >
                Tafsilotlar
                <ChevronRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <dialog
        className="payments-dialog"
        ref={ref}
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        aria-labelledby="payment-detail-title"
      >
        <div className="payments-dialog-heading">
          <h2 id="payment-detail-title">To‘lov tafsilotlari</h2>
          <button
            className="icon-button"
            aria-label="Tafsilotlarni yopish"
            onClick={() => setSelected(null)}
          >
            <X size={20} />
          </button>
        </div>
        {selected && (
          <>
            <div className="payments-dialog-amount">
              <span>Sinov to‘lovi</span>
              <h3>
                {money(selected.amountMinor)} <small>{selected.currency}</small>
              </h3>
              <Status status={selected.status} />
            </div>
            <dl className="payments-facts">
              <div>
                <dt>Loyiha</dt>
                <dd>{project}</dd>
              </div>
              <div>
                <dt>Sana · Toshkent</dt>
                <dd>{tashkentDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt>To‘lov ID</dt>
                <dd className="payments-full-id">
                  <code>{selected.id}</code>
                  <CopyButton value={selected.id} />
                </dd>
              </div>
            </dl>
            <p className="payments-detail-note">
              Bu sinov to‘lovi. Haqiqiy pul o‘tkazilmagan.
            </p>
            <details className="payments-technical">
              <summary>Texnik ma’lumotlar</summary>
              <dl>
                <div>
                  <dt>Kichik birlikdagi summa</dt>
                  <dd>{selected.amountMinor}</dd>
                </div>
                <div>
                  <dt>Sana · UTC</dt>
                  <dd>{new Date(selected.createdAt).toISOString()}</dd>
                </div>
              </dl>
            </details>
          </>
        )}
      </dialog>
    </>
  );
}
