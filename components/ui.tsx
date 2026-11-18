import { statusLabel } from "@/shared/locale";
import { Waves } from "lucide-react";
export { Logo } from "./common/logo";
export { PublicNav } from "./common/public-nav";
export function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Waves size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export const money = (minor: number | bigint) => {
  const value = BigInt(minor);
  const fraction = String(value % BigInt(100)).padStart(2, "0");
  return (
    String(value / BigInt(100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") +
    (fraction === "00" ? "" : `.${fraction}`)
  );
};
