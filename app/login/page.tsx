import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthScreen } from "@/components/auth-screen";
import { socialAuthAvailability } from "@/server/social-auth";
export const metadata = { title: "Kirish" };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; mode?: string }> }) {
  const query = await searchParams;
  if (query.token) redirect(`/reset-password?token=${encodeURIComponent(query.token)}`);
  if (query.mode === "verify") redirect("/verify-email");
  const available = socialAuthAvailability();
  return <AuthScreen signup={false} localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} available={available} googleClientId={available.google ? process.env.GOOGLE_CLIENT_ID : undefined} nonce={(await headers()).get("x-nonce") || undefined} />;
}
