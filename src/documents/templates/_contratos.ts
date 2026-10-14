// Shared building blocks for the civil and commercial contracts ("contratos"):
// party fields (individual or company), identification formula, gendered
// role nouns, standard closing clauses, signatures and the notary box.

import { inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, ClauseItem, DefaultsContext, FieldDef, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, isF, l, workerFields } from './_shared';

// ---------------------------------------------------------------- Text helpers

export const str = (x: unknown) => String(x ?? '').trim();
/** Text without a trailing full stop, to embed in a sentence. */
export const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
export const num = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) && x !== '' && x != null ? n : null;
};
export const int = (x: unknown) => {
  const n = num(x);
  return n == null ? null : Math.floor(n);
};

/** "1. …\n2. …" when a clause has several paragraphs. */
export const numerar = (parts: string[]) => {
  const p = parts.filter(Boolean);
  return p.length === 1 ? p[0] : p.map((t, i) => `${i + 1}. ${t}`).join('\n');
};

/** "a, b e c" */
export const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

const extenso = (n: number | null) => (n != null && n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');

/** "**15.000,00 MT** (quinze mil meticais)" or a blank to fill in. */
export const valorTexto = (n: number | null) => (n == null ? `${BLANK} MT` : `**${formatMoney(n)}**${extenso(n) ? ` (${extenso(n)})` : ''}`);

/** "30 (trinta) dias" / "um dia"; a blank when the number is missing. */
export function quantos(n: number | null, sing: string, plur: string, fem = false): string {
  if (n == null || n <= 0) return `${BLANK} ${plur}`;
  if (n === 1) return `${fem ? 'uma' : 'um'} ${sing}`;
  const ext = Number.isInteger(n) && n < 1_000_000 ? inteiroPorExtenso(n) : '';
  const extF = fem ? ext.replace(/\bum$/, 'uma').replace(/\bdois$/, 'duas').replace(/entos\b/g, 'entas') : ext;
  return `${n}${ext ? ` (${extF})` : ''} ${plur}`;
}

/** "10%" style percentage from a number the user typed (no legal value). */
export const pct = (x: unknown) => {
  const n = num(x);
  return n == null ? `${BLANK}%` : `${String(n).replace('.', ',')}%`;
};

export const lines = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? (v as Record<string, any>[]) : []);

// ---------------------------------------------------------------- Parties

export const isEmpresa = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';

const PROFILE_VALUES: Record<string, (p: Profile) => string | undefined> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Morada: (p) => addressLine(p),
};

