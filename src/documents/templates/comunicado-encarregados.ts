// Comunicado aos pais e encarregados de educação: the school management
// informs all parents (suspension of classes, assessment calendar, payment
// reminders, events). Optional tear-off slip to confirm receipt.

import { formatDateShort } from '@/lib/format';
import { isPublicBody } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, splitLines } from './_shared';
import { rows, semPonto, str } from './_educacao';

export default defineTemplate({
  id: 'comunicado-encarregados',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Comunicado', 'Notice') },
    { id: 'conteudo', title: l('Conteúdo', 'Content') },
    { id: 'destacavel', title: l('Talão de tomada de conhecimento', 'Acknowledgement slip') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Comunicado n.º', 'Notice no.'), default: (c) => c.nextRef },
    localField(),
    dateField(),
    { name: 'destinatarios', type: 'text', section: 'documento', label: l('Destinatários', 'Addressed to'), default: 'Pais e Encarregados de Educação', help: l('Ex.: Pais e Encarregados de Educação dos alunos da 7.ª classe', 'E.g. parents of grade 7 pupils') },
    {
      name: 'tema',
      type: 'select',
      section: 'conteudo',
      label: l('Tema', 'Topic'),
      options: [
        { value: 'interrupcao', label: l('Suspensão ou interrupção das aulas', 'Classes suspended') },
        { value: 'calendario', label: l('Calendário de avaliações ou actividades', 'Assessment or activity calendar') },
        { value: 'pagamento', label: l('Prazo de pagamento de propinas', 'Fee payment reminder') },
        { value: 'evento', label: l('Evento (festa, palestra, dia aberto)', 'Event') },
        { value: 'outro', label: l('Outro assunto', 'Other') },
      ],
      default: 'interrupcao',
    },
    { name: 'assunto', type: 'text', section: 'conteudo', label: l('Assunto', 'Subject'), placeholder: l('Ex.: Suspensão das aulas devido ao alerta de ciclone', 'E.g. Classes suspended due to cyclone alert') },
    { name: 'motivo', type: 'text', section: 'conteudo', label: l('Motivo', 'Reason'), placeholder: l('Ex.: alerta vermelho de ciclone emitido pelo INGD', 'E.g. cyclone red alert'), showIf: (v) => v.tema === 'interrupcao' },
    { name: 'dataInicio', type: 'date', section: 'conteudo', width: 'half', label: l('De', 'From'), showIf: (v) => v.tema === 'interrupcao' },
    { name: 'dataFim', type: 'date', section: 'conteudo', width: 'half', label: l('A', 'To'), showIf: (v) => v.tema === 'interrupcao' },
    { name: 'dataRetoma', type: 'date', section: 'conteudo', width: 'half', label: l('Retoma das aulas', 'Classes resume'), showIf: (v) => v.tema === 'interrupcao' },
    { name: 'mesPropina', type: 'text', section: 'conteudo', width: 'half', label: l('Mês da propina', 'Fee month'), showIf: (v) => v.tema === 'pagamento' },
    { name: 'dataLimite', type: 'date', section: 'conteudo', width: 'half', label: l('Data limite', 'Deadline'), showIf: (v) => v.tema === 'pagamento' },
    { name: 'eventoNome', type: 'text', section: 'conteudo', label: l('Evento', 'Event'), placeholder: l('Ex.: festa de encerramento do ano lectivo', 'E.g. end-of-year celebration'), showIf: (v) => v.tema === 'evento' },
    { name: 'eventoData', type: 'date', section: 'conteudo', width: 'half', label: l('Data do evento', 'Event date'), showIf: (v) => v.tema === 'evento' },
    { name: 'eventoHora', type: 'text', section: 'conteudo', width: 'half', label: l('Hora', 'Time'), showIf: (v) => v.tema === 'evento' },
    { name: 'eventoLocal', type: 'text', section: 'conteudo', label: l('Local', 'Place'), showIf: (v) => v.tema === 'evento' },
    { name: 'texto', type: 'textarea', section: 'conteudo', rows: 5, label: l('Texto (um parágrafo por linha)', 'Text (one paragraph per line)'), help: l('Acrescenta ao texto do tema escolhido. No tema "Outro", é o texto do comunicado.', 'Added to the topic text; for "Other" it is the whole notice.') },
    {
      name: 'calendario',
      type: 'lines',
      section: 'conteudo',
      label: l('Calendário (opcional)', 'Calendar (optional)'),
      addLabel: l('Adicionar linha', 'Add row'),
      columns: [
        { name: 'data', type: 'text', label: l('Data', 'Date') },
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'obs', type: 'text', label: l('Classes / observação', 'Classes / note') },
      ],
      default: [],
    },
    { name: 'destacavel', type: 'toggle', section: 'destacavel', label: l('Incluir talão para o encarregado devolver assinado', 'Add a slip for the parent to sign and return'), default: true },
    { name: 'dataDevolucao', type: 'date', section: 'destacavel', width: 'half', label: l('Devolver até', 'Return by'), showIf: (v) => Boolean(v.destacavel) },
    { name: 'assinante', type: 'text', section: 'assinatura', width: 'half', label: l('Assina', 'Signed by'), default: 'A Direcção da Escola' },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Nome (opcional)', 'Name (optional)'), default: (c) => c.profile?.representanteNome ?? '' },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (isPublicBody(ctx.profile) && (v.tema === 'pagamento' || /pag|contribui|valor|MT\b/i.test(str(v.texto))))
      w.push({
        level: 'warning',
        message: l(
          'Escola pública: o ensino primário público é gratuito e as cobranças não autorizadas aos encarregados já deram origem a processos-crime. Confirme a base legal de qualquer pedido de dinheiro.',
          'Public school: public primary education is free and unauthorised charges have led to criminal cases. Check the legal basis of any request for money.',
        ),
      });
    if (v.tema === 'outro' && !str(v.texto)) w.push({ level: 'warning', field: 'texto', message: l('Escreva o texto do comunicado.', 'Write the notice text.') });
    return w;
  },
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const tema = str(v.tema) || 'outro';
    const preset: Block[] = [];
    if (tema === 'interrupcao')
      preset.push({
        type: 'paragraph',
        id: 'interrupcao',
        text: `Comunicamos que, ${str(v.motivo) ? `devido a ${semPonto(v.motivo)}` : 'por motivo de força maior'}, as aulas ficam suspensas ${v.dataInicio && v.dataFim && v.dataInicio !== v.dataFim ? `de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}` : `no dia ${dateLong(v.dataInicio || v.dataFim)}`}${v.dataRetoma ? `, retomando no dia ${dateLong(v.dataRetoma)}, no horário habitual` : ''}.`,
        en: 'Classes are suspended for the stated period and resume on the stated date.',
      });
    if (tema === 'calendario')
      preset.push({ type: 'paragraph', id: 'calendario', text: 'Comunicamos o calendário das actividades abaixo indicadas, solicitando aos Senhores Encarregados de Educação que acompanhem a preparação dos seus educandos:', en: 'Please find the calendar below.', keepWithNext: true });
    if (tema === 'pagamento')
      preset.push({
        type: 'paragraph',
        id: 'pagamento',
        text: `Recordamos que a propina ${str(v.mesPropina) ? `do mês de ${semPonto(v.mesPropina)} ` : ''}deve ser paga até ao dia ${v.dataLimite ? dateLong(v.dataLimite) : BLANK}, na Tesouraria ou por transferência, devendo o comprovativo ser entregue na Secretaria. Os encarregados com dificuldades podem contactar a Direcção para acordar um plano de pagamento.`,
        en: 'Reminder of the fee deadline; parents with difficulties may agree a payment plan.',
      });
    if (tema === 'evento')
      preset.push({
        type: 'paragraph',
        id: 'evento',
        text: `Comunicamos que no dia ${dateLong(v.eventoData)}${str(v.eventoHora) ? `, pelas ${str(v.eventoHora)}` : ''}, se realiza ${semPonto(v.eventoNome) || BLANK}${str(v.eventoLocal) ? `, no ${semPonto(v.eventoLocal).replace(/^(no|na|em) /i, '')}` : ''}, para a qual convidamos todos os Pais e Encarregados de Educação.`,
        en: 'Invitation to a school event on the stated date and place.',
      });
    const extra = splitLines(v.texto).map((t, i) => ({ type: 'paragraph' as const, id: `texto${i + 1}`, text: t, en: 'Notice text.' }));
    const cal = rows(v.calendario).filter((r) => str(r.data) || str(r.actividade));
    const blocks: Block[] = [
      { type: 'reference', ref: `Comunicado n.º ${str(v.numero) || '____'}`, place: ctx.place, date: v.data },
      { type: 'title', text: 'Comunicado' },
    ];
    if (str(v.assunto)) blocks.push({ type: 'subject', text: semPonto(v.assunto) });
    blocks.push({ type: 'salutation', text: `Prezados ${semPonto(v.destinatarios) || 'Pais e Encarregados de Educação'},` }, ...preset, ...extra);
    if (cal.length)
      blocks.push({ type: 'table', columns: [{ label: 'Data', width: 24 }, { label: 'Actividade', width: 48 }, { label: 'Classes / observação', width: 28 }], rows: cal.map((r) => [str(r.data), str(r.actividade), str(r.obs)]) });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Contamos com a habitual colaboração de todos.', en: 'We count on everyone’s cooperation.', keepWithNext: true },
      { type: 'signatures', columns: [{ role: str(v.assinante) || 'A Direcção da Escola', name: str(v.assinanteNome) || undefined, image: 'both' }] },
    );
    if (v.destacavel)
      blocks.push({
        type: 'box',
        cut: true,
        label: `Talão a devolver à Escola${v.dataDevolucao ? ` até ${formatDateShort(v.dataDevolucao)}` : ''}`,
        text: `Eu, ______________________________________, Encarregado(a) de Educação do(a) aluno(a) ______________________________________, da ______ classe, turma ______, tomei conhecimento do Comunicado n.º ${str(v.numero) || '____'}.\n\nAssinatura: ______________________________     Data: ___/___/______`,
      });
    return blocks;
  },
});
