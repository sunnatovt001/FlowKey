import Form from "next/form";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { Prisma } from "@prisma/client";
import { workspace, Search } from "@/server/workspace";
import { db } from "@/server/db";

import { Empty } from "@/components/ui";
import { TransactionTable } from "@/components/transaction-table";
export const metadata = { title: "Tranzaksiyalar" };
export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const { project } = await workspace(search, true);
  const q = typeof search.q === "string" ? search.q.slice(0, 100) : "";
  const status =
    typeof search.status === "string" &&
    ["successful", "failed", "pending"].includes(search.status)
      ? search.status
      : "";
  const validDate = (v: unknown) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !isNaN(Date.parse(v))
      ? v
      : "";
  const from = validDate(search.from),
    to = validDate(search.to);
  const where: Prisma.TransactionWhereInput = {
    projectId: project.id,
    ...(q ? { id: { contains: q } } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00+05:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999+05:00`) } : {}),
          },
        }
      : {}),
  };
  const count = await db.transaction.count({ where });
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(
    pages,
    Math.max(1, Math.floor(Number(search.page)) || 1),
  );
  const rows = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 20,
    take: 20,
  });
  const href = (p: number) =>
    `/transactions?${new URLSearchParams({ project: project.id, q, status, from, to, page: String(p) })}`;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Kabinet / Tranzaksiyalar</p>
          <h1>Har bir to‘lovni kuzating.</h1>
          <p className="muted">
            Sinov tranzaksiyalarini qidiring, saralang va tekshiring.
          </p>
        </div>
        <span className="sandbox-label">Faqat sinov ma’lumotlari</span>
      </div>
      <section className="panel">
        <Form className="filters" action="/transactions">
          <input type="hidden" name="project" value={project.id} />
          <label className="search-field">
            <SearchIcon size={17} />
            <span className="sr-only">Tranzaksiya ID’sini qidirish</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Tranzaksiya ID’sini qidirish"
            />
          </label>
          <label>
            <span className="sr-only">Holat</span>
            <select name="status" defaultValue={status}>
              <option value="">Barcha holatlar</option>
              <option value="successful">Muvaffaqiyatli</option>
              <option value="pending">Kutilmoqda</option>
              <option value="failed">Muvaffaqiyatsiz</option>
            </select>
          </label>
          <label className="date-filter">
            Boshlanish · Toshkent vaqti
            <input name="from" type="date" defaultValue={from} />
          </label>
          <label className="date-filter">
            Tugash · Toshkent vaqti
            <input name="to" type="date" defaultValue={to} />
          </label>
          <button className="button secondary">Filtrlarni qo‘llash</button>
          <Link
            className="reset-link"
            href={`/transactions?project=${project.id}`}
          >
            Tozalash
          </Link>
        </Form>
        {rows.length ? (
          <TransactionTable
            rows={rows.map((t) => ({
              ...t,
              amountMinor: Number(t.amountMinor),
              createdAt: t.createdAt.toISOString(),
            }))}
            project={project.name}
          />
        ) : (
          <Empty
            title={
              q || status || from || to
                ? "Mos tranzaksiya topilmadi."
                : "Tranzaksiyalar tarixi shu yerdan boshlanadi."
            }
          >
            {q || status || from || to
              ? "Boshqa ID, holat yoki sana oralig‘ini tanlang."
              : "Tranzaksiyani ko‘rish uchun Dasturchilar bo‘limida sinov to‘lovi yarating."}
            <Link href={`/developers?project=${project.id}&tab=sandbox`}>
              Unit muhitini ochish
            </Link>
          </Empty>
        )}
        <div className="pagination">
          <span>
            {count} ta tranzaksiya · Sahifa {page} / {pages}
          </span>
          <div>
            {page > 1 ? (
              <Link className="button secondary" href={href(page - 1)}>
                Oldingi
              </Link>
            ) : (
              <button disabled className="button secondary">
                Oldingi
              </button>
            )}
            {page < pages ? (
              <Link className="button secondary" href={href(page + 1)}>
                Keyingi
              </Link>
            ) : (
              <button disabled className="button secondary">
                Keyingi
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
