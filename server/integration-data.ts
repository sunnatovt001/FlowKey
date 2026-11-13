import { db } from "./db";
import { checkoutUrl } from "./checkout";
export async function integrationData(projectId: string) {
  const links = await db.paymentLink.findMany({
    where: { projectId: projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const [keys, endpoints, deliveries] = await Promise.all([
    db.apiKey.findMany({
      where: { projectId: projectId },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookEndpoint.findMany({
      where: { projectId: projectId },
      select: { id: true, url: true, events: true, disabledAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookDelivery.findMany({
      where: { endpoint: { projectId: projectId } },
      select: {
        id: true,
        event: true,
        attempts: true,
        status: true,
        responseCode: true,
        error: true,
        createdAt: true,
        endpoint: { select: { url: true } },
        history: {
          orderBy: { attemptNumber: "asc" },
          select: { attemptNumber: true, responseCode: true, error: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    projectId,
    links: links.map((link) => ({
      id: link.id,
      title: link.title,
      url: checkoutUrl(`/pay/${link.id}`),
      disabled: !!link.disabledAt,
    })),
    tools: {
      projectId,
      keys: keys.map((k) => ({
        ...k,
        createdAt: k.createdAt.toISOString(),
        revokedAt: k.revokedAt?.toISOString() || null,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
      })),
      endpoints: endpoints.map((e) => ({
        ...e,
        disabledAt: e.disabledAt?.toISOString() || null,
      })),
      deliveries: deliveries.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    },
  };
}
