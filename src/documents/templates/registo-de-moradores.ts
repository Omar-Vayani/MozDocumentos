// Registo de moradores do quarteirão: the block chief's list of houses and
// households (size by men, women and children), for mobilisation, campaigns and
// emergencies. Registration is voluntary; personal data must be kept to the
// minimum and stay within the authorised structures.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import { assinanteColumn, assinaturaFields, comunidadeWarnings, str, unidadeField } from './_comunidade';

const num = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default defineTemplate({
  id: 'registo-de-moradores',
  family: 'mapa',
  official: 'estado',
  page: 'A4-paisagem',
  sections: [
    { id: 'documento', title: l('Quarteirão', 'Block') },
    { id: 'agregados', title: l('Casas e agregados', 'Houses and households') },
    { id: 'assinatura', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    unidadeField(),
    { name: 'quarteirao', type: 'text', section: 'documento', width: 'half', required: true, label: l('Quarteirão n.º', 'Block no.') },
    { name: 'chefeQuarteirao', type: 'text', section: 'documento', width: 'half', label: l('Chefe do Quarteirão', 'Block chief') },
    localField(),
    dateField('data', 'documento', l('Data de actualização', 'Date updated')),
    {
      name: 'agregados',
      type: 'lines',
      section: 'agregados',
      required: true,
      label: l('Agregados', 'Households'),
      addLabel: l('Adicionar casa', 'Add house'),
      columns: [
        { name: 'casa', type: 'text', label: l('Casa n.º', 'House no.') },
        { name: 'chefe', type: 'text', label: l('Chefe do agregado', 'Head of household') },
        { name: 'sexo', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('M', 'M') }, { value: 'F', label: l('F', 'F') }] },
        { name: 'contacto', type: 'text', label: l('Contacto', 'Contact') },
        { name: 'homens', type: 'number', label: l('Homens', 'Men') },
        { name: 'mulheres', type: 'number', label: l('Mulheres', 'Women') },
        { name: 'menores', type: 'number', label: l('Menores', 'Children') },
        { name: 'desde', type: 'text', label: l('Desde (ano)', 'Since (year)') },
        { name: 'obs', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
    },
    { name: 'linhasEmBranco', type: 'number', section: 'agregados', width: 'half', min: 0, max: 40, label: l('Linhas em branco para preencher à mão', 'Blank rows to fill by hand'), default: 3 },
    { name: 'observacoesGerais', type: 'textarea', section: 'agregados', rows: 2, label: l('Observações gerais (opcional)', 'General notes (optional)') },
    ...assinaturaFields('assinatura', { visto: false, confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    w.push({
      level: 'warning',
      message: l(
        `Dados pessoais: recolha só o necessário, guarde a lista em lugar seguro e não a partilhe fora das estruturas autorizadas (${cite('dadosPessoaisComunidade')}). Saúde ou deficiência só com o consentimento da pessoa.`,
        'Personal data: collect only what is needed, keep the list safe and do not share it outside authorised structures. Health or disability only with consent.',
      ),
    });
    w.push({ level: 'info', message: l('O registo é voluntário: nenhuma lei obriga os moradores ou os visitantes a inscrever-se no quarteirão.', 'Registration is voluntary: no law requires residents or visitors to register with the block.') });
    return w;
  },

  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const rows = lineItems(v.agregados).filter((r) => str(r.chefe) || str(r.casa));
    const vazias = Math.min(Math.max(Number(v.linhasEmBranco) || 0, 0), 40);
    const tot = rows.reduce((a, r) => ({ h: a.h + num(r.homens), m: a.m + num(r.mulheres), c: a.c + num(r.menores) }), { h: 0, m: 0, c: 0 });
    const unidade = str(v.unidade);
    const blocks: Block[] = [
      { type: 'title', text: 'Registo de Moradores do Quarteirão', subtitle: `${unidade || BLANK} — Quarteirão n.º ${str(v.quarteirao) || '____'} — ${rows.length} agregados, ${tot.h + tot.m} pessoas — actualizado em ${dateLong(v.data)}` },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.45, align: 'center' },
          { label: 'Casa', width: 0.6, align: 'center' },
          { label: 'Chefe do agregado', width: 2.6 },
          { label: 'Sexo', width: 0.5, align: 'center' },
          { label: 'Contacto', width: 1.3 },
          { label: 'H', width: 0.45, align: 'center' },
          { label: 'M', width: 0.45, align: 'center' },
          { label: 'Menores', width: 0.75, align: 'center' },
          { label: 'Desde', width: 0.7, align: 'center' },
          { label: 'Observações', width: 2.2 },
        ],
        rows: [
          ...rows.map((r, i) => [String(i + 1), str(r.casa), str(r.chefe), str(r.sexo), str(r.contacto), str(r.homens), str(r.mulheres), str(r.menores), str(r.desde), str(r.obs)]),
          ...Array.from({ length: vazias }, (_x, i) => [String(rows.length + i + 1), ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']),
        ],
        totals: rows.length ? [['', '', 'Total', '', '', String(tot.h), String(tot.m), String(tot.c), '', '']] : undefined,
        note: 'H = homens e rapazes; M = mulheres e raparigas; Menores = dos quais menores de idade. Documento de uso interno com dados pessoais: não partilhar fora das estruturas autorizadas.',
      },
    ];
    if (str(v.observacoesGerais)) blocks.push({ type: 'paragraph', id: 'observacoes', text: str(v.observacoesGerais), en: 'General notes.' });
    blocks.push({
      type: 'signatures',
      columns: [{ role: 'O Chefe do Quarteirão', name: str(v.chefeQuarteirao) || undefined }, { ...assinanteColumn(ctx), role: `Visto — ${assinanteColumn(ctx).role}` }],
    });
    return blocks;
  },
});
