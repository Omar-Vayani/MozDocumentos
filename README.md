# Documentos MZ

By **Omar Vayani**. © 2026 Omar Vayani. All rights reserved — proprietary software, see [`LICENSE`](LICENSE).

A client-side web app that generates 115 professional documents for Mozambique — employment contracts and payslips, civil and commercial contracts, court filings, company articles and resolutions, public-administration correspondence, family and personal declarations — following Lei n.º 13/2023 (Lei do Trabalho), the Civil and Commercial Codes and related rules.

- **No backend, no account.** Everything runs in the browser; data stays on the device (IndexedDB).
- **Portuguese first.** UI in Portuguese and English; documents are always generated in Portuguese, with an optional English reading aid and, for some documents, bilingual output.
- **One renderer.** Documents are vector PDFs made with `@react-pdf/renderer` in a web worker. The on-screen preview is the same PDF drawn with pdf.js, so preview, download and print are identical A4.
- **Not an official service.** It does not replace legal advice.
- **Tools.** Net-salary, leave, notice and compensation calculators, and payslips for the whole team in one PDF.
- **For every kind of user.** Employers and workers, individuals and families, lawyers (court filings with the OAM card number), companies (articles of association, resolutions, share transfers) and public bodies (ofícios, informações, despachos, circulares with the "República de Moçambique" header and emblem).
- **Document families.** Letters, contracts, declarations, court filings, official correspondence, minutes, tables and receipts each follow one page convention (see `docs/TEMPLATES.md`).
- **Official documents print plain.** Anything filed with a court, notary, registry or public body carries no app branding or decoration; other documents carry a small "Documentos MZ" line and a document ID, also stored in the PDF metadata.
- **Customisable.** Six letterhead layouts, image sizes for logo, signature and stamp, text size and spacing, background text (CÓPIA, CONFIDENCIAL…), footer note and tagline.

The full product specification is in [`SPEC.md`](SPEC.md).

## Getting started

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build in dist/
npm run preview      # serve the production build
```

Requires Node 20+. The output in `dist/` is static and can be hosted anywhere (Cloudflare Pages, Netlify…). Configure the host to serve `index.html` for unknown paths (single-page app).

## Tests

```sh
npm test                          # Vitest: formatting, extenso, legal config, search, assistant,
                                  # backup, every template (structure, wording, legal values)
                                  # and a render of every template × fixture × letterhead
RENDER_OUT=/tmp/pdf npm test      # also keep the rendered PDFs for inspection
RENDER_FULL=1 npm test            # all fixtures on all six letterheads (slower)
npm run test:e2e                  # Playwright: builds, serves and drives the app
npx playwright test e2e/visual.spec.ts --update-snapshots   # refresh visual baselines
```

The render test checks that no text falls outside the page margins, that footers stay in the bottom margin on every page and that every font is embedded. The template tests fail if a template contains a banned filler phrase, prints `undefined`/`NaN`, or hard-codes a deadline, rate, article or law number instead of reading it from `src/legal/mz-legal.ts`.

## Project layout

```
src/
  app/            routes, layout shell, preferences store, PWA registration
  ui/             design-system components (buttons, fields, notices, sheets, tabs)
  features/
    catalog/      catalogue metadata, categories, search, home and catalogue pages
    guide/        guided assistant (question tree) and step-by-step processes
    editor/       form + live PDF preview, PDF worker, download/print/share
    profiles/     company and personal profiles, branding, people directory
    history/      saved drafts, final documents and processes
    tools/        salary, leave, notice and compensation calculators; batch payslips
    settings/     language, theme, legal values, backup/restore, data reset
  documents/
    model.ts      template and block types
    context.ts    template context, defaults, wording overrides
    blocks/       react-pdf renderers for each block type
    layouts/      the six letterheads, footer and address helpers
    render/       fonts, theme, document frame, render entry point
    templates/    one file per document (data + logic, no styling)
  legal/
    mz-legal.ts   rates, deadlines, article references, sources, confidence
  lib/            formatting (dates, money, extenso), colour, images, storage
  i18n/           PT and EN interface strings
docs/TEMPLATES.md how to write a template
```

## Legal values

All legal values live in [`src/legal/mz-legal.ts`](src/legal/mz-legal.ts) with their article, source, last-verified date and a confidence level. Values marked `confirm` show a “Confirme este valor” marker in the editor (never on the printed document). INSS rates, the IRPS withholding table (off by default) and sector minimum wages can be changed by the user in **Definições**.

## Adding a document

See [`docs/TEMPLATES.md`](docs/TEMPLATES.md). In short: add metadata to `src/features/catalog/catalog.ts` (or the category file in `src/features/catalog/extra/`), legal values to `src/legal/` (core or `extra/`), create `src/documents/templates/<id>.ts`, and run the template and render tests for that id.

## Ownership and licence

Documentos MZ — the code, design, document templates and their wording — is
proprietary software owned by Omar Vayani. It is not open source: copying,
redistribution or resale without written permission is not allowed (see
[`LICENSE`](LICENSE)). The in-app [Terms of use](src/features/settings/LegalPages.tsx)
and Privacy policy apply to end users. Open-source components and fonts used by
the app keep their own licences, listed in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Owner details shown in the app (name, contact e-mail) are set in
`src/app/owner.ts`.
