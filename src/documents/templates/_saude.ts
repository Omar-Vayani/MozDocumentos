// Shared pieces for health documents: the clinician who signs (with the
// professional order and registration number), the patient's identification,
// the confidentiality marks and the HIV-disclosure check.

import { inteiroPorExtenso } from '@/lib/format/extenso';
import { yearsBetween } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import type { Block, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, blank, DOC_TIPO_OPTIONS, GENERO_OPTIONS, isF, l } from './_shared';

// ---------------------------------------------------------------- Clinician

export const ORDEM_MEDICOS = 'Ordem dos Médicos de Moçambique';
export const ORDEM_ENFERMEIROS = 'Ordem dos Enfermeiros de Moçambique';

export const CATEGORIA_OPTIONS: FieldOption[] = [
  { value: 'geral', label: l('Médico(a) de clínica geral', 'General practitioner') },
  { value: 'especialista', label: l('Médico(a) especialista', 'Medical specialist') },
  { value: 'dentista', label: l('Médico(a) dentista', 'Dentist') },
  { value: 'tecnico', label: l('Técnico(a) de medicina', 'Clinical officer (técnico de medicina)') },
  { value: 'enfermeiro', label: l('Enfermeiro(a)', 'Nurse') },
  { value: 'outro', label: l('Outra categoria', 'Other category') },
];

const TITLE_RE = /^(Dr\.ª|Dra\.|Dr\.|Prof\.ª|Prof\.|Enf\.ª|Enf\.)\s+/;

/** Clinician defaults from the issuing profile: a doctor's own profile, or the clinic's representative. */
function fromProfile(p: Profile | null | undefined): { titulo: string; nome: string; genero: 'M' | 'F' } {
  if (!p) return { titulo: '', nome: '', genero: 'M' };
  if (p.kind === 'pessoa') return { titulo: p.tituloProfissional ?? '', nome: p.nome ?? '', genero: p.genero === 'F' ? 'F' : 'M' };
  const rep = (p.representanteNome ?? '').trim();
  const m = rep.match(TITLE_RE);
  const titulo = m ? m[1] : '';
  return { titulo, nome: m ? rep.slice(m[0].length) : rep, genero: /^(Dra|Dr\.ª|Prof\.ª|Enf\.ª)/.test(titulo) ? 'F' : 'M' };
}

function defaultCategoria(p: Profile | null | undefined): string {
  const esp = p?.especialidade ?? '';
  if (/dent|estomat/i.test(esp)) return 'dentista';
  if (/enferm/i.test(esp) || /Enfermeiros/i.test(p?.ordemProfissional ?? '')) return 'enfermeiro';
  if (esp && !/geral/i.test(esp)) return 'especialista';
  return 'geral';
}

/**
 * Fields identifying the clinician who examines and signs: name, title,
 * category, specialty, order and registration number. Defaulted from the
 * profile so a doctor's own profile fills them in; a clinic changes them for
 * the doctor who saw the patient.
 */
export function clinicianFields(section = 'clinico'): FieldDef[] {
  return [
    {
      name: 'clinicoNome',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Nome do profissional de saúde', 'Health professional’s name'),
      help: l('Sem o título (Dr., Dra.). Numa clínica, indique quem observou o doente.', 'Without the title (Dr.). In a clinic, enter who saw the patient.'),
      default: (c) => fromProfile(c.profile).nome,
    },
    {
      name: 'clinicoTitulo',
      type: 'text',
      section,
      width: 'half',
      label: l('Título (opcional)', 'Title (optional)'),
      placeholder: l('Dr. / Dra.', 'Dr.'),
      default: (c) => fromProfile(c.profile).titulo,
    },
    {
      name: 'clinicoGenero',
      type: 'radio',
      section,
      label: l('Tratamento', 'Form of address'),
      options: GENERO_OPTIONS,
      default: (c) => fromProfile(c.profile).genero,
    },
    {
      name: 'clinicoCategoria',
      type: 'select',
      section,
      width: 'half',
      label: l('Categoria profissional', 'Professional category'),
      options: CATEGORIA_OPTIONS,
      default: (c) => defaultCategoria(c.profile),
    },
    {
      name: 'clinicoCategoriaOutra',
      type: 'text',
      section,
      width: 'half',
      label: l('Qual categoria?', 'Which category?'),
      placeholder: l('Ex.: técnico de cirurgia', 'E.g. surgical technician'),
      showIf: (v) => v.clinicoCategoria === 'outro',
    },
    {
      name: 'clinicoEspecialidade',
      type: 'text',
      section,
      width: 'half',
      label: l('Especialidade', 'Specialty'),
      placeholder: l('Ex.: Pediatria', 'E.g. Paediatrics'),
      showIf: (v) => v.clinicoCategoria === 'especialista',
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.especialidade ?? '' : ''),
    },
    {
      name: 'clinicoOrdem',
      type: 'text',
      section,
      width: 'half',
      label: l('Ordem profissional', 'Professional order'),
      default: (c) => c.profile?.ordemProfissional?.trim() || ORDEM_MEDICOS,
    },
    {
      name: 'clinicoNumero',
      type: 'text',
      section,
      width: 'half',
      label: l('N.º da carteira profissional', 'Registration number'),
      legal: l('Só pode exercer medicina quem está inscrito na Ordem dos Médicos.', 'Only doctors registered with the Medical Council may practise.'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.ordemNumero ?? '' : ''),
    },
  ];
}

