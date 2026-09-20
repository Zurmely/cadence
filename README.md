# Cadence

Cadence is a **local-first medical ID** and daily medication cadence. One person, one browser: allergies, conditions, medications, emergency contacts, and notes stay on the device. There are no doctor/patient accounts and no server-side health data — that is the LGPD stance.

The production site is [cadence.zurmely.com](https://cadence.zurmely.com).

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Then open the printed local URL (Astro binds to an available port).

## Test

```bash
npm test          # Vitest: hash round-trip, i18n key parity, store autosave
npm run check     # astro check (strict TypeScript)
npm run build     # static export to dist/
```

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml`: install, test, `astro check`, `astro build`, then GitHub Pages (`configure-pages`, `upload-pages-artifact`, `deploy-pages`).

`public/CNAME` is `cadence.zurmely.com`. Astro is configured with `output: 'static'`, `site: 'https://cadence.zurmely.com'`, and a root base path.

### DNS

Create a **CNAME** record:

| Host     | Target              |
| -------- | ------------------- |
| `cadence` | `zurmely.github.io` |

In the GitHub repo: Settings → Pages → custom domain `cadence.zurmely.com` (HTTPS).

## Privacy

- No analytics, webfonts, or third-party scripts.
- Profile JSON is stored under the versioned key `cadence.profile.v1` in `localStorage` and autosaved with a debounce.
- Optional share URLs encode a compressed profile into `#data=` (lz-string). The emergency view can copy an **emergency-only** payload that drops notes and other private fields.
- A shareable emergency URL **contains health data by design**. The UI warns before copying. Treat that link like a paper card: anyone who has it can read it.

## Project layout (extension points)

| Path | What plugs in |
| --- | --- |
| `src/lib/profile/` | Schema, `getProfileStore()` / `createProfileStore()`, hash codec |
| `src/i18n/` + `src/lib/i18n/` | `t(locale, key)` typed from `en-US.json` |
| `src/components/glyph/` | Parametric `MedicationGlyph` SVG |
| `src/components/search/` + `src/workers/` + `public/data/` | MiniSearch autocomplete |
| `src/components/pdf/` | jsPDF wallet card and daily intake |
| `src/components/ads/` | Static `SponsorSlot` layout tokens |
| `src/pages/` | `/`, `/schedule`, `/emergency`, `/print` |
