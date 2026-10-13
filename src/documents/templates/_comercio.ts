// Shared building blocks for the day-to-day business documents ("comercio"):
// issuer identification, VAT options, money helpers, the "not an invoice"
// note and the issuer's signature.

import { resolveLegalValue } from '@/legal/mz-legal';
import { formatNumber, roundMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, employerRep, formatMoney, l, money } from './_shared';

export const str = (x: unknown) => String(x ?? '').trim();
export const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
export const num = (x: unknown): number | null => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (typeof x !== 'string' || !x.trim()) return null;
  const n = Number(x.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
export const int = (x: unknown) => {
  const n = num(x);
  return n == null ? null : Math.floor(n);
};
export const rows = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? (v as Record<string, any>[]) : []);

/** Money without the unit, for table cells ("15.000,00"). */
export const fm = (n: number | null | undefined) => (n == null ? '' : formatMoney(n, false));
export const qtyText = (q: number) => formatNumber(q, Number.isInteger(q) ? 0 : 2);

/** "30 dias" from a number the user typed; a blank when missing. */
export const dias = (n: number | null, sing = 'dia', plur = 'dias') => (n == null || n <= 0 ? `${BLANK} ${plur}` : `${n} ${n === 1 ? sing : plur}`);

// ---------------------------------------------------------------- Issuer

export const issuerName = (ctx: TemplateContext) => profileDisplayName(ctx.profile) || BLANK;

/** Licence, alvará or certidão of the establishment, from the profile. */
export const licenceOf = (p: Profile | null | undefined) => str(p?.licenca) || (str(p?.alvara) ? `Alvará n.º ${str(p?.alvara)}` : '');

/**
 * Identification of an individual issuer (no letterhead) as a key-value block;
 * companies are identified by their letterhead.
 */
export function issuerBlock(ctx: TemplateContext, title = 'Emitente'): Block[] {
  const p = ctx.profile;
  if (p?.kind !== 'pessoa') return [];
  const items = [
    { label: 'Nome', value: p.nome || BLANK },
    { label: 'NUIT', value: p.nuit || '' },
    { label: 'Morada', value: addressLine(p) },
    { label: 'Contacto', value: [p.telefones, p.email].filter(Boolean).join(' · ') },
    { label: 'Licença', value: licenceOf(p) },
  ].filter((it) => it.value);
  return [{ type: 'keyValue', title, columns: 2, items }];
}

/** Signature of the issuing business: representative with stamp, or the individual. */
export function issuerSignature(ctx: TemplateContext, role?: string): SignatureColumn {
  const p = ctx.profile;
  const rep = employerRep(ctx);
  if (p?.kind === 'empresa') {
    return { role: role || rep.cargo || profileDisplayName(p) || 'Pela empresa', name: rep.nome || undefined, detail: role && rep.cargo ? rep.cargo : undefined, image: 'both' };
  }
  return { role: role || (p?.genero === 'F' ? 'A Emitente' : 'O Emitente'), name: p?.nome || undefined, image: 'both' };
}

/** "Este documento não é uma factura nem a substitui." */
export function notaNaoFactura(extra = ''): Block {
  return {
    type: 'note',
    text: `**Este documento não é uma factura nem a substitui.**${extra ? ` ${extra}` : ''}`,
    en: 'This document is not an invoice and does not replace one.',
  };
}

// ---------------------------------------------------------------- VAT

export const IVA_OPTIONS: FieldOption[] = [
  { value: 'acrescido', label: l('Preços sem IVA (acresce IVA)', 'Prices exclude VAT (VAT added)') },
  { value: 'incluido', label: l('Preços com IVA incluído', 'Prices include VAT') },
  { value: 'naoAplica', label: l('Sem IVA (isento ou não sujeito)', 'No VAT (exempt or not registered)') },
];

/** VAT rate field (percentage), defaulting to the standard rate. */
export function ivaTaxaField(section: string, showIf: (v: Values) => boolean): FieldDef {
  return {
    name: 'ivaTaxa',
    type: 'number',
    section,
    width: 'half',
    min: 0,
    max: 100,
    label: l('Taxa de IVA (%)', 'VAT rate (%)'),
    help: l('Por defeito, a taxa normal em vigor.', 'Defaults to the current standard rate.'),
    default: () => Math.round(Number(resolveLegalValue('ivaTaxaNormal')) * 10000) / 100,
    showIf,
  };
}

export type ItemLine = { descricao: string; unidade: string; quantidade: number; preco: number | null; total: number };

/** Item lines with quantity × unit price. */
export function itemLines(v: unknown, desc = 'descricao', qty = 'quantidade', unit = 'unidade', price = 'precoUnitario'): ItemLine[] {
  return rows(v)
    .map((r) => {
      const descricao = str(r[desc]);
      const quantidade = num(r[qty]) ?? (descricao ? 1 : 0);
      const preco = money(r[price]);
      return { descricao, unidade: str(r[unit]), quantidade, preco, total: roundMoney(quantidade * (preco ?? 0)) };
    })
    .filter((r) => r.descricao || r.preco != null);
}

/** Subtotal, discount, VAT and total for item lines. */
export function totais(linhas: ItemLine[], descontoPct: number | null, ivaRegime: unknown, ivaTaxa: number | null) {
  const subtotal = roundMoney(linhas.reduce((t, r) => t + r.total, 0));
  const desconto = descontoPct != null && descontoPct > 0 ? roundMoney((subtotal * Math.min(descontoPct, 100)) / 100) : 0;
  const base = roundMoney(subtotal - desconto);
  const taxa = ivaTaxa ?? 0;
  let iva = 0;
  let total = base;
  if (ivaRegime === 'acrescido') {
    iva = roundMoney((base * taxa) / 100);
    total = roundMoney(base + iva);
  } else if (ivaRegime === 'incluido') {
    iva = roundMoney(base - base / (1 + taxa / 100));
  }
  return { subtotal, desconto, base, iva, total };
}

export const ivaLabel = (regime: unknown, taxa: number | null) =>
  regime === 'naoAplica' ? '' : `IVA${taxa != null ? ` (${formatNumber(taxa, Number.isInteger(taxa) ? 0 : 2)}%)` : ''}${regime === 'incluido' ? ', incluído' : ''}`;
