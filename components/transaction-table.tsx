"use client";
import { tashkentDate } from "@/shared/locale";
import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
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
    if (selected) ref.current?.showModal();
    else ref.current?.close();
  }, [selected]);
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tranzaksiya ID’si</th>
              <th>Summa</th>
              <th>Valyuta</th>
              <th>Sana · Toshkent vaqti</th>
              <th>Holat</th>
              <th>Loyiha</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <button className="table-link" onClick={() => setSelected(t)}>
                    {t.id}
                    <ArrowUpRight size={13} />
                  </button>
                  <small>Sinov to‘lovi</small>
                </td>
                <td className="numeric">{money(t.amountMinor)}</td>
                <td>{t.currency}</td>
                <td>
                  {tashkentDate(t.createdAt)}
                </td>
                <td>
                  <Status status={t.status} />
                </td>
                <td>{project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog
        ref={ref}
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        aria-labelledby="transaction-title"
      >
        <div className="dialog-heading">
          <h2 id="transaction-title">Tranzaksiya tafsilotlari</h2>
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
            <p className="sandbox-label">Sinov ma’lumotlari</p>
            <h3 className="detail-amount">
              {money(selected.amountMinor)} {selected.currency}
            </h3>
            <Status status={selected.status} />
            <dl className="detail-list">
              <div>
                <dt>Tranzaksiya ID’si</dt>
                <dd>
                  {selected.id}
                  <CopyButton value={selected.id} />
                </dd>
              </div>
              <div>
                <dt>Loyiha</dt>
                <dd>{project}</dd>
              </div>
              <div>
                <dt>Yaratilgan sana</dt>
                <dd>{new Date(selected.createdAt).toISOString()}</dd>
              </div>
              <div>
                <dt>Kichik birlikdagi summa</dt>
                <dd>{selected.amountMinor}</dd>
              </div>
              <div>
                <dt>Haqiqiy to‘lov rejimi</dt>
                <dd>O‘chiq — haqiqiy pul ishlatilmaydi</dd>
              </div>
            </dl>
          </>
        )}
      </dialog>
    </>
  );
}
