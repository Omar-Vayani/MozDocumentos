import { addDays, diffDays, parseISODate } from '@/lib/format';
import type { LegalRefId } from '@/legal/mz-legal';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, g, GENERO_OPTIONS, l, lineItems, localField, placeDate } from './_shared';

// ---------------------------------------------------------------- local helpers

type Tipo = 'quotas' | 'anonima' | 'associacao';

const TIPO_OPTIONS = [
  { value: 'quotas', label: l('Sociedade por quotas (Lda.)', 'Private limited company (Lda.)') },
  { value: 'anonima', label: l('Sociedade anónima (S.A.)', 'Public limited company (S.A.)') },
  { value: 'associacao', label: l('Associação', 'Association') },
];

const CONVOCANTE_OPTIONS = [
  { value: 'presidenteMesa', label: l('Presidente da Mesa da Assembleia Geral', 'Chair of the General Meeting') },
  { value: 'administrador', label: l('Administrador', 'Director') },
  { value: 'conselhoAdministracao', label: l('Conselho de Administração', 'Board of Directors') },
  { value: 'conselhoFiscal', label: l('Conselho Fiscal / Fiscal Único', 'Audit board / sole auditor') },
  { value: 'socios', label: l('Sócios que requereram a assembleia', 'Members who requested the meeting') },
];

const ENVIO_OPTIONS = [
  { value: 'carta', label: l('Carta ou email para cada sócio', 'Letter or email to each member') },
  { value: 'publicacao', label: l('Publicação em jornal', 'Newspaper publication') },
];

const tipoOf = (v: Values): Tipo => (v.tipoEntidade === 'anonima' || v.tipoEntidade === 'associacao' ? v.tipoEntidade : 'quotas');
const isSociedade = (v: Values) => tipoOf(v) !== 'associacao';

const PRAZO_ID: Record<Tipo, LegalRefId> = {
  quotas: 'convocatoriaQuotasPrazo',
  anonima: 'convocatoriaAnonimaPrazo',
  associacao: 'convocatoriaAssociacao',
};

