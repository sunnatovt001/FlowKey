# FlowKey design system

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
