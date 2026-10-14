// Acta de abertura das propostas: minutes of the public opening of bids — jury,
// bids received with prices and securities, late bids, bidders present and
// statements made — signed by the jury and the bidders' representatives.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, entityName, formatMoney, l, lineItems, localField, money } from './_shared';
import { dataPorExtenso, hora } from './_estado';
import { entidadeProfileWarning, juriField, juriSignatures, juriTexto, objectoComArtigo, procedimentoFields, procedimentoNome, semPonto, str } from './_contratacao';

const GARANTIA_OPTIONS = [
  { value: 'sim', label: l('Apresentada', 'Lodged') },
  { value: 'nao', label: l('Não apresentada', 'Not lodged') },
  { value: 'na', label: l('Não exigida', 'Not required') },
];
const GARANTIA_TXT: Record<string, string> = { sim: 'Sim', nao: 'Não', na: 'N/A' };

export default defineTemplate({
  id: 'acta-abertura-propostas',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Acta, local e data', 'Minutes, place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'juri', title: l('Júri', 'Jury') },
    { id: 'propostas', title: l('Propostas recebidas', 'Bids received') },
    { id: 'sessao', title: l('Presenças e ocorrências', 'Attendance and events') },
  ],
  fields: [
    { name: 'actaNumero', type: 'text', section: 'documento', width: 'half', label: l('Acta n.º (opcional)', 'Minutes no. (optional)') },
    localField(),
    dateField('data', 'documento', l('Data da sessão', 'Date of the session')),
    { name: 'horaInicio', type: 'text', section: 'documento', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 10:30', 'E.g. 10:30') },
    { name: 'horaFim', type: 'text', section: 'documento', width: 'half', label: l('Hora de encerramento', 'End time'), placeholder: l('Ex.: 11:45', 'E.g. 11:45') },
    { name: 'sala', type: 'text', section: 'documento', label: l('Local da sessão', 'Venue'), placeholder: l('Ex.: sala de reuniões da Direcção Provincial de Saúde de Nampula', 'E.g. meeting room of …') },
    ...procedimentoFields(),
    { name: 'entregaHora', type: 'text', section: 'procedimento', width: 'half', label: l('Hora-limite de entrega das propostas', 'Bid deadline time'), placeholder: l('Ex.: 10:00', 'E.g. 10:00') },
    { name: 'despachoJuri', type: 'text', section: 'juri', label: l('Acto que designou o júri', 'Act appointing the jury'), placeholder: l('Ex.: Despacho n.º 12/DPS-NPL/2026, de 2 de Outubro', 'E.g. Order 12/DPS-NPL/2026') },
    juriField('juri'),
    {
      name: 'propostas',
      type: 'lines',
      section: 'propostas',
      label: l('Propostas, pela ordem de entrega', 'Bids, in order of receipt'),
      addLabel: l('Adicionar proposta', 'Add bid'),
      columns: [
        { name: 'concorrente', type: 'text', label: l('Concorrente', 'Bidder') },
        { name: 'preco', type: 'money', label: l('Preço lido', 'Price read out') },
        { name: 'garantia', type: 'select', label: l('Garantia provisória', 'Bid security'), options: GARANTIA_OPTIONS, default: 'sim' },
        { name: 'observacoes', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
    },
    { name: 'foraPrazo', type: 'text', section: 'propostas', label: l('Propostas entregues fora do prazo (opcional)', 'Late bids (optional)'), placeholder: l('Ex.: Comercial Lúrio, Lda, entregue às 10:20, devolvida fechada', 'E.g. Comercial Lúrio, Lda, received 10:20, returned unopened') },
    {
      name: 'presentes',
      type: 'lines',
      section: 'sessao',
      label: l('Representantes dos concorrentes presentes', 'Bidders’ representatives present'),
      addLabel: l('Adicionar representante', 'Add representative'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'concorrente', type: 'text', label: l('Concorrente', 'Bidder') },
      ],
      default: [],
    },
    { name: 'ocorrencias', type: 'textarea', section: 'sessao', rows: 3, label: l('Declarações e reclamações no acto (opcional)', 'Statements and complaints made (optional)'), help: l('Deixe vazio se não houve: a acta dirá que não foram apresentadas reclamações.', 'Leave empty if none: the minutes will say no complaints were made.') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!lineItems(v.propostas).some((r) => str(r.concorrente))) w.push({ level: 'warning', field: 'propostas', message: l('Registe as propostas recebidas.', 'Record the bids received.') });
    if (lineItems(v.juri).filter((r) => str(r.nome)).length % 2 === 0) w.push({ level: 'info', field: 'juri', message: l('O júri tem normalmente um número ímpar de membros.', 'The jury normally has an odd number of members.') });
    w.push({ level: 'info', message: l(`A acta é lavrada na própria sessão e assinada pelos membros do júri e pelos representantes presentes que o desejem; entregue cópia a quem a pedir (${cite('ctAberturaPublica')}).`, 'The minutes are drawn up at the session and signed by the jury and any representatives who wish; give a copy on request.') });
    return w;
  },

  personName: (v) => v.concursoNumero,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const props = lineItems(v.propostas).filter((r) => str(r.concorrente));
    const pres = lineItems(v.presentes).filter((r) => str(r.nome));
    const ocorr = str(v.ocorrencias);
    const despacho = semPonto(v.despachoJuri);
    const blocks: Block[] = [
      { type: 'title', text: `Acta de abertura das propostas${str(v.actaNumero) ? ` n.º ${semPonto(v.actaNumero)}` : ''}`, subtitle: procedimentoNome(v) },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.horaInicio, 'pelas')}, ${str(v.sala) ? `na ${semPonto(v.sala).replace(/^(na|no|em)\s+/i, '')}` : `nas instalações ${entityName(ctx) ? `de ${entityName(ctx)}` : 'da entidade contratante'}`}, reuniu em sessão pública o júri do ${procedimentoNome(v)}, para ${objectoComArtigo(v)}${despacho ? `, designado por ${despacho.replace(/^(pelo|por)\s+/i, '')}` : ''}, composto por ${juriTexto(v)}, para proceder ao acto público de abertura das propostas.`,
        en: 'The jury met in public session to open the bids.',
      },
      {
        type: 'paragraph',
        id: 'recebidas',
        text: props.length
          ? `O Presidente do júri declarou aberta a sessão e informou que, até ${hora(v.entregaHora, 'às')} do mesmo dia, hora-limite fixada para a entrega, foram recebidas ${props.length === 1 ? 'uma proposta' : `${props.length} propostas`}, que se encontravam fechadas e foram abertas e rubricadas pelos membros do júri, tendo sido lidos em voz alta o nome dos concorrentes, os preços e a existência de garantia provisória, conforme o quadro seguinte:`
          : `O Presidente do júri declarou aberta a sessão e informou que, até ${hora(v.entregaHora, 'às')} do mesmo dia, hora-limite fixada para a entrega, foram recebidas as propostas constantes do quadro seguinte:`,
        keepWithNext: true,
        en: 'Bids received by the deadline were opened, initialled and read out:',
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'right' },
          { label: 'Concorrente', width: 2.6 },
          { label: 'Preço (MT)', width: 1.4, align: 'right' },
          { label: 'Garantia', width: 0.9, align: 'center' },
          { label: 'Observações', width: 2 },
        ],
        rows: (props.length ? props : [{}, {}, {}]).map((r, i) => [String(i + 1), str(r.concorrente), money(r.preco) != null ? formatMoney(money(r.preco), false) : '', GARANTIA_TXT[str(r.garantia)] ?? '', str(r.observacoes)]),
        grid: !props.length,
      },
      {
        type: 'paragraph',
        id: 'foraPrazo',
        text: str(v.foraPrazo) ? `Foram entregues fora do prazo as seguintes propostas, que não foram admitidas: ${semPonto(v.foraPrazo)}.` : 'Não foram entregues propostas fora do prazo.',
        en: 'Late bids.',
      },
      {
        type: 'paragraph',
        id: 'presentes',
        text: pres.length
          ? `Assistiram ao acto os seguintes representantes dos concorrentes: ${pres.map((p) => `${str(p.nome)}${str(p.concorrente) ? ` (${str(p.concorrente)})` : ''}`).join('; ')}.`
          : 'Não compareceram representantes dos concorrentes.',
        en: 'Representatives present.',
      },
      {
        type: 'paragraph',
        id: 'ocorrencias',
        text: ocorr ? `No decurso do acto registaram-se as seguintes declarações ou reclamações: ${semPonto(ocorr)}.` : 'Não foram apresentadas declarações nem reclamações.',
        en: 'Statements and complaints.',
      },
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `As propostas seguem para análise e avaliação pelo júri, nos termos do documento de concurso. E nada mais havendo a tratar, foi encerrada a sessão ${hora(v.horaFim, 'pelas')}, tendo sido lavrada a presente acta que, depois de lida e aprovada, vai ser assinada pelos membros do júri e pelos representantes dos concorrentes presentes que o desejaram.`,
        keepWithNext: true,
        en: 'Bids go to evaluation. Session closed; minutes read, approved and signed.',
      },
      { type: 'heading', text: 'O Júri', keepWithNext: true },
      ...juriSignatures(v, pres.length > 0),
    ];
    if (pres.length) {
      blocks.push({ type: 'heading', text: 'Os representantes dos concorrentes', keepWithNext: true });
      const cols: SignatureColumn[] = pres.map((p) => ({ role: str(p.concorrente) || 'Concorrente', name: str(p.nome) || undefined }));
      for (let i = 0; i < cols.length; i += 3) blocks.push({ type: 'signatures', columns: cols.slice(i, i + 3) });
    }
    return blocks;
  },
});