function fromPersonalProfile(fields: FieldDef[], prefix: string): FieldDef[] {
  return fields.map((f) => {
    const pick = PROFILE_VALUES[f.name.slice(prefix.length)];
    if (!pick) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const fromProfile = c.profile?.kind === 'pessoa' ? pick(c.profile) : '';
        if (fromProfile) return fromProfile;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const casado = (v: Values, p: string) => !isEmpresa(v, p) && ['casado', 'união de facto'].includes(str(v[`${p}EstadoCivil`]));

/**
 * Party fields switched by `<p>Tipo` (pessoa / empresa). With `fromProfile`,
 * the first party defaults from the issuing profile. With `conjuge`, a married
 * individual gets the spouse's name and ID (for the consent signature).
 */
export function partyFields(p: string, opts: { fromProfile?: boolean; conjuge?: boolean; tipoDefault?: 'pessoa' | 'empresa'; osfl?: boolean } = {}): FieldDef[] {
  const { fromProfile = false, conjuge = false, tipoDefault = 'pessoa', osfl = false } = opts;
  const pessoaRaw = workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'], p, p).map(
    (f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v, p) }),
  );
  const pessoa = fromProfile ? fromPersonalProfile(pessoaRaw, p) : pessoaRaw;
  const emp = (k: keyof Profile) => (c: DefaultsContext) => (fromProfile && c.profile?.kind === 'empresa' ? String(c.profile[k] ?? '') : '');
  const showEmp = (v: Values) => isEmpresa(v, p);
  const fields: FieldDef[] = [
    {
      name: `${p}Tipo`,
      type: 'radio',
      section: p,
      label: l('Tipo', 'Type'),
      options: [
        { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
        { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') },
      ],
      default: fromProfile ? (c) => (c.profile?.kind === 'empresa' ? 'empresa' : c.profile?.kind === 'pessoa' ? 'pessoa' : tipoDefault) : tipoDefault,
    },
    ...pessoa,
    ...(osfl
      ? [
          {
            name: `${p}Natureza`,
            type: 'select',
            section: p,
            label: l('Natureza da entidade', 'Kind of entity'),
            options: NATUREZA_OPTIONS,
            default: (c: DefaultsContext) => (fromProfile && c.profile?.kind === 'empresa' && c.profile.sector === 'associacoes' ? 'associacao' : 'sociedade'),
            showIf: showEmp,
          } satisfies FieldDef,
          {
            name: `${p}Reconhecimento`,
            type: 'text',
            section: p,
            label: l('Reconhecimento ou registo (opcional)', 'Recognition or registration (optional)'),
            placeholder: l('Ex.: reconhecida por despacho do Governador da Província de Maputo de 3 de Maio de 2015', 'E.g. recognised by order of the Provincial Governor of 3 May 2015'),
            help: l(
              'Como a entidade obteve personalidade jurídica: despacho de reconhecimento (associações), registo no Ministério da Justiça (igrejas) ou autorização do Ministério dos Negócios Estrangeiros e Cooperação (ONG estrangeiras).',
              'How the entity obtained legal personality: recognition order (associations), registration with the Ministry of Justice (churches) or authorisation of the Ministry of Foreign Affairs (foreign NGOs).',
            ),
            default: (c: DefaultsContext) =>
              fromProfile && c.profile?.kind === 'empresa' && c.profile.sector === 'associacoes' && c.profile.licenca ? c.profile.licenca.charAt(0).toLowerCase() + c.profile.licenca.slice(1) : '',
            showIf: (v: Values) => isEmpresa(v, p) && isOsfl(v, p),
          } satisfies FieldDef,
        ]
      : []),
    {
      name: `${p}EmpresaNome`,
      type: 'text',
      section: p,
      required: true,
      label: l('Denominação', 'Company name'),
      default: (c) => (fromProfile && c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : ''),
      showIf: showEmp,
    },
    { name: `${p}EmpresaNuit`, type: 'text', section: p, width: 'half', label: l('NUIT', 'Tax number (NUIT)'), default: emp('nuit'), showIf: showEmp },
    { name: `${p}EmpresaNuel`, type: 'text', section: p, width: 'half', label: l('NUEL (opcional)', 'NUEL (optional)'), default: emp('nuel'), showIf: showEmp },
    {
      name: `${p}EmpresaSede`,
      type: 'text',
      section: p,
      label: l('Sede', 'Registered office'),
      default: (c) => (fromProfile && c.profile?.kind === 'empresa' ? addressLine(c.profile) : ''),
      showIf: showEmp,
    },
    { name: `${p}RepNome`, type: 'text', section: p, width: 'half', label: l('Representante (quem assina)', 'Representative (signatory)'), default: emp('representanteNome'), showIf: showEmp },
    { name: `${p}RepCargo`, type: 'text', section: p, width: 'half', label: l('Qualidade do representante', 'Representative’s capacity'), placeholder: l('Ex.: Director-Geral, sócio-gerente', 'E.g. Managing Director'), default: emp('representanteCargo'), showIf: showEmp },
  ];
  if (conjuge) {
    fields.push(
      {
        name: `${p}ConjugeNome`,
        type: 'text',
        section: p,
        width: 'half',
        label: l('Nome do cônjuge (consentimento)', 'Spouse’s name (consent)'),
        help: l('Se o bem for comum do casal, o cônjuge deve dar consentimento e assinar.', 'If the asset is jointly owned, the spouse must consent and sign.'),
        showIf: (v) => casado(v, p),
      },
      {
        name: `${p}ConjugeDoc`,
        type: 'text',
        section: p,
        width: 'half',
        label: l('BI do cônjuge n.º', 'Spouse’s ID number'),
        showIf: (v) => casado(v, p),
      },
    );
  }
  return fields;
}

/** Kinds of organisation a party may be (only with `partyFields(p, { osfl: true })`). */
export const NATUREZA_OPTIONS = [
  { value: 'sociedade', label: l('Sociedade comercial ou empresa', 'Company') },
  { value: 'associacao', label: l('Associação sem fins lucrativos', 'Non-profit association') },
  { value: 'confissao', label: l('Igreja ou confissão religiosa', 'Church or religious body') },
  { value: 'fundacao', label: l('Fundação', 'Foundation') },
  { value: 'ong', label: l('ONG estrangeira', 'Foreign NGO') },
  { value: 'publica', label: l('Entidade pública (escola, hospital, município)', 'Public body (school, hospital, municipality)') },
];

const NATUREZA_TEXTO: Record<string, string> = {
  associacao: 'associação sem fins lucrativos',
  confissao: 'confissão religiosa',
  fundacao: 'fundação',
  ong: 'organização não-governamental estrangeira',
  publica: 'instituição pública',
};

/** A non-profit organisation (association, church, foundation, NGO) rather than a company. */
export const isOsfl = (v: Values, p: string) => isEmpresa(v, p) && ['associacao', 'confissao', 'fundacao', 'ong'].includes(str(v[`${p}Natureza`]));

export type Papel = { n: string; f: boolean; o: string; O: string; de: string; ao: string; pelo: string };

/** Role noun with articles, agreeing with the party's gender (companies take the role's grammatical gender). */
export function papel(v: Values, p: string, m: string, f: string, empresaF = false): Papel {
  const fem = isEmpresa(v, p) ? empresaF : isF(v[`${p}Genero`]);
  const n = fem ? f : m;
  return fem
    ? { n, f: true, o: `a ${n}`, O: `A ${n}`, de: `da ${n}`, ao: `à ${n}`, pelo: `pela ${n}` }
    : { n, f: false, o: `o ${n}`, O: `O ${n}`, de: `do ${n}`, ao: `ao ${n}`, pelo: `pelo ${n}` };
}

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

/** Notarial-style identification of an individual or a company. */
export function identificacao(v: Values, p: string): string {
  const get = (k: string) => str(v[`${p}${k}`]);
  if (isEmpresa(v, p)) {
    const rep = get('RepNome');
    const cargo = get('RepCargo');
    const natureza = NATUREZA_TEXTO[get('Natureza')] ?? '';
    return [
      `**${get('EmpresaNome') || BLANK}**`,
      natureza,
      natureza ? semPonto(get('Reconhecimento')) : '',
      `com sede em ${semPonto(get('EmpresaSede')) || BLANK}`,
      get('EmpresaNuel') ? `${natureza ? 'registada' : 'matriculada'} na Conservatória do Registo das Entidades Legais sob o NUEL ${get('EmpresaNuel')}` : '',
      `titular do NUIT ${get('EmpresaNuit') || BLANK}`,
      `neste acto representada por ${rep || BLANK}${cargo ? `, na qualidade de ${cargo}` : ''}, com poderes para o acto`,
    ]
      .filter(Boolean)
      .join(', ');
  }
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? ec.replace(/o$/, 'a') : ec;
  const emissao = [get('DocEmissao') ? `em ${dateLong(get('DocEmissao'))}` : '', get('DocLocal') ? `${get('DocTipo') === 'BI' || !get('DocTipo') ? 'pela Direcção de Identificação Civil de' : 'em'} ${get('DocLocal')}` : '']
    .filter(Boolean)
    .join(' ');
  const doc = `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`;
  return [
    `**${get('Nome') || BLANK}**`,
    estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    doc,
    `titular do NUIT ${get('Nuit') || BLANK}`,
    `residente em ${semPonto(get('Morada')) || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

/** Identification + "adiante designado por **Comprador**". */
export function parte(v: Values, p: string, role: Papel): string {
  const des = isEmpresa(v, p) || role.f ? 'designada' : 'designado';
  return `${identificacao(v, p)}, adiante ${des} por **${role.n}**`;
}

export function partyName(v: Values, p: string): string {
  return isEmpresa(v, p) ? str(v[`${p}EmpresaNome`]) : str(v[`${p}Nome`]);
}

/** "Entre:\n…;\ne\n…;" — opening paragraphs for two or more parties. */
export function partesBlocks(v: Values, parties: { p: string; role: Papel; en: string }[]): Block[] {
  return parties.map(({ p, role, en }, i) => ({
    type: 'paragraph' as const,
    id: `parte_${p}`,
    text: `${i === 0 ? 'Entre:' : 'e'}\n${parte(v, p, role)}${i === parties.length - 1 ? ',' : ';'}`,
    en: `${i === 0 ? 'Between' : 'and'} the ${en}, identified above${i === parties.length - 1 ? ',' : ';'}`,
  }));
}

/** Signature column for a party (company: representative and company name). */
export function assinatura(ctx: TemplateContext, p: string, role: Papel, issuer = false): SignatureColumn {
  const v = ctx.values;
  if (isEmpresa(v, p)) {
    return {
      role: role.O,
      name: str(v[`${p}RepNome`]) || undefined,
      detail: [str(v[`${p}RepCargo`]), str(v[`${p}EmpresaNome`])].filter(Boolean).join(', ') || undefined,
      image: issuer && ctx.profile?.kind === 'empresa' ? 'both' : undefined,
    };
  }
  return { role: role.O, name: str(v[`${p}Nome`]) || undefined, image: issuer && ctx.profile?.kind === 'pessoa' ? 'signature' : undefined };
}

/** Spouse consent signature when a married individual disposes of an asset. */
export function conjugeColumn(v: Values, p: string): SignatureColumn | null {
  if (!casado(v, p) || !str(v[`${p}ConjugeNome`])) return null;
  const doc = str(v[`${p}ConjugeDoc`]);
  return { role: 'Consentimento do cônjuge', name: str(v[`${p}ConjugeNome`]), detail: doc ? `BI n.º ${doc}` : undefined };
}

/** Spouse's declaration of consent, printed above the spouse's signature. */
export function consentimentoTexto(v: Values, p: string, role: Papel): string | undefined {
  if (!conjugeColumn(v, p)) return undefined;
  const doc = str(v[`${p}ConjugeDoc`]);
  // Marriage under the Family Law is between a man and a woman: the spouse takes the other gender.
  const genero = str(v[`${p}Genero`]);
  const portador = genero === 'M' ? 'portadora' : genero === 'F' ? 'portador' : 'portador(a)';
  return `**${str(v[`${p}ConjugeNome`])}**${doc ? `, ${portador} do Bilhete de Identidade n.º ${doc}` : ''}, cônjuge ${role.de}, declara prestar o seu consentimento ao presente contrato.`;
}

// ---------------------------------------------------------------- Common fields

export function foroField(section: string, fallback = 'tribunal judicial competente'): FieldDef {
  return {
    name: 'foro',
    type: 'text',
    section,
    label: l('Tribunal competente (foro)', 'Competent court'),
    help: l('Normalmente o tribunal da cidade onde as partes vivem ou onde o contrato é cumprido.', 'Usually the court of the city where the parties live or where the contract is performed.'),
    default: (c) => {
      const cidade = c.profile?.morada?.cidade?.trim() || c.profile?.localPadrao?.trim();
      if (!cidade) return 'Tribunal Judicial da Cidade de Maputo';
      return /^maputo$/i.test(cidade) ? 'Tribunal Judicial da Cidade de Maputo' : cidade ? `Tribunal Judicial da Cidade de ${cidade}` : fallback;
    },
  };
}

export function arbitragemField(section: string): FieldDef {
  return {
    name: 'arbitragem',
    type: 'toggle',
    section,
    label: l('Resolver litígios por arbitragem', 'Settle disputes by arbitration'),
    help: l('Em vez do tribunal judicial, um tribunal arbitral decide (por exemplo, no Centro de Arbitragem, Conciliação e Mediação, em Maputo). É mais rápido, mas tem custos.', 'Instead of the courts, an arbitral tribunal decides (e.g. at the Arbitration, Conciliation and Mediation Centre in Maputo). Faster, but there are costs.'),
  };
}

export function testemunhasField(section: string): FieldDef {
  return { name: 'testemunhas', type: 'toggle', section, label: l('Incluir assinatura de duas testemunhas', 'Include signatures of two witnesses') };
}

export function documentoFields(section = 'documento'): FieldDef[] {
  return [
    {
      name: 'local',
      type: 'text',
      section,
      width: 'half',
      label: l('Local de assinatura', 'Place of signing'),
      default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo',
    },
    { name: 'data', type: 'date', section, width: 'half', required: true, label: l('Data de assinatura', 'Signing date'), default: (c) => c.today },
  ];
}

// ---------------------------------------------------------------- Closing clauses

/** Comunicações, alterações and lei aplicável/foro — the last clauses of every contract. */
export function clausulasFinais(v: Values, opts: { lei?: string; litigioDias?: boolean } = {}): ClauseItem[] {
  const foro = semPonto(v.foro) || 'tribunal judicial competente';
  return [
    {
      id: 'comunicacoes',
      heading: 'Comunicações',
      text: numerar([
        'Todas as comunicações entre as partes relativas ao presente contrato são feitas por escrito e entregues em mão contra recibo, enviadas por carta registada com aviso de recepção ou por correio electrónico com confirmação de recepção, para os endereços constantes da identificação das partes.',
        'Qualquer alteração de endereço deve ser comunicada por escrito à outra parte, sob pena de serem válidas as comunicações enviadas para o endereço anterior.',
      ]),
      en: 'Notices are in writing (by hand against receipt, registered letter or e-mail with confirmation) to the addresses above. A change of address must be notified, or notices to the old address remain valid.',
    },
    {
      id: 'alteracoes',
      heading: 'Alterações',
      text: 'Qualquer alteração ao presente contrato só é válida se constar de documento escrito assinado por todas as partes, com a mesma forma do presente contrato.',
      en: 'Amendments are valid only in writing, signed by all parties, in the same form as this contract.',
    },
    {
      id: 'leiForo',
      heading: 'Lei aplicável e resolução de litígios',
      text: numerar([
        `O presente contrato rege-se pela lei moçambicana${opts.lei ? `, designadamente pelas normas ${opts.lei}` : ''}.`,
        'As partes procurarão resolver por acordo qualquer divergência sobre a interpretação ou execução do presente contrato.',
        v.arbitragem
          ? 'Não sendo possível o acordo, o litígio é resolvido definitivamente por arbitragem, nos termos da legislação moçambicana sobre arbitragem, conciliação e mediação, por um tribunal arbitral com sede em Maputo, composto por um ou três árbitros, conforme o valor e a complexidade do litígio.'
          : `Não sendo possível o acordo, as partes elegem o foro do ${foro}, com expressa renúncia a qualquer outro.`,
      ]),
      en: v.arbitragem
        ? 'Mozambican law applies. The parties first try to agree; otherwise disputes go to arbitration seated in Maputo.'
        : `Mozambican law applies. The parties first try to agree; otherwise disputes go to the ${foro}.`,
    },
  ];
}

const EXEMPLARES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'];

/**
 * "Feito em …" closing paragraph, signatures (two per row), spouse consent,
 * witnesses and, when asked, the dashed notary box.
 */
export function fecho(
  ctx: TemplateContext,
  cols: SignatureColumn[],
  opts: { exemplares?: number; notario?: string; extraCols?: (SignatureColumn | null)[]; restante?: string; consentimento?: string } = {},
): Block[] {
  const v = ctx.values;
  const n = Math.max(2, Math.min(8, opts.exemplares ?? cols.length));
  const blocks: Block[] = [
    {
      type: 'paragraph',
      id: 'feito',
      text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em ${EXEMPLARES[n]} exemplares de igual teor e valor, que vão ser assinados e rubricados pelas partes, ficando um exemplar em poder de cada uma${opts.restante ? ` e destinando-se o restante ${opts.restante}` : ''}.`,
      en: `Made in ${n} copies of equal content and value, signed and initialled by the parties, each keeping one.`,
      keepWithNext: true,
    },
  ];
  for (let i = 0; i < cols.length; i += 2) {
    blocks.push({ type: 'signatures', columns: cols.slice(i, i + 2), keepWithNext: i + 2 < cols.length });
  }
  const extra = (opts.extraCols ?? []).filter((c): c is SignatureColumn => Boolean(c));
  if (extra.length) {
    if (opts.consentimento) blocks.push({ type: 'spacer', size: 'small' }, { type: 'paragraph', id: 'consentimento', text: opts.consentimento, en: 'The spouse consents to this contract.', keepWithNext: true });
    blocks.push({ type: 'signatures', columns: extra.slice(0, 3) });
  }
  if (v.testemunhas) {
    blocks.push({
      type: 'signatures',
      columns: [
        { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
        { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` },
      ],
    });
  }
  if (opts.notario) {
    // Keep the last signatures with the notary box so it never sits alone on a page.
    const last = blocks[blocks.length - 1];
    if (last.type === 'signatures') last.keepWithNext = true;
    blocks.push({ type: 'box', label: 'Reconhecimento notarial das assinaturas', text: opts.notario, lines: 3, dashed: true });
  }
  return blocks;
}

// ---------------------------------------------------------------- Warnings

/** Missing identification data and, for disposals, the spouse's consent. */
export function partyWarnings(v: Values, p: string, pt: string, en: string, opts: { conjuge?: boolean } = {}): Warning[] {
  const w: Warning[] = [];
  if (isEmpresa(v, p)) {
    if (!str(v[`${p}EmpresaNome`])) w.push({ level: 'error', field: `${p}EmpresaNome`, message: l(`Indique a denominação (${pt}).`, `Enter the company name (${en}).`) });
    if (!str(v[`${p}EmpresaNuit`])) w.push({ level: 'warning', field: `${p}EmpresaNuit`, message: l(`Falta o NUIT (${pt}).`, `The NUIT is missing (${en}).`) });
    if (!str(v[`${p}RepNome`])) w.push({ level: 'warning', field: `${p}RepNome`, message: l(`Indique quem assina pela empresa (${pt}) e confirme que tem poderes para o acto.`, `State who signs for the company (${en}) and check they have authority.`) });
  } else {
    if (!str(v[`${p}Nome`])) w.push({ level: 'error', field: `${p}Nome`, message: l(`Indique o nome (${pt}).`, `Enter the name (${en}).`) });
    if (!str(v[`${p}DocNumero`])) w.push({ level: 'warning', field: `${p}DocNumero`, message: l(`Falta o número do documento de identificação (${pt}).`, `The ID number is missing (${en}).`) });
    if (!str(v[`${p}Morada`])) w.push({ level: 'info', field: `${p}Morada`, message: l(`Falta a morada (${pt}).`, `The address is missing (${en}).`) });
    if (opts.conjuge && casado(v, p) && !str(v[`${p}ConjugeNome`])) {
      w.push({
        level: 'warning',
        field: `${p}ConjugeNome`,
        message: l(
          `${pt.charAt(0).toUpperCase() + pt.slice(1)} é casado(a). Se o bem for comum do casal, o cônjuge deve consentir e assinar (${cite('consentimentoConjuge')}).`,
          `The ${en} is married. If the asset is jointly owned, the spouse must consent and sign.`,
        ),
      });
    }
  }
  return w;
}

export const notarioInfo = (pt: string, en: string): Warning => ({ level: 'warning', message: l(pt, en) });
