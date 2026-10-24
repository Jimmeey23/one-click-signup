# Landing and signup refresh

The Mumbai, Bengaluru, Juniors and Route Builder pages now share one visual system and one
signup form language. This note records the rules so future changes stay consistent.

## Design tokens (`src/styles.css`)

| Token | Value | Used for |
| --- | --- | --- |
| `--shell` | `78rem` | Max content width for every section |
| `--gutter` | `clamp(1.15rem, 4vw, 2.25rem)` | Horizontal page padding |
| `--section-y` | `clamp(4.25rem, 7vw, 7.25rem)` | Vertical rhythm between sections |
| `--radius-control` | `14px` | Inputs, selects, signature pad |
| `--radius-card` | `22px` | Cards and list panels |
| `--radius-panel` | `26px` | Signup card, feature list |
| `--ink` / `#070c11` | near-black | Hero, marquee, gallery, instructor and closing bands |

Colour comes from the existing OKLCH palette (`--primary` cyan, `--primary-deep` for text on
light surfaces, `--secondary` for alternate bands, `--muted-foreground` for body copy). No page
should introduce a new hue: the Juniors page previously used a separate slate/sky palette and
now uses the same tokens.

## Shared primitives

Defined in `@layer components`:

- `.p57-shell` - width, centring and page padding.
- `.p57-section` / `.p57-section--tight` - vertical rhythm.
- `.p57-eyebrow` (+ `--invert`, `--bare`) - uppercase label with a short rule.
- `.p57-title` (+ `--sm`, `--invert`) - display serif heading; `<em>` is the accent word.
- `.p57-lede` - supporting paragraph with a comfortable measure.
- `.p57-card` (+ `--interactive`) - bordered surface with the shared shadow.
- `.p57-btn` (+ `--brand`, `--dark`, `--outline`, `--outline-invert`, `--lg`) - one button set.
- `.p57-chip` (+ `--invert`, `--accent`), `.p57-icon-tile`.

Section order on the landing pages alternates surfaces: hero (ink) → marquee (ink) → method
(paper) → benefits (paper) → gallery (ink) → next steps (secondary) → instructors (ink,
Bengaluru) → studios (paper) → reviews (secondary) → closing CTA (ink) → footer (ink). No two
adjacent sections share the same background.

## Signup form

`SignupCard` is a single form with three numbered panels and a three-step progress rail:

1. **Your details** - name, email, mobile (dial code + number), WhatsApp consent.
2. **Studio and format** - studio radio cards for every market (Mumbai previously used a
   `<select>`), then the class-format picker with the selected format's duration and intensity.
3. **Waiver and signature** - collapsible waiver, read-only legal name, signature pad, consent.

Styles live in the `critical:form` region of `styles.css`: `.signup-card`, `.signup-card__head`,
`.signup-steps`/`.signup-step`, `.signup-form`, `.form-panel`, `.p57-label`, `.p57-input`,
`.studio-option`, `.format-option`, `.consent-box`, `.check-row`, `.signup-submit`, `.signup-note`.

The same `.p57-label` / `.p57-input` / `.form-panel` / `.signup-submit` classes are used by
`KidsLanding`, so both signups look and behave alike.

## Performance notes

- **Maps load on demand.** Studio cards show a lightweight placeholder and mount the Google
  embed only after a click. This removes three cross-origin map documents from the initial load
  on the landing and Bengaluru pages.
- **Reviews fetch when near.** The Bengaluru Momence review request waits for an
  `IntersectionObserver` (400px margin) instead of firing during first paint.
- **No large blurred surfaces.** The hero glow is a radial gradient rather than a blurred div,
  and the signup card is opaque instead of `backdrop-blur-xl`, which is expensive on mobile GPUs.
- **Lazy media.** Class-format thumbnails are `loading="lazy"` with intrinsic dimensions;
  instructor and feature photography still use `LazyBackground`.
- **`overflow-x: clip` on `body`** (not `hidden`) so the sticky header keeps working without
  creating a second scroll container.
- Offscreen sections keep `content-visibility: auto`.

## Critical CSS guardrails

`scripts/critical-css.mjs` extracts the first-viewport CSS. It depends on:

- the exact literal `<section className="hero-shell` in `OpenBarreLanding.tsx`;
- the function names listed in its `names` set (`Header`, `Stat`, `SignupCard`,
  `SignupProgress`, `FormPanel`, `StudioPicker`, `ClassFormatPicker`, `Field`, `ConsentLine`,
  `DeferredSignaturePad`). A new presentational component used inside the hero or the form must
  be added there, or its utility classes will only arrive with the async stylesheet;
- the `/* critical:base:end */`, `/* critical:form:start|end */`,
  `/* critical:logo:start|end */` and `/* critical:fonts:start */` markers in `styles.css`. The
  build fails with a clear error if a marker is missing.
