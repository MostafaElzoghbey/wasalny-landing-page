# DESIGN.md — Wasalny Design-System Contract

## §0 Status and Scope

This document governs the `/admin` dashboard mobile-responsive refactor. It
CODIFIES the existing token system rather than replacing it. Every value below
is either copied verbatim from the codebase with a `file:line` citation, or
explicitly marked NEW with a rationale. No invented hex codes, no magic pixels.

Subsequent waves cite these sections by number in code comments and commit
messages, so section numbering (§0 through §7) is stable. Do not renumber.

Verified baseline at time of authoring:

- `npm test` → 399 passed / 8 skipped (58 files)
- `npx tsc -b` → exit 0
- Stack: React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4 with CSS-only
  config. There is NO `tailwind.config.js`; Tailwind is wired via
  `@tailwindcss/vite` in `vite.config.ts`.
- Project conventions live in `AGENTS.md`: strict import order
  (React, third-party, `@/` aliases, relative, CSS at entry only), no
  `as any` / `@ts-ignore` / `@ts-expect-error`, 250 pure-LOC ceiling per
  admin file, named exports only, `cn()` for conditional classes.

## §1 Color tokens

### §1.1 Primary and accent ramps (`src/index.css`, `@theme` block, lines 7-45)

Verbatim from `src/index.css:8-24`:

```css
/* Primary Blue Palette */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;

/* Accent Orange (from logo) */
--color-accent-400: #fb923c;
--color-accent-500: #f97316;
--color-accent-600: #ea580c;
```

The ramp is an 11-step primary scale (`50` through `950`) plus a 3-step accent
scale (`400`, `500`, `600`). Consumed as `bg-primary-600`, `text-accent-500`,
etc. Do not introduce new steps; use the existing scale.

### §1.2 Semantic HSL triplets (`src/index.css`, `@layer base`, lines 129-164)

CRITICAL: these tokens live in `@layer base`, NOT in `@theme`. They are raw
`H S% L%` triplets, so the `hsl()` wrapper is ALWAYS required at the
consumption site: `bg-[hsl(var(--card))]`, `text-[hsl(var(--foreground))]`,
`border-[hsl(var(--border))]`. A bare `bg-(--card)` or `text-(--foreground)`
emits nothing; treat a missing `hsl()` wrapper as a bug.

`:root` (light), verbatim from `src/index.css:130-146`:

```css
--background: 0 0% 96.5%;
--foreground: 224 71% 4%;
--card: 0 0% 99%;
--card-foreground: 224 71% 4%;
--muted: 220 14.3% 93.5%;
--muted-foreground: 220 8.9% 46%;
--border: 220 13% 88%;
--ring: 221.2 83.2% 53.3%;
--surface-elevated: 0 0% 99%;
--section-alt: 220 14% 94.5%;
--input: 220 14.3% 93.5%;
--shadow-color: 220 20% 30%;
```

`.dark`, verbatim from `src/index.css:148-164`:

```css
--background: 224 71% 4%;
--foreground: 210 40% 98%;
--card: 215 28% 10%;
--card-foreground: 210 40% 98%;
--muted: 215 28% 14%;
--muted-foreground: 217 10% 64%;
--border: 215 28% 17%;
--ring: 224.3 76.3% 48%;
--surface-elevated: 215 28% 12%;
--section-alt: 215 28% 6%;
--input: 215 28% 14%;
--shadow-color: 224 71% 2%;
```

Note the light theme deliberately avoids pure white (`--background` is
`0 0% 96.5%`, see the comment at `src/index.css:131`).

### §1.3 Dark variant

The project has exactly ONE custom variant, at `src/index.css:4`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Dark mode is class-based (toggled on `<html>`, see the FOUC guard in
`index.html:41-65`), never OS-preference media. No other custom variant exists;
do not add one.

## §2 Typography

### §2.1 Font token

`@theme` defines exactly one font token (`src/index.css:36`):

```css
--font-cairo: 'Cairo', sans-serif;
```

Cairo loads weights 300 through 900 from Google Fonts
(`index.html:15-16`):

