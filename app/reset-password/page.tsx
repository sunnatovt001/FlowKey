import { AuthScreen } from "@/components/auth-screen";
export const metadata = { title: "Yangi parol" };
export default function Page() {
  return <AuthScreen mode="reset" localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} />;
}
