// Shared pieces for public-administration documents (ofício, nota, informação,
// despacho, circular, ordem de serviço, autos…): reference number, classification
// labels, the signature block of a public official and the footer lines
// (Anexos, C/c, initials of the drafter).

import { inteiroPorExtenso, MESES, parseISODate } from '@/lib/format';
import { isPublicBody } from '@/lib/storage/types';
import type { Block, DefaultsContext, FieldDef, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, exmo, g, isF, l, lineItems, officialRef } from './_shared';

// ---------------------------------------------------------------- Options

export const URGENCIA_OPTIONS = [
  { value: '', label: l('Normal', 'Normal') },
  { value: 'URGENTE', label: l('Urgente', 'Urgent') },
  { value: 'MUITO URGENTE', label: l('Muito urgente', 'Very urgent') },
];

export const CLASSIFICACAO_OPTIONS = [
  { value: '', label: l('Normal (não classificado)', 'Normal (unclassified)') },
  { value: 'RESTRITO', label: l('Restrito', 'Restricted') },
  { value: 'CONFIDENCIAL', label: l('Confidencial', 'Confidential') },
  { value: 'SECRETO', label: l('Secreto', 'Secret') },
];

export const MODO_ASSINATURA_OPTIONS = [
  { value: '', label: l('Assina o titular do cargo', 'Signed by the office holder') },
  { value: 'delegacao', label: l('Por delegação', 'By delegation') },
  { value: 'substituicao', label: l('Em substituição', 'Standing in') },
  { value: 'exercicio', label: l('Em exercício', 'Acting') },
  { value: 'ordem', label: l('Por ordem (P/)', 'On behalf (P/)') },
];

// ---------------------------------------------------------------- Text helpers

/** Splits a textarea into paragraphs: by blank lines if any, otherwise by line. */
export function paragraphs(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) return [];
  const parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Removes a leading "1." / "1)" / "a)" / "-" typed by the user. */
export const stripNumber = (s: string) => s.replace(/^\s*(?:\d+\s*[.)]|[a-z]\)|[-•*])\s*/i, '').trim();

export const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export const str = (x: unknown) => (x == null ? '' : String(x)).trim();

/** "Aos treze dias do mês de Outubro do ano de dois mil e vinte e seis" */
export function dataPorExtenso(iso: unknown): string {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  if (!d) return 'Aos ____ dias do mês de __________ do ano de ______';
  const dia = d.getDate();
  const diaTxt = dia === 1 ? 'Ao primeiro dia' : `Aos ${inteiroPorExtenso(dia)} dias`;
  return `${diaTxt} do mês de ${MESES[d.getMonth()]} do ano de ${inteiroPorExtenso(d.getFullYear())}`;
}

/** "09:30" → "pelas 9 horas e 30 minutos". Unparsable input is printed as typed. */
export function hora(s: unknown, prep: 'pelas' | 'às'): string {
  const t = str(s);
  if (!t) return `${prep} ____ horas`;
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?\s*(?:h|horas)?$/.exec(t);
  if (!m) return `${prep} ${t}`;
  const h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? Number(m[2]) : 0;
  const p = h === 1 ? (prep === 'pelas' ? 'pela' : 'à') : prep;
  const unit = h === 1 ? 'hora' : 'horas';
  const mins = min ? ` e ${min} ${min === 1 ? 'minuto' : 'minutos'}` : '';
  return `${p} ${h} ${unit}${mins}`;
}

/** "do Colectivo de Direcção" / "da Comissão Técnica" */
export function daOuDo(orgao: string): string {
  const o = orgao.replace(/^(o|a|do|da)\s+/i, '');
  return /^(Comissão|Direcção|Assembleia|Equipa|Brigada|Junta|Secretaria|Inspecção|Delegação|Repartição|Unidade|Secção|Administração|Procuradoria|Universidade|Escola|Coordenação|Chefia|Autoridade|Agência|Empresa)\b/i.test(o) ? `da ${o}` : `do ${o}`;
}

