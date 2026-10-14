// Procuração para representar o concorrente: the bidder appoints a person to
// sign and submit the bid, attend the public opening, receive notifications,
// complain and sign the contract in a public tender.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, isF, l, workerFields } from './_shared';
import { concorrenteIdent, concorrenteSignature, concorrenteWarnings, daEntidade, DECLARACAO_SECTIONS, declaracaoBaseFields, declaracaoTitulo, identificacao, procedimentoCompleto, str } from './_contratacao';

const PODERES = [
  { name: 'pLevantar', texto: 'adquirir ou levantar o documento de concurso e pedir esclarecimentos sobre o mesmo', label: l('Levantar o documento de concurso e pedir esclarecimentos', 'Obtain the tender document and ask for clarifications'), def: true },
  { name: 'pAssinar', texto: 'assinar, rubricar e apresentar a proposta e todos os documentos que a integram ou acompanham', label: l('Assinar e apresentar a proposta', 'Sign and submit the bid'), def: true },
  { name: 'pAbertura', texto: 'assistir ao acto público de abertura das propostas, fazer declarações e reclamações e assinar a respectiva acta', label: l('Assistir à abertura das propostas e assinar a acta', 'Attend the bid opening and sign the minutes'), def: true },
  { name: 'pNotificacoes', texto: 'receber notificações e prestar esclarecimentos sobre a proposta solicitados pelo júri ou pela entidade contratante', label: l('Receber notificações e prestar esclarecimentos', 'Receive notices and answer questions'), def: true },
  { name: 'pReclamar', texto: 'apresentar reclamações e recursos hierárquicos e prestar as cauções devidas', label: l('Reclamar e recorrer', 'Lodge complaints and appeals'), def: true },
  { name: 'pNegociar', texto: 'negociar, nos casos em que a negociação seja admitida, prestar a garantia definitiva e apresentar os documentos de habilitação', label: l('Negociar, prestar garantias e entregar documentos de habilitação', 'Negotiate, provide securities and documents'), def: false },
  { name: 'pContrato', texto: 'assinar o contrato que vier a ser celebrado e os respectivos aditamentos', label: l('Assinar o contrato', 'Sign the contract'), def: false },
] as const;

export default defineTemplate({
  id: 'procuracao-concorrente',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    ...DECLARACAO_SECTIONS.map((s) => (s.id === 'concorrente' ? { ...s, title: l('Concorrente (mandante)', 'Bidder (principal)') } : s)),
    { id: 'procurador', title: l('Procurador', 'Attorney'), personRole: 'representante' },
    { id: 'poderes', title: l('Poderes', 'Powers') },
  ],
  fields: [
    ...declaracaoBaseFields(),
    ...workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'], 'procurador', 'procurador'),
    { name: 'procuradorCargo', type: 'text', section: 'procurador', width: 'half', label: l('Cargo na empresa (opcional)', 'Position in the company (optional)'), placeholder: l('Ex.: Director Comercial', 'E.g. Sales Director') },
    ...PODERES.map((p) => ({ name: p.name, type: 'toggle' as const, section: 'poderes', label: p.label, default: p.def })),
    {
      name: 'abrangencia',
      type: 'radio',
      section: 'poderes',
      label: l('Para que procedimentos', 'For which procedures'),
      options: [
        { value: 'este', label: l('Só para este concurso', 'This tender only') },
        { value: 'todos', label: l('Para todos os concursos da entidade até à data limite', 'All tenders of the body until a date') },
      ],
      default: 'este',
    },
    { name: 'validade', type: 'date', section: 'poderes', width: 'half', label: l('Válida até (opcional)', 'Valid until (optional)') },
    { name: 'substabelecer', type: 'toggle', section: 'poderes', label: l('Pode substabelecer', 'May delegate') },
    { name: 'reconhecimento', type: 'toggle', section: 'poderes', label: l('Espaço para o reconhecimento notarial', 'Space for notarial certification'), help: l('Ligue quando o documento de concurso exigir a assinatura reconhecida.', 'Turn on when the tender requires a certified signature.') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v)];
    if (!str(v.procuradorNome)) w.push({ level: 'error', field: 'procuradorNome', message: l('Indique o procurador.', 'Enter the attorney.') });
    if (!str(v.procuradorDocNumero)) w.push({ level: 'warning', field: 'procuradorDocNumero', message: l('Indique o documento de identificação do procurador.', 'Enter the attorney’s ID.') });
    w.push({
      level: 'info',
      message: l(
        `Quem assina pela empresa deve ter poderes para o acto (pacto social ou acta). Muitos documentos de concurso exigem a assinatura reconhecida por notário (${cite('procuracaoForma')}). Junte a procuração à proposta.`,
        'The company signatory must have authority. Many tender documents require a notarised signature. Attach the power of attorney to the bid.',
      ),
    });
    return w;
  },

  personName: (v) => v.procuradorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.procuradorGenero);
    const poderes = PODERES.filter((p) => v[p.name]).map((p) => `${p.texto};`);
    if (poderes.length) poderes[poderes.length - 1] = poderes[poderes.length - 1].replace(/;$/, '.');
    const ambito = v.abrangencia === 'todos'
      ? `nos procedimentos de contratação lançados ${daEntidade(str(v.entidadeNome))}${v.validade ? ` até ${dateLong(v.validade)}` : ''}, designadamente no ${procedimentoCompleto(v)}`
      : `no ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}`;
    const blocks: Block[] = [
      declaracaoTitulo('Procuração', v),
      {
        type: 'paragraph',
        id: 'constituicao',
        text: `${concorrenteIdent(v)}, constitui ${f ? 'sua bastante procuradora' : 'seu bastante procurador'} ${identificacao(v, 'procurador')}${str(v.procuradorCargo) ? `, ${semCargo(v.procuradorCargo)}` : ''}, a quem confere os poderes necessários para, em seu nome e representação, ${ambito}:`,
        en: 'The bidder appoints the attorney, identified above, with powers to act on its behalf in the tender, namely to:',
      },
      { type: 'list', style: 'alpha', items: poderes.length ? poderes : [BLANK] },
      {
        type: 'paragraph',
        id: 'validade',
        text: `${v.substabelecer ? `${f ? 'A procuradora' : 'O procurador'} pode substabelecer, com ou sem reserva, os poderes ora conferidos. ` : ''}A presente procuração é válida ${v.validade ? `até ${dateLong(v.validade)}` : v.abrangencia === 'todos' ? 'até ser revogada' : 'até à conclusão do procedimento e à assinatura do respectivo contrato'}.`,
        keepWithNext: true,
        en: 'Validity of the power of attorney.',
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [concorrenteSignature(ctx, 'O Mandante')], keepWithNext: Boolean(v.reconhecimento) },
    ];
    if (v.reconhecimento) blocks.push({ type: 'box', label: 'Reconhecimento notarial da assinatura', lines: 3, dashed: true });
    return blocks;
  },
});

const semCargo = (c: unknown) => {
  const s = String(c ?? '').trim().replace(/[.;,]+$/, '');
  return /^(na qualidade|que exerce)/i.test(s) ? s : `que exerce as funções de ${s}`;
};

