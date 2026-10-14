// Shared pieces for documents issued by community authorities (secretário or
// chefe do bairro, chefe de quarteirão, régulo, chefe de povoação): citizen
// identification, the unit ("neste Bairro…"), confirming signatures (chefe de
// quarteirão, chefe de dez casas), the "Visto" box of the local administration,
// and the note that a community declaration does not replace an official document.

import { legalEntry } from '@/legal/mz-legal';
import { isCommunityAuthority, isPublicBody, type Profile } from '@/lib/storage/types';
import type { Block, DefaultsContext, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, ESTADO_CIVIL_OPTIONS, GENERO_OPTIONS, dateLong, estadoCivilF, isF, l, lineItems, officialRef } from './_shared';
import { comArtigo, str } from './_estado';

export { str };

// ---------------------------------------------------------------- Options

export const DOC_COMUNIDADE_OPTIONS: FieldOption[] = [
  { value: 'BI', label: l('Bilhete de Identidade (BI)', 'Identity card (BI)') },
  { value: 'DIRE', label: l('DIRE (estrangeiros residentes)', 'DIRE (resident foreigners)') },
  { value: 'Passaporte', label: l('Passaporte', 'Passport') },
  { value: 'Cartão de Eleitor', label: l('Cartão de eleitor', 'Voter card') },
  { value: 'Cédula Pessoal', label: l('Cédula pessoal', 'Personal record card (cédula)') },
  { value: 'Certidão de Nascimento', label: l('Certidão de nascimento', 'Birth certificate') },
  { value: '', label: l('Sem documento', 'No document') },
];

export const PARENTESCO_OPTIONS: FieldOption[] = [
  { value: 'chefe do agregado', label: l('Chefe do agregado', 'Head of household') },
  { value: 'cônjuge', label: l('Cônjuge', 'Spouse') },
  { value: 'companheiro(a)', label: l('Companheiro(a)', 'Partner') },
  { value: 'filho(a)', label: l('Filho(a)', 'Child') },
  { value: 'enteado(a)', label: l('Enteado(a)', 'Stepchild') },
  { value: 'neto(a)', label: l('Neto(a)', 'Grandchild') },
  { value: 'pai/mãe', label: l('Pai / mãe', 'Parent') },
  { value: 'irmão(ã)', label: l('Irmão / irmã', 'Sibling') },
  { value: 'sobrinho(a)', label: l('Sobrinho(a)', 'Nephew / niece') },
  { value: 'outro familiar', label: l('Outro familiar', 'Other relative') },
  { value: 'outro', label: l('Outra pessoa a cargo', 'Other dependant') },
];

/** "filho(a)" → "filha" for a woman; "pai/mãe" → "mãe". */
export function parentescoG(p: string, genero: unknown): string {
  const f = isF(genero);
  if (p === 'pai/mãe') return f ? 'mãe' : 'pai';
  return p.replace(/(\S+?)o\(a\)/, (_m, r: string) => (f ? `${r}a` : `${r}o`)).replace(/irmão\(ã\)/, f ? 'irmã' : 'irmão');
}

/** "residente no Quarteirão n.º 12" / "residente em Malhangalene". */
export function residenteEm(morada: string): string {
  const m = morada.trim();
  if (!m) return '';
  if (/^(no|na|nos|nas|em)\s/i.test(m)) return `residente ${m}`;
  if (/^(Quarteirão|Bairro|Regulado|Posto|Distrito)\b/i.test(m)) return `residente no ${m}`;
  if (/^(Povoação|Aldeia|Localidade|Rua|Avenida|Casa)\b/i.test(m)) return `residente na ${m}`;
  return `residente em ${m}`;
}

// ---------------------------------------------------------------- Unit of the issuer

/** "Bairro da Malhangalene" from the profile name "Secretaria do Bairro da Malhangalene". */
export function unidadeDoPerfil(p: Profile | null | undefined): string {
  const firma = str(p?.firma);
  if (!firma) return '';
  return firma.replace(/^(Secretaria|Estrutura|Gabinete|Sede)\s+(do|da)\s+/i, '');
}

