# FlowKey authentication revision QA

final result: passed

Target: user's revision of the Edmission-inspired layout: right-side card, left-side
language selector, FlowKey-specific generated photograph, authentic provider marks,
and animation on opening and switching login/signup. Previous literal Edmission
background and left alignment are intentionally superseded.

Source asset: /workspace/generated_images/exec-c666fee4-baff-41e6-a08f-bb14ba7690e8.png.
Shipped asset: public/auth-flowkey.webp (122 KiB; original generation retained).
Desktop evidence: output/auth-redesign/refresh-login-desktop.png (1536 × 930 CSS/pixels, DPR 1).
Mobile evidence: output/auth-redesign/refresh-signup-mobile.png (390 × 844 CSS/pixels, DPR 1).
Both rendered screenshots were visually inspected alongside the generated photograph;
no density scaling was used. There is no new pixel-exact mockup for the requested revision.

- Layout: desktop card lies entirely in the right half; language control is on the left.
  Mobile card remains centered, with no horizontal overflow; language remains top-left.
- Typography and spacing: existing form typography and layout retained, all four provider
  buttons use equal 46px circles and 22px marks. Measured center offsets below 1px.
- Colors: GitHub #181717, Telegram #26A5E4, OpenAI #000000, Google multicolor mark;
  FlowKey purple retained for application controls.
- Assets: custom generated fintech studio background replaces the unrelated campus photo.
  Original Simple Icons brand paths are used, with source provenance in public/brands/README.md.
- Content: ChatGPT mark opens an explicit unavailable notice; no working OAuth or submitted
  access request is falsely claimed. Google/GitHub/Telegram authentication remains unchanged.
- Motion: keyed card remounts on login/signup navigation. 520ms entry plus gentle content
  staging confirmed by browser; reduced-motion preference suppresses animation.

Checks passed: desktop/mobile layout, brand icon centers, route-switch remount/animation,
ChatGPT notice, language placement, reduced motion; no page JavaScript errors.
No actionable P0/P1/P2 findings remain.

External limitation: no connected browser-control tool or official OpenAI application
recipient is available in this chat. ChatGPT OAuth access is not registered; the prior
request draft is still unsubmitted. Do not turn that placeholder into a fake sign-in.
