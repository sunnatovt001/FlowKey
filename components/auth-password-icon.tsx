import { Eye, EyeOff } from "lucide-react";

export function AuthPasswordIcon({ visible }: { visible: boolean }) {
  return (
    <span className="auth-password-visual" data-visible={visible} aria-hidden="true">
      <Eye size={20} />
      <EyeOff size={20} />
    </span>
  );
}
