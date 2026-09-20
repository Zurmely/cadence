# Cadence

Cadence is a **local-first, zero-knowledge medical ID and medication cadence** app. One person, one browser: allergies, conditions, medications, emergency contacts, and notes stay on the device. There are no doctor/patient accounts, no server, and no health data ever leaves the browser — that is the LGPD stance.

The production site is [cadence.zurmely.com](https://cadence.zurmely.com).

## Features

- **Profile editor** — allergies, conditions, medications, emergency contacts, and notes, autosaved to `localStorage` with a debounce. Strict TypeScript schema (Zod) and a hash-based codec so a full profile (or an emergency-only subset) can round-trip through a compressed URL fragment.
- **Medical autocomplete** — a `MedicalCombobox` built on a MiniSearch index (curated medication/condition/allergy datasets in `public/data/`), indexed off the main thread in a web worker for instant, typo-tolerant suggestions.
- **Medication glyphs** — `MedicationGlyph` renders a parametric SVG icon per medication (shape, color, and marks derived from dose/frequency parameters) so a card is scannable at a glance, plus `GlyphControls` for customizing it and helpers (`renderGlyphSvgString`, `glyphToPngDataUrl`) to reuse the same glyph in the PDF engine.
- **PDF engine** — one-click exports built with `jsPDF`/`jspdf-autotable`: a wallet-sized emergency card (Template A) with medication glyphs, and a full daily intake schedule (Template B).
- **Emergency view** (`/emergency`) — a AAA high-contrast, hash-first view: it resolves the profile straight from a shared `#data=` URL when present (so a link works even without local data), otherwise falls back to the local profile. Designed for a first responder glancing at a locked screen.
- **Schedule & compliance** (`/schedule`) — a daily intake timetable with check-offs, backed by a compliance store that tracks doses taken per day.
- **QR share** — an inline, dependency-free SVG QR code (`QrShare`) that encodes the same compressed `#data=` link, for handing a phone to someone else or printing a card.
- **Sponsor slots** — one optional, purely static sponsor card (see [Sponsors / ad slots](#sponsors--ad-slots) below). No ad network, scripts, iframes, or trackers.
- **Internationalization** — full `pt-BR` / `en-US` coverage via a typed `t(locale, key)` translator, with a test enforcing key parity between both catalogs. Locale preference persists in `localStorage` and defers to a client-side effect (see [Privacy](#privacy) note on hydration) so server and client markup always match on first paint.
- **Accessibility** — 18px base text, WCAG AA site-wide (AAA on `/emergency`), icon + text labeling, full keyboard and screen-reader support.

Pages: `/` (profile), `/schedule`, `/emergency`, `/print`.

## Run locally

Requires Node.js 22+.

```bash
npm ci
npm run dev
```

Then open the printed local URL (Astro binds to an available port).

## Test

```bash
npm test          # Vitest: hash round-trip, i18n key parity, store autosave, compliance, sponsors, glyph, pdf, search
npm run check     # astro check (strict TypeScript)
npm run build     # static export to dist/
```

The suite currently covers 73 tests across 11 files.

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml`: `npm ci`, `npm test`, `astro check`, `astro build`, then GitHub Pages (`configure-pages`, `upload-pages-artifact`, `deploy-pages`).

`public/CNAME` is `cadence.zurmely.com`. Astro is configured with `output: 'static'`, `site: 'https://cadence.zurmely.com'`, and a root base path.

### DNS

Create a **CNAME** record:

| Host      | Target               |
| --------- | -------------------- |
| `cadence` | `zurmely.github.io`  |

In the GitHub repo: Settings → Pages → custom domain `cadence.zurmely.com` (HTTPS).

## Privacy

- No analytics, webfonts, or third-party scripts.
- Profile JSON is stored under the versioned key `cadence.profile.v1` in `localStorage` and autosaved with a debounce.
- Optional share URLs encode a compressed profile into `#data=` (lz-string). The emergency view can copy an **emergency-only** payload that drops notes and other private fields. The QR share button encodes the same link as a scannable code.
- A shareable emergency URL **contains health data by design**. The UI warns before copying. Treat that link like a paper card: anyone who has it can read it.
- Locale is read from `localStorage`, which only exists client-side. `useLocale()` always starts from the default locale on first render (matching the server-rendered HTML) and switches to the stored locale in a `useEffect` after mount — this avoids a React hydration mismatch while still respecting a saved language preference.

## Sponsors / ad slots

Cadence supports one optional, purely static sponsor card. There is **no ad
network, no script, no iframe, no tracker, and no remote image** — a sponsor
is just a title, a body sentence, a link, and an optional icon, defined in
code and shipped with the static build.

To configure a sponsor, edit `src/content/sponsors.ts` and add an entry to
the `sponsors` array:

```ts
export const sponsors: Sponsor[] = [
  {
    id: 'example-sponsor',
    link: 'https://example.org/sponsor',
    icon: HeartHandshake, // any lucide-react icon, optional
    copy: {
      'en-US': { title: 'Example Sponsor', body: 'One sentence about them.' },
      'pt-BR': { title: 'Patrocinador Exemplo', body: 'Uma frase sobre eles.' },
    },
  },
];
```

Rules, enforced by convention and checked by `validateSponsors` (see
`src/content/sponsors.test.ts`):

- `link` must be a plain `https://` URL — no redirectors or tracking domains.
- Both `en-US` and `pt-BR` copy are required.
- Leave the array **empty** to disable ads entirely: `SponsorSlot` renders
  nothing and the two-column layout (`AdSlotLayout.astro`) collapses back to
  a single column, so no space is reserved for an absent sponsor.

The card always carries a visible "Sponsor" / "Patrocinador" label and an
accessible name (`aria-label`) — it is never disguised as app content. Links
open with `rel="noopener noreferrer nofollow sponsored"`.

`/` and `/schedule` show the sidebar variant on desktop (via
`src/components/ads/AdSlotLayout.astro`) and the inline variant on mobile,
placed in the content flow (between the summary and the daily timetable on
`/schedule`).

## Project layout (extension points)

| Path | What plugs in |
| --- | --- |
| `src/lib/profile/` | Schema, `getProfileStore()` / `createProfileStore()`, hash codec |
| `src/i18n/` + `src/lib/i18n/` | `t(locale, key)` typed from `en-US.json`, `useLocale()` hook |
| `src/components/glyph/` | Parametric `MedicationGlyph` SVG, `GlyphControls`, rasterizer helpers |
| `src/components/search/` + `src/workers/` + `public/data/` | MiniSearch autocomplete (`MedicalCombobox`) |
| `src/components/pdf/` + `src/lib/pdf/` | jsPDF wallet card (Template A) and daily intake schedule (Template B) |
| `src/components/emergency/` | AAA high-contrast emergency view, hash-first profile resolution |
| `src/components/schedule/` + `src/lib/schedule/` | Daily timetable and compliance (check-off) store |
| `src/components/share/` | Inline SVG `QrShare` code for the compressed share link |
| `src/components/ads/` | Static `SponsorSlot` and `AdSlotLayout` |
| `src/pages/` | `/`, `/schedule`, `/emergency`, `/print` |
