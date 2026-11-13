# Authentication screens design QA

final result: passed

Source: user-supplied Edmission screenshots and the public deployed Edmission login,
captured as output/auth-redesign/reference-edmission.png.
Implementation: output/auth-redesign/login-uz-final.png,
output/auth-redesign/login-desktop.png and output/auth-redesign/signup-mobile.png.
Combined comparison: output/auth-redesign/comparison-final.png.
Desktop viewport: 1536 × 930 CSS pixels, deviceScaleFactor 1; both captures 1536 × 930 pixels.
Mobile viewport: 390 × 844 CSS pixels, deviceScaleFactor 1.
State: anonymous sign in / sign up. Final desktop comparison uses Uzbek on both sides.

## Comparison history

1. Initial implementation had an unnecessarily tall card and heavier placeholder text (P2).
   Evidence: output/auth-redesign/comparison.png. Reduced header/logo size, matched
   24px card padding, set normal input weight, combined recovery and account links.
2. Re-captured the same viewport: output/auth-redesign/comparison-final.png.
   Card width is 448px, the same left alignment and background photo are retained.
   No remaining actionable P0/P1/P2 mismatch. The support launcher was reduced to its
   existing icon on these screens to avoid obscuring the footer on mobile.

## Fidelity surfaces

- Typography: system UI form face, 20px title, 14px desktop fields, 16px mobile inputs.
  Normal placeholder weight restored. FlowKey wording and translations replace Edmission copy.
- Layout: reference background/crop, left desktop card, upper-right language menu;
  centered mobile card with no horizontal overflow. Focused form controls, password eye,
  link row and social icon row reviewed in the combined comparison.
- Colors: intentional FlowKey purple buttons and logo replace Edmission green branding.
- Assets: exact public Edmission background photo reused; supplied FlowKey raster logo retained.
- Content: email/password authentication remains email-only, as implemented by FlowKey;
  phone authentication is not claimed. Google, GitHub and Telegram remain supported.

## Interactions and checks

Browser checks passed for login and signup, English/Russian/Uzbek labels, saved language,
password visibility, password recovery, social actions and 390px mobile overflow.
No page JavaScript errors during the UI checks.
Google Identity initialization/prompt and callback were exercised with a mocked SDK;
invalid credentials, foreign origins and external redirects were rejected by real Better Auth tests.
The actual personalized Google prompt is controlled by Google's account/browser eligibility;
no personal Google session was used or simulated in the screenshots. Google Cloud must list
https://flowkey.uz as an authorized JavaScript origin for the existing client.

## Implementation checklist

- [x] Shared login/signup scene and compact form.
- [x] Languages, password visibility, recovery and provider actions.
- [x] Google One Tap with server token verification and scoped CSP.
- [x] Desktop/mobile browser captures and post-fix comparison.

After preserving the already deployed workspace updates, the auth UI browser checks,
typecheck, lint and unit suite were rerun successfully; auth-specific styles load last.
