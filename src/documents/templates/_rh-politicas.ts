// Shared helpers for the HR policy documents (regulamento interno, códigos e
// políticas), workplace records and the letters exchanged between employer,
// employees and union bodies.

import type { LegalRefId } from '@/legal/mz-legal';
import type { Block, ClauseItem, DefaultsContext, FieldDef, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, cite, dateLong, employerName, employerSignature, exmo, g, GENERO_OPTIONS, isF, l, placeDate, workerFields } from './_shared';
import { str } from './_pessoal-rh';

export { str };

// ---------------------------------------------------------------- Text helpers

/** "nos termos do art. 62.º da Lei…", "nos termos dos arts. …", "nos termos da Lei n.º …" / "do Código Civil". */
export function nosTermos(id: LegalRefId): string {
  const c = cite(id);
  if (c.startsWith('arts.')) return `nos termos dos ${c}`;
  if (c.startsWith('art.')) return `nos termos do ${c}`;
  return /^(Código|Regulamento|Decreto)/.test(c) ? `nos termos do ${c}` : `nos termos da ${c}`;
}

/** "(art. 62.º da Lei n.º 13/2023)" for parenthetical references. */
export const refCite = (id: LegalRefId) => `(${cite(id)})`;

/** Ensures a final full stop on user text. */
export const ponto = (s: string) => {
  const t = s.trim();
  return !t ? t : /[.!?:]$/.test(t) ? t : `${t}.`;
};

/** Lines of a textarea (one per line or separated by ";"), without bullets or final punctuation. */
export function linhas(x: unknown): string[] {
  return String(x ?? '')
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)]|[a-z]\))\s*/i, '').trim().replace(/[.;,]+$/, ''))
    .filter(Boolean);
}

/** "a), b)…" sub-items with ";" and a final "." */
export function alineas(items: string[]): string[] {
  const clean = items.map((s) => s.trim().replace(/[.;,:]+$/, '')).filter(Boolean);
  return clean.map((s, i) => `${s}${i === clean.length - 1 ? '.' : ';'}`);
}

/** Numbered paragraphs inside one article: "1. …\n2. …". */
export const numerados = (parts: string[]) => {
  const p = parts.filter(Boolean);
  return p.length === 1 ? p[0] : p.map((t, i) => `${i + 1}. ${t}`).join('\n');
};

/** The issuing company's short name for the body of a policy ("a Empresa" after the first mention). */
export const empresa = (ctx: TemplateContext) => employerName(ctx);

// ---------------------------------------------------------------- Policy documents

export const APROVACAO_SECTION = { id: 'aprovacao', title: l('Aprovação e entrada em vigor', 'Approval and entry into force') };

/**
 * Approval fields shared by the policies: who approves, when, the union
 * consultation (when the law requires it) and the entry into force.
 */
export function aprovacaoFields(opts: { consulta?: boolean; comunicacao?: boolean } = {}): FieldDef[] {
  const s = 'aprovacao';
  const f: FieldDef[] = [
    { name: 'dataAprovacao', type: 'date', section: s, width: 'half', required: true, label: l('Data de aprovação', 'Approval date'), default: (c) => c.today },
    { name: 'dataVigor', type: 'date', section: s, width: 'half', label: l('Entra em vigor em', 'In force from'), help: l('Se ficar em branco, entra em vigor na data da divulgação.', 'If blank, it takes effect when published to staff.') },
    {
      name: 'aprovadorNome',
      type: 'text',
      section: s,
      width: 'half',
      label: l('Quem aprova (nome)', 'Approved by (name)'),
      default: (c: DefaultsContext) => c.profile?.representanteNome || (c.profile?.kind === 'pessoa' ? c.profile.nome : '') || '',
    },
    { name: 'aprovadorCargo', type: 'text', section: s, width: 'half', label: l('Cargo', 'Position'), default: (c: DefaultsContext) => c.profile?.representanteCargo || 'Director-Geral' },
  ];
  if (opts.consulta) {
    f.push(
      {
        name: 'orgaoConsultado',
        type: 'select',
        section: s,
        label: l('Órgão sindical consultado', 'Union body consulted'),
        default: 'comite',
        options: [
          { value: 'comite', label: l('Comité sindical da empresa', 'Company union committee') },
          { value: 'delegado', label: l('Delegado sindical', 'Union delegate') },
          { value: 'sindicato', label: l('Sindicato do ramo (não há comité na empresa)', 'Sector union (no committee in the company)') },
          { value: 'comissao', label: l('Comissão de trabalhadores', 'Workers’ committee') },
        ],
      },
      { name: 'dataConsulta', type: 'date', section: s, width: 'half', label: l('Data do pedido de parecer', 'Date the opinion was requested'), legal: l('A consulta prévia do órgão sindical é obrigatória.', 'Prior consultation of the union body is mandatory.') },
      { name: 'dataParecer', type: 'date', section: s, width: 'half', label: l('Data do parecer recebido (se houver)', 'Date of the opinion received (if any)') },
    );
  }
  if (opts.comunicacao) {
    f.push(
      { name: 'entidadeTrabalho', type: 'text', section: s, width: 'half', label: l('Órgão da administração do trabalho', 'Labour administration office'), default: 'Direcção Provincial do Trabalho' },
      { name: 'dataComunicacao', type: 'date', section: s, width: 'half', label: l('Data da comunicação', 'Date notified') },
    );
  }
  f.push({
    name: 'declaracaoRecepcao',
    type: 'toggle',
    section: s,
    default: true,
    label: l('Incluir declaração de recepção para o trabalhador assinar', 'Include an acknowledgement slip for the employee'),
    help: l('Talão destacável: o trabalhador declara que recebeu e leu o documento. Guarde-o no processo individual.', 'Tear-off slip: the employee confirms receiving and reading the document. Keep it in the personnel file.'),
  });
  return f;
}

