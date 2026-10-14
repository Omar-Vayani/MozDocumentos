// Pedido de parecer ao órgão sindical: the employer consults the union
// committee (or union delegate, sector union or workers' committee) before an
// internal regulation, a new schedule, a unilateral change to contracts, a
// transfer of a union representative or collective leave.

import type { LegalRefId } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, employerSignature, l, lineItems, localField, refField } from './_shared';
import { linhas, nosTermos, ORGAO_SINDICAL_OPTIONS, orgaoSindicalLinhas, ponto, str } from './_rh-politicas';

type Tipo = 'regulamento' | 'horario' | 'modificacao' | 'transferencia' | 'feriasColectivas' | 'planoFerias' | 'outro';

const TIPOS: Record<Tipo, { assunto: string; objecto: string; legal?: LegalRefId; en: string }> = {
  regulamento: { assunto: 'Projecto de regulamento interno de trabalho', objecto: 'o projecto de regulamento interno de trabalho da Empresa, que se junta', legal: 'rhpPoderRegulamentar', en: 'the draft internal work regulations' },
  horario: { assunto: 'Alteração do horário de trabalho', objecto: 'a alteração do horário de trabalho a seguir descrita', legal: 'horarioTrabalho', en: 'the change of working hours' },
  modificacao: { assunto: 'Modificação das condições de trabalho', objecto: 'a modificação das condições de trabalho a seguir descrita', legal: 'rhpModificacaoContrato', en: 'the change in working conditions' },
  transferencia: { assunto: 'Transferência de representante sindical', objecto: 'a transferência do representante sindical a seguir identificado', legal: 'rhpProtecaoSindical', en: 'the transfer of a union representative' },
  feriasColectivas: { assunto: 'Férias colectivas', objecto: 'o gozo simultâneo de férias por todos os trabalhadores (férias colectivas), nos termos a seguir descritos', legal: 'rhpFeriasColectivas', en: 'collective leave' },
  planoFerias: { assunto: 'Plano de férias', objecto: 'o plano de férias dos trabalhadores, que se junta', legal: 'feriasGozo', en: 'the leave plan' },
  outro: { assunto: 'Pedido de parecer', objecto: 'a medida a seguir descrita', en: 'the measure described' },
};

