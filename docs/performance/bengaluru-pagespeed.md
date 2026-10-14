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
