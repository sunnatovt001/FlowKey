import { AuthScreen } from "@/components/auth-screen";
export const metadata = { title: "Telegram orqali kirish" };
export default function Page() {
  return <AuthScreen mode="telegram" localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} />;
}
