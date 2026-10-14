// Pedido de dispensa / comunicação prévia de falta: the employee announces a
// foreseeable absence (marriage, exams as a worker-student, medical
// appointment, funeral of a relative, sports or cultural activity) or asks for
// a few hours off. Foreseeable justified absences must be notified in advance.

import type { LegalRefId } from '@/legal/mz-legal';
import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, isF, l, lineItems, localField, workerSignature } from './_shared';
import { autorFields, cartaDoTrabalhador, despachoBlocks, destinatarioFields, euTrabalhador, linhas, nosTermos, ponto, str } from './_rh-politicas';

type Motivo = 'casamento' | 'exames' | 'consulta' | 'falecimentoProximo' | 'falecimentoOutro' | 'desporto' | 'pessoal';

const MOTIVOS: { value: Motivo; label: ReturnType<typeof l> }[] = [
  { value: 'casamento', label: l('O meu casamento', 'My wedding') },
  { value: 'exames', label: l('Provas ou exames (trabalhador-estudante)', 'Tests or exams (worker-student)') },
  { value: 'consulta', label: l('Consulta médica ou exame de saúde', 'Medical appointment or test') },
  { value: 'falecimentoProximo', label: l('Falecimento de familiar próximo (cônjuge, pais, filhos, irmãos, avós, netos, sogros…)', 'Death of a close relative') },
  { value: 'falecimentoOutro', label: l('Falecimento de tio, primo, sobrinho ou cunhado', 'Death of an uncle, cousin, nephew or sibling-in-law') },
  { value: 'desporto', label: l('Actividade desportiva ou cultural', 'Sports or cultural activity') },
  { value: 'pessoal', label: l('Assunto pessoal (dispensa de algumas horas)', 'Personal matter (a few hours off)') },
];

const LEGAL: Partial<Record<Motivo, LegalRefId>> = {
  casamento: 'faltasJustificadas',
  falecimentoProximo: 'faltasJustificadas',
  falecimentoOutro: 'faltasJustificadas',
  exames: 'eduTrabalhadorEstudante',
  desporto: 'faltasJustificadas',
};

function motivoTexto(v: Values): string {
  const fam = [str(v.familiarNome) ? `**${str(v.familiarNome)}**` : '', str(v.parentesco) ? `(${str(v.parentesco)})` : ''].filter(Boolean).join(' ') || 'familiar';
  switch (v.motivo as Motivo) {
    case 'casamento':
      return `por motivo do meu casamento${v.dataEvento ? `, a realizar em ${dateLong(v.dataEvento)}` : ''}`;
    case 'exames':
      return `para prestar provas${str(v.instituicao) ? ` em ${str(v.instituicao)}` : ''}, na qualidade de ${isF(v.trabalhadorGenero) ? 'trabalhadora-estudante' : 'trabalhador-estudante'}`;
    case 'consulta':
      return 'para comparecer a consulta médica';
    case 'falecimentoProximo':
    case 'falecimentoOutro':
      return `por motivo do falecimento de ${fam}${v.dataEvento ? `, ocorrido em ${dateLong(v.dataEvento)}` : ''}`;
    case 'desporto':
      return 'para participar na actividade desportiva ou cultural indicada abaixo';
    default:
      return 'para tratar de assunto pessoal inadiável';
  }
}

