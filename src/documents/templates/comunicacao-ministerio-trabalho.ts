// Comunicação ao órgão competente da administração do trabalho (Direcção
// Provincial / Ministério do Trabalho): the notices the Labour Law requires
// from the employer — internal regulations, new schedules, unilateral changes,
// temporary transfers, suspension of contracts, work accidents and the
// suspension of activity during a strike.

import type { LegalRefId } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, l, lineItems, localField, refField } from './_shared';
import { linhas, nosTermos, ponto, str } from './_rh-politicas';

type Tipo = 'regulamento' | 'horario' | 'modificacao' | 'transferencia' | 'suspensao' | 'acidente' | 'greve' | 'outro';

const TIPOS: Record<Tipo, { assunto: string; legal?: LegalRefId; en: string }> = {
  regulamento: { assunto: 'Comunicação de regulamento interno de trabalho', legal: 'rhpPoderRegulamentar', en: 'internal work regulations' },
  horario: { assunto: 'Comunicação de novo horário de trabalho', legal: 'horarioComunicacao', en: 'new working hours' },
  modificacao: { assunto: 'Comunicação de modificação das condições de trabalho', legal: 'rhpModificacaoContrato', en: 'change of working conditions' },
  transferencia: { assunto: 'Comunicação de transferência temporária de trabalhadores', legal: 'rhpTransferencia', en: 'temporary transfer of employees' },
  suspensao: { assunto: 'Comunicação de suspensão de contratos de trabalho', legal: 'rhpSuspensaoEconomica', en: 'suspension of employment contracts' },
  acidente: { assunto: 'Informação sobre acidente de trabalho', legal: 'rhpAcidenteParticipacao', en: 'work accident report' },
  greve: { assunto: 'Comunicação de suspensão da actividade durante a greve', legal: 'rhpMedidasExcepcionaisGreve', en: 'suspension of activity during a strike' },
  outro: { assunto: 'Comunicação', en: 'notice' },
};

