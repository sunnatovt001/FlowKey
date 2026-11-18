"use client";

import { useEffect } from "react";

/** Logic Coin's wheel easing, limited to the public landing page. */
export function LandingMotion() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let target = scrollY;
    let previousTime = 0;
    const clamp = (value: number) => Math.max(0, Math.min(
      Math.max(0, document.documentElement.scrollHeight - innerHeight), value,
    ));
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      target = scrollY;
    }
    function tick(time: number) {
      target = clamp(target);
      const dt = previousTime ? Math.min(40, time - previousTime) : 16.67;
      previousTime = time;
      const distance = target - scrollY;
      if (Math.abs(distance) < 3) {
        window.scrollTo({ top: target, behavior: "instant" });
        frame = 0;
        previousTime = 0;
        return;
      }
      window.scrollTo({ top: scrollY + distance * (1 - Math.exp(-dt / 85)), behavior: "instant" });
      frame = requestAnimationFrame(tick);
    }
    function moveTo(value: number) {
      target = clamp(value);
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function nativeScroll(element: EventTarget | null, delta: number) {
      if (document.querySelector("dialog[open]") || getComputedStyle(document.body).overflow === "hidden") return true;
      for (let el = element instanceof Element ? element : null; el && el !== document.body; el = el.parentElement) {
        if (el.matches("input,textarea,select,[contenteditable]:not([contenteditable=false])")) return true;
        if (/auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if ((delta < 0 && el.scrollTop > 0) || (delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
        }
      }
      return false;
    }
    function wheel(event: WheelEvent) {
      if (event.defaultPrevented || reduced.matches || !fine.matches || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) { stop(); return; }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (!delta || nativeScroll(event.target, delta)) { stop(); return; }
      if (!event.cancelable) return;
      event.preventDefault();
      if (!frame) target = scrollY;
      moveTo(target + delta);
    }
    function anchor(event: MouseEvent) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || reduced.matches || !fine.matches) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.download || (link.target && link.target !== "_self") || link.closest("dialog")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let id: string;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
      const destination = document.getElementById(id);
      if (!destination) return;
      event.preventDefault();
      const offset = innerWidth <= 760 ? 80 : 96;
      history.pushState(history.state, "", url.hash);
      moveTo(destination.getBoundingClientRect().top + scrollY - offset - 12);
      const oldTabindex = destination.getAttribute("tabindex");
      if (oldTabindex === null) {
        destination.setAttribute("tabindex", "-1");
        destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
      }
      destination.focus({ preventScroll: true });
    }
    function keyboard(event: KeyboardEvent) {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) stop();
    }
    window.addEventListener("wheel", wheel, { passive: false });
    document.addEventListener("click", anchor, true);
    window.addEventListener("keydown", keyboard);
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("resize", stop);
    window.addEventListener("hashchange", stop);
    window.addEventListener("popstate", stop);
    window.addEventListener("pagehide", stop);
    reduced.addEventListener("change", stop);
    fine.addEventListener("change", stop);
    return () => {
      stop();
      window.removeEventListener("wheel", wheel);
      document.removeEventListener("click", anchor, true);
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("resize", stop);
      window.removeEventListener("hashchange", stop);
      window.removeEventListener("popstate", stop);
      window.removeEventListener("pagehide", stop);
      reduced.removeEventListener("change", stop);
      fine.removeEventListener("change", stop);
    };
  }, []);
  return null;
}
