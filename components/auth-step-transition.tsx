"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
/** Edmission's wait-for-exit transition and exact timing/easing. */
export function AuthStepTransition({ stepKey, children }: { stepKey: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  return <AnimatePresence mode="wait"><motion.div key={stepKey} className="auth-step-shell"
    initial={reduced ? false : { opacity: 0, x: 20, scale: .985 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={reduced ? { opacity: 1 } : { opacity: 0, x: -20, scale: .985 }}
    transition={{ duration: reduced ? 0 : .32, ease: [.22, 1, .36, 1] }}
  >{children}</motion.div></AnimatePresence>;
}