```html
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

Consumed via `font-cairo` (wired on `body` at `src/index.css:240`). Do not add
a second family for admin UI.

### §2.2 Type scale

`@theme` defines NO `--text-*` overrides, so the Tailwind v4 stock type scale
applies. Do not invent named sizes; use the stock scale.

The two proven landing ramps, quoted verbatim, are the reference for any new
heading:

- Hero: `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl`
  (`src/components/sections/HeroSection.tsx:163`)
- Section: `text-3xl sm:text-4xl lg:text-5xl`
  (`src/components/ui/SectionHeading.tsx:77`)

### §2.3 NEW rule: 16px floor on form controls

RULE (NEW): every `<input>`, `<select>`, and `<textarea>` must compute to
`font-size >= 16px` on phones. Implement as `text-base sm:text-sm`.

Rationale: below 16px, iOS Safari auto-zooms the visual viewport (about 1.5x)
on focus and does not restore it on blur, which makes a form unusable on the
operator's phone. The small-desktop sizing is kept above the `sm:` breakpoint
so desktop density is unchanged.

Current violation being fixed: the `Field` input class in
`src/admin/ui.tsx:32` uses `text-sm`:

```css
w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 text-sm text-[hsl(var(--foreground))] focus:border-primary-500 focus:outline-none
```

## §3 Spacing, radius, elevation, breakpoints

### §3.1 What `@theme` does NOT define

`@theme` defines NO `--spacing`, NO `--radius-*`, and NO `--breakpoint-*`
overrides. Therefore Tailwind v4 stock values apply:

- Spacing base `--spacing: 0.25rem` (4px); all spacing utilities are multiples
  of it.
- Radius: `--radius-xs` .125rem through `--radius-4xl` 2rem (stock scale).
- Breakpoints: `sm` = 40rem/640px, `md` = 48rem/768px, `lg` = 64rem/1024px,
  `xl` = 80rem/1280px, `2xl` = 96rem/1536px.

There is NO `xs` breakpoint. A class prefixed `xs:` silently emits no CSS and
is therefore forbidden.

### §3.2 Shadow scale

Verbatim from `src/index.css:38-44` (note the boosted alphas for light-mode
visibility, per the comment on line 38):

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.08);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.14), 0 4px 6px -4px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
```

The bare `--shadow` is NOT overridden; only the named steps exist.

### §3.3 Layout primitives

Verbatim from `src/index.css:297-303`:

```css
.section-container {
  @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
}
.section-padding {
  @apply py-16 sm:py-20 lg:py-24;
}
```

### §3.4 Card

Verbatim from `src/index.css:262-264`:

```css
.card {
  @apply rounded-2xl bg-[hsl(var(--card))] p-6 transition-all duration-300 border border-[hsl(var(--border))];
}
```

Elevation is layered on top per theme, NOT in the base `.card` rule.
Verbatim from `src/index.css:267-291`:

```css
:root .card {
  box-shadow:
    0 1px 3px hsl(var(--shadow-color) / 0.08),
    0 6px 16px hsl(var(--shadow-color) / 0.14),
    0 0 0 1px hsl(var(--border));
}
:root .card:hover {
  box-shadow:
    0 2px 6px hsl(var(--shadow-color) / 0.10),
    0 12px 28px hsl(var(--shadow-color) / 0.18),
    0 0 0 1px hsl(var(--border));
}
.dark .card {
  box-shadow:
    0 1px 3px hsl(var(--shadow-color) / 0.2),
    0 4px 16px hsl(var(--shadow-color) / 0.3);
}
.dark .card:hover {
  box-shadow:
    0 2px 6px hsl(var(--shadow-color) / 0.25),
    0 8px 28px hsl(var(--shadow-color) / 0.35);
}
```

Admin `Panel` (`src/admin/ui.tsx:79-86`) composes `.card` with `p-5` and a
heading; keep that density override, do not re-specify shadows.

## §4 The mobile contract

This section is the heart of the document. The dashboard has a single
operator and that operator uses a phone. Every rule below protects the
320-430px viewport first.

### §4.1 Breakpoint policy