export default defineTemplate({
  id: 'comunicacao-ministerio-trabalho',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'materia', title: l('Matéria', 'Subject') },
    { id: 'trabalhadores', title: l('Trabalhadores abrangidos', 'Employees concerned') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'entidade', type: 'text', section: 'destinatario', required: true, label: l('Entidade', 'Office'), default: 'Direcção Provincial do Trabalho', help: l('Ex.: Direcção Provincial do Trabalho de Sofala; Delegação Distrital; Inspecção-Geral do Trabalho.', 'E.g. Provincial Labour Directorate; district office; Labour Inspectorate.') },
    { name: 'entidadeLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'destinatarioCargo', type: 'text', section: 'destinatario', width: 'half', label: l('Dirigido a', 'Addressed to'), default: 'Director Provincial' },
    {
      name: 'tipo',
      type: 'select',
      section: 'materia',
      required: true,
      label: l('O que comunica', 'What you are notifying'),
      default: 'regulamento',
      options: [
        { value: 'regulamento', label: l('Regulamento interno de trabalho', 'Internal work regulations') },
        { value: 'horario', label: l('Novo horário de trabalho', 'New working hours') },
        { value: 'modificacao', label: l('Modificação unilateral das condições de trabalho', 'Unilateral change of working conditions') },
        { value: 'transferencia', label: l('Transferência temporária de trabalhadores', 'Temporary transfer of employees') },
        { value: 'suspensao', label: l('Suspensão de contratos (motivos económicos ou força maior)', 'Suspension of contracts (economic reasons or force majeure)') },
        { value: 'acidente', label: l('Acidente de trabalho (após inquérito)', 'Work accident (after inquiry)') },
        { value: 'greve', label: l('Suspensão da actividade durante greve', 'Suspension of activity during a strike') },
        { value: 'outro', label: l('Outra comunicação', 'Other notice') },
      ],
    },
    { name: 'assuntoOutro', type: 'text', section: 'materia', label: l('Assunto', 'Subject'), showIf: (v) => v.tipo === 'outro' },
    { name: 'motivoSuspensao', type: 'radio', section: 'materia', label: l('Motivo da suspensão', 'Reason for suspension'), default: 'economico', showIf: (v) => v.tipo === 'suspensao', options: [
      { value: 'economico', label: l('Motivos económicos (mercado, tecnológicos)', 'Economic reasons') },
      { value: 'forcaMaior', label: l('Força maior ou caso fortuito', 'Force majeure') },
    ] },
    { name: 'dataMedida', type: 'date', section: 'materia', width: 'half', label: l('Data de início / da ocorrência', 'Start date / date of the event') },
    { name: 'dataFimMedida', type: 'date', section: 'materia', width: 'half', label: l('Data de fim (se houver)', 'End date (if any)'), showIf: (v) => ['transferencia', 'suspensao', 'greve'].includes(v.tipo) },
    { name: 'dataConsulta', type: 'date', section: 'materia', width: 'half', label: l('Data da consulta ao órgão sindical', 'Date the union was consulted'), showIf: (v) => ['regulamento', 'horario', 'modificacao'].includes(v.tipo) },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'materia',
      rows: 5,
      label: l('Descrição e fundamentos', 'Description and grounds'),
      help: l('Para um acidente: data, local, sinistrado, lesões, causas apuradas e medidas tomadas. Para uma transferência ou suspensão: os motivos.', 'For an accident: date, place, injured person, injuries, causes and measures. For a transfer or suspension: the reasons.'),
    },
    {
      name: 'trabalhadores',
      type: 'lines',
      section: 'trabalhadores',
      label: l('Trabalhadores abrangidos (opcional)', 'Employees concerned (optional)'),
      addLabel: l('Adicionar trabalhador', 'Add employee'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'categoria', type: 'text', label: l('Categoria / função', 'Grade / job') },
        { name: 'observacao', type: 'text', label: l('Observação', 'Note'), placeholder: l('Ex.: transferido para Beira', 'E.g. moved to Beira') },
      ],
      default: [],
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'trabalhadores',
      label: l('Documentos anexos', 'Attachments'),
      addLabel: l('Adicionar anexo', 'Add attachment'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (v.tipo === 'horario') {
      const dia = ctx.legal.value<{ diaLimite: number }>('horarioComunicacao').diaLimite;
      w.push({ level: 'info', field: 'dataMedida', message: l(`O novo horário é comunicado até ao dia ${dia} do mês seguinte ao da sua adopção, juntando o mapa de horário para visto (${cite('horarioComunicacao')}; ${cite('horarioTrabalho')}).`, `Notify the new schedule by day ${dia} of the following month, attaching the schedule map for stamping.`) });
    }
    if (v.tipo === 'greve') {
      const h = ctx.legal.value<{ horas: number }>('rhpMedidasExcepcionaisGreve').horas;
      w.push({ level: 'warning', field: 'dataMedida', message: l(`A suspensão da actividade durante a greve é comunicada nas ${h} horas seguintes (${cite('rhpMedidasExcepcionaisGreve')}).`, `Notify within ${h} hours.`) });
    }
    if (v.tipo === 'suspensao') {
      w.push({ level: 'info', message: l('Junte cópia das comunicações individuais entregues aos trabalhadores (documento "Comunicação de suspensão do contrato de trabalho") e envie cópia ao órgão sindical.', 'Attach copies of the individual notices and send a copy to the union body.') });
    }
    if (['regulamento', 'horario', 'modificacao'].includes(v.tipo) && !v.dataConsulta) {
      w.push({ level: 'warning', field: 'dataConsulta', message: l('A consulta prévia ao órgão sindical é obrigatória. Indique a data em que foi feita.', 'Prior union consultation is mandatory. Enter its date.') });
    }
    if (!str(v.descricao) && v.tipo !== 'regulamento') w.push({ level: 'warning', field: 'descricao', message: l('Descreva a medida ou a ocorrência e os seus fundamentos.', 'Describe the measure or event and its grounds.') });
    return w;
  },
  personName: (v) => (v.tipo as string) || 'comunicacao',
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = ((v.tipo as Tipo) ?? 'regulamento') in TIPOS ? ((v.tipo as Tipo) ?? 'regulamento') : 'outro';
    const t = TIPOS[tipo];
    const legal: LegalRefId | undefined = tipo === 'suspensao' && v.motivoSuspensao === 'forcaMaior' ? 'rhpSuspensaoForcaMaior' : t.legal;
    const empresa = employerName(ctx);
    const desc = linhas(v.descricao);
    const lista = lineItems(v.trabalhadores).filter((r) => str(r.nome));
    const anexos = lineItems(v.anexos).map((a) => str(a.descricao)).filter(Boolean);
    const periodo = v.dataMedida ? `${v.dataFimMedida ? `de ${dateLong(v.dataMedida)} a ${dateLong(v.dataFimMedida)}` : `a partir de ${dateLong(v.dataMedida)}`}` : '';
    const consulta = v.dataConsulta ? `, depois de consultado o órgão sindical em ${dateLong(v.dataConsulta)}` : ', depois de consultado o órgão sindical';
    const termos = legal ? `${nosTermos(legal).replace(/^n/, 'N')}, ` : '';

    let abertura: string;
    switch (tipo) {
      case 'regulamento':
        abertura = `${termos}${empresa} comunica a V. Ex.ª o regulamento interno de trabalho que aprovou${consulta}, e que se junta. O regulamento entra em vigor ${periodo ? periodo.replace(/^a partir de/, 'em') : 'após a sua divulgação aos trabalhadores'}.`;
        break;
      case 'horario':
        abertura = `${termos}${empresa} comunica a V. Ex.ª o novo horário de trabalho adoptado${periodo ? ` ${periodo}` : ''}${consulta}, e submete o respectivo mapa de horário de trabalho ao visto desse órgão.`;
        break;
      case 'modificacao':
        abertura = `${termos}${empresa} comunica a V. Ex.ª a modificação das condições de trabalho a seguir descrita${periodo ? `, com efeitos ${periodo}` : ''}${consulta}.`;
        break;
      case 'transferencia':
        abertura = `${termos}${empresa} comunica a V. Ex.ª a transferência temporária ${lista.length === 1 ? 'do trabalhador abaixo indicado' : 'dos trabalhadores abaixo indicados'} para outro local de trabalho${periodo ? `, ${periodo}` : ''}, por circunstâncias excepcionais ligadas à organização da Empresa.`;
        break;
      case 'suspensao':
        abertura = `${termos}${empresa} comunica a V. Ex.ª a suspensão ${lista.length === 1 ? 'do contrato de trabalho do trabalhador abaixo indicado' : 'dos contratos de trabalho dos trabalhadores abaixo indicados'}${periodo ? `, ${periodo}` : ''}, por ${v.motivoSuspensao === 'forcaMaior' ? 'motivo de força maior' : 'razões económicas'}, juntando cópia das comunicações escritas entregues a cada trabalhador.`;
        break;
      case 'acidente':
        abertura = `${termos}${empresa} informa V. Ex.ª do acidente de trabalho ocorrido${v.dataMedida ? ` em ${dateLong(v.dataMedida)}` : ''}, da sua natureza, causas e consequências, apurados no inquérito realizado com a comissão de segurança no trabalho.`;
        break;
      case 'greve':
        abertura = `${termos}${empresa} comunica a V. Ex.ª que suspendeu ${desc.length ? 'a actividade nos termos abaixo descritos' : 'total ou parcialmente a sua actividade'}${periodo ? `, ${periodo}` : ''}, enquanto durar a greve, por imperiosa necessidade de salvaguardar as instalações e os equipamentos e a segurança das pessoas.`;
        break;
      default:
        abertura = `${empresa} comunica a V. Ex.ª o seguinte${periodo ? `, com efeitos ${periodo}` : ''}.`;
    }
    const assunto = tipo === 'outro' && str(v.assuntoOutro) ? str(v.assuntoOutro) : t.assunto;
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: [str(v.destinatarioCargo) || 'Director Provincial', str(v.entidade) || BLANK, str(v.entidadeLocal)].filter(Boolean) },
      { type: 'subject', text: assunto },
      { type: 'salutation', text: 'Exmo. Senhor,' },
      { type: 'paragraph', id: 'abertura', text: abertura, en: `${empresa} hereby notifies the ${t.en}.` },
    ];
    if (desc.length) {
      blocks.push({ type: 'paragraph', id: 'descricao', text: desc.length === 1 ? ponto(desc[0]) : desc.map((d) => `— ${ponto(d)}`).join('\n'), en: 'Description and grounds.' });
    }
    if (lista.length) {
      const temObs = lista.some((r) => str(r.observacao));
      blocks.push({
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.07, align: 'center' },
          { label: 'Nome', width: temObs ? 0.4 : 0.55 },
          { label: 'Categoria / função', width: temObs ? 0.25 : 0.38 },
          ...(temObs ? [{ label: 'Observação', width: 0.28 }] : []),
        ],
        rows: lista.map((r, i) => [String(i + 1), str(r.nome), str(r.categoria) || '—', ...(temObs ? [str(r.observacao) || '—'] : [])]),
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'disponibilidade',
      text: 'Ficamos ao dispor de V. Ex.ª para prestar os esclarecimentos e fornecer os elementos adicionais que entender necessários.',
      en: 'We remain available for any clarification or further information.',
      keepWithNext: !anexos.length,
    });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos, keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: 'Pelos Serviços' },
    );
    return blocks;
  },
});
