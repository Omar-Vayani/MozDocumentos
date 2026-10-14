// Comunicação de transferência do trabalhador para outro local de trabalho
// (temporary or permanent). In writing, with reasons, at least the legal notice
// in advance; temporary transfers have a maximum length and are notified to the
// labour administration; the employer pays the costs the transfer imposes.

import { addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, refField, workerFields } from './_shared';
import { qty, wk } from './_contrato-trabalho';
import { cartaAoTrabalhador, fechoEmpregador, linhas, nosTermos, ponto, str } from './_rh-politicas';

type T = { temporariaMeses: number; temporariaMaxMeses: number; distanciaKm: number; avisoDias: number };

export default defineTemplate({
  id: 'carta-transferencia-local',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'transferencia', title: l('Transferência', 'Transfer') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    { name: 'tipo', type: 'radio', section: 'transferencia', label: l('Tipo de transferência', 'Type of transfer'), default: 'temporaria', options: [
      { value: 'temporaria', label: l('Temporária', 'Temporary') },
      { value: 'definitiva', label: l('Definitiva', 'Permanent') },
    ] },
    { name: 'localActual', type: 'text', section: 'transferencia', width: 'half', required: true, label: l('Local de trabalho actual', 'Current workplace'), placeholder: l('Ex.: Sede, Maputo', 'E.g. Head office, Maputo') },
    { name: 'novoLocal', type: 'text', section: 'transferencia', width: 'half', required: true, label: l('Novo local de trabalho', 'New workplace'), placeholder: l('Ex.: Estaleiro de Nacala', 'E.g. Nacala site') },
    { name: 'dataInicio', type: 'date', section: 'transferencia', width: 'half', required: true, label: l('Apresentação no novo local em', 'Report to new workplace on') },
    { name: 'dataFim', type: 'date', section: 'transferencia', width: 'half', label: l('Regresso previsto em', 'Expected return'), showIf: (v) => v.tipo !== 'definitiva' },
    {
      name: 'fundamento',
      type: 'textarea',
      section: 'transferencia',
      rows: 4,
      required: true,
      label: l('Fundamento', 'Grounds'),
      legal: l('A transferência tem de ser fundamentada por escrito.', 'The transfer must state its grounds in writing.'),
      placeholder: l('Ex.: arranque da obra da Escola Secundária de Nacala, que exige um encarregado com a experiência do trabalhador', 'E.g. start of a new site that needs the employee’s experience'),
    },
    { name: 'mudancaEstabelecimento', type: 'toggle', section: 'transferencia', default: false, label: l('Mudança total ou parcial do estabelecimento', 'All or part of the establishment is moving'), showIf: (v) => v.tipo === 'definitiva', help: l('Sem mudança do estabelecimento, a transferência definitiva só é possível se o contrato o previr ou por acordo.', 'Without relocation, a permanent transfer needs a contract clause or agreement.') },
    { name: 'foraDomicilio', type: 'toggle', section: 'transferencia', default: false, label: l('Implica mudança de residência', 'Requires moving house') },
    { name: 'representanteSindical', type: 'toggle', section: 'transferencia', default: false, label: l('O trabalhador é membro de órgão sindical', 'The employee is a union representative') },
    {
      name: 'despesas',
      type: 'textarea',
      section: 'condicoes',
      rows: 3,
      label: l('Despesas suportadas pela empresa (uma por linha)', 'Costs paid by the company (one per line)'),
      default: 'Transporte do trabalhador e do agregado familiar\nTransporte dos bens pessoais\nAlojamento no novo local',
      showIf: (v) => Boolean(v.foraDomicilio),
    },
    { name: 'subsidio', type: 'text', section: 'condicoes', label: l('Subsídio ou ajudas de custo (opcional)', 'Allowance (optional)'), placeholder: l('Ex.: subsídio de deslocação de 5.000,00 MT por mês', 'E.g. relocation allowance of 5,000.00 MT a month') },
    { name: 'aceitacao', type: 'toggle', section: 'condicoes', default: false, label: l('Incluir declaração de aceitação do trabalhador', 'Include the employee’s acceptance'), help: l('Necessária na transferência definitiva fora do domicílio que separe o trabalhador da família.', 'Needed for a permanent move away from home that separates the employee from the family.') },
  ],

  computed: (v, { legal }) => {
    const t = legal.value<T>('rhpTransferencia');
    const aviso = v.data && v.dataInicio ? diffDays(v.data, v.dataInicio) : null;
    return { t, aviso: aviso != null && Number.isFinite(aviso) ? aviso : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const { t, aviso } = ctx.computed as { t: T; aviso: number | null };
    if (aviso != null && aviso < t.avisoDias) {
      w.push({ level: 'error', field: 'dataInicio', message: l(`A transferência é comunicada com pelo menos ${t.avisoDias} dias de antecedência (${cite('rhpTransferencia')}).`, `The transfer must be notified at least ${t.avisoDias} days in advance.`) });
    }
    if (v.tipo !== 'definitiva' && v.dataInicio && v.dataFim) {
      if (v.dataFim > addMonths(v.dataInicio, t.temporariaMaxMeses)) w.push({ level: 'error', field: 'dataFim', message: l(`A transferência temporária nunca pode exceder ${t.temporariaMaxMeses} meses.`, `A temporary transfer may never exceed ${t.temporariaMaxMeses} months.`) });
      else if (v.dataFim > addMonths(v.dataInicio, t.temporariaMeses)) w.push({ level: 'warning', field: 'dataFim', message: l(`Mais de ${t.temporariaMeses} meses só por exigências imperiosas de funcionamento da empresa: explique-as no fundamento.`, `Over ${t.temporariaMeses} months only for imperative needs: explain them.`) });
    }
    if (v.tipo !== 'definitiva') w.push({ level: 'info', message: l('Comunique a transferência temporária à administração do trabalho (documento "Comunicação ao Ministério do Trabalho").', 'Notify the labour administration of the temporary transfer.') });
    if (v.tipo === 'definitiva' && !v.mudancaEstabelecimento) w.push({ level: 'warning', field: 'mudancaEstabelecimento', message: l('A transferência definitiva só é admitida com mudança do estabelecimento, salvo cláusula do contrato ou acordo do trabalhador.', 'A permanent transfer needs relocation of the establishment, a contract clause or the employee’s agreement.') });
    if (v.tipo === 'definitiva' && v.foraDomicilio && !v.aceitacao) w.push({ level: 'warning', field: 'aceitacao', message: l('Se a mudança causar prejuízo sério e separar o trabalhador da família, é preciso o seu acordo; sem ele, o trabalhador pode rescindir com indemnização.', 'If it seriously harms the employee and separates them from family, their agreement is needed.') });
    if (v.representanteSindical) w.push({ level: 'warning', field: 'representanteSindical', message: l(`Os representantes sindicais só podem ser transferidos depois de consultada a estrutura sindical (${cite('rhpProtecaoSindical')}).`, 'Union representatives may only be transferred after consulting the union body.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const W = wk(v.trabalhadorGenero);
    const t = (ctx.computed as { t: T }).t;
    const temp = v.tipo !== 'definitiva';
    const fund = linhas(v.fundamento).join('; ');
    const desp = linhas(v.despesas);
    const blocks: Block[] = [
      ...cartaAoTrabalhador(ctx, temp ? 'Transferência temporária de local de trabalho' : 'Transferência de local de trabalho'),
      {
        type: 'paragraph',
        id: 'decisao',
        text: `${nosTermos('rhpTransferencia').replace(/^n/, 'N')}, comunicamos a V. Ex.ª que será ${W.a('transferido', 'transferida')}${temp ? ' temporariamente' : ' a título definitivo'} do seu actual local de trabalho, em ${str(v.localActual) || BLANK}, para **${str(v.novoLocal) || BLANK}**, onde se deverá apresentar em **${dateLong(v.dataInicio)}**${temp ? `${v.dataFim ? `, prevendo-se o regresso em ${dateLong(v.dataFim)}` : `, por período não superior a ${qty(t.temporariaMeses, 'mês', 'meses')}`}` : ''}.`,
        en: `You will be transferred ${temp ? 'temporarily' : 'permanently'} from ${v.localActual || '—'} to ${v.novoLocal || '—'} from ${v.dataInicio || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'fundamento',
        text: `A transferência fundamenta-se no seguinte: ${fund ? ponto(fund.charAt(0).toLowerCase() + fund.slice(1)) : `${BLANK}.`}${v.tipo === 'definitiva' && v.mudancaEstabelecimento ? ' Trata-se de mudança do estabelecimento em que V. Ex.ª presta serviço.' : ''}`,
        en: 'Grounds for the transfer.',
      },
      {
        type: 'paragraph',
        id: 'condicoes',
        text: `V. Ex.ª mantém a sua categoria, funções, remuneração e demais direitos.${v.foraDomicilio ? ` A Empresa suporta todas as despesas directamente impostas pela transferência${desp.length ? `, nomeadamente: ${desp.map((d) => d.charAt(0).toLowerCase() + d.slice(1)).join('; ')}` : ', incluindo as da mudança de residência do agregado familiar'}.` : ''}${str(v.subsidio) ? ` Durante a transferência é-lhe atribuído ${ponto(str(v.subsidio).charAt(0).toLowerCase() + str(v.subsidio).slice(1))}` : ''}`,
        en: 'Grade, duties, pay and rights are unchanged; the company pays the costs imposed by the transfer.',
        keepWithNext: true,
      },
    ];
    blocks.push(...fechoEmpregador(ctx, { recibo: v.aceitacao ? false : undefined }));
    if (v.aceitacao) {
      blocks.push({
        type: 'box',
        label: `Declaração ${W.do}`,
        text: `Declaro que recebi a presente comunicação e que aceito a transferência nos termos indicados.\n\nData: ___/___/______        Assinatura: ________________________________________`,
      });
    }
    return blocks;
  },
});
