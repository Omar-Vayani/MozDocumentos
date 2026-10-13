// The document template model. Templates are typed data: they declare fields,
// computed values, warnings and an ordered list of content blocks. Layout and
// styling come from the shared block renderers and the profile's letterhead.
//
// Templates must never import @react-pdf — they run on the main thread for the
// editor (fields, warnings, paragraph list) and in the PDF worker for rendering.

import type { LegalRefId, LegalTable } from '@/legal/mz-legal';
import type { Profile, Person } from '@/lib/storage/types';

export type L10n = { pt: string; en: string };
export type Values = Record<string, any>;

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'month' // YYYY-MM
  | 'money'
  | 'number'
  | 'select'
  | 'radio'
  | 'toggle'
  | 'email'
  | 'tel'
  | 'lines'; // repeatable rows (e.g. payslip items, annexes)

/** Keys of a saved Person that can auto-fill a field. */
export type PersonKey = keyof Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export type FieldOption = { value: string; label: L10n };

export type FieldDef = {
  /** Flat key into Values. Use camelCase with a role prefix: 'trabalhadorNome'. */
  name: string;
  type: FieldType;
  label: L10n;
  help?: L10n;
  placeholder?: L10n;
  required?: boolean;
  /** Marks the field as required by law, with a one-line explanation. */
  legal?: L10n;
  options?: FieldOption[];
  default?: string | number | boolean | Record<string, unknown>[] | ((ctx: DefaultsContext) => unknown);
  /** Hide the field unless this returns true. */
  showIf?: (v: Values) => boolean;
  /** Section id (see Template.sections). */
  section?: string;
  width?: 'full' | 'half' | 'third';
  /** When a saved person is picked for this field's section, copy this person key. */
  personKey?: PersonKey;
  /** For money/number fields that the template computes: name of the computed key shown as default. */
  computedKey?: string;
  /** For type 'lines': the columns of each row. */
  columns?: FieldDef[];
  /** For type 'lines': label of the add button. */
  addLabel?: L10n;
  min?: number;
  max?: number;
  rows?: number; // textarea height
};

export type SectionDef = {
  id: string;
  title: L10n;
  description?: L10n;
  /** If set, a "Escolher pessoa guardada" picker fills this section's fields. */
  personRole?: 'trabalhador' | 'cliente' | 'inquilino' | 'senhorio' | 'representante' | 'outro';
};

export type DefaultsContext = {
  profile: Profile | null;
  today: string; // ISO
  nextRef: string;
};

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/**
 * Paragraph text supports `**bold**` inline markup. Use `\n` for line breaks.
 * Every editable paragraph needs a stable `id` so the user's wording override
 * ("Editar texto") can be stored against it.
 */
type BlockBase = {
  /** Keep this block on the same page as the next one (e.g. closing + signatures). */
  keepWithNext?: boolean;
};

export type ParagraphBlock = BlockBase & {
  type: 'paragraph';
  id: string;
  text: string;
  /** Plain English reading aid (never printed unless bilingual output is on). */
  en?: string;
  align?: 'justify' | 'left' | 'center' | 'right';
  indent?: boolean;
  /** Set false for paragraphs whose wording must not be changed (e.g. statutory text). */
  editable?: boolean;
  size?: 'normal' | 'small';
};

export type ClauseItem = {
  id: string;
  /** e.g. "Objecto" — rendered as "Cláusula Primeira (Objecto)" or "1. Objecto" */
  heading?: string;
  text: string;
  en?: string;
  /** Sub-items rendered as a), b), c) … */
  items?: string[];
};

export type Block =
  | (BlockBase & { type: 'title'; text: string; subtitle?: string })
  | (BlockBase & { type: 'reference'; ref?: string; place?: string; date?: string; align?: 'left' | 'right' })
  | (BlockBase & {
      type: 'recipient';
      salutation?: string; // "Exmo. Senhor" / "Exma. Senhora" / "À"
      lines: string[];
      label?: string; // e.g. "A:" / "Destinatário"
    })
  | (BlockBase & { type: 'subject'; text: string; label?: string })
  | (BlockBase & { type: 'salutation'; text: string })
  | ParagraphBlock
  | (BlockBase & { type: 'heading'; text: string; align?: 'left' | 'center' })
  | (BlockBase & {
      type: 'numberedClauses';
      style: 'clausula' | 'numeric' | 'artigo';
      items: ClauseItem[];
      /** First number (default 1): lets articles continue across chapters. */
      start?: number;
    })
  | (BlockBase & {
      type: 'table';
      columns: { label: string; width?: number; align?: 'left' | 'right' | 'center' }[];
      rows: string[][];
      /** Rows rendered in bold with a top rule (totals). */
      totals?: string[][];
      caption?: string;
      note?: string;
    })
  | (BlockBase & {
      type: 'keyValue';
      title?: string;
      items: { label: string; value: string }[];
      columns?: 1 | 2;
    })
  | (BlockBase & { type: 'amount'; label: string; value: number | null; extenso?: boolean })
  | (BlockBase & {
      type: 'signatures';
      /** Place and date line above the signatures, e.g. "Maputo, 12 de Outubro de 2026". */
      placeDate?: string;
      columns: SignatureColumn[];
    })
  | (BlockBase & {
      type: 'acknowledgement';
      text?: string; // default "Recebi o original em ___/___/______"
      signer?: string; // "O Trabalhador"
    })
  | (BlockBase & { type: 'annexList'; title?: string; items: string[] })
  | (BlockBase & { type: 'list'; items: string[]; style?: 'bullet' | 'alpha' | 'numeric' })
  | (BlockBase & { type: 'checklist'; items: { label: string; checked: boolean }[] })
  | (BlockBase & { type: 'note'; text: string; en?: string })
  | (BlockBase & { type: 'spacer'; size?: 'small' | 'medium' | 'large' })
  /**
   * Court filing heading: the judge addressed at the top and, for filings in a
   * pending case, the process number above it.
   */
  | (BlockBase & { type: 'courtHeader'; addressee: string; processo?: string; extra?: string })
  /**
   * Numbered articles of a court filing ("1.º", "2.º"…). Numbering runs on
   * across sections; each section may have a heading ("I — DOS FACTOS").
   */
  | (BlockBase & { type: 'articulado'; sections: { heading?: string; items: string[] }[]; start?: number })
  /**
   * A ruled box: the superior's "Despacho" on an informação, "Reservado ao
   * notário", "Para uso dos serviços"… `lines` adds blank lines to write on.
   */
  | (BlockBase & {
      type: 'box';
      label: string;
      text?: string;
      lines?: number;
      dashed?: boolean;
      width?: 'full' | 'half';
      align?: 'left' | 'right';
    })
  /** Small uppercase labels such as URGENTE or CONFIDENCIAL, right-aligned. */
  | (BlockBase & { type: 'tags'; items: string[] })
  | (BlockBase & { type: 'pageBreakHint' });