`sm` = 640px and a phone is 320-430px wide, so **`sm:` NEVER fires on the
target device.** Therefore ALL mobile protection lives in BASE (unprefixed)
classes; `sm:`/`lg:` exist only to RESTORE the desktop presentation. Write
mobile-first, then enhance: the base class list must already be a usable phone
layout with zero prefixed classes applied.

Use arbitrary `min-[420px]:` for the large-phone step (for example a 2-column
pricing grid that is 1-column below 420px and `sm:`-restored above 640px).

Canonical precedents from the landing page:

- Grid: `grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8`
  (`src/components/sections/ServicesSection.tsx:172`; same shape at
  `FeaturesSection.tsx:234` and `Footer.tsx:157`).
- Stack to row: `flex flex-col sm:flex-row`
  (`src/components/sections/HeroSection.tsx:182`;
  `CTASection.tsx:211` uses `flex flex-col sm:flex-row gap-4 justify-center`).

### §4.2 Touch targets

Minimum **44x44 CSS px** (WCAG 2.5.5 / Apple HIG 44pt). Heights below are
computed from padding plus line-height plus border at the default 16px root.
Each existing admin control is marked PASS or FAIL:

| Control | Source | Height | Verdict |
|---|---|---|---|
| `.btn-primary` (`px-6 py-3 text-lg`) | `src/index.css:250-252` | 52px | PASS |
| `DangerButton` (`px-4 py-2 text-sm`) | `src/admin/ui.tsx:105` | 36px | FAIL |
| Ghost/cancel button (`px-4 py-2 text-sm`), 12 verbatim copies (+1 near-variant) across `CarCard` (x2), `LocationCard` (x2), `RouteDataCard` (x3), `FaqCard` (x2), `RouteGroupCard` (x2), `CarImageRow` (x1), `IdentityAdmin` (x1); plus the `DangerButton` instance above, 14 `px-4 py-2 text-sm` instances total | e.g. `src/admin/CarCard.tsx:124,186` | 36px | FAIL |
| `CarImageRow` edit/delete (`px-3 py-1.5 text-xs`) | `src/admin/CarImageRow.tsx:162,180,190` | 28px | FAIL |
| Up/down reorder arrows (`px-1.5 py-0.5 text-xs`) | `src/components/ui/ReorderControls.tsx:56-57` | 16px | FAIL |
| Checkboxes (`h-4 w-4`) | e.g. `src/admin/RouteGroupCard.tsx:266,311` | 16px | FAIL |
| `Field` input (`p-2 text-sm`) | `src/admin/ui.tsx:32` | 38px | FAIL |
| `ChipInput` container (`min-h-[42px]`) | `src/components/ui/ChipInput.tsx:64` | 42px | FAIL |

Fix tokens (NEW, rationale: reach the 44px floor with the smallest class
change that preserves desktop density):

- Icon-only controls: `min-h-[44px] min-w-[44px]`.
- Small-text buttons (`text-sm`/`text-xs`): raise to at least `py-2.5`, or add
  `min-h-[44px]` where padding alone cannot reach it (arrows, checkboxes).
- `Field` inputs are additionally covered by the §2.3 `text-base` rule, which
  increases their computed height toward the floor.

### §4.3 Overflow discipline

Three mechanisms silently break this codebase. Each must be handled at every
scroll region:

(a) A flex item with `flex-1` but no `min-w-0` cannot shrink below its
min-content width, so long titles push siblings off screen. Every card header
already pairs them: `min-w-0 flex-1` at `src/admin/CarCard.tsx:106`,
`src/admin/LocationCard.tsx:90`, `src/admin/RouteDataCard.tsx:61`,
`src/admin/FaqCard.tsx:76`, `src/admin/RouteGroupCard.tsx:126`.

(b) `overflow-y: auto` with `overflow-x: visible` computes `overflow-x` to
`auto`, so vertical overflow handling silently creates a sideways-panning
panel.

(c) `body { overflow-x: clip }` (`src/index.css:244`) then silently truncates
whatever escapes, producing permanently unreachable controls with no
scrollbar to reveal them. It is a guardrail, not a layout mechanism (see §7.3).

Rules:

- Every scroll child of a flex or grid container gets `min-w-0` (horizontal
  axis) and `min-h-0` (vertical axis) as applicable.
- Non-wrapping action clusters are forbidden. Use the proven
  `flex flex-wrap gap-2` pattern already present at
  `src/admin/CarCard.tsx:178`, `src/admin/LocationCard.tsx:126`,
  `src/admin/FaqCard.tsx:116`, and `src/admin/IdentityAdmin.tsx:237`
  (also `RouteDataCard.tsx:87`, `RouteGroupCard.tsx:186`).
- Long unbreakable tokens (ids, filenames) get `truncate` plus `min-w-0` on
  the flex parent, or are hidden below a breakpoint. Precedent:
  `src/admin/CarImageRow.tsx:154` and `src/admin/IdentityAdmin.tsx:161`.

### §4.4 Scroll ownership

Name the single scroll owner per region; two nested scrollers on one axis is
a bug.

- **Mobile: the document scrolls.** The `<main>` element gets NO overflow class
  at base. A nested overflow container on mobile breaks iOS Safari URL-bar
  collapse and tap-to-top.
- **Desktop (`lg:` and up): `<main>` is the scroll owner** inside a bounded
  `lg:h-[100dvh] lg:overflow-hidden` shell, with `<main>` taking
  `lg:overflow-y-auto`.

Full-height shells use `100dvh`, NEVER `100vh` or bare `min-h-screen` on the
app shell, because `100vh` includes the Safari chrome area and causes the
address-bar jump on scroll. Current violations being fixed:
`src/admin/AdminApp.tsx:119` (loading state), `src/admin/AdminApp.tsx:160`
(shell), and the login wrapper at `src/admin/AdminApp.tsx:128`.
(The `lg:` restoration keeps `min-h-screen` semantics on desktop where
`100dvh` and `100vh` coincide.)

### §4.5 Safe area

`index.html` (`index.html:7`) declares:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

There is NO `viewport-fit=cover`, therefore `env(safe-area-inset-*)` resolves
to `0px` on notched devices in Safari portrait.

Accepted debt: do NOT add `viewport-fit=cover` in this refactor. It reflows
the entire public landing page and requires its own full visual-QA pass (see
§7.1). Instead use the in-repo floor pattern so the value is a floor and never
the sole spacing, copied from `src/components/ui/PWAInstallBanner.tsx:96`:

```css
pt-[max(0.75rem,env(safe-area-inset-top))]
pb-[max(1.25rem,env(safe-area-inset-bottom))]
```

Apply the `pt-[max(...)]` form to the top drawer/header region and the
`pb-[max(...)]` form to the bottom action bar. Because the `max()` floor
falls back to the rem value while `viewport-fit` is absent, the layout is
correct both before and after a future `viewport-fit` adoption.

### §4.6 Motion

CSS transitions only for the refactor. No new animation runtime.

- `focus-trap-react@12` is already a dependency (`package.json:27`,
  `package-lock.json` pins `12.0.0`) and already used by the landing drawer
  (`src/components/layout/Header.tsx:3`). Reuse it for any admin drawer or
  dialog; add no new runtime dependency.
- Animate only `transform` and `opacity` (GPU-composited). Never animate
  `width`, `height`, `top`, or `left`. The drawer precedent animates `y`,
  `scale`, and `opacity` with `back.out`/`power2` easings
  (`src/components/layout/Header.tsx:70-108`).
- Honour `prefers-reduced-motion: reduce`. `src/index.css:473` already has
  exactly one such block (covering `.reorder-item`); extend that block rather
  than adding new media queries, and add NO new `@media` width queries at
  all: all responsiveness is Tailwind variants.

### §4.7 Pointer capability

The HTML5 `draggable` reorder handle in `src/components/ui/ReorderControls.tsx:44`
(`draggable={!disabled}`) never fires on touch. Touch devices have no
dragstart, so the handle is decorative on the operator's phone.

Rule: hide drag affordances behind a capability query
(`@media (hover: none)`), and promote the up/down arrow buttons, which are the
real touch path (`src/components/ui/ReorderControls.tsx:56-57`), to the 44px
minimum from §4.2. Capability query, not a width proxy: a large touch tablet
and a small touch phone both need arrows, and a narrow desktop window still
has a working mouse.

