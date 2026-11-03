import Link from "next/link";
import { notFound } from "next/navigation";
import { adminTicket } from "@/server/admin";
import { type TicketState } from "@/server/admin-access";
import { AdminTime, TicketBadge, DeliveryBadge } from "@/components/admin-ui";
import { AdminTicketStatus } from "@/components/admin-ticket-status";
export default async function Ticket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await adminTicket(id);
  if (!ticket) notFound();
  return (
    <>
      <Link className="admin-back" href="/admin/tickets">
        ← Murojaatlar
      </Link>
      <div className="admin-heading">
        <h1>Murojaat</h1>
        <TicketBadge status={ticket.resolutionStatus} />
      </div>
      <code className="admin-id">{ticket.id}</code>
      <div className="admin-ticket-grid">
        <section className="panel admin-panel">
          <h2>Muammo</h2>
          <p className="admin-message">{ticket.summary}</p>
          <dl className="admin-facts">
            <div>
              <dt>Foydalanuvchi</dt>
              <dd>
                {ticket.user.name || "—"} · {ticket.user.email}
              </dd>
            </div>
            <div>
              <dt>Yaratilgan</dt>
              <dd>
                <AdminTime date={ticket.createdAt} />
              </dd>
            </div>
            <div>
              <dt>Telegram’ga yetkazish</dt>
              <dd>
                <DeliveryBadge status={ticket.status} />
              </dd>
            </div>
            {ticket.resolvedAt && (
              <div>
                <dt>Hal qilingan</dt>
                <dd>
                  <AdminTime date={ticket.resolvedAt} />
                </dd>
              </div>
            )}
          </dl>
          <h2>Hisob tekshiruvi</h2>
          {ticket.findings.length ? (
            <ul className="admin-findings">
              {ticket.findings.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          ) : (
            <p className="admin-note">Tekshiruv ma’lumoti yo‘q.</p>
          )}
        </section>
        <section className="panel admin-panel">
          <h2>Holatni boshqarish</h2>
          <AdminTicketStatus
            key={ticket.resolutionStatus}
            id={id}
            status={ticket.resolutionStatus as TicketState}
          />
        </section>
      </div>
      <section className="panel admin-panel">
        <h2>Murojaatga biriktirilgan suhbat</h2>
        {ticket.conversation.length ? (
          ticket.conversation.map((message, index) => (
            <div className="admin-conversation" key={index}>
              <strong>{message.role}</strong>
              <p>{message.content}</p>
            </div>
          ))
        ) : (
          <p className="admin-note">Biriktirilgan xabarlar yo‘q.</p>
        )}
      </section>
    </>
  );
}
