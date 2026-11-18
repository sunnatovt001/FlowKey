# FlowKey design system

## Current authority — website launch, 14 November 2026

This section and `docs/website-launch/day-1.json` resolve conflicting historical guidance below. The current five-day scope is the existing website only: public pages, access/setup, workspace, checkout and admin. Telegram Mini App, new bank integrations, wallet, catalog and native apps are outside this release. Existing Telegram support may remain, but is not a new product deliverable.

- Identity: retain the approved FlowKey logo and Nunito family, deep purple ink #2a1048, purple #6320d9 selection/links, orange #ff890a primary actions with dark text, white cards, #faf6fd supporting surfaces and #e8dcf2 borders. Status must have text as well as color. Gradients are confined to the approved brand surfaces; no new decoration on operational screens.
- Type: body 15–16px; labels, inputs and tables 14–16px; secondary text at least 13px. Phone inputs use 16px to avoid focus zoom. Workspace H1 30px desktop / 27px phone, H2 20–22px; metric labels remain 14px rather than inheriting section-heading size. Public headline keeps its existing responsive scale. Amounts use tabular numerals and UZS; user-facing dates use Asia/Tashkent. Code/IDs alone use monospace.
- Geometry: 4px spacing base, 8/12/16/24/32/48 scale. Workspace max width 1400–1480px, desktop sidebar 244px, desktop gutters 32–38px, phone gutters 16–20px. White panels use 18–22px corners; controls 12–14px. Interactive controls and icon buttons have at least 44px targets; primary actions normally 46–48px tall.
- Behavior: one primary action per task; consistent default/hover/focus/loading/disabled/success/error states. Keep form drafts on validation/network failures, block duplicate submits, announce results, and give a useful next action in empty states. Destructive actions require explicit contextual confirmation. An unknown payment result never becomes success or an invitation to pay again.
- Navigation: use the existing sidebar names. On phones/tablets use a labeled menu button and dismissible drawer, not a sideways row of hidden destinations. Keep project context on navigation and permissions enforced on the server. Profile remains avatar-only; first-run teaching appears once per account. The AI launcher is circular, icon-only and fixed bottom-right, as explicitly requested; it is absent on checkout/pay pages and returns focus after closing.
- Responsive contract: verify 1440×900, 768×1024 and 390×844. No viewport overflow, clipped dialogs, unreachable actions or lost labels. Payment history uses cards on narrow screens with amount, status, date and details; other complex tables may scroll within a labeled container. Long names/IDs must not widen the viewport.
- Accessibility/motion: body/control text contrast target 4.5:1; large text 3:1; visible focus, keyboard menus/tabs/dialogs, associated input labels and inline errors. Motion conveys state, normally 150–200ms, and respects reduced motion. These are acceptance targets, not a claim of completed accessibility certification.
- Release truth: current payments are simulated. Keep contextual notices accurate. Do not collect real card credentials, show invented partner claims or present unfinished provider features as available. Design completion does not enable real-money settlement.

Shared implementation owners: `styles/brand-system.css` (identity), `styles/usability.css` (interaction/responsive refinements), page CSS (composition), `components/ui.tsx` (shared primitives). Do not add another broad override layer to resolve drift. First compare current deployed source and local source; preserve deployed assets and protection rules before consolidating.

Historical blue palette, system-font, horizontal-phone-navigation, browser-only tour storage and persistent tour-reopen instructions below are reference history, not current requirements. The circular AI chat launcher is distinct from the once-only welcome tour.

## Dashboard — approved layout

Use the approved pale lavender Dashboard mockup: four white metric cards, a wider activity chart beside API/webhook status, then recent transactions beside quick actions. The toolbar offers 7/30/90 days and refresh. Volume means successful UZS payments; count means all transaction statuses. Both obey Tashkent calendar boundaries. Connection health is based on stored key/delivery metadata, not a fabricated live check. Values come from authorized project records; empty accounts show zero and honest empty states. Retain the shared sidebar, avatar-only header, focus controls and reduced-motion behavior. Stack the main grid on tablet/mobile and keep wide transaction tables inside their own horizontal scroller.

The public landing describes the working project/API workflow. Do not show fabricated receipts, balances, transaction counts, proposed prices or promised launch dates. Workspace metrics come from the authenticated account's database records. Keep the environment status truthful while real money processing is not connected; documentation examples remain clearly identified as API examples.

## In-page assistant
The bottom-right assistant uses a compact non-modal chat panel and the existing purple controls. It keeps conversations in memory, offers short guide suggestions, distinguishes guide answers from live AI, supports keyboard dismissal and reduced motion, and hides on public checkout/payment pages. Account questions use the signed-in owner's existing read-only support context; no secrets enter the chat.

