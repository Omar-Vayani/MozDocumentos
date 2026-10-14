// Pedido de licença sem remuneração (employee's justified request). The
// employer may grant it for the agreed time; the contract is suspended and the
// employee keeps the job.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, workerSignature } from './_shared';
import { autorFields, cartaDoTrabalhador, despachoBlocks, destinatarioFields, euTrabalhador, linhas, nosTermos, ponto, str } from './_rh-politicas';

export default defineTemplate({
  id: 'pedido-licenca-sem-remuneracao',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem pede)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'licenca', title: l('Licença', 'Leave') },
  ],
  fields: [
    localField(),
    dateField(),
    ...autorFields(['nome', 'genero', 'cargo', 'departamento']),
    ...destinatarioFields(),
    { name: 'dataInicio', type: 'date', section: 'licenca', width: 'half', required: true, label: l('Início da licença', 'Leave starts') },
    { name: 'dataFim', type: 'date', section: 'licenca', width: 'half', required: true, label: l('Fim da licença', 'Leave ends') },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'licenca',
      rows: 4,
      required: true,
      label: l('Motivo', 'Reason'),
      legal: l('A lei exige que o pedido seja justificado.', 'The law requires a justified request.'),
      placeholder: l('Ex.: frequentar o curso de mestrado em Gestão na Universidade Eduardo Mondlane, em regime presencial', 'E.g. attend a full-time master’s programme'),
    },
    {
      name: 'compromissos',
      type: 'toggle',
      section: 'licenca',
      default: true,
      label: l('Comprometer-me a regressar e a entregar a passagem de serviço', 'Undertake to return and hand over my work'),
    },
  ],

  computed: (v) => {
    const d = v.dataInicio && v.dataFim ? diffDays(v.dataInicio, v.dataFim) + 1 : null;
    return { dias: d != null && Number.isFinite(d) ? d : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const d = ctx.computed.dias;
    if (d != null && d < 1) w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'The end date is before the start date.') });
    if (!str(v.motivo)) w.push({ level: 'warning', field: 'motivo', message: l('Explique o motivo: a licença só é concedida a pedido justificado.', 'Explain the reason: leave is only granted on a justified request.') });
    w.push({
      level: 'info',
      message: l(
        `Durante a licença o contrato fica suspenso: não há salário e cessam os direitos e deveres ligados à prestação de trabalho, mas mantém o posto (${cite('rhpLicencaSemRemuneracao')}). Pergunte à empresa como ficam as contribuições para o INSS e o seguro de saúde.`,
        'During the leave the contract is suspended: no pay, but you keep your job. Ask how INSS contributions and health insurance are handled.',
      ),
    });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const motivo = linhas(v.motivo).join('; ');
    const dias = ctx.computed.dias as number | null;
    const blocks: Block[] = [
      ...cartaDoTrabalhador(ctx, 'Pedido de licença sem remuneração'),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${euTrabalhador(v)}, venho requerer a V. Ex.ª a concessão de licença sem remuneração no período de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**${dias != null && dias > 0 ? ` (${dias} ${dias === 1 ? 'dia' : 'dias'} de calendário)` : ''}, ${nosTermos('rhpLicencaSemRemuneracao')}.`,
        en: `I request unpaid leave from ${v.dataInicio || '—'} to ${v.dataFim || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'motivo',
        text: `O pedido fundamenta-se no seguinte: ${motivo ? ponto(motivo.charAt(0).toLowerCase() + motivo.slice(1)) : `${BLANK}.`}`,
        en: 'Reason for the request.',
      },
    ];
    if (v.compromissos !== false) {
      blocks.push({
        type: 'paragraph',
        id: 'compromisso',
        text: `Tenho conhecimento de que, durante a licença, o contrato de trabalho fica suspenso e não é devida remuneração. Comprometo-me a deixar o meu serviço devidamente entregue antes do início da licença e a apresentar-me ao trabalho no primeiro dia útil seguinte ao seu termo.`,
        en: 'I understand the contract is suspended and unpaid during the leave; I will hand over my work beforehand and return on the next working day after it ends.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Aguardo a decisão de V. Ex.ª.', en: 'I await your decision.', keepWithNext: true },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: str(v.trabalhadorCargo) || undefined }] },
      ...despachoBlocks(['Deferido', 'Deferido com alteração das datas: ____/____/______ a ____/____/______', 'Indeferido']),
    );
    return blocks;
  },
});
