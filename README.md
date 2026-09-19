# Cadence

Cadence is a small web app for making **print-ready Medical ID cards** and **Medication Cadence schedules** that are easy to read for people with poor eyesight, limited dexterity, or who simply need plain language.

Everything is stored in the browser (`localStorage`). There is no account, database, or server upload.

## What it does

- **My Medical ID** (`/my-id`) — an accessible form (name, date of birth, blood type, allergies, conditions, medications, emergency contacts, doctor, notes) with a live wallet-card preview.
- **Print / Save as PDF** (`/print/<record>?doc=id&format=…`) — wallet card (CR80, 85.6 × 54 mm, front and back), fold-over card, A4 page, or US Letter page, each with the correct `@page` size. The browser print dialog handles paper output or "Save as PDF".
- **Doctor mode** (`/doctor`) — create records for patients and build a **Medication Cadence** page: which medicine to take at which time of day (morning / midday / evening / bedtime with clear icons), dose, with or without food, plain-language instructions, and a large pill drawing (colour, shape, marking, or an uploaded photo). Printable in A4 or Letter; a weekly grid is added automatically when a medicine is not taken every day.
- **Accessibility** — 18 px base text with a *Large print* toggle (22 px), a *High contrast* toggle, WCAG AA colours, 44 px+ touch targets, icons paired with text, semantic HTML, labelled controls, keyboard navigation, skip link, and reduced-motion support.

## Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:4517>.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build on port 4517
npm run lint    # eslint
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react · Atkinson Hyperlegible font.

## Project layout

```
src/app/                     routes: /, /my-id, /doctor, /doctor/[patientId], /print/[recordId]
src/components/medical-id/   form, wallet card, fold-over card, A4/Letter sheet
src/components/cadence/      medication form, pill SVG, time-of-day icons, printable schedule
src/components/record-editor.tsx  shared editor with tabs, live preview, and print links
src/hooks/use-records.ts     localStorage-backed records with autosave
src/lib/types.ts             data model and constants
src/lib/storage.ts           localStorage read/write with error handling
```

## Not done yet

- Direct PDF file download (the print dialog's "Save as PDF" is the supported path).
- Import/export of records between devices.
- Automated tests.
