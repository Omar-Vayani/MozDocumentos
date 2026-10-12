// Persisted entities. Everything is stored on the device (IndexedDB via Dexie).

export type LetterheadLayout = 'classico' | 'lateral' | 'faixa' | 'minimo' | 'moderno' | 'elegante';
export type FontPreset = 'classico' | 'institucional' | 'moderno';
export type MarginPreset = 'normal' | 'estreito';

export type Branding = {
  layout: LetterheadLayout;
  logoAssetId?: string;
  headerAssetId?: string;
  footerAssetId?: string;
  watermarkAssetId?: string;
  watermarkOpacity: number; // 0–1, default 0.06
  watermarkFirstPageOnly: boolean;
  accent: string; // hex
  font: FontPreset;
  footer: { legal: boolean; address: boolean; contacts: boolean };
  signatureAssetId?: string;
  stampAssetId?: string;
  margins: MarginPreset;
  pageNumbers: boolean;
  textAlign: 'justify' | 'left';

  // Added in v1.1 — optional so profiles saved earlier keep working.
  /** Size multipliers for images (1 = default size). */
  logoScale?: number;
  signatureScale?: number;
  stampScale?: number;
  /** Short line under the name in the letterhead (e.g. activity or slogan). */
  tagline?: string;
  /** Free text line at the bottom of every page (e.g. registration details). */
  footerNote?: string;
  /** Body text size and line spacing. */
  textSize?: TextSize;
  lineSpacing?: LineSpacing;
  /** Use the accent colour for titles and headings (otherwise near-black). */
  accentHeadings?: boolean;
  /** Thin frame around every page. */
  pageBorder?: boolean;
};

export type TextSize = 'pequeno' | 'normal' | 'grande';
export type LineSpacing = 'compacto' | 'normal' | 'amplo';

/** Per-document presentation choices (stored with the document in values.__presentation). */
export type Presentation = {
  showSignature?: boolean;
  showStamp?: boolean;
  signatureScale?: number;
  stampScale?: number;
  textSize?: TextSize;
  lineSpacing?: LineSpacing;
  /** Large diagonal text on every page, e.g. CÓPIA, RASCUNHO, CONFIDENCIAL. */
  watermarkText?: string;
};

export type Numbering = {
  prefix: string; // "RH"
  year: number;
  counter: number; // last number used
  digits: number; // padding
};

export type Address = {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  provincia?: string;
};

export type ProfileKind = 'empresa' | 'pessoa';

export type Profile = {
  id: string;
  kind: ProfileKind;
  createdAt: number;
  updatedAt: number;

  // Empresa
  firma?: string;
  nomeComercial?: string;
  nuit?: string;
  nuel?: string;
  inss?: string;
  alvara?: string;
  capitalSocial?: string;
  morada: Address;
  caixaPostal?: string;
  telefones?: string;
  email?: string;
  website?: string;
  banco?: string;
  nib?: string;
  representanteNome?: string;
  representanteCargo?: string;
  localPadrao?: string;

  // Pessoa
  nome?: string;
  genero?: 'M' | 'F';
  docTipo?: 'BI' | 'DIRE' | 'Passaporte';
  docNumero?: string;
  docEmissao?: string; // ISO
  docLocal?: string;
  estadoCivil?: string;
  naturalidade?: string;
  nacionalidade?: string;

  branding: Branding;
  numbering: Numbering;
};

export type PersonRole = 'trabalhador' | 'cliente' | 'inquilino' | 'senhorio' | 'representante' | 'outro';

export type Person = {
  id: string;
  role: PersonRole;
  nome: string;
  genero?: 'M' | 'F' | '';
  cargo?: string;
  categoria?: string;
  departamento?: string;
  dataAdmissao?: string; // ISO
  salarioBase?: string;
  nuit?: string;
  inss?: string;
  docTipo?: 'BI' | 'DIRE' | 'Passaporte' | '';
  docNumero?: string;
  docEmissao?: string;
  docLocal?: string;
  estadoCivil?: string;
  naturalidade?: string;
  nacionalidade?: string;
  morada?: string;
  telefone?: string;
  email?: string;
  banco?: string;
  nib?: string;
  notas?: string;
  createdAt: number;
  updatedAt: number;
};

export type DocumentStatus = 'draft' | 'final';

export type SavedDocument = {
  id: string;
  templateId: string;
  profileId?: string;
  caseId?: string;
  status: DocumentStatus;
  ref?: string;
  title: string; // plain title at save time
  personName?: string;
  values: Record<string, unknown>;
  /** Per-paragraph wording overrides ("Editar texto"). */
  overrides: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

/** A running process (e.g. disciplinary procedure) sharing data between documents. */
export type Case = {
  id: string;
  processId: string;
  title: string;
  startDate: string; // ISO — e.g. date the nota de culpa was delivered
  shared: Record<string, unknown>;
  /** Document ids created for each process step. */
  docs?: Record<string, string>;
  profileId?: string;
  createdAt: number;
  updatedAt: number;
};

export type Asset = {
  id: string;
  kind: 'logo' | 'header' | 'footer' | 'watermark' | 'signature' | 'stamp';
  blob: Blob;
  type: string; // mime
  width: number;
  height: number;
  createdAt: number;
};

export type SettingRow = { key: string; value: unknown };

export const DEFAULT_BRANDING: Branding = {
  layout: 'classico',
  watermarkOpacity: 0.06,
  watermarkFirstPageOnly: false,
  accent: '#1f4e3d',
  font: 'classico',
  footer: { legal: true, address: true, contacts: true },
  margins: 'normal',
  pageNumbers: true,
  textAlign: 'justify',
  logoScale: 1,
  signatureScale: 1,
  stampScale: 1,
  textSize: 'normal',
  lineSpacing: 'normal',
  accentHeadings: true,
  pageBorder: false,
};

export function newProfile(kind: ProfileKind, id: string): Profile {
  const now = Date.now();
  return {
    id,
    kind,
    createdAt: now,
    updatedAt: now,
    morada: { cidade: 'Maputo', provincia: 'Maputo Cidade' },
    localPadrao: 'Maputo',
    branding: { ...DEFAULT_BRANDING, footer: { ...DEFAULT_BRANDING.footer } },
    numbering: { prefix: kind === 'empresa' ? 'RH' : 'DOC', year: new Date().getFullYear(), counter: 0, digits: 3 },
  };
}

export function profileDisplayName(p: Profile | null | undefined): string {
  if (!p) return '';
  return (p.kind === 'empresa' ? p.firma || p.nomeComercial : p.nome) || '';
}
