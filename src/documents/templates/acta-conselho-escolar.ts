// Acta de reunião de órgão escolar: minutes of the class council, pedagogical
// council, school council or subject group — attendance, agenda, discussion
// and decisions per item, signed by the chair and the secretary.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { dateLong, l, localField } from './_shared';
import { horaText } from './_saude';
import { cell, emLocal, ORGAOS, orgaoNome, papelCargo, rows, semPonto, str } from './_saude-educacao';
import { inteiroPorExtenso } from '@/lib/format/extenso';

const ORDINAL_F = ['', 'Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava', 'Nona', 'Décima'];

export default defineTemplate({
  id: 'acta-conselho-escolar',
  family: 'acta',
  sections: [
    { id: 'documento', title: l('Reunião', 'Meeting') },
    { id: 'presencas', title: l('Presenças', 'Attendance') },
    { id: 'pontos', title: l('Ordem de trabalhos e deliberações', 'Agenda and decisions') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    { name: 'actaNumero', type: 'number', section: 'documento', width: 'half', min: 1, label: l('Acta n.º', 'Minutes no.'), default: 1 },
    { name: 'orgao', type: 'select', section: 'documento', width: 'half', label: l('Órgão', 'Body'), options: ORGAOS.map(({ value, label }) => ({ value, label })), default: 'turma' },
    { name: 'turmaDesc', type: 'text', section: 'documento', width: 'half', label: l('Classe e turma', 'Grade and class'), showIf: (v) => v.orgao === 'turma' },
    { name: 'grupoNome', type: 'text', section: 'documento', width: 'half', label: l('Disciplina / departamento', 'Subject / department'), showIf: (v) => v.orgao === 'grupo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data da reunião', 'Meeting date'), default: (c) => c.today },
    { name: 'horaInicio', type: 'text', section: 'documento', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('14:30', '14:30') },
    { name: 'horaFim', type: 'text', section: 'documento', width: 'half', label: l('Hora de encerramento', 'End time'), placeholder: l('16:45', '16:45') },
    { name: 'localReuniao', type: 'text', section: 'documento', label: l('Local', 'Place'), default: 'na sala de reuniões da Escola' },
    localField(),
    { name: 'presidente', type: 'text', section: 'documento', width: 'half', required: true, label: l('Presidiu', 'Chair') },
    { name: 'presidenteCargo', type: 'text', section: 'documento', width: 'half', label: l('Cargo de quem presidiu', 'Chair’s position'), default: 'Director de Turma' },
    { name: 'secretario', type: 'text', section: 'documento', width: 'half', label: l('Secretariou', 'Secretary') },
    {
      name: 'presentes',
      type: 'lines',
      section: 'presencas',
      label: l('Presentes', 'Present'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'qualidade', type: 'text', label: l('Qualidade', 'Capacity') },
      ],
      default: [],
    },
    { name: 'ausentes', type: 'text', section: 'presencas', label: l('Ausências (e justificação)', 'Absences (and reasons)') },
    {
      name: 'pontos',
      type: 'lines',
      section: 'pontos',
      label: l('Pontos da ordem de trabalhos', 'Agenda items'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [
        { name: 'ponto', type: 'text', label: l('Ponto', 'Item') },
        { name: 'discussao', type: 'textarea', label: l('Discussão (resumo)', 'Discussion (summary)') },
        { name: 'deliberacao', type: 'textarea', label: l('Deliberação', 'Decision') },
      ],
      default: [],
    },
    { name: 'votacao', type: 'radio', section: 'pontos', label: l('As deliberações foram tomadas', 'Decisions were taken'), options: [{ value: 'unanimidade', label: l('Por unanimidade', 'Unanimously') }, { value: 'maioria', label: l('Por maioria', 'By majority') }, { value: '', label: l('Não indicar', 'Do not state') }], default: 'unanimidade' },
    { name: 'assinaturaTodos', type: 'toggle', section: 'assinaturas', default: false, label: l('Assinada por todos os presentes', 'Signed by everyone present') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!rows(v.pontos).some((p) => str(p.ponto))) w.push({ level: 'error', field: 'pontos', message: l('Registe os pontos tratados e as deliberações.', 'Record the items and decisions.') });
    if (rows(v.pontos).some((p) => /\b(hiv|sida|gravidez|abuso)\b/i.test(`${p.discussao} ${p.deliberacao}`))) {
      w.push({ level: 'warning', field: 'pontos', message: l('A acta não deve expor dados de saúde ou situações íntimas de alunos; refira-os de forma reservada.', 'Do not expose pupils’ health or private matters in the minutes.') });
    }
    return w;
  },

  personName: (v) => orgaoNome(v),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = orgaoNome(v);
    const n = Number(v.actaNumero) || 1;
    const pres = rows(v.presentes).filter((p) => str(p.nome));
    const pontos = rows(v.pontos).filter((p) => str(p.ponto) || str(p.deliberacao));
    const d = str(v.data);
    const dia = d ? Number(d.slice(8, 10)) : NaN;
    const quando = d ? `${dia === 1 ? 'Ao primeiro dia' : `Aos ${Number.isFinite(dia) ? inteiroPorExtenso(dia) : ''} dias`} do mês de ${dateLong(d).replace(/^\d+ de /, '').replace(/ de \d{4}$/, '')} de ${inteiroPorExtenso(Number(d.slice(0, 4)))}` : 'Aos ______ dias do mês de ____________ de ________';
    const ordem = pontos.map((p) => semPonto(p.ponto)).filter(Boolean);
    const votos = v.votacao === 'unanimidade' ? ' As deliberações foram tomadas por unanimidade.' : v.votacao === 'maioria' ? ' As deliberações foram tomadas por maioria.' : '';
    const items: ClauseItem[] = pontos.map((p, k) => ({
      id: `ponto${k + 1}`,
      heading: str(p.ponto) || `Ponto ${k + 1}`,
      text: [str(p.discussao) ? semPonto(p.discussao) + '.' : '', str(p.deliberacao) ? `**Deliberação:** ${semPonto(p.deliberacao)}.` : ''].filter(Boolean).join('\n') || '____________________',
      en: `Item ${k + 1}: ${str(p.ponto)} — decision: ${str(p.deliberacao)}`,
    }));
    const blocks: Block[] = [
      { type: 'title', text: `Acta n.º ${n}`, subtitle: `${ORDINAL_F[n] ? `${ORDINAL_F[n]} reunião — ` : ''}${nome}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${quando}, pelas ${horaText(v.horaInicio)}, reuniu-se ${emLocal(v.localReuniao)} o **${nome}**, sob a presidência de ${str(v.presidente) || '____________________'}${str(v.presidenteCargo) ? `, ${str(v.presidenteCargo)}` : ''}, secretariado por ${str(v.secretario) || '____________________'}, com a presença dos membros abaixo indicados${str(v.ausentes) ? `, tendo faltado ${semPonto(v.ausentes)}` : ''}, com a seguinte ordem de trabalhos: ${ordem.length ? ordem.map((o, k) => `${k + 1}. ${o}`).join('; ') : '____________________'}.`,
        en: `On ${d || '___'} at ${v.horaInicio || '___'}, the ${nome} met, chaired by ${v.presidente || '___'}, with the members listed, to discuss the agenda.`,
      },
    ];
    if (pres.length) {
      blocks.push({ type: 'table', columns: [{ label: 'Membros presentes', width: 60 }, { label: 'Qualidade', width: 40 }], rows: pres.map((p) => [str(p.nome), cell(p.qualidade)]) });
    }
    blocks.push(
      { type: 'numberedClauses', style: 'numeric', items: items.length ? items : [{ id: 'ponto1', heading: 'Ponto 1', text: '____________________' }] },
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `${votos.trim() ? `${votos.trim()} ` : ''}Nada mais havendo a tratar, foi encerrada a reunião pelas ${horaText(v.horaFim)}, e dela se lavrou a presente acta, que, depois de lida e aprovada, vai ser assinada ${v.assinaturaTodos ? 'por todos os presentes' : 'por quem presidiu e por quem secretariou'}.`,
        en: 'There being no further business, the meeting closed; these minutes were read, approved and signed.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        columns: [
          { role: papelCargo(str(v.presidenteCargo) || 'O Presidente'), name: str(v.presidente) || undefined },
          { role: 'O(A) Secretário(a)', name: str(v.secretario) || undefined },
        ],
      },
    );
    if (v.assinaturaTodos) {
      blocks.push({ type: 'table', grid: true, caption: 'Assinaturas dos presentes', columns: [{ label: 'Nome', width: 60 }, { label: 'Assinatura', width: 40 }], rows: (pres.length ? pres.map((p) => [str(p.nome), ' ']) : Array.from({ length: 6 }, () => [' ', ' '])) });
    }
    return blocks;
  },
});

