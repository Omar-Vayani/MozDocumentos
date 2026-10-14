// Reclamação interna do trabalhador: a written grievance to the employer
// (pay, category, working conditions), a harassment complaint, or a complaint
// or internal appeal against a disciplinary decision. A written complaint or
// internal appeal suspends the limitation period.

import type { LegalRefId } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, workerSignature } from './_shared';
import { autorFields, cartaDoTrabalhador, destinatarioFields, euTrabalhador, linhas, nosTermos, ponto, str } from './_rh-politicas';

type Tipo = 'geral' | 'remuneracao' | 'categoria' | 'assedio' | 'sancao';

const ASSUNTO: Record<Tipo, string> = {
  geral: 'Reclamação',
  remuneracao: 'Reclamação sobre remuneração',
  categoria: 'Reclamação sobre categoria profissional',
  assedio: 'Queixa por assédio no local de trabalho',
  sancao: 'Reclamação de decisão disciplinar',
};

const LEGAL: Partial<Record<Tipo, LegalRefId>> = { categoria: 'alteracaoCategoria', assedio: 'rhpAssedio', sancao: 'rhpReclamacaoInterna' };

export default defineTemplate({
  id: 'reclamacao-interna-trabalhador',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem reclama)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'reclamacao', title: l('Reclamação', 'Complaint') },
  ],
  fields: [
    localField(),
    dateField(),
    ...autorFields(['nome', 'genero', 'cargo', 'categoria', 'departamento']),
    ...destinatarioFields('empresa', 'Director-Geral'),
    {
      name: 'tipo',
      type: 'select',
      section: 'reclamacao',
      required: true,
      label: l('Tipo', 'Type'),
      default: 'geral',
      options: [
        { value: 'geral', label: l('Reclamação sobre condições de trabalho', 'Grievance about working conditions') },
        { value: 'remuneracao', label: l('Salário, subsídios ou horas extraordinárias em falta', 'Unpaid salary, allowances or overtime') },
        { value: 'categoria', label: l('Categoria profissional ou funções', 'Job grade or duties') },
        { value: 'assedio', label: l('Queixa por assédio ou discriminação', 'Harassment or discrimination complaint') },
        { value: 'sancao', label: l('Reclamação ou recurso de sanção disciplinar', 'Complaint or appeal against a disciplinary sanction') },
      ],
    },
    { name: 'via', type: 'radio', section: 'reclamacao', label: l('Forma', 'Form'), default: 'reclamacao', showIf: (v) => v.tipo === 'sancao', options: [
      { value: 'reclamacao', label: l('Reclamação para quem decidiu', 'Complaint to the decision-maker') },
      { value: 'recurso', label: l('Recurso para o superior hierárquico', 'Appeal to the superior') },
    ] },
    { name: 'decisaoData', type: 'date', section: 'reclamacao', width: 'half', label: l('Data da decisão disciplinar', 'Date of the decision'), showIf: (v) => v.tipo === 'sancao' },
    { name: 'sancao', type: 'text', section: 'reclamacao', width: 'half', label: l('Sanção aplicada', 'Sanction imposed'), placeholder: l('Ex.: suspensão com perda de remuneração', 'E.g. unpaid suspension'), showIf: (v) => v.tipo === 'sancao' },
    { name: 'visado', type: 'text', section: 'reclamacao', width: 'half', label: l('Pessoa visada (nome e função)', 'Person complained about'), showIf: (v) => v.tipo === 'assedio' },
    { name: 'confidencial', type: 'toggle', section: 'reclamacao', default: true, label: l('Marcar como confidencial', 'Mark as confidential'), showIf: (v) => v.tipo === 'assedio' },
    {
      name: 'factos',
      type: 'textarea',
      section: 'reclamacao',
      rows: 6,
      required: true,
      label: l('Factos (um por linha, com datas)', 'Facts (one per line, with dates)'),
      help: l('Descreva o que aconteceu, quando, onde e quem estava presente.', 'Describe what happened, when, where and who was present.'),
    },
    {
      name: 'pedido',
      type: 'textarea',
      section: 'reclamacao',
      rows: 3,
      required: true,
      label: l('O que pede', 'What you ask for'),
      placeholder: l('Ex.: o pagamento das horas extraordinárias de Agosto e Setembro', 'E.g. payment of August and September overtime'),
    },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'reclamacao',
      label: l('Testemunhas (opcional)', 'Witnesses (optional)'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'funcao', type: 'text', label: l('Função', 'Job') },
      ],
      default: [],
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'reclamacao',
      label: l('Documentos anexos', 'Attachments'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.factos)) w.push({ level: 'warning', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
    if (!str(v.pedido)) w.push({ level: 'warning', field: 'pedido', message: l('Diga o que pede à empresa.', 'State what you ask for.') });
    if (v.tipo === 'sancao') {
      w.push({ level: 'info', message: l(`A reclamação ou recurso escrito suspende o prazo de prescrição (${cite('rhpReclamacaoInterna')}). O prazo para impugnar a sanção no tribunal ou na mediação continua a ser o legal (${cite('impugnacaoSancao')}).`, 'A written complaint or appeal suspends the limitation period; the legal time limit to challenge the sanction still applies.') });
    }
    if (v.tipo === 'assedio') {
      w.push({ level: 'info', message: l('Pode também apresentar queixa à Inspecção-Geral do Trabalho ou, se houver crime, à polícia.', 'You may also complain to the Labour Inspectorate or, if there is a crime, to the police.') });
    }
    w.push({ level: 'info', message: l('Entregue em duas vias e peça que assinem a recepção na sua cópia.', 'Deliver two copies and have your copy signed for receipt.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = ((v.tipo as Tipo) in ASSUNTO ? v.tipo : 'geral') as Tipo;
    const legal = LEGAL[t];
    const factos = linhas(v.factos);
    const pedido = linhas(v.pedido);
    const tests = lineItems(v.testemunhas).filter((r) => str(r.nome));
    const anexos = lineItems(v.anexos).map((a) => str(a.descricao)).filter(Boolean);
    const recurso = t === 'sancao' && v.via === 'recurso';
    let abertura: string;
    if (t === 'sancao') {
      abertura = `${euTrabalhador(v)}, venho ${recurso ? 'interpor recurso hierárquico' : 'apresentar reclamação'} da decisão disciplinar de ${dateLong(v.decisaoData)}, que me aplicou a sanção de ${str(v.sancao) || BLANK}, ${nosTermos('rhpReclamacaoInterna')}, com os fundamentos seguintes:`;
    } else if (t === 'assedio') {
      abertura = `${euTrabalhador(v)}, venho apresentar queixa por assédio no local de trabalho${str(v.visado) ? ` contra ${str(v.visado)}` : ''}, ${nosTermos('rhpAssedio')}, com base nos factos seguintes:`;
    } else {
      abertura = `${euTrabalhador(v)}${str(v.trabalhadorCategoria) ? `, com a categoria de ${str(v.trabalhadorCategoria)}` : ''}, venho apresentar a seguinte reclamação${legal ? `, ${nosTermos(legal)}` : ''}:`;
    }
    const blocks: Block[] = [];
    if (t === 'assedio' && v.confidencial !== false) blocks.push({ type: 'tags', items: ['CONFIDENCIAL'] });
    blocks.push(...cartaDoTrabalhador(ctx, recurso ? 'Recurso hierárquico de decisão disciplinar' : ASSUNTO[t]));
    blocks.push({ type: 'paragraph', id: 'abertura', text: abertura, en: 'Opening of the complaint.', keepWithNext: true });
    blocks.push({ type: 'list', style: 'numeric', items: (factos.length ? factos : [BLANK]).map((f) => ponto(f)) });
    if (tests.length) {
      blocks.push({ type: 'paragraph', id: 'testemunhas', text: `Os factos podem ser confirmados por: ${tests.map((x) => `${str(x.nome)}${str(x.funcao) ? ` (${str(x.funcao)})` : ''}`).join('; ')}.`, en: 'Witnesses who can confirm the facts.' });
    }
    const pedidoTxt = pedido.map((p) => p.charAt(0).toLowerCase() + p.slice(1)).join('; ');
    let pedidoFrase: string;
    if (t === 'sancao') pedidoFrase = `${recurso ? 'a revogação da decisão recorrida' : 'a reapreciação e revogação da decisão'}${pedidoTxt ? `, bem como ${pedidoTxt}` : ''}`;
    else if (t === 'assedio') pedidoFrase = `que a queixa seja tratada com confidencialidade e que sejam tomadas as medidas necessárias para pôr termo à situação${pedidoTxt ? `, bem como ${pedidoTxt}` : ''}`;
    else pedidoFrase = pedidoTxt || BLANK;
    blocks.push({ type: 'paragraph', id: 'pedido', text: `Nestes termos, solicito a V. Ex.ª ${ponto(pedidoFrase)}`, en: 'Request.' });
    blocks.push({
      type: 'paragraph',
      id: 'resposta',
      text: 'Solicito resposta por escrito. A presente reclamação não prejudica o recurso aos meios legais de defesa dos meus direitos.',
      en: 'I ask for a written reply; this complaint does not waive other legal remedies.',
      keepWithNext: !anexos.length,
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos, keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: str(v.trabalhadorCargo) || undefined }] },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: 'Pela Empresa' },
    );
    return blocks;
  },
});
