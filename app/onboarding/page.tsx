import { redirect } from "next/navigation";
import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { Logo } from "@/components/ui";
import { OnboardingForm } from "@/components/onboarding-form";
export default async function Onboarding() {
  const user = await pageUser();
  if (await db.business.findUnique({ where: { ownerId: user.id } }))
    redirect("/dashboard");
  return (
    <main className="onboarding-page">
      <header>
        <Logo />
        <span className="sandbox-label">Unit muhitini sozlash</span>
      </header>
      <OnboardingForm draftKey={`flowza-onboarding-${user.id}`} />
      <p className="muted center">
        Haqiqiy to‘lov va bank ma’lumotlarisiz. Faqat yangi g‘oyangiz.
      </p>
    </main>
  );
}