const MEDICO = (v: Values) => ['geral', 'especialista', 'dentista'].includes(String(v.clinicoCategoria ?? 'geral'));

/** "médica especialista em Pediatria" */
export function categoriaTexto(v: Values): string {
  const f = isF(v.clinicoGenero);
  const esp = String(v.clinicoEspecialidade ?? '').trim();
  switch (v.clinicoCategoria) {
    case 'especialista':
      return `${f ? 'médica' : 'médico'} especialista${esp ? ` em ${esp}` : ''}`;
    case 'dentista':
      return f ? 'médica dentista' : 'médico dentista';
    case 'tecnico':
      return f ? 'técnica de medicina' : 'técnico de medicina';
    case 'enfermeiro':
      return f ? 'enfermeira' : 'enfermeiro';
    case 'outro':
      return String(v.clinicoCategoriaOutra ?? '').trim() || 'profissional de saúde';
    default:
      return f ? 'médica de clínica geral' : 'médico de clínica geral';
  }
}

const CATEGORIA_EN: Record<string, string> = {
  geral: 'general practitioner',
  especialista: 'medical specialist',
  dentista: 'dentist',
  tecnico: 'clinical officer',
  enfermeiro: 'nurse',
  outro: 'health professional',
};

/** "**Isabel Mondlane Chissano**, médica especialista em Medicina Interna, inscrita na Ordem … sob o n.º 2417" */
export function clinicianDesc(v: Values): { pt: string; en: string } {
  const f = isF(v.clinicoGenero);
  const ordem = String(v.clinicoOrdem ?? '').trim();
  const num = String(v.clinicoNumero ?? '').trim();
  const reg = ordem || num ? `, ${f ? 'inscrita' : 'inscrito'}${ordem ? ` na ${ordem}` : ''} sob o n.º ${num || '________'}` : '';
  const regEn = ordem || num ? `, registered${ordem ? ` with the ${ordem}` : ''} under no. ${num || '________'}` : '';
  return {
    pt: `**${blank(v.clinicoNome)}**, ${categoriaTexto(v)}${reg}`,
    en: `${blank(v.clinicoNome)}, ${CATEGORIA_EN[String(v.clinicoCategoria ?? 'geral')] ?? 'health professional'}${regEn}`,
  };
}

/** "O Médico" / "A Médica Dentista" / "A Enfermeira" */
export function clinicianRole(v: Values): string {
  const f = isF(v.clinicoGenero);
  switch (v.clinicoCategoria) {
    case 'dentista':
      return f ? 'A Médica Dentista' : 'O Médico Dentista';
    case 'tecnico':
      return f ? 'A Técnica de Medicina' : 'O Técnico de Medicina';
    case 'enfermeiro':
      return f ? 'A Enfermeira' : 'O Enfermeiro';
    case 'outro':
      return 'O Profissional de Saúde';
    default:
      return f ? 'A Médica' : 'O Médico';
  }
}

/**
 * Signature column of the clinician: title and name, specialty and
 * "Carteira Profissional n.º … — Ordem …" (same form as professionalSignature).
 * The profile's handwritten signature image is used only when the profile is
 * the clinician's own (or the clinic's signing representative); otherwise only
 * the clinic's stamp is placed and the clinician signs by hand.
 */
