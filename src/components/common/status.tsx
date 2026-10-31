import { statusLabel } from "@/shared/locale";
export function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
