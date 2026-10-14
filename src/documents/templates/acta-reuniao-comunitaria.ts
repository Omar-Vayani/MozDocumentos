// Acta de reunião comunitária: minutes of a meeting of the population of a
// bairro or povoação (or its advisory council), with attendance counted by men
// and women, the authorities present, statements and decisions, and an optional
// attendance list to sign. Consultations for land titling follow the official
// procedure instead.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, g, l, lineItems, localField } from './_shared';
import { dataPorExtenso, endDot, hora, paragraphs, stripNumber } from './_estado';
import { comunidadeWarnings, str, unidadeField } from './_comunidade';

const TERRA = /\bDUAT\b|consulta comunit|pedido de terra|atribui[cç][aã]o de terra|titula[cç][aã]o/i;

export default defineTemplate({
  id: 'acta-reuniao-comunitaria',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Reunião', 'Meeting') },
    { id: 'presencas', title: l('Presenças', 'Attendance') },
    { id: 'pontos', title: l('Agenda e decisões', 'Agenda and decisions') },
    { id: 'assinatura', title: l('Assinaturas e lista de presenças', 'Signatures and attendance list') },
  ],
  fields: [
    { name: 'numeroActa', type: 'text', section: 'documento', width: 'half', label: l('Acta n.º', 'Minutes no.') },
    {
      name: 'natureza',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Natureza', 'Type'),
      options: [
        { value: 'ordinária', label: l('Ordinária', 'Ordinary') },
        { value: 'extraordinária', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinária',
    },
    {
      name: 'orgao',
      type: 'text',
      section: 'documento',
      label: l('Reunião de', 'Meeting of'),
      default: 'da população',
      placeholder: l('Ex.: da população / do Conselho Consultivo de Povoação / dos chefes de quarteirão', 'E.g. the population / the advisory council'),
    },
    unidadeField(),
    localField(),
    dateField('data', 'documento', l('Data da reunião', 'Meeting date')),
    { name: 'horaInicio', type: 'text', section: 'documento', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'horaFim', type: 'text', section: 'documento', width: 'half', label: l('Hora de encerramento', 'End time') },
    { name: 'localReuniao', type: 'text', section: 'documento', label: l('Local', 'Venue'), placeholder: l('Ex.: no campo da Escola Primária Completa de Malhangalene', 'E.g. at the primary school field') },
    { name: 'convocadaPor', type: 'text', section: 'documento', width: 'half', label: l('Convocada por', 'Called by'), placeholder: l('Ex.: Secretária do Bairro', 'E.g. Neighbourhood Secretary') },
    { name: 'presidenteNome', type: 'text', section: 'documento', width: 'half', label: l('Quem dirigiu a reunião', 'Chaired by'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : '') },
    { name: 'presidenteCargo', type: 'text', section: 'documento', width: 'half', label: l('Cargo de quem dirigiu', 'Chair’s position'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : '') },
    { name: 'presidenteGenero', type: 'radio', section: 'documento', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'secretarioNome', type: 'text', section: 'documento', width: 'half', label: l('Quem redigiu a acta', 'Minutes taken by') },
    { name: 'secretarioGenero', type: 'radio', section: 'documento', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'homens', type: 'number', section: 'presencas', width: 'third', min: 0, label: l('Homens', 'Men') },
    { name: 'mulheres', type: 'number', section: 'presencas', width: 'third', min: 0, label: l('Mulheres', 'Women') },
    { name: 'jovens', type: 'number', section: 'presencas', width: 'third', min: 0, label: l('Dos quais jovens (opcional)', 'Of whom youth (optional)') },
    {
      name: 'autoridades',
      type: 'textarea',
      section: 'presencas',
      rows: 2,
      label: l('Autoridades e convidados presentes', 'Authorities and guests present'),
      placeholder: l('Um por linha. Ex.: Chefe do Posto Administrativo; Comandante da 7.ª Esquadra da PRM', 'One per line'),
    },
    { name: 'linguas', type: 'text', section: 'presencas', width: 'half', label: l('Línguas usadas', 'Languages used'), default: 'português', placeholder: l('Ex.: português e changana', 'E.g. Portuguese and Changana') },
    {
      name: 'pontos',
      type: 'lines',
      section: 'pontos',
      required: true,
      label: l('Pontos da agenda', 'Agenda items'),
      help: l('Para cada ponto: o que se discutiu (quem interveio) e o que se decidiu.', 'For each item: what was discussed (who spoke) and what was decided.'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [
        { name: 'titulo', type: 'text', label: l('Ponto', 'Item') },
        { name: 'discussao', type: 'textarea', label: l('Discussão e intervenções', 'Discussion') },
        { name: 'decisao', type: 'textarea', label: l('Decisão', 'Decision') },
      ],
      default: [],
    },
    { name: 'listaPresencas', type: 'toggle', section: 'assinatura', label: l('Juntar folha de lista de presenças para assinar', 'Add an attendance sheet to sign'), default: true },
    { name: 'linhasEmBranco', type: 'number', section: 'assinatura', width: 'half', min: 5, max: 60, label: l('Linhas na lista de presenças', 'Rows on the attendance sheet'), default: 25, showIf: (v) => !!v.listaPresencas },
    {
      name: 'representantes',
      type: 'lines',
      section: 'assinatura',
      label: l('Representantes da comunidade que também assinam (opcional)', 'Community representatives who also sign (optional)'),
      addLabel: l('Adicionar representante', 'Add representative'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'qualidade', type: 'text', label: l('Qualidade', 'Capacity') },
      ],
      default: [],
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings({ ...v, assinanteNome: v.presidenteNome }, ctx).filter((x) => x.field !== 'assinanteNome');
    const txt = `${str(v.orgao)} ${lineItems(v.pontos).map((p) => `${str(p.titulo)} ${str(p.discussao)}`).join(' ')}`;
    if (TERRA.test(txt)) {
      w.push({
        level: 'error',
        message: l(
          `A consulta comunitária para atribuição de DUAT segue o procedimento oficial (${cite('consultaComunitariaDuat')}): a acta é assinada pelos Conselhos Consultivos e segue o modelo dos Serviços de Cadastro. Não use esta acta para esse fim.`,
          'Community consultation for land titling follows the official procedure and the cadastre services’ form. Do not use these minutes for that purpose.',
        ),
      });
    }
    if (!str(v.homens) && !str(v.mulheres)) w.push({ level: 'info', field: 'homens', message: l('Indique quantos homens e mulheres participaram: muitas entidades pedem este dado.', 'State how many men and women attended: many bodies ask for it.') });
    if (v.listaPresencas) w.push({ level: 'info', message: l('A lista de presenças contém dados pessoais: guarde-a na secretaria e não a partilhe fora das estruturas autorizadas.', 'The attendance list holds personal data: keep it at the office and do not share it.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const unidade = str(v.unidade);
    const doUnid = unidade ? `${/^(Povoação|Aldeia|Localidade|Comunidade)/i.test(unidade) ? 'da' : 'do'} ${unidade}` : '';
    const orgao = str(v.orgao) || 'da população';
    const pontos = lineItems(v.pontos).filter((p) => str(p.titulo) || str(p.discussao) || str(p.decisao));
    const agenda = pontos.map((p) => endDot(stripNumber(str(p.titulo) || BLANK)).replace(/\.$/, ''));
    const sala = str(v.localReuniao).replace(/[.,;]+$/, '');
    const onde = sala ? (/^(na|no|em|junto)\s/i.test(sala) ? sala : `em ${sala}`) : `em ${ctx.place}`;
    const pres = str(v.presidenteNome) || BLANK;
    const sec = str(v.secretarioNome) || BLANK;
    const h = Number(v.homens) || 0;
    const m = Number(v.mulheres) || 0;
    const j = Number(v.jovens) || 0;
    const autoridades = paragraphs(v.autoridades).flatMap((x) => x.split(/\n|;\s*/)).map((x) => x.trim().replace(/[.;]$/, '')).filter(Boolean);
    const numero = str(v.numeroActa);

    const blocks: Block[] = [
      { type: 'title', text: `Acta n.º ${numero || '____'}${numero && !numero.includes('/') ? `/${(str(v.data) || ctx.today).slice(0, 4)}` : ''}`, subtitle: `Reunião ${str(v.natureza) || 'ordinária'} ${orgao} ${doUnid}`.trim() },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.horaInicio, 'pelas')}, ${onde}, realizou-se a reunião ${str(v.natureza) || 'ordinária'} ${orgao} ${doUnid}${str(v.convocadaPor) ? `, convocada ${/^(a|o)\s/i.test(str(v.convocadaPor)) ? 'por ' : 'pelo(a) '}${str(v.convocadaPor)}` : ''}, sob a direcção ${g(v.presidenteGenero, 'do Senhor', 'da Senhora')} **${pres}**${str(v.presidenteCargo) ? `, ${str(v.presidenteCargo)}` : ''}${autoridades.length ? `, com a presença de: ${autoridades.join('; ')}` : ''}, com a seguinte ordem de trabalhos:`.replace(/\s+,/g, ','),
        keepWithNext: true,
        en: 'Opening: date, time, place, who called and chaired the meeting, authorities present and the agenda.',
      },
      { type: 'list', style: 'numeric', items: (agenda.length ? agenda : [BLANK]).map((a, i, arr) => `${a}${i === arr.length - 1 ? '.' : ';'}`) },
      {
        type: 'paragraph',
        id: 'presencas',
        text: `Estiveram presentes ${h + m > 0 ? `${h + m} pessoas, sendo ${h} ${h === 1 ? 'homem' : 'homens'} e ${m} ${m === 1 ? 'mulher' : 'mulheres'}${j ? `, dos quais ${j} jovens` : ''}` : `${BLANK} pessoas`}${v.listaPresencas ? ', conforme lista de presenças anexa' : ''}. A reunião decorreu em ${str(v.linguas) || 'português'}.`,
        en: 'Attendance by men and women, and the languages used.',
      },
    ];

    pontos.forEach((p, i) => {
      blocks.push({ type: 'heading', text: `Ponto ${i + 1} — ${stripNumber(str(p.titulo)) || BLANK}` });
      const ps = paragraphs(p.discussao);
      ps.forEach((t, k) => blocks.push({ type: 'paragraph', id: `ponto-${i + 1}-${k + 1}`, text: t, en: 'Summary of the discussion.' }));
      if (str(p.decisao)) blocks.push({ type: 'paragraph', id: `decisao-${i + 1}`, text: `**Decisão:** ${endDot(str(p.decisao).replace(/\s*\n+\s*/g, ' '))}`, en: 'Decision taken.' });
      if (!ps.length && !str(p.decisao)) blocks.push({ type: 'paragraph', id: `ponto-${i + 1}-1`, text: BLANK, en: 'Summary of the discussion.' });
    });

    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `Nada mais havendo a tratar, foi encerrada a reunião ${hora(v.horaFim, 'pelas')}, da qual se lavrou a presente acta que, depois de lida em voz alta e aprovada, vai ser assinada por quem dirigiu a reunião e por mim, ${sec}, que a redigi.`,
        keepWithNext: true,
        en: 'Closing: the minutes were read aloud, approved and signed by the chair and the person who drafted them.',
      },
      {
        type: 'signatures',
        columns: [
          { role: g(v.presidenteGenero, 'O Presidente da reunião', 'A Presidente da reunião'), name: str(v.presidenteNome) || undefined, detail: str(v.presidenteCargo) || undefined, image: 'both' },
          { role: g(v.secretarioGenero, 'O Secretário da reunião', 'A Secretária da reunião'), name: str(v.secretarioNome) || undefined },
        ],
      },
    );
    const reps = lineItems(v.representantes).filter((r) => str(r.nome));
    for (let i = 0; i < reps.length; i += 3) {
      blocks.push({ type: 'signatures', columns: reps.slice(i, i + 3).map((r) => ({ role: str(r.qualidade) || 'Representante da comunidade', name: str(r.nome) })) });
    }
    if (v.listaPresencas) {
      const n = Math.min(Math.max(Number(v.linhasEmBranco) || 25, 5), 60);
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'heading', text: `Lista de Presenças — Acta n.º ${numero || '____'}`, align: 'center' },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'center' },
            { label: 'Nome', width: 3.4 },
            { label: 'Sexo', width: 0.7, align: 'center' },
            { label: 'BI / contacto', width: 1.8 },
            { label: 'Assinatura', width: 2.2 },
          ],
          rows: Array.from({ length: n }, (_x, i) => [String(i + 1), ' ', ' ', ' ', ' ']),
        },
      );
    }
    return blocks;
  },
});
