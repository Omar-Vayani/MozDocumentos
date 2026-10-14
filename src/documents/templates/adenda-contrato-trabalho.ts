// Adenda ao contrato de trabalho: changes agreed by employer and employee —
// duties and job grade, workplace, working hours (including a move to part
// time), pay or other terms. Agreed changes may never lower pay or rank on the
// ground of changed circumstances; everything else in the contract stays.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, refField } from './_shared';
import { contratoTitle, contratoWorkerFields, fechoBlocks, moneyExt, partesBlocks, wk } from './_contrato-trabalho';
import { linhas, ponto, str } from './_rh-politicas';

export default defineTemplate({
  id: 'adenda-contrato-trabalho',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'contrato', title: l('Contrato alterado', 'Contract amended') },
    { id: 'alteracoes', title: l('Alterações', 'Changes') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...contratoWorkerFields(),
    { name: 'contratoData', type: 'date', section: 'contrato', width: 'half', required: true, label: l('Data do contrato original', 'Date of the original contract') },
    { name: 'contratoTipo', type: 'select', section: 'contrato', width: 'half', label: l('Modalidade', 'Type'), default: 'indeterminado', options: [
      { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
      { value: 'certo', label: l('A prazo certo', 'Fixed term') },
      { value: 'incerto', label: l('A prazo incerto', 'Open-ended term') },
    ] },
    { name: 'motivo', type: 'textarea', section: 'contrato', rows: 2, label: l('Motivo da alteração (opcional)', 'Reason (optional)'), placeholder: l('Ex.: reorganização do Departamento de Finanças', 'E.g. reorganisation of the Finance Department') },
    { name: 'altFuncoes', type: 'toggle', section: 'alteracoes', default: true, label: l('Funções e categoria', 'Duties and grade') },
    { name: 'novaFuncao', type: 'text', section: 'alteracoes', width: 'half', label: l('Nova função', 'New position'), showIf: (v) => Boolean(v.altFuncoes) },
    { name: 'novaCategoria', type: 'text', section: 'alteracoes', width: 'half', label: l('Nova categoria', 'New grade'), showIf: (v) => Boolean(v.altFuncoes) },
    { name: 'novasTarefas', type: 'textarea', section: 'alteracoes', rows: 3, label: l('Principais tarefas (uma por linha)', 'Main duties (one per line)'), showIf: (v) => Boolean(v.altFuncoes) },
    { name: 'altLocal', type: 'toggle', section: 'alteracoes', default: false, label: l('Local de trabalho', 'Workplace') },
    { name: 'novoLocal', type: 'text', section: 'alteracoes', label: l('Novo local de trabalho', 'New workplace'), showIf: (v) => Boolean(v.altLocal) },
    { name: 'altHorario', type: 'toggle', section: 'alteracoes', default: false, label: l('Período normal e horário de trabalho', 'Working hours') },
    { name: 'novoHorario', type: 'text', section: 'alteracoes', label: l('Novo horário', 'New schedule'), placeholder: l('Ex.: de segunda a sexta-feira, das 8h00 às 13h00', 'E.g. Monday to Friday, 8:00 to 13:00'), showIf: (v) => Boolean(v.altHorario) },
    { name: 'horasSemanaNovas', type: 'number', section: 'alteracoes', width: 'half', min: 1, max: 60, label: l('Horas por semana', 'Hours per week'), showIf: (v) => Boolean(v.altHorario) },
    { name: 'tempoParcial', type: 'toggle', section: 'alteracoes', default: false, label: l('Passa a tempo parcial', 'Moves to part time'), showIf: (v) => Boolean(v.altHorario), help: l('Tempo parcial: até ao limite legal do período a tempo inteiro, com remuneração proporcional.', 'Part time: up to the legal share of full time, with proportional pay.') },
    { name: 'altRemuneracao', type: 'toggle', section: 'alteracoes', default: true, label: l('Remuneração', 'Pay') },
    { name: 'salarioAnterior', type: 'money', section: 'alteracoes', width: 'half', label: l('Salário base anterior', 'Previous base salary'), showIf: (v) => Boolean(v.altRemuneracao) },
    { name: 'salarioNovo', type: 'money', section: 'alteracoes', width: 'half', label: l('Novo salário base', 'New base salary'), showIf: (v) => Boolean(v.altRemuneracao) },
    { name: 'outras', type: 'textarea', section: 'alteracoes', rows: 3, label: l('Outras alterações (uma por linha)', 'Other changes (one per line)') },
    { name: 'dataEfeito', type: 'date', section: 'alteracoes', width: 'half', required: true, label: l('Com efeitos a partir de', 'Effective from'), default: (c) => c.today },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const a = money(v.salarioAnterior);
    const n = money(v.salarioNovo);
    if (v.altRemuneracao && a != null && n != null && n < a && !v.tempoParcial) {
      w.push({ level: 'error', field: 'salarioNovo', message: l(`A alteração das condições de trabalho não pode diminuir a remuneração nem a posição hierárquica com fundamento na alteração das circunstâncias (${cite('rhpModificacaoContrato')}).`, 'Changing working conditions may not reduce pay or rank on the ground of changed circumstances.') });
    }
    if (v.tempoParcial) {
      const pct = ctx.legal.value<{ percentagemMax: number }>('tempoParcial').percentagemMax;
      w.push({ level: 'info', field: 'tempoParcial', message: l(`Tempo parcial é até ${pct} por cento do período a tempo inteiro, com o período diário ou semanal indicado por escrito em comparação com o tempo inteiro (${cite('tempoParcial')}).`, `Part time is up to ${pct}% of full time; state the hours compared with full time.`) });
    }
    if (!v.altFuncoes && !v.altLocal && !v.altHorario && !v.altRemuneracao && !str(v.outras)) w.push({ level: 'warning', message: l('Escolha pelo menos uma alteração.', 'Choose at least one change.') });
    if (v.altLocal) w.push({ level: 'info', field: 'novoLocal', message: l(`Se a mudança de local implicar mudança de residência, a empresa suporta as despesas (${cite('rhpTransferencia')}).`, 'If the move requires relocating, the company pays the costs.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const W = wk(v.trabalhadorGenero);
    const tipo = v.contratoTipo === 'certo' ? 'a prazo certo' : v.contratoTipo === 'incerto' ? 'a prazo incerto' : 'por tempo indeterminado';
    const motivo = linhas(v.motivo).join('; ');
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pela presente adenda, as partes alteram, por mútuo acordo, o contrato de trabalho ${tipo} entre si celebrado em ${dateLong(v.contratoData)}${motivo ? `, em virtude de ${ponto(motivo.charAt(0).toLowerCase() + motivo.slice(1)).replace(/\.$/, '')}` : ''}, nos termos das cláusulas seguintes.`,
        en: 'By this amendment the parties change, by mutual agreement, the employment contract signed on the stated date.',
      },
    ];
    if (v.altFuncoes) {
      const tarefas = linhas(v.novasTarefas);
      items.push({
        id: 'funcoes',
        heading: 'Funções e categoria profissional',
        text: `${W.O} passa a exercer as funções de **${str(v.novaFuncao) || BLANK}**, com a categoria profissional de **${str(v.novaCategoria) || str(v.novaFuncao) || BLANK}**${tarefas.length ? ', competindo-lhe, nomeadamente:' : '.'}`,
        items: tarefas.length ? tarefas.map((t, i) => `${t.charAt(0).toLowerCase()}${t.slice(1)}${i === tarefas.length - 1 ? '.' : ';'}`) : undefined,
        en: 'New position and job grade, with the main duties listed.',
      });
    }
    if (v.altLocal) {
      items.push({
        id: 'local',
        heading: 'Local de trabalho',
        text: `O local de trabalho ${W.do} passa a ser ${str(v.novoLocal) || BLANK}, sem prejuízo das deslocações em serviço.`,
        en: 'New workplace.',
      });
    }
    if (v.altHorario) {
      const h = Number(v.horasSemanaNovas);
      items.push({
        id: 'horario',
        heading: v.tempoParcial ? 'Trabalho a tempo parcial' : 'Período normal e horário de trabalho',
        text: `${v.tempoParcial ? `${W.O} passa a prestar trabalho a tempo parcial, ` : 'O período normal de trabalho passa a ser '}${Number.isFinite(h) && h > 0 ? `${v.tempoParcial ? 'com um período normal de ' : ''}${h} horas semanais` : `${v.tempoParcial ? 'com o período normal de ' : ''}${BLANK} horas semanais`}${v.tempoParcial ? ', por comparação com o período normal a tempo inteiro praticado na Entidade Empregadora' : ''}, com o seguinte horário: ${str(v.novoHorario) || BLANK}.${v.tempoParcial ? ` ${W.O} não pode ter tratamento menos favorável do que um trabalhador a tempo inteiro em situação comparável.` : ''}`,
        en: v.tempoParcial ? 'Move to part time with the stated weekly hours compared with full time; no less favourable treatment.' : 'New normal working hours and schedule.',
      });
    }
    if (v.altRemuneracao) {
      const a = money(v.salarioAnterior);
      items.push({
        id: 'remuneracao',
        heading: 'Remuneração',
        text: `A remuneração base mensal ${W.do} passa${a != null ? ` de ${moneyExt(a)}` : ''} para **${moneyExt(v.salarioNovo)}**${v.tempoParcial ? ', proporcional ao período normal de trabalho' : ''}, mantendo-se a forma e a data de pagamento.`,
        en: 'New monthly base salary; payment method and date unchanged.',
      });
    }
    const outras = linhas(v.outras);
    if (outras.length) {
      items.push({ id: 'outras', heading: 'Outras alterações', text: outras.map((o, i) => `${i + 1}. ${ponto(o)}`).join('\n'), en: 'Other changes.' });
    }
    items.push(
      {
        id: 'manutencao',
        heading: 'Manutenção do contrato',
        text: `Mantêm-se em vigor todas as demais cláusulas do contrato de trabalho que não sejam alteradas pela presente adenda, contando-se a antiguidade ${W.do} desde a data da sua admissão.`,
        en: 'All other terms remain; seniority counts from the original hiring date.',
      },
      {
        id: 'efeitos',
        heading: 'Produção de efeitos',
        text: `A presente adenda produz efeitos a partir de ${dateLong(v.dataEfeito)} e faz parte integrante do contrato de trabalho.`,
        en: 'The amendment takes effect on the stated date and forms part of the contract.',
      },
    );
    return [
      contratoTitle(v, 'Adenda ao Contrato de Trabalho'),
      ...partesBlocks(ctx, 'É celebrada a presente adenda ao contrato de trabalho, que se rege pelas cláusulas seguintes:', 'This amendment to the employment contract is made on the following terms:'),
      { type: 'numberedClauses', style: 'clausula', items },
      ...fechoBlocks(ctx),
    ];
  },
});
