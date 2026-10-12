# Documentos MZ

A client-side web app that generates professional business and personal documents for Mozambique — employment contracts, payslips, declarations, disciplinary procedures, leases, powers of attorney and more — following Lei n.º 13/2023 (Lei do Trabalho) and related rules.

- **No backend, no account.** Everything runs in the browser; data stays on the device (IndexedDB).
- **Portuguese first.** UI in Portuguese and English; documents are always generated in Portuguese, with an optional English reading aid and, for some documents, bilingual output.
- **One renderer.** Documents are vector PDFs made with `@react-pdf/renderer` in a web worker. The on-screen preview is the same PDF drawn with pdf.js, so preview, download and print are identical A4.
- **Not an official service.** It does not replace legal advice.

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
RENDER_FULL=1 npm test            # all fixtures on all four letterheads (slower)
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
    settings/     language, theme, legal values, backup/restore, data reset
  documents/
    model.ts      template and block types
    context.ts    template context, defaults, wording overrides
    blocks/       react-pdf renderers for each block type
    layouts/      the four letterheads, footer and address helpers
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

See [`docs/TEMPLATES.md`](docs/TEMPLATES.md). In short: add metadata to `src/features/catalog/catalog.ts`, create `src/documents/templates/<id>.ts`, and run the template and render tests for that id.
