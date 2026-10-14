// Contrato de penhor (civil ou mercantil): coisas móveis com ou sem entrega
// ao credor, ou penhor de créditos e saldos de conta, em garantia de uma dívida.

import { defineTemplate, type Block, type ClauseItem, type FieldOption, type Values, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, quantos, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';

const MODALIDADE_OPTIONS: FieldOption[] = [
  { value: 'entrega', label: l('Com entrega dos bens ao credor (ou a depositário)', 'Goods delivered to the creditor (or a custodian)') },
  { value: 'semEntrega', label: l('Sem entrega: os bens ficam com o dono, com registo', 'No delivery: owner keeps the goods, registered') },
  { value: 'creditos', label: l('Penhor de créditos ou de saldo de conta bancária', 'Pledge of receivables or bank balance') },
];

const terceiro = (v: Values) => v.autorTerceiro === true;

type Bem = { descricao: string; identificacao: string; valor: number | null };
const bens = (v: Values): Bem[] =>
  lineItems(v.bens)
    .map((r) => ({ descricao: str(r.descricao), identificacao: str(r.identificacao), valor: money(r.valor) }))
    .filter((b) => b.descricao || b.identificacao || b.valor != null);

export default defineTemplate({
  id: 'contrato-de-penhor',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'credor', title: l('Credor pignoratício (quem recebe a garantia)', 'Pledgee (secured creditor)'), personRole: 'outro' },
    { id: 'devedor', title: l('Devedor', 'Debtor'), personRole: 'cliente' },
    { id: 'autor', title: l('Dono dos bens, se não for o devedor', 'Owner of the goods, if not the debtor'), personRole: 'outro' },
    { id: 'divida', title: l('Dívida garantida', 'Secured debt') },
    { id: 'bens', title: l('Bens ou créditos empenhados', 'Pledged goods or receivables') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('credor', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('devedor'),
    {
      name: 'autorTerceiro',
      type: 'toggle',
      section: 'autor',
      label: l('Os bens pertencem a outra pessoa (terceiro garante)', 'The goods belong to someone else (third-party pledgor)'),
      help: l('Por exemplo, um sócio que empenha equipamento seu para garantir uma dívida da empresa.', 'E.g. a shareholder pledging his own equipment for the company’s debt.'),
    },
    ...partyFields('autor').map((f) => ({ ...f, showIf: (v: Values) => terceiro(v) && (f.showIf ? f.showIf(v) : true) })),
    {
      name: 'natureza',
      type: 'radio',
      section: 'divida',
      label: l('Natureza', 'Nature'),
      options: [
        { value: 'civil', label: l('Civil', 'Civil') },
        { value: 'mercantil', label: l('Mercantil (dívida comercial)', 'Commercial') },
      ],
      default: 'civil',
      help: l('É mercantil quando garante uma obrigação comercial (entre empresas, no exercício da actividade).', 'Commercial when it secures a commercial obligation.'),
    },
    {
      name: 'obrigacao',
      type: 'textarea',
      section: 'divida',
      required: true,
      rows: 2,
      label: l('Obrigação garantida', 'Secured obligation'),
      placeholder: l('Ex.: o reembolso do empréstimo concedido pelo contrato de mútuo de 14 de Outubro de 2026', 'E.g. repayment of the loan under the loan agreement of 14 October 2026'),
      help: l('Continua «… para garantia de …».', 'Continues “… as security for …”.'),
    },
    { name: 'valorGarantido', type: 'money', section: 'divida', width: 'half', required: true, label: l('Montante máximo garantido (capital)', 'Maximum secured amount (principal)') },
    { name: 'acessorios', type: 'toggle', section: 'divida', default: true, label: l('Garante também juros, despesas e encargos de cobrança', 'Also secures interest, costs and collection charges') },
    { name: 'modalidade', type: 'select', section: 'bens', required: true, label: l('Modalidade', 'Type of pledge'), options: MODALIDADE_OPTIONS, default: 'entrega' },
    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      label: l('Bens ou créditos', 'Goods or receivables'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Gerador a diesel 100 kVA', 'E.g. 100 kVA diesel generator') },
        { name: 'identificacao', type: 'text', label: l('Identificação (n.º de série, matrícula, conta)', 'Identification (serial, plate, account)') },
        { name: 'valor', type: 'money', label: l('Valor estimado', 'Estimated value') },
      ],
      default: [],
    },
    { name: 'depositario', type: 'text', section: 'bens', label: l('Local onde ficam os bens', 'Where the goods are kept'), placeholder: l('Ex.: armazém do devedor na Machava, Matola', 'E.g. the debtor’s warehouse') },
    { name: 'devedorCredito', type: 'text', section: 'bens', label: l('Devedor do crédito empenhado / banco do saldo', 'Debtor of the pledged receivable / bank'), showIf: (v) => v.modalidade === 'creditos' },
    { name: 'seguro', type: 'toggle', section: 'bens', default: true, label: l('Os bens devem estar seguros, com o credor como beneficiário', 'Goods must be insured with the creditor as beneficiary'), showIf: (v) => v.modalidade !== 'creditos' },
    { name: 'vendaExtrajudicial', type: 'toggle', section: 'clausulas', default: true, label: l('Permitir venda extrajudicial dos bens em caso de incumprimento', 'Allow out-of-court sale on default'), help: l('Pelo valor fixado por avaliação independente, devolvendo ao dono o excedente.', 'At an independently appraised value, returning any surplus to the owner.') },
    { name: 'prazoVenda', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 90, default: 15, label: l('Prazo para pagar depois do aviso (dias)', 'Days to pay after notice'), showIf: (v) => Boolean(v.vendaExtrajudicial) },
    { name: 'prazoRestituicao', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 60, default: 8, label: l('Prazo para devolver os bens após pagamento (dias)', 'Days to return the goods after payment') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'credor', 'credor', 'creditor'), ...partyWarnings(v, 'devedor', 'devedor', 'debtor')];
    if (terceiro(v)) w.push(...partyWarnings(v, 'autor', 'dono dos bens', 'owner of the goods'));
    if (!bens(v).length) w.push({ level: 'warning', field: 'bens', message: l('Identifique os bens ou créditos empenhados.', 'Identify the pledged goods or receivables.') });
    if (money(v.valorGarantido) == null) w.push({ level: 'warning', field: 'valorGarantido', message: l('Indique o montante máximo garantido.', 'Enter the maximum secured amount.') });
    if (v.modalidade === 'semEntrega') {
      w.push({
        level: 'warning',
        message: l(
          `Sem entrega dos bens, registe o penhor na Central de Registo de Garantias Mobiliárias: o registo dá publicidade à garantia e define a prioridade entre credores (${cite('finGarantiasMobiliariasRegisto')}).`,
          'Without delivery, register the pledge at the Movable Collateral Registry: registration makes it public and sets priority between creditors.',
        ),
      });
    }
    if (v.modalidade === 'creditos') {
      w.push({ level: 'warning', message: l('O penhor de créditos só produz efeitos em relação ao devedor do crédito depois de lhe ser notificado (use a notificação de cessão como modelo). Um saldo bancário exige o acordo do banco.', 'A pledge of receivables binds the debtor only once notified. A bank balance needs the bank’s agreement.') });
    }
    w.push({
      level: 'info',
      message: l(
        `O credor não pode ficar com os bens em pagamento por simples falta de pagamento (${cite('finPenhor')}). Viaturas, quotas de sociedades e acções têm regras de forma e registo próprias: confirme no notário ou na conservatória.`,
        'The creditor cannot simply keep the goods on default. Vehicles, company quotas and shares have their own form and registration rules: check with a notary or registry.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'devedor') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = papel(v, 'credor', 'Credor', 'Credora');
    const D = papel(v, 'devedor', 'Devedor', 'Devedora');
    const A = terceiro(v) ? papel(v, 'autor', 'Garante', 'Garante') : D;
    const lista = bens(v);
    const totalBens = lista.reduce((a, b) => a + (b.valor ?? 0), 0);
    const mercantil = v.natureza === 'mercantil';
    const dono = terceiro(v) ? A : D;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `Pelo presente contrato, ${dono.o} constitui a favor ${C.de} penhor ${mercantil ? 'mercantil ' : ''}sobre ${v.modalidade === 'creditos' ? 'os créditos' : 'os bens'} identificados no quadro seguinte, de que é ${dono.f ? 'legítima proprietária' : 'legítimo proprietário'}${v.modalidade === 'creditos' ? ' e titular' : ''}, livres de ónus ou encargos, para garantia de ${semPonto(v.obrigacao) || BLANK}.`,
          `O penhor garante o capital até ao montante máximo de ${valorTexto(money(v.valorGarantido))}${v.acessorios ? ', acrescido dos juros, despesas e encargos de cobrança' : ''}.`,
        ]),
        en: 'The owner pledges the goods or receivables listed below to the creditor as security for the obligation, up to the maximum amount.',
      },
    ];
    if (v.modalidade === 'entrega') {
      clauses.push({
        id: 'entrega',
        heading: 'Entrega e guarda dos bens',
        text: numerar([
          `Os bens são entregues ${C.ao} nesta data${str(v.depositario) ? `, ficando depositados em ${semPonto(v.depositario)}` : ''}, valendo a assinatura do presente contrato como termo de entrega.`,
          `${C.O} obriga-se a guardar e conservar os bens com diligência, a não os usar sem autorização ${dono.de} e a restituí-los logo que a obrigação garantida se extinga.`,
        ]),
        en: 'The goods are delivered to the creditor today; the creditor must keep them carefully, not use them and return them once the debt is paid.',
      });
    } else if (v.modalidade === 'semEntrega') {
      clauses.push({
        id: 'deposito',
        heading: 'Bens em poder do dono',
        text: numerar([
          `Os bens permanecem em poder ${dono.de}${str(v.depositario) ? `, em ${semPonto(v.depositario)}` : ''}, que os detém na qualidade de ${dono.f ? 'fiel depositária' : 'fiel depositário'} e responde pela sua guarda e conservação.`,
          `${dono.O} não pode vender, onerar, ceder ou retirar os bens do local indicado sem autorização escrita ${C.de}, e deve permitir a sua inspecção sempre que ${C.o} o solicite com aviso razoável.`,
          `${C.O} pode registar o penhor na Central de Registo de Garantias Mobiliárias, obrigando-se ${dono.o} a prestar a colaboração necessária (${cite('finGarantiasMobiliariasRegisto')}).`,
        ]),
        en: 'The goods stay with the owner as custodian, who may not sell, encumber or move them without consent; the creditor may register the pledge.',
      });
    } else {
      clauses.push({
        id: 'creditos',
        heading: 'Créditos empenhados',
        text: numerar([
          `O penhor será notificado ${str(v.devedorCredito) ? `a ${semPonto(v.devedorCredito)}` : 'ao devedor dos créditos empenhados'}, a partir de cuja notificação os pagamentos devem ser feitos nos termos nela indicados.`,
          `${dono.O} não pode receber, ceder, compensar ou por qualquer forma dispor dos créditos empenhados sem autorização escrita ${C.de}, e entrega ${C.ao} os documentos que os comprovam.`,
        ]),
        en: 'The pledge will be notified to the debtor of the receivables; the owner may not collect or dispose of them without consent.',
      });
    }
    if (v.modalidade !== 'creditos' && v.seguro) {
      clauses.push({
        id: 'seguro',
        heading: 'Seguro',
        text: `${v.modalidade === 'entrega' ? C.O : dono.O} mantém os bens seguros contra incêndio, roubo e danos, por valor não inferior ao indicado no quadro da Cláusula Primeira, indicando ${C.o} como ${C.f ? 'beneficiária' : 'beneficiário'} da indemnização até ao montante em dívida.`,
        en: 'The goods are insured against fire, theft and damage, with the creditor as loss payee up to the amount owed.',
      });
    }
    clauses.push({
      id: 'incumprimento',
      heading: 'Incumprimento e execução',
      text: numerar([
        `Se a obrigação garantida não for cumprida no vencimento, ${C.o} pode promover a venda dos ${v.modalidade === 'creditos' ? 'créditos' : 'bens'} empenhados para se pagar pelo produto da venda, com preferência sobre os demais credores.`,
        v.vendaExtrajudicial
          ? `As partes acordam que a venda pode ser feita extrajudicialmente, pelo valor fixado por avaliador independente escolhido por acordo, depois de ${dono.o} ser ${dono.f ? 'notificada' : 'notificado'} por escrito para pagar e não o fazer no prazo de ${quantos(int(v.prazoVenda) ?? 15, 'dia', 'dias')}.`
          : 'A venda é feita judicialmente, nos termos da lei processual.',
        `É nulo qualquer acordo pelo qual ${C.o} faça seus os bens em caso de falta de pagamento; o excedente do produto da venda, depois de pago o crédito, é entregue ${dono.ao}.`,
      ]),
      en: `On default the creditor may have the pledged assets sold and be paid first${v.vendaExtrajudicial ? ', out of court at an independent valuation after notice' : ', through the courts'}; it may not simply keep them, and any surplus goes to the owner.`,
    });
    clauses.push({
      id: 'extincao',
      heading: 'Extinção',
      text: `Cumprida integralmente a obrigação garantida, o penhor extingue-se e ${C.o} ${v.modalidade === 'entrega' ? 'restitui os bens' : 'emite declaração de extinção'}${v.modalidade === 'semEntrega' ? ', promovendo o cancelamento do registo' : ''}, no prazo de ${quantos(int(v.prazoRestituicao) ?? 8, 'dia', 'dias')}.`,
      en: 'Once the debt is paid, the pledge ends and the creditor returns the goods or confirms the release.',
    });
    clauses.push(...clausulasFinais(v, { lei: mercantil ? 'do Código Civil e do Código Comercial' : 'do Código Civil' }));

    const parties = [
      { p: 'credor', role: C, en: 'Creditor' },
      { p: 'devedor', role: D, en: 'Debtor' },
      ...(terceiro(v) ? [{ p: 'autor', role: A, en: 'Pledgor' }] : []),
    ];
    const cols = [assinatura(ctx, 'credor', C, true), assinatura(ctx, 'devedor', D)];
    if (terceiro(v)) cols.push(assinatura(ctx, 'autor', A));

    const blocks: Block[] = [
      { type: 'title', text: mercantil ? 'Contrato de penhor mercantil' : 'Contrato de penhor' },
      ...partesBlocks(v, parties),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado o presente contrato de penhor, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This pledge agreement is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses.slice(0, 1) },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'right' },
          { label: v.modalidade === 'creditos' ? 'Crédito' : 'Bem', width: 3 },
          { label: 'Identificação', width: 2.2 },
          { label: 'Valor (MT)', width: 1.3, align: 'right' },
        ],
        rows: (lista.length ? lista : [{ descricao: '', identificacao: '', valor: null }]).map((b, i) => [String(i + 1), b.descricao || BLANK, b.identificacao || '—', b.valor != null ? formatMoney(b.valor, false) : BLANK]),
        totals: lista.length > 1 ? [['', 'Total', '', formatMoney(totalBens, false)]] : undefined,
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses.slice(1), start: 2 },
      ...fecho(ctx, cols),
    ];
    return blocks;
  },
});