## Integrated reference — 1 November 2026

The visual reference is the repository's `sites-design` branch. The production application keeps its Next.js/PostgreSQL authentication, payment simulation, project permissions and worker. Its presentation uses the reference's purple (#6320d9 / #6b28df), orange (#ff790a), pale violet surfaces, rounded 12px controls and 18px cards. The shared CSS layers are base, theme, landing, workspace and application adaptations.

The public landing uses the reference's split hero, purple/orange brand mark and payment preview. Operational screens use readable 14px labels and tables, visible focus, 44px controls and responsive single-column layouts below 800px. Purple/orange gradients are inherited from the supplied reference. Reduced motion disables animation and transitions.

Keep copy short. The profile trigger shows only the avatar. The project selector includes “+ Yangi loyiha”. The sidebar has no caption or Unit information card. The welcome guide appears once per account across browsers and devices, using an atomic database claim. Existing accounts do not repeat the tour. It has no persistent help trigger. These decisions supersede the older visual and tutorial rules below.

FlowKey is a developer payment sandbox for Uzbekistan. Its interface must distinguish test activity from live processing at every payment surface. No invented adoption figures or partner claims.

Typography: system sans (Inter-compatible), navy #14243b, body 15–17px with 1.6 line height. Public headline 64px desktop / 36px phone, tight tracking. Application headings 28px. Monospace only for code and secrets. Tabular numbers for amounts.

Palette: white ground, #f6f8fc supporting surfaces, #e4eaf2 borders, #245eea action blue, #52647a secondary text. Status green #167449, amber #8b6200, red #b42338 with pale supporting fills. Color is always accompanied by text.

Spacing: 4px base, 8/12/16/24/32/48/80 scale. Public content max 1180px, quiet instrument introduction offset from the left edge. Product max 1400px; 232px desktop sidebar, collapsing to horizontal navigation on small screens. 24px desktop / 16px phone gutters.

Components: 10px card corners, 8px inputs, 44px minimum controls, thin borders within actual application interfaces. Flat blue primary buttons, white secondary buttons. Explicit hover, focus-visible, disabled and loading states. Dialogs carry a close button and keyboard dismissal. Tables scroll inside their container. Empty states explain the next useful action.

Motion: restrained 160ms opacity and 180ms translation entrance. Reduced motion disables transforms and transitions. No scroll hijacking, 3D, glow or decorative gradients.

Responsive: 1440 desktop, 768 tablet and 390 phone; columns collapse, primary actions remain reachable, long IDs wrap, no viewport overflow. Public landing uses the quiet-instrument direction (seed 1485924395), adapted to the user's requested rounded application preview and thin application borders. Idea: Uzbekistan's sandbox payment receipt becomes an inspectable demonstration. Live interaction: change a sample outcome in the preview; explicitly illustrative, never persisted or presented as a real payment.

## Unit onboarding and integration
The interface uses Uzbek throughout. Product setup asks only for product name and type (Startup, Online platform, Company, Individual) and then opens the account. Projects are created within the account, with name and optional URL; no description or country controls. A project creates its first API key atomically and displays the secret once. Never include secrets in AI prompts. Integration progressively reveals API key, Bearer token, hosted link, script or button instructions. The first-visit guide is optional, stores progress per account in browser storage, and can be reopened from Help. Public payment pages may be embedded; private account screens retain frame protection.

## Approved guide hub
The Guide uses the incumbent purple workspace palette. Start with three action steps and six concise topic cards; search spans all topics and Uzbek apostrophe variants. Technical examples appear only after selecting a topic, retaining legacy hashes. Group additional references in native disclosure controls. Use three columns on desktop, two on tablet and one on phones, with contained code/table scrolling and 44px controls. The help action opens the existing AI chat. Keep the real-money connection notice accurate.

## Finance workspace
Match the approved finance mockup: a single four-column balance panel, concise environment notice, action toolbar, tabbed payout/refund history with payout status filter, and collapsed journal. Reveal transaction forms inline only on request; preserve existing role restrictions, idempotency and accounting. Use deterministic monetary/date strings across server and browser. Stack balances to two columns and controls vertically on phones. Display actual project records only.

## First project setup
After product questions, route accounts without a project to /projects/new. This dedicated setup page has a logo/avatar header, two-step progress indicator, centered project-name and optional-URL form, and no workspace sidebar or account/password settings. Back returns to editable product answers. Creation preserves the atomic project/key API and displays its secret only in component memory, with safe GPT/Claude instructions and links to integration and Dashboard. Keep the approved pale lavender/white/purple composition and stack naturally on phones.
Both onboarding steps share SetupProgress: product is step 1, project is step 2; completed product shows a check, the current step uses aria-current, and the upcoming step is muted.
Product and project setup now share SetupWizard on the same URL: change steps with client state only, preserve both forms while switching, and use the project-setup header, surface and form styling for both steps.
Welcome tour eligibility is authoritative per database account. Browser storage from an older account with the same email cannot suppress the new account tour; concurrent first claims remain atomic.

## Account settings
Use five client-side tabs: Profil, Mahsulot, Loyihalar, Xavfsizlik and Telegram. Show only the selected panel while preserving mounted forms and drafts. Profile combines avatar and name/email; account metadata is collapsed. Keep project creation/edit/archive, password/session and Telegram/support functions in their matching panels. Preserve create-project hash links, keyboard tab navigation, visible focus and wrapping controls on mobile. No duplicate account summary below the hub.

## Activity journal and navigation
The project-owner activity journal uses a searchable, date-grouped event list with category and period filters, progressive details and 20-row expansion. Show the latest 200 authorized audit records and explicitly scope filters to that window. Use Uzbek action labels, retain technical IDs inside disclosures and honest empty states. Menu labels: Dashboard, To‘lovlar, Integratsiya, Mablag‘lar, Obunalar, Jamoa, Hodisalar, Qo‘llanma, Sozlamalar. Use semantic Lucide icons and preserve permissions, routes, project selection and mobile drawer.

## Admin workspace
Use the approved admin mockup: persistent white left navigation, compact breadcrumb/session header, one four-part summary strip and a support-ticket queue beside quick management links. Counts and tickets come from existing authorized admin queries; search by email or ticket ID and status/pagination are server-backed. Default to new tickets, allow all/in-progress/resolved states and preserve the separate 15-minute admin session. Reuse the frame for all admin pages. Stack summary and side actions on phones, contain tables in horizontal scrollers and retain accessible links, focus and short Uzbek copy.

## Shared landing brand adaptation
All operational, authentication, setup, public payment and admin surfaces inherit the approved landing identity through brand-system.css. Use pale peach/lavender ambient canvases, white rounded cards, deep purple text, purple navigation/selection and orange primary actions with dark purple accessible text. Keep existing page hierarchy, permissions and payment behavior. Do not add decorative 3D scenes to task pages or imitate real card collection. Preserve clear test-mode notices, semantic error/success colors, reduced motion and contained responsive tables. The production public landing stays intact; retain its existing global style imports.

## Guided integration hub
Match the approved three-method mockup: API orqali, Tayyor sahifa and Saytga joylash, with API selected immediately. API flow has key, connection and testing stages; Bearer token is explained within API. Keep real key creation/revocation, webhook editing/rotation/retry and simulated payments. Show actual stored key/webhook counts and recorded API usage without claiming end-to-end connection success. AI copy actions contain server-env placeholders only, never secrets. Hosted and embedded flows preserve payment-link creation, disabling, script/button output and safe prompts. Retain existing tab/hash deep links, per-project authorization and mobile contained tables.

## Central testing workspace
All simulated payment creation, hosted checkout experimentation, webhook delivery/retry, financial rehearsal and subscription mutations live at /testing (Sinov markazi). Integration keeps keys, endpoint configuration and link/embed setup; finance and subscriptions keep read-only history. Filter testing sections on the server by the existing project role: technical tools for owner/developer, financial tools for owner/accountant. Do not grant new capabilities or expose keys to accountants. Preserve legacy sandbox links with redirects, actual stored results and clear Unit-mode notices. Test tabs switch without document reload and retain result state. Existing private cache/frame protection also covers /testing.

## Shared usability refinements
Keep the approved brand and page structure. Workspace assistance uses a circular icon-only launcher fixed to the bottom-right, with safe-area spacing on phones; closing the chat restores focus to the launcher. On phones, payment history uses cards showing amount, status, project and local date, with the same details dialog as desktop. Desktop retains its semantic table. Table text is 14px, secondary operational copy at least 13px, and row actions have 44px touch targets. Authentication uses a compact logo header on phones. Subscription empty states include a direct testing-center action. Use distinct semantic icons in testing tabs and consistent To‘lovlar/Sozlamalar page names. Keep contextual Unit-mode warnings; omit repeated workspace footer notices.


## Payments history — 15 November 2026

Operate mode. Preserve the FlowKey shell and identity. Use a compact, unboxed period summary above one white ledger, a clearly labeled search field, date presets/custom range, and status filter buttons with counts. Filters apply automatically (search debounced 300ms); retain input focus, project context, browser navigation and the shell. Status/date choices update immediately without a document reload. Counts and successful-payment volume use the current project/search/date scope and ignore the selected status, so switching status does not change its context. The list and pagination obey all filters. No invented customers, records, business metrics or real-settlement claims. Desktop rows prioritize amount/status/date; shorten IDs with explicit details, and retain full IDs/copying in the detail dialog. Use mobile payment rows below 800px. Dates are Tashkent-local by default; raw UTC/minor units are behind a technical disclosure. Errors, empty states, pending feedback, keyboard focus and reduced motion are required. Page-specific rules live in styles/payments.css.


## Testing center — approved mockup, 15 November 2026

Match the selected three-column design: existing global sidebar, then a white test-type rail, a configuration panel and human-readable result panel. Retain Nunito, plum ink, purple selections, orange action with dark text and restrained rounded white surfaces. Short explanatory sublines clarify the five existing test types. Below 1000px the test rail becomes a visible grid above the work area; below 600px configuration and results stack, without hidden horizontal choices. Payment amount defaults to 49 000 UZS with three presets, and outcomes are native radio choices. Initial result state must be honest readiness, not fabricated success; show successful/failed/pending only from a validated test API response. JSON is behind a native disclosure. Preserve server role checks and in-page tab navigation. Ambiguous network/server replies lock the amount/outcome and retry the identical body and idempotency key. Real money is never claimed or collected.


## Telegram Mini App — 18 November 2026
New user-authorized scope: /miniapp extends the existing platform as FlowKey Business. Preserve the website. Operate mode: mobile-first 520px canvas, FlowKey wordmark, plum Nunito text, restrained peach/lavender backdrop, a purple volume panel and orange actions. Four labeled bottom destinations: Asosiy, To‘lovlar, Loyihalar, Profil. Respect safe areas, dark Telegram themes, reduced motion and 44px controls. Real authorized project metrics only; volume is successful simulated payments, never available funds. Empty, unlinked, expired, error and loading states must explain the next action. No card collection, wallet or real settlement. Telegram initData is server verified with age/signature checks; only the linked support-bot identity can read its projects. Browser access uses existing verified sessions.

## In-page assistant
The bottom-right assistant uses a compact non-modal chat panel and the existing purple controls. It keeps conversations in memory, offers short guide suggestions, distinguishes guide answers from live AI, supports keyboard dismissal and reduced motion, and hides on public checkout/payment pages. Account questions use the signed-in owner's existing read-only support context; no secrets enter the chat.


## Integrated reference — 1 November 2026

The visual reference is the repository's `sites-design` branch. The production application keeps its Next.js/PostgreSQL authentication, payment simulation, project permissions and worker. Its presentation uses the reference's purple (#6320d9 / #6b28df), orange (#ff790a), pale violet surfaces, rounded 12px controls and 18px cards. The shared CSS layers are base, theme, landing, workspace and application adaptations.

The public landing uses the reference's split hero, purple/orange brand mark and payment preview. Operational screens use readable 14px labels and tables, visible focus, 44px controls and responsive single-column layouts below 800px. Purple/orange gradients are inherited from the supplied reference. Reduced motion disables animation and transitions.

Keep copy short. The profile trigger shows only the avatar. The project selector includes “+ Yangi loyiha”. The sidebar has no caption or Unit information card. The welcome guide appears once per account in the current browser, without a persistent help trigger. These decisions supersede the older visual and tutorial rules below.

FlowKey is a developer payment sandbox for Uzbekistan. Its interface must distinguish test activity from live processing at every payment surface. No invented adoption figures or partner claims.

Typography: system sans (Inter-compatible), navy #14243b, body 15–17px with 1.6 line height. Public headline 64px desktop / 36px phone, tight tracking. Application headings 28px. Monospace only for code and secrets. Tabular numbers for amounts.

Palette: white ground, #f6f8fc supporting surfaces, #e4eaf2 borders, #245eea action blue, #52647a secondary text. Status green #167449, amber #8b6200, red #b42338 with pale supporting fills. Color is always accompanied by text.

Spacing: 4px base, 8/12/16/24/32/48/80 scale. Public content max 1180px, quiet instrument introduction offset from the left edge. Product max 1400px; 232px desktop sidebar, collapsing to horizontal navigation on small screens. 24px desktop / 16px phone gutters.

Components: 10px card corners, 8px inputs, 44px minimum controls, thin borders within actual application interfaces. Flat blue primary buttons, white secondary buttons. Explicit hover, focus-visible, disabled and loading states. Dialogs carry a close button and keyboard dismissal. Tables scroll inside their container. Empty states explain the next useful action.

Motion: restrained 160ms opacity and 180ms translation entrance. Reduced motion disables transforms and transitions. No scroll hijacking, 3D, glow or decorative gradients.

Responsive: 1440 desktop, 768 tablet and 390 phone; columns collapse, primary actions remain reachable, long IDs wrap, no viewport overflow. Public landing uses the quiet-instrument direction (seed 1485924395), adapted to the user's requested rounded application preview and thin application borders. Idea: Uzbekistan's sandbox payment receipt becomes an inspectable demonstration. Live interaction: change a sample outcome in the preview; explicitly illustrative, never persisted or presented as a real payment.


## Unit onboarding and integration
The interface uses Uzbek throughout. Product setup asks only for product name and type (Startup, Online platform, Company, Individual) and then opens the account. Projects are created within the account, with name and optional URL; no description or country controls. A project creates its first API key atomically and displays the secret once. Never include secrets in AI prompts. Integration progressively reveals API key, Bearer token, hosted link, script or button instructions. The first-visit guide is optional, stores progress per account in browser storage, and can be reopened from Help. Public payment pages may be embedded; private account screens retain frame protection.


## Account settings
Use five client-side tabs: Profil, Mahsulot, Loyihalar, Xavfsizlik and Telegram. Show only the selected panel while preserving mounted forms and drafts. Profile combines avatar and name/email; account metadata is collapsed. Keep project creation/edit/archive, password/session and Telegram/support functions in their matching panels. Preserve create-project hash links, keyboard tab navigation, visible focus and wrapping controls on mobile. No duplicate account summary below the hub.


## Activity journal and navigation
The project-owner activity journal uses a searchable, date-grouped event list with category and period filters, progressive details and 20-row expansion. Show the latest 200 authorized audit records and explicitly scope filters to that window. Use Uzbek action labels, retain technical IDs inside disclosures and honest empty states. Menu labels: Dashboard, To‘lovlar, Integratsiya, Mablag‘lar, Obunalar, Jamoa, Hodisalar, Qo‘llanma, Sozlamalar. Use semantic Lucide icons and preserve permissions, routes, project selection and mobile drawer.


## Admin workspace
Use the approved admin mockup: persistent white left navigation, compact breadcrumb/session header, one four-part summary strip and a support-ticket queue beside quick management links. Counts and tickets come from existing authorized admin queries; search by email or ticket ID and status/pagination are server-backed. Default to new tickets, allow all/in-progress/resolved states and preserve the separate 15-minute admin session. Reuse the frame for all admin pages. Stack summary and side actions on phones, contain tables in horizontal scrollers and retain accessible links, focus and short Uzbek copy.


## Shared landing brand adaptation
All operational, authentication, setup, public payment and admin surfaces inherit the approved landing identity through brand-system.css. Use pale peach/lavender ambient canvases, white rounded cards, deep purple text, purple navigation/selection and orange primary actions with dark purple accessible text. Keep existing page hierarchy, permissions and payment behavior. Do not add decorative 3D scenes to task pages or imitate real card collection. Preserve clear test-mode notices, semantic error/success colors, reduced motion and contained responsive tables. The production public landing stays intact; retain its existing global style imports.


## Guided integration hub
Match the approved three-method mockup: API orqali, Tayyor sahifa and Saytga joylash, with API selected immediately. API flow has key, connection and testing stages; Bearer token is explained within API. Keep real key creation/revocation, webhook editing/rotation/retry and simulated payments. Show actual stored key/webhook counts and recorded API usage without claiming end-to-end connection success. AI copy actions contain server-env placeholders only, never secrets. Hosted and embedded flows preserve payment-link creation, disabling, script/button output and safe prompts. Retain existing tab/hash deep links, per-project authorization and mobile contained tables.


## Central testing workspace
All simulated payment creation, hosted checkout experimentation, webhook delivery/retry, financial rehearsal and subscription mutations live at /testing (Sinov markazi). Integration keeps keys, endpoint configuration and link/embed setup; finance and subscriptions keep read-only history. Filter testing sections on the server by the existing project role: technical tools for owner/developer, financial tools for owner/accountant. Do not grant new capabilities or expose keys to accountants. Preserve legacy sandbox links with redirects, actual stored results and clear Unit-mode notices. Test tabs switch without document reload and retain result state. Existing private cache/frame protection also covers /testing.
