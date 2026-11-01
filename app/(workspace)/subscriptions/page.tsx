import { workspace, type Search } from "@/server/workspace";
import { roleAllows } from "@/shared/project-role";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { OperationForm } from "@/components/operation-form";
import { money, Empty } from "@/components/ui";
export const metadata = { title: "Obunalar" };
export default async function Subscriptions({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "technical")) notFound();
  const rows = await db.subscription.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const endpoint = `/api/projects/${project.id}/operations`;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Davriy to‘lovlar.</h1>
        </div>
      </div>
      <div className="notice">
        Faqat sinov obunalari. Haqiqiy karta va avtomatik pul yechish ulanmagan.
        Har bir tayyor davrni qo‘lda sinashingiz mumkin.
      </div>
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
      <section className="panel operation-panel">
        <h2>Obunalar ro‘yxati</h2>
        {!rows.length ? (
          <Empty title="Hali obuna yo‘q">
            Yuqoridagi shaklda birinchi obunani yarating.
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
                  <th>Amallar</th>
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
                    <td>
                      <div className="operation-actions">
                        {r.status === "active" && (
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
