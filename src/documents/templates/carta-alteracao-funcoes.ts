// Atribuição temporária de funções não compreendidas no contrato: in case of
// force majeure or unforeseeable production needs the employer may assign
// other tasks for the time needed, within a legal maximum, without reducing
// pay or rank. A permanent change of duties or grade needs an agreement
// (see adenda-contrato-trabalho).

import { addMonths } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, refField, workerFields } from './_shared';
import { qty } from './_contrato-trabalho';
import { cartaAoTrabalhador, fechoEmpregador, linhas, nosTermos, ponto, str } from './_rh-politicas';

export default defineTemplate({
  id: 'carta-alteracao-funcoes',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'funcoes', title: l('Funções atribuídas', 'Duties assigned') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'departamento']),
    { name: 'motivo', type: 'radio', section: 'funcoes', label: l('Fundamento', 'Ground'), default: 'necessidades', options: [
      { value: 'necessidades', label: l('Necessidades produtivas imprevisíveis', 'Unforeseeable production needs') },
      { value: 'forcaMaior', label: l('Força maior', 'Force majeure') },
    ] },
    { name: 'explicacao', type: 'textarea', section: 'funcoes', rows: 3, required: true, label: l('O que aconteceu', 'What happened'), placeholder: l('Ex.: avaria da central de betão e ausência por doença do operador da grua', 'E.g. plant breakdown and the crane operator’s sick leave') },
    { name: 'tarefas', type: 'textarea', section: 'funcoes', rows: 4, required: true, label: l('Tarefas a desempenhar (uma por linha)', 'Tasks to perform (one per line)') },
    { name: 'localTarefas', type: 'text', section: 'funcoes', label: l('Local (se diferente)', 'Place (if different)') },
    { name: 'dataInicio', type: 'date', section: 'funcoes', width: 'half', required: true, label: l('Desde', 'From') },
    { name: 'dataFim', type: 'date', section: 'funcoes', width: 'half', required: true, label: l('Até', 'Until') },
    { name: 'superiores', type: 'toggle', section: 'funcoes', default: false, label: l('As tarefas correspondem a categoria superior', 'The tasks belong to a higher grade'), help: l('Exercer funções de categoria superior em substituição pode dar direito à remuneração dessa categoria.', 'Acting in a higher grade may entitle the employee to that pay.') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const meses = ctx.legal.value<{ tarefasDiferentesMeses: number }>('alteracaoCategoria').tarefasDiferentesMeses;
    if (v.dataInicio && v.dataFim && v.dataFim > addMonths(v.dataInicio, meses)) {
      w.push({ level: 'error', field: 'dataFim', message: l(`A atribuição de tarefas fora do contrato não pode exceder ${meses} meses (${cite('alteracaoCategoria')}). Para uma mudança duradoura, faça uma adenda ao contrato.`, `Assigning tasks outside the contract may not exceed ${meses} months; for a lasting change, sign an amendment.`) });
    }
    if (v.superiores) w.push({ level: 'info', field: 'superiores', message: l(`A substituição por período igual ou superior ao legal dá direito à remuneração da categoria substituída (${cite('remuneracaoSubstituicao')}). Use "Comunicação de promoção" na opção "substituição".`, 'Acting for the legal period or longer entitles the employee to that grade’s pay.') });
    w.push({ level: 'info', message: l('A mudança não pode diminuir a remuneração nem a posição hierárquica do trabalhador.', 'The change may not reduce pay or rank.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const meses = ctx.legal.value<{ tarefasDiferentesMeses: number }>('alteracaoCategoria').tarefasDiferentesMeses;
    const tarefas = linhas(v.tarefas);
    const exp = linhas(v.explicacao).join('; ');
    const blocks: Block[] = [
      ...cartaAoTrabalhador(ctx, 'Atribuição temporária de funções'),
      {
        type: 'paragraph',
        id: 'decisao',
        text: `${nosTermos('alteracaoCategoria').replace(/^n/, 'N')}, comunicamos a V. Ex.ª que, por ${v.motivo === 'forcaMaior' ? 'motivo de força maior' : 'necessidades produtivas imprevisíveis'}, lhe são atribuídas temporariamente, de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**, as tarefas a seguir indicadas, não compreendidas no objecto do seu contrato${str(v.localTarefas) ? `, a desempenhar em ${str(v.localTarefas)}` : ''}:`,
        en: `From ${v.dataInicio || '—'} to ${v.dataFim || '—'} you are temporarily assigned the following tasks outside your contract.`,
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: (tarefas.length ? tarefas : [BLANK]).map((t, i, a) => `${t.charAt(0).toLowerCase()}${t.slice(1)}${i === a.length - 1 ? '.' : ';'}`) },
      {
        type: 'paragraph',
        id: 'motivo',
        text: `A medida justifica-se pelo seguinte: ${exp ? ponto(exp.charAt(0).toLowerCase() + exp.slice(1)) : `${BLANK}.`} A atribuição dura apenas o tempo necessário e nunca mais de ${qty(meses, 'mês', 'meses')}.`,
        en: 'Reasons; the assignment lasts only as long as needed and never beyond the legal maximum.',
      },
      {
        type: 'paragraph',
        id: 'garantias',
        text: `Durante este período V. Ex.ª mantém a sua categoria de ${str(v.trabalhadorCategoria) || str(v.trabalhadorCargo) || BLANK}, a remuneração e a posição hierárquica${v.superiores ? ', sendo-lhe paga a diferença de remuneração correspondente às funções de categoria superior que exercer, nos termos legais' : ''}. Terminado o período, V. Ex.ª retoma as suas funções habituais.`,
        en: 'Grade, pay and rank are kept; afterwards the usual duties resume.',
        keepWithNext: true,
      },
      ...fechoEmpregador(ctx, { reciboTexto: 'Tomei conhecimento em ___/___/______' }),
    ];
    return blocks;
  },
});
