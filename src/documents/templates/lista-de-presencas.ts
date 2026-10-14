import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems } from './_shared';
import { fracao, num, str } from './_associacoes';

// Lista de presenças de uma assembleia geral ou reunião: annexed to the acta
// ("fica anexa à presente acta"). Rows tall enough to sign.

export default defineTemplate({
  id: 'lista-de-presencas',
  family: 'mapa',
  sections: [
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'presentes', title: l('Membros', 'Members') },
  ],
  fields: [
    {
      name: 'entidadeTipo',
      type: 'select',
      section: 'reuniao',
      width: 'half',
      label: l('A entidade é', 'The entity is'),
      options: [
        { value: 'associacao', label: l('Associação, clube ou ONG', 'Association, club or NGO') },
        { value: 'sociedade', label: l('Sociedade', 'Company') },
        { value: 'outra', label: l('Outra (formação, reunião)', 'Other (training, meeting)') },
      ],
      default: 'associacao',
    },
    { name: 'entidade', type: 'text', section: 'reuniao', width: 'half', label: l('Entidade', 'Entity'), default: (c) => profileDisplayName(c.profile) },
    { name: 'reuniao', type: 'text', section: 'reuniao', required: true, label: l('Reunião', 'Meeting'), default: 'Assembleia Geral Ordinária' },
    { name: 'data', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'hora', type: 'text', section: 'reuniao', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', label: l('Local', 'Place') },
    {
      name: 'convocacao',
      type: 'radio',
      section: 'reuniao',
      label: l('Convocação', 'Call'),
      options: [
        { value: 'primeira', label: l('Primeira convocação', 'First call') },
        { value: 'segunda', label: l('Segunda convocação', 'Second call') },
        { value: 'omitir', label: l('Não indicar', 'Do not state') },
      ],
      default: 'primeira',
    },
    { name: 'totalMembros', type: 'number', section: 'reuniao', width: 'half', label: l('Total de membros com direito de voto', 'Total voting members'), min: 0 },
    {
      name: 'membros',
      type: 'lines',
      section: 'presentes',
      label: l('Nomes pré-impressos (opcional)', 'Pre-printed names (optional)'),
      help: l('Deixe vazio para imprimir linhas em branco.', 'Leave empty to print blank rows.'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'numero', type: 'text', label: l('N.º de membro / quota', 'Member no. / share') },
      ],
      default: [],
    },
    { name: 'linhasEmBranco', type: 'number', section: 'presentes', width: 'half', label: l('Linhas em branco', 'Blank rows'), default: 20, min: 1, max: 80 },
    { name: 'colunaRepresentacao', type: 'toggle', section: 'presentes', label: l('Coluna «Representado por»', '“Represented by” column'), default: true },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const soc = v.entidadeTipo === 'sociedade';
    const outra = v.entidadeTipo === 'outra';
    const pre = lineItems(v.membros).filter((r) => str(r.nome));
    const extra = Math.max(0, (num(v.linhasEmBranco) ?? 20) - pre.length);
    const nRows = pre.length + (pre.length ? Math.min(extra, 5) : Math.min(80, extra || 20));
    const rep = v.colunaRepresentacao !== false && !outra;
    const conv = v.convocacao === 'segunda' ? 'segunda convocação' : v.convocacao === 'omitir' ? '' : 'primeira convocação';
    const q = ctx.legal.value<{ primeira: number }>('assocQuorum');
    const total = num(v.totalMembros);
    const blocks: Block[] = [
      { type: 'title', text: 'Lista de Presenças', subtitle: [str(v.reuniao) || BLANK, str(v.entidade)].filter(Boolean).join(' — ') },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Data', value: dateLong(v.data) + (str(v.hora) ? `, ${str(v.hora)}` : '') },
          { label: 'Local', value: str(v.localReuniao) || BLANK },
          ...(conv ? [{ label: 'Convocação', value: conv.charAt(0).toUpperCase() + conv.slice(1) }] : []),
          ...(total != null && !outra ? [{ label: soc ? 'Sócios' : 'Membros com direito de voto', value: String(total) }] : []),
        ],
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: outra ? 'Nome' : soc ? 'Nome do sócio' : 'Nome do membro', width: 4 },
          ...(outra ? [{ label: 'Instituição / contacto', width: 2.6 }] : [{ label: soc ? 'Quota / acções' : 'Membro n.º', width: 1.4 }]),
          ...(rep ? [{ label: 'Representado por', width: 2.4 }] : []),
          { label: 'Assinatura', width: 3 },
        ],
        rows: Array.from({ length: nRows }, (_, i) => [String(i + 1), str(pre[i]?.nome), str(pre[i]?.numero), ...(rep ? [''] : []), '']),
      },
      {
        type: 'paragraph',
        id: 'totais',
        text: outra
          ? 'Total de presentes: ______'
          : `Presentes: ______   ·   Representados: ______   ·   Total: ______${total != null ? ` de ${total}` : ''}`,
        en: 'Totals of those present and represented.',
        align: 'left',
        keepWithNext: true,
      },
    ];
    if (!outra && !soc && v.convocacao !== 'segunda') {
      blocks.push({
        type: 'note',
        text: `Em primeira convocação, a assembleia geral de uma associação só pode deliberar com a presença de, pelo menos, ${fracao(q.primeira)} dos associados${total != null ? ` (${Math.ceil(total * q.primeira)} de ${total})` : ''}, salvo regra diferente dos estatutos (${cite('assocQuorum')}).`,
        en: 'On first call an association’s general meeting needs at least half of the members.',
        keepWithNext: true,
      });
    }
    blocks.push({
      type: 'signatures',
      columns: outra
        ? [{ role: 'O(A) Responsável' }]
        : [
            { role: 'O(A) Presidente da Mesa' },
            { role: 'O(A) Secretário(a)' },
          ],
    });
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.reuniao)) w.push({ level: 'warning', field: 'reuniao', message: l('Indique a reunião.', 'Enter the meeting.') });
    return w;
  },
  documentDate: (v) => str(v.data) || undefined,
});
