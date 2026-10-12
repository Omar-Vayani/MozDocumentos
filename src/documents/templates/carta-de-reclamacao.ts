import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerRep, g, l, lineItems, localField, money, moneyText, splitLines } from './_shared';

// ---------------------------------------------------------------- local helpers

const isEmpresa = (v: Values, profile: Profile | null) => v.autorTipo === 'empresa' && profile?.kind === 'empresa';
const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const lowerFirst = (s: string) => {
  const t = s.trim();
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};

const PEDIDO_OPTIONS = [
  { value: 'reparacao', label: l('Reparação', 'Repair') },
  { value: 'substituicao', label: l('Substituição', 'Replacement') },
  { value: 'reembolso', label: l('Reembolso', 'Refund') },
  { value: 'correccao', label: l('Correcção da factura', 'Invoice correction') },
  { value: 'outro', label: l('Outro', 'Other') },
];

export default defineTemplate({
  id: 'carta-de-reclamacao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'autor', title: l('Quem reclama', 'Complainant'), personRole: 'outro' },
    { id: 'destinatario', title: l('Empresa ou serviço reclamado', 'Company or service') },
    { id: 'cliente', title: l('Dados de cliente', 'Customer details') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
  ],
  fields: [
    {
      name: 'ref',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('Número de referência (opcional)', 'Reference number (optional)'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.nextRef : ''),
    },
    localField(),
    dateField('data'),
    {
      name: 'autorTipo',
      type: 'radio',
      section: 'autor',
      label: l('Quem reclama', 'Who is complaining'),
      options: [
        { value: 'empresa', label: l('A empresa do perfil', 'The profile’s company') },
        { value: 'pessoa', label: l('Uma pessoa', 'An individual') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
    },
    {
      name: 'reclamanteNome',
      type: 'text',
      section: 'autor',
      required: true,
      label: l('Nome completo', 'Full name'),
      personKey: 'nome',
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : ''),
      showIf: (v) => v.autorTipo !== 'empresa',
    },
    {
      name: 'reclamanteGenero',
      type: 'radio',
      section: 'autor',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: 'M',
      personKey: 'genero',
      showIf: (v) => v.autorTipo !== 'empresa',
    },
    {
      name: 'reclamanteMorada',
      type: 'text',
      section: 'autor',
      label: l('Morada', 'Address'),
      personKey: 'morada',
      default: (c) => (c.profile?.kind === 'pessoa' ? addressLine(c.profile) : ''),
      showIf: (v) => v.autorTipo !== 'empresa',
    },
    {
      name: 'reclamanteTelefone',
      type: 'tel',
      section: 'autor',
      width: 'half',
      label: l('Telefone', 'Phone'),
      personKey: 'telefone',
      default: (c) => c.profile?.telefones || '',
    },
    {
      name: 'reclamanteEmail',
      type: 'email',
      section: 'autor',
      width: 'half',
      label: l('Email', 'Email'),
      personKey: 'email',
      default: (c) => c.profile?.email || '',
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Empresa ou prestador de serviço', 'Company or service provider'),
      placeholder: l('Ex.: Electricidade de Moçambique, E.P.', 'E.g. the electricity utility'),
    },
    {
      name: 'entidadeDepartamento',
      type: 'text',
      section: 'destinatario',
      label: l('Departamento ou à atenção de (opcional)', 'Department or attention of (optional)'),
      placeholder: l('Ex.: Departamento de Apoio ao Cliente', 'E.g. Customer Service Department'),
    },
    { name: 'entidadeMorada', type: 'text', section: 'destinatario', label: l('Morada', 'Address') },
    { name: 'numeroCliente', type: 'text', section: 'cliente', width: 'half', label: l('N.º de cliente', 'Customer no.') },
    { name: 'numeroContrato', type: 'text', section: 'cliente', width: 'half', label: l('N.º de contrato / conta', 'Contract / account no.') },
    { name: 'numeroFactura', type: 'text', section: 'cliente', width: 'half', label: l('N.º da factura ou recibo', 'Invoice or receipt no.') },
    { name: 'dataCompra', type: 'date', section: 'cliente', width: 'half', label: l('Data da compra ou do serviço', 'Date of purchase or service') },
    {
      name: 'produto',
      type: 'text',
      section: 'cliente',
      label: l('Produto ou serviço', 'Product or service'),
      placeholder: l('Ex.: frigorífico marca X, modelo Y; serviço de internet residencial', 'E.g. refrigerator brand X; home internet service'),
    },
    { name: 'valorPago', type: 'money', section: 'cliente', width: 'half', label: l('Valor pago ou facturado', 'Amount paid or billed') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'reclamacao',
      required: true,
      rows: 6,
      label: l('O que aconteceu', 'What happened'),
      help: l('Um facto por linha, por ordem. Indique datas, contactos já feitos e números de ocorrência.', 'One fact per line, in order. Include dates, previous contacts and ticket numbers.'),
    },
    {
      name: 'pedido',
      type: 'select',
      section: 'reclamacao',
      width: 'half',
      required: true,
      label: l('O que pede', 'What you ask for'),
      options: PEDIDO_OPTIONS,
      default: 'reparacao',
    },
    {
      name: 'valorReembolso',
      type: 'money',
      section: 'reclamacao',
      width: 'half',
      label: l('Valor a reembolsar', 'Amount to refund'),
      showIf: (v) => v.pedido === 'reembolso',
    },
    {
      name: 'pedidoOutro',
      type: 'text',
      section: 'reclamacao',
      label: l('Descreva o pedido', 'Describe the request'),
      help: l('Continua a frase «Solicito…». Ex.: «a reposição do serviço e o crédito dos dias sem fornecimento».', 'Continues “I request…”. E.g. “restoration of the service and a credit for the days without supply”.'),
      showIf: (v) => v.pedido === 'outro',
    },
    {
      name: 'prazoResposta',
      type: 'number',
      section: 'reclamacao',
      width: 'half',
      min: 1,
      max: 90,
      label: l('Prazo para resposta (dias)', 'Reply deadline (days)'),
      help: l('Prazo que concede à empresa para responder. Deixe vazio para pedir resposta «com a maior brevidade».', 'Time you give the company to reply. Leave empty to ask for a reply “as soon as possible”.'),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'reclamacao',
      label: l('Anexos', 'Enclosures'),
      addLabel: l('Adicionar anexo', 'Add enclosure'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Cópia da factura', 'E.g. Copy of the invoice') }],
      default: [],
    },
    {
      name: 'recibo',
      type: 'toggle',
      section: 'reclamacao',
      default: true,
      label: l('Incluir espaço para confirmar a recepção', 'Include a receipt confirmation line'),
      help: l('Útil quando entrega a carta em mão: peça um carimbo e assinatura na sua cópia.', 'Useful when delivering by hand: ask for a stamp and signature on your copy.'),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.entidade) w.push({ level: 'warning', field: 'entidade', message: l('Indique a empresa a quem reclama.', 'State the company you are complaining to.') });
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva o que aconteceu.', 'Describe what happened.') });
    if (!v.numeroCliente && !v.numeroContrato && !v.numeroFactura) {
      w.push({
        level: 'info',
        field: 'numeroFactura',
        message: l('Indique pelo menos um número de cliente, contrato ou factura, para a empresa identificar o caso.', 'Give at least one customer, contract or invoice number so the company can find the case.'),
      });
    }
    if (v.pedido === 'outro' && !v.pedidoOutro) w.push({ level: 'warning', field: 'pedidoOutro', message: l('Descreva o pedido.', 'Describe the request.') });
    if (v.pedido === 'reembolso' && money(v.valorReembolso) != null && money(v.valorPago) != null && money(v.valorReembolso)! > money(v.valorPago)!) {
      w.push({ level: 'warning', field: 'valorReembolso', message: l('O valor a reembolsar é superior ao valor pago.', 'The refund is higher than the amount paid.') });
    }
    if (v.autorTipo === 'empresa' && ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'warning', field: 'autorTipo', message: l('O perfil activo não é de uma empresa. Escolha «Uma pessoa».', 'The active profile is not a company. Choose “An individual”.') });
    }
    if (v.autorTipo !== 'empresa' && !v.reclamanteTelefone && !v.reclamanteEmail) {
      w.push({ level: 'info', field: 'reclamanteTelefone', message: l('Indique um telefone ou email para a resposta.', 'Give a phone or email for the reply.') });
    }
    if (!v.prazoResposta) {
      w.push({ level: 'info', field: 'prazoResposta', message: l('Pode indicar um prazo para resposta.', 'You may set a reply deadline.') });
    }
    return w;
  },

  personName: (v) => v.entidade,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(v, ctx.profile);
    const nos = empresa; // first person plural for a company
    const verb = (sg: string, pl: string) => (nos ? pl : sg);
    const factos = splitLines(v.factos);
    const anexos = lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean);
    const prazo = Number(v.prazoResposta) > 0 ? Math.round(Number(v.prazoResposta)) : 0;
    const factura = v.numeroFactura ? `factura n.º ${v.numeroFactura}` : 'factura';

    const blocks: Block[] = [];
    // Sender block: a company prints its letterhead; an individual identifies here.
    if (!empresa) {
      const lines = [
        `**${v.reclamanteNome || BLANK}**`,
        v.reclamanteMorada || '',
        [v.reclamanteTelefone ? `Tel.: ${v.reclamanteTelefone}` : '', v.reclamanteEmail ? `Email: ${v.reclamanteEmail}` : ''].filter(Boolean).join(' · '),
      ].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' });
    }
    blocks.push(
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        lines: [v.entidade || BLANK, v.entidadeDepartamento ? `A/C: ${v.entidadeDepartamento}` : '', v.entidadeMorada || ''].filter(Boolean),
      },
      {
        type: 'subject',
        text: `Reclamação${v.produto ? ` — ${v.produto}` : ''}${v.numeroFactura ? ` — Factura n.º ${v.numeroFactura}` : ''}`,
      },
      { type: 'salutation', text: 'Exmos. Senhores,' },
    );

    const dados = [
      { label: 'N.º de cliente', value: v.numeroCliente || '' },
      { label: 'N.º de contrato / conta', value: v.numeroContrato || '' },
      { label: 'Factura / recibo n.º', value: v.numeroFactura || '' },
      { label: 'Produto ou serviço', value: v.produto || '' },
      { label: 'Data', value: v.dataCompra ? dateLong(v.dataCompra) : '' },
      { label: 'Valor', value: money(v.valorPago) != null ? moneyText(v.valorPago) : '' },
    ].filter((it) => it.value);

    blocks.push({
      type: 'paragraph',
      id: 'abertura',
      text: empresa
        ? `Na qualidade de cliente de V. Ex.as, a **${profileDisplayName(ctx.profile)}** apresenta a seguinte reclamação${dados.length ? ', relativa ao produto ou serviço abaixo identificado' : ''}.`
        : `Na qualidade de cliente de V. Ex.as, apresento a seguinte reclamação${dados.length ? ', relativa ao produto ou serviço abaixo identificado' : ''}.`,
      en: `As your customer, ${nos ? 'we submit' : 'I submit'} the following complaint about the product or service identified below.`,
    });
    if (dados.length) blocks.push({ type: 'keyValue', columns: 2, items: dados });
    blocks.push(
      { type: 'paragraph', id: 'factosIntro', text: 'Os factos são os seguintes:', en: 'The facts are as follows:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK] },
    );

    let pedido: string;
    let pedidoEn: string;
    switch (v.pedido) {
      case 'substituicao':
        pedido = `a substituição do produto por outro idêntico, novo e em perfeitas condições, sem encargos para ${verb('mim', 'nós')}`;
        pedidoEn = 'replacement of the product with an identical new one, at no cost';
        break;
      case 'reembolso':
        pedido = `o reembolso ${money(v.valorReembolso) != null ? `de **${moneyText(v.valorReembolso)}**` : 'da quantia paga'}, pela mesma via em que foi efectuado o pagamento ou por transferência para conta a indicar`;
        pedidoEn = 'a refund of the amount paid';
        break;
      case 'correccao':
        pedido = `a correcção da ${factura}, com a anulação dos valores cobrados indevidamente e a emissão do respectivo documento rectificativo`;
        pedidoEn = 'correction of the invoice, cancelling the amounts wrongly charged and issuing a corrected document';
        break;
      case 'outro':
        pedido = v.pedidoOutro ? lowerFirst(String(v.pedidoOutro)).replace(/\.$/, '') : BLANK;
        pedidoEn = 'the remedy described';
        break;
      default:
        pedido = `a reparação do produto, sem encargos para ${verb('mim', 'nós')}, ou, não sendo possível, a sua substituição`;
        pedidoEn = 'repair of the product at no cost or, if not possible, its replacement';
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Face ao exposto, ${verb('solicito', 'solicitamos')} ${pedido}.`,
      en: `${nos ? 'We' : 'I'} therefore request ${pedidoEn}.`,
    });
    blocks.push({
      type: 'paragraph',
      id: 'prazo',
      text: prazo
        ? `${verb('Agradeço', 'Agradecemos')} resposta por escrito no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'} a contar da recepção desta carta${v.reclamanteEmail ? `, de preferência para o email ${v.reclamanteEmail}` : ''}.`
        : `${verb('Agradeço', 'Agradecemos')} resposta por escrito com a maior brevidade${v.reclamanteEmail ? `, de preferência para o email ${v.reclamanteEmail}` : ''}.`,
      en: prazo
        ? `Please reply in writing within ${prazo} day(s) of receiving this letter.`
        : 'Please reply in writing as soon as possible.',
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });

    let sig: SignatureColumn;
    if (empresa) {
      const rep = employerRep(ctx);
      sig = { role: rep.cargo || profileDisplayName(ctx.profile) || 'A Empresa', name: rep.nome || undefined, image: 'both' };
    } else {
      sig = { role: g(v.reclamanteGenero, 'O Cliente', 'A Cliente'), name: v.reclamanteNome || undefined };
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [sig] },
    );
    if (v.recibo) {
      blocks.push({
        type: 'acknowledgement',
        text: 'Recebido em ___/___/______, às ____:____.',
        signer: 'Carimbo e assinatura de quem recebe',
      });
    }
    return blocks;
  },
});
