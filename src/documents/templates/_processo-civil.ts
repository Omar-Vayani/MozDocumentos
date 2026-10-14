// Shared pieces for the civil procedure filings (processo civil): case and court
// fields, short party fields, the opening of a new action or of a filing in a
// pending case, and the closing (pedido, valor, junta, rol, signature).

import type { Block, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, GENERO_OPTIONS, l, lawyerSignature, placeDate, splitLines } from './_shared';
import { FECHO_OPTIONS, PARTE_TIPO_OPTIONS, courtAddressee, courtFields, documentosList, juntaText, linePara, moneyExt, nomeParte, papel, parteF, partyDesc } from './_advocacia';

// ---------------------------------------------------------------- Text helpers

export const str = (x: unknown) => String(x ?? '').trim();
/** Text without a trailing full stop, to embed in a sentence. */
export const sem = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
/** Text or a blank line. */
export const ou = (x: unknown, b = BLANK) => sem(x) || b;
/** First letter lower case, unless the word is an acronym or a proper name in capitals. */
export const minuscula = (s: string) => (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/** First letter upper case. */
export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "no artigo 4.º" / "nos artigos 4.º a 9.º" */
export const nosArtigos = (a: string) => (/\s(a|e)\s|,/.test(a) ? `nos artigos ${a}` : `no artigo ${a}`);

/** Lines of a textarea as pedido items: "…;" and the last one "…." is added by `closing`. */
export const linhas = (x: unknown) => splitLines(x).map((s) => s.replace(/[.;]+$/, ''));

/** Gendered words for a party prefix: o/a, do/da, ao/à, designação. */
export function g3(v: Values, p: string) {
  const f = parteF(v, p);
  return {
    f,
    o: f ? 'a' : 'o',
    O: f ? 'A' : 'O',
    do: f ? 'da' : 'do',
    ao: f ? 'à' : 'ao',
    pelo: f ? 'pela' : 'pelo',
    w: (m: string, fem: string) => (f ? fem : m),
  };
}

// ---------------------------------------------------------------- Fields

/** Case number, court and type of case (for filings in a pending case). */
export function processoFields(section = 'tribunal', tipoAccao = 'acção declarativa de condenação, com processo ordinário'): FieldDef[] {
  return [
    { name: 'processoNumero', type: 'text', section, width: 'half', required: true, label: l('Processo n.º', 'Case no.'), placeholder: l('Ex.: 245/2026', 'E.g. 245/2026') },
    ...courtFields(section),
    { name: 'tipoAccao', type: 'text', section, label: l('Tipo de processo', 'Type of case'), default: tipoAccao, help: l('Completa «nos autos de …».', 'Completes “in the case of …”.') },
  ];
}

/** Name, kind and form of address of a party already identified in the case. */
export function parteNome(p: string, section: string, label: string, en: string, defaultTipo: 'pessoa' | 'empresa' = 'pessoa', required = true): FieldDef[] {
  return [
    { name: `${p}Nome`, type: 'text', section, required, label: l(label, en), personKey: 'nome' },
    { name: `${p}Tipo`, type: 'radio', section, width: 'half', label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: defaultTipo },
    { name: `${p}Genero`, type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', showIf: (v: Values) => v[`${p}Tipo`] !== 'empresa' },
  ];
}

/** Documents, power of attorney and witnesses. */
export function provaFields(section = 'prova', opts: { procuracao?: boolean; testemunhas?: boolean; docsPlaceholder?: string } = {}): FieldDef[] {
  const f: FieldDef[] = [
    {
      name: 'documentos',
      type: 'textarea',
      section,
      rows: 3,
      label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'),
      placeholder: opts.docsPlaceholder ? l(opts.docsPlaceholder, 'One document per line') : undefined,
      help: l('São numerados «Documento n.º 1, 2…» pela ordem indicada.', 'Numbered “Documento n.º 1, 2…” in this order.'),
    },
  ];
  if (opts.procuracao !== false) f.push({ name: 'juntaProcuracao', type: 'toggle', section, default: opts.procuracao ?? true, label: l('Junta procuração forense', 'Power of attorney attached') });
  if (opts.testemunhas !== false) {
    f.push({
      name: 'testemunhas',
      type: 'textarea',
      section,
      rows: 3,
      label: l('Rol de testemunhas (opcional)', 'Witnesses (optional)'),
      help: l('Uma por linha: nome, profissão e residência.', 'One per line: name, occupation and residence.'),
    });
  }
  return f;
}

/** Form of the ordinary process (ordinário / sumário), chosen by the user. */
export function formaField(section: string): FieldDef {
  return {
    name: 'formaProcesso',
    type: 'radio',
    section,
    width: 'half',
    label: l('Forma de processo', 'Form of process'),
    default: 'ordinario',
    options: [
      { value: 'ordinario', label: l('Ordinário', 'Ordinary') },
      { value: 'sumario', label: l('Sumário', 'Summary') },
    ],
    help: l('Ordinário quando o valor excede a alçada do Tribunal Judicial de Província.', 'Ordinary when the value exceeds the Provincial Court’s limit.'),
  };
}
export const formaTexto = (v: Values) => (v.formaProcesso === 'sumario' ? 'SUMÁRIO' : 'ORDINÁRIO');

export function fechoField(section = 'documento'): FieldDef {
  return { name: 'fecho', type: 'select', section, width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' };
}

export const QUALIDADE_PC: Record<string, { m: string; f: string; cm: string; cf: string }> = {
  autor: { m: 'Autor', f: 'Autora', cm: 'Réu', cf: 'Ré' },
  reu: { m: 'Réu', f: 'Ré', cm: 'Autor', cf: 'Autora' },
  requerente: { m: 'Requerente', f: 'Requerente', cm: 'Requerido', cf: 'Requerida' },
  requerido: { m: 'Requerido', f: 'Requerida', cm: 'Requerente', cf: 'Requerente' },
  exequente: { m: 'Exequente', f: 'Exequente', cm: 'Executado', cf: 'Executada' },
  executado: { m: 'Executado', f: 'Executada', cm: 'Exequente', cf: 'Exequente' },
};

export const QUALIDADE_PC_OPTIONS: FieldOption[] = Object.entries(QUALIDADE_PC).map(([value, q]) => ({
  value,
  label: l(q.f !== q.m ? `${q.m} / ${q.f}` : q.m, value),
}));

export function lawyerWarnings(v: Values): Warning[] {
  return v.advogadoCarteira ? [] : [{ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') }];
}

// ---------------------------------------------------------------- Openings

/**
 * Opening of a new action: court, claimant, "vem … propor contra", defendant,
 * centred name of the action and "o que faz nos termos…".
 */
export function petitionHead(
  v: Values,
  o: {
    autor?: string;
    reu?: string;
    autorM?: string;
    autorF?: string;
    reuM?: string;
    reuF?: string;
    accao: string;
    accaoEn: string;
    verbo?: string;
    /** Text after the defendant instead of the centred action line (e.g. requerimentos). */
    semReu?: boolean;
    processo?: string;
  },
): Block[] {
  const a = o.autor ?? 'autor';
  const r = o.reu ?? 'reu';
  const autorD = papel(v, a, o.autorM ?? 'Autor', o.autorF ?? 'Autora');
  const reuD = papel(v, r, o.reuM ?? 'Réu', o.reuF ?? 'Ré');
  const blocks: Block[] = [
    { type: 'courtHeader', addressee: courtAddressee(v), processo: o.processo },
    { type: 'paragraph', id: 'autor', text: `${partyDesc(v, a)}, adiante ${papel(v, a, 'designado', 'designada')} por **${autorD}**,`, en: 'Identification of the applicant.' },
  ];
  if (o.semReu) {
    blocks.push({ type: 'paragraph', id: 'vem', text: `vem, por intermédio do seu mandatário judicial, ${o.verbo ?? 'requerer'}`, en: 'through its lawyer, applies for' });
  } else {
    blocks.push(
      { type: 'paragraph', id: 'propoe', text: `vem, por intermédio do seu mandatário judicial, ${o.verbo ?? 'propor contra'}`, en: 'through its lawyer, brings against' },
      { type: 'paragraph', id: 'reu', text: `${partyDesc(v, r)}, adiante ${papel(v, r, 'designado', 'designada')} por **${reuD}**,`, en: 'Identification of the respondent.' },
    );
  }
  blocks.push(
    { type: 'paragraph', id: 'accao', align: 'center', text: o.accao, en: o.accaoEn },
    { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
  );
  return blocks;
}

/**
 * Opening of a filing in a pending case: "**X**, Autor nos autos de …, em que é
 * Réu **Y**, e neles melhor identificado, vem, por intermédio do seu mandatário
 * judicial, <verbo>" and, when given, the centred title of the filing.
 */
export function pendingHead(
  v: Values,
  o: {
    p: string;
    papel: string;
    contra?: string;
    contraPapel?: string;
    verbo: string;
    titulo?: string;
    tituloEn?: string;
    fundamentos?: boolean;
    seguinte?: boolean;
  },
): Block[] {
  const nome = nomeParte(v, o.p);
  const tipo = str(v.tipoAccao) || '____________________';
  const contra = o.contra && str(v[`${o.contra}Nome`]) && o.contraPapel ? `, em que é ${o.contraPapel} ${nomeParte(v, o.contra)}` : '';
  const ident = parteF(v, o.p) ? 'identificada' : 'identificado';
  const blocks: Block[] = [
    {
      type: 'courtHeader',
      processo: str(v.processoNumero) || '________/______',
      extra: str(v.seccao) || undefined,
      addressee: courtAddressee(v),
    },
    {
      type: 'paragraph',
      id: 'identificacao',
      text: `${nome}, ${o.papel} nos autos de ${tipo}${contra}, e neles melhor ${ident}, vem, por intermédio do seu mandatário judicial, ${o.verbo}`,
      en: 'The party identified in the case referred to in the margin, through its lawyer, files the following.',
    },
  ];
  if (o.titulo) blocks.push({ type: 'paragraph', id: 'titulo', align: 'center', text: o.titulo, en: o.tituloEn ?? '' });
  if (o.fundamentos !== false && o.titulo) blocks.push({ type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' });
  return blocks;
}

// ---------------------------------------------------------------- Closing

export type Closing = {
  /** "Nestes termos…, deve:" — omitted when empty. */
  intro?: string;
  introEn?: string;
  pedidos?: string[];
  /** Paragraphs after the pedidos (citação, notificação…). */
  depois?: { id: string; text: string; en: string }[];
  /** Value of the case (number or raw text). Omitted when undefined. */
  valor?: unknown;
  valorLabel?: string;
  docs?: string[];
  procuracao?: boolean;
  outrosJunta?: string[];
  duplicados?: boolean;
  testemunhas?: string[];
  fecho?: string;
  cols?: SignatureColumn[];
  annexTitle?: string;
};

/** Pedidos as an a), b)… list with "…;" and a final "…." */
export function pedidoItems(xs: string[]): string[] {
  const items = xs.map((s) => s.trim().replace(/[.;]+$/, '')).filter(Boolean);
  return items.map((s, i) => `${s}${i === items.length - 1 ? '.' : ';'}`);
}

export function closing(ctx: TemplateContext, c: Closing): Block[] {
  const v = ctx.values;
  const blocks: Block[] = [];
  const pedidos = pedidoItems(c.pedidos ?? []);
  if (c.intro) blocks.push({ type: 'paragraph', id: 'nestesTermos', text: c.intro, en: c.introEn ?? 'On these grounds:', keepWithNext: pedidos.length > 0 });
  if (pedidos.length) blocks.push({ type: 'list', style: 'alpha', items: pedidos });
  for (const d of c.depois ?? []) blocks.push({ type: 'paragraph', ...d });
  const docs = c.docs ?? [];
  const testemunhas = c.testemunhas ?? [];
  const fecho = c.fecho ?? (str(v.fecho) || 'Pede deferimento.');
  if (c.valor !== undefined) {
    const valorTxt = typeof c.valor === 'string' && !/^\d/.test(c.valor) ? c.valor : moneyExt(c.valor);
    blocks.push(linePara('valor', c.valorLabel ?? 'Valor', `${valorTxt}.`, 'Value of the case.', true));
  }
  const junta = juntaText({ procuracao: c.procuracao, documentos: docs.length, outros: c.outrosJunta, duplicados: c.duplicados });
  const hasJunta = Boolean(c.procuracao) || docs.length > 0 || (c.outrosJunta ?? []).some((s) => s.trim());
  if (hasJunta) blocks.push(linePara('junta', 'Junta', `${junta}.`, 'Attached.', testemunhas.length === 0));
  if (testemunhas.length) {
    blocks.push(
      { type: 'paragraph', id: 'rol', text: '**Rol de testemunhas:**', en: 'Witnesses:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: testemunhas },
    );
  }
  blocks.push({ type: 'paragraph', id: 'fecho', align: 'center', text: `**${fecho}**`, en: 'Requests approval.', keepWithNext: true });
  blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: c.cols ?? [lawyerSignature(v)] });
  if (docs.length) blocks.push({ type: 'annexList', title: c.annexTitle ?? 'Documentos juntos', items: docs });
  return blocks;
}

/** Documents and witnesses from the standard fields. */
export function prova(v: Values) {
  return { docs: documentosList(v.documentos), testemunhas: splitLines(v.testemunhas), procuracao: Boolean(v.juntaProcuracao) };
}

/** Articulado section list, dropping empty sections, with Roman numerals. */
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function seccoes(parts: [string, string[]][], keepEmpty: string[] = []): { heading?: string; items: string[] }[] {
  const out: { heading?: string; items: string[] }[] = [];
  for (const [t, items] of parts) {
    if (!items.length && !keepEmpty.includes(t)) continue;
    out.push({ heading: `${ROMANOS[out.length]} — ${t}`, items: items.length ? items : ['____________________'] });
  }
  return out;
}
