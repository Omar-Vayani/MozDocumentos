// Declaração de testemunhas: two or more residents confirm, on their honour, a
// fact about another resident (residence, parentage, place of birth, life
// together…). The neighbourhood structure only confirms that the witnesses are
// known residents. Where the law requires witnesses before the registrar, they
// must appear in person at the Conservatória.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField } from './_shared';
import {
  assinanteColumn,
  assinaturaFields,
  comunidadeWarnings,
  deste,
  finalidadeFrase,
  identificacao,
  notaBlocks,
  numeroComunidadeField,
  numeroRef,
  pessoaFields,
  residenteEm,
  str,
  testemunhas,
  testemunhasField,
  unidadeField,
} from './_comunidade';

const FACTOS = [
  { value: 'residencia', label: l('Residência', 'Residence') },
  { value: 'filiacao', label: l('Filiação (quem são os pais)', 'Parentage') },
  { value: 'naturalidade', label: l('Naturalidade / nascimento', 'Place of birth') },
  { value: 'convivencia', label: l('Vida em comum (casal)', 'Couple living together') },
  { value: 'outro', label: l('Outro facto', 'Other fact') },
];

export default defineTemplate({
  id: 'declaracao-de-testemunhas',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'cidadao', title: l('Interessado', 'Person concerned'), personRole: 'outro' },
    { id: 'facto', title: l('Facto confirmado', 'Fact confirmed') },
    { id: 'testemunhas', title: l('Testemunhas', 'Witnesses') },
    { id: 'assinatura', title: l('Confirmação do bairro', 'Neighbourhood confirmation') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    ...pessoaFields(['nome', 'genero', 'docTipo', 'docNumero']),
    { name: 'factoTipo', type: 'select', section: 'facto', label: l('Que facto se confirma', 'Fact confirmed'), options: FACTOS, default: 'residencia' },
    { name: 'morada', type: 'text', section: 'facto', label: l('Onde reside', 'Where the person lives'), placeholder: l('Ex.: no Bairro da Malhangalene «A», Quarteirão n.º 12, Casa n.º 34', 'E.g. neighbourhood, block, house'), showIf: (v) => v.factoTipo === 'residencia' },
    { name: 'desde', type: 'month', section: 'facto', width: 'half', label: l('Desde', 'Since'), showIf: (v) => v.factoTipo === 'residencia' || v.factoTipo === 'convivencia' },
    { name: 'pai', type: 'text', section: 'facto', width: 'half', label: l('Nome do pai', "Father's name"), showIf: (v) => v.factoTipo === 'filiacao' },
    { name: 'mae', type: 'text', section: 'facto', width: 'half', label: l('Nome da mãe', "Mother's name"), showIf: (v) => v.factoTipo === 'filiacao' },
    { name: 'nascimentoLocal', type: 'text', section: 'facto', width: 'half', label: l('Local de nascimento', 'Place of birth'), showIf: (v) => v.factoTipo === 'naturalidade' },
    { name: 'nascimentoData', type: 'date', section: 'facto', width: 'half', label: l('Data de nascimento', 'Date of birth'), showIf: (v) => v.factoTipo === 'naturalidade' },
    { name: 'companheiro', type: 'text', section: 'facto', label: l('Nome do companheiro(a)', "Partner's name"), showIf: (v) => v.factoTipo === 'convivencia' },
    { name: 'factoTexto', type: 'textarea', section: 'facto', rows: 3, label: l('Facto que as testemunhas confirmam', 'Fact the witnesses confirm'), placeholder: l('Escreva a seguir a «que …». Ex.: é viúva de José Mabunda, falecido em 2024', 'Written after “that …”'), showIf: (v) => v.factoTipo === 'outro' },
    { name: 'anosConhece', type: 'number', section: 'facto', width: 'half', min: 0, label: l('As testemunhas conhecem-no(a) há (anos)', 'Witnesses have known the person for (years)') },
    { name: 'finalidade', type: 'text', section: 'facto', required: true, label: l('Para que serve', 'Purpose'), placeholder: l('Ex.: instruir pedido de atestado de residência', 'E.g. support a residence certificate request') },
    testemunhasField('testemunhas'),
    { name: 'confirmacaoBairro', type: 'toggle', section: 'assinatura', label: l('Incluir confirmação da estrutura do bairro', 'Include neighbourhood confirmation'), default: true },
    ...assinaturaFields('assinatura', { visto: false, confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (testemunhas(v).length < 2) w.push({ level: 'warning', field: 'testemunhas', message: l('Indique pelo menos duas testemunhas.', 'Enter at least two witnesses.') });
    if (/registo|conservat|nascimento|cédula/i.test(str(v.finalidade))) {
      w.push({ level: 'info', field: 'finalidade', message: l('Nos actos de registo civil as testemunhas têm normalmente de comparecer pessoalmente na Conservatória; esta declaração não as dispensa.', 'For civil registration acts witnesses usually have to appear in person at the registry; this declaration does not replace that.') });
    }
    w.push({ level: 'info', message: l('As falsas declarações constituem crime. As testemunhas não devem ser familiares próximos do interessado.', 'False statements are a crime. Witnesses should not be close relatives of the person concerned.') });
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.cidadaoGenero === 'F';
    const ts = testemunhas(v);
    const lista = ts.length >= 2 ? ts : [...ts, ...Array.from({ length: 2 - ts.length }, () => ({ nome: '', documento: '', morada: '' }))];
    const quem = lista
      .map((t) => `**${t.nome || BLANK}**, titular do BI n.º ${t.documento.replace(/^(BI\s*)?n\.?\s*º\s*/i, '') || BLANK}${t.morada ? `, ${residenteEm(t.morada)}` : ''}`)
      .join(', e ');
    const ym = str(v.desde);
    const desde = /^\d{4}-\d{2}$/.test(ym) ? dateLong(`${ym}-01`).replace(/^\d+\.?º? de /, '') : '';
    const facto = (() => {
      switch (v.factoTipo) {
        case 'filiacao':
          return `é ${f ? 'filha' : 'filho'} de ${str(v.pai) || BLANK} e de ${str(v.mae) || BLANK}`;
        case 'naturalidade':
          return `nasceu em ${str(v.nascimentoLocal) || BLANK}${v.nascimentoData ? `, a ${dateLong(v.nascimentoData)}` : ''}`;
        case 'convivencia':
          return `vive em comunhão de mesa, leito e habitação com ${str(v.companheiro) || BLANK}${desde ? ` desde ${desde}` : ''}`;
        case 'outro':
          return str(v.factoTexto).replace(/\s*\n+\s*/g, ' ').replace(/^que\s+/i, '').replace(/[.;]+$/, '') || BLANK;
        default:
          return `reside ${str(v.morada) || BLANK}${desde ? ` desde ${desde}` : ''}`;
      }
    })();
    const anos = Number(v.anosConhece);
    const conhece = Number.isFinite(anos) && anos > 0 ? ` há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Testemunhas', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Nós, abaixo assinados, ${quem}, declaramos, **sob compromisso de honra**, que conhecemos${conhece} ${identificacao(v)}, e que ${f ? 'a mesma' : 'o mesmo'} ${facto}.`,
        en: 'We, the undersigned, declare on our honour that we know the person named and confirm the fact stated.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `A presente declaração é feita ${finalidadeFrase(v)}. Por ser verdade, assinamo-la, cientes de que as falsas declarações nos fazem incorrer em responsabilidade criminal.`,
        keepWithNext: true,
        en: 'Signed in the knowledge that false statements are a criminal offence.',
      },
    ];
    const cols = lista.map((t, i) => ({ role: `${i + 1}.ª Testemunha`, name: t.nome || undefined, detail: t.documento ? `BI n.º ${t.documento}` : undefined }));
    for (let i = 0; i < cols.length; i += 3) blocks.push({ type: 'signatures', placeDate: i === 0 ? `${ctx.place}, ${dateLong(v.data)}` : undefined, columns: cols.slice(i, i + 3) });
    if (v.confirmacaoBairro !== false) {
      blocks.push(
        { type: 'spacer', size: 'small' },
        {
          type: 'paragraph',
          id: 'confirmacao',
          text: `**Confirmação da estrutura comunitária:** as testemunhas acima identificadas são residentes conhecidos ${deste(str(v.unidade))}.`,
          keepWithNext: true,
          en: 'Community confirmation: the witnesses are known residents of this neighbourhood.',
        },
        { type: 'signatures', columns: [assinanteColumn(ctx)] },
        ...notaBlocks(v.cidadaoGenero, '', 'pelas testemunhas'),
      );
    }
    return blocks;
  },
});
