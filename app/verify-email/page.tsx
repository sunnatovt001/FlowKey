import { AuthScreen } from "@/components/auth-screen";
export const metadata = { title: "Pochtani tasdiqlash" };
export default function Page() {
  return <AuthScreen mode="verify" localMail={process.env.NODE_ENV === "development" && process.env.MAIL_TRANSPORT === "file"} />;
}
