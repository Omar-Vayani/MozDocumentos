import { legalEntry, type LegalRefId } from '@/legal/mz-legal';
import { diffDays, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import {
  cite, dateField, dateLong, employerParty, employerSignature, FORMA_PAGAMENTO_OPTIONS, formatMoney, g, l,
  localField, money, workerFields, workerParty, workerSignature,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

/** "150.000,00 MT (cento e cinquenta mil meticais)" */
const valorExtenso = (n: number | null) =>
  n == null ? formatMoney(null) : n >= 0 && n <= MAX_EXTENSO ? `${formatMoney(n)} (${numeroPorExtenso(n)})` : formatMoney(n);

export default defineTemplate({
  id: 'acordo-de-revogacao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'termos', title: l('Fim do contrato', 'End of contract') },
    { id: 'compensacao', title: l('Compensação e pagamento', 'Compensation and payment') },
    { id: 'opcoes', title: l('Cláusulas opcionais', 'Optional clauses') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura do acordo', 'Signing date')),
    ...workerFields([
      'nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada',
      'cargo', 'dataAdmissao',
    ]),
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'termos',
      width: 'half',
      required: true,
      label: l('Data de cessação do contrato', 'Termination date'),
      legal: l('O acordo deve indicar a data em que produz efeitos.', 'The agreement must state the date it takes effect.'),
    },
    {
      name: 'dispensaTrabalho',
      type: 'toggle',
      section: 'termos',
      label: l('Dispensar o trabalhador de trabalhar até à cessação', 'Release the employee from work until termination'),
      help: l('O trabalhador continua a receber o salário até à data de cessação.', 'The employee keeps being paid until the termination date.'),
    },
    {
      name: 'dataDispensa',
      type: 'date',
      section: 'termos',
      width: 'half',
      label: l('Dispensado a partir de', 'Released from'),
      showIf: (v) => Boolean(v.dispensaTrabalho),
    },
    {
      name: 'compensacao',
      type: 'money',
      section: 'compensacao',
      width: 'half',
      label: l('Compensação pecuniária (opcional)', 'Compensation (optional)'),
      help: l('A lei não fixa um valor: é o que as partes acordarem.', 'The law sets no amount: it is what the parties agree.'),
    },
    {
      name: 'compensacaoAbrange',
      type: 'radio',
      section: 'compensacao',
      label: l('A compensação…', 'The compensation…'),
      default: 'acresce',
      options: [
        { value: 'acresce', label: l('Acresce ao salário e férias em dívida', 'Is in addition to unpaid salary and leave') },
        { value: 'global', label: l('Inclui todos os valores devidos (global)', 'Includes all amounts due (global)') },
      ],
      showIf: (v) => money(v.compensacao) != null,
    },
    {
      name: 'formaPagamento',
      type: 'select',
      section: 'compensacao',
      width: 'half',
      label: l('Forma de pagamento', 'Payment method'),
      options: FORMA_PAGAMENTO_OPTIONS,
      default: 'transferência bancária',
    },
    {
      name: 'dataPagamento',
      type: 'date',
      section: 'compensacao',
      width: 'half',
      label: l('Data de pagamento', 'Payment date'),
      help: l('Se ficar vazio, o pagamento é feito na data de cessação.', 'If empty, payment is made on the termination date.'),
    },
    {
      name: 'quitacao',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Cláusula de quitação', 'Release clause'),
      help: l('Depois de pagos os valores, nenhuma das partes pode exigir mais nada à outra.', 'Once paid, neither party can claim anything more from the other.'),
    },
    {
      name: 'devolucaoBens',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Devolução de bens da empresa', 'Return of company property'),
    },
    {
      name: 'sigilo',
      type: 'toggle',
      section: 'opcoes',
      label: l('Confidencialidade dos termos do acordo', 'Confidential terms'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.data && v.dataFimContrato && diffDays(v.data, v.dataFimContrato) < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('A data de cessação é anterior à assinatura do acordo.', 'The termination date is before signing.') });
    }
    if (v.dataPagamento && v.dataFimContrato && diffDays(v.dataFimContrato, v.dataPagamento) > 0) {
      w.push({ level: 'info', field: 'dataPagamento', message: l('O pagamento é posterior à data de cessação.', 'Payment is after the termination date.') });
    }
    if (legalEntry('revogacaoAcordo').confidence === 'confirm') {
      w.push({
        level: 'info',
        message: l(
          'O prazo para o trabalhador revogar o acordo deve ser confirmado com um jurista antes da assinatura.',
          'The period in which the employee may revoke the agreement should be confirmed with a lawyer before signing.',
        ),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const T = g(ge, 'o Trabalhador', 'a Trabalhadora');
    const TCap = g(ge, 'O Trabalhador', 'A Trabalhadora');
    const aoT = g(ge, 'ao Trabalhador', 'à Trabalhadora');
    const doT = g(ge, 'do Trabalhador', 'da Trabalhadora');
    const comp = money(v.compensacao);
    const global = comp != null && v.compensacaoAbrange === 'global';
    const revogacaoDias = ctx.legal.value<{ revogacaoDias: number }>('revogacaoAcordo').revogacaoDias;
    const dataPag = v.dataPagamento ? dateLong(v.dataPagamento) : `${dateLong(v.dataFimContrato)}, data da cessação`;
    const creditos = 'a remuneração devida até à data da cessação e as férias vencidas e não gozadas, bem como as proporcionais ao tempo de serviço prestado no ano da cessação';

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pelo presente acordo, as partes revogam, por mútuo acordo, o contrato de trabalho celebrado em ${dateLong(v.trabalhadorDataAdmissao)}${v.trabalhadorCargo ? `, ao abrigo do qual ${T} exerce as funções de ${v.trabalhadorCargo}` : ''}, nos termos ${doCite('revogacaoAcordo')} (Lei do Trabalho).`,
        en: `By this agreement the parties end, by mutual consent, the employment contract signed on ${v.trabalhadorDataAdmissao || '___'}.`,
      },
      {
        id: 'efeitos',
        heading: 'Produção de efeitos',
        text: `O presente acordo é celebrado em **${dateLong(v.data)}** e a cessação do contrato de trabalho produz efeitos em **${dateLong(v.dataFimContrato)}**, mantendo-se até essa data os direitos e deveres das partes.${
          v.dispensaTrabalho
            ? ` ${TCap} fica ${g(ge, 'dispensado', 'dispensada')} de prestar trabalho a partir de ${dateLong(v.dataDispensa)}, mantendo o direito à remuneração até à data da cessação.`
            : ''
        }`,
        en: `This agreement is signed on ${v.data || '___'} and the termination takes effect on ${v.dataFimContrato || '___'}; until then the parties’ rights and duties remain.${v.dispensaTrabalho ? ' The employee is released from work from the date stated, with pay until termination.' : ''}`,
      },
    ];
    if (comp != null) {
      clauses.push({
        id: 'compensacao',
        heading: 'Compensação',
        text: global
          ? `A Empregadora paga ${aoT} uma compensação pecuniária global no valor de **${valorExtenso(comp)}**, na qual se incluem todos os créditos emergentes do contrato de trabalho e da sua cessação, designadamente ${creditos}.`
          : `A Empregadora paga ${aoT} uma compensação pecuniária no valor de **${valorExtenso(comp)}**, que acresce às importâncias devidas pela cessação do contrato, designadamente ${creditos}.`,
        en: global
          ? `The employer pays the employee global compensation of ${formatMoney(comp)}, which includes all amounts arising from the contract and its termination.`
          : `The employer pays the employee compensation of ${formatMoney(comp)}, in addition to the amounts due on termination (pay to date and annual leave).`,
      });
    } else {
      clauses.push({
        id: 'compensacao',
        heading: 'Créditos',
        text: `A Empregadora paga ${aoT} as importâncias devidas pela cessação do contrato, designadamente ${creditos}.`,
        en: 'The employer pays the employee the amounts due on termination, namely pay to date and accrued and pro-rata annual leave.',
      });
    }
    clauses.push({
      id: 'pagamento',
      heading: 'Forma e data de pagamento',
      text: `As importâncias referidas na cláusula anterior são pagas por ${v.formaPagamento || 'transferência bancária'}, até ${dataPag}.`,
      en: `The amounts above are paid by ${v.formaPagamento || 'bank transfer'} by ${v.dataPagamento || 'the termination date'}.`,
    });
    if (v.quitacao) {
      clauses.push({
        id: 'quitacao',
        heading: 'Quitação',
        text: `Com o pagamento integral das importâncias previstas neste acordo, as partes declaram nada mais terem a exigir uma da outra, seja a que título for, em consequência da celebração, execução ou cessação do contrato de trabalho, dando-se reciprocamente plena e integral quitação.`,
        en: 'Once all amounts under this agreement are paid, the parties declare they have no further claims against each other arising from the employment contract or its termination.',
      });
    }
    if (v.devolucaoBens) {
      clauses.push({
        id: 'bens',
        heading: 'Devolução de bens',
        text: `Até à data da cessação, ${T} devolve à Empregadora todos os bens, equipamentos, documentos e cartões de acesso que lhe tenham sido confiados.`,
        en: 'By the termination date the employee returns all company property, equipment, documents and access cards.',
      });
    }
    if (v.sigilo) {
      clauses.push({
        id: 'sigilo',
        heading: 'Confidencialidade',
        text: 'As partes obrigam-se a manter confidenciais os termos do presente acordo, salvo perante as autoridades competentes ou quando a sua divulgação seja exigida por lei.',
        en: 'The parties keep the terms of this agreement confidential, except before the authorities or where disclosure is required by law.',
      });
    }
    clauses.push(
      {
        id: 'revogacao',
        heading: `Direito de revogação ${doT}`,
        text: `Nos termos ${doCite('revogacaoAcordo')}, ${T} pode fazer cessar os efeitos do presente acordo mediante comunicação escrita à Empregadora, no prazo não superior a ${revogacaoDias} dias a contar da sua celebração, devolvendo na íntegra e de imediato o valor que tiver recebido a título de compensação. ${TCap} pode ainda enviar cópia do presente acordo ao órgão sindical da empresa e ao órgão da administração do trabalho, para efeitos de apreciação.`,
        en: `The employee may cancel this agreement by written notice to the employer within ${revogacaoDias} days of signing, returning in full and at once any compensation received. The employee may also send a copy to the company union and the labour administration for review.`,
      },
      {
        id: 'certificado',
        heading: 'Certificado de trabalho',
        text: `Na data da cessação, a Empregadora entrega ${aoT} o certificado de trabalho, nos termos ${doCite('certificadoTrabalho')}.`,
        en: 'On the termination date the employer gives the employee the certificate of employment.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Acordo de revogação do contrato de trabalho' },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Entre:\n${employerParty(ctx, 'Empregadora')};\ne\n${workerParty(v)},\né celebrado, livremente e de boa-fé, o presente acordo de revogação do contrato de trabalho, que se rege pelas cláusulas seguintes:`,
        en: 'Between the employer and the employee identified above, this agreement to terminate the employment contract is freely entered into on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'duplicado',
        text: `Feito em ${ctx.place}, em ${dateLong(v.data)}, em dois exemplares de igual valor, ficando um em poder de cada uma das partes, que os assinam.`,
        en: 'Made in two copies of equal value, one for each party, who sign them.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Empregadora'), workerSignature(v)] },
    ];
    return blocks;
  },
});
