# FLOWZA design system

FLOWZA is a developer payment sandbox for Uzbekistan. Its interface must distinguish test activity from live processing at every payment surface. No invented adoption figures or partner claims.

Typography: system sans (Inter-compatible), navy #14243b, body 15–17px with 1.6 line height. Public headline 64px desktop / 36px phone, tight tracking. Application headings 28px. Monospace only for code and secrets. Tabular numbers for amounts.

Palette: white ground, #f6f8fc supporting surfaces, #e4eaf2 borders, #245eea action blue, #52647a secondary text. Status green #167449, amber #8b6200, red #b42338 with pale supporting fills. Color is always accompanied by text.

Spacing: 4px base, 8/12/16/24/32/48/80 scale. Public content max 1180px, quiet instrument introduction offset from the left edge. Product max 1400px; 232px desktop sidebar, collapsing to horizontal navigation on small screens. 24px desktop / 16px phone gutters.

Components: 10px card corners, 8px inputs, 44px minimum controls, thin borders within actual application interfaces. Flat blue primary buttons, white secondary buttons. Explicit hover, focus-visible, disabled and loading states. Dialogs carry a close button and keyboard dismissal. Tables scroll inside their container. Empty states explain the next useful action.

Motion: restrained 160ms opacity and 180ms translation entrance. Reduced motion disables transforms and transitions. No scroll hijacking, 3D, glow or decorative gradients.

Responsive: 1440 desktop, 768 tablet and 390 phone; columns collapse, primary actions remain reachable, long IDs wrap, no viewport overflow. Public landing uses the quiet-instrument direction (seed 1485924395), adapted to the user's requested rounded application preview and thin application borders. Idea: Uzbekistan's sandbox payment receipt becomes an inspectable demonstration. Live interaction: change a sample outcome in the preview; explicitly illustrative, never persisted or presented as a real payment.
