import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  autorDesc,
  autorFields,
  autorSignature,
  autorWarnings,
  cleanEntidade,
  despachoBlock,
  despachoField,
  lowerFirst,
  opt,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

type Tipo = { value: string; pt: string; en: string; entidade: string; texto: string; registo: boolean; ref: [string, string]; refTxt?: string };

const TIPOS: Tipo[] = [
  { value: 'nascimento', pt: 'Certidão de nascimento', en: 'Birth certificate', entidade: 'Conservador do Registo Civil de', texto: 'certidão de nascimento', registo: true, ref: ['Assento n.º / ano', 'Entry no. / year'], refTxt: 'assento n.º' },
  { value: 'casamento', pt: 'Certidão de casamento', en: 'Marriage certificate', entidade: 'Conservador do Registo Civil de', texto: 'certidão de casamento', registo: true, ref: ['Assento n.º / ano', 'Entry no. / year'], refTxt: 'assento n.º' },
  { value: 'obito', pt: 'Certidão de óbito', en: 'Death certificate', entidade: 'Conservador do Registo Civil de', texto: 'certidão de óbito', registo: true, ref: ['Assento n.º / ano', 'Entry no. / year'], refTxt: 'assento n.º' },
  { value: 'predial', pt: 'Certidão do registo predial (imóvel)', en: 'Land registry certificate', entidade: 'Conservador do Registo Predial de', texto: 'certidão de teor da descrição predial e das inscrições em vigor, incluindo ónus e encargos', registo: true, ref: ['Descrição predial n.º', 'Property description no.'], refTxt: 'descrição predial n.º' },
  { value: 'comercial', pt: 'Certidão do registo comercial (empresa)', en: 'Commercial registry certificate', entidade: 'Conservador do Registo das Entidades Legais de', texto: 'certidão de registo comercial, com todas as inscrições em vigor', registo: true, ref: ['NUEL / matrícula n.º', 'Company registration no.'], refTxt: 'NUEL' },
  { value: 'automovel', pt: 'Certidão do registo automóvel', en: 'Vehicle registry certificate', entidade: 'Conservador do Registo Automóvel de', texto: 'certidão do registo de propriedade e ónus da viatura', registo: true, ref: ['Matrícula da viatura', 'Number plate'], refTxt: 'matrícula' },
  { value: 'tribunal', pt: 'Certidão de um processo judicial', en: 'Court record certificate', entidade: 'Escrivão de Direito da … Secção do Tribunal Judicial de', texto: 'certidão das peças do processo', registo: false, ref: ['Processo n.º', 'Case no.'], refTxt: 'processo n.º' },
  { value: 'escolar', pt: 'Certidão de habilitações (escola)', en: 'School certificate', entidade: 'Director da Escola', texto: 'certidão de habilitações literárias, com as classificações obtidas', registo: false, ref: ['Ano lectivo / classe / turma', 'School year / grade'], refTxt: '' },
  { value: 'municipal', pt: 'Certidão municipal (não dívida, etc.)', en: 'Municipal certificate', entidade: 'Presidente do Conselho Municipal de', texto: 'certidão de que nada deve ao Município a título de impostos e taxas municipais', registo: false, ref: ['Contribuinte / processo n.º', 'Taxpayer / file no.'], refTxt: 'contribuinte n.º' },
  { value: 'outra', pt: 'Outra certidão', en: 'Other certificate', entidade: '', texto: '', registo: false, ref: ['Referência', 'Reference'], refTxt: 'ref.' },
];
const tipoOf = (v: Values) => TIPOS.find((t) => t.value === v.tipo) ?? TIPOS[0];
const civil = (v: Values) => ['nascimento', 'casamento', 'obito'].includes(String(v.tipo));

