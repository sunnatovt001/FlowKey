import { workspace, type Search } from "@/server/workspace";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
export const metadata = { title: "Faoliyat jurnali" };
const actions: Record<string, string> = {
  "payment.created": "Sinov to‘lovi yaratildi",
  "sandbox.refund.created": "Sinov qaytarishi bajarildi",
  "sandbox.payout.requested": "Pul chiqarish so‘raldi",
  "sandbox.payout.approved": "Ariza tasdiqlandi",
  "sandbox.payout.completed": "Sinov pul chiqarishi bajarildi",
  "sandbox.payout.failed": "Sinov pul chiqarishi bajarilmadi",
  "sandbox.payout.rejected": "Ariza rad etildi",
  "team.invited": "Jamoaga taklif yaratildi",
  "team.accepted": "Taklif qabul qilindi",
  "team.declined": "Taklif rad etildi",
  "team.removed": "A’zolik bekor qilindi",
  "team.invite_revoked": "Taklif bekor qilindi",
  "sandbox.subscription.created": "Sinov obunasi yaratildi",
  "sandbox.subscription.billed": "Obuna davri sinovdan o‘tdi",
  "sandbox.subscription.cancelled": "Obuna bekor qilindi",
};
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (role !== "owner") notFound();
  const rows = await db.auditLog.findMany({
    where: { projectId: project.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Faoliyat jurnali.</h1>
        </div>
      </div>
      <section className="panel operation-panel">
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Vaqt (Toshkent)</th>
                  <th>Amal</th>
                  <th>Resurs</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.createdAt.toLocaleString("uz-UZ", {
                        timeZone: "Asia/Tashkent",
                      })}
                    </td>
                    <td>{actions[r.action] || r.action}</td>
                    <td>
                      <code>{r.resourceId}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Hali hodisalar yo‘q. Loyihada bajarilgan amallar shu yerda
            ko‘rinadi.
          </p>
        )}
      </section>
    </>
  );
}