const FEM = /^(Povoação|Aldeia|Localidade|Comunidade|Unidade|Vila|Zona|Cidade|Secretaria|Célula)\b/i;
/** "neste Bairro" / "nesta Povoação". */
export const neste = (unidade: string) => `${FEM.test(unidade) ? 'nesta' : 'neste'} ${unidade || BLANK}`;
/** "deste Bairro" / "desta Povoação". */
export const deste = (unidade: string) => `${FEM.test(unidade) ? 'desta' : 'deste'} ${unidade || BLANK}`;

/** Article for the cargo ("A Secretária do Bairro", "O Régulo"). */
export function cargoComArtigo(v: Values): string {
  return comArtigo(str(v.assinanteCargo) || 'Secretário do Bairro', v.assinanteGenero) || 'O Secretário do Bairro';
}

const generoDoCargo = (cargo: string): 'M' | 'F' =>
  /^(Secretária|Rainha|Régula|Chefe da|Líder comunitária|Presidente da Comissão)/i.test(cargo.trim()) || /^\S+a\s+d[oa]\s/i.test(cargo.trim()) ? 'F' : 'M';

// ---------------------------------------------------------------- Fields

/** Document number; the acronym and year come from the profile. */
export function numeroComunidadeField(section = 'documento'): FieldDef {
  return {
    name: 'numero',
    type: 'text',
    section,
    width: 'half',
    label: l('Número da declaração', 'Declaration number'),
    help: l('Número do livro de registo da secretaria. A sigla e o ano são acrescentados a partir do perfil.', 'Number in the office register. The acronym and the year are added from the profile.'),
    default: (c: DefaultsContext) => /(\d+)\s*$/.exec(c.nextRef)?.[1] ?? '',
  };
}

/** "N.º 045/SB-MAL/2026" */
export function numeroRef(ctx: TemplateContext): string {
  return officialRef(ctx, 'Doc', ctx.values.numero).replace(/^Doc n\.º/, 'N.º');
}

export function unidadeField(section = 'documento'): FieldDef {
  return {
    name: 'unidade',
    type: 'text',
    section,
    label: l('Bairro, povoação ou unidade', 'Neighbourhood, village or unit'),
    placeholder: l('Ex.: Bairro da Malhangalene «A»', 'E.g. Bairro da Malhangalene'),
    help: l('Como aparece no texto: «reside neste Bairro…». Vem do nome do perfil.', 'As it appears in the text: “lives in this neighbourhood…”. Taken from the profile name.'),
    required: true,
    default: (c: DefaultsContext) => unidadeDoPerfil(c.profile),
  };
}

type PessoaKey =
  | 'nome' | 'genero' | 'pai' | 'mae' | 'nascimento' | 'idade' | 'naturalidade' | 'nacionalidade' | 'estadoCivil'
  | 'docTipo' | 'docNumero' | 'docEmissao' | 'docLocal' | 'quarteirao' | 'casa' | 'rua' | 'telefone';

