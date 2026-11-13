import { workspace, type Search } from "@/server/workspace";
import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { integrationData } from "@/server/integration-data";
import { TestingCenter } from "@/components/testing-center";
import { DeveloperTools } from "@/components/developer-tools";
import { TestCheckout } from "@/components/test-checkout";
import { FinanceSection } from "@/components/finance-section";
import { SubscriptionsSection } from "@/components/subscriptions-section";
import Link from "next/link";
export const metadata = { title: "Sinov markazi" };
export default async function Testing({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "read")) notFound();
  const technical = roleAllows(role, "technical");
  const data = technical ? await integrationData(project.id) : null;
  const panels = [];
  if (data) {
    panels.push({
      id: "payments",
      title: "To‘lov",
      description:
        "Muvaffaqiyatli, xato va kutish natijalarini yarating. Bu kabinet sinovi; haqiqiy API ulanishini kodingizdan ham tekshiring.",
      content: <DeveloperTools {...data.tools} tab="sandbox" guided />,
    });
    panels.push({
      id: "checkout",
      title: "Sahifa va tugma",
      description: "Havola, HTML tugma va scriptni bir joyda tekshiring.",
      content: <TestCheckout projectId={project.id} links={data.links} />,
    });
    panels.push({
      id: "webhooks",
      title: "Webhook",
      description:
        "Yetkazish holati, javob kodi va qayta urinishlarni tekshiring.",
      content: (
        <>
          <Link
            className="button secondary"
            href={`/developers?project=${project.id}&tab=webhooks`}
          >
            Webhookni sozlash
          </Link>
          <DeveloperTools
            {...data.tools}
            tab="webhooks"
            guided
            hideEndpointSetup
          />
        </>
      ),
    });
  }
  if (roleAllows(role, "finance"))
    panels.push({
      id: "finance",
      title: "Mablag‘lar",
      description:
        "Qaytarish va pul chiqarish jarayonlarini sinang. Amallar rol ruxsatlariga bog‘liq.",
      content: <FinanceSection projectId={project.id} role={role} testing />,
    });
  if (technical)
    panels.push({
      id: "subscriptions",
      title: "Obunalar",
      description: "Obuna yaratish, tayyor davrni sinash va bekor qilish.",
      content: (
        <SubscriptionsSection projectId={project.id} role={role} testing />
      ),
    });
  return <TestingCenter key={project.id} panels={panels} />;
}
