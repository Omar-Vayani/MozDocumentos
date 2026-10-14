// Contrato de cessão de exploração (locação do estabelecimento comercial):
// the owner of a restaurant, bar, lodge, shop or workshop lets another
// business run it as a going concern for a monthly fee. Written form and the
// list of the elements leased (Código Comercial, arts. 46 and 50); workers
// pass with the business (Lei do Trabalho).

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

type Item = { item: string; quantidade: string; estado: string };
const inventario = (v: Values): Item[] =>
  lines(v.inventario)
    .map((r) => ({ item: str(r.item), quantidade: str(r.quantidade), estado: str(r.estado) }))
    .filter((r) => r.item);

const TIPOS: Record<string, string> = {
  restaurante: 'restaurante',
  bar: 'bar',
  lodge: 'estabelecimento de alojamento turístico (lodge)',
  hotel: 'hotel',
  loja: 'estabelecimento comercial',
  oficina: 'oficina',
  outro: 'estabelecimento',
};

export default defineTemplate({
  id: 'contrato-cessao-exploracao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'cedente', title: l('Cedente (dono do estabelecimento)', 'Owner of the business'), personRole: 'outro' },
    { id: 'cessionario', title: l('Cessionário (quem vai explorar)', 'Operator'), personRole: 'cliente' },
    { id: 'estabelecimento', title: l('Estabelecimento', 'Business') },
    { id: 'renda', title: l('Prazo e prestação', 'Term and fee') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('cedente', { fromProfile: true }),
    ...partyFields('cessionario', { tipoDefault: 'empresa' }),

    { name: 'tipo', type: 'select', section: 'estabelecimento', width: 'half', label: l('Tipo', 'Kind'), options: Object.entries(TIPOS).map(([value, t]) => ({ value, label: l(t.charAt(0).toUpperCase() + t.slice(1), value) })), default: 'restaurante' },
    { name: 'nome', type: 'text', section: 'estabelecimento', width: 'half', required: true, label: l('Nome comercial', 'Trade name') },
    { name: 'morada', type: 'text', section: 'estabelecimento', required: true, label: l('Localização', 'Address') },
    { name: 'imovel', type: 'radio', section: 'estabelecimento', label: l('O imóvel', 'The premises'), options: [{ value: 'proprio', label: l('É do cedente', 'Belong to the owner') }, { value: 'arrendado', label: l('É arrendado pelo cedente', 'Are rented by the owner') }], default: 'proprio' },
    { name: 'licencaEst', type: 'text', section: 'estabelecimento', label: l('Licença ou alvará do estabelecimento', 'Business licence'), placeholder: l('Ex.: Alvará n.º 312/CMM/2021', 'E.g. licence no.') },
    {
      name: 'inventario',
      type: 'lines',
      section: 'estabelecimento',
      label: l('Inventário do equipamento (Anexo)', 'Equipment inventory (Annex)'),
      addLabel: l('Adicionar item', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Equipamento ou mobiliário', 'Item') },
        { name: 'quantidade', type: 'text', label: l('Quantidade', 'Quantity') },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition') },
      ],
    },
    { name: 'marca', type: 'toggle', section: 'estabelecimento', default: true, label: l('Inclui o uso do nome comercial e da clientela', 'Includes the trade name and goodwill') },
    { name: 'trabalhadores', type: 'toggle', section: 'estabelecimento', default: false, label: l('Há trabalhadores no estabelecimento', 'There are employees') },

    { name: 'dataInicio', type: 'date', section: 'renda', width: 'half', required: true, label: l('Início', 'Start') },
    { name: 'prazoAnos', type: 'number', section: 'renda', width: 'half', min: 1, max: 30, default: 3, label: l('Prazo (anos)', 'Term (years)') },
    { name: 'renovacao', type: 'toggle', section: 'renda', default: true, label: l('Renova-se por períodos de um ano', 'Renews for one-year periods') },
    { name: 'avisoDias', type: 'number', section: 'renda', width: 'half', min: 0, max: 365, default: 90, label: l('Aviso para não renovar (dias)', 'Notice not to renew (days)') },
    { name: 'prestacao', type: 'money', section: 'renda', width: 'half', required: true, label: l('Prestação mensal', 'Monthly fee') },
    ivaField('renda'),
    { name: 'pagamentoDia', type: 'number', section: 'renda', width: 'half', min: 1, max: 31, default: 8, label: l('Pagamento até ao dia', 'Payment by day') },
    { name: 'caucaoMeses', type: 'number', section: 'renda', width: 'half', min: 0, max: 12, default: 2, label: l('Caução (número de prestações)', 'Deposit (number of monthly fees)') },
    { name: 'actualizacao', type: 'toggle', section: 'renda', default: true, label: l('Actualização anual da prestação pela inflação', 'Annual update by inflation') },
    ...formaPagamentoFields('renda'),

    { name: 'naoConcorrencia', type: 'toggle', section: 'clausulas', default: true, label: l('O cedente não abre negócio concorrente na zona durante o contrato', 'Owner will not compete nearby during the term') },
    { name: 'reconhecimento', type: 'toggle', section: 'clausulas', default: true, label: l('Espaço para reconhecimento notarial das assinaturas', 'Space for notarial certification') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'cedente', 'cedente', 'owner'), ...partyWarnings(v, 'cessionario', 'cessionário', 'operator')];
    if (money(v.prestacao) == null) w.push({ level: 'error', field: 'prestacao', message: l('Indique a prestação mensal.', 'Enter the monthly fee.') });
    w.push({ level: 'info', message: l(`O contrato tem de ser escrito e indicar os elementos do estabelecimento que são cedidos — junte o inventário (${cite('turCessaoExploracaoForma')}).`, 'The contract must be in writing and list the elements leased — attach the inventory.') });
    if (v.imovel === 'arrendado') w.push({ level: 'warning', field: 'imovel', message: l('O imóvel é arrendado: confirme que o contrato de arrendamento permite a cessão de exploração ou obtenha autorização escrita do senhorio.', 'The premises are rented: check the lease allows this or get the landlord’s written consent.') });
    if (v.trabalhadores) w.push({ level: 'warning', field: 'trabalhadores', message: l(`Os contratos de trabalho passam para quem explora o estabelecimento, com a antiguidade, e há deveres de informação e consulta prévias (${cite('rhpTransmissaoEmpresa')}).`, 'Employment contracts pass to the operator with seniority; prior information and consultation duties apply.') });
    w.push({ level: 'info', message: l(`Contratos escritos longos podem dar ao cessionário direito a uma renovação compulsória (${cite('turCessaoExploracaoRenovacao')}).`, 'Long written contracts may give the operator a right to one compulsory renewal.') });
    return w;
  },

  personName: (v) => partyName(v, 'cessionario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = papel(v, 'cedente', 'Cedente', 'Cedente');
    const B = papel(v, 'cessionario', 'Cessionário', 'Cessionária', true);
    const tipo = TIPOS[str(v.tipo)] ?? 'estabelecimento';
    const nome = str(v.nome) || BLANK;
    const inv = inventario(v);
    const prest = money(v.prestacao);
    const cm = Number(v.caucaoMeses);
    const caucao = prest != null && Number.isFinite(cm) && cm > 0 ? Math.round(prest * cm * 100) / 100 : null;

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `${A.O} é titular do ${tipo} denominado **"${nome}"**, instalado em ${semPonto(v.morada) || BLANK}${str(v.licencaEst) ? `, ao abrigo do ${semPonto(v.licencaEst)}` : ''}, ${v.imovel === 'arrendado' ? 'em imóvel que detém por arrendamento' : 'em imóvel de que é proprietário'}.`,
        `Pelo presente contrato, ${A.o} cede ${B.ao} a exploração do estabelecimento, como unidade em funcionamento, compreendendo o direito de uso das instalações, o equipamento e o mobiliário constantes do inventário anexo${v.marca ? ', o nome comercial e a clientela' : ''}, mediante o pagamento de uma prestação mensal.`,
        'Não estão incluídos as dívidas, os créditos nem os stocks existentes à data do início, salvo acordo escrito em contrário.',
      ]),
      en: `The owner leases the running business "${v.nome || '—'}" (premises use, equipment and furniture in the inventory${v.marca ? ', trade name and goodwill' : ''}) for a monthly fee; debts, receivables and stock are excluded.`,
    });
    cl.push({
      id: 'prazo',
      heading: 'Prazo',
      text: `O contrato vigora pelo prazo de ${prazo(v.prazoAnos, 'ano')}, com início em ${dateLong(v.dataInicio)}${v.renovacao ? `, renovando-se por períodos sucessivos de um ano se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${prazo(v.avisoDias)} em relação ao termo` : ''}.`,
      en: `Term as stated from the start date${v.renovacao ? ', renewing yearly unless notice is given' : ''}.`,
    });
    cl.push({
      id: 'prestacao',
      heading: 'Prestação e caução',
      text: numerar([
        `${B.O} paga ${A.ao} a prestação mensal de ${valorTexto(prest)}${ivaTexto(v.iva)}, até ao dia ${Number(v.pagamentoDia) > 0 ? Number(v.pagamentoDia) : BLANK} de cada mês, ${modoPagamento(v, A)}.`,
        v.actualizacao ? 'A prestação é actualizada anualmente, no início de cada ano de contrato, pela taxa de inflação publicada pelo Instituto Nacional de Estatística para o ano anterior.' : '',
        caucao != null ? `Na assinatura, ${B.o} entrega uma caução de ${valorTexto(caucao)}, que garante o cumprimento das suas obrigações e é restituída no fim do contrato, deduzida dos valores em dívida e dos danos verificados.` : '',
        `O atraso no pagamento confere ${A.ao} o direito a juros de mora à taxa legal.`,
      ]),
      en: `Monthly fee ${prest != null ? formatMoney(prest) : '—'}, due by the stated day${v.actualizacao ? ', updated yearly by inflation' : ''}; deposit as stated, refunded at the end less amounts due and damage.`,
    });
    cl.push({
      id: 'exploracao',
      heading: 'Exploração do estabelecimento',
      text: numerar([
        `${B.O} explora o estabelecimento por sua conta e risco, em nome próprio, mantendo o mesmo ramo de actividade e preservando a unidade dos seus elementos, sem lhe modificar o fim, e zela pelos bens que o integram como quem administra bens alheios.`,
        `${B.O} obtém em seu nome, ou averba, as licenças e os registos necessários à actividade, e cumpre todas as obrigações fiscais, laborais, de segurança social, sanitárias e de segurança contra incêndios.`,
        `São da conta ${B.de} as despesas correntes de água, electricidade, telefone, limpeza, recolha de lixo e manutenção ordinária, bem como os seguros do recheio e de responsabilidade civil, com indicação ${A.de} como beneficiário quanto ao equipamento.`,
        `${B.O} não pode subceder a exploração, nem fazer obras ou alterações às instalações, sem autorização escrita ${A.de}; as benfeitorias autorizadas ficam a fazer parte do estabelecimento, sem direito a indemnização, salvo acordo diferente.`,
      ]),
      en: 'The operator runs the business at its own risk, in the same line, keeping it intact as one managing another’s property; obtains licences in its name; pays running costs and insurance; no sub-letting or works without consent.',
    });
    if (v.trabalhadores) {
      cl.push({
        id: 'trabalhadores',
        heading: 'Trabalhadores',
        text: `Os contratos de trabalho dos trabalhadores afectos ao estabelecimento, identificados em lista assinada pelas partes, transmitem-se ${B.ao} nos termos da Lei do Trabalho, com a respectiva antiguidade. ${A.O} responde pelos salários e pelas demais obrigações vencidos até à data do início, e as partes cumprem previamente os deveres de informação e consulta dos trabalhadores.`,
        en: 'Employees pass to the operator with seniority under the Labour Law; the owner pays amounts due up to the start date; both inform and consult the workers in advance.',
      });
    }
    if (v.naoConcorrencia) {
      cl.push({
        id: 'naoConcorrencia',
        heading: 'Não concorrência',
        text: `Durante a vigência do contrato, ${A.o} não explora, directa ou indirectamente, estabelecimento do mesmo ramo na área de influência do estabelecimento cedido, sem consentimento escrito ${B.de}.`,
        en: 'During the term the owner will not run a competing business in the area without consent.',
      });
    }
    cl.push({
      id: 'resolucao',
      heading: 'Resolução',
      text: `Constituem justa causa de resolução do contrato, nomeadamente, a falta de pagamento de duas prestações, a mudança do ramo de actividade, a subcessão não autorizada, a concorrência desleal e a prática de actos abusivos ou incompatíveis com as condições acordadas, nos termos do ${cite('turCessaoExploracaoJustaCausa')}.`,
      en: 'Just causes to terminate include two unpaid fees, change of business line, unauthorised sub-letting, unfair competition and abusive acts.',
    });
    cl.push({
      id: 'restituicao',
      heading: 'Restituição',
      text: `No fim do contrato, ${B.o} restitui o estabelecimento ${A.ao}, em funcionamento e no estado em que o recebeu, com todo o equipamento do inventário, salvo o desgaste normal. A restituição é feita mediante vistoria conjunta, de que se lavra auto; o equipamento em falta ou danificado é pago pelo valor de substituição.`,
      en: 'At the end the operator returns the business running, as received, with the inventoried equipment, subject to normal wear; joint inspection record; missing or damaged items paid at replacement value.',
    });
    cl.push(clForcaMaior());

    const annex: Block[] = [
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Anexo — Inventário do equipamento e do mobiliário', subtitle: nome },
      inv.length
        ? {
            type: 'table',
            grid: true,
            columns: [
              { label: 'N.º', width: 0.5, align: 'right' },
              { label: 'Equipamento / mobiliário', width: 3.8 },
              { label: 'Quantidade', width: 1, align: 'right' },
              { label: 'Estado', width: 1.6 },
            ],
            rows: inv.map((x, i) => [String(i + 1), x.item, x.quantidade || BLANK, x.estado || BLANK]),
          }
        : { type: 'box', label: 'Equipamento, quantidade e estado', lines: 12 },
      { type: 'signatures', columns: [assinatura(ctx, 'cedente', A), assinatura(ctx, 'cessionario', B)] },
    ];

    return contratoBlocks(ctx, {
      title: 'Contrato de cessão de exploração',
      subtitle: nome !== BLANK ? nome : undefined,
      parties: [
        { p: 'cedente', role: A, en: 'Owner' },
        { p: 'cessionario', role: B, en: 'Operator' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'cedente', A, true), assinatura(ctx, 'cessionario', B)],
      notario: v.reconhecimento ? `Reconhecimento das assinaturas ${A.de} e ${B.de}.` : undefined,
      annex,
    });
  },
});