export const ORGAO: Record<string, string> = {
  comite: 'o comité sindical da empresa',
  delegado: 'o delegado sindical',
  sindicato: 'o órgão sindical competente',
  comissao: 'a comissão de trabalhadores',
};

/**
 * The last article of a policy: approval, union consultation, notice to the
 * labour administration and entry into force. `sujeito` is "O presente
 * regulamento" or "A presente política" (`fem` for agreement).
 */
export function vigorClause(
  ctx: TemplateContext,
  o: { sujeito: string; fem?: boolean; consulta?: boolean; comunicacao?: boolean; extra?: string[] },
): ClauseItem {
  const v = ctx.values;
  const a = (m: string, f: string) => (o.fem ? f : m);
  const parts: string[] = [];
  parts.push(`${o.sujeito} foi ${a('aprovado', 'aprovada')} por ${str(v.aprovadorNome) || BLANK}${str(v.aprovadorCargo) ? `, ${str(v.aprovadorCargo)}` : ''}, em ${dateLong(v.dataAprovacao)}.`);
  if (o.consulta) {
    const orgao = ORGAO[v.orgaoConsultado as string] ?? ORGAO.comite;
    parts.push(
      `A sua entrada em vigor foi precedida de consulta ${orgao.replace(/^o /, 'ao ').replace(/^a /, 'à ')}, a quem foi pedido parecer em ${dateLong(v.dataConsulta)}${v.dataParecer ? `, tendo o parecer sido emitido em ${dateLong(v.dataParecer)}` : ''}.`,
    );
  }
  if (o.comunicacao) {
    parts.push(`${o.sujeito} foi ${a('comunicado', 'comunicada')} ${deOrgao(str(v.entidadeTrabalho) || 'Direcção Provincial do Trabalho')} em ${dateLong(v.dataComunicacao)}.`);
  }
  parts.push(
    `${o.sujeito} entra em vigor ${v.dataVigor ? `em ${dateLong(v.dataVigor)}` : 'na data da sua divulgação'} e é ${a('divulgado', 'divulgada')} a todos os trabalhadores por afixação nos locais de trabalho, sendo entregue cópia a quem a pedir.`,
  );
  parts.push(...(o.extra ?? []));
  return {
    id: 'vigor',
    heading: 'Aprovação e entrada em vigor',
    text: numerados(parts),
    en: 'Approval, union consultation, notice to the labour administration and entry into force; the document is posted at the workplace and copies are given on request.',
  };
}

/** "ao/à" + entity, guessing the article from the first word. */
export function deOrgao(nome: string, prep: 'a' | 'de' = 'a'): string {
  const fem = /^(direc[cç][aã]o|inspec[cç][aã]o|delega[cç][aã]o|comiss[aã]o|administra[cç][aã]o|empresa|associa[cç][aã]o|seguradora|companhia)/i.test(nome.trim());
  if (prep === 'a') return `${fem ? 'à' : 'ao'} ${nome}`;
  return `${fem ? 'da' : 'do'} ${nome}`;
}

