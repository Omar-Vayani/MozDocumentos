import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, placeDate, splitLines } from './_shared';

// ---------------------------------------------------------------- local helpers

/** Splits the body into paragraphs: by blank lines if there are any, otherwise by line. */
function paragraphs(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) return [];
  const parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

const PARA_OPTIONS = [
  { value: 'todos', label: l('Todos os trabalhadores', 'All staff') },
  { value: 'departamento', label: l('Um departamento ou sector', 'A department or unit') },
  { value: 'outro', label: l('Outros destinatários', 'Other recipients') },
];

const DE_OPTIONS = [
  { value: 'Direcção-Geral', label: l('Direcção-Geral', 'General Management') },
  { value: 'Direcção de Recursos Humanos', label: l('Direcção de Recursos Humanos', 'Human Resources') },
  { value: 'Administração', label: l('Administração', 'Board') },
  { value: 'Direcção', label: l('Direcção', 'Management') },
  { value: 'outro', label: l('Outro', 'Other') },
];

function paraTexto(v: Values): string {
  if (v.paraTipo === 'departamento' || v.paraTipo === 'outro') return String(v.paraTexto ?? '').trim() || BLANK;
  return 'Todos os trabalhadores';
}

function deTexto(v: Values): string {
  if (v.de === 'outro') return String(v.deOutro ?? '').trim() || BLANK;
  return v.de || 'Direcção-Geral';
}

