import Link from "next/link";
import type { ComponentProps } from "react";

// Vinext's production prefetch loader currently loses namespace exports.
// Navigation still uses RSC; only speculative prefetch is disabled.
export default function SiteLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} />;
}
