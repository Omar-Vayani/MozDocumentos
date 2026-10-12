import { inteiroPorExtenso, MESES, parseISODate } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, g, l, lineItems } from './_shared';

// ---------------------------------------------------------------- local helpers

const TIPO_OPTIONS = [
  { value: 'direccao', label: l('Reunião de Direcção', 'Board of directors meeting') },
  { value: 'agOrdinaria', label: l('Assembleia Geral Ordinária', 'Ordinary general meeting') },
  { value: 'agExtraordinaria', label: l('Assembleia Geral Extraordinária', 'Extraordinary general meeting') },
  { value: 'socios', label: l('Reunião de Sócios', 'Shareholders’ meeting') },
];
const TIPO_TITULO: Record<string, string> = {
  direccao: 'Reunião de Direcção',
  agOrdinaria: 'Assembleia Geral Ordinária',
  agExtraordinaria: 'Assembleia Geral Extraordinária',
  socios: 'Reunião de Sócios',
};
const isAG = (v: Values) => v.tipo === 'agOrdinaria' || v.tipo === 'agExtraordinaria';

/** "Aos doze dias do mês de Outubro do ano de dois mil e vinte e seis" */
function dataPorExtenso(iso: unknown): string {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  if (!d) return 'Aos ____ dias do mês de __________ do ano de ______';
  const dia = d.getDate();
  const diaTxt = dia === 1 ? 'Ao primeiro dia' : `Aos ${inteiroPorExtenso(dia)} dias`;
  return `${diaTxt} do mês de ${MESES[d.getMonth()]} do ano de ${inteiroPorExtenso(d.getFullYear())}`;
}

