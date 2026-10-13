# Writing a document template

Templates live in `src/documents/templates/<id>.ts`, one file per document. The
file name **is** the id and must match an entry in
`src/features/catalog/catalog.ts` (title, formal title, tags, legal refs,
`bilingual` flag). The catalogue holds metadata; the template file holds the
form fields and the document content.

Reference implementations: `recibo-de-salario.ts` (table, computed values,
warnings) and `nota-de-culpa.ts` (formal letter, legal deadlines,
acknowledgement). Shared helpers: `_shared.ts`.

## Families and official documents (read first)

Every template declares a **family**; the renderer applies that family's page
conventions, so documents of the same kind always look alike. Never style a
template by hand to imitate another family.

| family | for | the renderer does |
|---|---|---|
| `carta` (default) | letters, notices, requests | letterhead, reference line, recipient block |
| `contrato` | contracts, agreements, *termos* | parties + clauses; **Rubricas** line on every page but the last |
| `declaracao` | declarations, certificates, powers of attorney | centred title, short body, signature (+ stamp) |
| `peca` | court filings | plain black, 1.5 spacing, indented justified paragraphs, 30 mm binding margin, blank space for the judge's order |
| `oficio` | public administration correspondence | black headings, no accent rule; with a public-body profile, the "REPÚBLICA DE MOÇAMBIQUE" header and emblem |
| `acta` | minutes, resolutions | as `carta`, numbered points |
| `mapa` | tables and registers (payroll, leave plan) | compact spacing, smaller letterhead, fits one page where possible |
| `recibo` | receipts, payslips | compact; must fit one A4 page with normal data |

Set **`official`** when the document is filed with or presented to a court
(`'tribunal'`), a public body (`'estado'`), a notary (`'notario'`) or a
registry (`'registo'`). Official documents print **no Documentos MZ brand
line** and no decoration: no background image, page border, footer image or
coloured headings. Documents issued by a public-body profile are treated the
same way automatically. Every other document carries the small brand line and
document ID at the foot of each page — do not add your own.

Who issues the document decides the letterhead:
- company/public body issuing → keep the default letterhead;
- an individual or worker writing to an organisation → `letterhead: false`;
- court filings → `letterhead: false` (the lawyer is identified in the
  signature with `lawyerSignature(v)`); a law firm's own letters keep it.

## House style (what "professional" means here)

- **One idea per paragraph**, short sentences, legal precision. Start with the
  substance ("Declara-se que…", "Vem requerer…", "Comunicamos que…").
- **Full identification** of every party the first time it appears: name in
  bold, marital status, nationality, ID document and number with issue date
  and place, NUIT, residence/seat, and the short designation used afterwards
  ("adiante designado por **Comprador**"). Use `workerParty`, `employerParty`,
  `personProfileParty` or the same pattern.
- **Mozambican conventions**: "Exmo. Senhor / Exma. Senhora", "V. Ex.ª",
  "Meritíssimo Juiz", "Pede deferimento.", "Com os melhores cumprimentos,",
  "feito em dois exemplares de igual valor", foro "Tribunal Judicial da
  Cidade de …". Amounts in figures **and** in words (`amount` block or
  `numeroPorExtenso`). Dates "12 de Outubro de 2026".
- **Never invent law.** Article numbers and deadlines only from
  `mz-legal.ts`; anything unverified is added there with `confidence:
  'confirm'` and no article number.
- **Fields mirror the document**: group them in sections in the order they
  appear on the page; pair short fields (`width: 'half'`), keep long text
  full width; every required piece of the document is `required` or has a
  warning when empty.
- **Warnings teach the law**: deadlines, form requirements (certified
  signatures, notary deed, stamp duty), who must receive a copy.
- A short document must fit **one page** with realistic data; check it with
  the preview harness (below).

## Rules

1. **Templates are data.** Never import `@react-pdf/*` or React. Return
   `Block[]` from `blocks(ctx)`. Styling and layout come from the renderers.
