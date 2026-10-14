# Bengaluru mobile PageSpeed remediation

Source: https://pagespeed.web.dev/analysis/https-pm-physique57india-com-bengaluru/petjuryz1i?form_factor=mobile

The supplied mobile report recorded performance 65, accessibility 85, best practices 73 and SEO 100. It recorded 760 ms TBT and approximately 4,428 KiB transferred.

Implemented:
- Convert 11 landing-page JPEGs to appropriately sized WebP assets (4.9 MB to 306 KB).
- Load gallery photos only when visible; pause gallery rotation outside the viewport and honor reduced motion.
- Lazy-load feature and instructor backgrounds while retaining existing collage crops.
- Replace the oversized PNG logo with a small WebP; declare logo dimensions.
- Serve fonts locally with swap, preload the principal fonts and Bengaluru hero image, and configure font/logo cache headers.
- Trim tracker IDs, fixing the deployed GTM newline syntax error.
- Initialize Google/Meta/Snap event queues immediately but schedule network loaders after load and idle time. Very short visits may end before vendor downloads complete.
- Associate field labels with inputs, label the phone field, correct definition-list groups and increase flagged text contrast.
- Remove the animated logo filter and batch signature-pad layout reads before writes.

Validation: production build, TypeScript, diff whitespace check, rendered HTML checks, inline script parsing and tracker queue initialization. Local Lighthouse uses mobile throttling against production output with a temporary compressed HTTP adapter. It is not a production PageSpeed retest; timings and Lighthouse versions differ.

Remaining boundaries: external tracker cache lifetimes, legacy vendor code and third-party cookies are controlled by vendors. Essential application CSS remains render blocking, and framework/vendor JavaScript still has unused code. Further removal requires targeted CSS extraction and decisions about retained analytics providers. Changes have not been deployed, and production scores have not been verified.

## Mobile and desktop follow-up

- Production remained on the older assets because Vercel blocked `@tanstack/react-start@1.168.18` for CVE-2026-102989. Updated Start to the patched 1.168.60 and its compatible Router version; no vulnerability override is used.
- Added generated critical CSS for the landing hero/form, including desktop breakpoint rules; the full stylesheet loads asynchronously with a no-JavaScript fallback. Generation derives classes from source so future UI changes do not need a manually maintained class list.
- Consolidated Google library loading under GTM, kept GA configuration and standalone fallback, and retained queued funnel events. GTM owns Ads configuration.
- Made the server-rendered headline stable, prioritized text/fonts ahead of the decorative hero photo, added a smaller mobile hero source and prevented late font swapping on slow connections.
- Deferred signature-pad code until near the viewport. Paused gallery/review timers in hidden tabs, outside the viewport and when reduced motion is requested.
- Added offscreen rendering containment and valid loading-state semantics.
- Verification includes TypeScript, production build, tracker queue/ownership/stylesheet tests, adjacent page rendering and webhook method protection. The temporary local benchmark is not a substitute for the production PageSpeed report.
