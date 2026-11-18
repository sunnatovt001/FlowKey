import { db } from "./db";
import { requireUser } from "./auth";
import { isPlatformAdmin } from "./admin-access";
import { ApiError } from "./security";
import { unpackText, unpackSnapshot } from "./telegram/storage";
import { redact } from "./telegram/policy";
import { hasAdminSession } from "./admin-session";
import { redirect } from "next/navigation";
export async function requireAdmin() {
  const user = await requireUser();
  if (!isPlatformAdmin(user.id))
    throw new ApiError(403, "Admin ruxsati kerak.");
  if (!(await hasAdminSession(user.id)))
    throw new ApiError(401, "Admin paroli bilan tasdiqlang.");
  return user;
}
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/admin-login");
    throw error;
  }
}
export function adminSearch(
  params: Record<string, string | string[] | undefined>,
) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const raw = Number(params.page);
  const page = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 10000) : 1;
  return { q, page, take: 25, skip: (page - 1) * 25 };
}
export async function adminOverview() {
  await requireAdminPage();
  const [users, projects, open, inProgress, resolved, failed] =
    await Promise.all([
      db.user.count(),
      db.project.count(),
      db.supportTicket.count({ where: { resolutionStatus: "open" } }),
      db.supportTicket.count({ where: { resolutionStatus: "in_progress" } }),
      db.supportTicket.count({ where: { resolutionStatus: "resolved" } }),
      db.supportTicket.count({ where: { status: "failed" } }),
    ]);
  return { users, projects, open, inProgress, resolved, failed };
}
export async function adminUsers(
  params: Record<string, string | string[] | undefined>,
) {
  await requireAdminPage();
  const search = adminSearch(params);
  const where = search.q
    ? {
        OR: [
          { email: { contains: search.q, mode: "insensitive" as const } },
          { name: { contains: search.q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        businesses: { select: { _count: { select: { projects: true } } } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: search.take,
      skip: search.skip,
    }),
    db.user.count({ where }),
  ]);
  return { rows, total, ...search };
}
export async function adminProjects(
  params: Record<string, string | string[] | undefined>,
) {
  await requireAdminPage();
  const search = adminSearch(params);
  const where = search.q
    ? {
        OR: [
          { name: { contains: search.q, mode: "insensitive" as const } },
          { id: { contains: search.q } },
          {
            business: {
              owner: {
                email: { contains: search.q, mode: "insensitive" as const },
              },
            },
          },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    db.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        archivedAt: true,
        createdAt: true,
        business: { select: { owner: { select: { email: true } } } },
        _count: { select: { transactions: true, memberships: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: search.take,
      skip: search.skip,
    }),
    db.project.count({ where }),
  ]);
  return { rows, total, ...search };
}
export async function adminTickets(
  params: Record<string, string | string[] | undefined>,
) {
  await requireAdminPage();
  const search = adminSearch(params);
  const state = ["open", "in_progress", "resolved"].includes(
    String(params.state),
  )
    ? String(params.state)
    : "";
  const where = {
    ...(state ? { resolutionStatus: state } : {}),
    ...(search.q
      ? {
          OR: [
            { id: { contains: search.q } },
            {
              user: {
                email: { contains: search.q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      select: {
        id: true,
        summary: true,
        status: true,
        resolutionStatus: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: search.take,
      skip: search.skip,
    }),
    db.supportTicket.count({ where }),
  ]);
  return {
    rows: records.map((row) => ({
      ...row,
      summary: redact(unpackText(row.summary)).slice(0, 300),
    })),
    total,
    state,
    ...search,
  };
}
export async function adminTicket(id: string) {
  await requireAdminPage();
  const row = await db.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      summary: true,
      diagnostics: true,
      status: true,
      resolutionStatus: true,
      createdAt: true,
      resolvedAt: true,
      deliveredAt: true,
      replies: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
        select: {
          id: true,
          content: true,
          createdAt: true,
          notificationStatus: true,
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!row) return null;
  let snapshot: Record<string, unknown> = {};
  try {
    snapshot = unpackSnapshot(row.diagnostics) || {};
  } catch {}
  const findings = Array.isArray(snapshot.findings)
    ? snapshot.findings
        .filter((value): value is string => typeof value === "string")
        .slice(0, 20)
        .map(redact)
    : [];
  const conversation = Array.isArray(snapshot.conversation)
    ? snapshot.conversation
        .slice(0, 6)
        .filter(
          (value): value is { role: string; content: string } =>
            !!value &&
            typeof value === "object" &&
            typeof value.content === "string" &&
            typeof value.role === "string",
        )
        .map((value) => ({
          role: value.role === "user" ? "Foydalanuvchi" : "Yordamchi",
          content: redact(value.content),
        }))
    : [];
  return {
    ...row,
    diagnostics: undefined,
    replies: row.replies
      .reverse()
      .map((r) => ({ ...r, content: unpackText(r.content) })),
    summary: redact(unpackText(row.summary)),
    findings,
    conversation,
  };
}
export { updateAdminTicket } from "./admin-ticket-workflow";
export async function adminAudit(
  params: Record<string, string | string[] | undefined>,
) {
  await requireAdminPage();
  const search = adminSearch(params);
  const [rows, total] = await Promise.all([
    db.adminAudit.findMany({
      select: {
        id: true,
        actorId: true,
        action: true,
        targetId: true,
        details: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: search.take,
      skip: search.skip,
    }),
    db.adminAudit.count(),
  ]);
  return { rows, total, ...search };
}