/** "09:30" → "pelas 9 horas e 30 minutos". Unparsable input is printed as typed. */
function hora(s: unknown, prep: 'pelas' | 'às'): string {
  const t = typeof s === 'string' ? s.trim() : '';
  if (!t) return `${prep} ____ horas`;
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?\s*(?:h|horas)?$/.exec(t);
  if (!m) return `${prep} ${t}`;
  const h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? Number(m[2]) : 0;
  const p = h === 1 ? (prep === 'pelas' ? 'pela' : 'à') : prep;
  const hTxt = `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return `${p} ${hTxt}${min ? ` e ${min} ${min === 1 ? 'minuto' : 'minutos'}` : ''}`;
}
const minutos = (s: unknown): number | null => {
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?/.exec(typeof s === 'string' ? s.trim() : '');
  return m ? Number(m[1]) * 60 + Number(m[2] ?? 0) : null;
};

/** "o Secretário" → "pelo Secretário" */
const pel = (s: string) => s.replace(/^o /, 'pelo ').replace(/^a /, 'pela ');

function listaNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default defineTemplate({
  id: 'acta',
  sections: [
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'mesa', title: l('Mesa e presenças', 'Chair and attendance') },
    { id: 'ordem', title: l('Ordem de trabalhos e deliberações', 'Agenda and resolutions') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'reuniao', width: 'half', required: true, label: l('Tipo de reunião', 'Type of meeting'), options: TIPO_OPTIONS, default: 'agOrdinaria' },
    {
      name: 'numero',
      type: 'text',
      section: 'reuniao',
      width: 'half',
      required: true,
      label: l('Acta n.º', 'Minutes no.'),
      placeholder: l('Ex.: 3/2026', 'E.g. 3/2026'),
      default: (c) => `__/${c.today.slice(0, 4)}`,
    },
    {
      name: 'entidadeTipo',
      type: 'select',
      section: 'reuniao',
      width: 'half',
      label: l('A entidade é', 'The entity is'),
      options: [
        { value: 'sociedade', label: l('Uma sociedade', 'A company') },
        { value: 'associação', label: l('Uma associação', 'An association') },
        { value: 'cooperativa', label: l('Uma cooperativa', 'A cooperative') },
        { value: 'empresa', label: l('Outra empresa', 'Other business') },
      ],
      default: 'sociedade',
    },
    { name: 'data', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data da reunião', 'Meeting date'), default: (c) => c.today },
    { name: 'horaInicio', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'horaFim', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora de encerramento', 'Closing time'), placeholder: l('Ex.: 11:30', 'E.g. 11:30') },
    {
      name: 'localReuniao',
      type: 'text',
      section: 'reuniao',
      required: true,
      label: l('Local', 'Place'),
      help: l('Continua a frase «reuniu-se…». Ex.: «na sua sede, sita em…», «na sala de reuniões do Hotel…».', 'Continues “met…”. E.g. “at its head office at…”.'),
      default: (c) => (c.profile?.kind === 'empresa' && addressLine(c.profile) ? `na sua sede, sita em ${addressLine(c.profile)}` : ''),
    },
    {
      name: 'convocacao',
      type: 'select',
      section: 'reuniao',
      label: l('Convocação', 'Notice'),
      options: [
        { value: 'convocada', label: l('Regularmente convocada', 'Duly convened') },
        { value: 'universal', label: l('Todos presentes, sem convocatória', 'All present, notice waived') },
        { value: 'omitir', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'convocada',
    },
    { name: 'presidenteNome', type: 'text', section: 'mesa', required: true, label: l('Presidente (da Mesa)', 'Chair') },
    {
      name: 'presidenteGenero',
      type: 'radio',
      section: 'mesa',
      width: 'half',
      label: l('Presidente — tratamento', 'Chair — form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: 'M',
    },
    { name: 'secretarioNome', type: 'text', section: 'mesa', required: true, label: l('Secretário(a)', 'Secretary') },
    {
      name: 'secretarioGenero',
      type: 'radio',
      section: 'mesa',
      width: 'half',
      label: l('Secretário — tratamento', 'Secretary — form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: 'M',
    },
    {
      name: 'presentes',
      type: 'lines',
      section: 'mesa',
      label: l('Presentes', 'Present'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'qualidade', type: 'text', label: l('Qualidade / quota', 'Capacity / share'), placeholder: l('Ex.: sócio, titular de uma quota de…', 'E.g. shareholder holding a quota of…') },
      ],
      default: [],
    },
    {
      name: 'ausentes',
      type: 'textarea',
      section: 'mesa',
      rows: 2,
      label: l('Ausentes (opcional)', 'Absent (optional)'),
      help: l('Um nome por linha.', 'One name per line.'),
    },
    {
      name: 'quorum',
      type: 'text',
      section: 'mesa',
      label: l('Quórum (opcional)', 'Quorum (optional)'),
      placeholder: l('Ex.: estando representada a totalidade do capital social', 'E.g. the whole share capital being represented'),
      help: l('Detalhe acrescentado a «Verificada a existência de quórum…».', 'Detail added to “A quorum being present…”.'),
    },
    {
      name: 'ordemTrabalhos',
      type: 'lines',
      section: 'ordem',
      label: l('Ordem de trabalhos', 'Agenda'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [{ name: 'ponto', type: 'text', label: l('Ponto', 'Item'), placeholder: l('Ex.: Aprovação do relatório e contas do exercício', 'E.g. Approval of the annual accounts') }],
      default: [],
    },
    {
      name: 'deliberacoes',
      type: 'lines',
      section: 'ordem',
      label: l('Deliberações', 'Resolutions'),
      addLabel: l('Adicionar deliberação', 'Add resolution'),
      columns: [
        { name: 'ponto', type: 'text', label: l('Ponto (título)', 'Item (title)'), placeholder: l('Se vazio, usa o ponto da ordem de trabalhos', 'If empty, uses the agenda item') },
        { name: 'deliberacao', type: 'text', label: l('O que foi deliberado', 'What was resolved') },
        {
          name: 'votacao',
          type: 'select',
          label: l('Votação', 'Vote'),
          options: [
            { value: 'unanimidade', label: l('Por unanimidade', 'Unanimous') },
            { value: 'maioria', label: l('Por maioria', 'By majority') },
          ],
        },
        { name: 'votos', type: 'text', label: l('Votos (opcional)', 'Votes (optional)'), placeholder: l('Ex.: com um voto contra e uma abstenção', 'E.g. one against, one abstention') },
      ],
      default: [],
    },
    {
      name: 'assinamPresentes',
      type: 'toggle',
      section: 'opcoes',
      label: l('A acta é assinada por todos os presentes', 'Signed by everyone present'),
      help: l('Acrescenta uma linha de assinatura para cada pessoa da lista de presentes.', 'Adds a signature line for each person present.'),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'info', message: l('A acta usa o nome do perfil activo como entidade. Use um perfil de empresa ou associação.', 'The minutes use the active profile’s name as the entity. Use a company profile.') });
    }
    if (!v.presidenteNome) w.push({ level: 'warning', field: 'presidenteNome', message: l('Indique quem presidiu.', 'State who chaired.') });
    if (!v.secretarioNome) w.push({ level: 'warning', field: 'secretarioNome', message: l('Indique quem secretariou.', 'State who took the minutes.') });
    const presentes = lineItems(v.presentes).filter((r) => String(r.nome ?? '').trim());
    if (!presentes.length) w.push({ level: 'warning', field: 'presentes', message: l('Indique quem esteve presente.', 'List who attended.') });
    const ordem = lineItems(v.ordemTrabalhos).filter((r) => String(r.ponto ?? '').trim());
    const delib = lineItems(v.deliberacoes).filter((r) => String(r.deliberacao ?? '').trim());
    if (!ordem.length) w.push({ level: 'warning', field: 'ordemTrabalhos', message: l('Indique a ordem de trabalhos.', 'Enter the agenda.') });
    if (!delib.length) w.push({ level: 'warning', field: 'deliberacoes', message: l('Registe as deliberações tomadas.', 'Record the resolutions passed.') });
    if (delib.length > ordem.length && ordem.length) {
      w.push({ level: 'info', field: 'deliberacoes', message: l('Há mais deliberações do que pontos na ordem de trabalhos.', 'There are more resolutions than agenda items.') });
    }
    const ini = minutos(v.horaInicio);
    const fim = minutos(v.horaFim);
    if (ini != null && fim != null && fim <= ini) {
      w.push({ level: 'warning', field: 'horaFim', message: l('A hora de encerramento é anterior à hora de início.', 'The closing time is before the start time.') });
    }
    if (v.convocacao === 'universal' && String(v.ausentes ?? '').trim()) {
      w.push({ level: 'warning', field: 'convocacao', message: l('Indicou ausentes, mas a reunião sem convocatória exige a presença de todos.', 'You listed absentees, but a meeting without notice requires everyone present.') });
    }
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ag = isAG(v);
    const entidadeTipo = v.entidadeTipo || 'sociedade';
    const firma = profileDisplayName(ctx.profile) || BLANK;
    const da = `da ${entidadeTipo} **${firma}**`;
    const presidente = ag ? 'Presidente da Mesa' : 'Presidente';
    const oPres = `${g(v.presidenteGenero, 'o', 'a')} ${presidente}`;
    const oSec = g(v.secretarioGenero, 'o Secretário', 'a Secretária');
    const membros = v.tipo === 'direccao' ? 'membros da Direcção' : entidadeTipo === 'sociedade' ? 'sócios' : 'membros';

    const presentes = lineItems(v.presentes)
      .map((r) => ({ nome: String(r.nome ?? '').trim(), qualidade: String(r.qualidade ?? '').trim() }))
      .filter((r) => r.nome);
    const ausentes = String(v.ausentes ?? '')
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ordem = lineItems(v.ordemTrabalhos).map((r) => String(r.ponto ?? '').trim()).filter(Boolean);
    const delib = lineItems(v.deliberacoes).filter((r) => String(r.deliberacao ?? '').trim() || String(r.ponto ?? '').trim());

    let reuniu: string;
    switch (v.tipo) {
      case 'direccao':
        reuniu = `reuniu-se ${v.localReuniao || BLANK} a Direcção ${da}`;
        break;
      case 'socios':
        reuniu = `reuniram-se ${v.localReuniao || BLANK} os ${membros} ${da}`;
        break;
      case 'agExtraordinaria':
        reuniu = `reuniu-se ${v.localReuniao || BLANK}, em sessão extraordinária, a Assembleia Geral ${da}`;
        break;
      default:
        reuniu = `reuniu-se ${v.localReuniao || BLANK}, em sessão ordinária, a Assembleia Geral ${da}`;
    }
    const convocacao =
      v.convocacao === 'universal'
        ? `, estando presentes todos os ${membros}, que manifestaram a vontade de reunir e deliberar sem observância das formalidades prévias de convocação`
        : v.convocacao === 'omitir'
          ? ''
          : ', regularmente convocada nos termos dos estatutos';
    const convFix = v.tipo === 'socios' && v.convocacao === 'convocada' ? ', regularmente convocados nos termos dos estatutos' : convocacao;

    const blocks: Block[] = [
      { type: 'title', text: `Acta n.º ${v.numero || BLANK}`, subtitle: `${TIPO_TITULO[v.tipo] ?? TIPO_TITULO.agOrdinaria} — ${firma}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.horaInicio, 'pelas')}, ${reuniu}${convFix}, sob a presidência ${g(v.presidenteGenero, 'do Senhor', 'da Senhora')} **${v.presidenteNome || BLANK}**, servindo de ${g(v.secretarioGenero, 'secretário o Senhor', 'secretária a Senhora')} **${v.secretarioNome || BLANK}**.`,
        en: `On the date and at the time stated, the ${TIPO_OPTIONS.find((o) => o.value === v.tipo)?.label.en ?? 'meeting'} of ${firma} was held at the place stated, chaired by ${v.presidenteNome || '…'}, with ${v.secretarioNome || '…'} as secretary.`,
      },
    ];

    blocks.push({ type: 'paragraph', id: 'presencas', text: `Estiveram presentes os seguintes ${membros}:`, en: 'The following were present:', keepWithNext: true });
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Nome', width: 3 },
        { label: 'Qualidade / quota', width: 3 },
      ],
      rows: presentes.length ? presentes.map((p) => [p.nome, p.qualidade]) : [[BLANK, ''], [BLANK, '']],
    });
    if (ausentes.length) {
      blocks.push({
        type: 'paragraph',
        id: 'ausentes',
        text: `${ausentes.length === 1 ? 'Esteve ausente' : 'Estiveram ausentes'}: ${listaNomes(ausentes)}.`,
        en: `Absent: ${ausentes.join(', ')}.`,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'quorum',
      text: `Verificada a existência de quórum${v.quorum ? `, ${String(v.quorum).trim().replace(/[.,]$/, '')}` : ''}, ${oPres} declarou aberta a sessão e leu a ordem de trabalhos, que foi aceite e é a seguinte:`,
      en: 'A quorum being present, the chair opened the meeting and read the agenda, which was accepted as follows:',
      keepWithNext: true,
    });
    blocks.push({ type: 'list', style: 'numeric', items: ordem.length ? ordem.map((p) => p.replace(/[.;]$/, '') + '.') : [BLANK] });

    blocks.push({
      type: 'paragraph',
      id: 'deliberacoes',
      text: 'Discutidos os pontos da ordem de trabalhos, foram tomadas as seguintes deliberações:',
      en: 'After discussion of the agenda items, the following resolutions were passed:',
      keepWithNext: true,
    });
    const items: ClauseItem[] = delib.length
      ? delib.map((r, i) => {
          const texto = String(r.deliberacao ?? '').trim().replace(/\.$/, '');
          const votos = String(r.votos ?? '').trim().replace(/\.$/, '');
          const votacao =
            r.votacao === 'maioria'
              ? `Deliberação aprovada por maioria${votos ? `, ${votos}` : ''}.`
              : r.votacao === 'unanimidade'
                ? 'Deliberação aprovada por unanimidade dos presentes.'
                : votos
                  ? `Votação: ${votos}.`
                  : '';
          return {
            id: `deliberacao-${i + 1}`,
            heading: String(r.ponto ?? '').trim() || ordem[i] || `Ponto ${i + 1}`,
            text: `${texto ? `${texto}.` : BLANK}${votacao ? ` ${votacao}` : ''}`,
            en: `Resolution on item ${i + 1}${r.votacao === 'maioria' ? ', passed by majority' : r.votacao === 'unanimidade' ? ', passed unanimously' : ''}.`,
          };
        })
      : (ordem.length ? ordem : ['']).map((p, i) => ({ id: `deliberacao-${i + 1}`, heading: p || `Ponto ${i + 1}`, text: BLANK }));
    blocks.push({ type: 'numberedClauses', style: 'numeric', items });

    const assinamTodos = Boolean(v.assinamPresentes) && presentes.length > 0;
    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `Nada mais havendo a tratar, foi encerrada a sessão ${hora(v.horaFim, 'às')}, da qual se lavrou a presente acta que, depois de lida e aprovada, vai ser assinada ${pel(oPres)} e ${pel(oSec)}${assinamTodos ? ', bem como pelos demais presentes' : ''}.`,
        en: `There being no further business, the meeting closed at the time stated. These minutes were drawn up and, after being read and approved, are signed by the chair and the secretary${assinamTodos ? ' and by all those present' : ''}.`,
        keepWithNext: true,
      },
      {
        type: 'signatures',
        columns: [
          { role: `${g(v.presidenteGenero, 'O', 'A')} ${presidente}`, name: v.presidenteNome || undefined },
          { role: g(v.secretarioGenero, 'O Secretário', 'A Secretária'), name: v.secretarioNome || undefined },
        ],
      },
    );
    if (assinamTodos) {
      const outros = presentes.filter((p) => p.nome !== v.presidenteNome && p.nome !== v.secretarioNome);
      const groups = chunk(outros, 3);
      groups.forEach((grp, i) => {
        if (i === 0) {
          blocks.push({ type: 'paragraph', id: 'presentesAssinam', text: 'Os presentes:', align: 'left', keepWithNext: true, en: 'Those present:' });
        }
        const cols: SignatureColumn[] = grp.map((p) => ({ role: ' ', name: p.nome, detail: p.qualidade || undefined }));
        blocks.push({ type: 'signatures', columns: cols });
      });
    }
    return blocks;
  },
});