export default defineTemplate({
  id: 'comunicado-interno',
  sections: [
    { id: 'documento', title: l('Número e data', 'Number and date') },
    { id: 'comunicado', title: l('Comunicado', 'Notice') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    {
      name: 'ref',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('Comunicado n.º', 'Notice no.'),
      help: l('Gerado a partir da numeração do perfil. Pode alterar.', 'Generated from the profile numbering. You can change it.'),
      default: (c) => c.nextRef,
    },
    localField(),
    dateField('data', 'documento', l('Data do comunicado', 'Date of the notice')),
    { name: 'paraTipo', type: 'select', section: 'comunicado', width: 'half', label: l('Para', 'To'), options: PARA_OPTIONS, default: 'todos' },
    {
      name: 'paraTexto',
      type: 'text',
      section: 'comunicado',
      width: 'half',
      label: l('Departamento ou destinatários', 'Department or recipients'),
      placeholder: l('Ex.: Departamento de Logística', 'E.g. Logistics Department'),
      showIf: (v) => v.paraTipo !== 'todos',
    },
    { name: 'de', type: 'select', section: 'comunicado', width: 'half', label: l('De', 'From'), options: DE_OPTIONS, default: 'Direcção-Geral' },
    {
      name: 'deOutro',
      type: 'text',
      section: 'comunicado',
      width: 'half',
      label: l('Órgão que emite', 'Issuing department'),
      placeholder: l('Ex.: Direcção Financeira', 'E.g. Finance Department'),
      showIf: (v) => v.de === 'outro',
    },
    {
      name: 'assunto',
      type: 'text',
      section: 'comunicado',
      required: true,
      label: l('Assunto', 'Subject'),
      placeholder: l('Ex.: Horário de trabalho na quadra festiva', 'E.g. Working hours over the festive season'),
    },
    {
      name: 'corpo',
      type: 'textarea',
      section: 'comunicado',
      required: true,
      rows: 8,
      label: l('Texto do comunicado', 'Notice text'),
      help: l(
        'Separe os parágrafos com uma linha em branco. Comece pelo essencial: «Comunica-se a todos os trabalhadores que…», «Informa-se que…».',
        'Separate paragraphs with a blank line. Start with the point: “All staff are informed that…”.',
      ),
    },
    {
      name: 'pontos',
      type: 'textarea',
      section: 'comunicado',
      rows: 4,
      label: l('Pontos a destacar (opcional)', 'Key points (optional)'),
      help: l('Um ponto por linha. Aparecem numerados depois do texto.', 'One point per line. Printed as a numbered list after the text.'),
    },
    {
      name: 'pontosIntro',
      type: 'text',
      section: 'comunicado',
      label: l('Frase antes dos pontos', 'Lead-in to the points'),
      default: 'Para o efeito, deve ser observado o seguinte:',
    },
    {
      name: 'dataVigor',
      type: 'date',
      section: 'comunicado',
      width: 'half',
      label: l('Entrada em vigor (opcional)', 'Effective date (optional)'),
      help: l('Data a partir da qual as medidas se aplicam.', 'Date from which the measures apply.'),
    },
    {
      name: 'afixacao',
      type: 'toggle',
      section: 'comunicado',
      default: true,
      label: l('Indicar que deve ser afixado e divulgado', 'State that it must be posted and circulated'),
    },
    {
      name: 'signatarioNome',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Quem assina', 'Signatory'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.assunto) w.push({ level: 'warning', field: 'assunto', message: l('Indique o assunto do comunicado.', 'Enter the subject.') });
    if (!paragraphs(v.corpo).length) w.push({ level: 'warning', field: 'corpo', message: l('Escreva o texto do comunicado.', 'Write the notice text.') });
    if (v.paraTipo !== 'todos' && !String(v.paraTexto ?? '').trim()) {
      w.push({ level: 'warning', field: 'paraTexto', message: l('Indique o departamento ou os destinatários.', 'Enter the department or recipients.') });
    }
    if (v.dataVigor && v.data && diffDays(v.data, v.dataVigor) < 0) {
      w.push({
        level: 'warning',
        field: 'dataVigor',
        message: l('A data de entrada em vigor é anterior à data do comunicado.', 'The effective date is before the date of the notice.'),
      });
    }
    if (!v.signatarioNome) w.push({ level: 'info', field: 'signatarioNome', message: l('Indique quem assina o comunicado.', 'Enter who signs the notice.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const corpo = paragraphs(v.corpo);
    const pontos = splitLines(v.pontos);
    const orgao = deTexto(v);

    const blocks: Block[] = [
      { type: 'title', text: 'Comunicado Interno', subtitle: `N.º ${v.ref || BLANK}` },
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: 'Para', value: paraTexto(v) },
          { label: 'De', value: orgao },
          { label: 'Data', value: dateLong(v.data) },
          { label: 'Assunto', value: v.assunto || BLANK },
        ],
      },
    ];

    if (corpo.length) corpo.forEach((text, i) => blocks.push({ type: 'paragraph', id: `corpo-${i + 1}`, text }));
    else blocks.push({ type: 'paragraph', id: 'corpo-1', text: BLANK });

    if (pontos.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'pontosIntro',
          text: String(v.pontosIntro || 'Para o efeito, deve ser observado o seguinte:').trim(),
          en: 'The following must be observed:',
          keepWithNext: true,
        },
        { type: 'list', style: 'numeric', items: pontos.map(endDot) },
      );
    }

    const tail: Block[] = [];
    if (v.dataVigor) {
      tail.push({
        type: 'paragraph',
        id: 'vigor',
        text: `O presente comunicado entra em vigor em **${dateLong(v.dataVigor)}**.`,
        en: `This notice takes effect on ${v.dataVigor}.`,
      });
    }
    if (v.afixacao) {
      tail.push({
        type: 'paragraph',
        id: 'afixacao',
        text: 'Este comunicado deve ser afixado nos locais habituais e dado a conhecer a todos os trabalhadores abrangidos, a quem se solicita o seu cumprimento.',
        en: 'This notice must be posted in the usual places and brought to the attention of all staff concerned, who are asked to comply with it.',
      });
    }
    if (tail.length) {
      tail[tail.length - 1].keepWithNext = true;
      blocks.push(...tail);
    } else {
      const last = blocks[blocks.length - 1];
      if (last.type === 'paragraph' || last.type === 'list') last.keepWithNext = true;
    }

    blocks.push({
      type: 'signatures',
      placeDate: placeDate(ctx, v.data),
      columns: [
        {
          role: v.signatarioCargo ? String(v.signatarioCargo) : `A ${orgao === BLANK ? 'Direcção' : orgao}`,
          name: v.signatarioNome || undefined,
          image: 'both',
        },
      ],
    });
    return blocks;
  },
});