export function clinicianSignature(ctx: TemplateContext, role?: string): SignatureColumn {
  const v = ctx.values;
  // A signature line is short: overlong entries are cut so the block keeps its size.
  const cut = (s: unknown, n: number) => {
    const t = String(s ?? '').trim();
    return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
  };
  const nome = cut(v.clinicoNome, 48);
  const tituloRaw = String(v.clinicoTitulo ?? '').trim();
  const titulo = tituloRaw.length <= 8 ? tituloRaw : '';
  const num = cut(v.clinicoNumero, 16);
  const ordem = cut(v.clinicoOrdem, 40);
  const esp = v.clinicoCategoria === 'especialista' ? cut(v.clinicoEspecialidade, 40) : '';
  const cat = cut(categoriaTexto(v), 40);
  const line1 = esp || cat.charAt(0).toUpperCase() + cat.slice(1);
  const reg = num ? `Carteira Profissional n.º ${num}${ordem ? ` — ${ordem}` : ''}` : '';
  const own = fromProfile(ctx.profile).nome.trim();
  const same = !!nome && !!own && nome.toLowerCase() === own.toLowerCase();
  return {
    role: role ?? clinicianRole(v),
    name: nome ? `${titulo ? `${titulo} ` : ''}${nome}` : undefined,
    detail: [line1, reg].filter(Boolean).join('\n') || undefined,
    image: same ? 'both' : 'stamp',
  };
}

export function clinicianWarnings(v: Values): Warning[] {
  const w: Warning[] = [];
  if (!String(v.clinicoNome ?? '').trim()) {
    w.push({ level: 'error', field: 'clinicoNome', message: l('Indique o profissional de saúde que observou o doente.', 'Enter the health professional who saw the patient.') });
  }
  if (MEDICO(v) && !String(v.clinicoNumero ?? '').trim()) {
    w.push({
      level: 'error',
      field: 'clinicoNumero',
      message: l(
        'Indique o número de inscrição na Ordem dos Médicos: a inscrição é condição obrigatória para exercer medicina em Moçambique.',
        'Enter the Medical Council registration number: registration is mandatory to practise medicine in Mozambique.',
      ),
    });
  }
  if (v.clinicoCategoria === 'enfermeiro' && /Médicos/i.test(String(v.clinicoOrdem ?? ''))) {
    w.push({ level: 'warning', field: 'clinicoOrdem', message: l(`Os enfermeiros inscrevem-se na ${ORDEM_ENFERMEIROS}.`, `Nurses register with the ${ORDEM_ENFERMEIROS}.`) });
  }
  return w;
}

// ---------------------------------------------------------------- Patient

type PatientKey = 'nome' | 'genero' | 'dataNascimento' | 'idade' | 'docTipo' | 'docNumero' | 'processo' | 'morada' | 'telefone';

