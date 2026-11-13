import Link from "next/link";
import { roleAllows } from "@/shared/project-role";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { OperationForm } from "@/components/operation-form";
import { money, Empty } from "@/components/ui";

export async function SubscriptionsSection({
  projectId,
  role,
  testing = false,
}: {
  projectId: string;
  role: string;
  testing?: boolean;
}) {
  if (!roleAllows(role, "technical")) notFound();
  const rows = await db.subscription.findMany({
    where: { projectId: projectId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const endpoint = `/api/projects/${projectId}/operations`;
  return (
    <>
      <div className="page-heading">
        <div>{testing ? <h2>Obunalar sinovi</h2> : <h1>Obunalar</h1>}</div>
      </div>
      <div className="notice">
        Haqiqiy karta va avtomatik pul yechish ulanmagan.
      </div>
      {testing && (
        <section className="panel operation-panel">
          <h2>Obuna yaratish</h2>
          <OperationForm
            endpoint={endpoint}
            action="subscribe"
            label="Sinov obunasi yaratish"
            amountName="amount"
          >
            <label>
              Obuna nomi
              <input
                name="title"
                minLength={2}
                maxLength={100}
                required
                placeholder="Pro tarif"
              />
            </label>
            <label>
              Summa, UZS
              <input
                name="amount"
                inputMode="decimal"
                required
                placeholder="99000"
              />
            </label>
            <label>
              Davr
              <select name="interval">
                <option value="monthly">Har oy</option>
                <option value="yearly">Har yil</option>
              </select>
            </label>
            <label className="operation-consent">
              <input type="checkbox" name="consent" required /> Bu sinov obunasi
              ekanini tasdiqlayman.
            </label>
          </OperationForm>
        </section>
      )}
      <section className="panel operation-panel">
        <h2>Obunalar ro‘yxati</h2>
        {!rows.length ? (
          <Empty title="Hali obuna yo‘q">
            {testing
              ? "Yuqoridagi shaklda birinchi obunani yarating."
              : "Obunalarni Sinov markazida tekshiring."}
            {!testing && (
              <Link
                className="button primary empty-action"
                href={`/testing?project=${projectId}&area=subscriptions`}
              >
                Sinov markaziga o‘tish
              </Link>
            )}
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Obuna</th>
                  <th>Summa</th>
                  <th>Holat</th>
                  <th>Keyingi davr</th>
                  {testing && <th>Amallar</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.title}
                      <div className="muted">
                        {r.interval === "monthly" ? "Oylik" : "Yillik"}
                      </div>
                    </td>
                    <td>{money(r.amountMinor)}</td>
                    <td>{r.status === "active" ? "Faol" : "Bekor qilingan"}</td>
                    <td>
                      {r.nextBillingAt.toLocaleDateString("uz-UZ", {
                        timeZone: "Asia/Tashkent",
                      })}
                    </td>
                    {testing && (
                      <td>
                        <div className="operation-actions">
                          {testing && r.status === "active" && (
                            <>
                              {r.nextBillingAt <= new Date() && (
                                <OperationForm
                                  endpoint={endpoint}
                                  action="bill"
                                  fixed={{ id: r.id, period: r.period }}
                                  label="Davrni sinash"
                                />
                              )}
                              <OperationForm
                                endpoint={endpoint}
                                action="cancel"
                                fixed={{ id: r.id }}
                                label="Bekor qilish"
                              />
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
