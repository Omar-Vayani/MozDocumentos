import { formatMonthYear } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, placeDate } from './_shared';
import { daEntidade, entidadeNome, naturezaField, naturezaOf, pessoaFields, semPonto, signatarioFields, str, deNome } from './_associacoes';

// Declaração de que uma pessoa é membro de uma associação, clube, ONG ou
// igreja (for a bank, school, embassy, scholarship, employer…).

const CATEGORIA_OPTIONS = [
  { value: 'efectivo', label: l('Membro efectivo', 'Full member') },
  { value: 'fundador', label: l('Membro fundador', 'Founding member') },
  { value: 'honorário', label: l('Membro honorário', 'Honorary member') },
  { value: 'simples', label: l('Membro (sem categoria)', 'Member (no category)') },
];

export default defineTemplate({
  id: 'declaracao-de-membro',
  family: 'declaracao',
  sections: [
    { id: 'entidade', title: l('Entidade', 'Organisation') },
    { id: 'membro', title: l('Membro', 'Member'), personRole: 'outro' },
    { id: 'detalhes', title: l('Detalhes', 'Details') },
    { id: 'documento', title: l('Data e assinatura', 'Date and signature') },
  ],
  fields: [
    naturezaField('entidade'),
    ...pessoaFields('membro', 'membro', ['nome', 'genero', 'nacionalidade', 'doc']),
    { name: 'categoria', type: 'select', section: 'detalhes', width: 'half', label: l('Categoria', 'Category'), options: CATEGORIA_OPTIONS, default: 'efectivo' },
    { name: 'numeroMembro', type: 'text', section: 'detalhes', width: 'half', label: l('N.º de membro (opcional)', 'Member no. (optional)') },
    { name: 'desde', type: 'date', section: 'detalhes', width: 'half', required: true, label: l('Membro desde', 'Member since') },
    { name: 'quotasAte', type: 'month', section: 'detalhes', width: 'half', label: l('Quotas pagas até (opcional)', 'Dues paid up to (optional)') },
    { name: 'cargo', type: 'text', section: 'detalhes', label: l('Cargo que exerce (opcional)', 'Current position (optional)'), placeholder: l('Ex.: Tesoureiro da Direcção / Diácono', 'E.g. Treasurer of the board / Deacon') },
    { name: 'participacao', type: 'toggle', section: 'detalhes', label: l('Acrescentar «participa regularmente nas actividades»', 'Add “takes part regularly in activities”'), default: true },
    { name: 'finalidade', type: 'text', section: 'detalhes', required: true, label: l('Para que serve', 'Purpose'), placeholder: l('Ex.: instruir pedido de visto junto da Embaixada de Portugal', 'E.g. visa application at the embassy') },
    localField(),
    dateField(),
    ...signatarioFields('documento'),
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const n = naturezaOf(v);
    const f = v.membroGenero === 'F';
    const nome = entidadeNome(ctx);
    const doc = str(v.membroDocNumero) ? `, ${f ? 'portadora' : 'portador'} do ${str(v.membroDocTipo) || 'BI'} n.º ${str(v.membroDocNumero)}` : '';
    const cat = v.categoria === 'simples' ? 'membro' : `membro ${v.categoria || 'efectivo'}`;
    const igreja = n === 'igreja';
    const partes = [
      `Para os devidos efeitos, declara-se que **${str(v.membroNome) || BLANK}**${str(v.membroNacionalidade) ? `, de nacionalidade ${str(v.membroNacionalidade)}` : ''}${doc}, é ${cat} ${deNome(n, nome)} desde ${dateLong(v.desde)}${str(v.numeroMembro) ? `, com o n.º de membro ${str(v.numeroMembro)}` : ''}`,
      str(v.quotasAte) ? `, encontrando-se com as quotas regularizadas até ${formatMonthYear(`${v.quotasAte}-01`)}` : '',
      str(v.cargo) ? `, e exerce actualmente o cargo de ${semPonto(v.cargo)}` : '',
      v.participacao !== false ? `, participando regularmente nas ${igreja ? 'actividades e nos cultos da igreja' : 'actividades'} ${daEntidade(n)}` : '',
      '.',
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração' },
      { type: 'paragraph', id: 'corpo', text: partes.join(''), en: `It is hereby declared that the person named is a member of ${nome} since the date stated.` },
      {
        type: 'paragraph',
        id: 'finalidade',
        text: `A presente declaração destina-se a ${semPonto(v.finalidade) || BLANK} e vai assinada e autenticada com o carimbo em uso ${daEntidade(n)}.`,
        en: 'This declaration is issued for the purpose stated, signed and stamped.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: str(v.signatarioCargo) || (igreja ? 'O Pastor' : 'O Presidente da Direcção'), name: str(v.signatarioNome) || undefined, image: 'both' }],
      },
    ];
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.membroNome)) w.push({ level: 'warning', field: 'membroNome', message: l('Indique o nome do membro.', 'Enter the member’s name.') });
    if (!str(v.finalidade)) w.push({ level: 'warning', field: 'finalidade', message: l('Indique para que serve a declaração.', 'State the purpose.') });
    if (ctx.profile && !ctx.profile.nuel && !ctx.profile.licenca)
      w.push({ level: 'info', message: l('Bancos e embaixadas podem pedir o NUEL ou o despacho de reconhecimento da entidade: preencha-os no perfil.', 'Banks and embassies may ask for the registration number or recognition order: add them to the profile.') });
    w.push({ level: 'info', message: l('Declare apenas o que consta dos registos da entidade: uma declaração falsa é crime.', 'Only state what the records show: a false declaration is a crime.') });
    return w;
  },
  personName: (v) => str(v.membroNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
