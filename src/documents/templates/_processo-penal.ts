// Shared pieces for criminal, labour and administrative litigation documents:
// the authority or court addressed in a criminal case, the applicant's fields
// filled from a personal profile, the optional lawyer and the closing.

import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import type { Block, DefaultsContext, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, isF, l, lawyerFields, lawyerSignature } from './_shared';
import { courtAddressee, courtFields, deArtigo, partyDesc, partyFields } from './_advocacia';

export const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
export const endDot = (s: string) => (!s ? s : /[.:;!?]$/.test(s) ? s : `${s}.`);
export const noDot = (s: string) => s.replace(/[.;]\s*$/, '');

/** "da Cidade de Maputo", "do Distrito de Boane", "de Nampula". */
export function deLocal(s: string): string {
  if (/^(cidade|prov[ií]ncia|delega[cç][aã]o|sec[cç][aã]o|\d+\.?ª)/i.test(s)) return `da ${s}`;
  if (/^(distrito|posto|comando|munic[ií]pio|tribunal|gabinete|servi[cç]o)/i.test(s)) return `do ${s}`;
  return `de ${s}`;
}

// ---------------------------------------------------------------- Authority (complaints)

export const AUTORIDADE_OPTIONS: FieldOption[] = [
  { value: 'mp', label: l('Ministério Público (Procuradoria da República)', 'Public Prosecutor (Procuradoria)') },
  { value: 'prm', label: l('Polícia da República de Moçambique (esquadra)', 'Police station (PRM)') },
  { value: 'sernic', label: l('SERNIC (investigação criminal)', 'SERNIC (criminal investigation)') },
];

/** Authority receiving a complaint or report: `destinoTipo`, `destinoLocal`. */
export function autoridadeFields(section: string): FieldDef[] {
  return [
    { name: 'destinoTipo', type: 'select', section, required: true, label: l('Entidade', 'Authority'), options: AUTORIDADE_OPTIONS, default: 'mp' },
    {
      name: 'destinoLocal',
      type: 'text',
      section,
      label: l('Qual (local)', 'Which one (place)'),
      default: 'Cidade de Maputo',
      placeholder: l('Ex.: Cidade de Maputo; Província de Sofala; Distrito de Boane; 1.ª Esquadra da PRM da Matola', 'E.g. Maputo City; Sofala Province; 1st PRM station, Matola'),
      help: l(
        'Pode apresentar na Procuradoria da República, numa esquadra da PRM ou no SERNIC da área onde os factos ocorreram. Todos remetem ao Ministério Público.',
        'You may file with the Prosecutor’s office, a PRM station or SERNIC in the area where it happened. All forward it to the Prosecutor.',
      ),
    },
  ];
}

export function autoridadeAddressee(v: Values): string {
  const local = str(v.destinoLocal);
  switch (v.destinoTipo) {
    case 'prm':
      return `Exmo. Senhor Comandante ${local ? deLocal(local) : 'da Esquadra da Polícia da República de Moçambique de ____________________'}`;
    case 'sernic':
      return `Exmo. Senhor Director do Serviço Nacional de Investigação Criminal${local ? ` — ${local}` : ''}`;
    default:
      return `Exmo. Senhor Magistrado do Ministério Público junto da Procuradoria da República ${local ? deLocal(local) : 'de ____________________'}`;
  }
}

// ---------------------------------------------------------------- Pending criminal case

export type Fase = 'mp' | 'instrucao' | 'julgamento';

const FASES: Record<Fase, FieldOption> = {
  mp: { value: 'mp', label: l('Ministério Público (fase de instrução)', 'Public Prosecutor (investigation)') },
  instrucao: { value: 'instrucao', label: l('Juiz de instrução criminal', 'Investigating judge') },
  julgamento: { value: 'julgamento', label: l('Tribunal de julgamento', 'Trial court') },
};

/**
 * Case number, phase and addressee of a pending criminal case: `processoNumero`,
 * `fase`, `procuradoria` (Ministério Público), `tribunal`, `seccao`, `juiz`.
 */
