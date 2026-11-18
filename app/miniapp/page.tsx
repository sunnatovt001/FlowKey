import { headers } from "next/headers";
import { MiniApp } from "@/components/miniapp";
import "@/styles/miniapp.css";
export const metadata = { title: "FlowKey Business", robots: { index: false, follow: false } };
export default async function Page() {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return <MiniApp nonce={nonce} />;
}