/** Signature of the approving manager under a policy. */
export function aprovadorSignature(ctx: TemplateContext, role = 'A Administração'): SignatureColumn {
  const v = ctx.values;
  const base = employerSignature(ctx, role);
  return { ...base, name: str(v.aprovadorNome) || base.name, detail: str(v.aprovadorCargo) || base.detail };
}

/** Tear-off acknowledgement slip for the employee. */
export function recepcaoBox(titulo: string): Block {
  return {
    type: 'box',
    label: 'Declaração de recepção',
    dashed: true,
    text: `Declaro que recebi ${titulo}, que o li e que tomei conhecimento do seu conteúdo.\nNome: ________________________________________   N.º / Departamento: ____________________\nData: ___/___/______        Assinatura: ________________________________________`,
  };
}

/**
 * A complete policy: title, optional preamble, articles, approval article
 * (kept with the signature) and the optional acknowledgement slip.
 */
export function policyBlocks(
  ctx: TemplateContext,
  o: { titulo: string; preambulo?: { text: string; en: string }; artigos: ClauseItem[]; vigor: ClauseItem; recepcao: string; signatario?: string },
): Block[] {
  const nome = empresa(ctx);
  const blocks: Block[] = [{ type: 'title', text: o.titulo, subtitle: nome !== BLANK ? nome : undefined }];
  if (o.preambulo) blocks.push({ type: 'paragraph', id: 'preambulo', text: o.preambulo.text, en: o.preambulo.en });
  blocks.push({ type: 'numberedClauses', style: 'artigo', items: o.artigos });
  blocks.push({ type: 'numberedClauses', style: 'artigo', items: [o.vigor], start: o.artigos.length + 1, keepWithNext: true });
  blocks.push({ type: 'signatures', placeDate: placeDate(ctx, ctx.values.dataAprovacao), columns: [aprovadorSignature(ctx, o.signatario)] });
  if (ctx.values.declaracaoRecepcao !== false) blocks.push(recepcaoBox(o.recepcao));
  return blocks;
}

// ---------------------------------------------------------------- Letters from the employer to an employee

/** Reference, addressee (the employee), subject and salutation. */
export function cartaAoTrabalhador(ctx: TemplateContext, assunto: string, prefix = 'trabalhador'): Block[] {
  const v = ctx.values;
  const gen = v[`${prefix}Genero`];
  return [
    { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
    {
      type: 'recipient',
      salutation: exmo(gen),
      lines: [str(v[`${prefix}Nome`]) || BLANK, [str(v[`${prefix}Cargo`]), str(v[`${prefix}Departamento`])].filter(Boolean).join(' — ')].filter(Boolean),
    },
    { type: 'subject', text: assunto },
    { type: 'salutation', text: `${exmo(gen)},` },
  ];
}

/** Closing, employer signature and the employee's receipt. */
export function fechoEmpregador(ctx: TemplateContext, opts: { role?: string; recibo?: string | false; reciboTexto?: string } = {}): Block[] {
  const v = ctx.values;
  const blocks: Block[] = [
    { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
    { type: 'signatures', columns: [employerSignature(ctx, opts.role ?? 'A Entidade Empregadora')] },
  ];
  if (opts.recibo !== false) {
    blocks.push({ type: 'acknowledgement', text: opts.reciboTexto, signer: opts.recibo ?? g(v.trabalhadorGenero, 'O Trabalhador', 'A Trabalhadora') });
  }
  return blocks;
}

// ---------------------------------------------------------------- Letters from an employee to the employer

const empresaDefault = (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : '');

/** The author's fields (worker) with the name defaulted from a personal profile. */
export function autorFields(keys: Parameters<typeof workerFields>[0] = ['nome', 'genero', 'cargo', 'departamento'], section = 'trabalhador'): FieldDef[] {
  return workerFields(keys, section).map((f) =>
    f.name === 'trabalhadorNome'
      ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome || '' : '') }
      : f.name === 'trabalhadorGenero'
        ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.genero || 'M' : 'M') }
        : f,
  );
}

/** Addressee of an employee's letter: company, addressee position and form of address. */
export function destinatarioFields(section = 'empresa', cargo = 'Director de Recursos Humanos'): FieldDef[] {
  return [
    { name: 'empresaNome', type: 'text', section, required: true, label: l('Empresa (entidade empregadora)', 'Employer'), default: empresaDefault },
    { name: 'destinatarioCargo', type: 'text', section, width: 'half', label: l('Cargo do destinatário', "Addressee's position"), default: cargo },
    { name: 'destinatarioGenero', type: 'radio', section, width: 'half', label: l('Tratamento do destinatário', 'Addressee form of address'), options: GENERO_OPTIONS, default: 'M' },
  ];
}

