// Convocatória para a Junta de Saúde: the employer refers an employee with a
// long or repeated sick leave (or whose health affects performance, or at the
// employee's request) to the medical board or another licensed body, which
// rules only on fitness for work.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, refField, workerFields } from './_shared';
import { qty } from './_contrato-trabalho';
import { cartaAoTrabalhador, fechoEmpregador, nosTermos, str } from './_rh-politicas';

type J = { diasSeguidos: number; faltasTrimestre: number };

export default defineTemplate({
  id: 'convocatoria-junta-de-saude',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'junta', title: l('Junta de Saúde', 'Medical board') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    { name: 'motivo', type: 'select', section: 'junta', label: l('Motivo', 'Reason'), default: 'prolongada', options: [
      { value: 'prolongada', label: l('Faltas por doença por período seguido longo', 'Long continuous sick leave') },
      { value: 'frequentes', label: l('Faltas por doença frequentes no trimestre', 'Frequent sick days in the quarter') },
      { value: 'rendimento', label: l('Saúde afecta o rendimento do trabalho', 'Health affects performance') },
      { value: 'pedido', label: l('A pedido do trabalhador', 'At the employee’s request') },
    ] },
    { name: 'faltasDesde', type: 'date', section: 'junta', width: 'half', label: l('Ausente por doença desde', 'Off sick since'), showIf: (v) => v.motivo === 'prolongada' },
    { name: 'faltasNumero', type: 'number', section: 'junta', width: 'half', min: 0, label: l('Dias de faltas por doença no trimestre', 'Sick days this quarter'), showIf: (v) => v.motivo === 'frequentes' },
    { name: 'entidade', type: 'text', section: 'junta', required: true, label: l('Junta de Saúde / entidade', 'Medical board / body'), default: 'Junta Provincial de Saúde', placeholder: l('Ex.: Junta Provincial de Saúde da Cidade de Maputo', 'E.g. Provincial Medical Board') },
    { name: 'dataHora', type: 'text', section: 'junta', width: 'half', required: true, label: l('Data e hora', 'Date and time'), placeholder: l('Ex.: 22 de Outubro de 2026, às 8h30', 'E.g. 22 October 2026 at 8:30') },
    { name: 'localJunta', type: 'text', section: 'junta', width: 'half', label: l('Local', 'Place'), placeholder: l('Ex.: Hospital Geral de Mavalane', 'E.g. Mavalane General Hospital') },
    {
      name: 'levar',
      type: 'lines',
      section: 'junta',
      label: l('Documentos a levar', 'Documents to bring'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [{ descricao: 'Bilhete de Identidade' }, { descricao: 'Atestados e relatórios médicos que possuir' }, { descricao: 'A presente convocatória' }],
    },
    { name: 'transporte', type: 'toggle', section: 'junta', default: true, label: l('A empresa assegura o transporte', 'The company provides transport') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const j = ctx.legal.value<J>('rhpJuntaSaude');
    if (v.motivo === 'frequentes' && v.faltasNumero !== '' && v.faltasNumero != null && Number(v.faltasNumero) <= j.faltasTrimestre) {
      w.push({ level: 'warning', field: 'faltasNumero', message: l(`A lei permite a Junta quando há mais de ${j.faltasTrimestre} dias de faltas por doença no trimestre (${cite('rhpJuntaSaude')}).`, `Allowed when there are more than ${j.faltasTrimestre} sick days in the quarter.`) });
    }
    w.push({ level: 'info', message: l('A Junta pronuncia-se apenas sobre a capacidade para o trabalho; a empresa não recebe o diagnóstico.', 'The board rules only on fitness for work; the company does not receive the diagnosis.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const j = ctx.legal.value<J>('rhpJuntaSaude');
    const levar = lineItems(v.levar).map((r) => str(r.descricao)).filter(Boolean);
    let razao: string;
    switch (v.motivo) {
      case 'frequentes':
        razao = `por ter dado${v.faltasNumero ? ` ${v.faltasNumero}` : ''} faltas por doença no presente trimestre, mais de ${qty(j.faltasTrimestre, 'dia', 'dias')}`;
        break;
      case 'rendimento':
        razao = 'por razões de saúde que têm afectado o seu rendimento no trabalho';
        break;
      case 'pedido':
        razao = 'conforme pedido por V. Ex.ª';
        break;
      default:
        razao = `por se encontrar ausente por motivo de doença${v.faltasDesde ? ` desde ${dateLong(v.faltasDesde)}` : ''}, por período ininterrupto superior a ${qty(j.diasSeguidos, 'dia', 'dias')}`;
    }
    const blocks: Block[] = [
      ...cartaAoTrabalhador(ctx, 'Convocatória para a Junta de Saúde'),
      {
        type: 'paragraph',
        id: 'convocatoria',
        text: `${nosTermos('rhpJuntaSaude').replace(/^n/, 'N')}, e ${razao}, convocamos V. Ex.ª a apresentar-se à **${str(v.entidade) || BLANK}**${str(v.localJunta) ? `, em ${str(v.localJunta)}` : ''}, no dia **${str(v.dataHora) || BLANK}**, para avaliação da sua capacidade para o trabalho.`,
        en: `You are referred to the medical board ${v.entidade || ''} on ${v.dataHora || '—'} to assess your fitness for work.`,
      },
      {
        type: 'paragraph',
        id: 'finalidade',
        text: `A Junta pronuncia-se apenas sobre a sua capacidade para o trabalho. ${v.transporte !== false ? 'A Empresa assegura o transporte. ' : ''}O tempo de ausência ao serviço necessário para o efeito não é considerado falta.`,
        en: 'The board rules only on fitness for work; time away for it is not an absence.',
      },
    ];
    if (levar.length) blocks.push({ type: 'paragraph', id: 'levar', text: 'Deve levar consigo:', en: 'Please bring:', keepWithNext: true }, { type: 'list', items: levar });
    blocks.push(
      {
        type: 'paragraph',
        id: 'recusa',
        text: 'Informamos que a recusa em apresentar-se à Junta de Saúde sem justificação válida constitui infracção disciplinar. Caso não possa comparecer na data indicada, deve informar-nos de imediato, apresentando o motivo.',
        en: 'Refusing to attend without a valid reason is a disciplinary offence; tell us at once if you cannot attend.',
        keepWithNext: true,
      },
      ...fechoEmpregador(ctx),
    );
    return blocks;
  },
});