/** Patient fields with the `doente` prefix (doenteNome, doenteGenero…). */
export function patientFields(keys: PatientKey[], section = 'doente', prefix = 'doente'): FieldDef[] {
  const defs: Record<PatientKey, Omit<FieldDef, 'name' | 'section'>> = {
    nome: { type: 'text', label: l('Nome completo', 'Full name'), required: true, personKey: 'nome' },
    genero: { type: 'radio', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', width: 'half' },
    dataNascimento: { type: 'date', label: l('Data de nascimento', 'Date of birth'), width: 'half' },
    idade: {
      type: 'number',
      label: l('Idade (anos)', 'Age (years)'),
      help: l('Se indicou a data de nascimento, a idade é calculada.', 'Calculated when the date of birth is given.'),
      width: 'half',
      min: 0,
      max: 120,
    },
    docTipo: { type: 'select', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo', width: 'half' },
    docNumero: { type: 'text', label: l('Número do documento', 'Document number'), personKey: 'docNumero', width: 'half' },
    processo: { type: 'text', label: l('N.º de processo clínico (opcional)', 'Clinical file number (optional)'), width: 'half' },
    morada: { type: 'text', label: l('Residência (opcional)', 'Address (optional)'), personKey: 'morada' },
    telefone: { type: 'tel', label: l('Telefone (opcional)', 'Phone (optional)'), personKey: 'telefone', width: 'half' },
  };
  const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
  return keys.map((k) => ({ ...defs[k], name: `${prefix}${cap(k)}`, section }));
}

/** Age in years: from the date of birth (at the document date) or the typed age. */
export function patientAge(v: Values, prefix = 'doente', at?: string): number | null {
  const dn = v[`${prefix}DataNascimento`];
  if (typeof dn === 'string' && dn) {
    const y = yearsBetween(dn, at || v.data || '');
    if (Number.isFinite(y) && (at || v.data)) return y;
  }
  const n = Number(v[`${prefix}Idade`]);
  return v[`${prefix}Idade`] !== undefined && v[`${prefix}Idade`] !== '' && Number.isFinite(n) ? n : null;
}

/** "**Nome**, de 34 anos de idade, portador do BI n.º X, residente em Y" (no trailing comma). */
export function patientIdent(v: Values, prefix = 'doente', opts: { morada?: boolean } = {}): { pt: string; en: string } {
  const get = (k: string) => String(v[`${prefix}${k}`] ?? '').trim();
  const f = isF(v[`${prefix}Genero`]);
  const pt = [`**${blank(get('Nome'))}**`];
  const en = [blank(get('Nome'))];
  const age = patientAge(v, prefix);
  if (age != null) {
    pt.push(`de ${age} ${age === 1 ? 'ano' : 'anos'} de idade`);
    en.push(`aged ${age}`);
  }
  if (get('DocNumero')) {
    pt.push(`${f ? 'portadora' : 'portador'} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}`);
    en.push(`holder of ${get('DocTipo') || 'BI'} no. ${get('DocNumero')}`);
  }
  if (opts.morada && get('Morada')) {
    pt.push(`residente em ${get('Morada')}`);
    en.push(`resident in ${get('Morada')}`);
  }
  return { pt: pt.join(', '), en: en.join(', ') };
}

/** "o Senhor" / "a Senhora" (or "o menor" / "a menor"). */
export function senhor(v: Values, prefix = 'doente'): string {
  const age = patientAge(v, prefix);
  const f = isF(v[`${prefix}Genero`]);
  if (age != null && age < 18) return f ? 'a menor' : 'o menor';
  return f ? 'a Senhora' : 'o Senhor';
}

// ---------------------------------------------------------------- Establishment

/** Name of the clinic (company profile) or empty for a doctor's own profile. */
export function establishmentName(ctx: TemplateContext): string {
  const p = ctx.profile;
  return p && p.kind !== 'pessoa' ? (p.nomeComercial || p.firma || '').trim() : '';
}

// ---------------------------------------------------------------- Confidentiality

export const CONFIDENCIAL: Block = { type: 'tags', items: ['CONFIDENCIAL'] };

export function sigiloNote(): Block {
  return {
    type: 'note',
    text: 'Documento sujeito a sigilo médico. Destina-se exclusivamente ao seu destinatário e não pode ser divulgado sem o consentimento do doente.',
    en: 'Subject to medical confidentiality. For the addressee only; may not be disclosed without the patient’s consent.',
  };
}

const HIV_RE = /\b(hiv|vih|sida|aids|seropositiv\w*|serologia\s+positiva|tarv|anti-?retrovira\w*)\b/i;

/** True if any of the texts mentions HIV status or treatment. */
export function mentionsHiv(...texts: unknown[]): boolean {
  return texts.some((t) => typeof t === 'string' && HIV_RE.test(t));
}

export function hivWarning(field: string, level: Warning['level'] = 'warning'): Warning {
  return {
    level,
    field,
    message: l(
      'O texto refere o estado de HIV ou o seu tratamento. O estado serológico é confidencial e não deve constar de documentos entregues a terceiros.',
      'The text mentions HIV status or treatment. HIV status is confidential and must not appear on documents given to third parties.',
    ),
  };
}

// ---------------------------------------------------------------- Numbers

const FEM: [RegExp, string][] = [
  [/\bum\b/g, 'uma'],
  [/\bdois\b/g, 'duas'],
  [/entos\b/g, 'entas'],
];

/** "3 (três)", feminine when asked: "2 (duas)". */
export function countText(n: number | null | undefined, fem = false): string {
  if (n == null || !Number.isFinite(n) || n < 0) return BLANK;
  const int = Math.round(n);
  if (int !== n || int > 999_999) return String(n);
  let w = inteiroPorExtenso(int);
  if (fem) for (const [re, s] of FEM) w = w.replace(re, s);
  return `${int} (${w})`;
}

/** Hours "08:30" check. */
export const HORA_RE = /^([01]?\d|2[0-3])[:h.]([0-5]\d)$/;
export function horaMin(s: unknown): number | null {
  const m = typeof s === 'string' ? s.trim().match(HORA_RE) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export function horaText(s: unknown): string {
  const m = typeof s === 'string' ? s.trim().match(HORA_RE) : null;
  return m ? `${m[1].padStart(2, '0')}h${m[2]}` : '____h____';
}