/** Place/date, addressee, subject and salutation of an employee's letter. */
export function cartaDoTrabalhador(ctx: TemplateContext, assunto: string): Block[] {
  const v = ctx.values;
  const dg = v.destinatarioGenero;
  const cargo = str(v.destinatarioCargo) || g(dg, 'Director de Recursos Humanos', 'Directora de Recursos Humanos');
  return [
    { type: 'reference', place: ctx.place, date: dateLong(v.data) },
    { type: 'recipient', salutation: exmo(dg), lines: [cargo, str(v.empresaNome) || BLANK] },
    { type: 'subject', text: assunto },
    { type: 'salutation', text: `${exmo(dg)},` },
  ];
}

/** "Eu, **Nome**, trabalhador desta empresa, com a função de …" */
export function euTrabalhador(v: Values): string {
  const f = isF(v.trabalhadorGenero);
  const funcao = str(v.trabalhadorCargo) ? `, com a função de ${str(v.trabalhadorCargo)}${str(v.trabalhadorDepartamento) ? ` (${str(v.trabalhadorDepartamento)})` : ''}` : '';
  return `Eu, **${str(v.trabalhadorNome) || BLANK}**, ${f ? 'trabalhadora' : 'trabalhador'} desta empresa${funcao}`;
}

/** Decision box for the employer under an employee's request. */
export function despachoBlocks(opcoes: string[], role = 'A Direcção'): Block[] {
  return [
    { type: 'spacer', size: 'small' },
    { type: 'heading', text: 'Despacho', keepWithNext: true },
    { type: 'checklist', keepWithNext: true, items: opcoes.map((label) => ({ label, checked: false })) },
    { type: 'note', text: 'Observações: ____________________________________________________________________________', keepWithNext: true },
    { type: 'signatures', columns: [{ role, detail: 'Data: ___/___/______' }] },
  ];
}

// ---------------------------------------------------------------- Union bodies

export const ORGAO_SINDICAL_OPTIONS = [
  { value: 'comite', label: l('Comité sindical da empresa', 'Company union committee') },
  { value: 'delegado', label: l('Delegado sindical', 'Union delegate') },
  { value: 'sindicato', label: l('Sindicato (direcção)', 'Trade union (executive)') },
  { value: 'comissao', label: l('Comissão de trabalhadores', 'Workers’ committee') },
];

/** "Ao Comité Sindical da …" recipient lines. */
export function orgaoSindicalLinhas(tipo: unknown, nome: unknown, ctx: TemplateContext): string[] {
  const n = str(nome);
  switch (tipo) {
    case 'delegado':
      return [n ? `Delegado Sindical — ${n}` : 'Delegado Sindical', empresa(ctx)];
    case 'sindicato':
      return [n || 'Direcção do Sindicato'];
    case 'comissao':
      return ['Comissão de Trabalhadores', empresa(ctx)];
    default:
      return [n || 'Comité Sindical', empresa(ctx)];
  }
}

// ---------------------------------------------------------------- Chapters

export type Capitulo = { titulo: string; artigos: ClauseItem[] };

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

/**
 * "CAPÍTULO I — …" headings with articles numbered continuously. The last
 * article of the last chapter is kept with what follows (the signature).
 */
export function capitulosBlocks(caps: Capitulo[]): Block[] {
  const out: Block[] = [];
  let n = 1;
  const usados = caps.filter((c) => c.artigos.length);
  usados.forEach((c, i) => {
    out.push({ type: 'heading', text: `CAPÍTULO ${ROMANOS[i] ?? i + 1} — ${c.titulo.toUpperCase()}`, align: 'center' });
    const ultimo = i === usados.length - 1;
    const corpo = ultimo ? c.artigos.slice(0, -1) : c.artigos;
    if (corpo.length) out.push({ type: 'numberedClauses', style: 'artigo', items: corpo, start: n });
    n += corpo.length;
    if (ultimo) {
      out.push({ type: 'numberedClauses', style: 'artigo', items: c.artigos.slice(-1), start: n, keepWithNext: true });
      n += 1;
    }
  });
  return out;
}
