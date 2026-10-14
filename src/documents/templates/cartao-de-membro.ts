import { formatMonthYear } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { l } from './_shared';
import { entidadeNome, naturezaField, naturezaOf, str } from './_associacoes';

// Cartão de membro, 85 × 55 mm, ten per A4 sheet with cutting marks. One
// member per document (ten copies), or blank cards to fill in by hand.

const LINHA = '______________________________';

export default defineTemplate({
  id: 'cartao-de-membro',
  family: 'carta',
  page: 'cartao',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'entidade', title: l('Entidade', 'Organisation') },
    { id: 'membro', title: l('Membro', 'Member'), personRole: 'outro' },
  ],
  fields: [
    naturezaField('entidade'),
    { name: 'entidadeNome', type: 'text', section: 'entidade', label: l('Nome no cartão', 'Name on the card'), help: l('Use a sigla ou o nome curto se o nome for longo.', 'Use the acronym or short name if it is long.'), default: (c) => c.profile?.sigla || c.profile?.nomeComercial || c.profile?.firma || '' },
    { name: 'mostrarLogo', type: 'toggle', section: 'entidade', label: l('Mostrar o logótipo do perfil', 'Show the profile logo'), default: true },
    { name: 'assinante', type: 'text', section: 'entidade', width: 'half', label: l('Cargo de quem assina', 'Signatory position'), default: (c) => c.profile?.representanteCargo || 'O Presidente' },
    { name: 'emBranco', type: 'toggle', section: 'membro', label: l('Cartões em branco (preencher à mão)', 'Blank cards (fill in by hand)'), default: false },
    { name: 'membroNome', type: 'text', section: 'membro', label: l('Nome do membro', 'Member name'), personKey: 'nome', showIf: (v) => !v.emBranco },
    { name: 'numero', type: 'text', section: 'membro', width: 'half', label: l('N.º de membro', 'Member no.'), showIf: (v) => !v.emBranco },
    { name: 'categoria', type: 'text', section: 'membro', width: 'half', label: l('Categoria', 'Category'), default: 'Membro efectivo', showIf: (v) => !v.emBranco },
    { name: 'validade', type: 'month', section: 'membro', width: 'half', label: l('Válido até', 'Valid until') },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const n = naturezaOf(v);
    const b = Boolean(v.emBranco);
    const nome = str(v.entidadeNome) || entidadeNome(ctx);
    const titulo = n === 'clube' ? 'Cartão de Sócio' : 'Cartão de Membro';
    const blocks: Block[] = [];
    if (v.mostrarLogo !== false) blocks.push({ type: 'logo', size: 'sm' });
    blocks.push(
      { type: 'display', text: nome, size: 'sm', weight: 'bold', tone: 'accent', uppercase: true, fit: true, after: 1 },
      { type: 'ornament', style: 'tricolour', width: 'short' },
      { type: 'display', text: titulo, size: 'xs', tone: 'muted', uppercase: true, after: 2 },
    );
    if (b) {
      blocks.push(
        { type: 'display', text: `Nome: ${LINHA}`, size: 'xs', align: 'left', after: 2 },
        { type: 'display', text: 'N.º ________   Categoria: ______________', size: 'xs', align: 'left', after: 2 },
      );
    } else {
      blocks.push(
        { type: 'display', text: str(v.membroNome) || LINHA, size: 'lg', weight: 'bold', fit: true, after: 1 },
        { type: 'display', text: [str(v.numero) ? `N.º ${str(v.numero)}` : 'N.º ______', str(v.categoria)].filter(Boolean).join('   ·   '), size: 'sm', after: 3 },
      );
    }
    blocks.push({
      type: 'display',
      text: `${str(v.validade) ? `Válido até ${formatMonthYear(`${v.validade}-01`)}` : 'Válido até ____/______'}      ${str(v.assinante) || 'O Presidente'}: __________`,
      size: 'xs',
      tone: 'muted',
      after: 0,
    });
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (str(v.entidadeNome).length > 40) w.push({ level: 'warning', field: 'entidadeNome', message: l('Nome longo: use a sigla para caber no cartão.', 'Long name: use the acronym to fit the card.') });
    if (!v.emBranco && !str(v.membroNome)) w.push({ level: 'warning', field: 'membroNome', message: l('Indique o nome do membro ou escolha cartões em branco.', 'Enter the member name or choose blank cards.') });
    w.push({ level: 'info', message: l('Imprime dez cartões iguais numa folha A4, com marcas de corte.', 'Prints ten identical cards on one A4 sheet, with cutting marks.') });
    return w;
  },
  personName: (v) => (v.emBranco ? undefined : str(v.membroNome) || undefined),
});
