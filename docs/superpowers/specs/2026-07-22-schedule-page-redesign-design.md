# Schedule Page Redesign — Design

Status: approved (sub-project 1 of 3 from the broader request; profile modal and respond.io integration are separate specs)

## Context

`SessionCard` in `src/routes/classes.$memberId.tsx` renders each schedule entry today with: format image, class name, instructor, a text-button ("Show format") that reveals a hand-rolled hover tooltip (`FormatTrigger`, CSS `group-hover`, no touch support), a teaser sentence, three badges (level / format family / best-for), a date-time-location meta row, and a price/CTA column.

Goal: make the card leaner and reword badges/descriptors in minimal, on-brand language, and move deeper class info (results, USPs, additional info) into a hover/tap popout triggered from the class image.

## Scope

- `SessionCard` component and its sub-components (`FormatTrigger` is replaced).
- No changes to `formatInfoForSession()` data shape beyond what's needed to feed the popout sections (reuses existing `teaser`, `detail`, `bestFor`, `expect`, `level` fields — no new copywriting).
- No changes to booking logic, pricing, or data fetching.

## Card changes (leaner)

- Remove the teaser sentence from the card body entirely (moves into popout only).
- Remove the "best-for" badge/pill from the card (moves into popout as part of Results).
- Card retains: format-name badge, level badge, date/time/location meta row, price/CTA column.
- Badge copy restyled to confident sentence-case, short (e.g. `All levels`, `powerCycle`) — replacing the current shouty tracked-out uppercase pills. Visual pill/chip container stays similar (radius, subtle fill), just less crowded (2 badges instead of 3) and shorter text.
- Tighten vertical rhythm: reduce `gap-5`/`p-5` toward `gap-4`/`p-4` scale to shrink overall card height now that the teaser line and third badge are gone.

## Hover/tap popout

- **Trigger**: the class image itself (not a separate "Show format" button). Image gets a subtle hover affordance (slight scale or overlay treatment) signaling it's interactive.
- **Mechanism**: build on the existing, currently-unused Radix `Popover` primitive already in `src/components/ui/popover.tsx` (installed via shadcn but unreferenced anywhere in app code today). Use it in controlled mode:
  - Desktop: `mouseenter` on the image opens, `mouseleave` (with a small close delay to allow moving into the popout) closes.
  - Touch: first tap opens, tap-outside (Radix's built-in outside-click dismiss) closes.
  - Rejected alternatives: shadcn `HoverCard` (hover-only, no clean touch fallback) and the current hand-rolled `group-hover` CSS approach (same touch limitation, and harder to make accessible/controllable).
- **Content**, three labeled sections plus header:
  - Header: format image + family name (kept from current `FormatTrigger` panel).
  - **Results** — sourced from `bestFor`, reworded outcome-first where copy allows.
  - **USPs** — `teaser` + `detail` combined into one "what makes it different" block.
  - **Info** — `expect` + `level` + class duration, as a compact fact list (replaces today's 3-row "Intensity / Best for / What to expect" block; now 2 facts since best-for moved to Results).
- Same visual container language as the current panel (rounded white card, shadow, ~340px width) — only the trigger surface, section labels, and copy grouping change.

## Out of scope / explicitly not doing here

- No new per-format "results" copywriting — reusing existing `bestFor`/`teaser`/`detail`/`expect` fields.
- No changes to the `FormatInfo` type or `formatInfoForSession()` switch beyond what section-grouping requires in the popout component (pure presentation change, not new data fields).
- Profile modal changes and respond.io integration are tracked as separate specs, not part of this change.