export type SignatureColumn = {
  /** "O Empregador", "O Trabalhador", "O Outorgante" */
  role: string;
  name?: string;
  detail?: string; // cargo / documento
  /** Place the profile's signature and/or stamp image in this column. */
  image?: 'signature' | 'stamp' | 'both';
};

export type BlockType = Block['type'];

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export type Warning = {
  level: 'info' | 'warning' | 'error';
  message: L10n;
  field?: string;
};

export type LegalSnapshot = {
  /** Resolve any legal value (with user overrides applied). */
  value: <T = number>(id: LegalRefId) => T;
  table: (id: LegalRefId) => LegalTable;
};

export type TemplateContext = {
  values: Values;
  computed: Record<string, any>;
  /** The issuing profile (company or individual). */
  profile: Profile | null;
  legal: LegalSnapshot;
  today: string;
  /** Formatted place line: profile default location or the value of `local`. */
  place: string;
};

/**
 * Document family: a group of documents that share page conventions. The
 * renderer adjusts spacing, indentation and decoration per family, so every
 * contract, court filing or official letter looks the same. See docs/TEMPLATES.md.
 */
export type DocumentFamily =
  | 'carta' // letters and notices (default)
  | 'contrato' // contracts and agreements: parties, clauses, initials on each page
  | 'declaracao' // declarations, certificates, attestations
  | 'peca' // court filings: plain, 1.5 spacing, indented paragraphs, binding margin
  | 'oficio' // public administration correspondence
  | 'acta' // minutes and resolutions
  | 'mapa' // tables and forms: payroll, leave plans, registers
  | 'recibo'; // receipts and payslips

/**
 * Where the document is presented. Documents filed with a court, a registry,
 * a notary or a public body carry no third-party marks and no decoration
 * (background images, page borders, coloured headings).
 */
export type OfficialUse = 'tribunal' | 'estado' | 'notario' | 'registo';

export type DocumentTemplate = {
  id: string;
  /** Page conventions (default 'carta'). */
  family?: DocumentFamily;
  /** Set when the document is filed with a court, registry, notary or public body. */
  official?: OfficialUse;
  /** Field sections, rendered in order as form fieldsets. */
  sections: SectionDef[];
  fields: FieldDef[];
  /** Optional clauses shown as toggles in the editor (they are regular toggle fields). */
  computed?: (v: Values, ctx: Omit<TemplateContext, 'computed'>) => Record<string, any>;
  blocks: (ctx: TemplateContext) => Block[];
  warnings?: (v: Values, ctx: TemplateContext) => Warning[];
  /** Name for the downloaded file: "<tipo>-<pessoa>-<data>.pdf" uses this as <pessoa>. */
  personName?: (v: Values) => string | undefined;
  /** Document date (ISO) used in the file name. */
  documentDate?: (v: Values) => string | undefined;
  /**
   * Print the issuing profile's letterhead. Set false for documents written by
   * an individual to an organisation (e.g. a worker's resignation letter).
   * Default true.
   */
  letterhead?: boolean;
};

export function defineTemplate(t: DocumentTemplate): DocumentTemplate {
  return t;
}

// Helpers for template authors ------------------------------------------------

export const l = (pt: string, en: string): L10n => ({ pt, en });

/** Ordinal words for "Cláusula Primeira", "Segunda"… */
export const ORDINAIS_F = [
  'Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava', 'Nona', 'Décima',
  'Décima Primeira', 'Décima Segunda', 'Décima Terceira', 'Décima Quarta', 'Décima Quinta',
  'Décima Sexta', 'Décima Sétima', 'Décima Oitava', 'Décima Nona', 'Vigésima',
  'Vigésima Primeira', 'Vigésima Segunda', 'Vigésima Terceira', 'Vigésima Quarta', 'Vigésima Quinta',
];
export const ORDINAIS_M = ORDINAIS_F.map((s) => s.replace(/a\b/g, 'o'));
