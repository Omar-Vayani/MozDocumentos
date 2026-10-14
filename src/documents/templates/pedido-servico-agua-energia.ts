import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, splitLines } from './_shared';
import { anexosBlock, anexosField, autorFields, autorSignature, autorWarnings, endDot, envioBlock, envioField, isEmpresa, opt, reciboBlock, reciboField, senderBlock, str } from './_cidadao';

const FORNECEDORES: Record<string, string> = {
  edm: 'Electricidade de Moçambique, E.P.',
  adrm: 'Águas da Região de Maputo, S.A.',
  fipag: 'Fundo de Investimento e Património do Abastecimento de Água (FIPAG)',
};

type Pedido = { value: string; pt: string; en: string; assunto: string; agua: boolean; energia: boolean; docs: string };
const PEDIDOS: Pedido[] = [
  { value: 'ligacao', pt: 'Nova ligação', en: 'New connection', assunto: 'Pedido de nova ligação', agua: true, energia: true, docs: 'documento de identificação, NUIT, título do DUAT ou contrato de arrendamento com autorização do proprietário, croqui de localização e, para energia, certificado da instalação eléctrica interior' },
  { value: 'titular', pt: 'Mudança de titular do contrato', en: 'Change of account holder', assunto: 'Pedido de mudança de titularidade do contrato', agua: true, energia: true, docs: 'documento de identificação do novo titular, documento que prove o direito ao imóvel (compra, arrendamento, herança), última factura paga e leitura do contador' },
  { value: 'potencia', pt: 'Aumento de potência', en: 'Higher power supply', assunto: 'Pedido de aumento de potência', agua: false, energia: true, docs: 'documento de identificação, última factura e, se exigido, projecto ou certificado da instalação' },
  { value: 'aferição', pt: 'Verificação do contador', en: 'Meter test', assunto: 'Pedido de verificação do contador', agua: true, energia: true, docs: 'últimas facturas e leitura actual do contador' },
  { value: 'mudancaContador', pt: 'Mudança do local do contador ou do ramal', en: 'Moving the meter or service line', assunto: 'Pedido de mudança do local do contador', agua: true, energia: true, docs: 'croqui com o local pretendido' },
  { value: 'prepago', pt: 'Passagem para contador pré-pago (Credelec)', en: 'Switch to a prepaid meter', assunto: 'Pedido de passagem para contador pré-pago', agua: false, energia: true, docs: 'documento de identificação e última factura paga' },
  { value: 'suspensao', pt: 'Suspensão temporária do fornecimento', en: 'Temporary suspension of supply', assunto: 'Pedido de suspensão temporária do fornecimento', agua: true, energia: true, docs: 'documento de identificação e última factura paga' },
  { value: 'rescisao', pt: 'Rescisão do contrato (fim do fornecimento)', en: 'End of the supply contract', assunto: 'Pedido de rescisão do contrato de fornecimento', agua: true, energia: true, docs: 'documento de identificação, última factura paga e leitura final do contador' },
];
const pedidoOf = (v: Values) => PEDIDOS.find((p) => p.value === v.pedido) ?? PEDIDOS[0];

