# Authentication flow revision QA

final result: passed

Target: latest user request: Logic Coin-style Telegram handoff/return, Edmission's
actual exit-before-entry animation, national language flags, separate recovery
screens and a fully sharp background without a tint/blur layer.

Visual evidence: output/auth-flow/telegram-desktop.png (1440 × 900 CSS/pixels, DPR 1),
output/auth-flow/reset-mobile.png (390 × 844 CSS/pixels, DPR 1).
Background reference: generated_images/exec-2b12a495-97f1-4a7e-b343-f51a953bc5d4.png.
The generated photograph and both rendered pages were visually inspected. No new
pixel-exact mockup was supplied; the existing right-side FlowKey layout is preserved.

- Typography/layout: existing form rhythm retained; standalone forgot/reset/verify
  and Telegram screens share the same card and language control. No mobile overflow.
- Colors/assets: opaque white form; original flag SVGs (UZ, RU, US) in trigger and menu.
  Photograph has detailed right-side architecture, no baked blur and no CSS overlay.
- Motion: Edmission AuthStepTransition source inspected on server. AnimatePresence
  mode=wait and matching x/scale/easing/duration copied using framer-motion; initial
  entry is enabled as requested. Reduced-motion preference remains respected.
- Copy/behavior: full Telegram waiting screen, code check, re-open link, retry and
  expiry states. Bot return uses a short-lived one-use fragment credential; original
  browser remains independently bound to its HttpOnly proof.

Browser checks passed: flags/selection, no overlay, standalone recovery request,
old reset-link redirect, Telegram automatic launch, transient network retry, reload
persistence, original-browser completion, return-link fragment clearing, and a single
resume callback under React Strict Mode. No page JavaScript errors.

Database integration passed: browser binding, foreign origin/webhook/sender rejection,
expiry, replay prevention, duplicate bot callback prevention, return-link completion,
original-browser completion, and concurrent first sign-ins mapping to one account.
No actionable P0/P1/P2 findings remain.