export function penalCaseFields(section: string, opts: { fases?: Fase[]; defaultFase?: Fase; processoRequired?: boolean } = {}): FieldDef[] {
  const fases = opts.fases ?? ['mp', 'instrucao', 'julgamento'];
  const def = opts.defaultFase ?? fases[0];
  const faseOf = (v: Values): Fase => (fases.includes(v.fase) ? v.fase : def);
  const fields: FieldDef[] = [
    {
      name: 'processoNumero',
      type: 'text',
      section,
      width: 'half',
      required: opts.processoRequired !== false,
      label: l('Processo n.º', 'Case no.'),
      placeholder: l('Ex.: 312/PRCM/2026', 'E.g. 312/PRCM/2026'),
    },
  ];
  if (fases.length > 1) {
    fields.push({
      name: 'fase',
      type: 'select',
      section,
      width: 'half',
      label: l('Onde está o processo', 'Where the case is'),
      options: fases.map((f) => FASES[f]),
      default: def,
      help: l(
        'Na instrução, o processo está com o Ministério Público. Depois da acusação, passa ao juiz de instrução (audiência preliminar) ou ao tribunal de julgamento.',
        'During the investigation the case is with the Prosecutor; after the accusation, with the investigating judge or the trial court.',
      ),
    });
  }
  if (fases.includes('mp')) {
    fields.push({
      name: 'procuradoria',
      type: 'text',
      section,
      label: l('Procuradoria da República', 'Prosecutor’s office'),
      default: 'Cidade de Maputo',
      placeholder: l('Ex.: Cidade de Maputo; Província de Nampula; Distrito de Marracuene', 'E.g. Maputo City; Nampula Province'),
      showIf: (v) => faseOf(v) === 'mp',
    });
  }
  if (fases.some((f) => f !== 'mp')) {
    const judicial = (v: Values) => faseOf(v) !== 'mp';
    for (const f of courtFields(section)) {
      fields.push({ ...f, showIf: judicial, ...(f.name === 'seccao' ? { placeholder: l('Ex.: 5.ª Secção Criminal', 'E.g. 5th Criminal Section'), help: undefined } : {}) });
    }
  }
  return fields;
}

export function faseValue(v: Values, fases: Fase[] = ['mp', 'instrucao', 'julgamento']): Fase {
  return fases.includes(v.fase) ? v.fase : fases[0];
}

/** Upper-case addressee for a filing in a pending criminal case. */
export function penalAddressee(v: Values, fase: Fase): string {
  if (fase === 'mp') {
    const local = str(v.procuradoria);
    return `Exmo. Senhor Magistrado do Ministério Público junto da Procuradoria da República ${local ? deLocal(local) : 'de ____________________'}`.toLocaleUpperCase('pt');
  }
  if (fase === 'instrucao') {
    const tratamento = isF(v.juiz) ? 'Exma. Senhora Juíza de Instrução Criminal' : 'Exmo. Senhor Juiz de Instrução Criminal';
    const tribunal = str(v.tribunal) || `Tribunal Judicial ${BLANK}`;
    const seccao = str(v.seccao);
    return `${tratamento}${seccao ? ` ${deArtigo(seccao)}` : ''} ${deArtigo(tribunal)}`.toLocaleUpperCase('pt');
  }
  return courtAddressee(v);
}

/** "nos autos de processo-crime n.º 312/PRCM/2026" */
export function nosAutos(v: Values, tipo = 'processo-crime'): string {
  const n = str(v.processoNumero);
  return `nos autos de ${tipo}${n ? ` n.º ${n}` : ' à margem identificados'}`;
}

// ---------------------------------------------------------------- Applicant from a personal profile

/** True for a personal profile that is not a lawyer's (a lawyer files for a client). */
const ownProfile = (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && !c.profile.oamCarteira ? c.profile : null);

const FROM_PROFILE: Record<string, (p: NonNullable<DefaultsContext['profile']>) => unknown> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Profissao: (p) => p.profissao,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  Nuit: (p) => p.nuit,
  Morada: (p) => addressLine(p),
  Contacto: (p) => [p.telefones, p.email].filter(Boolean).join(' · '),
};

/**
 * Party fields (see `partyFields` in _advocacia) plus `<p>Contacto`, filled
 * from the user's own personal profile when the user writes for themselves.
 */
export function applicantFields(p: string, section: string, opts: { light?: boolean; defaultTipo?: 'pessoa' | 'empresa'; contacto?: boolean; noEmpresa?: boolean } = {}): FieldDef[] {
  let fields = partyFields(p, section, opts);
  if (opts.noEmpresa) fields = fields.filter((f) => f.name !== `${p}Tipo` && f.name !== `${p}Nuel` && f.name !== `${p}Representante`);
  if (opts.contacto !== false) {
    fields.push({ name: `${p}Contacto`, type: 'text', section, label: l('Telefone / email', 'Phone / email'), personKey: 'telefone' });
  }
  return fields.map((f) => {
    const key = f.name.slice(p.length);
    const get = FROM_PROFILE[key];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const own = ownProfile(c);
        const val = own ? get(own) : undefined;
        if (val) return val;
        return typeof fallback === 'function' ? fallback(c) : (fallback ?? '');
      },
    };
  });
}

/** Party description followed by the contact, if any. */
export function applicantDesc(v: Values, p: string, opts: { docBlank?: boolean } = {}): string {
  const c = str(v[`${p}Contacto`]);
  return `${partyDesc(v, p, opts)}${c ? `, contacto ${c}` : ''}`;
}

// ---------------------------------------------------------------- Lawyer (optional)

/** `viaAdvogado` toggle + the lawyer's fields, shown when it is on. */
export function optionalLawyerFields(section: string, help?: ReturnType<typeof l>): FieldDef[] {
  return [
    {
      name: 'viaAdvogado',
      type: 'toggle',
      section,
      label: l('Apresentado por advogado', 'Filed by a lawyer'),
      default: (c) => Boolean(c.profile?.oamCarteira),
      help,
    },
    ...lawyerFields(section).map((f): FieldDef => ({ ...f, showIf: (v: Values) => Boolean(v.viaAdvogado) })),
  ];
}

