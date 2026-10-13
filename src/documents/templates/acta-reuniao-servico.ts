// Acta de reunião de serviço: minutes of a public body's management board,
// advisory or technical council, with the matrix of decisions (who does what
// and by when) usual in Mozambican public administration.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, dateLong, g, l, lineItems, localField, splitLines } from './_shared';
import { daOuDo, dataPorExtenso, endDot, estadoWarnings, hora, paragraphs, str, stripNumber } from './_estado';

export default defineTemplate({
  id: 'acta-reuniao-servico',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Acta', 'Minutes') },
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'presencas', title: l('Presenças', 'Attendance') },
    { id: 'pontos', title: l('Agenda e discussão', 'Agenda and discussion') },
    { id: 'decisoes', title: l('Decisões e recomendações', 'Decisions and recommendations') },
    { id: 'assinatura', title: l('Encerramento e assinaturas', 'Closing and signatures') },
  ],
  fields: [
    { name: 'numeroActa', type: 'text', section: 'documento', width: 'half', label: l('Acta n.º', 'Minutes no.'), default: (c) => `${/(\d+)\s*$/.exec(c.nextRef)?.[1] ?? '01'}/${c.today.slice(0, 4)}` },
    localField(),
    dateField('data', 'documento', l('Data da reunião', 'Meeting date')),
    {
      name: 'orgao',
      type: 'text',
      section: 'reuniao',
      required: true,
      label: l('Órgão', 'Body'),
      placeholder: l('Ex.: Colectivo de Direcção da Direcção Provincial de Saúde de Nampula', 'E.g. Management Board of the Provincial Health Directorate'),
    },
    {
      name: 'natureza',
      type: 'radio',
      section: 'reuniao',
      width: 'half',
      label: l('Sessão', 'Session'),
      options: [
        { value: 'ordinária', label: l('Ordinária', 'Ordinary') },
        { value: 'extraordinária', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinária',
    },
    { name: 'localReuniao', type: 'text', section: 'reuniao', width: 'half', label: l('Sala / local', 'Room / venue'), placeholder: l('Ex.: Sala de Reuniões da Direcção', 'E.g. Directorate meeting room') },
    { name: 'horaInicio', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'horaFim', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de encerramento', 'End time'), placeholder: l('Ex.: 12:30', 'E.g. 12:30') },
    { name: 'presidenteNome', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Quem presidiu', 'Chaired by'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'presidenteGenero', type: 'radio', section: 'reuniao', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'presidenteCargo', type: 'text', section: 'reuniao', width: 'half', label: l('Cargo de quem presidiu', 'Chair’s position'), default: (c) => c.profile?.representanteCargo ?? '' },
    { name: 'secretarioNome', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Quem secretariou', 'Secretary') },
    { name: 'secretarioGenero', type: 'radio', section: 'reuniao', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'secretarioCargo', type: 'text', section: 'reuniao', width: 'half', label: l('Cargo de quem secretariou', 'Secretary’s position') },
    {
      name: 'participantes',
      type: 'lines',
      section: 'presencas',
      label: l('Participantes', 'Participants'),
      addLabel: l('Adicionar participante', 'Add participant'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo / unidade', 'Position / unit') },
      ],
      default: [],
    },
    { name: 'ausencias', type: 'textarea', section: 'presencas', rows: 2, label: l('Ausências justificadas (opcional)', 'Apologies (optional)'), help: l('Um nome por linha, com o motivo se quiser.', 'One name per line, with the reason if you wish.') },
    {
      name: 'pontos',
      type: 'lines',
      section: 'pontos',
      label: l('Pontos da agenda', 'Agenda items'),
      addLabel: l('Adicionar ponto', 'Add item'),
      help: l('Para cada ponto, o título e um resumo do que foi apresentado e discutido.', 'For each item, the title and a summary of what was presented and discussed.'),
      columns: [
        { name: 'titulo', type: 'text', label: l('Ponto', 'Item') },
        { name: 'discussao', type: 'textarea', label: l('Resumo da discussão', 'Summary of discussion') },
      ],
      default: [{ titulo: 'Leitura e aprovação da acta da reunião anterior', discussao: '' }],
    },
    {
      name: 'decisoes',
      type: 'lines',
      section: 'decisoes',
      label: l('Decisões e recomendações', 'Decisions and recommendations'),
      addLabel: l('Adicionar decisão', 'Add decision'),
      help: l('Cada decisão com o responsável pela execução e o prazo.', 'Each decision with who carries it out and the deadline.'),
      columns: [
        { name: 'decisao', type: 'text', label: l('Decisão / recomendação', 'Decision / recommendation') },
        { name: 'responsavel', type: 'text', label: l('Responsável', 'Responsible') },
        { name: 'prazo', type: 'text', label: l('Prazo', 'Deadline') },
      ],
      default: [],
    },
    { name: 'dataExtenso', type: 'toggle', section: 'assinatura', label: l('Data por extenso na abertura', 'Date in words in the opening'), default: true },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!lineItems(v.pontos).some((p) => str(p.titulo))) w.push({ level: 'warning', field: 'pontos', message: l('Indique os pontos da agenda.', 'Enter the agenda items.') });
    if (!str(v.secretarioNome)) {
      w.push({ level: 'info', field: 'secretarioNome', message: l(`A acta é assinada por quem presidiu e por quem secretariou (${cite('actasOrgaosColegiais')}).`, 'The minutes are signed by the chair and the secretary.') });
    }
    return w;
  },

  personName: (v) => v.orgao,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const orgao = str(v.orgao) || BLANK;
    const pres = { nome: str(v.presidenteNome) || BLANK, cargo: str(v.presidenteCargo) };
    const sec = { nome: str(v.secretarioNome) || BLANK, cargo: str(v.secretarioCargo) };
    const pontos = lineItems(v.pontos).filter((p) => str(p.titulo) || str(p.discussao));
    const abertura = v.dataExtenso === false ? `No dia ${dateLong(v.data)}` : dataPorExtenso(v.data);
    const sala = str(v.localReuniao).replace(/[.,;]+$/, '');
    const onde = sala ? (/^(na|no|em|por)\s/i.test(sala) ? sala : `na ${sala}`) : `em ${ctx.place}`;
    const agenda = pontos.map((p) => endDot(stripNumber(str(p.titulo) || BLANK)).replace(/\.$/, ''));

    const blocks: Block[] = [
      { type: 'title', text: `Acta n.º ${str(v.numeroActa) || '____'}`, subtitle: `Reunião ${str(v.natureza) || 'ordinária'} ${daOuDo(orgao)}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${abertura}, ${hora(v.horaInicio, 'pelas')}, ${onde}, realizou-se a reunião ${str(v.natureza) || 'ordinária'} ${daOuDo(orgao)}, sob a direcção ${g(v.presidenteGenero, 'do Senhor', 'da Senhora')} **${pres.nome}**${pres.cargo ? `, ${pres.cargo}` : ''}, com a seguinte agenda:`,
        keepWithNext: true,
        en: 'Opening: date, time, place, body meeting and chair, followed by the agenda.',
      },
      { type: 'list', style: 'numeric', items: (agenda.length ? agenda : [BLANK]).map((a, i, arr) => `${a}${i === arr.length - 1 ? '.' : ';'}`) },
    ];

    const part = lineItems(v.participantes).filter((p) => str(p.nome));
    if (part.length) {
      blocks.push(
        { type: 'heading', text: 'Participantes' },
        { type: 'table', columns: [{ label: 'N.º', width: 0.08, align: 'center' }, { label: 'Nome', width: 0.46 }, { label: 'Cargo / unidade', width: 0.46 }], rows: part.map((p, i) => [String(i + 1), str(p.nome), str(p.cargo)]) },
      );
    }
    const aus = splitLines(v.ausencias);
    if (aus.length) blocks.push({ type: 'paragraph', id: 'ausencias', text: `**Ausências justificadas:** ${aus.join('; ')}.`, align: 'left', en: 'Apologies for absence.' });

    pontos.forEach((p, i) => {
      blocks.push({ type: 'heading', text: `Ponto ${i + 1} — ${stripNumber(str(p.titulo)) || BLANK}` });
      const ps = paragraphs(p.discussao);
      (ps.length ? ps : [BLANK]).forEach((t, j) => blocks.push({ type: 'paragraph', id: `ponto-${i + 1}-${j + 1}`, text: t, en: 'Summary of the discussion of the item.' }));
    });

    const dec = lineItems(v.decisoes).filter((d) => str(d.decisao));
    if (dec.length) {
      blocks.push(
        { type: 'heading', text: 'Decisões e recomendações' },
        {
          type: 'table',
          columns: [{ label: 'N.º', width: 0.07, align: 'center' }, { label: 'Decisão / recomendação', width: 0.53 }, { label: 'Responsável', width: 0.24 }, { label: 'Prazo', width: 0.16 }],
          rows: dec.map((d, i) => [String(i + 1), str(d.decisao), str(d.responsavel), str(d.prazo)]),
        },
      );
    }

    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `Nada mais havendo a tratar, ${g(v.presidenteGenero, 'o Senhor', 'a Senhora')} ${pres.nome} deu por encerrada a reunião ${hora(v.horaFim, 'pelas')}, da qual se lavrou a presente acta que, depois de lida e aprovada, vai ser assinada por quem presidiu e por mim, ${sec.nome}, que a secretariei.`,
        keepWithNext: true,
        en: 'Closing: the chair closed the meeting; these minutes were read, approved and signed by the chair and the secretary.',
      },
      {
        type: 'signatures',
        columns: [
          { role: g(v.presidenteGenero, 'O Presidente da Reunião', 'A Presidente da Reunião'), name: pres.nome === BLANK ? undefined : pres.nome, detail: pres.cargo || undefined },
          { role: g(v.secretarioGenero, 'O Secretário', 'A Secretária'), name: sec.nome === BLANK ? undefined : sec.nome, detail: sec.cargo || undefined },
        ],
      },
    );
    return blocks;
  },
});
