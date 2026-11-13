import { headers } from "next/headers";
import { AuthScreen } from "@/components/auth-screen";
import { socialAuthAvailability } from "@/server/social-auth";
export const metadata = { title: "Kirish" };
export default async function Page() {
  const available = socialAuthAvailability();
  return <AuthScreen signup={false} localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} available={available} googleClientId={available.google ? process.env.GOOGLE_CLIENT_ID : undefined} nonce={(await headers()).get("x-nonce") || undefined} />;
}