/** The lawyer's signature, or the party's own. */
export function partySignature(v: Values, p: string, role: string): SignatureColumn {
  if (v.viaAdvogado) return lawyerSignature(v);
  return { role, name: str(v[`${p}Nome`]) || undefined };
}

/** ", por intermédio do seu mandatário," when filed by a lawyer. */
export const viaMandatario = (v: Values, especiais = false) =>
  v.viaAdvogado ? `, por intermédio do seu mandatário${especiais ? ', com poderes especiais para o acto' : ''},` : '';

// ---------------------------------------------------------------- Issuer helpers

/** Company profile name, for an employer acting through the profile. */
export const issuerName = (ctx: TemplateContext) => profileDisplayName(ctx.profile) || BLANK;

// ---------------------------------------------------------------- Administrative court

/** Administrative court fields: `taNivel`, `taTribunal`, `juiz`. */
export function taFields(section: string): FieldDef[] {
  return [
    {
      name: 'taNivel',
      type: 'radio',
      section,
      label: l('Tribunal', 'Court'),
      default: 'provincial',
      options: [
        { value: 'provincial', label: l('Tribunal administrativo provincial / da Cidade de Maputo', 'Provincial administrative court') },
        { value: 'central', label: l('Tribunal Administrativo (actos do Governo central)', 'Administrative Court (central government acts)') },
      ],
      help: l(
        'Em regra, os actos de órgãos locais e provinciais são impugnados no tribunal administrativo provincial; os do Governo central e dos seus membros no Tribunal Administrativo. Confirme a competência.',
        'As a rule, local and provincial acts go to the provincial administrative court; central government acts to the Administrative Court. Check competence.',
      ),
    },
    {
      name: 'taTribunal',
      type: 'text',
      section,
      label: l('Nome do tribunal', 'Court name'),
      default: 'Tribunal Administrativo da Cidade de Maputo',
      placeholder: l('Ex.: Tribunal Administrativo da Província de Nampula', 'E.g. Administrative Court of Nampula Province'),
      showIf: (v) => v.taNivel !== 'central',
    },
    { name: 'juiz', type: 'radio', section, width: 'half', label: l('Tratamento do juiz', 'Form of address of the judge'), options: [{ value: 'M', label: l('Exmo. Senhor', 'Male') }, { value: 'F', label: l('Exma. Senhora', 'Female') }], default: 'M' },
  ];
}

export function taAddressee(v: Values): string {
  const f = isF(v.juiz);
  if (v.taNivel === 'central') return `${f ? 'Veneranda Juíza Conselheira Presidente' : 'Venerando Juiz Conselheiro Presidente'} do Tribunal Administrativo`.toLocaleUpperCase('pt');
  const t = str(v.taTribunal) || 'Tribunal Administrativo ____________________';
  return `${f ? 'Exma. Senhora Juíza Presidente' : 'Exmo. Senhor Juiz Presidente'} ${deArtigo(t)}`.toLocaleUpperCase('pt');
}

export const VICIOS_ADMIN: { name: string; label: ReturnType<typeof l>; text: string }[] = [
  { name: 'vIncompetencia', label: l('Incompetência do autor do acto', 'Lack of competence'), text: 'O acto foi praticado por órgão sem competência para o efeito, padecendo do vício de incompetência.' },
  { name: 'vFundamentacao', label: l('Falta de fundamentação', 'No statement of reasons'), text: 'O acto não se encontra fundamentado de facto e de direito, ou a fundamentação é obscura, contraditória ou insuficiente, o que constitui vício de forma.' },
  { name: 'vAudiencia', label: l('Sem audiência prévia do interessado', 'No prior hearing'), text: 'A decisão foi tomada sem audiência prévia do interessado, com preterição de formalidade essencial do procedimento.' },
  { name: 'vLei', label: l('Violação de lei', 'Breach of law'), text: 'O acto viola as normas legais aplicáveis, pelas razões expostas, padecendo do vício de violação de lei.' },
  { name: 'vDesvio', label: l('Desvio de poder', 'Misuse of power'), text: 'O poder discricionário foi exercido para fim diverso daquele para que a lei o confere, o que constitui desvio de poder.' },
];

// ---------------------------------------------------------------- Layout

/**
 * Keeps the closing part of a filing together with the signature: every block
 * from the paragraph `fromId` up to the next `signatures` block is marked
 * `keepWithNext`, so the request, witness list, "Junta" and closing formula
 * never leave the signature alone on the last page.
 */
export function keepTail(blocks: Block[], fromId: string): Block[] {
  const start = blocks.findIndex((b) => b.type === 'paragraph' && b.id === fromId);
  if (start < 0) return blocks;
  for (let i = start; i < blocks.length; i++) {
    if (blocks[i].type === 'signatures') break;
    blocks[i] = { ...blocks[i], keepWithNext: true } as Block;
  }
  return blocks;
}