2. **No hard-coded legal values.** Deadlines, rates, durations, article
   numbers and law numbers come from `src/legal/mz-legal.ts`:
   - values: `ctx.legal.value<number>('notaCulpaPrazoResposta')`, or
     `legal.value<{ ate3Anos: number }>('avisoPrevioTrabalhador').ate3Anos`
   - citations: `cite('procedimentoDisciplinar')` → `"arts. 65.º a 72.º da Lei n.º 13/2023"`.
   A test greps template sources for `\d+ dias|meses|anos|horas`, `\d+%`,
   `art. \d+` and `Lei n.º x/yyyy` outside `${…}` interpolations and fails.
   If a value you need is missing from `mz-legal.ts`, do not invent it: write the
   sentence without the number (e.g. "no prazo legal") and report the missing value.
3. **Portuguese as used in Mozambique** (Boletim da República spelling):
   "Director", "efectivo", "infracção", "colectivo", "acção", "actividade",
   "contacto", "facto", "óptimo", "exacto", "Outubro" (capitalised months).
   Formal register: "Exmo. Senhor / Exma. Senhora", "V. Ex.ª", closing
   "Com os melhores cumprimentos,". Use plain, precise sentences.
4. **Banned phrases** (test-enforced): "Espero que esta carta o encontre bem",
   "É com grande prazer", "Não hesite em contactar", "Venho por este meio",
   "Sem mais assunto de momento", and any filler of that kind. Start with the
   substance: "Venho requerer…", "Comunicamos que…", "Declara-se que…".
5. **Never print `undefined`, `null` or `NaN`.** Use `blank(v)` / `BLANK`
   (a `____________________` line to fill by hand) for missing values,
   `dateLong(v)` for dates (prints `___ de ____ de ____` when empty) and
   `moneyText(v)` / `formatMoney(n)` for money (`15.000,00 MT`).
6. **Gender agreement.** Person sections include a `…Genero` radio (M/F).
   Use `g(v.trabalhadorGenero, 'o trabalhador', 'a trabalhadora')` and
   `exmo(genero)`.
7. **Keep signatures with the text.** Mark the closing paragraph
   (`"Com os melhores cumprimentos,"` or the last clause) with
   `keepWithNext: true` so it is placed on the same page as the `signatures`
   block. Groups are only made unbreakable when they fit comfortably on a
   page (the renderer estimates their height); a lead-in before a long table
   or list is kept with the start of it instead. Headings and clause titles
   are kept with the text that follows automatically.