/** Citizen identification fields with a prefix: cidadaoNome, cidadaoGenero… */
export function pessoaFields(keys: PessoaKey[], prefix = 'cidadao', section = 'cidadao', opts: { nomeLabel?: [string, string] } = {}): FieldDef[] {
  const defs: Record<PessoaKey, Omit<FieldDef, 'name' | 'section'>> = {
    nome: { type: 'text', label: l(opts.nomeLabel?.[0] ?? 'Nome completo', opts.nomeLabel?.[1] ?? 'Full name'), required: true, personKey: 'nome' },
    genero: { type: 'radio', label: l('Sexo', 'Sex'), help: l('Define a concordância do texto (filho/filha, portador/portadora).', 'Sets grammatical agreement.'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', width: 'half' },
    pai: { type: 'text', label: l('Nome do pai (filiação)', "Father's name"), width: 'half' },
    mae: { type: 'text', label: l('Nome da mãe (filiação)', "Mother's name"), width: 'half' },
    nascimento: { type: 'date', label: l('Data de nascimento', 'Date of birth'), width: 'half' },
    idade: { type: 'number', label: l('Idade (se não souber a data)', 'Age (if the date is unknown)'), width: 'half', min: 0, max: 130 },
    naturalidade: { type: 'text', label: l('Naturalidade', 'Place of birth'), personKey: 'naturalidade', width: 'half', placeholder: l('Ex.: Chibuto, Gaza', 'E.g. Chibuto, Gaza') },
    nacionalidade: { type: 'text', label: l('Nacionalidade', 'Nationality'), personKey: 'nacionalidade', default: 'moçambicana', width: 'half' },
    estadoCivil: { type: 'select', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS, personKey: 'estadoCivil', width: 'half' },
    docTipo: { type: 'select', label: l('Documento de identificação', 'ID document'), options: DOC_COMUNIDADE_OPTIONS, default: 'BI', personKey: 'docTipo', width: 'half' },
    docNumero: { type: 'text', label: l('Número do documento', 'Document number'), personKey: 'docNumero', width: 'half' },
    docEmissao: { type: 'date', label: l('Emitido em', 'Issued on'), personKey: 'docEmissao', width: 'half' },
    docLocal: { type: 'text', label: l('Emitido em (local)', 'Place of issue'), personKey: 'docLocal', width: 'half', placeholder: l('Ex.: Maputo', 'E.g. Maputo') },
    quarteirao: { type: 'text', label: l('Quarteirão n.º', 'Block no.'), width: 'half' },
    casa: { type: 'text', label: l('Casa n.º', 'House no.'), width: 'half' },
    rua: { type: 'text', label: l('Rua / avenida / referência (opcional)', 'Street or landmark (optional)'), width: 'half' },
    telefone: { type: 'tel', label: l('Telefone (opcional)', 'Phone (optional)'), personKey: 'telefone', width: 'half' },
  };
  const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
  return keys.map((k) => ({ ...defs[k], name: `${prefix}${cap(k)}`, section }));
}

const get = (v: Values, prefix: string, k: string) => str(v[`${prefix}${k}`]);

/**
 * "**ANA JOÃO**, filha de … e de …, natural de …, nascida a …, de nacionalidade
 * moçambicana, solteira, portadora do BI n.º …, emitido em …, em …"
 * Only the fields present in the template are used.
 */
export function identificacao(v: Values, prefix = 'cidadao', opts: { upper?: boolean } = {}): string {
  const f = isF(v[`${prefix}Genero`]);
  const nome = get(v, prefix, 'Nome');
  const parts: string[] = [`**${nome ? (opts.upper === false ? nome : nome.toLocaleUpperCase('pt')) : BLANK}**`];
  const pai = get(v, prefix, 'Pai');
  const mae = get(v, prefix, 'Mae');
  if (pai || mae) parts.push(`${f ? 'filha' : 'filho'} de ${[pai, mae].filter(Boolean).join(' e de ')}`);
  if (get(v, prefix, 'Naturalidade')) parts.push(`natural de ${get(v, prefix, 'Naturalidade')}`);
  if (get(v, prefix, 'Nascimento')) parts.push(`${f ? 'nascida' : 'nascido'} a ${dateLong(get(v, prefix, 'Nascimento'))}`);
  else if (get(v, prefix, 'Idade')) parts.push(`de ${get(v, prefix, 'Idade')} anos de idade`);
  if (get(v, prefix, 'Nacionalidade')) parts.push(`de nacionalidade ${get(v, prefix, 'Nacionalidade')}`);
  const ec = get(v, prefix, 'EstadoCivil');
  if (ec) parts.push(f ? estadoCivilF(ec) : ec);
  const docN = get(v, prefix, 'DocNumero');
  if (docN) {
    const tipo = get(v, prefix, 'DocTipo') || 'BI';
    const art = /^(Cédula|Certidão)/.test(tipo) ? 'da' : 'do';
    const em = get(v, prefix, 'DocEmissao') ? `, ${/^(Cédula|Certidão)/.test(tipo) ? 'emitida' : 'emitido'} em ${dateLong(get(v, prefix, 'DocEmissao'))}` : '';
    const loc = get(v, prefix, 'DocLocal') ? `, em ${get(v, prefix, 'DocLocal')}` : '';
    parts.push(`${f ? 'portadora' : 'portador'} ${art} ${tipo} n.º ${docN}${em}${loc}`);
  }
  return parts.join(', ');
}

/** "Quarteirão n.º 12, Casa n.º 34, Rua da Resistência" (empty when nothing was typed). */
export function enderecoBairro(v: Values, prefix = 'cidadao'): string {
  return [
    get(v, prefix, 'Quarteirao') ? `Quarteirão n.º ${get(v, prefix, 'Quarteirao').replace(/^n\.?\s*º\s*/i, '')}` : '',
    get(v, prefix, 'Casa') ? `Casa n.º ${get(v, prefix, 'Casa').replace(/^n\.?\s*º\s*/i, '')}` : '',
    get(v, prefix, 'Rua'),
  ]
    .filter(Boolean)
    .join(', ');
}

/** "o interessado" / "a interessada" */
export const interessado = (genero: unknown) => (isF(genero) ? 'a interessada' : 'o interessado');

// ---------------------------------------------------------------- Issuer and confirmations

export function assinaturaFields(section = 'assinatura', opts: { visto?: boolean; confirmacoes?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [
    {
      name: 'assinanteCargo',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Cargo de quem assina', 'Signatory’s position'),
      placeholder: l('Ex.: Secretário do Bairro, Régulo, Chefe de Povoação', 'E.g. Neighbourhood Secretary, Chief'),
      help: l('Sem artigo; o «O» ou «A» é acrescentado.', 'Without article; “O” or “A” is added.'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo || 'Secretário do Bairro' : 'Secretário do Bairro'),
    },
    {
      name: 'assinanteGenero',
      type: 'radio',
      section,
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: GENERO_OPTIONS,
      default: (c) => generoDoCargo(c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    {
      name: 'assinanteNome',
      type: 'text',
      section,
      width: 'half',
      label: l('Nome de quem assina', 'Signatory’s name'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : c.profile?.nome ?? ''),
    },
    {
      name: 'mostrarNomeacao',
      type: 'toggle',
      section,
      width: 'half',
      label: l('Indicar o acto de nomeação por baixo do nome', 'Show the appointment act under the name'),
      help: l('Usa o acto de nomeação ou reconhecimento guardado no perfil.', 'Uses the appointment or recognition act saved in the profile.'),
      default: false,
    },
  ];
  if (opts.confirmacoes !== false) {
    out.push(
      {
        name: 'confirmaQuarteirao',
        type: 'toggle',
        section,
        label: l('Confirmação do Chefe do Quarteirão', 'Confirmation by the block chief'),
        help: l('Acrescenta uma linha de assinatura para o Chefe do Quarteirão, que muitas secretarias exigem.', 'Adds a signature line for the block chief, which many offices require.'),
        default: false,
      },
      { name: 'chefeQuarteiraoNome', type: 'text', section, width: 'half', label: l('Nome do Chefe do Quarteirão', 'Block chief’s name'), showIf: (v) => !!v.confirmaQuarteirao },
      { name: 'chefeQuarteiraoNumero', type: 'text', section, width: 'half', label: l('Quarteirão n.º', 'Block no.'), showIf: (v) => !!v.confirmaQuarteirao },
      {
        name: 'confirmaDezCasas',
        type: 'toggle',
        section,
        label: l('Confirmação do Chefe de Dez Casas', 'Confirmation by the ten-house leader'),
        default: false,
      },
      { name: 'chefeDezCasasNome', type: 'text', section, width: 'half', label: l('Nome do Chefe de Dez Casas', 'Ten-house leader’s name'), showIf: (v) => !!v.confirmaDezCasas },
    );
  }
  if (opts.visto !== false) {
    out.push(
      {
        name: 'vistoAdministrativo',
        type: 'toggle',
        section,
        label: l('Espaço para «Visto» da administração', 'Space for the administration’s endorsement'),
        help: l('Algumas entidades pedem o visto do Posto Administrativo, da Localidade ou do Distrito Municipal.', 'Some bodies require an endorsement by the administrative post, locality or municipal district.'),
        default: false,
      },
      {
        name: 'vistoEntidade',
        type: 'text',
        section,
        label: l('Entidade que dá o visto', 'Endorsing body'),
        placeholder: l('Ex.: Posto Administrativo Municipal de …', 'E.g. Municipal Administrative Post of …'),
        showIf: (v) => !!v.vistoAdministrativo,
      },
    );
  }
  return out;
}

/** The issuer's signature column (signature and stamp). */
export function assinanteColumn(ctx: TemplateContext): SignatureColumn {
  const v = ctx.values;
  const nomeacao = v.mostrarNomeacao ? str(ctx.profile?.licenca) : '';
  return { role: cargoComArtigo(v), name: str(v.assinanteNome) || undefined, detail: nomeacao || undefined, image: 'both' };
}

/** Confirmations (chefe de dez casas, chefe de quarteirão) followed by the issuer. */
export function assinaturaBlocks(ctx: TemplateContext, opts: { placeDate?: boolean } = {}): Block[] {
  const v = ctx.values;
  const cols: SignatureColumn[] = [];
  if (v.confirmaDezCasas) cols.push({ role: 'O Chefe de Dez Casas', name: str(v.chefeDezCasasNome) || undefined });
  if (v.confirmaQuarteirao) {
    const n = str(v.chefeQuarteiraoNumero);
    cols.push({ role: `O Chefe do Quarteirão${n ? ` n.º ${n.replace(/^n\.?\s*º\s*/i, '')}` : ''}`, name: str(v.chefeQuarteiraoNome) || undefined });
  }
  cols.push(assinanteColumn(ctx));
  const out: Block[] = [
    {
      type: 'signatures',
      placeDate: opts.placeDate === false ? undefined : `${ctx.place}, ${dateLong(v.data)}`,
      columns: cols,
    },
  ];
  if (v.vistoAdministrativo) {
    out.push({ type: 'box', label: `Visto${str(v.vistoEntidade) ? ` — ${str(v.vistoEntidade)}` : ' da estrutura administrativa'}`, lines: 3, width: 'half', align: 'right' });
  }
  return out;
}

// ---------------------------------------------------------------- Validity and notes

const VALIDADE = legalEntry('validadeDeclaracaoBairro').value as { dias: number; opcoes: number[] };

export function validadeField(section = 'documento'): FieldDef {
  return {
    name: 'validade',
    type: 'select',
    section,
    width: 'half',
    label: l('Validade indicada', 'Validity stated'),
    help: l('A lei não fixa a validade; bancos e serviços pedem normalmente documentos recentes.', 'The law sets no validity; banks and offices usually ask for recent documents.'),
    options: [
      ...VALIDADE.opcoes.map((n) => ({ value: String(n), label: l(`${n} dias`, `${n} days`) })),
      { value: '', label: l('Não indicar', 'Do not state') },
    ],
    default: String(VALIDADE.dias),
  };
}

/** "Válida por 90 dias." or nothing. */
export function validadeTexto(v: Values): string {
  const n = Number(v.validade);
  return Number.isFinite(n) && n > 0 ? `Válida por ${n} dias a contar da data de emissão.` : '';
}

/** The standard note on community declarations. */
export function notaComunitaria(genero: unknown, extra = '', quemOverride?: string): Block {
  const quem = quemOverride ?? (isF(genero) ? 'pela interessada' : 'pelo interessado');
  return {
    type: 'note',
    text: `A presente declaração é passada com base no conhecimento desta estrutura comunitária e nas informações prestadas ${quem}, e destina-se exclusivamente ao fim indicado. Não substitui documento emitido por entidade pública competente.${extra ? ` ${extra}` : ''}`,
    en: 'Issued on the basis of what the community structure knows and the information given by the person concerned, for the stated purpose only. It does not replace a document issued by a competent public body.',
  };
}

/** Spacer + the standard note, after the signatures. */
export function notaBlocks(genero: unknown, extra = '', quem?: string): Block[] {
  return [{ type: 'spacer', size: 'small' }, notaComunitaria(genero, extra, quem)];
}

/** "para efeitos de abertura de conta bancária" / "para instruir o processo de …". */
export function finalidadeFrase(v: Values, field = 'finalidade'): string {
  const fim = str(v[field]).replace(/[.;]+$/, '').replace(/^(para|a fim de)\s+/i, '');
  if (!fim) return `para efeitos de ${BLANK}`;
  if (/^(efeitos?|fins?)\s/i.test(fim)) return `para ${fim}`;
  // A verb first ("instruir…", "apresentar…", "requerer…") reads "para instruir…".
  if (/^\S+(ar|er|ir)\b/i.test(fim) && !/^(lugar|par|mar)\b/i.test(fim)) return `para ${fim}`;
  return `para efeitos de ${fim}`;
}

export function finalidadeField(section = 'finalidade', placeholder = l('Ex.: abertura de conta bancária', 'E.g. opening a bank account')): FieldDef {
  return {
    name: 'finalidade',
    type: 'text',
    section,
    required: true,
    label: l('Para que serve', 'Purpose'),
    placeholder,
    help: l('A declaração vale só para o fim indicado.', 'The declaration is valid only for the stated purpose.'),
  };
}

// ---------------------------------------------------------------- Witnesses

export function testemunhasField(section: string, name = 'testemunhas', label = l('Testemunhas', 'Witnesses')): FieldDef {
  return {
    name,
    type: 'lines',
    section,
    label,
    addLabel: l('Adicionar testemunha', 'Add witness'),
    columns: [
      { name: 'nome', type: 'text', label: l('Nome', 'Name') },
      { name: 'documento', type: 'text', label: l('BI / documento n.º', 'ID no.') },
      { name: 'morada', type: 'text', label: l('Morada (opcional)', 'Address (optional)') },
    ],
    default: [],
  };
}

export type Testemunha = { nome: string; documento: string; morada: string };

export function testemunhas(v: Values, name = 'testemunhas'): Testemunha[] {
  return lineItems(v[name])
    .map((r) => ({ nome: str(r.nome), documento: str(r.documento), morada: str(r.morada) }))
    .filter((t) => t.nome || t.documento);
}

/** Signature blocks for witnesses, three per row. */
export function testemunhasSignatures(ts: Testemunha[], min = 2, role = 'Testemunha'): Block[] {
  const list = ts.length ? ts : Array.from({ length: min }, () => ({ nome: '', documento: '', morada: '' }));
  const cols: SignatureColumn[] = list.map((t, i) => ({
    role: `${list.length > 1 ? `${i + 1}.ª ` : ''}${role}`,
    name: t.nome || undefined,
    detail: t.documento ? `BI n.º ${t.documento.replace(/^(BI\s*)?n\.?\s*º\s*/i, '')}` : undefined,
  }));
  const out: Block[] = [];
  for (let i = 0; i < cols.length; i += 3) out.push({ type: 'signatures', columns: cols.slice(i, i + 3) });
  return out;
}

// ---------------------------------------------------------------- Warnings

export function comunidadeWarnings(v: Values, ctx: TemplateContext): Warning[] {
  const w: Warning[] = [];
  const p = ctx.profile;
  if (!isCommunityAuthority(p)) {
    w.push({
      level: isPublicBody(p) ? 'info' : 'warning',
      message: l(
        'Este documento é emitido pela estrutura do bairro ou pela autoridade comunitária. Use um perfil de «Autoridade comunitária» (área Comunidade), com o cabeçalho e o carimbo da secretaria.',
        'This document is issued by the neighbourhood structure or community authority. Use a “Community authority” profile with the office header and stamp.',
      ),
    });
  } else {
    if (!p?.branding?.stampAssetId) {
      w.push({
        level: 'warning',
        message: l(
          'O perfil não tem carimbo. Sem o carimbo da secretaria a declaração é normalmente recusada: carimbe à mão ou acrescente a imagem do carimbo ao perfil.',
          'The profile has no stamp. Without the office stamp the declaration is usually refused: stamp it by hand or add the stamp image to the profile.',
        ),
      });
    }
    if (!str(p?.licenca)) {
      w.push({
        level: 'info',
        message: l(
          'Pode indicar no perfil o acto de nomeação ou reconhecimento (ex.: despacho do Presidente do Conselho Municipal). Algumas entidades verificam-no.',
          'You can record the appointment or recognition act in the profile. Some bodies check it.',
        ),
      });
    }
  }
  if (!str(v.assinanteNome)) w.push({ level: 'warning', field: 'assinanteNome', message: l('Indique o nome de quem assina.', 'Enter the signatory’s name.') });
  return w;
}

export const avisoTaxa: Warning = {
  level: 'info',
  message: l(
    'Não existe base legal para cobrar esta declaração, salvo taxa fixada por postura municipal.',
    'There is no legal basis to charge for this declaration unless a municipal by-law sets a fee.',
  ),
};