## §5 RTL

Document root is `<html lang="ar" dir="rtl" class="light">` (`index.html:2`).

Mandatory: **logical properties only** in NEW code. Use `ms-`/`me-`,
`ps-`/`pe-`, `start-`/`end-`, `inset-inline-*`, `border-s`/`border-e`,
`text-start`/`text-end`. The codebase already models this: the PWA banner
positions with `start-0 end-0 md:start-auto md:end-6`
(`src/components/ui/PWAInstallBanner.tsx:83`) and spaces with `ms-1`
(`PWAInstallBanner.tsx:130`).

Forbidden in NEW code: physical `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/
`text-left`/`text-right`, and `translate-x`/`-translate-x-full` for off-canvas
positioning (use the `rtl:` variant or a logical inset instead; physical
translate-x does not mirror under `dir="rtl"`).

The only RTL utility is `.flip-rtl` (`src/index.css:338-340`):

```css
.flip-rtl {
  @apply rtl:-scale-x-100;
}
```

Live bug being fixed: `src/admin/AdminApp.tsx:163` uses `border-r` on the
sidebar:

```html
<aside className="w-60 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
```

In a `dir="rtl"` flex row the `<aside>` is the first DOM child, i.e. it sits
at inline-start = the RIGHT edge, so `border-r` paints the OUTER edge and the
inner divider between sidebar and content is missing. The correct class is
`border-e`.

For GSAP animation, horizontal transforms must go through `rtlX()` from
`@/lib/gsap` (`src/lib/gsap.ts:16-19`), which negates x values when
`document.dir === 'rtl'`. Precedent: `Header.tsx:83` (`x: rtlX(-20)`) and the
`MobileMenu` stagger; per `AGENTS.md`, every new horizontal animation MUST
use it. Never import `ScrollTrigger` or `useGSAP` from `gsap` directly;
import from `@/lib/gsap`.

## §6 Component patterns

Per the `AGENTS.md` `*Card.tsx` + `*Helpers.ts` + `*ui.tsx` convention.

### §6.1 Shared admin primitives (`src/admin/ui.tsx`)

- `Field` (`ui.tsx:18-66`): label plus input/textarea; props `label`,
  `testid`, `value`, `onChange`, `type`, `textarea`, `required`,
  `placeholder`, `dir`, `inputMode`, `autoComplete`. Input class at
  `ui.tsx:31-32`; textarea adds `min-h-[72px] resize-y` (`ui.tsx:47`).
- `ErrorText` (`ui.tsx:68-77`): `role="alert"`,
  `mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40`.
- `Panel` (`ui.tsx:79-86`): `<section dir="rtl" className="card p-5">` with an
  `h3` title.
- `PrimaryButton` (`ui.tsx:92-98`): composes `.btn-primary` via `cn()`.
- `DangerButton` (`ui.tsx:100-112`): `rounded-xl bg-red-600 px-4 py-2 text-sm
  font-semibold text-white transition hover:bg-red-700 active:scale-95
  disabled:opacity-50`.
- NEW `GhostButton`: extract from the 12 duplicate ghost/cancel class strings + 1 near-variant.
  Exact class string (verbatim, e.g. `src/admin/CarCard.tsx:124`):

  ```css
  rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))] active:scale-95
  ```

  Rationale: one definition lets the §4.2 touch-target fix land in a single
  place instead of twelve. Variants with `text-red-600`/`border-red-200`
  (delete-outline, e.g. `CarImageRow.tsx:190`) stay separate; do not merge
  destructive styling into the neutral ghost.

### §6.2 Uniform list-admin anatomy

Every list card (`CarCard`, `LocationCard`, `RouteDataCard`, `FaqCard`,
`RouteGroupCard`, identity rows) follows the same anatomy:

1. Expand header: a `<button data-testid="*-expand-{id}">` toggling parent
   controlled `expanded` (single open at a time via parent `expandedId`).
2. Collapsed: read-only summary (name plus counts/meta, truncated).
3. Expanded: edit form with `Save`/`Cancel`; Save calls `adminUpdate*` (PUT),
   then parent `onUpdated` patches the list via `map` replace without reload;
   Cancel discards the draft.
4. Delete is two-step: `Delete` reveals `Confirm`/`Cancel`; Confirm calls
   `adminDelete*`, then parent `onDeleted` removes via `filter` and clears
   `expandedId` if it was the open row.
5. `ReorderControls` (`src/components/ui/ReorderControls.tsx:15-61`): drag
   handle (`⋮⋮`, `data-testid="reorder-handle-{id}"`), mono `displayOrder`
   badge, up/down buttons (`data-testid="move-up-{id}"` /
   `move-down-{id}"`, disabled at the ends), keyboard `ArrowUp`/`ArrowDown`
   support (`ReorderControls.tsx:28-32`).