8. **Stable paragraph ids.** Every `paragraph` block and every clause item has
   an `id` unique within the template. Users can reword paragraphs ("Editar
   texto"); the override is stored under that id.
9. **English reading aid.** Give paragraphs and clauses an `en` translation
   (plain English). Required for templates marked `bilingual: true` in the
   catalogue (they print it under each paragraph when the user asks).
10. **Line breaks.** `\n` in text is fine (rendered as separate lines). Use
    `splitLines(v.textarea)` to turn a textarea into list items.

## Field conventions

Use the shared field builders where they fit:

```ts
refField()                       // 'ref'  — reference number, default next profile number
localField()                     // 'local' — place, default from profile
dateField('data')                // 'data' — document date, default today
workerFields(['nome', 'genero', 'cargo', 'dataAdmissao'])   // trabalhadorNome, trabalhadorGenero, …
workerFields(['nome', 'genero'], 'inquilino', 'inquilino')  // inquilinoNome, inquilinoGenero (other roles)
```

Names shared across documents (so processes can pre-fill them):
`ref`, `local`, `data`, `processoNumero`, `trabalhador*` (Nome, Genero, Cargo,
Categoria, Departamento, DataAdmissao, Salario, DocTipo, DocNumero, DocEmissao,
DocLocal, Nuit, Inss, Morada, Nacionalidade, EstadoCivil), `dataNotaCulpa`
(date the nota de culpa was delivered), `dataAudicao`, `dataFimContrato`,
`empresaNome` (employer name when the document is written by the worker).

Field types: `text`, `textarea`, `date`, `month`, `money`, `number`,
`select`, `radio`, `toggle`, `email`, `tel`, `lines` (repeatable rows with
`columns`). Options for `select`/`radio` are `{ value, label: l(pt, en) }`.
Every label/help is bilingual: `l('Português', 'English')`.

- `required: true` — needed for a sensible document.
- `legal: l('…', '…')` — marks the field "Obrigatório por lei" with a
  one-line explanation.
- `showIf: (v) => v.tipo === 'x'` — conditional fields.
- `personKey` — copied from a saved person when one is picked for the field's
  section (the section needs `personRole`). `workerFields` sets this for you.
- `default` — a value or `(c) => …` with `c.profile`, `c.today`, `c.nextRef`.
  For documents an individual writes (procuração, requerimento…) default the
  author's fields from a personal profile:
  `default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome : '')`.
- Optional clauses are `toggle` fields (e.g. `periodoProbatorio`,
  `exclusividade`) with a `help` text in plain language.

## Context

`blocks(ctx)` receives `ctx.values` (form values), `ctx.computed` (your
`computed()` result), `ctx.profile` (issuing profile: company or individual,
may be `null`), `ctx.legal`, `ctx.today`, `ctx.place` (resolved place name).
Helpers: `employerName(ctx)`, `employerParty(ctx)` (contract party paragraph),
`workerParty(v)`, `employerSignature(ctx)`, `workerSignature(v)`,
`placeDate(ctx, v.data)`.

Set `letterhead: false` for documents written by an individual to an
organisation (resignation letter, reply to a charge, leave request, absence
justification) — they are not printed on company letterhead.

`warnings(v, ctx)` returns `{ level: 'info'|'warning'|'error', message: l(…), field? }`
— e.g. a deadline shorter than the legal minimum, missing NUIT, a date that
breaks a legal limit. `personName(v)` and `documentDate(v)` name the PDF file.

## Blocks

| type | use |
|---|---|
| `title` | Centred document title (contracts, declarations, receipts). `{ text, subtitle? }` |
| `reference` | `N/Ref.ª` + "Maputo, 12 de Outubro de 2026". `{ ref?, place?, date? }` |
| `recipient` | Addressee block on the right. `{ salutation?, lines[], label? }` |
| `subject` | **Assunto:** line. `{ text }` |
| `salutation` | "Exmo. Senhor," |
| `paragraph` | `{ id, text, en?, align?, size?: 'small', keepWithNext? }` — supports `**bold**` |
| `heading` | Bold section heading inside a document |
| `numberedClauses` | Contract clauses. `style: 'clausula'` → "Cláusula Primeira (Objecto)"; `'numeric'` → "1. Objecto". Items `{ id, heading?, text, en?, items?: string[] }` (sub-items print as a), b)…) |
| `table` | `{ columns: [{label, width?, align?}], rows: string[][], totals?, caption?, note? }` — header row repeats on page breaks |
| `keyValue` | Label/value list, `columns: 1 | 2`, optional `title` |
| `amount` | Money figure in a box + extenso `(quinze mil meticais)`; `value: null` prints a blank to fill in |
| `signatures` | 1–3 columns `{ role, name?, detail?, image?: 'signature'|'stamp'|'both' }`, optional `placeDate`. Use `image: 'both'` for the issuing company's signatory |
| `acknowledgement` | "Recebi o original em ___/___/______" + signer line |
| `annexList` | "Anexos:" numbered list |
| `list` | bullet / alpha / numeric list |
| `checklist` | boxes with X |
| `note` | small muted text |
| `spacer`, `pageBreakHint` | spacing / force a new page |
| `courtHeader` | Court filing heading: `{ addressee, processo?, extra? }` — "Processo n.º …" then the judge addressed ("Exmo. Senhor Juiz de Direito da … Secção do Tribunal Judicial …"), followed by the blank space for the judge's order |
| `articulado` | Numbered articles of a filing: `{ sections: [{ heading?, items: string[] }], start? }` → "1.º", "2.º"… numbering continues across sections ("I — DOS FACTOS", "II — DO DIREITO") |
| `box` | Ruled box: `{ label, text?, lines?, dashed?, width?: 'full'|'half', align? }` — "Despacho" on an informação or requerimento, "Reservado ao notário", "Para uso dos serviços" |
| `tags` | Small labels right-aligned: `{ items: ['URGENTE', 'CONFIDENCIAL'] }` |

