// Shared building blocks for the education documents ("educacao"): student and
// parent/guardian fields, the classic school identification formula, gendered
// nouns that depend on the level of education, the institution's name and
// licence, and the school signatories.

import { formatMonthYear, inteiroPorExtenso } from '@/lib/format';
import { isPublicBody, profileDisplayName } from '@/lib/storage/types';
import type { Block, FieldDef, FieldOption, SignatureColumn, TemplateContext, Values, Warning } from '../model';
import { BLANK, dateLong, DOC_TIPO_OPTIONS, GENERO_OPTIONS, isF, l } from './_shared';

// ---------------------------------------------------------------- Text helpers

export const str = (x: unknown) => String(x ?? '').trim();
export const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
export const num = (x: unknown) => {
  const n = Number(String(x ?? '').replace(',', '.'));
  return Number.isFinite(n) && str(x) !== '' ? n : null;
};
export const rows = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? (v as Record<string, any>[]) : []);
export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** "a, b e c" */
export const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/** "Outubro de 2026" from a month field (YYYY-MM) or a date. */
export function mesAno(x: unknown): string {
  const s = str(x);
  if (/^\d{4}-\d{2}$/.test(s)) return formatMonthYear(`${s}-01`);
  return formatMonthYear(s);
}

/** "30 (trinta) dias"; a blank when missing. */
export function quantos(n: number | null, sing: string, plur: string, fem = false): string {
  if (n == null || n <= 0) return `${BLANK} ${plur}`;
  if (n === 1) return `${fem ? 'uma' : 'um'} ${sing}`;
  const ext = Number.isInteger(n) && n < 1_000_000 ? inteiroPorExtenso(n) : '';
  const extF = fem ? ext.replace(/\bum$/, 'uma').replace(/\bdois$/, 'duas') : ext;
  return `${n}${ext ? ` (${extF})` : ''} ${plur}`;
}

/** A percentage typed by the user (never a legal value): "5%". */
export const pct = (x: unknown) => {
  const n = num(x);
  return n == null ? `${BLANK}%` : `${String(n).replace('.', ',')}%`;
};

// ---------------------------------------------------------------- Levels and nouns

export const NIVEL_OPTIONS: FieldOption[] = [
  { value: 'pre-escolar', label: l('Pré-escolar / creche', 'Pre-school / nursery') },
  { value: 'primario', label: l('Ensino Primário', 'Primary school') },
  { value: 'secundario', label: l('Ensino Secundário', 'Secondary school') },
  { value: 'tecnico', label: l('Ensino Técnico-Profissional', 'Technical / vocational school') },
  { value: 'superior', label: l('Ensino Superior', 'Higher education') },
  { value: 'formacao', label: l('Curso de formação / curso livre', 'Training course') },
  { value: 'linguas', label: l('Curso de línguas', 'Language course') },
  { value: 'explicacao', label: l('Explicações', 'Tutoring') },
  { value: 'conducao', label: l('Escola de condução', 'Driving school') },
];

export const NIVEL_TEXTO: Record<string, string> = {
  'pre-escolar': 'Educação Pré-Escolar',
  primario: 'Ensino Primário',
  secundario: 'Ensino Secundário',
  tecnico: 'Ensino Técnico-Profissional',
  superior: 'Ensino Superior',
  formacao: 'formação',
  linguas: 'curso de línguas',
  explicacao: 'explicações',
  conducao: 'formação de condutores',
};

/** Levels where the person attends a "classe" (general education). */
export const temClasse = (v: Values) => ['pre-escolar', 'primario', 'secundario', 'tecnico', 'explicacao'].includes(str(v.nivel) || 'secundario');
export const eSuperior = (v: Values) => v.nivel === 'superior';
export const eCurso = (v: Values) => ['formacao', 'linguas', 'conducao'].includes(str(v.nivel));