export default defineTemplate({
  id: 'consulta-orgao-sindical',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'orgao', title: l('Órgão consultado', 'Body consulted') },
    { id: 'materia', title: l('Matéria', 'Subject') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'orgaoTipo', type: 'select', section: 'orgao', width: 'half', label: l('Órgão', 'Body'), options: ORGAO_SINDICAL_OPTIONS, default: 'comite' },
    { name: 'orgaoNome', type: 'text', section: 'orgao', width: 'half', label: l('Designação (opcional)', 'Name (optional)'), placeholder: l('Ex.: Comité Sindical do SINTICIM', 'E.g. SINTICIM union committee') },
    {
      name: 'tipo',
      type: 'select',
      section: 'materia',
      required: true,
      label: l('Matéria da consulta', 'Subject of the consultation'),
      default: 'regulamento',
      options: [
        { value: 'regulamento', label: l('Regulamento interno de trabalho', 'Internal work regulations') },
        { value: 'horario', label: l('Novo horário de trabalho', 'New working hours') },
        { value: 'modificacao', label: l('Modificação unilateral das condições de trabalho', 'Unilateral change of working conditions') },
        { value: 'transferencia', label: l('Transferência de representante sindical', 'Transfer of a union representative') },
        { value: 'feriasColectivas', label: l('Férias colectivas (encerramento)', 'Collective leave (shutdown)') },
        { value: 'planoFerias', label: l('Plano de férias', 'Leave plan') },
        { value: 'outro', label: l('Outra matéria', 'Other') },
      ],
    },
    { name: 'assuntoOutro', type: 'text', section: 'materia', label: l('Assunto', 'Subject'), showIf: (v) => v.tipo === 'outro' },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'materia',
      rows: 5,
      label: l('O que a empresa propõe e porquê', 'What the company proposes and why'),
      help: l('Descreva a medida, os motivos, os trabalhadores abrangidos e a data prevista.', 'Describe the measure, reasons, employees affected and planned date.'),
    },
    { name: 'dataPrevista', type: 'date', section: 'materia', width: 'half', label: l('Data prevista de aplicação', 'Planned start date') },
    { name: 'dataResposta', type: 'date', section: 'materia', width: 'half', label: l('Pede-se o parecer até', 'Opinion requested by') },
    {
      name: 'anexos',
      type: 'lines',
      section: 'materia',
      label: l('Documentos anexos', 'Attachments'),
      addLabel: l('Adicionar anexo', 'Add attachment'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
    { name: 'caixaParecer', type: 'toggle', section: 'materia', default: true, label: l('Espaço para o parecer do órgão sindical', 'Space for the union’s opinion') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.descricao) && v.tipo !== 'regulamento' && v.tipo !== 'planoFerias') {
      w.push({ level: 'warning', field: 'descricao', message: l('Descreva a medida proposta e os seus motivos.', 'Describe the proposed measure and its reasons.') });
    }
    if (v.tipo === 'modificacao' || v.tipo === 'horario') {
      w.push({ level: 'info', message: l(`Depois da consulta, comunique a medida à administração do trabalho (${cite(v.tipo === 'horario' ? 'horarioComunicacao' : 'rhpModificacaoContrato')}).`, 'After consulting, notify the labour administration.') });
    }
    w.push({ level: 'info', message: l('Entregue em duas vias e peça a assinatura de recepção na cópia que fica com a empresa.', 'Deliver two copies and get the receipt signed on the company’s copy.') });
    return w;
  },
  personName: (v) => (v.tipo as string) || 'parecer',
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPOS[(v.tipo as Tipo) ?? 'regulamento'] ?? TIPOS.outro;
    const assunto = v.tipo === 'outro' && str(v.assuntoOutro) ? `Pedido de parecer — ${str(v.assuntoOutro)}` : `Pedido de parecer — ${t.assunto}`;
    const desc = linhas(v.descricao);
    const anexos = lineItems(v.anexos).map((a) => str(a.descricao)).filter(Boolean);
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: v.orgaoTipo === 'comissao' || (v.orgaoTipo === 'sindicato' && !str(v.orgaoNome)) ? 'À' : 'Ao', lines: orgaoSindicalLinhas(v.orgaoTipo, v.orgaoNome, ctx) },
      { type: 'subject', text: assunto },
      { type: 'salutation', text: v.orgaoTipo === 'delegado' ? 'Exmo. Senhor Delegado Sindical,' : 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${t.legal ? `${nosTermos(t.legal).replace(/^n/, 'N')}, s` : 'S'}ubmetemos a parecer de V. Ex.${v.orgaoTipo === 'delegado' ? 'ª' : 'as'} ${t.objecto}${v.dataPrevista ? `, cuja aplicação está prevista para ${dateLong(v.dataPrevista)}` : ''}.`,
        en: `We submit ${t.en} for your opinion${v.dataPrevista ? `, planned from ${v.dataPrevista}` : ''}.`,
      },
    ];
    if (desc.length) {
      blocks.push({ type: 'paragraph', id: 'descricao', text: desc.length === 1 ? ponto(desc[0]) : desc.map((d) => `— ${ponto(d)}`).join('\n'), en: 'Description of the proposed measure.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'resposta',
      text: `Agradecemos que o parecer nos seja remetido por escrito${v.dataResposta ? ` até ${dateLong(v.dataResposta)}` : ' com a brevidade possível'}. Estamos disponíveis para reunir com V. Ex.${v.orgaoTipo === 'delegado' ? 'ª' : 'as'} e prestar os esclarecimentos necessários.`,
      en: `Please send your written opinion${v.dataResposta ? ` by ${v.dataResposta}` : ' as soon as possible'}. We are available to meet and clarify.`,
      keepWithNext: !anexos.length,
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos, keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Direcção')] },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: 'Pelo órgão sindical' },
    );
    if (v.caixaParecer !== false) blocks.push({ type: 'box', label: 'Parecer do órgão sindical', lines: 5 });
    return blocks;
  },
});