Typical letter: `reference` → `recipient` → `subject` → `salutation` →
`paragraph`s → closing `paragraph` (`keepWithNext`) → `signatures` →
`acknowledgement` (when the recipient must sign for receipt).

Typical contract: `title` → `paragraph` parties ("Entre: … e …, é celebrado o
presente contrato, que se rege pelas cláusulas seguintes:") →
`numberedClauses` (style `clausula`) → `paragraph` ("Feito em duplicado…",
`keepWithNext`) → `signatures` with both parties.

Typical court filing (`family: 'peca'`, `official: 'tribunal'`,
`letterhead: false`): `courtHeader` → `paragraph` identifying the party and
the action ("**A**, …, vem propor contra **B**, … a presente acção
declarativa de condenação, sob a forma de processo …, nos termos e com os
fundamentos seguintes:") → `articulado` → `paragraph` "Nestes termos e nos
melhores de Direito…" → `paragraph` "Valor: …" / "Junta: …" → `signatures`
with `lawyerSignature(v)` and `placeDate`.

Typical public-body document (`family: 'oficio'`, `official: 'estado'`):
`tags` (classification, urgency) → `reference` with `officialRef(ctx, 'Ofício', v.numero)`
→ `recipient` → `subject` → body → closing → `signatures` (role "O Director
Provincial", name, category) → `paragraph` "C/c: …" (small).

Lawyer and public-body helpers: `lawyerFields()`, `lawyerSignature(v)`,
`entityName(ctx)`, `officialRef(ctx, kind, numero)` in `_shared.ts`.

Shared helpers for employment contracts (clauses, field groups, text
helpers such as `doCite`, `qty`, `moneyExt`) live in `_contrato-trabalho.ts`.
Files starting with `_` are not templates.

## Checking your work

```sh
npx vitest run src/documents/templates -t <id>     # structure, wording, legal-value checks
npx vitest run src/documents/render -t <id>        # renders all layouts/fixtures, checks margins
RENDER_OUT=/tmp/pdf npx vitest run src/documents/render -t <id>   # keep PDFs; view with pdftoppm -png -r 60
npx tsc --noEmit -p tsconfig.app.json              # type check
```

Design preview with realistic data: add a sample for your template to
`src/documents/render/samples/<category>.ts` (export `SAMPLES: Sample[]`;
issuers `company()`, `publicBody()`, `lawyer()`, `person()` come from
`samples/_profiles.ts`):

```sh
PREVIEW_OUT=/tmp/preview PREVIEW_ONLY=<id> npx vitest run src/documents/render/preview.test.tsx
pdftoppm -png -r 60 /tmp/preview/<id>.pdf /tmp/preview/<id>
```

## Adding a document — checklist

1. Catalogue entry in `catalog.ts` (category, audience, plain title, formal
   title, summary, search tags in PT and EN, `legalRefs`).
2. `src/documents/templates/<id>.ts` with `family`, `official` if filed with
   an authority, sections, fields, `blocks`, `warnings`, `personName`,
   `documentDate`.
3. Missing legal values added to `mz-legal.ts` (verified or `confirm`).
4. Template and render tests pass for the id; preview looks right with
   realistic data; a short document fits one page.
