// Contrato de prestação de serviços de guia turístico: an operator, lodge or
// group hires a freelance guide for tours on given dates — languages, group
// size, daily fee and expenses, visitor safety, conduct, protected areas and
// cancellation. Independent service, not employment.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clAutonomia, clCessacao, clForcaMaior, contratoBlocks, formaPagamentoFields, modoPagamento, prazo, titularDe } from './_digital';

export default defineTemplate({
  id: 'contrato-guia-turistico',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'cliente', title: l('Quem contrata (operador, lodge, grupo)', 'Client (operator, lodge, group)'), personRole: 'cliente' },
    { id: 'guia', title: l('Guia', 'Guide'), personRole: 'outro' },
    { id: 'servico', title: l('Serviço', 'Service') },
    { id: 'preco', title: l('Remuneração', 'Fee') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('cliente', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('guia'),
    { name: 'credencial', type: 'text', section: 'guia', label: l('Credencial ou licença de guia (opcional)', 'Guide credential or licence (optional)') },
    { name: 'linguas', type: 'text', section: 'guia', width: 'half', label: l('Línguas', 'Languages'), default: 'português e inglês' },
    { name: 'primeirosSocorros', type: 'toggle', section: 'guia', default: true, label: l('Tem formação em primeiros socorros', 'First-aid trained') },

    { name: 'descricao', type: 'textarea', section: 'servico', rows: 3, required: true, label: l('Passeios ou circuitos', 'Tours'), placeholder: l('Ex.: visitas guiadas a pé à Ilha de Moçambique (Fortaleza de São Sebastião, Palácio de São Paulo, Macuti)', 'E.g. walking tours of Mozambique Island') },
    { name: 'dataInicio', type: 'date', section: 'servico', width: 'half', label: l('De', 'From') },
    { name: 'dataFim', type: 'date', section: 'servico', width: 'half', label: l('Até', 'To') },
    { name: 'horario', type: 'text', section: 'servico', width: 'half', label: l('Horário diário', 'Daily hours'), default: 'das 8h00 às 16h00' },
    { name: 'grupoMax', type: 'number', section: 'servico', width: 'half', min: 1, max: 200, default: 15, label: l('Máximo de pessoas por grupo', 'Maximum group size') },
    { name: 'areaConservacao', type: 'toggle', section: 'servico', default: false, label: l('Inclui parque nacional ou área de conservação', 'Includes a national park or conservation area') },

    { name: 'diaria', type: 'money', section: 'preco', width: 'half', required: true, label: l('Valor por dia', 'Daily fee') },
    { name: 'despesas', type: 'select', section: 'preco', width: 'half', label: l('Transporte e refeições do guia', 'Guide’s transport and meals'), options: [{ value: 'cliente', label: l('Pagos por quem contrata', 'Paid by client') }, { value: 'guia', label: l('Incluídos na diária', 'Included in fee') }], default: 'cliente' },
    { name: 'entradas', type: 'toggle', section: 'preco', default: true, label: l('Entradas dos visitantes pagas por quem contrata', 'Visitor entry fees paid by client') },
    { name: 'pagamentoQuando', type: 'select', section: 'preco', width: 'half', label: l('Pagamento', 'Payment'), options: [{ value: 'fim', label: l('No fim do serviço', 'At the end') }, { value: 'semanal', label: l('Semanalmente', 'Weekly') }, { value: 'mensal', label: l('Mensalmente', 'Monthly') }], default: 'fim' },
    ...formaPagamentoFields('preco'),
    { name: 'cancelamentoHoras', type: 'number', section: 'preco', width: 'half', min: 0, max: 168, default: 24, label: l('Cancelamento sem custos até (horas antes)', 'Free cancellation until (hours before)') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'cliente', 'cliente', 'client'), ...partyWarnings(v, 'guia', 'guia', 'guide')];
    if (money(v.diaria) == null) w.push({ level: 'error', field: 'diaria', message: l('Indique o valor por dia.', 'Enter the daily fee.') });
    w.push({ level: 'info', message: l(`Confirme que o guia está habilitado e, nas áreas de conservação, que cumpre as regras da área (${cite('turGuiaTurismo')}). Se o guia trabalhar todos os dias sob as suas ordens e horário, a relação pode ser considerada de trabalho (${cite('presuncaoContratoTrabalho')}).`, 'Check the guide is qualified and follows conservation-area rules. A guide working daily under your orders and hours may be deemed an employee.') });
    return w;
  },

  personName: (v) => partyName(v, 'guia') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = papel(v, 'cliente', 'Contratante', 'Contratante', true);
    const G = papel(v, 'guia', 'Guia', 'Guia');
    const diaria = money(v.diaria);
    const quando = v.pagamentoQuando === 'semanal' ? 'semanalmente, pelos dias de serviço da semana' : v.pagamentoQuando === 'mensal' ? 'até ao dia cinco do mês seguinte' : 'no fim do serviço';

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${G.o}${str(v.credencial) ? `, ${titularDe(v.credencial)},` : ''} presta ${C.ao} serviços de guia turístico, em ${semPonto(v.linguas) || BLANK}, nos seguintes passeios ou circuitos: ${semPonto(v.descricao) || BLANK}.`,
        `O serviço é prestado de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}, ${semPonto(v.horario) || BLANK}, em datas e grupos indicados ${C.pelo} com, pelo menos, um dia de antecedência, não podendo cada grupo exceder ${Number(v.grupoMax) > 0 ? Number(v.grupoMax) : BLANK} pessoas.`,
      ]),
      en: 'The guide provides guiding services in the stated languages, on the tours, dates and hours stated, with a maximum group size.',
    });
    cl.push({
      id: 'obrigacoesGuia',
      heading: `Obrigações ${G.de}`,
      text: `${G.O} obriga-se a:`,
      items: [
        'apresentar-se com pontualidade, identificado e com apresentação cuidada;',
        'transmitir informação histórica, cultural e natural correcta, e respeitar as comunidades, os locais sagrados e o património visitados;',
        `zelar pela segurança dos visitantes, informá-los dos riscos e das regras de cada local e prestar ${v.primeirosSocorros ? 'os primeiros socorros' : 'assistência'} em caso de incidente, comunicando-o de imediato ${C.ao};`,
        ...(v.areaConservacao ? ['cumprir as regras da área de conservação, não permitir que os visitantes se aproximem, alimentem ou perturbem os animais, e seguir as instruções dos fiscais;'] : []),
        'não cobrar aos visitantes quaisquer valores além dos acordados, nem os encaminhar para comércios em troca de comissões não autorizadas;',
        'tratar os visitantes com urbanidade e não consumir álcool durante o serviço.',
      ],
      en: 'Punctual, identified, accurate information, respect for communities and heritage, visitor safety and first aid, conservation-area rules, no extra charges or undisclosed commissions, courtesy, no alcohol on duty.',
    });
    cl.push({
      id: 'obrigacoesContratante',
      heading: `Obrigações ${C.de}`,
      text: `${C.O} informa ${G.o} da composição dos grupos e das necessidades especiais dos visitantes${v.entradas ? ', paga as entradas e as taxas dos locais visitados' : ''}${v.despesas === 'cliente' ? ' e assegura o transporte e as refeições do guia durante o serviço' : ''}.`,
      en: 'The client informs the guide of groups and special needs and pays entry fees and the guide’s transport and meals as stated.',
    });
    cl.push({
      id: 'remuneracao',
      heading: 'Remuneração',
      text: numerar([
        `${C.O} paga ${G.ao} ${valorTexto(diaria)} por cada dia de serviço${v.despesas === 'guia' ? ', incluindo o transporte e as refeições' : ''}, ${quando}, ${modoPagamento(v, G)}, contra recibo.`,
        `As gorjetas dadas voluntariamente pelos visitantes pertencem ${G.ao}.`,
        `${C.O} pode cancelar um dia de serviço sem custos até ${prazo(v.cancelamentoHoras, 'hora')} antes do início; depois disso, é devida metade da diária.`,
      ]),
      en: `Daily fee ${diaria != null ? formatMoney(diaria) : '—'}, paid as stated against receipt; tips belong to the guide; late cancellation costs half a day.`,
    });
    cl.push(clAutonomia(G));
    cl.push({
      id: 'seguro',
      heading: 'Responsabilidade e seguro',
      text: `${G.O} responde pelos danos causados por sua culpa aos visitantes. ${C.O} mantém o seguro de responsabilidade civil e de acidentes pessoais dos visitantes previsto para a sua actividade.`,
      en: 'The guide is liable for harm caused by their fault; the client keeps the liability and personal accident insurance for visitors.',
    });
    cl.push(clCessacao({ avisoDias: 7, curaDias: 3 }));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de prestação de serviços de guia turístico',
      parties: [
        { p: 'cliente', role: C, en: 'Client' },
        { p: 'guia', role: G, en: 'Guide' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cliente', C, true), assinatura(ctx, 'guia', G)],
    });
  },
});
