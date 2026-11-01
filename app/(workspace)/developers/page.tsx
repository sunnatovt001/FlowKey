import { db } from "@/server/db";
import { workspace, Search } from "@/server/workspace";

import { DeveloperTools } from "@/components/developer-tools";
import { IntegrationChooser } from "@/components/integration-chooser";
import { checkoutUrl } from "@/server/checkout";
import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
export const metadata = { title: "Dasturchilar" };
export default async function Developers({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const { project, role } = await workspace(search);
  if (!roleAllows(role, "technical")) notFound();
  const links = await db.paymentLink.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const tab =
    typeof search.tab === "string" &&
    ["keys", "sandbox", "webhooks"].includes(search.tab)
      ? search.tab
      : "keys";
  const [keys, endpoints, deliveries] = await Promise.all([
    db.apiKey.findMany({
      where: { projectId: project.id },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookEndpoint.findMany({
      where: { projectId: project.id },
      select: { id: true, url: true, events: true, disabledAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.webhookDelivery.findMany({
      where: { endpoint: { projectId: project.id } },
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
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ulash</h1>
        </div>
        <span className="sandbox-label">Unit muhiti</span>
      </div>
      <IntegrationChooser
        projectId={project.id}
        links={links.map((link) => ({
          id: link.id,
          title: link.title,
          url: checkoutUrl(`/pay/${link.id}`),
          disabled: !!link.disabledAt,
        }))}
      >
        <DeveloperTools
          key={`${project.id}:${tab}`}
          projectId={project.id}
          tab={tab}
          keys={keys.map((k) => ({
            ...k,
            createdAt: k.createdAt.toISOString(),
            revokedAt: k.revokedAt?.toISOString() || null,
          }))}
          endpoints={endpoints.map((e) => ({
            ...e,
            disabledAt: e.disabledAt?.toISOString() || null,
          }))}
          deliveries={deliveries.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      </IntegrationChooser>
    </>
  );
}
