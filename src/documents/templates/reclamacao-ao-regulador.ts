import type { LegalRefId } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText, placeDate, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorDesc,
  autorFields,
  autorSignature,
  autorWarnings,
  endDot,
  envioBlock,
  envioField,
  eu,
  lowerFirst,
  opt,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

type Regulador = { value: string; pt: string; en: string; nome: string; sector: string; ref: LegalRefId };

const REGULADORES: Regulador[] = [
  { value: 'incm', pt: 'INCM — telefone, internet, televisão por cabo', en: 'INCM — phone, internet, cable TV', nome: 'Instituto Nacional das Comunicações de Moçambique (INCM)', sector: 'comunicações', ref: 'cidTelecomReclamacao' },
  { value: 'arene', pt: 'ARENE — energia eléctrica e combustíveis', en: 'ARENE — electricity and fuel', nome: 'Autoridade Reguladora de Energia (ARENE)', sector: 'energia', ref: 'cidEnergiaReclamacao' },
  { value: 'aura', pt: 'AURA — abastecimento de água', en: 'AURA — water supply', nome: 'Autoridade Reguladora de Águas, IP (AURA)', sector: 'águas', ref: 'cidAguaReclamacao' },
  { value: 'bm', pt: 'Banco de Moçambique — bancos, microfinanças, M-Pesa, e-Mola', en: 'Bank of Mozambique — banks, microfinance, mobile money', nome: 'Banco de Moçambique', sector: 'serviços financeiros', ref: 'cidFinanceiroReclamacao' },
  { value: 'issm', pt: 'ISSM — seguros', en: 'ISSM — insurance', nome: 'Instituto de Supervisão de Seguros de Moçambique (ISSM)', sector: 'seguros', ref: 'cidSegurosReclamacao' },
  { value: 'outro', pt: 'Outra entidade', en: 'Another body', nome: '', sector: '', ref: 'cidInaeQueixa' },
];
const regOf = (v: Values) => REGULADORES.find((r) => r.value === v.regulador) ?? REGULADORES[0];

