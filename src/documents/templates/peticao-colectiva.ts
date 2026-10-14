import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, l, lineItems, localField, placeDate, splitLines } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  autorFields,
  autorWarnings,
  cleanEntidade,
  endDot,
  isEmpresa,
  lowerFirst,
  opt,
  pessoaDesc,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

const TIPOS = [
  opt('peticao', 'Petição (pedido ou proposta)', 'Petition (request or proposal)'),
  opt('queixa', 'Queixa (ilegalidade ou mau funcionamento)', 'Complaint (illegality or malfunction)'),
  opt('reclamacao', 'Reclamação (contra uma decisão)', 'Objection (against a decision)'),
];
const NOME: Record<string, string> = { peticao: 'petição', queixa: 'queixa', reclamacao: 'reclamação' };

export default defineTemplate({
  id: 'peticao-colectiva',
  official: 'estado',
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'conteudo', title: l('Petição', 'Petition') },
    { id: 'autor', title: l('Representante dos peticionários', 'Petitioners’ representative'), personRole: 'outro' },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 6), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo e instituição', 'Position and institution'),
      help: l(
        'Dirija a petição a quem pode resolver: «Presidente do Conselho Municipal da Cidade de Nampula», «Administrador do Distrito de Moamba», «Governador da Província de Sofala», «Presidente da Assembleia da República» (a Comissão de Petições aprecia), «Director-Geral da EDM».',
        'Address it to whoever can solve it: mayor, district administrator, governor, President of Parliament (Petitions Committee), company director.',
      ),
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'tipo', type: 'select', section: 'conteudo', width: 'half', label: l('Tipo', 'Type'), options: TIPOS, default: 'peticao' },
    {
      name: 'quem',
      type: 'text',
      section: 'conteudo',
      label: l('Quem são os peticionários', 'Who the petitioners are'),
      placeholder: l('Ex.: moradores do Bairro de Muhalaze, Matola', 'E.g. residents of Muhalaze, Matola'),
      help: l('Completa a frase «Os abaixo-assinados, …». Ex.: «moradores do Bairro de Muhalaze», «vendedores do Mercado do Peixe», «pais e encarregados de educação da Escola Primária de …».', 'Completes “The undersigned, …”.'),
    },
    { name: 'assunto', type: 'text', section: 'conteudo', required: true, label: l('Assunto', 'Subject'), placeholder: l('Ex.: Reabilitação da estrada de acesso ao bairro', 'E.g. Repair of the access road') },
    { name: 'factos', type: 'textarea', section: 'conteudo', required: true, rows: 6, label: l('Exposição (factos)', 'Statement of facts'), help: l('Um facto por linha: o problema, desde quando, quem afecta, o que já foi feito.', 'One fact per line: the problem, since when, who it affects, what has been done.') },
    { name: 'pedidos', type: 'textarea', section: 'conteudo', required: true, rows: 3, label: l('O que pedem', 'What you request'), help: l('Um pedido por linha, concreto e possível. Ex.: «a reparação da conduta de água na Rua 3».', 'One request per line, specific and feasible.') },
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true }),
    {
      name: 'signatarios',
      type: 'lines',
      section: 'assinaturas',
      label: l('Signatários (opcional)', 'Signatories (optional)'),
      help: l('Pode escrever já os nomes; as linhas em branco servem para recolher assinaturas à mão. O representante entra na primeira linha.', 'You may type names now; blank lines are for collecting signatures by hand. The representative goes on the first line.'),
      addLabel: l('Adicionar signatário', 'Add signatory'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'doc', type: 'text', label: l('BI / documento n.º', 'ID no.') },
        { name: 'morada', type: 'text', label: l('Residência', 'Residence') },
      ],
      default: [],
    },
    { name: 'linhasBranco', type: 'number', section: 'assinaturas', width: 'half', min: 0, max: 60, label: l('Linhas em branco para assinar', 'Blank signature lines'), default: 20 },
    localField('documento'),
    dateField('data'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = isEmpresa(ctx) ? autorWarnings(ctx) : [];
    if (!isEmpresa(ctx) && !str(v.autorNome)) w.push({ level: 'info', field: 'autorNome', message: l('Indique um representante para os contactos: a resposta é enviada a ele.', 'Name a representative for contacts: the reply is sent to them.') });
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique a quem se dirige a petição.', 'State who the petition is addressed to.') });
    if (!splitLines(v.pedidos).length) w.push({ level: 'warning', field: 'pedidos', message: l('Escreva o que pedem.', 'Write what you request.') });
    w.push({
      level: 'info',
      field: 'signatarios',
      message: l(
        `Cada signatário escreve o nome completo, o número do documento de identificação e a residência, e assina (${cite('cidPeticaoForma')}). Não se aceitam petições que pretendam rever decisões dos tribunais ou actos definitivos (${cite('cidPeticaoIndeferimento')}).`,
        'Each signatory gives full name, ID number and residence, and signs. Petitions to review court decisions or final acts are not accepted.',
      ),
    });
    return w;
  },

  personName: (v) => v.assunto,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = NOME[String(v.tipo)] ?? 'petição';
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const factos = splitLines(v.factos);
    const pedidos = splitLines(v.pedidos);
    const quem = str(v.quem) ? `, ${lowerFirst(str(v.quem).replace(/[.,]$/, ''))},` : '';

    const rep = isEmpresa(ctx)
      ? `a **${profileDisplayName(ctx.profile) || BLANK}**${ctx.profile?.representanteNome ? `, representada por ${ctx.profile.representanteNome}` : ''}${ctx.profile?.telefones ? `, telefone ${ctx.profile.telefones}` : ''}`
      : str(v.autorNome)
        ? `${pessoaDesc(v, 'autor', { contactos: true })}`
        : '';

    const blocks: Block[] = [
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)} colectiva — ${str(v.assunto) || BLANK}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Os abaixo-assinados${quem} vêm, no exercício do direito de petição, queixa e reclamação consagrado na ${cite('direitoPeticao')} e regulado pela ${cite('cidPeticaoForma')}, apresentar a V. Ex.ª a seguinte ${tipo}:`,
        en: 'The undersigned, exercising the constitutional right of petition, submit the following:',
        keepWithNext: true,
      },
      { type: 'heading', text: 'I — Exposição' },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK, BLANK] },
      { type: 'heading', text: 'II — Pedido' },
      { type: 'paragraph', id: 'pedidoIntro', text: 'Pelo exposto, os peticionários solicitam a V. Ex.ª:', en: 'The petitioners therefore request:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: pedidos.length ? pedidos.map(endDot) : [BLANK] },
    ];
    if (rep) {
      blocks.push({
        type: 'paragraph',
        id: 'representante',
        text: `Para efeitos de contacto e de notificação da resposta, os peticionários indicam como ${isEmpresa(ctx) ? 'representante' : v.autorGenero === 'F' ? 'sua representante' : 'seu representante'} ${rep}.`,
        en: 'For contacts and notice of the reply, the petitioners name the representative stated.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Pedem deferimento.', align: 'center', en: 'Request approval.' },
      { type: 'paragraph', id: 'localData', text: placeDate(ctx, v.data), align: 'left', en: 'Place and date.', keepWithNext: true },
    );

    // Signature sheet: named signatories, then blank lines to collect signatures by hand.
    const listed = lineItems(v.signatarios)
      .map((r) => [str(r.nome), str(r.doc), str(r.morada)])
      .filter((r) => r.some(Boolean));
    if (!isEmpresa(ctx) && str(v.autorNome) && !listed.some((r) => r[0] === str(v.autorNome))) {
      listed.unshift([str(v.autorNome), str(v.autorDocNumero), str(v.autorMorada)]);
    }
    const blanks = Math.max(0, Math.min(60, Math.round(Number(v.linhasBranco ?? 20)) || 0));
    const rows = [...listed, ...Array.from({ length: blanks }, () => ['', '', ''])];
    const total = rows.length || 10;
    const body = (rows.length ? rows : Array.from({ length: total }, () => ['', '', ''])).map((r, i) => [String(i + 1), r[0], r[1], r[2], '']);
    blocks.push(
      { type: 'heading', text: 'Assinaturas dos peticionários', keepWithNext: true },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'N.º', width: 5, align: 'center' },
          { label: 'Nome completo', width: 30 },
          { label: 'BI / doc. n.º', width: 20 },
          { label: 'Residência', width: 21 },
          { label: 'Assinatura', width: 24 },
        ],
        rows: body,
      },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
