# FlowKey frontend

`app/`: Next.js route entries, metadata and root layout. Keep route names and dynamic configuration stable.

`src/features/`: page implementations grouped by product area; landing sections have individual files.

`src/components/common/`: shared logo, navigation, status and empty-state components.

`src/components/layout/`: shared workspace sidebar and public footer.

`src/components/`: stateful product controls. Existing callbacks, API payloads and permission behavior are preserved. `ui.tsx` is a compatibility export surface.

`src/styles/`: base layout, theme tokens, landing and workspace presentation.

`server/`, `db/`, `prisma/`, `drizzle/`, `app/api/`, `worker/`: existing runtime and business logic, unchanged by the design refactor.

Sites source is mirrored to the GitHub `sites-design` branch. This is a Cloudflare/D1 adaptation; do not replace the separate Next/PostgreSQL application in `main`. A GitHub push alone does not publish Sites.