6. Card-local state: `expanded` (parent-controlled), `editing` (internal),
   `draft` (clone), `confirmDelete`, `saving`, `error`. Validation via
   `*Helpers.ts` (`validateCar`, `validateLocation`, `validateRouteData`,
   inline `FaqCard` checks); errors render via `<ErrorText>`.

Data-testid naming convention (per entity, `{id}` is the row id):

```text
{entity}-card-{id}  {entity}-expand-{id}  {entity}-edit-{id}
{entity}-save-{id}  {entity}-cancel-{id}  {entity}-delete-{id}
{entity}-delete-confirm-{id}
```

(`faq` uses generic `faq-delete` / `faq-delete-confirm`.) Identity rows use
the index form: `identity-card-{i}`, `identity-expand-{i}`,
`identity-move-up/down-{i}`, `identity-delete-{i}`,
`identity-delete-confirm-{i}`, `identity-delete-cancel-{i}`.

File ceiling: **250 pure LOC** per admin file. When a file approaches it,
extract the card to `*Card.tsx` and helpers to `*Helpers.ts`, per `AGENTS.md`.

Supporting shared atoms live in `src/components/ui/`: `Button.tsx`
(variants `primary | secondary | accent | ghost`, sizes with
`sm: 'px-4 py-2 text-sm'` at `Button.tsx:97-101`), `ChipInput.tsx`
(RTL chip editor, container `min-h-[42px]` at `ChipInput.tsx:64`),
`ImageDropzone.tsx` (`mode="single" | "multiple"`), `ReorderControls.tsx`.

## §7 Accepted debt

Explicit, itemised, with rationale. None of these block the refactor.

1. `viewport-fit=cover` not adopted (see §4.5). It reflows the entire public
   landing page and requires its own full visual-QA pass. The `max()` floor
   pattern keeps the admin correct with and without it.
2. HTML5 drag reorder is inert on touch; the up/down arrows are the supported
   touch path (see §4.7). Do not invest in touch-drag polyfills during this
   refactor.
3. `body { overflow-x: clip }` (`src/index.css:244`) is retained as a
   guardrail, never used as a layout mechanism. If content is clipped, fix the
   layout per §4.3; do not rely on the clip.
4. `src/admin/CarCategoryGroup.tsx` does NOT exist. `AGENTS.md` is stale on
   this point (it describes a grouped view); the current `CarAdmin` uses a
   flat fleet with big-category drill-down. `src/admin/CarAdmin.flat.test.tsx`
   (currently `describe.skip` at line 41) actively asserts the source does not
   contain that identifier. Do not create the file until that retired test is
   deleted.
5. `tests/e2e/admin-flows.spec.ts` references a retired CarAdmin UI and is
   already stale; out of scope for this refactor.
6. `react-grab`, `react-scan`, and `react-doctor` are NOT installed.
   Deliberately skipped: they are dev-only render-profiling tools, they add
   three dependencies to a project with a green baseline, and this refactor is
   a layout and accessibility change with no new render-path work. Revisit
   during a performance pass.
7. `src/admin/CarAdmin.flat.test.tsx` stays `describe.skip`. It asserts a
   retired flat-list DOM contract that the current grouped UI intentionally
   does not satisfy; un-skipping it is a separate test-maintenance task.
