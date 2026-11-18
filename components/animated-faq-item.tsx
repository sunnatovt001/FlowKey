"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";

export function AnimatedFaqItem({ question, children }: { question: ReactNode; children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const expanded = useRef(false);

  useEffect(() => () => animation.current?.cancel(), []);

  function toggle(event: MouseEvent<HTMLElement>) {
    const element = details.current;
    if (!element) return;
    event.preventDefault();
    const opening = animation.current ? !expanded.current : !element.open;
    expanded.current = opening;
    const from = element.getBoundingClientRect().height;
    animation.current?.cancel();
    animation.current = null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !element.animate) {
      element.open = opening;
      delete element.dataset.expanded;
      element.style.overflow = "";
      return;
    }
    // Measure natural heights; return to auto afterwards for language/width changes.
    element.open = opening;
    const to = element.getBoundingClientRect().height;
    element.open = true;
    element.dataset.expanded = String(opening);
    element.style.overflow = "hidden";
    const current = element.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: 320, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" },
    );
    animation.current = current;
    current.onfinish = () => {
      element.open = opening;
      current.cancel();
      animation.current = null;
      element.style.overflow = "";
      delete element.dataset.expanded;
    };
  }

  return (
    <details ref={details} className="animated-faq-item">
      <summary onClick={toggle}>{question}</summary>
      <div className="faq-answer">{children}</div>
    </details>
  );
}