/** "sócios" / "accionistas" / "associados" */
const membros = (t: Tipo) => (t === 'anonima' ? 'accionistas' : t === 'associacao' ? 'associados' : 'sócios');
const entidadeDe = (t: Tipo) => (t === 'associacao' ? 'da associação' : 'da sociedade');
const estatutos = (t: Tipo) => (t === 'associacao' ? 'dos estatutos' : 'do contrato de sociedade');

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** "12 de Novembro de 2026 (quinta-feira)" */
function diaCompleto(iso: unknown): string {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${dateLong(iso)} (${DIAS_SEMANA[d.getDay()]})` : dateLong(iso);
}

/** "10:30" → "pelas 10 horas e 30 minutos". Unparsable input is printed as typed. */
function hora(s: unknown): string {
  const t = typeof s === 'string' ? s.trim() : '';
  if (!t) return 'pelas ____ horas';
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?\s*(?:h|horas)?$/.exec(t);
  if (!m) return `pelas ${t}`;
  const h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? Number(m[2]) : 0;
  return `${h === 1 ? 'pela' : 'pelas'} ${h} ${h === 1 ? 'hora' : 'horas'}${min ? ` e ${min} ${min === 1 ? 'minuto' : 'minutos'}` : ''}`;
}

const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim().replace(/[;:]$/, '.') : `${s.trim()}.`);

/** Who calls the meeting, as it is written in the opening and under the signature. */
function convocante(v: Values): { quem: string; role: string; plural: boolean } {
  const f = v.convocanteGenero === 'F';
  switch (v.convocante) {
    case 'administrador':
      return { quem: f ? 'a Administradora' : 'o Administrador', role: f ? 'A Administradora' : 'O Administrador', plural: false };
    case 'conselhoAdministracao':
      return { quem: 'o Conselho de Administração', role: 'Pelo Conselho de Administração', plural: false };
    case 'conselhoFiscal':
      return { quem: 'o Conselho Fiscal', role: 'Pelo Conselho Fiscal', plural: false };
    case 'socios':
      return { quem: `os ${membros(tipoOf(v))} abaixo assinados`, role: `Os ${membros(tipoOf(v)).replace(/^./, (c) => c.toUpperCase())}`, plural: true };
    default:
      return {
        quem: f ? 'a Presidente da Mesa da Assembleia Geral' : 'o Presidente da Mesa da Assembleia Geral',
        role: f ? 'A Presidente da Mesa da Assembleia Geral' : 'O Presidente da Mesa da Assembleia Geral',
        plural: false,
      };
  }
}

const ucFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default defineTemplate({
  id: 'convocatoria-assembleia',
  sections: [
    { id: 'entidade', title: l('Entidade e assembleia', 'Entity and meeting') },
    { id: 'convocante', title: l('Quem convoca', 'Who calls the meeting') },
    { id: 'reuniao', title: l('Data, hora e local', 'Date, time and place') },
    { id: 'ordem', title: l('Ordem de trabalhos e documentos', 'Agenda and documents') },
    { id: 'documento', title: l('Aviso', 'Notice') },
  ],
  fields: [
    { name: 'tipoEntidade', type: 'select', section: 'entidade', width: 'half', required: true, label: l('Tipo de entidade', 'Type of entity'), options: TIPO_OPTIONS, default: 'quotas' },
    {
      name: 'especie',
      type: 'radio',
      section: 'entidade',
      width: 'half',
      label: l('Espécie de assembleia', 'Type of meeting'),
      legal: l('O aviso deve indicar a espécie de assembleia.', 'The notice must state the type of meeting.'),
      options: [
        { value: 'ordinaria', label: l('Ordinária', 'Ordinary') },
        { value: 'extraordinaria', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinaria',
    },
    {
      name: 'entidadeNome',
      type: 'text',
      section: 'entidade',
      required: true,
      label: l('Nome da sociedade ou associação', 'Name of the company or association'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
    {
      name: 'convocante',
      type: 'select',
      section: 'convocante',
      required: true,
      label: l('Quem convoca', 'Who calls the meeting'),
      legal: l(
        'Convoca o Presidente da Mesa; nas sociedades por quotas, qualquer administrador. O aviso deve indicar a qualidade de quem convoca e ser assinado por quem tem competência.',
        'The chair calls the meeting; in a private limited company, any director. The notice must state the caller’s capacity and be signed by someone competent.',
      ),
      options: CONVOCANTE_OPTIONS,
      default: 'administrador',
    },
    {
      name: 'convocanteNome',
      type: 'text',
      section: 'convocante',
      width: 'half',
      required: true,
      label: l('Nome de quem assina', 'Name of signatory'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : ''),
    },
    {
      name: 'convocanteGenero',
      type: 'radio',
      section: 'convocante',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: GENERO_OPTIONS,
      default: 'M',
    },
    {
      name: 'dataReuniao',
      type: 'date',
      section: 'reuniao',
      width: 'half',
      required: true,
      label: l('Data da reunião', 'Meeting date'),
      legal: l('Deve haver a antecedência mínima fixada por lei entre o aviso e a reunião.', 'The legal minimum notice period must separate the notice and the meeting.'),
    },
    { name: 'horaReuniao', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('Ex.: 10:00', 'E.g. 10:00') },
    {
      name: 'localReuniao',
      type: 'text',
      section: 'reuniao',
      required: true,
      label: l('Local', 'Place'),
      help: l('Continua a frase «…, ». Ex.: «na sede social, sita em…».', 'E.g. “at the head office at…”.'),
      default: (c) => (c.profile?.kind === 'empresa' && addressLine(c.profile) ? `na sede social, sita em ${addressLine(c.profile)}` : ''),
    },
    {
      name: 'segundaConvocacao',
      type: 'toggle',
      section: 'reuniao',
      default: true,
      label: l('Marcar já a segunda convocação', 'Set the second call now'),
      help: l(
        'Se não houver quórum na primeira data, a assembleia reúne na segunda data indicada. Nas sociedades, entre as duas datas tem de haver o intervalo mínimo da lei.',
        'If there is no quorum on the first date, the meeting is held on the second date. For companies the legal minimum interval applies between the two dates.',
      ),
    },
    {
      name: 'dataSegunda',
      type: 'date',
      section: 'reuniao',
      width: 'half',
      label: l('Data da segunda convocação', 'Second call date'),
      showIf: (v) => Boolean(v.segundaConvocacao),
    },
    {
      name: 'horaSegunda',
      type: 'text',
      section: 'reuniao',
      width: 'half',
      label: l('Hora da segunda convocação', 'Second call time'),
      placeholder: l('Ex.: 10:00', 'E.g. 10:00'),
      showIf: (v) => Boolean(v.segundaConvocacao),
    },
    {
      name: 'ordemTrabalhos',
      type: 'lines',
      section: 'ordem',
      required: true,
      label: l('Ordem de trabalhos', 'Agenda'),
      legal: l('Cada assunto a deliberar deve ser indicado de forma especificada.', 'Each matter to be resolved must be specified.'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [{ name: 'ponto', type: 'text', label: l('Ponto', 'Item'), placeholder: l('Ex.: Aprovação do balanço e das contas do exercício', 'E.g. Approval of the annual accounts') }],
      default: (c) => {
        const ano = Number(c.today.slice(0, 4)) - 1;
        return [
          { ponto: `Apreciação, discussão e votação do balanço, das contas e do relatório da administração referentes ao exercício de ${ano}` },
          { ponto: 'Deliberação sobre a proposta de aplicação de resultados' },
        ];
      },
    },
    {
      name: 'documentos',
      type: 'lines',
      section: 'ordem',
      label: l('Documentos disponíveis para consulta', 'Documents available for inspection'),
      legal: l('O aviso deve indicar os documentos que se encontram na sede para consulta.', 'The notice must list the documents available at the head office.'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'documento', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Relatório e contas do exercício', 'E.g. Annual report and accounts') }],
      default: [],
    },
    {
      name: 'representacao',
      type: 'toggle',
      section: 'ordem',
      default: true,
      label: l('Incluir nota sobre representação', 'Include a note on proxies'),
      help: l('Explica como um sócio se pode fazer representar por outra pessoa.', 'Explains how a member can be represented by someone else.'),
    },
    {
      name: 'representacaoPrazo',
      type: 'text',
      section: 'ordem',
      label: l('Entrega das cartas de representação (opcional)', 'Deadline for proxy letters (optional)'),
      placeholder: l('Ex.: até ao início da reunião', 'E.g. by the start of the meeting'),
      showIf: (v) => Boolean(v.representacao),
    },
    {
      name: 'formaEnvio',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Como vai enviar a convocatória', 'How the notice is sent'),
      options: ENVIO_OPTIONS,
      default: 'carta',
    },
    { name: 'ref', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)') },
    localField(),
    dateField('data', 'documento', l('Data da convocatória', 'Date of the notice')),
  ],

  computed: (v, { legal }) => {
    const t = tipoOf(v);
    const prazo = legal.value<number>(PRAZO_ID[t]);
    const intervaloSegunda = legal.value<number>('segundaConvocacao');
    return {
      prazo,
      intervaloSegunda,
      antecedencia: v.data && v.dataReuniao ? diffDays(v.data, v.dataReuniao) : null,
      dataMinima: v.data ? addDays(v.data, prazo) : null,
      intervalo: v.dataReuniao && v.dataSegunda ? diffDays(v.dataReuniao, v.dataSegunda) : null,
    };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.computed;
    const t = tipoOf(v);
    if (!v.entidadeNome) w.push({ level: 'warning', field: 'entidadeNome', message: l('Indique o nome da sociedade ou associação.', 'Enter the name of the company or association.') });
    if (!v.dataReuniao || !String(v.horaReuniao ?? '').trim() || !String(v.localReuniao ?? '').trim()) {
      w.push({
        level: 'error',
        field: !v.dataReuniao ? 'dataReuniao' : !String(v.horaReuniao ?? '').trim() ? 'horaReuniao' : 'localReuniao',
        message: l('Sem data, hora e local da reunião a assembleia não se considera convocada.', 'Without the date, time and place the meeting is not validly called.'),
      });
    }
    if (c.antecedencia != null && !Number.isNaN(c.antecedencia) && c.antecedencia < c.prazo) {
      w.push({
        level: 'error',
        field: 'dataReuniao',
        message: l(
          `Antecedência insuficiente: a lei exige pelo menos ${c.prazo} dias entre a convocatória e a reunião (${cite(PRAZO_ID[t])}). Marque a reunião para ${dateLong(c.dataMinima)} ou depois.`,
          `Notice too short: at least ${c.prazo} days are required between the notice and the meeting. Set the meeting on ${c.dataMinima} or later.`,
        ),
      });
    }
    if (t === 'anonima') {
      w.push({
        level: 'info',
        field: 'dataReuniao',
        message: l(
          'Na assembleia ordinária, os documentos de prestação de contas devem estar disponíveis ao accionista com a antecedência legal e ser publicados antes da reunião. Confirme os prazos com o seu jurista.',
          'For the annual meeting, the accounts must be made available to shareholders and published in advance. Confirm the deadlines with your lawyer.',
        ),
      });
    }
    if (v.segundaConvocacao) {
      if (!v.dataSegunda) {
        w.push({ level: 'warning', field: 'dataSegunda', message: l('Indique a data da segunda convocação.', 'Enter the second call date.') });
      } else if (c.intervalo != null && !Number.isNaN(c.intervalo)) {
        if (c.intervalo < 0) {
          w.push({ level: 'error', field: 'dataSegunda', message: l('A segunda convocação é anterior à primeira.', 'The second call is before the first.') });
        } else if (isSociedade(v) && c.intervalo <= c.intervaloSegunda) {
          w.push({
            level: 'error',
            field: 'dataSegunda',
            message: l(
              `Entre a primeira e a segunda data devem mediar mais de ${c.intervaloSegunda} dias (${cite('segundaConvocacao')}). Marque a segunda data para ${dateLong(addDays(v.dataReuniao, c.intervaloSegunda + 1))} ou depois.`,
              `More than ${c.intervaloSegunda} days must separate the two dates. Set the second date on ${addDays(v.dataReuniao, c.intervaloSegunda + 1)} or later.`,
            ),
          });
        }
      }
    }
    const ordem = lineItems(v.ordemTrabalhos).map((r) => String(r.ponto ?? '').trim()).filter(Boolean);
    if (!ordem.length) {
      w.push({ level: 'error', field: 'ordemTrabalhos', message: l('Sem ordem de trabalhos a assembleia não se considera convocada.', 'Without an agenda the meeting is not validly called.') });
    }
    if (ordem.some((p) => /outros assuntos|diversos|assuntos gerais/i.test(p))) {
      w.push({
        level: 'info',
        field: 'ordemTrabalhos',
        message: l(
          'Pontos como «outros assuntos» ou «diversos» não permitem deliberar: especifique cada assunto a votar.',
          'Items such as “any other business” do not allow resolutions: specify each matter to be voted on.',
        ),
      });
    }
    const docs = lineItems(v.documentos).map((r) => String(r.documento ?? '').trim()).filter(Boolean);
    if (!docs.length && v.especie === 'ordinaria' && isSociedade(v)) {
      w.push({
        level: 'warning',
        field: 'documentos',
        message: l(
          'Na assembleia ordinária, indique os documentos de prestação de contas disponíveis na sede para consulta.',
          'For the annual meeting, list the accounts documents available at the head office.',
        ),
      });
    }
    if (t === 'quotas' && v.formaEnvio === 'publicacao') {
      w.push({
        level: 'warning',
        field: 'formaEnvio',
        message: l(
          'Nas sociedades por quotas a convocatória é enviada por escrito a cada sócio; o anúncio só serve quando não for possível a comunicação pessoal.',
          'In a private limited company the notice is sent in writing to each member; publication is only for when personal delivery is impossible.',
        ),
      });
    }
    if (t === 'anonima' && v.formaEnvio === 'carta') {
      w.push({
        level: 'info',
        field: 'formaEnvio',
        message: l(
          'Na sociedade anónima a convocatória é publicada; só pode ser substituída por aviso escrito se o contrato de sociedade o permitir.',
          'In a public company the notice is published; a written notice only replaces it if the articles allow it.',
        ),
      });
    }
    if (t !== 'quotas' && (v.convocante === 'administrador' || v.convocante === 'conselhoAdministracao')) {
      w.push({
        level: 'info',
        field: 'convocante',
        message: l(
          'Em regra convoca o Presidente da Mesa. A administração só convoca se o Presidente não o fizer quando devia.',
          'As a rule the chair calls the meeting. The board only does so if the chair fails to.',
        ),
      });
    }
    if (!v.convocanteNome) w.push({ level: 'warning', field: 'convocanteNome', message: l('O aviso deve ser assinado por quem convoca.', 'The notice must be signed by whoever calls the meeting.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = tipoOf(v);
    const especie = v.especie === 'extraordinaria' ? 'Extraordinária' : 'Ordinária';
    const nome = String(v.entidadeNome || '').trim() || profileDisplayName(ctx.profile) || BLANK;
    const m = membros(t);
    const conv = convocante(v);
    const ordem = lineItems(v.ordemTrabalhos).map((r) => String(r.ponto ?? '').trim()).filter(Boolean);
    const docs = lineItems(v.documentos).map((r) => String(r.documento ?? '').trim()).filter(Boolean);
    const sociedade = t !== 'associacao';

    const quem = v.convocanteNome && v.convocante !== 'socios' && v.convocante !== 'conselhoAdministracao' && v.convocante !== 'conselhoFiscal'
      ? `**${v.convocanteNome}**, na qualidade de ${conv.quem.replace(/^(o|a) /, '')} ${entidadeDe(t)} **${nome}**,`
      : `${ucFirst(conv.quem)} ${entidadeDe(t)} **${nome}**`;
    const base = sociedade
      ? `nos termos do ${cite('convocatoriaAssembleiaConteudo')} e ${estatutos(t)}`
      : `nos termos ${estatutos(t)} e do ${cite('convocatoriaAssociacao')}`;
    const verbo = conv.plural ? 'convocam' : 'convoca';

    const blocks: Block[] = [
      { type: 'title', text: 'Convocatória', subtitle: `Assembleia Geral ${especie} — ${nome}` },
    ];
    if (v.ref) blocks.push({ type: 'reference', ref: String(v.ref) });

    if (v.convocante === 'socios') {
      blocks.push({
        type: 'paragraph',
        id: 'requerimento',
        text: `Não tendo a Assembleia Geral sido convocada por quem o devia fazer, apesar de requerida, os ${m} abaixo assinados procedem directamente à sua convocação, nos termos da lei.`,
        en: 'As the general meeting was not called by the person responsible despite a request, the undersigned members call it directly, as the law allows.',
      });
    }

    blocks.push({
      type: 'paragraph',
      id: 'convocacao',
      text: `${quem} ${verbo}, ${base}, os senhores ${m} para reunirem em **Assembleia Geral ${especie}**, no dia **${diaCompleto(v.dataReuniao)}**, ${hora(v.horaReuniao)}, ${String(v.localReuniao || '').trim() || BLANK}, com a seguinte ordem de trabalhos:`,
      en: `The ${conv.role.replace(/^(O|A|Pelo|Os) /, '')} of ${nome} calls the ${m === 'accionistas' ? 'shareholders' : 'members'} to an ${especie === 'Ordinária' ? 'ordinary' : 'extraordinary'} general meeting on the date, at the time and at the place stated, with the following agenda:`,
      keepWithNext: true,
    });
    blocks.push({ type: 'list', style: 'numeric', items: ordem.length ? ordem.map(endDot) : [BLANK] });

    // Documents for inspection
    const consulta = `na sede ${sociedade ? 'social' : 'da associação'}, nas horas normais de expediente, a partir da data desta convocatória`;
    if (docs.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'documentos',
          text: `Encontram-se à disposição dos ${m}, para consulta ${consulta}, os seguintes documentos:`,
          en: 'The following documents are available for inspection at the head office during office hours from the date of this notice:',
          keepWithNext: true,
        },
        { type: 'list', style: 'bullet', items: docs.map(endDot) },
      );
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'documentos',
        text: `Os documentos relativos aos pontos da ordem de trabalhos encontram-se à disposição dos ${m}, para consulta ${consulta}.`,
        en: 'The documents relating to the agenda items are available for inspection at the head office during office hours from the date of this notice.',
      });
    }

    // Second call
    if (v.segundaConvocacao) {
      const mesmoDia = v.dataSegunda && v.dataSegunda === v.dataReuniao;
      const quando = mesmoDia ? `no mesmo dia, ${hora(v.horaSegunda)}` : `no dia **${diaCompleto(v.dataSegunda)}**, ${hora(v.horaSegunda)}`;
      blocks.push({
        type: 'paragraph',
        id: 'segundaConvocacao',
        text: sociedade
          ? `Se, na data indicada, não estiverem presentes ou representados ${m} titulares do capital exigido por lei ou pelo contrato de sociedade, a Assembleia Geral reúne em segunda convocação ${quando}, no mesmo local e com a mesma ordem de trabalhos, podendo então deliberar seja qual for o número de ${m} presentes ou representados e o capital por eles representado.`
          : `Se, à hora marcada, não estiver presente o número de associados exigido, a Assembleia Geral reúne em segunda convocação ${quando}, no mesmo local e com a mesma ordem de trabalhos, deliberando com os associados presentes, nos termos dos estatutos.`,
        en: `If there is no quorum on the date stated, the meeting will be held on second call ${mesmoDia ? 'on the same day' : 'on the second date'} at the time stated, at the same place and with the same agenda${sociedade ? ', and may then resolve whatever the number of members present or the capital represented' : ''}.`,
      });
    }

    // Representation
    if (v.representacao) {
      const prazo = String(v.representacaoPrazo ?? '').trim().replace(/[.,;]$/, '');
      const dirigida = `dirigida ${g(v.convocante === 'presidenteMesa' ? v.convocanteGenero : 'M', 'ao Presidente', 'à Presidente')} da Mesa da Assembleia Geral`;
      blocks.push({
        type: 'paragraph',
        id: 'representacao',
        text: sociedade
          ? `Os ${m} podem fazer-se representar nos termos do ${cite('representacaoAssembleia')} e do contrato de sociedade, mediante carta ${dirigida} ou procuração, ${prazo ? `a entregar ${prazo}` : 'a apresentar até ao início da reunião'}. As pessoas colectivas fazem-se representar por quem para o efeito designarem.`
          : `Os associados podem fazer-se representar nos termos dos estatutos, mediante carta ${dirigida}, ${prazo ? `a entregar ${prazo}` : 'a apresentar até ao início da reunião'}.`,
        en: `Members may be represented by a proxy, by a letter addressed to the chair or a power of attorney, ${prazo ? 'delivered by the deadline stated' : 'presented before the meeting starts'}.`,
      });
    }

    // Closing + signatures
    const last = blocks[blocks.length - 1];
    if (last.type === 'paragraph' || last.type === 'list') last.keepWithNext = true;

    let columns: SignatureColumn[];
    if (v.convocante === 'socios') {
      columns = [
        { role: 'O Sócio', name: v.convocanteNome || undefined },
        { role: 'O Sócio' },
      ];
      if (t === 'anonima') columns = columns.map((c) => ({ ...c, role: 'O Accionista' }));
      if (t === 'associacao') columns = columns.map((c) => ({ ...c, role: 'O Associado' }));
    } else {
      columns = [
        {
          role: conv.role,
          name: v.convocanteNome || undefined,
          image: v.convocante === 'administrador' || v.convocante === 'conselhoAdministracao' ? 'both' : undefined,
        },
      ];
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns });
    return blocks;
  },
});
