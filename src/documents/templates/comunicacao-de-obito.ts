// Comunicação de óbito e pedido de informação: a family member tells a bank,
// employer, insurer or the INSS that someone has died, asks for accounts to be
// protected and for information on what is owed and which documents are
// needed. Funds are released only to heirs proven by a declaration of heirs.

import { defineTemplate, type Block, type DefaultsContext, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, lineItems, localField, workerFields } from './_shared';
import { fromPersonalProfile } from './_pessoal-rh';
import { itensLista, semPonto, str } from './_familia';

const ENTIDADES = [
  { value: 'banco', label: l('Banco', 'Bank') },
  { value: 'empregador', label: l('Empregador do falecido', 'Employer of the deceased') },
  { value: 'seguradora', label: l('Seguradora', 'Insurer') },
  { value: 'inss', label: l('INSS (segurança social)', 'INSS (social security)') },
  { value: 'outro', label: l('Outra entidade', 'Other body') },
];

const PEDIDOS: Record<string, { name: string; pt: string; en: string }[]> = {
  banco: [
    { name: 'pBloquear', pt: 'o bloqueio dos cartões, dos acessos digitais e das ordens de pagamento associados às contas do falecido, para protecção do património da herança', en: 'block cards, online access and standing orders' },
    { name: 'pInformar', pt: 'informação sobre as contas, depósitos, créditos e outros produtos de que o falecido era titular ou co-titular, e os respectivos saldos à data do óbito', en: 'information on accounts, deposits, loans and balances' },
    { name: 'pDocumentos', pt: 'a indicação dos documentos necessários para a habilitação dos herdeiros junto desse banco e para a movimentação ou encerramento das contas', en: 'the documents needed for the heirs and to close the accounts' },
    { name: 'pSeguro', pt: 'informação sobre seguros de vida ou de crédito associados aos créditos do falecido', en: 'information on life or credit insurance' },
  ],
  empregador: [
    { name: 'pInformar', pt: 'o apuramento e pagamento, aos herdeiros, da remuneração, das férias e dos demais créditos laborais em dívida ao falecido', en: 'calculation and payment of wages and other sums owed' },
    { name: 'pSeguro', pt: 'informação sobre o subsídio de funeral, o seguro de vida ou de acidentes de trabalho e os benefícios de que os familiares possam beneficiar', en: 'information on funeral allowance and insurance' },
    { name: 'pDocumentos', pt: 'a declaração de tempo de serviço e de remunerações, necessária para requerer a pensão de sobrevivência ao INSS', en: 'service and pay statement for the survivor’s pension' },
  ],
  seguradora: [
    { name: 'pInformar', pt: 'a participação do sinistro ao abrigo da(s) apólice(s) indicada(s) e a informação sobre os beneficiários designados', en: 'open the claim and confirm beneficiaries' },
    { name: 'pDocumentos', pt: 'a indicação dos documentos necessários para o pagamento do capital seguro', en: 'the documents needed for payment' },
  ],
  inss: [
    { name: 'pInformar', pt: 'informação sobre o subsídio por morte, o subsídio de funeral e a pensão de sobrevivência a que os familiares tenham direito', en: 'information on death and funeral allowances and survivor’s pension' },
    { name: 'pDocumentos', pt: 'a indicação dos documentos e formulários necessários para os requerer', en: 'the forms and documents needed' },
  ],
  outro: [
    { name: 'pInformar', pt: 'informação sobre os contratos, créditos ou débitos que o falecido tinha com essa entidade', en: 'information on contracts and balances' },
    { name: 'pDocumentos', pt: 'a indicação dos documentos necessários para regularizar a situação', en: 'the documents needed' },
  ],
};

