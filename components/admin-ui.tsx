import Link from "next/link";
import { ticketStates } from "@/server/admin-access";
export function AdminTime({ date }: { date: Date | null }) {
  return (
    <>
      {date ? date.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }) : "—"}
    </>
  );
}
export function TicketBadge({ status }: { status: string }) {
  return (
    <span className={`admin-status admin-status-${status}`}>
      {ticketStates[status as keyof typeof ticketStates] || status}
    </span>
  );
}
export function DeliveryBadge({ status }: { status: string }) {
  return (
    <span>
      {(
        {
          queued: "Navbatda",
          sent: "Yetkazilgan",
          failed: "Yetkazilmadi",
        } as Record<string, string>
      )[status] || status}
    </span>
  );
}
export function AdminSearch({
  q,
  placeholder = "Qidirish",
  children,
}: {
  q: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <form className="admin-search" method="get">
      <label>
        <span className="sr-only">Qidirish</span>
        <input
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder={placeholder}
        />
      </label>
      {children}
      <button className="button secondary" type="submit">
        Qidirish
      </button>
    </form>
  );
}
export function AdminPager({
  page,
  total,
  path,
  q = "",
  state = "",
}: {
  page: number;
  total: number;
  path: string;
  q?: string;
  state?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / 25));
  const href = (next: number) => {
    const params = new URLSearchParams({ page: String(next) });
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    return `${path}?${params}`;
  };
  return (
    <div className="admin-pagination">
      <span>
        {total} ta · {page}-sahifa
      </span>
      <div>
        {page > 1 && (
          <Link className="button secondary" href={href(page - 1)}>
            Oldingi
          </Link>
        )}
        {page < pages && (
          <Link className="button secondary" href={href(page + 1)}>
            Keyingi
          </Link>
        )}
      </div>
    </div>
  );
}
