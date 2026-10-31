import type { ComponentProps } from "react";
import type NextLink from "next/link";

// Native document navigation keeps Sites authentication and server redirects
// outside Vinext's client RSC error boundary.
export default function SiteLink({ href, prefetch: _prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, locale: _locale, as: _as, onNavigate: _onNavigate, ...props }: ComponentProps<typeof NextLink>) {
  const destination = typeof href === "string" ? href : `${href.pathname ?? ""}${href.query ? "?" + new URLSearchParams(Object.entries(href.query).filter(([,value]) => value != null).map(([key,value]) => [key, String(value)])) : ""}${href.hash ?? ""}`;
  return <a {...props} href={destination} />;
}
