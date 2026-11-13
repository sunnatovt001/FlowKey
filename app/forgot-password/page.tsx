import { AuthScreen } from "@/components/auth-screen";
export const metadata = { title: "Parolni tiklash" };
export default function Page() {
  return <AuthScreen mode="forgot" localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} />;
}
