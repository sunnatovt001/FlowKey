import { T } from "@/components/i18n/language-provider";
import { statusLabel } from "@/shared/locale";
export function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true" />
      <T>{statusLabel(status)}</T>
    </span>
  );
}