export default defineTemplate({
  id: 'reclamacao-ao-regulador',
  official: 'estado',
  sections: [
    { id: 'destinatario', title: l('Entidade reguladora', 'Regulator') },
    { id: 'autor', title: l('Reclamante', 'Complainant'), personRole: 'outro' },
    { id: 'empresa', title: l('Empresa reclamada', 'Company complained about') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    { name: 'regulador', type: 'select', section: 'destinatario', required: true, label: l('Regulador', 'Regulator'), options: REGULADORES.map((r) => opt(r.value, r.pt, r.en)), default: 'incm' },
    { name: 'reguladorOutro', type: 'text', section: 'destinatario', label: l('Nome da entidade', 'Name of the body'), showIf: (v) => v.regulador === 'outro' },
    { name: 'reguladorDepartamento', type: 'text', section: 'destinatario', label: l('Departamento ou delegação (opcional)', 'Department or office (optional)'), placeholder: l('Ex.: Delegação Regional Centro — Beira', 'E.g. regional office') },
    { name: 'reguladorLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: 'Maputo' },
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'empresaNome', type: 'text', section: 'empresa', required: true, label: l('Empresa', 'Company'), placeholder: l('Ex.: Vodacom Moçambique, S.A.', 'E.g. the operator') },
    { name: 'numeroCliente', type: 'text', section: 'empresa', width: 'half', label: l('N.º de cliente / conta / apólice', 'Customer / account / policy no.') },
    { name: 'reclamacaoData', type: 'date', section: 'empresa', width: 'half', label: l('Data da reclamação à empresa', 'Date of the complaint to the company') },
    { name: 'reclamacaoNumero', type: 'text', section: 'empresa', width: 'half', label: l('N.º da reclamação na empresa', 'Company ticket no.') },
    {
      name: 'resposta',
      type: 'radio',
      section: 'empresa',
      label: l('Resposta da empresa', 'Company’s answer'),
      options: [opt('nenhuma', 'Não respondeu', 'No answer'), opt('insatisfatoria', 'Respondeu sem resolver', 'Answered without solving'), opt('naoReclamou', 'Ainda não reclamei à empresa', 'Not yet complained to the company')],
      default: 'nenhuma',
    },
    { name: 'respostaData', type: 'date', section: 'empresa', width: 'half', label: l('Data da resposta', 'Date of the answer'), showIf: (v) => v.resposta === 'insatisfatoria' },
    { name: 'valor', type: 'money', section: 'reclamacao', width: 'half', label: l('Valor em causa (opcional)', 'Amount at stake (optional)') },
    { name: 'factos', type: 'textarea', section: 'reclamacao', required: true, rows: 6, label: l('Factos', 'Facts'), help: l('Por ordem, com datas e números. Um facto por linha.', 'In order, with dates and numbers. One per line.') },
    {
      name: 'pedidos',
      type: 'textarea',
      section: 'reclamacao',
      rows: 3,
      label: l('O que deve a empresa fazer', 'What the company should do'),
      help: l('Um pedido por linha. Ex.: «devolver os 6.420,00 MT cobrados indevidamente», «repor o serviço».', 'One per line. E.g. refund the amount wrongly charged.'),
    },
    anexosField('reclamacao', l('Ex.: Cópia da reclamação apresentada à empresa', 'E.g. Copy of the complaint to the company')),
    localField('documento'),
    dateField('data'),
    envioField('documento', 'registada'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const r = regOf(v);
    const w: Warning[] = autorWarnings(ctx, { doc: true, contacto: true });
    if (!str(v.empresaNome)) w.push({ level: 'warning', field: 'empresaNome', message: l('Indique a empresa reclamada.', 'State the company.') });
    if (v.regulador === 'outro' && !str(v.reguladorOutro)) w.push({ level: 'warning', field: 'reguladorOutro', message: l('Indique a entidade.', 'State the body.') });
    if (v.resposta === 'naoReclamou') {
      w.push({ level: 'warning', field: 'resposta', message: l('Os reguladores pedem, em regra, que reclame primeiro à empresa. Use primeiro a reclamação à empresa e guarde o número.', 'Regulators usually require a complaint to the company first.') });
    }
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
    w.push({ level: 'info', field: 'regulador', message: l(`${r.nome || 'A entidade'}: ${cite(r.ref)}. Junte cópia da reclamação feita à empresa e da resposta, se houver.`, 'Attach a copy of the complaint to the company and its answer, if any.') });
    return w;
  },

  personName: (v) => v.empresaNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const r = regOf(v);
    const nome = v.regulador === 'outro' ? str(v.reguladorOutro) || BLANK : r.nome;
    const empresa = str(v.empresaNome) || BLANK;
    const factos = splitLines(v.factos);
    const pedidos = splitLines(v.pedidos);
    const cliente = str(v.numeroCliente) ? ` (cliente n.º ${str(v.numeroCliente)})` : '';

    let antecedente: string;
    const rec = `${v.reclamacaoData ? `Em ${dateLong(v.reclamacaoData)}, ` : ''}${eu(ctx, 'apresentei', 'apresentámos')} reclamação junto de ${empresa}${str(v.reclamacaoNumero) ? `, registada com o n.º ${str(v.reclamacaoNumero)}` : ''}`;
    if (v.resposta === 'insatisfatoria') antecedente = `${rec}, que respondeu${v.respostaData ? ` em ${dateLong(v.respostaData)}` : ''} sem resolver a situação.`;
    else if (v.resposta === 'naoReclamou') antecedente = '';
    else antecedente = `${rec}, que não respondeu até à data.`;

    const blocks: Block[] = [
      ...envioBlock(v),
      { type: 'recipient', salutation: 'Exmos. Senhores', lines: [nome, str(v.reguladorDepartamento), str(v.reguladorLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `Reclamação contra ${empresa}${str(v.reclamacaoNumero) ? ` — reclamação n.º ${str(v.reclamacaoNumero)}` : ''}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${autorDesc(ctx, { contactos: true })}, cliente de ${empresa}${cliente}, vem apresentar a V. Ex.as reclamação contra aquela empresa${money(v.valor) != null ? `, envolvendo o valor de **${moneyText(v.valor)}**` : ''}, nos termos seguintes:`,
        en: 'The complainant, a customer of the company, files a complaint against it as follows:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: [...(factos.length ? factos.map(endDot) : [BLANK, BLANK]), ...(antecedente ? [antecedente] : [])] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Pelo exposto, ${eu(ctx, 'solicito', 'solicitamos')} a V. Ex.as que, no exercício das competências de regulação e de protecção dos consumidores${r.sector ? ` do sector de ${r.sector}` : ''}, apreciem a presente reclamação e determinem a ${empresa}${pedidos.length === 1 ? ` ${endDot(lowerFirst(pedidos[0]))}` : pedidos.length ? ':' : ' a reposição dos direitos do consumidor e a correcção da situação.'}`,
        en: 'The regulator is asked to review the complaint and order the company to remedy the situation.',
        keepWithNext: pedidos.length > 1,
      },
    ];
    if (pedidos.length > 1) blocks.push({ type: 'list', style: 'alpha', items: pedidos.map((p) => endDot(lowerFirst(p))) });
    blocks.push(
      ...anexosBlock(v, 'Junta:'),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Reclamante', 'A Reclamante')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