export default defineTemplate({
  id: 'pedido-de-certidao',
  official: (v) => (tipoOf(v).registo ? 'registo' : 'estado'),
  letterhead: false,
  sections: [
    { id: 'pedido', title: l('Certidão', 'Certificate') },
    { id: 'destinatario', title: l('A quem se pede', 'Addressee') },
    { id: 'autor', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'pedido', required: true, label: l('Que certidão', 'Which certificate'), options: TIPOS.map((t) => opt(t.value, t.pt, t.en)), default: 'nascimento' },
    { name: 'textoOutra', type: 'text', section: 'pedido', label: l('Certidão de quê', 'Certificate of what'), placeholder: l('Ex.: certidão de que o requerente frequentou o curso de …', 'E.g. certificate that …'), showIf: (v) => v.tipo === 'outra' },
    { name: 'registado', type: 'text', section: 'pedido', label: l('Nome da pessoa, empresa ou bem', 'Name of the person, company or asset'), placeholder: l('Ex.: Maria Fernanda Cossa', 'E.g. the person registered') },
    { name: 'filiacao', type: 'text', section: 'pedido', label: l('Filiação (pai e mãe)', 'Parents'), showIf: civil },
    { name: 'dataFacto', type: 'date', section: 'pedido', width: 'half', label: l('Data do nascimento, casamento ou óbito', 'Date of birth, marriage or death'), showIf: civil },
    { name: 'referencia', type: 'text', section: 'pedido', width: 'half', label: l('Número de registo / processo', 'Registration / case no.') },
    { name: 'pecas', type: 'text', section: 'pedido', label: l('Peças pedidas', 'Documents requested'), placeholder: l('Ex.: sentença de 12 de Maio de 2026, com nota de trânsito em julgado', 'E.g. the judgment with note of finality'), showIf: (v) => v.tipo === 'tribunal' },
    { name: 'modalidade', type: 'radio', section: 'pedido', label: l('Modalidade', 'Form'), options: [opt('narrativa', 'Narrativa (resumo)', 'Short form'), opt('integral', 'De cópia integral', 'Full copy')], default: 'narrativa', showIf: civil },
    { name: 'exemplares', type: 'number', section: 'pedido', width: 'half', min: 1, max: 10, default: 1, label: l('N.º de exemplares', 'Copies') },
    { name: 'finalidade', type: 'text', section: 'pedido', label: l('Finalidade', 'Purpose'), placeholder: l('Ex.: instruir processo de pensão; pedido de passaporte', 'E.g. pension claim; passport application') },
    { name: 'urgente', type: 'toggle', section: 'pedido', default: false, label: l('Pedir emissão urgente', 'Ask for urgent issue'), help: l('Normalmente implica emolumentos mais altos.', 'Usually costs more.') },
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 4), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo e serviço', 'Position and office'),
      help: l('Ex.: «Conservador do Registo Civil da Matola», «Conservador do Registo Predial de Maputo», «Escrivão de Direito da 3.ª Secção do Tribunal Judicial da Cidade de Maputo», «Director da Escola Secundária Francisco Manyanga».', 'E.g. the registrar, court clerk or school director.'),
      default: (c) => `Conservador do Registo Civil de ${c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'}`,
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'profissao', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'qualidade', type: 'text', section: 'autor', label: l('Relação com o registo (opcional)', 'Relationship to the record (optional)'), placeholder: l('Ex.: na qualidade de filho do falecido', 'E.g. as son of the deceased') },
    despachoField('documento'),
    localField('documento'),
    dateField('data'),
    reciboField('documento', false),
  ],

  warnings: (v, ctx) => {
    const t = tipoOf(v);
    const w: Warning[] = autorWarnings(ctx, { doc: true, morada: true });
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique o serviço a que pede a certidão.', 'State the office.') });
    if (t.entidade && str(v.entidade) && !str(v.entidade).toLowerCase().startsWith(t.entidade.split(/\s+/)[0].toLowerCase())) {
      w.push({ level: 'info', field: 'entidade', message: l(`Para esta certidão, o destinatário costuma ser: «${t.entidade} …».`, `For this certificate the addressee is usually: “${t.entidade} …”.`) });
    }
    w.push({ level: 'info', field: 'tipo', message: l(`Qualquer pessoa pode pedir certidões dos registos públicos, pagando os emolumentos; algumas certidões do registo civil só se passam ao próprio, à família ou a quem prove interesse (${cite('cidCertidaoPublicidade')}). Muitas conservatórias têm impresso de requisição; este requerimento serve onde é aceite pedido escrito.`, 'Anyone may ask for registry certificates, paying the fees; some civil registry certificates are restricted. Many registries have a request form.') });
    if (!str(v.referencia) && !str(v.registado)) w.push({ level: 'warning', field: 'registado', message: l('Identifique o registo: nome da pessoa ou do bem e, se souber, o número.', 'Identify the record: the name and, if known, the number.') });
    return w;
  },

  personName: (v) => v.registado || v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = tipoOf(v);
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const n = Number(v.exemplares) > 1 ? Math.round(Number(v.exemplares)) : 1;
    const tipoTxt = t.value === 'outra' ? lowerFirst(str(v.textoOutra).replace(/\.$/, '')) || BLANK : t.texto;
    const modalidade = civil(v) ? (v.modalidade === 'integral' ? ' de cópia integral' : ' narrativa') : '';
    const objecto = [
      str(v.registado) ? `${t.registo ? 'relativa ao registo de' : 'em nome de'} **${str(v.registado)}**` : '',
      civil(v) && str(v.filiacao) ? `filiação: ${str(v.filiacao)}` : '',
      civil(v) && v.dataFacto ? `com data de ${dateLong(v.dataFacto)}` : '',
      str(v.referencia) ? `${t.refTxt ? `${t.refTxt} ` : ''}${str(v.referencia)}` : '',
    ].filter(Boolean).join(', ');

    const pedido = `${n > 1 ? `${n} exemplares de ` : ''}${civil(v) ? tipoTxt.replace(/^certidão/, `certidão${modalidade}`) : tipoTxt}${objecto ? `, ${objecto}` : ''}${t.value === 'tribunal' && str(v.pecas) ? `: ${lowerFirst(str(v.pecas).replace(/\.$/, ''))}` : ''}`;

    const blocks: Block[] = [
      despachoBlock(v),
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `Pedido de ${t.value === 'outra' ? 'certidão' : t.pt.toLowerCase()}` },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${autorDesc(ctx, { upper: true, contactos: true })}${str(v.qualidade) ? `, ${lowerFirst(str(v.qualidade).replace(/\.$/, ''))}` : ''}, vem, mui respeitosamente, requerer a V. Ex.ª se digne mandar passar ${pedido}.`,
        en: 'The applicant respectfully requests the issue of the certificate described.',
      },
    ];
    if (str(v.finalidade) || v.urgente) {
      blocks.push({
        type: 'paragraph',
        id: 'finalidade',
        text: [str(v.finalidade) ? `A certidão destina-se a ${lowerFirst(str(v.finalidade).replace(/\.$/, ''))}.` : '', v.urgente ? 'Requer-se a sua emissão com carácter de urgência, pagando os emolumentos correspondentes.' : ''].filter(Boolean).join(' '),
        en: 'Purpose and urgency of the certificate.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Requerente', 'A Requerente', { roleEmpresa: 'A Requerente' })] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
