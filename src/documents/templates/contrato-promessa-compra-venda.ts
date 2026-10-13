// Contrato-promessa de compra e venda de imóvel (prédio urbano, fracção
// autónoma, ou benfeitorias implantadas em terreno com DUAT). The final sale is
// made by notarial deed; this document is only the promise.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, int, lines, numerar,
  papel, partesBlocks, partyFields, partyName, partyWarnings, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

const VARIANTES = [
  { value: 'predio', label: l('Prédio urbano (casa, moradia, edifício)', 'Urban building (house, building)') },
  { value: 'fraccao', label: l('Fracção autónoma (apartamento em propriedade horizontal)', 'Flat in a condominium building') },
  { value: 'benfeitorias', label: l('Benfeitorias em terreno com DUAT (sem prédio registado)', 'Improvements on a plot with a DUAT (no registered building)') },
];

export default defineTemplate({
  id: 'contrato-promessa-compra-venda',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'vendedor', title: l('Promitente-vendedor', 'Promising seller'), personRole: 'outro' },
    { id: 'comprador', title: l('Promitente-comprador', 'Promising buyer'), personRole: 'cliente' },
    {
      id: 'imovel',
      title: l('Imóvel', 'Property'),
      description: l('A terra é do Estado e não se vende: vende-se o prédio (ou as benfeitorias) e o DUAT acompanha-o.', 'Land belongs to the State and is not sold: the building (or improvements) is sold and the DUAT goes with it.'),
    },
    { id: 'preco', title: l('Preço, sinal e pagamento', 'Price, deposit and payment') },
    { id: 'escritura', title: l('Escritura e entrega', 'Deed and handover') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('vendedor', { fromProfile: true, conjuge: true }),
    ...partyFields('comprador', { conjuge: false }),

    { name: 'variante', type: 'radio', section: 'imovel', required: true, label: l('O que se vende', 'What is being sold'), options: VARIANTES, default: 'predio' },
    {
      name: 'imovelDescricao',
      type: 'text',
      section: 'imovel',
      required: true,
      label: l('Descrição', 'Description'),
      placeholder: l('Ex.: moradia do tipo 3, de rés-do-chão, com quintal', 'E.g. three-bedroom single-storey house with yard'),
    },
    { name: 'imovelMorada', type: 'text', section: 'imovel', required: true, label: l('Localização (rua, número, bairro, cidade)', 'Location (street, number, area, city)') },
    { name: 'fraccaoLetra', type: 'text', section: 'imovel', width: 'half', label: l('Fracção (letra)', 'Unit (letter)'), showIf: (v) => v.variante === 'fraccao' },
    { name: 'fraccaoAndar', type: 'text', section: 'imovel', width: 'half', label: l('Andar e lado', 'Floor and side'), placeholder: l('Ex.: 3.º andar esquerdo', 'E.g. 3rd floor left'), showIf: (v) => v.variante === 'fraccao' },
    {
      name: 'registoConservatoria',
      type: 'text',
      section: 'imovel',
      width: 'half',
      label: l('Conservatória do Registo Predial de', 'Land Registry of'),
      placeholder: l('Ex.: Maputo', 'E.g. Maputo'),
      showIf: (v) => v.variante !== 'benfeitorias',
    },
    { name: 'registoNumero', type: 'text', section: 'imovel', width: 'half', label: l('Descrição predial n.º', 'Registry description no.'), showIf: (v) => v.variante !== 'benfeitorias' },
    { name: 'matrizNumero', type: 'text', section: 'imovel', width: 'half', label: l('Inscrição matricial / cadastro municipal n.º', 'Tax register / municipal cadastre no.') },
    { name: 'areaTerreno', type: 'number', section: 'imovel', width: 'half', label: l('Área do terreno (m²)', 'Plot area (m²)') },
    {
      name: 'duatNumero',
      type: 'text',
      section: 'imovel',
      width: 'half',
      label: l('Título do DUAT n.º / talhão n.º', 'DUAT title no. / plot no.'),
      help: l('Se não houver título, descreva a ocupação reconhecida (ex.: "ocupação de boa-fé, declaração do bairro de…").', 'If there is no title, describe the recognised occupation.'),
    },
    {
      name: 'recheio',
      type: 'lines',
      section: 'imovel',
      label: l('Recheio incluído no preço (opcional)', 'Contents included in the price (optional)'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 1 },
      ],
    },
    {
      name: 'onus',
      type: 'textarea',
      section: 'imovel',
      rows: 2,
      label: l('Ónus ou encargos existentes (se houver)', 'Existing charges (if any)'),
      help: l('Ex.: hipoteca a favor do Banco X, a cancelar até à escritura. Deixe em branco se o imóvel estiver livre.', 'E.g. mortgage to Bank X, to be cancelled before the deed. Leave blank if there are none.'),
    },

    { name: 'preco', type: 'money', section: 'preco', required: true, width: 'half', label: l('Preço total', 'Total price') },
    {
      name: 'sinal',
      type: 'money',
      section: 'preco',
      required: true,
      width: 'half',
      label: l('Sinal pago na assinatura', 'Deposit paid on signing'),
      help: l('Se o comprador desistir, perde o sinal; se for o vendedor, devolve o dobro.', 'If the buyer pulls out, the deposit is lost; if the seller does, they return double.'),
    },
    {
      name: 'reforcos',
      type: 'lines',
      section: 'preco',
      label: l('Reforços de sinal (opcional)', 'Additional deposits (optional)'),
      addLabel: l('Adicionar reforço', 'Add payment'),
      columns: [
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
        { name: 'data', type: 'date', label: l('Até', 'By') },
      ],
    },
    {
      name: 'remanescenteForma',
      type: 'select',
      section: 'preco',
      label: l('Pagamento do restante', 'Payment of the balance'),
      options: [
        { value: 'escritura', label: l('No acto da escritura', 'At the deed') },
        { value: 'credito', label: l('Com crédito bancário, na escritura', 'With a bank loan, at the deed') },
        { value: 'transferencia', label: l('Por transferência, antes da escritura', 'By transfer, before the deed') },
      ],
      default: 'escritura',
    },
    { name: 'bancoCredito', type: 'text', section: 'preco', width: 'half', label: l('Banco financiador', 'Lending bank'), showIf: (v) => v.remanescenteForma === 'credito' },
    { name: 'nib', type: 'text', section: 'preco', width: 'half', label: l('NIB do vendedor (para transferências)', 'Seller’s bank account (NIB)') },

    { name: 'dataEscrituraLimite', type: 'date', section: 'escritura', required: true, width: 'half', label: l('Escritura até', 'Deed by') },
    {
      name: 'marcaEscritura',
      type: 'radio',
      section: 'escritura',
      width: 'half',
      label: l('Quem marca a escritura', 'Who books the deed'),
      options: [
        { value: 'comprador', label: l('Comprador', 'Buyer') },
        { value: 'vendedor', label: l('Vendedor', 'Seller') },
      ],
      default: 'comprador',
    },
    { name: 'avisoEscrituraDias', type: 'number', section: 'escritura', width: 'half', min: 1, max: 90, default: 15, label: l('Aviso da data da escritura (dias)', 'Notice of the deed date (days)') },
    {
      name: 'encargos',
      type: 'radio',
      section: 'escritura',
      label: l('Despesas de escritura, registo e SISA', 'Deed, registration and SISA costs'),
      options: [
        { value: 'comprador', label: l('Comprador', 'Buyer') },
        { value: 'vendedor', label: l('Vendedor', 'Seller') },
        { value: 'repartidas', label: l('Em partes iguais', 'Shared equally') },
      ],
      default: 'comprador',
    },
    {
      name: 'tradicaoAntecipada',
      type: 'toggle',
      section: 'escritura',
      label: l('O comprador recebe as chaves antes da escritura', 'Buyer gets the keys before the deed'),
      help: l('Entrega antecipada. Dá ao comprador o uso do imóvel, mas o vendedor continua dono até à escritura.', 'Early handover: the buyer may use the property, but the seller stays owner until the deed.'),
    },
    { name: 'dataEntrega', type: 'date', section: 'escritura', width: 'half', label: l('Data de entrega das chaves', 'Key handover date'), showIf: (v) => Boolean(v.tradicaoAntecipada) },

    {
      name: 'execucaoEspecifica',
      type: 'toggle',
      section: 'clausulas',
      default: true,
      label: l('Permitir execução específica (o tribunal pode obrigar à venda)', 'Allow specific performance (court can order the sale)'),
      help: l('Recomendado. Sem esta cláusula, havendo sinal, a parte cumpridora fica, em regra, só com o sinal ou o dobro.', 'Recommended. Without it, where there is a deposit, the innocent party usually only keeps the deposit or double.'),
    },
    { name: 'prazoInterpelacaoDias', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 120, default: 30, label: l('Prazo para cumprir após interpelação (dias)', 'Time to perform after formal notice (days)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const preco = money(v.preco);
    const sinal = money(v.sinal);
    const reforcos = lines(v.reforcos)
      .map((r) => ({ valor: money(r.valor), data: str(r.data) }))
      .filter((r) => r.valor != null && r.valor > 0);
    const totalReforcos = roundMoney(reforcos.reduce((s, r) => s + (r.valor ?? 0), 0));
    const remanescente = preco != null ? roundMoney(preco - (sinal ?? 0) - totalReforcos) : null;
    return {
      preco,
      sinal,
      reforcos,
      totalReforcos,
      remanescente,
      recheio: lines(v.recheio).filter((r) => str(r.item)),
    };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'vendedor', 'promitente-vendedor', 'seller', { conjuge: true }),
      ...partyWarnings(v, 'comprador', 'promitente-comprador', 'buyer'),
    ];
    if (!str(v.imovelMorada)) w.push({ level: 'error', field: 'imovelMorada', message: l('Indique a localização do imóvel.', 'Enter the property location.') });
    if (c.preco == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    if (c.sinal != null && c.preco != null && c.sinal + c.totalReforcos > c.preco) {
      w.push({ level: 'error', field: 'sinal', message: l('O sinal e os reforços excedem o preço.', 'The deposit and additional payments exceed the price.') });
    }
    if (v.variante === 'benfeitorias' && !str(v.duatNumero)) {
      w.push({ level: 'error', field: 'duatNumero', message: l('Indique o título do DUAT ou a ocupação reconhecida do terreno.', 'Enter the DUAT title or the recognised occupation of the plot.') });
    }
    if (v.variante !== 'benfeitorias' && !str(v.registoNumero)) {
      w.push({ level: 'info', field: 'registoNumero', message: l('Peça uma certidão do registo predial actualizada e indique a descrição predial. Confirme que o vendedor é o titular inscrito e que não há ónus.', 'Get an up-to-date land registry certificate and enter the registry number. Check the seller is the registered owner and there are no charges.') });
    }
    w.push({
      level: 'warning',
      message: l(
        `Este documento é só a promessa. A venda definitiva de imóveis exige escritura pública (ou modelo de contrato aprovado, com assinaturas reconhecidas no notário), sob pena de nulidade (${cite('vendaImoveisForma')}). Recomenda-se o reconhecimento presencial das assinaturas desta promessa no notário.`,
        'This is only the promise. The final sale of real estate requires a notarial deed (or an approved model contract with notarised signatures), or it is void. Having the signatures on this promise certified in person by a notary is recommended.',
      ),
    });
    if (c.preco != null && c.preco > 0) {
      const taxa = legal.value<number>('sisaTaxa');
      w.push({
        level: 'info',
        message: l(
          `SISA: cerca de ${formatMoney(roundMoney(c.preco * taxa))}, paga pelo comprador antes da escritura, sobre o maior entre o preço e o valor patrimonial. Há também imposto do selo sobre a aquisição.`,
          `SISA (property transfer tax): about ${formatMoney(roundMoney(c.preco * taxa))}, paid by the buyer before the deed, on the higher of the price and the assessed value. Stamp duty on the acquisition also applies.`,
        ),
      });
    }
    if (v.variante === 'benfeitorias') {
      w.push({
        level: 'warning',
        message: l(
          `A terra não pode ser vendida. Só se transmitem as benfeitorias, por escritura pública precedida de autorização da entidade estatal competente (${cite('transmissaoBenfeitorias')}). Nos prédios urbanos, o DUAT acompanha o prédio.`,
          'Land cannot be sold. Only the improvements can be transferred, by notarial deed after authorisation by the competent State body. For urban buildings the DUAT passes with the building.',
        ),
      });
    }
    w.push({
      level: 'info',
      message: l('Pague o sinal por transferência bancária e guarde o comprovativo. Este contrato serve de quitação do sinal.', 'Pay the deposit by bank transfer and keep the proof. This contract acknowledges receipt of the deposit.'),
    });
    return w;
  },

  personName: (v) => partyName(v, 'comprador') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const V = papel(v, 'vendedor', 'Promitente-Vendedor', 'Promitente-Vendedora');
    const C = papel(v, 'comprador', 'Promitente-Comprador', 'Promitente-Compradora');
    const morada = semPonto(v.imovelMorada) || BLANK;
    const desc = semPonto(v.imovelDescricao) || 'imóvel';
    const area = int(v.areaTerreno);
    const duat = semPonto(v.duatNumero);
    const registo = [
      str(v.registoNumero) ? `descrito na Conservatória do Registo Predial de ${semPonto(v.registoConservatoria) || BLANK} sob o n.º ${semPonto(v.registoNumero)}` : '',
      str(v.matrizNumero) ? `inscrito na matriz predial sob o n.º ${semPonto(v.matrizNumero)}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const terreno = [area && area > 0 ? `implantado em parcela de terreno com a área de ${area} m²` : '', duat ? `titulada pelo DUAT n.º ${duat}` : '']
      .filter(Boolean)
      .join(', ');

    let objecto: string;
    let considerando: string;
    if (v.variante === 'fraccao') {
      considerando = `${V.O} é ${V.f ? 'dona' : 'dono'} e legítim${V.f ? 'a' : 'o'} possuidor${V.f ? 'a' : ''} da fracção autónoma designada pela letra ${semPonto(v.fraccaoLetra) || BLANK}, correspondente ao ${semPonto(v.fraccaoAndar) || BLANK}, destinada a ${desc}, do prédio em regime de propriedade horizontal sito em ${morada}${registo ? `, ${registo}` : ''}`;
      objecto = `a fracção autónoma identificada no considerando a)`;
    } else if (v.variante === 'benfeitorias') {
      considerando = `${V.O} é titular das benfeitorias, construções e infra-estruturas que compõem ${desc}, implantadas na parcela de terreno sita em ${morada}${area && area > 0 ? `, com a área de ${area} m²` : ''}, objecto do direito de uso e aproveitamento da terra titulado por ${duat || BLANK}${str(v.matrizNumero) ? `, inscritas no cadastro municipal sob o n.º ${semPonto(v.matrizNumero)}` : ''}`;
      objecto = 'as benfeitorias, construções e infra-estruturas identificadas no considerando a)';
    } else {
      considerando = `${V.O} é ${V.f ? 'dona' : 'dono'} e legítim${V.f ? 'a' : 'o'} possuidor${V.f ? 'a' : ''} do prédio urbano composto por ${desc}, sito em ${morada}${registo ? `, ${registo}` : ''}${terreno ? `, ${terreno}` : ''}`;
      objecto = 'o prédio identificado no considerando a)';
    }

    const considerandos: string[] = [
      `${considerando};`,
      `${C.O} pretende adquirir o referido ${v.variante === 'fraccao' ? 'imóvel' : v.variante === 'benfeitorias' ? 'conjunto de benfeitorias' : 'prédio'}, livre de quaisquer ónus ou encargos${str(v.onus) ? ', com excepção dos indicados na cláusula relativa às declarações' : ''};`,
      v.variante === 'benfeitorias'
        ? 'As partes reconhecem que a terra é propriedade do Estado e não é objecto de venda, e que a transmissão das benfeitorias depende de autorização prévia da entidade estatal competente e de escritura pública;'
        : 'As partes reconhecem que a terra é propriedade do Estado e que, com a transmissão do prédio, se transmite o direito de uso e aproveitamento da terra em que está implantado;',
    ];

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${V.o} promete vender ${C.ao}, que promete comprar, livre de ónus, encargos e ocupantes, ${objecto}${c.recheio.length ? ', incluindo o recheio constante do Anexo I' : ''}.`,
        v.variante === 'benfeitorias'
          ? `${V.O} obriga-se a requerer e a obter, à sua custa, a autorização da entidade estatal competente necessária à transmissão, e a entregar ${C.ao} cópia do respectivo despacho.`
          : '',
      ]),
      en: `The Seller promises to sell and the Buyer promises to buy the ${v.variante === 'benfeitorias' ? 'improvements' : 'property'} described above, free of charges and occupants${c.recheio.length ? ', with the contents in Annex I' : ''}.`,
    });

    const reforcosTxt = c.reforcos.map((r: { valor: number; data: string }) => `${valorTexto(r.valor)}, a título de reforço de sinal, até ${dateLong(r.data)}`);
    const remForma =
      v.remanescenteForma === 'transferencia'
        ? `por transferência bancária para a conta com o NIB ${str(v.nib) || BLANK}, titulada ${V.pelo}, até à data da escritura`
        : v.remanescenteForma === 'credito'
          ? `no acto da escritura, com recurso a crédito bancário${str(v.bancoCredito) ? ` concedido pelo ${semPonto(v.bancoCredito)}` : ''}`
          : 'no acto da celebração da escritura pública de compra e venda';
    const alineas = [
      `${valorTexto(c.sinal)}, na data da assinatura do presente contrato, a título de sinal e princípio de pagamento, de que ${V.o} dá, pela assinatura deste contrato, a respectiva quitação;`,
      ...reforcosTxt.map((t: string) => `${t};`),
      `o remanescente, no valor de ${valorTexto(c.remanescente)}, ${remForma}.`,
    ];
    clauses.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: `O preço global da compra e venda prometida é de ${valorTexto(c.preco)}, a pagar da seguinte forma:`,
      items: alineas,
      en: `The total price is ${c.preco != null ? formatMoney(c.preco) : '—'}: a deposit on signing (receipt acknowledged), any additional payments, and the balance ${v.remanescenteForma === 'transferencia' ? 'by bank transfer before the deed' : 'at the deed'}.`,
    });
    if (v.remanescenteForma === 'credito') {
      clauses.push({
        id: 'financiamento',
        heading: 'Financiamento bancário',
        text: numerar([
          `${C.O} obriga-se a requerer o crédito bancário necessário ao pagamento do remanescente no prazo de quinze dias a contar da assinatura do presente contrato e a diligenciar pela sua aprovação.`,
          `${V.O} obriga-se a facultar à instituição de crédito os documentos do imóvel e a permitir a sua avaliação.`,
          `Se o crédito for recusado por motivo não imputável ${C.ao}, qualquer das partes pode resolver o presente contrato, mediante comunicação escrita acompanhada do comprovativo da recusa, sendo o sinal restituído em singelo, sem lugar a outra indemnização.`,
        ]),
        en: 'The Buyer applies for the bank loan promptly; the Seller cooperates with the valuation. If the loan is refused through no fault of the Buyer, either party may terminate and the deposit is returned (single amount).',
      });
    }

    const marca = v.marcaEscritura === 'vendedor' ? V : C;
    const outro = v.marcaEscritura === 'vendedor' ? C : V;
    const aviso = int(v.avisoEscrituraDias);
    clauses.push({
      id: 'escritura',
      heading: 'Escritura',
      text: numerar([
        `A escritura pública de compra e venda, ou o contrato definitivo celebrado noutra forma legalmente admitida, será outorgada até ${dateLong(v.dataEscrituraLimite)}, em cartório notarial a indicar ${marca.pelo}.`,
        `Cabe ${marca.ao} marcar a escritura e comunicar ${outro.ao}, por escrito, o dia, a hora e o local, com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}.`,
        `${V.O} obriga-se a entregar, com a antecedência necessária à marcação da escritura, todos os documentos de que dependa a sua celebração, nomeadamente a certidão do registo predial actualizada, o título do direito de uso e aproveitamento da terra, a planta topográfica, a licença de utilização, quando exista, e os comprovativos de inexistência de dívidas relativas ao imóvel.`,
      ]),
      en: `The deed will be signed by ${v.dataEscrituraLimite || '—'} at a notary chosen by the ${marca === V ? 'Seller' : 'Buyer'}, who gives written notice of date and place. The Seller provides all documents needed.`,
    });

    const enc = v.encargos === 'vendedor' ? `${V.de}` : v.encargos === 'repartidas' ? 'de ambas as partes, em partes iguais' : `${C.de}`;
    clauses.push({
      id: 'encargos',
      heading: 'Despesas e impostos',
      text: numerar([
        `As despesas com a escritura e o registo de aquisição, bem como o imposto de SISA e o imposto do selo devidos pela transmissão, são da responsabilidade ${enc}.`,
        `As despesas com o cancelamento de ónus ou encargos e com a regularização documental do imóvel são da responsabilidade ${V.de}.`,
      ]),
      en: `Deed, registration, SISA and stamp duty are paid by ${v.encargos === 'vendedor' ? 'the Seller' : v.encargos === 'repartidas' ? 'both parties equally' : 'the Buyer'}. Clearing charges and regularising documents is for the Seller.`,
    });

    clauses.push({
      id: 'entrega',
      heading: 'Entrega do imóvel',
      text: v.tradicaoAntecipada
        ? numerar([
            `${V.O} entrega o imóvel e as respectivas chaves ${C.ao} em ${dateLong(v.dataEntrega)}, data a partir da qual correm por conta ${C.de} os consumos de água e energia e as despesas correntes do imóvel.`,
            `A entrega antecipada não transfere a propriedade, que só se transmite com a escritura. Se o contrato for resolvido, ${C.o} restitui o imóvel no prazo de quinze dias, no estado em que o recebeu.`,
          ])
        : `O imóvel é entregue ${C.ao} na data da escritura, livre de pessoas e bens${c.recheio.length ? ', com excepção do recheio do Anexo I' : ''}, com as chaves e com as contas de água e energia pagas até essa data.`,
      en: v.tradicaoAntecipada ? 'Early handover of the keys; ownership passes only with the deed; if the contract ends, the Buyer returns the property.' : 'The property is handed over empty at the deed, with keys and utilities paid up.',
    });

    const prazo = int(v.prazoInterpelacaoDias);
    clauses.push({
      id: 'sinal',
      heading: 'Incumprimento e sinal',
      text: numerar([
        `Se ${C.o} deixar de cumprir por causa que lhe seja imputável, ${V.o} tem o direito de fazer suas as quantias recebidas a título de sinal e de reforço de sinal.`,
        `Se o incumprimento for imputável ${V.ao}, ${C.o} tem o direito de exigir a restituição do sinal e dos reforços em dobro.`,
        `Considera-se haver incumprimento definitivo se a parte faltosa, interpelada por escrito para cumprir, não o fizer no prazo de ${quantos(prazo, 'dia', 'dias')}, ou se faltar à escritura regularmente marcada.`,
      ]),
      en: `If the Buyer defaults, the Seller keeps the deposit; if the Seller defaults, the Buyer may claim double. Final default if the party fails to perform within ${prazo ?? '—'} days of written notice or misses the booked deed.`,
    });

    if (v.execucaoEspecifica) {
      clauses.push({
        id: 'execucaoEspecifica',
        heading: 'Execução específica',
        text: 'Não obstante a existência de sinal, as partes convencionam expressamente que, em caso de incumprimento, a parte não faltosa pode, em alternativa ao disposto na cláusula anterior, requerer a execução específica do presente contrato, nos termos da lei civil.',
        en: 'Despite the deposit, the parties agree that the innocent party may instead ask the court for specific performance (a judgment that completes the sale).',
      });
    }

    clauses.push({
      id: 'declaracoes',
      heading: 'Declarações',
      text: numerar([
        str(v.onus)
          ? `${V.O} declara que sobre o imóvel incide apenas o seguinte ónus ou encargo: ${semPonto(v.onus)}, que se obriga a cancelar, à sua custa, até à data da escritura.`
          : `${V.O} declara que o imóvel não está onerado com hipoteca, penhora ou qualquer outro ónus ou encargo.`,
        `${V.O} declara ainda que o imóvel não está arrendado nem cedido a terceiros e que não existem dívidas relativas a impostos, água, energia ou condomínio, obrigando-se a não o vender, onerar ou prometer a terceiros até à escritura.`,
        `${C.O} declara conhecer o imóvel e o seu estado de conservação, que aceita.`,
      ]),
      en: `The Seller declares the property ${str(v.onus) ? 'is subject only to the charge stated, which will be cleared before the deed' : 'is free of charges'}, not let and without debts, and will not sell or charge it to others. The Buyer knows and accepts its condition.`,
    });

    clauses.push(...clausulasFinais(v));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato-promessa de compra e venda' },
      ...partesBlocks(v, [
        { p: 'vendedor', role: V, en: 'Promising Seller' },
        { p: 'comprador', role: C, en: 'Promising Buyer' },
      ]),
      {
        type: 'paragraph',
        id: 'considerandos',
        text: 'Considerando que:',
        en: 'Whereas:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: considerandos },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato-promessa de compra e venda, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This promissory contract of sale is entered into and accepted by both parties, on the following terms and, where silent, by the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(
        ctx,
        [assinatura(ctx, 'vendedor', V, true), assinatura(ctx, 'comprador', C)],
        {
          extraCols: [conjugeColumn(v, 'vendedor')],
          consentimento: consentimentoTexto(v, 'vendedor', V),
          notario: 'Espaço reservado ao notário para o reconhecimento presencial das assinaturas dos promitentes.',
        },
      ),
    ];
    if (c.recheio.length) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'title', text: 'Anexo I — Recheio', subtitle: 'Bens móveis incluídos no preço' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Artigo', width: 4 },
            { label: 'Quant.', width: 0.8, align: 'right' },
          ],
          rows: c.recheio.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.item), str(r.quantidade) || '1']),
        },
        { type: 'signatures', columns: [assinatura(ctx, 'vendedor', V), assinatura(ctx, 'comprador', C)] },
      );
    }
    return blocks;
  },
});