export default defineTemplate({
  id: 'comunicacao-de-obito',
  family: 'carta',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'requerente', title: l('Quem comunica', 'Sender'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'entidade', title: l('Destinatário', 'Recipient') },
    { id: 'falecido', title: l('Falecido', 'Deceased') },
    { id: 'pedidos', title: l('Pedidos e anexos', 'Requests and enclosures') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da carta', 'Date of the letter')),
    ...fromPersonalProfile(workerFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone'], 'requerente', 'requerente'), 'requerente').map((f) =>
      f.name === 'requerenteTelefone' ? { ...f, default: (c: DefaultsContext) => c.profile?.telefones || '' } : f,
    ),
    {
      name: 'qualidade',
      type: 'select',
      section: 'requerente',
      width: 'half',
      label: l('Relação com o falecido', 'Relationship to the deceased'),
      options: [
        { value: 'cônjuge', label: l('Cônjuge', 'Spouse') },
        { value: 'companheiro', label: l('Companheiro(a) da união de facto', 'De facto partner') },
        { value: 'filho', label: l('Filho(a)', 'Child') },
        { value: 'pai', label: l('Pai ou mãe', 'Parent') },
        { value: 'irmão', label: l('Irmão ou irmã', 'Sibling') },
        { value: 'outro', label: l('Outro familiar', 'Other relative') },
      ],
      default: 'filho',
    },
    { name: 'cabecaCasal', type: 'toggle', section: 'requerente', label: l('Sou o cabeça-de-casal (administro a herança)', 'I am the estate administrator') },
    { name: 'entidadeTipo', type: 'select', section: 'entidade', width: 'half', label: l('Tipo de entidade', 'Kind of body'), options: ENTIDADES, default: 'banco' },
    { name: 'entidade', type: 'text', section: 'entidade', required: true, label: l('Nome da entidade', 'Name of the body'), placeholder: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. bank name') },
    { name: 'entidadeDepartamento', type: 'text', section: 'entidade', label: l('Balcão ou departamento (opcional)', 'Branch or department (optional)'), placeholder: l('Ex.: Balcão da Avenida 24 de Julho', 'E.g. branch') },
    { name: 'entidadeMorada', type: 'text', section: 'entidade', label: l('Morada', 'Address') },
    { name: 'falecidoNome', type: 'text', section: 'falecido', required: true, label: l('Nome completo', 'Full name') },
    { name: 'falecidoGenero', type: 'radio', section: 'falecido', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M' },
    { name: 'falecidoDoc', type: 'text', section: 'falecido', width: 'half', label: l('BI n.º', 'ID no.') },
    { name: 'falecidoNuit', type: 'text', section: 'falecido', width: 'half', label: l('NUIT', 'NUIT') },
    { name: 'falecidoData', type: 'date', section: 'falecido', width: 'half', required: true, label: l('Data do óbito', 'Date of death') },
    { name: 'falecidoLocal', type: 'text', section: 'falecido', width: 'half', label: l('Local do óbito', 'Place of death') },
    { name: 'certidao', type: 'text', section: 'falecido', label: l('Certidão de óbito (n.º e conservatória)', 'Death certificate (no. and registry)'), placeholder: l('Ex.: assento n.º 456/2026 da Conservatória do Registo Civil de Maputo', 'E.g. entry no. …') },
    {
      name: 'referencias',
      type: 'lines',
      section: 'falecido',
      label: l('Contas, contratos, apólices ou n.º de beneficiário', 'Accounts, contracts, policies or beneficiary no.'),
      addLabel: l('Adicionar referência', 'Add reference'),
      columns: [{ name: 'ref', type: 'text', label: l('Referência', 'Reference'), placeholder: l('Ex.: conta à ordem n.º 12345678; n.º de trabalhador 0456', 'E.g. account no.; staff no.') }],
      default: [],
    },
    { name: 'pBloquear', type: 'toggle', section: 'pedidos', default: true, label: l('Pedir bloqueio de cartões e acessos (banco)', 'Ask to block cards and access (bank)'), showIf: (v) => v.entidadeTipo === 'banco' },
    { name: 'pInformar', type: 'toggle', section: 'pedidos', default: true, label: l('Pedir informação sobre saldos, créditos ou benefícios', 'Ask for balances, sums owed or benefits') },
    { name: 'pDocumentos', type: 'toggle', section: 'pedidos', default: true, label: l('Pedir a lista de documentos necessários', 'Ask for the list of documents required') },
    { name: 'pSeguro', type: 'toggle', section: 'pedidos', default: true, label: l('Perguntar por seguros e subsídios', 'Ask about insurance and allowances'), showIf: (v) => v.entidadeTipo === 'banco' || v.entidadeTipo === 'empregador' },
    {
      name: 'anexos',
      type: 'textarea',
      section: 'pedidos',
      rows: 3,
      label: l('Anexos', 'Enclosures'),
      help: l('Um por linha.', 'One per line.'),
      default: 'Cópia da certidão de óbito\nCópia do meu documento de identificação\nDocumento que prova o parentesco (certidão de nascimento ou de casamento)',
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.falecidoNome)) w.push({ level: 'error', field: 'falecidoNome', message: l('Indique o nome do falecido.', 'Enter the name of the deceased.') });
    if (!str(v.entidade)) w.push({ level: 'error', field: 'entidade', message: l('Indique a entidade.', 'Enter the recipient.') });
    w.push({
      level: 'info',
      message: l(
        `Esta carta não dá direito a levantar dinheiro nem a receber bens do falecido. Bancos e seguradoras só pagam aos herdeiros habilitados por escritura de habilitação de herdeiros no notário ou por decisão judicial (${cite('famHabilitacaoHerdeiros')}). Uma declaração assinada pelos familiares não a substitui.`,
        'This letter does not entitle anyone to withdraw money or receive assets. Banks and insurers pay only heirs proven by a notarial declaration of heirs or a court decision. A family declaration does not replace it.',
      ),
    });
    w.push({ level: 'info', message: l(`O óbito deve estar registado na Conservatória do Registo Civil (${cite('registoObito')}) para obter a certidão.`, 'The death must be registered to obtain the certificate.') });
    return w;
  },

  personName: (v) => v.falecidoNome || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fF = isF(v.falecidoGenero);
    const fR = isF(v.requerenteGenero);
    const tipo = PEDIDOS[v.entidadeTipo] ? v.entidadeTipo : 'outro';
    const pedidos = PEDIDOS[tipo].filter((p) => v[p.name]);
    const refs = lineItems(v.referencias).map((r) => str(r.ref)).filter(Boolean);
    const anexos = (str(v.anexos) ? str(v.anexos).split('\n') : []).map((s) => s.trim()).filter(Boolean);
    const QUAL: Record<string, string> = {
      cônjuge: fR ? 'viúva' : 'viúvo',
      companheiro: fR ? 'companheira' : 'companheiro',
      filho: fR ? 'filha' : 'filho',
      pai: fR ? 'mãe' : 'pai',
      irmão: fR ? 'irmã' : 'irmão',
      outro: 'familiar',
    };
    const qualidade = `${QUAL[v.qualidade] ?? 'familiar'} ${fF ? 'da falecida' : 'do falecido'}${v.cabecaCasal ? `, na qualidade de cabeça-de-casal da herança` : ''}`;
    const docNome = str(v.requerenteDocTipo) === 'Passaporte' ? 'Passaporte' : str(v.requerenteDocTipo) === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade';

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: [`**${str(v.requerenteNome) || BLANK}**`, semPonto(v.requerenteMorada), str(v.requerenteTelefone) ? `Tel.: ${str(v.requerenteTelefone)}` : ''].filter(Boolean).join('\n'), align: 'left', size: 'small', editable: false },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', lines: [str(v.entidade) || BLANK, str(v.entidadeDepartamento), semPonto(v.entidadeMorada)].filter(Boolean) },
      { type: 'subject', text: `Comunicação de óbito de ${str(v.falecidoNome) || BLANK}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `${str(v.requerenteNome) || BLANK}, ${fR ? 'portadora' : 'portador'} do ${docNome} n.º ${str(v.requerenteDocNumero) || BLANK}, ${qualidade}, comunica a V. Ex.as que ${fF ? 'a Senhora' : 'o Senhor'} **${str(v.falecidoNome) || BLANK}**${str(v.falecidoDoc) ? `, ${fF ? 'portadora' : 'portador'} do Bilhete de Identidade n.º ${str(v.falecidoDoc)}` : ''}${str(v.falecidoNuit) ? `, NUIT ${str(v.falecidoNuit)}` : ''}, faleceu em ${dateLong(v.falecidoData)}${str(v.falecidoLocal) ? `, em ${semPonto(v.falecidoLocal)}` : ''}${str(v.certidao) ? `, conforme ${semPonto(v.certidao).replace(/^conforme\s+/i, '')}` : ''}.`,
        en: 'The sender, a relative of the deceased, notifies you of the death stated.',
      },
    ];
    if (refs.length) {
      blocks.push(
        { type: 'paragraph', id: 'referencias', text: `${fF ? 'A falecida' : 'O falecido'} tinha com V. Ex.as as seguintes relações, entre outras de que possa não ter conhecimento:`, en: 'The deceased had the following accounts or contracts with you:' },
        { type: 'list', style: 'bullet', items: itensLista(refs) },
      );
    }
    if (pedidos.length) {
      blocks.push(
        { type: 'paragraph', id: 'pedidos', text: 'Assim, solicito a V. Ex.as:', en: 'I therefore ask for:' },
        { type: 'list', style: 'alpha', items: itensLista(pedidos.map((p) => p.pt)) },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'herdeiros',
        text: 'Mais informo que os herdeiros irão proceder à habilitação de herdeiros e que nenhum pagamento ou entrega de bens deve ser feito a terceiros sem a apresentação dessa habilitação.',
        en: 'The heirs will obtain the declaration of heirs; no payment or release of assets should be made without it.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [{ role: fR ? 'A Requerente' : 'O Requerente', name: str(v.requerenteNome) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined }] },
    );
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });
    blocks.push({ type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: 'Carimbo e assinatura' });
    return blocks;
  },
});
