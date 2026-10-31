import type { ReactNode } from "react";
/** Shared visual root. Authentication remains in the existing route layouts. */
export function AppRoot({ children }: { children: ReactNode }) {
  return <body className="flowkey-app">{children}</body>;
}
