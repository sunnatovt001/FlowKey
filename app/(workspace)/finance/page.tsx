import { workspace, type Search } from "@/server/workspace";
import { financialOverview } from "@/server/finance";
import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { money, Empty } from "@/components/ui";
import { OperationForm } from "@/components/operation-form";
import { db } from "@/server/db";
export const metadata = { title: "Moliya" };
const labels: Record<string, string> = {
  available: "Mavjud sinov balansi",
  fees: "Komissiya",
  reserved: "Band qilingan",
  paid: "Chiqarilgan (sinov)",
  provider: "Hamkor hisobining aksi",
  requested: "Tasdiq kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  completed: "Bajarilgan (sinov)",
  failed: "Bajarilmadi",
};
export default async function Finance({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "finance")) notFound();
  const [data, payments] = await Promise.all([
    financialOverview(project.id),
    db.transaction.findMany({
      where: { projectId: project.id, status: "successful" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const endpoint = `/api/projects/${project.id}/operations`;
  const get = (account: string) =>
    BigInt(
      data.balances.find((b) => b.currency === "UZS" && b.account === account)
        ?.amountMinor || 0,
    );
  const sum = data.balances.reduce((n, b) => n + BigInt(b.amountMinor), 0n);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Mablag‘lar hisobi.</h1>
        </div>
        <a
          className="button secondary"
          href={`/api/projects/${project.id}/report`}
        >
          Hisobot (CSV)
        </a>
      </div>
      <div className="notice">
        Faqat Unit sinovi. Bu mablag‘lar haqiqiy pul emas. Bankka yoki kartaga
        pul o‘tkazilmaydi.
      </div>
      <section className="panel finance-summary">
        <h2>UZS hisobi</h2>
        <dl>
          {["available", "reserved", "fees", "paid"].map((a) => (
            <div key={a}>
              <dt>{labels[a]}</dt>
              <dd>{money(get(a))}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          Komissiya 3%, tiyin aniqligida pastga yaxlitlanadi. Jurnal:{" "}
          {sum === 0n ? "muvozanatda" : "farq bor"}.
        </p>
      </section>
      <div className="operations-columns">
        <section className="panel operation-panel">
          <h2>Pul chiqarish arizasi</h2>
          <p className="muted">
            Eng kam summa 20 000 UZS. Summa ariza yaratilganda band qilinadi;
            egasi tasdiqlaydi.
          </p>
          <OperationForm
            endpoint={endpoint}
            action="payout"
            label="Sinov arizasi yaratish"
            amountName="amount"
          >
            <label>
              Summa, UZS
              <input
                name="amount"
                inputMode="decimal"
                required
                placeholder="20000"
              />
            </label>
          </OperationForm>
        </section>
        {role === "owner" && (
          <section className="panel operation-panel">
            <h2>To‘lovni qaytarish</h2>
            <p className="muted">
              To‘liq yoki qisman qaytarish. Komissiyaning tegishli qismi ham
              bekor qilinadi.
            </p>
            {payments.length ? (
              <OperationForm
                endpoint={endpoint}
                action="refund"
                label="Sinov qaytarishini bajarish"
                amountName="amount"
              >
                <label>
                  To‘lov
                  <select name="paymentId" required>
                    {payments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id.slice(0, 12)} · {money(t.amountMinor)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Qaytarish summasi, UZS
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    placeholder="10000"
                  />
                </label>
              </OperationForm>
            ) : (
              <p>Avval muvaffaqiyatli sinov to‘lovi yarating.</p>
            )}
          </section>
        )}
      </div>
      <section className="panel operation-panel">
        <h2>Pul chiqarish arizalari</h2>
        {!data.payouts.length ? (
          <Empty title="Hali ariza yo‘q">
            Yuqoridagi shakldan sinov arizasi yarating.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Summa</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.createdAt.toLocaleDateString("uz-UZ", {
                        timeZone: "Asia/Tashkent",
                      })}
                    </td>
                    <td>{money(row.amountMinor)}</td>
                    <td>{labels[row.status] || row.status}</td>
                    <td>
                      <div className="operation-actions">
                        {role === "owner" &&
                          (row.status === "requested"
                            ? ["approve", "reject"]
                            : row.status === "approved"
                              ? ["complete", "fail"]
                              : []
                          ).map((action) => (
                            <OperationForm
                              key={action}
                              endpoint={endpoint}
                              action={action}
                              fixed={{ id: row.id }}
                              label={
                                {
                                  approve: "Tasdiqlash",
                                  reject: "Rad etish",
                                  complete: "Sinovda bajarish",
                                  fail: "Xatoni sinash",
                                }[action]!
                              }
                            />
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel operation-panel">
        <h2>Qaytarishlar</h2>
        {data.refunds.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>To‘lov</th>
                  <th>Qaytarilgan</th>
                  <th>Komissiya qaytarilishi</th>
                </tr>
              </thead>
              <tbody>
                {data.refunds.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code>{r.paymentId}</code>
                    </td>
                    <td>{money(r.amountMinor)}</td>
                    <td>{money(r.feeMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Qaytarishlar hali yo‘q.</p>
        )}
      </section>
      <details className="panel operation-panel">
        <summary>Moliyaviy jurnal · oxirgi 100 yozuv</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Operatsiya</th>
                <th>Hisob</th>
                <th>Summa (tiyin)</th>
                <th>Valyuta</th>
              </tr>
            </thead>
            <tbody>
              {data.journal.map((e) => (
                <tr key={e.id}>
                  <td>
                    <code>{e.operationId}</code>
                  </td>
                  <td>{labels[e.account] || e.account}</td>
                  <td>{String(e.amountMinor)}</td>
                  <td>{e.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
