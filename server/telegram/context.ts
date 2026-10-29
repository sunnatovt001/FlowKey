import { unpackText } from "./storage";
import { db } from "../db";
import { diagnosticFindings, redact, safeWebsite } from "./policy";
export async function accountContext(userId: string) {
  const owned = { business: { ownerId: userId } };
  const [
    user,
    business,
    projectCount,
    projects,
    groups,
    recent,
    activeKeys,
    failedDeliveries,
    failedDeliveryCount,
    expiredSessions,
    tickets,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.business.findUnique({
      where: { ownerId: userId },
      select: { name: true, type: true },
    }),
    db.project.count({ where: owned }),
    db.project.findMany({
      where: owned,
      select: {
        id: true,
        name: true,
        website: true,
        archivedAt: true,
        _count: {
          select: {
            keys: { where: { revokedAt: null } },
            transactions: true,
            endpoints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.transaction.groupBy({
      by: ["status"],
      where: { project: owned },
      _count: true,
      _sum: { amountMinor: true },
    }),
    db.transaction.findMany({
      where: { project: owned },
      select: {
        id: true,
        projectId: true,
        status: true,
        amountMinor: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.apiKey.count({ where: { project: owned, revokedAt: null } }),
    db.webhookDelivery.findMany({
      where: { endpoint: { project: owned }, status: "failed" },
      select: {
        id: true,
        status: true,
        responseCode: true,
        attempts: true,
        endpoint: { select: { projectId: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.webhookDelivery.count({
      where: { endpoint: { project: owned }, status: "failed" },
    }),
    db.checkoutSession.count({
      where: { project: owned, result: null, expiresAt: { lt: new Date() } },
    }),
    db.supportTicket.findMany({
      where: { userId },
      select: {
        id: true,
        summary: true,
        status: true,
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const failedPayments = groups.find((g) => g.status === "failed")?._count || 0;
  const findings = diagnosticFindings({
    projects: projectCount,
    activeKeys,
    failedDeliveries: failedDeliveryCount,
    expiredSessions,
    failedPayments,
  });
  return JSON.parse(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        user,
        business,
        projectCount,
        projects: projects.map((p) => ({
          ...p,
          website: safeWebsite(p.website),
        })),
        totals: groups,
        recentTransactions: recent,
        activeKeys,
        failedDeliveries: failedDeliveries.map((d) => ({
          ...d,
          endpoint: { ...d.endpoint, url: safeWebsite(d.endpoint.url) },
        })),
        expiredSessions,
        tickets: tickets.map((t) => ({ ...t, summary: unpackText(t.summary) })),
        findings,
        limits: {
          projects: 100,
          recentTransactions: 30,
          failedDeliveries: 20,
          tickets: 5,
        },
        help: {
          createProject: "/settings#create-project",
          integration: "/developers",
          transactions: "/transactions",
          docs: "/docs",
        },
      },
      (_, v) =>
        typeof v === "bigint"
          ? v.toString()
          : typeof v === "string"
            ? redact(v)
            : v,
    ),
  ) as { findings: string[]; [key: string]: unknown };
}