export default defineTemplate({
  id: 'pedido-servico-agua-energia',
  sections: [
    { id: 'autor', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'destinatario', title: l('Empresa', 'Company') },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'servico', type: 'radio', section: 'destinatario', label: l('Serviço', 'Service'), options: [opt('energia', 'Energia eléctrica', 'Electricity'), opt('agua', 'Água', 'Water')], default: 'energia' },
    {
      name: 'fornecedor',
      type: 'select',
      section: 'destinatario',
      label: l('Empresa', 'Company'),
      options: [opt('edm', 'EDM', 'EDM'), opt('adrm', 'Águas da Região de Maputo', 'Águas da Região de Maputo'), opt('fipag', 'FIPAG', 'FIPAG'), opt('outro', 'Outra', 'Other')],
      default: 'edm',
    },
    { name: 'fornecedorOutro', type: 'text', section: 'destinatario', label: l('Nome da empresa', 'Company name'), showIf: (v) => v.fornecedor === 'outro' },
    { name: 'fornecedorAc', type: 'text', section: 'destinatario', label: l('Área de serviço ou loja (opcional)', 'Service area or shop (optional)') },
    { name: 'pedido', type: 'select', section: 'pedido', required: true, label: l('O que pede', 'Request'), options: PEDIDOS.map((p) => opt(p.value, p.pt, p.en)), default: 'ligacao' },
    { name: 'localConsumo', type: 'text', section: 'pedido', required: true, label: l('Local de consumo (imóvel)', 'Premises'), placeholder: l('Ex.: Talhão n.º 1187, Quarteirão 42, Magoanine C, Maputo', 'E.g. plot and street') },
    { name: 'numeroCliente', type: 'text', section: 'pedido', width: 'half', label: l('N.º de cliente / contrato', 'Customer / contract no.'), showIf: (v) => v.pedido !== 'ligacao' },
    { name: 'numeroContador', type: 'text', section: 'pedido', width: 'half', label: l('N.º do contador', 'Meter no.'), showIf: (v) => v.pedido !== 'ligacao' },
    { name: 'uso', type: 'select', section: 'pedido', width: 'half', label: l('Uso', 'Use'), options: [opt('doméstico', 'Doméstico', 'Domestic'), opt('comercial', 'Comercial', 'Commercial'), opt('industrial', 'Industrial', 'Industrial'), opt('agrícola', 'Agrícola', 'Agricultural')], default: 'doméstico', showIf: (v) => v.pedido === 'ligacao' || v.pedido === 'titular' },
    { name: 'titularAnterior', type: 'text', section: 'pedido', label: l('Titular anterior', 'Previous holder'), showIf: (v) => v.pedido === 'titular' },
    { name: 'motivoTitular', type: 'select', section: 'pedido', width: 'half', label: l('Porquê', 'Why'), options: [opt('compra', 'Comprei o imóvel', 'I bought the property'), opt('arrendamento', 'Arrendei o imóvel', 'I rent the property'), opt('heranca', 'Herança', 'Inheritance')], default: 'compra', showIf: (v) => v.pedido === 'titular' },
    { name: 'potencia', type: 'text', section: 'pedido', width: 'half', label: l('Potência pretendida', 'Power required'), placeholder: l('Ex.: 13,8 kVA trifásica', 'E.g. 13.8 kVA three-phase'), showIf: (v) => v.pedido === 'potencia' || (v.pedido === 'ligacao' && v.servico === 'energia') },
    { name: 'leitura', type: 'text', section: 'pedido', width: 'half', label: l('Leitura actual do contador', 'Current meter reading'), showIf: (v) => ['titular', 'aferição', 'suspensao', 'rescisao'].includes(String(v.pedido)) },
    { name: 'dataEfeito', type: 'date', section: 'pedido', width: 'half', label: l('A partir de', 'From'), showIf: (v) => ['titular', 'suspensao', 'rescisao'].includes(String(v.pedido)) },
    { name: 'dataFim', type: 'date', section: 'pedido', width: 'half', label: l('Até (suspensão)', 'Until (suspension)'), showIf: (v) => v.pedido === 'suspensao' },
    { name: 'observacoes', type: 'textarea', section: 'pedido', rows: 3, label: l('Observações (opcional)', 'Notes (optional)'), help: l('Ex.: motivo da verificação, acesso ao contador, horário de visita.', 'E.g. reason, access to the meter, visiting hours.') },
    anexosField('pedido'),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const p = pedidoOf(v);
    const w: Warning[] = autorWarnings(ctx, { doc: true, contacto: true });
    if (v.servico === 'agua' && !p.agua) w.push({ level: 'warning', field: 'pedido', message: l('Este pedido é próprio da energia eléctrica.', 'This request is for electricity only.') });
    if (v.servico === 'agua' && v.fornecedor === 'edm') w.push({ level: 'warning', field: 'fornecedor', message: l('Escolha o operador de água.', 'Choose the water operator.') });
    if (v.servico === 'energia' && (v.fornecedor === 'adrm' || v.fornecedor === 'fipag')) w.push({ level: 'warning', field: 'fornecedor', message: l('Escolha o distribuidor de energia.', 'Choose the electricity distributor.') });
    w.push({ level: 'info', field: 'anexos', message: l(`As empresas usam, em regra, impresso próprio e pedem: ${p.docs}. Este pedido acompanha o processo ou serve onde é aceite pedido escrito.`, 'Utilities usually have their own form; this letter goes with it or serves where a written request is accepted.') });
    if (v.pedido === 'rescisao') w.push({ level: 'info', field: 'leitura', message: l('Peça a leitura final no dia da saída e guarde a factura final paga: o contrato fica em seu nome até à rescisão.', 'Ask for a final reading and keep the final bill: the contract stays in your name until it ends.') });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = pedidoOf(v);
    const empresaNome = v.fornecedor === 'outro' ? str(v.fornecedorOutro) || BLANK : FORNECEDORES[String(v.fornecedor)] ?? BLANK;
    const servico = v.servico === 'agua' ? 'abastecimento de água' : 'fornecimento de energia eléctrica';
    const local = str(v.localConsumo) || BLANK;
    const conta = [str(v.numeroCliente) ? `contrato/cliente n.º ${str(v.numeroCliente)}` : '', str(v.numeroContador) ? `contador n.º ${str(v.numeroContador)}` : ''].filter(Boolean).join(', ');
    const leitura = str(v.leitura) ? `, sendo a leitura actual do contador de ${str(v.leitura)}` : '';
    const desde = v.dataEfeito ? ` a partir de ${dateLong(v.dataEfeito)}` : '';
    let texto: string;
    switch (p.value) {
      case 'titular':
        texto = `a mudança da titularidade do contrato de ${servico} do imóvel situado em ${local}${conta ? ` (${conta})` : ''}, actualmente em nome de ${str(v.titularAnterior) || BLANK}, para o nome ${isEmpresa(ctx) ? 'da requerente' : v.autorGenero === 'F' ? 'da requerente' : 'do requerente'}${desde}, por ${v.motivoTitular === 'arrendamento' ? 'ter arrendado o imóvel' : v.motivoTitular === 'heranca' ? 'sucessão hereditária' : 'ter adquirido o imóvel'}${leitura}`;
        break;
      case 'potencia':
        texto = `o aumento da potência contratada da instalação situada em ${local}${conta ? ` (${conta})` : ''}${str(v.potencia) ? ` para ${str(v.potencia)}` : ''}`;
        break;
      case 'aferição':
        texto = `a verificação (aferição) do contador da instalação situada em ${local}${conta ? ` (${conta})` : ''}, cujo funcionamento suscita dúvidas${leitura}, pedindo que a verificação seja feita ${isEmpresa(ctx) ? 'na presença de um representante da requerente' : 'na minha presença'} ou com aviso prévio da data`;
        break;
      case 'mudancaContador':
        texto = `a mudança do local do contador${v.servico === 'agua' ? ' e do ramal' : ''} da instalação situada em ${local}${conta ? ` (${conta})` : ''}, para o local indicado no croqui junto`;
        break;
      case 'prepago':
        texto = `a substituição do contador convencional por contador pré-pago (Credelec) na instalação situada em ${local}${conta ? ` (${conta})` : ''}`;
        break;
      case 'suspensao':
        texto = `a suspensão temporária do ${servico} no imóvel situado em ${local}${conta ? ` (${conta})` : ''}${desde}${v.dataFim ? ` até ${dateLong(v.dataFim)}` : ''}${leitura}, por o imóvel ficar desocupado nesse período`;
        break;
      case 'rescisao':
        texto = `a rescisão do contrato de ${servico} do imóvel situado em ${local}${conta ? ` (${conta})` : ''}${desde}, com a leitura final do contador${str(v.leitura) ? ` (leitura actual: ${str(v.leitura)})` : ''}, a emissão da factura final e a devolução da caução, se houver`;
        break;
      default:
        texto = `a ligação ${v.servico === 'agua' ? 'à rede de abastecimento de água' : 'à rede de energia eléctrica'} e a celebração do respectivo contrato de fornecimento, para uso ${str(v.uso) || 'doméstico'}, no imóvel situado em ${local}${v.servico !== 'agua' && str(v.potencia) ? `, com a potência de ${str(v.potencia)}` : ''}`;
    }
    const obs = str(v.observacoes);

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [empresaNome, str(v.fornecedorAc) ? `A/C: ${str(v.fornecedorAc)}` : ''].filter(Boolean) },
      { type: 'subject', text: p.assunto },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${isEmpresa(ctx) ? `A **${profileDisplayName(ctx.profile)}** solicita` : 'Solicito'} ${texto}.`,
        en: 'I request the service stated for the premises identified.',
      },
    ];
    if (obs) blocks.push({ type: 'paragraph', id: 'observacoes', text: splitLines(obs).map((x) => endDot(x.charAt(0).toUpperCase() + x.slice(1))).join(' '), en: 'Notes.' });
    blocks.push({
      type: 'paragraph',
      id: 'contacto',
      text: `Para a visita técnica e a marcação, ${isEmpresa(ctx) ? 'podem contactar-nos' : 'podem contactar-me'}${str(v.autorTelefone) ? ` pelo telefone ${str(v.autorTelefone)}` : ''}${str(v.autorEmail) ? `${str(v.autorTelefone) ? ' ou' : ''} pelo email ${str(v.autorEmail)}` : ''}${!str(v.autorTelefone) && !str(v.autorEmail) ? ` pelo telefone ${BLANK}` : ''}.`,
      en: 'Contact details for the technical visit.',
    });
    blocks.push(
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Requerente', 'A Requerente')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
