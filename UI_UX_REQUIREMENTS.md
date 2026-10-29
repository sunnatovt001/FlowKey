# UI/UX implementation and handoff

Preserve DESIGN.md and the incumbent light fintech identity. Current UI is functional reference styling, not a claim of final designer approval. Final Figma implementation remains a separate visual handoff gate.

Design order: journey/wireframes → tokens/shared primitives → auth/recovery → onboarding → dashboard/projects → developers → transactions → docs/settings → landing polish.

Tokens: semantic background/surface/border/text/action/status, typography/monospace, 4px spacing, radii, controls and motion. Share buttons, forms, badges, tabs, dialogs, tables, pagination, empty/loading/error states, code/copy, secret notices and stepper across pages.

Handoff must include 1440 desktop, 768 tablet and 390 mobile; default/hover/focus/disabled/loading; validation/server errors/success; long values; keyboard/focus rules; responsive navigation/table behavior; reduced motion and secret disclosure states. Status never relies on color alone. Controls target 44px, contrast is reviewed, code scroll stays inside its container.

Designer versions approved components/flows. Developer A reviews feasibility before implementation. Screenshot comparison and interaction tests accompany each feature. Backend contract work can proceed before final visuals; UI is not repeatedly redesigned from scratch.
