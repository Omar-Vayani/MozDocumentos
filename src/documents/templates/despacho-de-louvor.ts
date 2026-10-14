// Despacho de louvor: a manager's order publicly commending an employee or a
// team (a reward under the general statute of State employees), registered in
// the personal file and published in a service order.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, g, GENERO_OPTIONS, l, localField, splitLines } from './_shared';
import { estadoRef, estadoWarnings, numeroField, rodapeBlocks, rodapeFields, signatarioColumn, signatarioFields } from './_estado';
import { semPonto, str } from './_contratacao';

export default defineTemplate({
  id: 'despacho-de-louvor',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'louvado', title: l('Quem é louvado', 'Who is commended') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'assinatura', title: l('Assinatura e cópias', 'Signature and copies') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    {
      name: 'tipo',
      type: 'radio',
      section: 'louvado',
      label: l('Louvor', 'Commendation'),
      options: [
        { value: 'individual', label: l('Individual', 'Individual') },
        { value: 'colectivo', label: l('Colectivo (equipa ou serviço)', 'Collective (team or unit)') },
      ],
      default: 'individual',
    },
    { name: 'louvadoNome', type: 'text', section: 'louvado', width: 'half', required: true, label: l('Nome', 'Name'), showIf: (v) => v.tipo !== 'colectivo' },
    { name: 'louvadoGenero', type: 'radio', section: 'louvado', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.tipo !== 'colectivo' },
    { name: 'louvadoCategoria', type: 'text', section: 'louvado', width: 'half', label: l('Carreira / categoria', 'Career grade'), placeholder: l('Ex.: Técnico de Saúde N3', 'E.g. Health Technician N3'), showIf: (v) => v.tipo !== 'colectivo' },
    { name: 'louvadoFuncao', type: 'text', section: 'louvado', width: 'half', label: l('Função e serviço', 'Position and unit'), placeholder: l('Ex.: afecto ao Centro de Saúde de Namaita', 'E.g. at Namaita Health Centre'), showIf: (v) => v.tipo !== 'colectivo' },
    { name: 'equipa', type: 'text', section: 'louvado', label: l('Equipa ou serviço louvado', 'Team or unit commended'), placeholder: l('Ex.: a equipa da Brigada Móvel do Distrito de Rapale', 'E.g. the Rapale mobile brigade'), showIf: (v) => v.tipo === 'colectivo' },
    { name: 'membros', type: 'textarea', section: 'louvado', rows: 3, label: l('Membros da equipa (um por linha, opcional)', 'Team members (one per line, optional)'), showIf: (v) => v.tipo === 'colectivo' },
    {
      name: 'considerandos',
      type: 'textarea',
      section: 'fundamentos',
      rows: 5,
      required: true,
      label: l('Considerandos', 'Recitals'),
      help: l('Um facto por linha, começando por «que». Ex.: que coordenou a campanha de vacinação, atingindo uma cobertura de noventa e cinco por cento.', 'One fact per line, starting with “que” (that).'),
    },
    { name: 'motivo', type: 'text', section: 'fundamentos', required: true, label: l('Louvado pelo / pela…', 'Commended for…'), placeholder: l('Ex.: elevado espírito de missão, zelo e dedicação demonstrados', 'E.g. outstanding commitment and dedication') },
    { name: 'competencia', type: 'text', section: 'fundamentos', label: l('Base da competência (opcional)', 'Source of authority (optional)'), placeholder: l('Ex.: nos termos do Estatuto Geral dos Funcionários e Agentes do Estado', 'E.g. under the General Statute of State Employees') },
    { name: 'ordemServico', type: 'toggle', section: 'fundamentos', default: true, label: l('Publicar em ordem de serviço e averbar no processo individual', 'Publish in a service order and note in the personal file') },
    ...signatarioFields(),
    ...rodapeFields('assinatura', { anexos: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!splitLines(v.considerandos).length) w.push({ level: 'warning', field: 'considerandos', message: l('Indique os factos que justificam o louvor.', 'State the facts that justify the commendation.') });
    w.push({ level: 'info', message: l(`O louvor é uma recompensa prevista no estatuto dos funcionários e agentes do Estado e conta na avaliação de desempenho (${cite('ctLouvor')}). Só o pode conceder o dirigente com competência para o efeito.`, 'Commendation is a reward under the civil service statute and counts in performance appraisal. Only a competent manager may grant it.') });
    return w;
  },

  personName: (v) => (v.tipo === 'colectivo' ? v.equipa : v.louvadoNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const col = v.tipo === 'colectivo';
    const cons = splitLines(v.considerandos).map((s) => s.replace(/^que\s+/i, '').replace(/[.;,]+$/, ''));
    const quem = col
      ? `**${semPonto(v.equipa) || '____________________'}**`
      : `${g(v.louvadoGenero, 'o funcionário', 'a funcionária')} **${str(v.louvadoNome) || '____________________'}**${str(v.louvadoCategoria) ? `, ${semPonto(v.louvadoCategoria)}` : ''}${str(v.louvadoFuncao) ? `, ${semPonto(v.louvadoFuncao)}` : ''}`;
    const membros = splitLines(v.membros);
    const blocks: Block[] = [
      { type: 'reference', ref: estadoRef(ctx, 'Despacho'), place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Despacho', subtitle: 'Louvor' },
    ];
    (cons.length ? cons : ['____________________']).forEach((c, i) =>
      blocks.push({ type: 'paragraph', id: `considerando-${i + 1}`, text: `Considerando que ${c};`, en: 'Whereas…' }),
    );
    blocks.push({
      type: 'paragraph',
      id: 'louvor',
      text: `Nestes termos, ${str(v.competencia) ? `${semPonto(v.competencia)}, ` : 'no uso das competências que me são conferidas, '}louvo publicamente ${quem}, pelo ${semPonto(v.motivo).replace(/^(pelo|pela)\s+/i, '') || '____________________'}${col && membros.length ? ', integrada pelos seguintes elementos:' : '.'}`,
      en: 'I hereby publicly commend the person or team for the stated reasons.',
    });
    if (col && membros.length) blocks.push({ type: 'list', style: 'bullet', items: membros.map((m, i) => `${m}${i === membros.length - 1 ? '.' : ';'}`) });
    if (v.ordemServico !== false) {
      blocks.push({
        type: 'paragraph',
        id: 'publicacao',
        text: `O presente louvor é publicado em ordem de serviço e averbado no processo individual ${col ? 'de cada um dos seus membros' : g(v.louvadoGenero, 'do louvado', 'da louvada')}.`,
        en: 'Published in a service order and noted in the personal file(s).',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'cumpra', text: 'Registe-se, comunique-se e cumpra-se.', align: 'left', keepWithNext: true, en: 'Register, communicate and comply.' },
      { type: 'signatures', columns: [signatarioColumn(v)] },
      ...rodapeBlocks(v),
    );
    return blocks;
  },
});