/** Adds "O"/"A" before a position unless the user already wrote an article. */
export function comArtigo(cargo: string, genero: unknown): string {
  const c = cargo.trim();
  if (!c) return '';
  if (/^(o|a|os|as)\s/i.test(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  return `${isF(genero) ? 'A' : 'O'} ${c}`;
}

/** Body paragraphs, numbered 1., 2., 3. when asked and there is more than one. */
export function bodyBlocks(text: unknown, idPrefix: string, numbered: boolean, enHint: string): Block[] {
  const ps = paragraphs(text);
  if (!ps.length) return [{ type: 'paragraph', id: `${idPrefix}-1`, text: BLANK, en: enHint }];
  const num = numbered && ps.length > 1;
  return ps.map((p, i) => ({
    type: 'paragraph' as const,
    id: `${idPrefix}-${i + 1}`,
    text: num ? `${i + 1}. ${stripNumber(p)}` : p,
    en: enHint,
  }));
}

// ---------------------------------------------------------------- Fields

/** Document number only (the acronym and year are added from the profile). */
export function numeroField(section = 'documento', label = l('Número', 'Number')): FieldDef {
  return {
    name: 'numero',
    type: 'text',
    section,
    width: 'half',
    label,
    help: l(
      'Número sequencial do registo deste tipo de documento. A sigla do órgão e o ano são acrescentados a partir do perfil.',
      'Sequential register number for this type of document. The body’s acronym and the year are added from the profile.',
    ),
    default: (c: DefaultsContext) => /(\d+)\s*$/.exec(c.nextRef)?.[1] ?? '',
  };
}

export function codigoField(section = 'documento'): FieldDef {
  return {
    name: 'codigoClassificador',
    type: 'text',
    section,
    width: 'half',
    label: l('Código do classificador (opcional)', 'Records classification code (optional)'),
    placeholder: l('Ex.: 214', 'E.g. 214'),
    help: l(
      'Código do plano de classificação de documentos do Sistema Nacional de Arquivos do Estado, se a instituição o usar na numeração.',
      'Code from the State records classification plan, if your institution includes it in document numbers.',
    ),
  };
}

export function classificacaoFields(section = 'documento'): FieldDef[] {
  return [
    {
      name: 'urgencia',
      type: 'select',
      section,
      width: 'half',
      label: l('Urgência', 'Urgency'),
      options: URGENCIA_OPTIONS,
      default: '',
    },
    {
      name: 'classificacao',
      type: 'select',
      section,
      width: 'half',
      label: l('Classificação', 'Classification'),
      options: CLASSIFICACAO_OPTIONS,
      default: '',
      help: l(
        'Classifique segundo o classificador de informações da sua instituição. A maioria da correspondência é «Normal».',
        'Classify according to your institution’s classification guide. Most correspondence is “Normal”.',
      ),
    },
  ];
}

/**
 * Signatory of a public body: gender, position (without article), name,
 * career category and the way of signing (delegation, acting…).
 */
export function signatarioFields(section = 'assinatura', cargoLabel = l('Cargo de quem assina', 'Signatory’s position')): FieldDef[] {
  return [
    {
      name: 'signatarioCargo',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: cargoLabel,
      placeholder: l('Ex.: Director Provincial', 'E.g. Provincial Director'),
      help: l('Escreva o cargo sem artigo; o «O» ou «A» é acrescentado conforme o tratamento.', 'Write the position without article; “O” or “A” is added from the form of address.'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    { name: 'signatarioGenero', type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    {
      name: 'signatarioNome',
      type: 'text',
      section,
      width: 'half',
      label: l('Nome de quem assina', 'Signatory’s name'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : c.profile?.nome ?? ''),
    },
    {
      name: 'signatarioCategoria',
      type: 'text',
      section,
      width: 'half',
      label: l('Carreira / categoria (opcional)', 'Career grade (optional)'),
      placeholder: l('Ex.: Técnico Superior N1', 'E.g. Técnico Superior N1'),
      help: l('Impressa entre parênteses por baixo do nome. Os titulares de cargos políticos normalmente não a indicam.', 'Printed in brackets under the name. Political office holders usually leave it out.'),
    },
    {
      name: 'assinaturaModo',
      type: 'select',
      section,
      width: 'half',
      label: l('Forma de assinatura', 'Signing capacity'),
      options: MODO_ASSINATURA_OPTIONS,
      default: '',
    },
  ];
}

export function rodapeFields(section = 'assinatura', opts: { anexos?: boolean; cc?: boolean; iniciais?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [];
  if (opts.anexos !== false) {
    out.push({
      name: 'anexos',
      type: 'lines',
      section,
      label: l('Anexos', 'Enclosures'),
      addLabel: l('Adicionar anexo', 'Add enclosure'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    });
  }
  if (opts.cc !== false) {
    out.push({
      name: 'cc',
      type: 'textarea',
      section,
      rows: 2,
      label: l('Com conhecimento a (C/c)', 'Copies to (C/c)'),
      placeholder: l('Um destinatário por linha. Ex.: Gabinete do Governador', 'One recipient per line'),
    });
  }
  if (opts.iniciais !== false) {
    out.push({
      name: 'iniciais',
      type: 'text',
      section,
      width: 'half',
      label: l('Iniciais de quem redigiu (opcional)', 'Drafter’s initials (optional)'),
      placeholder: l('Ex.: FM/ac', 'E.g. FM/ac'),
    });
  }
  return out;
}

// ---------------------------------------------------------------- Blocks

/** "Ofício n.º 014/DPS-NPL/214/2026" — the classifier code goes before the year. */
export function estadoRef(ctx: TemplateContext, kind: string): string {
  const v = ctx.values;
  const base = officialRef(ctx, kind, v.numero);
  const codigo = str(v.codigoClassificador);
  return codigo ? base.replace(/\/(\d{4})$/, `/${codigo}/$1`) : base;
}

export function tagsBlocks(v: Values): Block[] {
  const items = [str(v.classificacao), str(v.urgencia)].filter(Boolean);
  return items.length ? [{ type: 'tags', items }] : [];
}

/** Signature column: "O Director Provincial, por delegação", name, "(Técnico Superior N1)". */
export function signatarioColumn(v: Values, fallbackCargo = ''): SignatureColumn {
  const cargo = comArtigo(str(v.signatarioCargo) || fallbackCargo, v.signatarioGenero) || ' ';
  let role = cargo;
  switch (v.assinaturaModo) {
    case 'delegacao':
      role = `${cargo}, por delegação`;
      break;
    case 'substituicao':
      role = `${cargo}, em substituição`;
      break;
    case 'exercicio':
      role = `${cargo}, em exercício`;
      break;
    case 'ordem':
      role = `P/ ${cargo}`;
      break;
  }
  const cat = str(v.signatarioCategoria).replace(/^\(|\)$/g, '');
  return { role, name: str(v.signatarioNome) || undefined, detail: cat ? `(${cat})` : undefined, image: 'both' };
}

/** Anexos, C/c and the drafter's initials, after the signature. */
export function rodapeBlocks(v: Values): Block[] {
  const out: Block[] = [];
  const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
  if (anexos.length) out.push({ type: 'annexList', items: anexos });
  const cc = str(v.cc)
    .split(/\n+|;\s*/)
    .map((s) => s.trim().replace(/[.;]$/, ''))
    .filter(Boolean);
  if (cc.length) {
    out.push({
      type: 'paragraph',
      id: 'cc',
      text: `C/c: ${cc.join('; ')}.`,
      align: 'left',
      size: 'small',
      en: `Copies to: ${cc.join('; ')}.`,
    });
  }
  if (str(v.iniciais)) out.push({ type: 'note', text: str(v.iniciais), en: 'Initials of the drafter and typist.' });
  return out;
}

// ---------------------------------------------------------------- Addressee

export const TRATAMENTO_ESTADO_OPTIONS = [
  { value: 'excelencia', label: l('A Sua Excelência (Ministro, Governador, Secretário de Estado…)', 'His/Her Excellency (Minister, Governor…)') },
  { value: 'exmo', label: l('Exmo. Senhor / Exma. Senhora (Director, Presidente do Conselho Municipal…)', 'Dear Sir / Madam (Director, Mayor…)') },
  { value: 'entidade', label: l('A uma instituição (sem pessoa)', 'To an institution (no person)') },
];

export function destinatarioFields(section = 'destinatario'): FieldDef[] {
  return [
    {
      name: 'tratamento',
      type: 'select',
      section,
      label: l('Forma de tratamento', 'Form of address'),
      options: TRATAMENTO_ESTADO_OPTIONS,
      default: 'exmo',
    },
    { name: 'destinatarioGenero', type: 'radio', section, width: 'half', label: l('Destinatário', 'Addressee'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.tratamento !== 'entidade' },
    {
      name: 'destinatarioCargo',
      type: 'text',
      section,
      width: 'half',
      label: l('Cargo do destinatário', 'Addressee’s position'),
      placeholder: l('Ex.: Director Nacional de Saúde Pública', 'E.g. National Director of Public Health'),
      help: l('Dirija-se ao cargo, não à pessoa. Sem artigo: «Ministro da Saúde».', 'Address the position, not the person. No article: “Ministro da Saúde”.'),
      showIf: (v) => v.tratamento !== 'entidade',
    },
    {
      name: 'destinatarioNome',
      type: 'text',
      section,
      width: 'half',
      label: l('Nome (opcional)', 'Name (optional)'),
      showIf: (v) => v.tratamento === 'exmo',
    },
    {
      name: 'destinatarioEntidade',
      type: 'text',
      section,
      label: l('Instituição', 'Institution'),
      placeholder: l('Ex.: Ministério da Saúde', 'E.g. Ministry of Health'),
    },
    {
      name: 'destinatarioLocal',
      type: 'text',
      section,
      width: 'half',
      label: l('Cidade', 'City'),
      default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo',
    },
  ];
}

/** Addressee block in the Mozambican official style (city in capitals on the last line). */
export function destinatarioBlock(v: Values): Block {
  const local = str(v.destinatarioLocal).toLocaleUpperCase('pt');
  const cargo = str(v.destinatarioCargo);
  const entidade = str(v.destinatarioEntidade);
  if (v.tratamento === 'entidade') {
    return { type: 'recipient', lines: [entidade || BLANK, local].filter(Boolean) };
  }
  if (v.tratamento === 'excelencia') {
    return {
      type: 'recipient',
      salutation: 'A Sua Excelência',
      lines: [comArtigo(cargo, v.destinatarioGenero) || BLANK, entidade && !cargo.includes(entidade) ? entidade : '', local].filter(Boolean),
    };
  }
  return {
    type: 'recipient',
    salutation: exmo(v.destinatarioGenero),
    lines: [str(v.destinatarioNome), cargo || (entidade ? '' : BLANK), entidade, local].filter(Boolean),
  };
}

/** Vocative after the subject line: "Excelência," / "Senhor Director," */
export function vocativo(v: Values): string {
  if (v.tratamento === 'excelencia') return 'Excelência,';
  if (v.tratamento === 'entidade') return '';
  const first = str(v.destinatarioCargo).split(/\s+/)[0];
  if (first && /^(Director|Directora|Presidente|Administrador|Administradora|Secretário|Secretária|Inspector|Inspectora|Reitor|Reitora|Chefe|Delegado|Delegada|Comandante)$/i.test(first)) {
    return `${g(v.destinatarioGenero, 'Senhor', 'Senhora')} ${first.charAt(0).toUpperCase()}${first.slice(1)},`;
  }
  return `${exmo(v.destinatarioGenero)},`;
}

/** "V. Ex.ª" for every addressee of an official letter. */
export const vossaExcelencia = 'V. Ex.ª';

// ---------------------------------------------------------------- Warnings

export function estadoWarnings(v: Values, ctx: TemplateContext, opts: { assunto?: boolean } = {}): Warning[] {
  const w: Warning[] = [];
  if (!isPublicBody(ctx.profile)) {
    w.push({
      level: 'warning',
      message: l(
        'Este documento é emitido por órgãos e instituições do Estado. Use um perfil de entidade pública: só esses perfis imprimem o emblema e o cabeçalho «República de Moçambique».',
        'This document is issued by State bodies. Use a public-body profile: only those print the national emblem and the “República de Moçambique” header.',
      ),
    });
  } else if (!ctx.profile?.sigla) {
    w.push({
      level: 'info',
      message: l('Indique a sigla do órgão no perfil, para a numeração (ex.: DPS-NPL).', 'Set the body’s acronym in the profile for numbering (e.g. DPS-NPL).'),
    });
  }
  if (opts.assunto && !str(v.assunto)) {
    w.push({
      level: 'warning',
      field: 'assunto',
      message: l(
        `A correspondência oficial trata de um só assunto e deve indicá-lo (${cite('correspondenciaRequisitos')}).`,
        'Official correspondence deals with one subject and must state it.',
      ),
    });
  }
  if ('numero' in v && !str(v.numero)) {
    w.push({ level: 'warning', field: 'numero', message: l('Indique o número do documento (registo geral).', 'Enter the document number (general register).') });
  }
  if ('signatarioCargo' in v && !str(v.signatarioCargo)) {
    w.push({ level: 'warning', field: 'signatarioCargo', message: l('Indique o cargo de quem assina (ex.: Director Provincial).', 'Enter the signatory’s position (e.g. Provincial Director).') });
  }
  if (v.classificacao === 'CONFIDENCIAL' || v.classificacao === 'SECRETO') {
    w.push({
      level: 'info',
      field: 'classificacao',
      message: l(
        `Documentos classificados são tratados nos termos do classificador da instituição (${cite('informacaoClassificada')}). Guarde e transmita o ficheiro com as mesmas cautelas que o papel.`,
        'Classified documents follow the institution’s classification guide. Store and send the file with the same care as the paper copy.',
      ),
    });
  }
  return w;
}

/** Feminine or masculine word for the signatory. */
export const sg = (v: Values, m: string, f: string) => g(v.signatarioGenero, m, f);
