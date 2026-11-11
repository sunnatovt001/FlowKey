import { db } from "./db";
import { workspace, type Search } from "./workspace";
import { dashboardPeriod } from "../shared/dashboard";
import { requireProject } from "./auth";
export async function dashboardData(search: Search) {
  const { project, role, user } = await workspace(search);
  return {
    ...(await projectDashboard(project.id, user.id, search.range)),
    project,
    role,
  };
}
export async function projectDashboard(
  projectId: string,
  userId: string,
  range: unknown,
) {
  await requireProject(projectId, userId, true, "read");
  const period = dashboardPeriod(range);
  const where = {
    projectId,
    createdAt: { gte: period.start, lt: period.end },
  };
  const [groups, recent, keys, endpoints, deliveries, activity] =
    await Promise.all([
      db.transaction.groupBy({
        by: ["status"],
        where,
        _count: true,
        _sum: { amountMinor: true },
      }),
      db.transaction.findMany({
        where,
        select: { id: true, amountMinor: true, status: true, createdAt: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
      db.apiKey.aggregate({
        where: { projectId: projectId, revokedAt: null },
        _count: true,
        _max: { lastUsedAt: true },
      }),
      db.webhookEndpoint.count({
        where: { projectId: projectId, disabledAt: null },
      }),
      db.webhookDelivery.groupBy({
        by: ["status"],
        where: { endpoint: { projectId: projectId, disabledAt: null } },
        _count: true,
      }),
      db.$queryRaw<
        { date: string; volume: bigint; count: bigint }[]
      >`SELECT to_char("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD') AS date, COALESCE(SUM(CASE WHEN status = 'successful' THEN "amountMinor" ELSE 0 END),0)::bigint AS volume, COUNT(*)::bigint AS count FROM "Transaction" WHERE "projectId"=${projectId} AND "createdAt">=(${period.start}::timestamptz AT TIME ZONE 'UTC') AND "createdAt"<(${period.end}::timestamptz AT TIME ZONE 'UTC') GROUP BY 1 ORDER BY 1`,
    ]);
  const days = period.dates.map((date) => {
    const row = activity.find((row) => row.date === date);
    return { date, volume: row?.volume || 0n, count: row?.count || 0n };
  });
  const successful = groups.find((row) => row.status === "successful"),
    pending = groups.find((row) => row.status === "pending"),
    failed = groups.find((row) => row.status === "failed");
  const deliveryCount = (status: string) =>
    deliveries.find((row) => row.status === status)?._count || 0;
  const webhook =
    endpoints === 0
      ? { text: "Ulanmagan", tone: "neutral" }
      : deliveryCount("failed")
        ? { text: "Xato bor", tone: "error" }
        : deliveryCount("queued") || deliveryCount("sending")
          ? { text: "Navbatda", tone: "pending" }
          : deliveryCount("delivered")
            ? { text: "Yetkazilgan", tone: "success" }
            : { text: "Tekshirilmagan", tone: "neutral" };
  return {
    period,
    days,
    recent,
    keyCount: keys._count,
    lastUsedAt: keys._max.lastUsedAt,
    endpoints,
    webhook,
    volume: successful?._sum.amountMinor || 0n,
    successful: successful?._count || 0,
    pending: pending?._count || 0,
    failed: failed?._count || 0,
    total: groups.reduce((sum, row) => sum + row._count, 0),
  };
}