/** Gendered noun for the person studying, by level: aluno / estudante / formando / instruendo. */
export function estudante(v: Values, prefix = 'aluno') {
  const f = isF(v[`${prefix}Genero`]);
  const nivel = str(v.nivel);
  const [m, fe] =
    nivel === 'superior'
      ? ['estudante', 'estudante']
      : nivel === 'formacao' || nivel === 'linguas'
        ? ['formando', 'formanda']
        : nivel === 'conducao'
          ? ['instruendo', 'instruenda']
          : ['aluno', 'aluna'];
  const n = f ? fe : m;
  return {
    f,
    n,
    o: `${f ? 'a' : 'o'} ${n}`,
    O: `${f ? 'A' : 'O'} ${n}`,
    do: `${f ? 'da' : 'do'} ${n}`,
    ao: `${f ? 'à' : 'ao'} ${n}`,
    referido: `${f ? 'a referida' : 'o referido'} ${n}`,
    Referido: `${f ? 'A referida' : 'O referido'} ${n}`,
    filho: f ? 'filha' : 'filho',
    nascido: f ? 'nascida' : 'nascido',
    portador: f ? 'portadora' : 'portador',
    matriculado: f ? 'matriculada' : 'matriculado',
    educando: f ? 'a sua educanda' : 'o seu educando',
    Educando: f ? 'Educanda' : 'Educando',
    ele: f ? 'ela' : 'ele',
  };
}

// ---------------------------------------------------------------- Institution

export const INSTITUICAO_OPTIONS: FieldOption[] = [
  { value: 'Escola', label: l('Escola', 'School') },
  { value: 'Colégio', label: l('Colégio', 'College (school)') },
  { value: 'Instituto', label: l('Instituto', 'Institute') },
  { value: 'Universidade', label: l('Universidade', 'University') },
  { value: 'Centro', label: l('Centro (de formação, de explicações)', 'Centre') },
  { value: 'Academia', label: l('Academia', 'Academy') },
  { value: 'Instituição', label: l('Instituição', 'Institution') },
];
const MASC = new Set(['Colégio', 'Instituto', 'Centro']);

/** "nesta Escola" / "neste Instituto"; "desta Escola"… */
export function inst(v: Values) {
  const n = str(v.designacao) || 'Escola';
  const m = MASC.has(n);
  return { n, nesta: `${m ? 'neste' : 'nesta'} ${n}`, desta: `${m ? 'deste' : 'desta'} ${n}`, esta: `${m ? 'este' : 'esta'} ${n}`, a: `${m ? 'o' : 'a'} ${n}`, A: `${m ? 'O' : 'A'} ${n}` };
}

export function designacaoField(section: string): FieldDef {
  return {
    name: 'designacao',
    type: 'select',
    section,
    width: 'half',
    label: l('Designação da instituição no texto', 'How the institution is named in the text'),
    help: l('Usado em frases como "nesta Escola" ou "neste Instituto".', 'Used in phrases such as "nesta Escola" ("at this School").'),
    options: INSTITUICAO_OPTIONS,
    default: 'Escola',
  };
}

export const schoolName = (ctx: TemplateContext) => profileDisplayName(ctx.profile) || BLANK;
export const licenca = (ctx: TemplateContext) => str(ctx.profile?.licenca);
export const isPrivateSchool = (ctx: TemplateContext) => ctx.profile?.kind === 'empresa' && !isPublicBody(ctx.profile);

/** Warning when a private school profile has no licence. */
export function licenceWarning(ctx: TemplateContext): Warning[] {
  if (!isPrivateSchool(ctx) || licenca(ctx)) return [];
  return [
    {
      level: 'warning',
      message: l(
        'O perfil não tem o número do alvará ou licença do estabelecimento. Indique-o no perfil (ex.: "Alvará n.º 112/DPEDH-MPT/2023"): o ensino privado depende de licença e muitas entidades recusam documentos de escolas sem licença identificada.',
        'The profile has no licence number. Add it to the profile: private teaching requires a licence and many bodies refuse documents from schools without an identified licence.',
      ),
    },
  ];
}

// ---------------------------------------------------------------- Student and guardian fields

type AlunoKey = 'nome' | 'genero' | 'nascimento' | 'naturalidade' | 'docTipo' | 'docNumero' | 'docEmissao' | 'pai' | 'mae' | 'numero';

export const ALUNO_DOC_OPTIONS: FieldOption[] = [
  ...DOC_TIPO_OPTIONS,
  { value: 'Cédula Pessoal', label: l('Cédula pessoal', 'Personal record card (cédula)') },
  { value: 'Certidão de Nascimento', label: l('Certidão de nascimento', 'Birth certificate') },
];

