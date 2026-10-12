# Writing a document template

Templates live in `src/documents/templates/<id>.ts`, one file per document. The
file name **is** the id and must match an entry in
`src/features/catalog/catalog.ts` (title, formal title, tags, legal refs,
`bilingual` flag). The catalogue holds metadata; the template file holds the
form fields and the document content.

Reference implementations: `recibo-de-salario.ts` (table, computed values,
warnings) and `nota-de-culpa.ts` (formal letter, legal deadlines,
acknowledgement). Shared helpers: `_shared.ts`.

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
   block. Keep these groups short (closing + signatures only).
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
| `amount` | Money figure in a box + extenso `(quinze mil meticais)` |
| `signatures` | 1–3 columns `{ role, name?, detail?, image?: 'signature'|'stamp'|'both' }`, optional `placeDate`. Use `image: 'both'` for the issuing company's signatory |
| `acknowledgement` | "Recebi o original em ___/___/______" + signer line |
| `annexList` | "Anexos:" numbered list |
| `list` | bullet / alpha / numeric list |
| `checklist` | boxes with X |
| `note` | small muted text |
| `spacer`, `pageBreakHint` | spacing / force a new page |

Typical letter: `reference` → `recipient` → `subject` → `salutation` →
`paragraph`s → closing `paragraph` (`keepWithNext`) → `signatures` →
`acknowledgement` (when the recipient must sign for receipt).

Typical contract: `title` → `paragraph` parties ("Entre: … e …, é celebrado o
presente contrato, que se rege pelas cláusulas seguintes:") →
`numberedClauses` (style `clausula`) → `paragraph` ("Feito em duplicado…",
`keepWithNext`) → `signatures` with both parties.

## Checking your work

```sh
npx vitest run src/documents/templates -t <id>     # structure, wording, legal-value checks
npx vitest run src/documents/render -t <id>        # renders all layouts/fixtures, checks margins
RENDER_OUT=/tmp/pdf npx vitest run src/documents/render -t <id>   # keep PDFs; view with pdftoppm -png -r 60
npx tsc --noEmit -p tsconfig.app.json              # type check
```
