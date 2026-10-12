# Build prompt — "Documentos MZ" (working name)

> Paste this whole file into your coding agent as the project spec. Keep it in the repo as `SPEC.md`.

---

## 1. Role and mission

You are a senior front-end engineer and document designer building a **client-side web app that generates professional business and personal documents for Mozambique**, following the procedures set out in Mozambican law.

The people using it are small business owners, HR clerks, accountants and individuals — often on a mid-range Android phone with an unreliable connection, often without legal training. Your job is to let them produce a document that looks like it came from a careful professional office, with the legally required content, in a few minutes, without having to understand legal jargon.

Quality bar: every document must look like it was typeset by a professional who cares. The app UI must look like a calm, competent public-service website — not like an AI-generated template.

---

## 2. Non-negotiables

1. **No backend, no database, no account.** Everything runs in the browser. Data stays on the device.
2. **Portuguese first, English second.** UI in PT (default) and EN. Generated documents are in Portuguese (Mozambique's official language) — see §10.
3. **A4 is the standard page size.** 210 × 297 mm. What the user sees in the preview must be exactly what prints and what is saved as PDF.
4. **Zero layout failures.** No text overflowing margins, no orphaned signature blocks, no logo distortion, no headers overlapping body text, regardless of input length.
5. **Works on every screen** from 320 px phones to large desktops, touch and keyboard.
6. **Plain-language titles.** Every document has a simple title ("Recibo de salário") with the formal title shown underneath ("Recibo de vencimento").
7. **Legal content is data, not hard-coded prose.** Rates, deadlines and article references live in one versioned config file so they can be corrected without touching templates (§9).
8. **Not an official government service.** Gov-like *aesthetic* only. Never use the national emblem, flag or ministry branding, and show a short notice in the footer: "Este serviço não é oficial e não substitui aconselhamento jurídico."

---

## 3. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React 19 + TypeScript (strict) | Fast, static output, typed templates |
| Routing | React Router (or TanStack Router) | Deep links to each document: `/documentos/nota-de-culpa` |
| Styling (app UI) | Tailwind CSS v4 with **custom design tokens only** — no shadcn/ui default look | Speed without the generic look |
| Accessible primitives | Radix UI (Dialog, Popover, Tabs, Select) — unstyled | Correct a11y, our own styling |
| Forms | react-hook-form + zod | Per-template schemas, validation, conditional fields |
| State | Zustand (+ persist for small prefs) | Simple, small |
| Storage | **IndexedDB via Dexie** for profiles, people, drafts and images; localStorage only for UI prefs (language, last profile) | localStorage caps at ~5 MB and base64 logos/backgrounds blow through it fast |
| Search | MiniSearch | Client-side, fuzzy, prefix, field boosting, custom term processing for accents |
| PDF engine | **@react-pdf/renderer** (lazy-loaded) | Vector PDFs, embedded fonts, deterministic layout on every device, fixed headers/footers, page numbers |
| Preview | Render the same PDF blob with **pdf.js** to canvas | One renderer = preview, download and print are identical. No HTML-vs-PDF drift |
| Offline | vite-plugin-pwa | Installable, works offline after first visit |
| i18n | i18next (UI strings only) | |
| Testing | Vitest (logic), Playwright (e2e + visual snapshots of rendered PDF pages) | Catches layout regressions |
| Hosting | Any static host (Cloudflare Pages / Netlify) | |

Alternative to consider only if react-pdf typography proves limiting: Typst compiled to WASM (typst.ts). Do not mix HTML print CSS with react-pdf — pick one engine.

---

## 4. Architecture

```
src/
  app/            routes, layout, providers
  ui/             design-system components (Button, Field, Stepper, Card…)
  features/
    catalog/      document registry, categories, tags, search index
    guide/        guided assistant (question flow)
    editor/       form + live preview screen
    profiles/     company/individual profiles, branding, people
    history/      saved documents and drafts
    settings/     language, backup/restore, data reset
  documents/
    model.ts      DocumentTemplate type + block types
    blocks/       react-pdf renderers for each block type
    layouts/      letterhead layouts (see §7)
    templates/    one file per document (data + logic, no styling)
  legal/
    mz-legal.ts   rates, deadlines, article refs, sources, lastVerified dates
  lib/
    format/       dates, money, number-to-words (extenso), IDs
    storage/      Dexie schema, backup/restore
  i18n/
```

### Template model (the core idea)

Each document is a **typed data object**, not a hand-made layout. Layout and styling come from shared block renderers and the user's chosen letterhead. This keeps 40+ documents consistent and makes "no layout failure" testable.

```ts
type DocumentTemplate = {
  id: string;                    // 'nota-de-culpa'
  category: CategoryId;          // 'disciplina'
  audience: 'empresa' | 'pessoa' | 'ambos';
  title: { pt: string; en: string };          // plain language
  formalTitle: string;                        // as it appears on the page
  summary: { pt: string; en: string };        // one sentence: when to use it
  tags: string[];                             // synonyms, slang, English terms
  legalRefs: LegalRefId[];                    // keys into legal/mz-legal.ts
  fields: FieldDef[];                         // drives the form (zod schema derived)
  computed?: (values) => Record<string, unknown>; // deadlines, totals, extenso
  blocks: (ctx) => Block[];                   // ordered content blocks
  warnings?: (values) => Warning[];           // e.g. "prazo de resposta < 15 dias"
  related?: string[];                         // next documents in the process
  lastReviewed: string;                       // ISO date
};
```

Block types (minimum): `letterhead`, `reference` (Ref./data/local), `recipient`, `subject`, `salutation`, `paragraph` (with inline variables), `numberedClauses`, `table` (payslip lines), `keyValue` (employee data), `amount` (figure + extenso), `signatures` (1–3 columns, optional stamp/signature images, "O Empregador / O Trabalhador"), `acknowledgement` ("Recebi o original em ___/___/____"), `annexList`, `spacer`, `pageBreakHint`.

Every block declares its break behaviour (`wrap`, `minPresenceAhead`) so signatures always stay with the closing paragraph and table rows never split.

---

## 5. Document catalogue (v1)

Plain title first, formal title in brackets. Build phase A first, then B.

### Contratar — Hiring
- **A** Oferecer um emprego *(Proposta de emprego)*
- **A** Contrato de trabalho sem data de fim *(Contrato de trabalho por tempo indeterminado)*
- **A** Contrato de trabalho com data de fim *(Contrato de trabalho a prazo certo)*
- **B** Contrato de trabalho temporário sem data fixa *(Contrato a prazo incerto)*
- **A** Ficha de registo do trabalhador *(Ficha de admissão — dados pessoais, NUIT, nº INSS, BI/DIRE, conta bancária, contacto de emergência)*
- **B** Descrição de funções
- **B** Acordo de confidencialidade
- **A** Contratar um prestador de serviços / freelancer *(Contrato de prestação de serviços)*

### Salário e pagamentos — Pay
- **A** Recibo de salário *(Recibo de vencimento — bruto, subsídios, INSS do trabalhador, IRPS retido, outros descontos, líquido; INSS da entidade empregadora shown separately for information)*
- **A** Confirmar o salário de alguém — para banco ou crédito *(Declaração de rendimentos / de vencimento)*
- **A** Confirmar que alguém trabalha aqui *(Declaração de trabalho / Declaração de serviço)*
- **B** Adiantamento de salário *(Pedido e autorização de adiantamento salarial)*
- **A** Recibo de pagamento *(Recibo genérico)*

### Férias e faltas — Leave
- **A** Pedir férias *(Pedido de férias)* · **B** Aprovar férias *(Autorização / marcação de férias)*
- **A** Justificar uma falta *(Justificação de falta)*
- **B** Comunicar licença de maternidade / paternidade

### Disciplina — Discipline
- **A** Advertir por escrito *(Repreensão registada / Advertência escrita)*
- **A** Acusar formalmente de uma falta *(Nota de culpa)*
- **A** Chamar o trabalhador para ser ouvido *(Convocatória para audição)*
- **A** Responder a uma acusação — para o trabalhador *(Resposta à nota de culpa)*
- **A** Comunicar a decisão do processo *(Decisão disciplinar — including dismissal with just cause)*
- **B** Suspender durante o processo *(Suspensão preventiva)*

### Fim do contrato — Ending employment
- **A** Sair do emprego — para o trabalhador *(Carta de rescisão com aviso prévio)*
- **A** Terminar o contrato de comum acordo *(Acordo de revogação do contrato de trabalho)*
- **A** Não renovar um contrato com data de fim *(Comunicação de não renovação / caducidade)*
- **A** Certificado de trabalho *(issued when the contract ends)*
- **B** Declaração de quitação

### Pessoal — For individuals
- **A** Autorizar alguém a tratar por mim *(Procuração)*
- **A** Declarar os meus rendimentos *(Declaração de rendimentos — individual)*
- **A** Compromisso de honra *(Declaração sob compromisso de honra)*
- **A** Arrendar uma casa *(Contrato de arrendamento)* · **A** Recibo de renda
- **B** Vender um bem, por ex. um carro *(Declaração de venda)*
- **A** Pedir algo a uma instituição pública *(Requerimento)*
- **B** Fazer uma reclamação *(Carta de reclamação)*
- **B** Reconhecer uma dívida *(Declaração de dívida / Acordo de pagamento)*

### Empresa — Business admin
- **A** Autorizar um funcionário a representar a empresa *(Credencial)*
- **B** Acta de reunião / assembleia
- **A** Carta oficial em branco *(Ofício / carta comercial)*
- **B** Orçamento / Cotação *(explicitly not a tax invoice — invoices must follow AT rules and are out of scope)*

### Out of scope (say so in the app, with links to the issuing body)
Documents only an authority can issue (BI, NUIT certificate, declaração de residência do bairro, certidões) and official INSS/AT forms. Link to the right institution instead of imitating its form.

---

## 6. Finding the right document

### 6.1 Guided assistant ("Não sei qual preciso")
GOV.UK-style **one question per screen**, large tap targets, back button always works, answers kept if the user goes back.

1. "Para quem é o documento?" → A minha empresa / Para mim
2. "O que precisa de fazer?" → Contratar · Pagar · Férias e faltas · Disciplinar · Terminar um contrato · Tratar de um assunto pessoal · Outro
3. 1–3 follow-up questions per branch (e.g. "O trabalhador tem contrato com data de fim?")
4. Result page: the recommended document, why it fits, and — when the task is a **process** — the full sequence.

**Processes** are first-class. Example "Despedir com justa causa":
Nota de culpa → prazo de resposta do trabalhador → Convocatória para audição → Decisão disciplinar → Certificado de trabalho.
Show it as a numbered checklist with computed dates from the date the nota de culpa is delivered (deadline values come from `mz-legal.ts`), and let the user start each document pre-filled with the shared data (company, worker, process number).

### 6.2 Search
- Always visible on the catalogue page; `/` shortcut on desktop.
- MiniSearch over title, formal title, summary and tags, with title boosted.
- Accent- and case-insensitive (normalise NFD and strip diacritics both when indexing and querying): "rescisao", "rescisão", "RESCISAO" all match.
- Fuzzy (≈0.2) and prefix matching; results as you type, no submit needed.
- Rich tags per document: synonyms, common speech and English ("despedir", "mandar embora", "fire", "dismiss", "payslip", "talão", "folha de salário").
- Empty state suggests the guided assistant and shows the top 6 most used documents.
- Category filter chips under the search field.

---

## 7. Customisation (the core of the product)

### 7.1 Profiles
Multiple saved profiles, switchable from the header. Two kinds:

**Empresa:** nome / firma, nome comercial, NUIT, NUEL, nº de inscrição no INSS, alvará / licença (optional), capital social (optional), sede (avenida/rua, nº, bairro, cidade, província), caixa postal, telefones, email, website, banco + NIB (optional, for receipts), representante legal (nome, cargo), local por defeito (e.g. "Maputo").

**Pessoa:** nome completo, tipo e nº de documento (BI, DIRE, Passaporte) + data e local de emissão, NUIT, estado civil, naturalidade, morada, contactos.

### 7.2 People directory
Saved workers, clients, tenants, etc., reusable to auto-fill any document (nome, cargo, categoria, data de admissão, salário base, NUIT, nº INSS, documento de identificação). Picking a person fills every matching field.

### 7.3 Branding per profile
- Logo (PNG/JPG/SVG → converted to PNG, max 1200 px, keeps aspect ratio, never stretched)
- **Letterhead layout** — 4 presets:
  1. *Clássico* — logo centred, name and details below, thin rule
  2. *Lateral* — logo left, details right-aligned
  3. *Faixa* — full-width uploaded header image (recommended 2480 × 400 px), with safe-area guide
  4. *Mínimo* — name only, details moved to footer
- Uploaded header image and/or footer image
- Background / watermark image with opacity slider (default 6%) and "first page only" option
- Accent colour (constrained palette + custom hex, auto-checked for print contrast)
- Font preset: *Clássico* (Source Serif 4), *Institucional* (Arimo — Arial-metric), *Moderno* (IBM Plex Sans). Embed the fonts in the PDF.
- Footer content: legal line (firma · NUIT · NUEL · capital social), address, contacts — toggle each
- Signature image and stamp (carimbo) image, placed in the signature block, optional per document
- Reference numbering: prefix + year + counter (e.g. `RH/2026/014`), per profile, editable
- Page margins preset: Normal (25/20/25/25 mm) or Estreito; page numbers "Página 1 de 2"

Live preview updates while editing (debounced ~300 ms).

### 7.4 Per-document editing
- Form on the left / preview on the right on desktop; on mobile, **Preencher | Pré-visualizar** tabs with a sticky bottom action bar (Guardar · PDF · Imprimir).
- Required-by-law fields marked "Obrigatório por lei" with a one-line explanation on tap.
- Optional clauses as toggles (e.g. período probatório, cláusula de exclusividade) with plain-language help.
- An "Editar texto" escape hatch per paragraph for users who need to adjust wording, with "Repor original".
- Inline warnings from `template.warnings()` (e.g. deadline shorter than the legal minimum, missing NUIT, salary below configured minimum wage).

---

## 8. Document design rules

- A4, portrait. Body 10.5–11 pt, line-height ~1.4, justified with Portuguese hyphenation, ragged-right option.
- Clear hierarchy: letterhead → Ref./local e data → destinatário → **Assunto:** → corpo → fecho → assinaturas → recebido/anexos.
- Signatures never alone on a new page; keep with at least the last paragraph. Tables repeat header row on page break.
- Header/footer fixed on every page; content never overlaps them.
- Money: `15.000,00 MT` plus extenso "(quinze mil meticais)" where legally meaningful. Implement and unit-test `numeroPorExtenso` for meticais and centavos up to 999 999 999,99.
- Dates in the body: "Maputo, 12 de Outubro de 2026" (capitalised months, as in the Boletim da República).
- Spelling: Mozambican official usage as in the Boletim da República (e.g. "Director", "efectivo", "infracção", "colectivo").
- Formal register used in Mozambique: "Exmo. Senhor / Exma. Senhora", "Com os melhores cumprimentos". **Banned in documents:** filler and AI-sounding phrases ("Espero que esta carta o encontre bem", "É com grande prazer", "Não hesite em contactar").
- Test every template with fixtures: no logo, huge logo, very long company name, three-line address, long worker name, content that spills to page 2 and 3. Snapshot each page to PNG in Playwright and diff.

---

## 9. Legal accuracy

- Primary source: **Lei n.º 13/2023, de 25 de Agosto (Lei do Trabalho)**, in force since 21 February 2024; it revoked Lei n.º 23/2007. Note in the app that facts started before that date may still follow the old law.
- All legal values live in `src/legal/mz-legal.ts`, each with: value, article reference, source URL, `lastVerified` date, `confidence: 'verified' | 'confirm'`. Examples:
  - Worker's deadline to reply to a nota de culpa (secondary sources state 15 days, art. 70 — confirm against the Lei)
  - Notice periods (aviso prévio) for resignation and non-renewal
  - Annual leave entitlement (secondary sources: 12 days in the first year, 30 from the second — confirm)
  - INSS contribution rates — default employee 3%, employer 4%, **must be confirmed with INSS** (sources found online disagree)
  - IRPS withholding table — editable table, default empty until confirmed with AT for the current year
  - Sector minimum wages — editable, dated
- Never invent article numbers. If a value has `confidence: 'confirm'`, show a subtle "Confirme este valor" marker in the editor (never on the printed document).
- Each template shows "Revisto em: <date>" and a short "Base legal" panel in the editor.
- The payslip calculator is an aid: every computed value can be overridden by the user.

---

## 10. Language

- UI fully translated PT / EN with a switch in the header; remember the choice.
- Generated documents are in Portuguese. In EN mode, the editor shows English labels and help text, and a toggle "Show English reading aid" renders a non-printing translation beside each paragraph.
- Optional bilingual PT/EN output for documents commonly needed abroad (Declaração de trabalho, Declaração de rendimentos, Credencial), clearly labelled "Tradução para referência; prevalece a versão em português".

---

## 11. App UI design

Aim: calm, plain, trustworthy — in the spirit of the GOV.UK Design System, USWDS and the gov.br design system.

- UI font: **Public Sans** (or IBM Plex Sans). Generous size: 17–18 px body on mobile.
- Colour: near-black text on white, one restrained deep green as primary, one accent for focus/links, red only for errors. No gradients, no glassmorphism, no purple, no emoji in UI, no decorative illustrations, no stock "hero" imagery.
- Shapes: 2–4 px radius, 1 px borders, strong visible focus ring (3 px, high contrast).
- Layout: max content width ~ 1100 px, 8 px spacing grid, generous whitespace, left-aligned text.
- Copy: short, sentence case, verbs first ("Criar documento", "Guardar", "Descarregar PDF"). No marketing language.
- Pages: Início (search + categories + "Não sei qual preciso") · Documentos (catalogue) · Assistente · Editor · Os meus documentos (history & drafts) · Perfis · Definições · Sobre / aviso legal.
- Mobile: bottom-sheet menus, sticky action bar, 48 px min tap targets, no horizontal scroll at 320 px.
- Dark mode for the app UI only; the document preview always stays paper-white.

---

## 12. Storage, privacy and backup

- Dexie tables: `profiles`, `people`, `documents` (template id, values, status draft/final, ref number, timestamps), `assets` (images as Blobs), `settings`.
- Autosave drafts every few seconds; "Guardado neste dispositivo" indicator.
- **Exportar cópia de segurança** (single JSON file with images embedded) and **Importar** — with merge or replace.
- Show storage used and warn before the browser quota is reached; request persistent storage (`navigator.storage.persist()`).
- "Apagar todos os dados" with confirmation.
- No analytics or third-party scripts by default.

---

## 13. PDF and print

- **Descarregar PDF**: file name `<tipo>-<pessoa>-<AAAA-MM-DD>.pdf`, PDF metadata (title, author = profile name).
- **Imprimir**: print the generated PDF blob (hidden iframe on desktop; on iOS/Android open the PDF so the native share/print sheet is used).
- **Partilhar** (Web Share API where supported) — useful for WhatsApp.
- Lazy-load the PDF engine and fonts only when the editor opens.

---

## 14. Accessibility and performance

- WCAG 2.2 AA: labels on every field, error summary at the top of forms, keyboard-complete, screen-reader tested on the guide and editor.
- Initial JS under ~200 KB gzipped (PDF engine excluded, lazy-loaded). Lighthouse ≥ 90 on a mid-range Android profile.
- Works offline after first load.

---

## 15. Build order

1. Design tokens + UI components + layout shell + i18n
2. Template model, block renderers, one letterhead layout, PDF + pdf.js preview, print/download
3. Profiles, branding, people, Dexie storage, backup/restore
4. Phase A templates (start with: Recibo de salário, Declaração de trabalho, Contrato sem data de fim, Nota de culpa, Certificado de trabalho)
5. Search + catalogue + guided assistant + processes
6. Remaining letterhead layouts, phase B templates
7. Visual regression suite, a11y pass, PWA, performance budget

## 16. Acceptance criteria

- Every template renders without overflow across all fixtures and all 4 letterhead layouts (Playwright snapshots green).
- Preview, downloaded PDF and printed output are identical A4.
- Searching "despedir", "rescisao" or "payslip" returns the right document in the top 3.
- The guided assistant reaches a recommended document in ≤ 4 taps for every branch.
- A full profile with logo, header and stamp survives reload, export and import.
- Every legal value in templates comes from `mz-legal.ts`; none is hard-coded.
- No banned phrases in any template (unit test greps for them).