export function alunoFields(keys: AlunoKey[], section = 'aluno', prefix = 'aluno'): FieldDef[] {
  const defs: Record<AlunoKey, Omit<FieldDef, 'name' | 'section'>> = {
    nome: { type: 'text', label: l('Nome completo', 'Full name'), required: true, personKey: 'nome' },
    genero: { type: 'radio', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', width: 'half' },
    nascimento: { type: 'date', label: l('Data de nascimento', 'Date of birth'), width: 'half' },
    naturalidade: { type: 'text', label: l('Naturalidade', 'Place of birth'), width: 'half', placeholder: l('Ex.: Maputo', 'E.g. Maputo') },
    docTipo: { type: 'select', label: l('Documento de identificação', 'ID document'), options: ALUNO_DOC_OPTIONS, default: 'BI', personKey: 'docTipo', width: 'half' },
    docNumero: { type: 'text', label: l('Número do documento', 'Document number'), personKey: 'docNumero', width: 'half' },
    docEmissao: { type: 'date', label: l('Data de emissão (opcional)', 'Issue date (optional)'), personKey: 'docEmissao', width: 'half' },
    pai: { type: 'text', label: l('Nome do pai', "Father's name"), width: 'half' },
    mae: { type: 'text', label: l('Nome da mãe', "Mother's name"), width: 'half' },
    numero: { type: 'text', label: l('N.º de estudante / processo', 'Student / file number'), width: 'half' },
  };
  return keys.map((k) => ({ ...defs[k], name: `${prefix}${cap(k)}`, section }));
}

type EncKey = 'nome' | 'genero' | 'parentesco' | 'docTipo' | 'docNumero' | 'telefone' | 'email' | 'morada';

export const PARENTESCO_OPTIONS: FieldOption[] = [
  { value: 'pai', label: l('Pai', 'Father') },
  { value: 'mãe', label: l('Mãe', 'Mother') },
  { value: 'tutor', label: l('Tutor(a)', 'Guardian') },
  { value: 'avô/avó', label: l('Avô / avó', 'Grandparent') },
  { value: 'tio/tia', label: l('Tio / tia', 'Uncle / aunt') },
  { value: 'irmão/irmã', label: l('Irmão / irmã', 'Sibling') },
  { value: 'outro', label: l('Outro familiar', 'Other relative') },
];

export function encarregadoFields(keys: EncKey[], section = 'encarregado', prefix = 'encarregado'): FieldDef[] {
  const pessoa = (c: { profile: any }) => (c.profile?.kind === 'pessoa' ? c.profile : null);
  const defs: Record<EncKey, Omit<FieldDef, 'name' | 'section'>> = {
    nome: { type: 'text', label: l('Nome completo', 'Full name'), required: true, personKey: 'nome', default: (c) => pessoa(c)?.nome ?? '' },
    genero: { type: 'radio', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, personKey: 'genero', width: 'half', default: (c) => pessoa(c)?.genero ?? 'M' },
    parentesco: { type: 'select', label: l('Parentesco', 'Relationship'), options: PARENTESCO_OPTIONS, default: 'pai', width: 'half' },
    docTipo: { type: 'select', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, personKey: 'docTipo', width: 'half', default: (c) => pessoa(c)?.docTipo ?? 'BI' },
    docNumero: { type: 'text', label: l('Número do documento', 'Document number'), personKey: 'docNumero', width: 'half', default: (c) => pessoa(c)?.docNumero ?? '' },
    telefone: { type: 'tel', label: l('Telefone', 'Phone'), personKey: 'telefone', width: 'half', default: (c) => pessoa(c)?.telefones ?? '' },
    email: { type: 'email', label: l('Email (opcional)', 'Email (optional)'), width: 'half', default: (c) => pessoa(c)?.email ?? '' },
    morada: { type: 'text', label: l('Morada', 'Address'), personKey: 'morada' },
  };
  return keys.map((k) => ({ ...defs[k], name: `${prefix}${cap(k)}`, section }));
}

/** Academic fields: level, year, class or course, group, shift. */
export function academicFields(section = 'frequencia', opts: { turma?: boolean; turno?: boolean; curso?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [
    { name: 'nivel', type: 'select', section, width: 'half', label: l('Nível / tipo de ensino', 'Level / type of education'), options: NIVEL_OPTIONS, default: 'secundario' },
    {
      name: 'anoLectivo',
      type: 'text',
      section,
      width: 'half',
      required: true,
      label: l('Ano lectivo', 'School year'),
      help: l('No ensino geral o ano lectivo coincide com o ano civil (ex.: 2026). No ensino superior pode escrever "2026" ou "2026/2027".', 'In general education the school year is the calendar year.'),
      default: (c) => (c.today || '').slice(0, 4),
    },
    {
      name: 'classe',
      type: 'text',
      section,
      width: 'half',
      label: l('Classe ou ano', 'Grade or year'),
      placeholder: l('Ex.: 10.ª classe · 2.º ano', 'E.g. 10.ª classe · 2.º ano'),
    },
  ];
  if (opts.curso !== false)
    out.push({
      name: 'curso',
      type: 'text',
      section,
      width: 'half',
      label: l('Curso (opcional)', 'Course (optional)'),
      placeholder: l('Ex.: Licenciatura em Contabilidade · Electricidade Industrial', 'E.g. BA in Accounting'),
    });
  if (opts.turma !== false) out.push({ name: 'turma', type: 'text', section, width: 'half', label: l('Turma (opcional)', 'Class group (optional)'), placeholder: l('Ex.: B', 'E.g. B') });
  if (opts.turno !== false)
    out.push({
      name: 'turno',
      type: 'select',
      section,
      width: 'half',
      label: l('Turno / regime', 'Shift'),
      options: [
        { value: '', label: l('— não indicar —', '— do not state —') },
        { value: 'diurno', label: l('Diurno', 'Day') },
        { value: 'da manhã', label: l('Manhã', 'Morning') },
        { value: 'da tarde', label: l('Tarde', 'Afternoon') },
        { value: 'nocturno', label: l('Nocturno', 'Evening') },
        { value: 'pós-laboral', label: l('Pós-laboral', 'After-work') },
      ],
      default: '',
    });
  return out;
}

/** "a 10.ª classe, turma B, do curso diurno" / "o 2.º ano do curso de Licenciatura em …". */
export function frequenciaTexto(v: Values): string {
  const classe = str(v.classe);
  const curso = str(v.curso);
  const turma = str(v.turma);
  const turno = str(v.turno);
  if (eSuperior(v) || eCurso(v)) {
    const head = classe && curso ? `o ${classe} do curso de **${curso}**` : classe ? `o **${classe}**` : `o curso de **${curso || BLANK}**`;
    const parts = [head, turma ? `turma ${turma}` : '', turno ? `em regime ${turno}` : ''].filter(Boolean);
    return parts.join(', ');
  }
  const parts = [
    `a **${classe || BLANK}**`,
    curso ? `curso de ${curso}` : '',
    turma ? `turma ${turma}` : '',
    turno ? `turno ${turno}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Classic identification: "**Nome**, filho de X e de Y, nascido aos …, natural de …,
 * portador do BI n.º …". Optional parts are left out when empty.
 */
export function alunoIdent(v: Values, opts: { filiacao?: boolean; prefix?: string } = {}): string {
  const p = opts.prefix ?? 'aluno';
  const e = estudante(v, p);
  const get = (k: string) => str(v[`${p}${k}`]);
  const parts = [`**${get('Nome') || BLANK}**`];
  if (opts.filiacao !== false && (get('Pai') || get('Mae'))) {
    const pais = [get('Pai'), get('Mae')].filter(Boolean);
    parts.push(`${e.filho} de ${pais.join(' e de ')}`);
  }
  if (get('Nascimento')) parts.push(`${e.nascido} aos ${dateLong(get('Nascimento'))}`);
  if (get('Naturalidade')) parts.push(`natural de ${get('Naturalidade')}`);
  if (get('DocNumero')) parts.push(`${e.portador} ${/^(Cédula|Certidão)/.test(get('DocTipo')) ? 'da' : 'do'} ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}`);
  return parts.length > 1 ? `${parts.join(', ')},` : parts[0];
}

// ---------------------------------------------------------------- Signatories

export const ASSINANTE_OPTIONS: FieldOption[] = [
  { value: 'O Director', label: l('Director', 'Director') },
  { value: 'A Directora', label: l('Directora', 'Director (female)') },
  { value: 'O Director Pedagógico', label: l('Director Pedagógico', 'Academic Director') },
  { value: 'A Directora Pedagógica', label: l('Directora Pedagógica', 'Academic Director (female)') },
  { value: 'O Director Adjunto Pedagógico', label: l('Director Adjunto Pedagógico', 'Deputy Academic Director') },
  { value: 'O Chefe da Secretaria', label: l('Chefe da Secretaria', 'Head of the Registry') },
  { value: 'A Chefe da Secretaria', label: l('Chefe da Secretaria (feminino)', 'Head of the Registry (female)') },
  { value: 'O Reitor', label: l('Reitor', 'Rector') },
  { value: 'O Director do Centro', label: l('Director do Centro', 'Centre Director') },
  { value: 'A Direcção', label: l('A Direcção', 'The Management') },
];

function cargoToRole(cargo: string): string {
  const c = cargo.trim();
  if (!c) return 'O Director';
  if (/^(O|A|Os|As)\s/.test(c)) return c;
  return /^[A-Za-zÀ-ÿ-]*(ora|ina|essa|a)$/i.test(c.split(/\s+/)[0]) ? `A ${c}` : `O ${c}`;
}

export function signatoryFields(section = 'assinatura', opts: { segundo?: boolean } = {}): FieldDef[] {
  const out: FieldDef[] = [
    {
      name: 'assinanteCargo',
      type: 'text',
      section,
      width: 'half',
      label: l('Quem assina (cargo)', 'Signatory (position)'),
      placeholder: l('Ex.: A Directora Pedagógica', 'E.g. The Academic Director'),
      default: (c) => cargoToRole(c.profile?.representanteCargo ?? ''),
    },
    { name: 'assinanteNome', type: 'text', section, width: 'half', label: l('Nome de quem assina', "Signatory's name"), default: (c) => c.profile?.representanteNome ?? '' },
  ];
  if (opts.segundo !== false) {
    out.push(
      {
        name: 'segundoAssinante',
        type: 'toggle',
        section,
        label: l('Segunda assinatura (ex.: Chefe da Secretaria)', 'Second signature (e.g. head of registry)'),
        help: l('Muitas escolas assinam as declarações pela Secretaria, com o visto do Director.', 'Many schools sign declarations by the registry, countersigned by the director.'),
      },
      { name: 'assinante2Cargo', type: 'text', section, width: 'half', label: l('Cargo (2.ª assinatura)', 'Position (2nd signature)'), default: 'O Chefe da Secretaria', showIf: (v) => Boolean(v.segundoAssinante) },
      { name: 'assinante2Nome', type: 'text', section, width: 'half', label: l('Nome (2.ª assinatura)', 'Name (2nd signature)'), showIf: (v) => Boolean(v.segundoAssinante) },
    );
  }
  return out;
}

export function schoolSignatures(v: Values): SignatureColumn[] {
  const main: SignatureColumn = { role: str(v.assinanteCargo) || 'O Director', name: str(v.assinanteNome) || undefined, image: 'both' };
  if (!v.segundoAssinante) return [main];
  return [{ role: str(v.assinante2Cargo) || 'O Chefe da Secretaria', name: str(v.assinante2Nome) || undefined }, main];
}

/** Closing formula of school declarations. */
export function fechoDeclaracao(v: Values, ctx: TemplateContext): Block {
  const i = inst(v);
  const publica = isPublicBody(ctx.profile);
  return {
    type: 'paragraph',
    id: 'fecho',
    text: `Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai assinada e autenticada com o carimbo ${publica ? 'a óleo ' : ''}em uso ${i.nesta}.`,
    en: 'This declaration is issued on request, signed and authenticated with the institution’s stamp.',
    keepWithNext: true,
  };
}

/** Finality phrase: "A presente declaração destina-se a …". */
export function finalidadeBlock(v: Values): Block[] {
  const f = semPonto(v.finalidade);
  if (!f) return [];
  const g = f.replace(/^para\s+/i, '');
  const first = g.split(/\s+/)[0] ?? '';
  const text = /^efeitos\b/i.test(g)
    ? `A presente declaração é emitida para ${g}.`
    : /(ar|er|ir|or)$/i.test(first)
      ? `A presente declaração destina-se a ${g}.`
      : `A presente declaração é emitida para efeitos de ${g}.`;
  return [{ type: 'paragraph', id: 'finalidade', text, en: `This declaration is issued for: ${f}.` }];
}

export const FINALIDADE_FIELD = (section: string): FieldDef => ({
  name: 'finalidade',
  type: 'text',
  section,
  label: l('Finalidade (opcional)', 'Purpose (optional)'),
  placeholder: l('Ex.: apresentar à entidade empregadora · renovação do DIRE · bolsa de estudo', 'E.g. employer · residence permit renewal · scholarship'),
  help: l('Se ficar em branco, a declaração vale "para os devidos efeitos".', 'If blank, the declaration is "for all due purposes".'),
});

/** Destination phrase from the profile: "Escola Primária e Secundária Horizonte, Lda". */
export const nomeEscola = schoolName;
