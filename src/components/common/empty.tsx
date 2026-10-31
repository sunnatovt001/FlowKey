import { Waves } from "lucide-react";
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