export default defineTemplate({
  id: 'pedido-de-dispensa',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem pede)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'ausencia', title: l('Ausência', 'Absence') },
  ],
  fields: [
    localField(),
    dateField(),
    ...autorFields(['nome', 'genero', 'cargo', 'departamento']),
    ...destinatarioFields('empresa', 'Chefe do Departamento'),
    { name: 'motivo', type: 'select', section: 'ausencia', required: true, label: l('Motivo', 'Reason'), options: MOTIVOS, default: 'casamento' },
    { name: 'familiarNome', type: 'text', section: 'ausencia', width: 'half', label: l('Nome do familiar', 'Name of the relative'), showIf: (v) => String(v.motivo).startsWith('falecimento') },
    { name: 'parentesco', type: 'text', section: 'ausencia', width: 'half', label: l('Parentesco', 'Relationship'), placeholder: l('Ex.: avó materna', 'E.g. grandmother'), showIf: (v) => String(v.motivo).startsWith('falecimento') },
    { name: 'dataEvento', type: 'date', section: 'ausencia', width: 'half', label: l('Data do casamento / falecimento', 'Date of wedding / death'), showIf: (v) => v.motivo === 'casamento' || String(v.motivo).startsWith('falecimento') },
    { name: 'instituicao', type: 'text', section: 'ausencia', label: l('Instituição de ensino', 'School or university'), showIf: (v) => v.motivo === 'exames' },
    { name: 'dataInicio', type: 'date', section: 'ausencia', width: 'half', required: true, label: l('Dia (ou primeiro dia) de ausência', 'Day (or first day) of absence') },
    { name: 'dataFim', type: 'date', section: 'ausencia', width: 'half', label: l('Último dia (se mais de um)', 'Last day (if more than one)') },
    { name: 'horas', type: 'text', section: 'ausencia', width: 'half', label: l('Horas (se for só parte do dia)', 'Hours (if only part of the day)'), placeholder: l('Ex.: das 9h00 às 12h00', 'E.g. 9:00 to 12:00') },
    {
      name: 'compensacao',
      type: 'select',
      section: 'ausencia',
      width: 'half',
      label: l('Proposta', 'Proposal'),
      default: 'nenhuma',
      showIf: (v) => v.motivo === 'pessoal' || v.motivo === 'consulta',
      options: [
        { value: 'nenhuma', label: l('Sem proposta', 'None') },
        { value: 'compensar', label: l('Compensar as horas', 'Make up the hours') },
        { value: 'descontar', label: l('Descontar na remuneração', 'Deduct from pay') },
        { value: 'ferias', label: l('Descontar nas férias', 'Deduct from leave') },
      ],
    },
    { name: 'observacoes', type: 'textarea', section: 'ausencia', rows: 2, label: l('Pormenores (opcional)', 'Details (optional)') },
    {
      name: 'anexos',
      type: 'lines',
      section: 'ausencia',
      label: l('Documentos que junto ou entregarei', 'Documents attached or to follow'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Calendário de exames', 'E.g. Exam timetable') }],
      default: [],
    },
  ],

  computed: (v, { legal }) => {
    const ini = v.dataInicio || '';
    const fim = v.dataFim && v.dataFim !== v.dataInicio ? v.dataFim : '';
    const span = ini && fim ? diffDays(ini, fim) : 0;
    const dias = ini ? (Number.isFinite(span) ? span + 1 : 1) : null;
    const fj = legal.value<{ casamento: number; falecimentoProximo: number; falecimentoOutro: number }>('faltasJustificadas');
    const limite = v.motivo === 'casamento' ? fj.casamento : v.motivo === 'falecimentoProximo' ? fj.falecimentoProximo : v.motivo === 'falecimentoOutro' ? fj.falecimentoOutro : null;
    return { dias, multi: Boolean(fim) && dias != null && dias > 1, limite };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.computed;
    if (c.dias != null && c.dias < 1) w.push({ level: 'error', field: 'dataFim', message: l('O último dia é anterior ao primeiro.', 'The last day is before the first.') });
    if (c.limite != null && c.dias != null && c.dias > c.limite) {
      w.push({ level: 'warning', field: 'dataFim', message: l(`A lei considera justificados até ${c.limite} dias por este motivo (${cite('faltasJustificadas')}). Os dias a mais dependem de autorização.`, `The law allows up to ${c.limite} days for this reason; extra days need approval.`) });
    }
    const aviso = v.data && v.dataInicio ? diffDays(v.data, v.dataInicio) : null;
    if (v.motivo === 'exames') {
      const min = ctx.legal.value<{ avisoExamesDias: number }>('eduTrabalhadorEstudante').avisoExamesDias;
      if (aviso != null && aviso < min) w.push({ level: 'warning', field: 'dataInicio', message: l(`O trabalhador-estudante avisa com pelo menos ${min} dias de antecedência, salvo impossibilidade (${cite('eduTrabalhadorEstudante')}).`, `Worker-students give at least ${min} days’ notice.`) });
    } else if (v.motivo === 'casamento' || v.motivo === 'consulta' || v.motivo === 'desporto') {
      const min = ctx.legal.value<{ antecedenciaDias: number }>('faltasComunicacao').antecedenciaDias;
      if (aviso != null && aviso < min) w.push({ level: 'warning', field: 'dataInicio', message: l(`As faltas previsíveis são comunicadas com pelo menos ${min} dias de antecedência (${cite('faltasComunicacao')}).`, `Foreseeable absences need ${min} days’ notice.`) });
    }
    if (v.motivo === 'consulta') w.push({ level: 'info', message: l('Depois da consulta, entregue a declaração de comparência da unidade sanitária.', 'After the appointment, hand in the attendance note.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const legal = LEGAL[v.motivo as Motivo];
    const periodo = c.multi
      ? `no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}** (${c.dias} dias)`
      : `no dia **${dateLong(v.dataInicio)}**${str(v.horas) ? `, ${str(v.horas).replace(/\.$/, '')}` : ''}`;
    const obs = linhas(v.observacoes).join('; ');
    const anexos = lineItems(v.anexos).map((a) => str(a.descricao)).filter(Boolean);
    const pede = v.motivo === 'pessoal' || v.motivo === 'desporto' ? 'venho pedir a V. Ex.ª autorização para me ausentar do serviço' : 'venho comunicar a V. Ex.ª que me ausentarei do serviço';
    const blocks: Block[] = [
      ...cartaDoTrabalhador(ctx, v.motivo === 'pessoal' || v.motivo === 'desporto' ? 'Pedido de dispensa' : 'Comunicação prévia de falta'),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${euTrabalhador(v)}, ${pede} ${periodo}, ${motivoTexto(v)}${legal ? `, ${nosTermos(legal)}` : ''}.`,
        en: `I notify (or request permission for) my absence ${v.dataInicio || '—'}${v.dataFim ? ` to ${v.dataFim}` : ''}.`,
      },
    ];
    if (obs) blocks.push({ type: 'paragraph', id: 'pormenores', text: ponto(obs), en: 'Details.' });
    const comp = v.compensacao;
    if ((v.motivo === 'pessoal' || v.motivo === 'consulta') && comp && comp !== 'nenhuma') {
      const t = comp === 'compensar' ? 'Proponho compensar as horas de ausência em data a combinar com a chefia.' : comp === 'descontar' ? 'Aceito que o tempo de ausência seja descontado na minha remuneração.' : 'Proponho que o tempo de ausência seja descontado no meu período de férias.';
      blocks.push({ type: 'paragraph', id: 'compensacao', text: t, en: 'Proposal for the time off.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'organizacao',
      text: `Deixarei o meu serviço organizado de forma a não prejudicar o funcionamento do departamento${anexos.length ? ' e junto os documentos indicados abaixo' : ' e entregarei o comprovativo no regresso'}.`,
      en: 'I will organise my work so the department is not affected and provide proof.',
      keepWithNext: !anexos.length,
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos, keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: str(v.trabalhadorCargo) || undefined }] },
      ...despachoBlocks(['Autorizado — falta justificada', 'Autorizado — com perda de remuneração / compensação', 'Não autorizado'], 'A Chefia'),
    );
    return blocks;
  },
});
