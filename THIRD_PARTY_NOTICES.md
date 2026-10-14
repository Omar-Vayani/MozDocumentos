# Third-party notices

Documentos MZ is proprietary software by Omar Vayani (see `LICENSE`). It
includes the open-source components below, each used under its own licence.
These licences allow commercial use; keep this file (and the licence texts in
each package under `node_modules/<package>/LICENSE`) with any distribution.

## Runtime libraries

| Component | Licence | Project |
|---|---|---|
| React, React DOM | MIT | https://react.dev |
| React Router | MIT | https://reactrouter.com |
| @react-pdf/renderer | MIT | https://react-pdf.org |
| pdf.js (pdfjs-dist) | Apache-2.0 | https://mozilla.github.io/pdf.js/ |
| Dexie, dexie-react-hooks | Apache-2.0 | https://dexie.org |
| MiniSearch | MIT | https://lucaong.github.io/minisearch/ |
| i18next, react-i18next | MIT | https://www.i18next.com |
| react-hook-form, @hookform/resolvers | MIT | https://react-hook-form.com |
| Zod | MIT | https://zod.dev |
| Zustand | MIT | https://github.com/pmndrs/zustand |
| Radix UI (Dialog, Tabs) | MIT | https://www.radix-ui.com |
| hyphen (Portuguese hyphenation patterns) | ISC (patterns from the TeX hyphenation project) | https://github.com/ytiurin/hyphen |

## Fonts

| Font | Licence | Use |
|---|---|---|
| Public Sans | SIL Open Font License 1.1 | Application interface |
| Source Serif 4 | SIL Open Font License 1.1 | Documents ("Clássico") |
| Arimo | Apache-2.0 | Documents ("Institucional") |
| IBM Plex Sans | SIL Open Font License 1.1 | Documents ("Moderno") |
| DejaVu Sans (symbols subset: ‰, ☐, ✓, arrows…) | Bitstream Vera / DejaVu licence (free, permits embedding and modification) | Documents (fallback for symbols) |

The fonts are embedded in generated PDFs, which their licences permit.

## National emblem

The image of the Emblema da República de Moçambique (Constituição da
República, art. 306.º in the 2023 republication) printed on public-body
letterheads was rasterised from `dist/coats/MZ.svg` in the
[`coat-of-arms`](https://www.npmjs.com/package/coat-of-arms) package (MIT
licence). The emblem itself is a State symbol: the app offers it only on
profiles of public bodies.

## Build and test tools (not shipped)

Vite, TypeScript, Tailwind CSS, Vitest, Playwright, axe-core and
vite-plugin-pwa are used only to build and test the application.
