import { formatMonthYear } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { dateLong, g, GENERO_OPTIONS, l } from './_shared';
import { clip, disp, str, cardScale } from './_eventos';

// Thank-you card, A6 (four per A4). A large italic "Obrigado" (or a sober
// "Agradecimento" heading in black for mourning), the message and the names.

const TIPOS = ['luto', 'casamento', 'festa', 'empresa', 'geral'] as const;

function mensagemPadrao(tipo: string): string {
  switch (tipo) {
    case 'casamento':
      return 'Agradecemos do coração a vossa presença e o carinho com que celebraram connosco o nosso casamento.';
    case 'festa':
      return 'Obrigado por terem partilhado comigo este dia especial. A vossa presença e as vossas palavras tornaram a celebração inesquecível.';
    case 'empresa':
      return 'Agradecemos a V. Ex.ª a presença e o contributo para o êxito do nosso evento.';
    case 'geral':
      return 'Obrigado pela sua generosidade e apoio.';
    default:
      return '';
  }
}

export default defineTemplate({
  id: 'cartao-de-agradecimento',
  family: 'declaracao',
  page: 'A6',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: (v) => ({ font: 'classico', mono: v.tipo === 'luto' }),
  frame: 'simple',
  sections: [
    { id: 'cartao', title: l('Cartão', 'Card') },
    { id: 'luto', title: l('Pessoa falecida', 'The deceased') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'cartao',
      label: l('Ocasião', 'Occasion'),
      options: [
        { value: 'luto', label: l('Luto (depois do funeral)', 'Bereavement (after a funeral)') },
        { value: 'casamento', label: l('Casamento', 'Wedding') },
        { value: 'festa', label: l('Aniversário ou festa', 'Birthday or party') },
        { value: 'empresa', label: l('Evento da empresa', 'Company event') },
        { value: 'geral', label: l('Geral', 'General') },
      ],
      default: 'casamento',
    },
    { name: 'falecidoNome', type: 'text', section: 'luto', label: l('Nome', 'Name'), showIf: (v) => v.tipo === 'luto' },
    { name: 'falecidoGenero', type: 'radio', section: 'luto', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.tipo === 'luto' },
    { name: 'dataFalecimento', type: 'date', section: 'luto', width: 'half', label: l('Data do falecimento', 'Date of death'), showIf: (v) => v.tipo === 'luto' },
    {
      name: 'titulo',
      type: 'text',
      section: 'cartao',
      label: l('Título (opcional)', 'Heading (optional)'),
      help: l('Vazio: "Obrigado", ou "Agradecimento" no luto e nos eventos da empresa.', 'Empty: "Obrigado", or "Agradecimento" for bereavement and company events.'),
    },
    {
      name: 'mensagem',
      type: 'textarea',
      section: 'cartao',
      rows: 3,
      label: l('Mensagem', 'Message'),
      help: l('Vazio: usa um texto adequado à ocasião.', 'Empty: uses a text suited to the occasion.'),
    },
    {
      name: 'assinatura',
      type: 'text',
      section: 'cartao',
      required: true,
      label: l('Assinado por', 'Signed by'),
      placeholder: l('Ana e Carlos / A Família Sitoe', 'Ana and Carlos / The Sitoe family'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : c.profile?.nome ?? ''),
    },
    { name: 'local', type: 'text', section: 'cartao', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'cartao', width: 'half', label: l('Data (mês)', 'Date (month)'), default: (c) => c.today },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = (TIPOS as readonly string[]).includes(str(v.tipo)) ? str(v.tipo) : 'geral';
    const luto = tipo === 'luto';
    const formal = luto || tipo === 'empresa';
    const titulo = str(v.titulo) || (formal ? 'Agradecimento' : 'Obrigado');
    const msg =
      clip(str(v.mensagem).replace(/\s*\n\s*/g, ' '), 420) ||
      (luto
        ? `A família de ${str(v.falecidoNome) || '____________________'}, ${g(v.falecidoGenero, 'falecido', 'falecida')} no dia ${dateLong(v.dataFalecimento)}, profundamente sensibilizada, agradece a todos os que a acompanharam neste momento de dor, estiveram presentes nas cerimónias fúnebres ou, de alguma forma, lhe manifestaram o seu apoio e amizade.`
        : mensagemPadrao(tipo));
    const out: Block[] = [];
    if (formal) {
      if (tipo === 'empresa') out.push({ type: 'logo', size: 'sm' });
      out.push(disp(titulo, 'md', { uppercase: true, tone: luto ? 'text' : 'accent', after: 4 }));
      out.push({ type: 'ornament', style: luto ? 'cross' : 'rule' });
    } else {
      out.push(disp(titulo, 'xxl', { italic: true, tone: 'accent', fit: true, after: 2 }));
      out.push({ type: 'ornament', style: 'rule' });
    }
    out.push(disp(msg, 'sm', { italic: !formal, after: 8 }));
    out.push(disp(str(v.assinatura) || '____________________', 'sm', { italic: true, weight: formal ? 'bold' : 'normal', fit: true, after: 2 }));
    out.push(disp([str(v.local), formatMonthYear(str(v.data), '')].filter(Boolean).join(', '), 'xs', { tone: 'muted', after: 0 }));
    return cardScale(out);
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.tipo === 'luto' && !str(v.falecidoNome) && !str(v.mensagem))
      out.push({ level: 'warning', field: 'falecidoNome', message: l('Indique o nome da pessoa falecida.', 'Give the name of the deceased.') });
    if (str(v.mensagem).length > 420)
      out.push({ level: 'warning', field: 'mensagem', message: l('Mensagem longa para um cartão A6: só cabem cerca de 420 caracteres. Encurte-a.', 'Long message for an A6 card: about 420 characters fit. Shorten it.') });
    return out;
  },
  personName: (v) => str(v.assinatura) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
