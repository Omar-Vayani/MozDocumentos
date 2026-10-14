// Declaração de entrega temporária de menor (guarda de facto): the parents
// entrust a child to a relative or trusted person for a period (work away,
// studies, illness) and authorise everyday acts — school, health, travel within
// the country. It does not transfer parental authority; lasting placements and
// guardianship need a juvenile court decision.

import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, localField } from './_shared';
import { identificacao, notaryBox, PARENTESCO_OPTIONS, pessoaFields, qualidadeParental, RECONHECIMENTO_FIELD } from './_pessoal-rh';
import { filhos, filhosField, filhoTexto, oMenor, semPonto, str } from './_familia';

const KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada', 'telefone'] as const;

const PODERES = [
  { name: 'poderEscola', pt: 'matricular e acompanhar a vida escolar, assinar autorizações e justificações de faltas e falar com os professores', en: 'school matters' },
  { name: 'poderSaude', pt: 'levar a consultas, exames e tratamentos e autorizar tratamentos urgentes, informando de imediato os pais', en: 'health care and urgent treatment' },
  { name: 'poderViagem', pt: 'acompanhar em deslocações dentro do território nacional', en: 'travel within the country' },
  { name: 'poderDocumentos', pt: 'requerer e levantar documentos escolares e de saúde', en: 'collect school and health documents' },
];

export default defineTemplate({
  id: 'entrega-temporaria-menor',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'progenitor1', title: l('Pai, mãe ou tutor', 'Parent or guardian'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'progenitor2', title: l('Segundo progenitor (se também assina)', 'Second parent (if signing)'), personRole: 'outro' },
    { id: 'menores', title: l('Menor(es)', 'Child(ren)') },
    { id: 'guarda', title: l('Quem fica com o menor', 'Person taking care of the child'), personRole: 'outro' },
    { id: 'periodo', title: l('Período e poderes', 'Period and powers') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da declaração', 'Date of the declaration')),
    ...pessoaFields('progenitor1', 'progenitor1', { profile: true, keys: KEYS }),
    { name: 'progenitor1Qualidade', type: 'select', section: 'progenitor1', width: 'half', label: l('É', 'Is the'), options: PARENTESCO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'mãe' : 'pai') },
    { name: 'doisProgenitores', type: 'toggle', section: 'progenitor2', default: true, label: l('O outro progenitor também assina', 'The other parent also signs'), help: l('Recomendado: o poder parental é exercido pelos dois pais.', 'Recommended: both parents share parental authority.') },
    ...pessoaFields('progenitor2', 'progenitor2', { keys: KEYS }).map((f) => ({
      ...f,
      required: false,
      default: f.name === 'progenitor2Genero' ? (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'M' : 'F') : f.default,
      showIf: (v: Values) => Boolean(v.doisProgenitores),
    })),
    { name: 'progenitor2Qualidade', type: 'select', section: 'progenitor2', width: 'half', label: l('É', 'Is the'), options: PARENTESCO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'pai' : 'mãe'), showIf: (v) => Boolean(v.doisProgenitores) },
    filhosField('menores', 'menores', l('Menores entregues', 'Children entrusted')),
    ...pessoaFields('guarda', 'guarda', { keys: KEYS }),
    { name: 'guardaParentesco', type: 'text', section: 'guarda', width: 'half', label: l('Parentesco com o menor', 'Relationship to the child'), placeholder: l('Ex.: avó materna, tio paterno', 'E.g. maternal grandmother') },
    { name: 'motivo', type: 'text', section: 'periodo', label: l('Motivo', 'Reason'), placeholder: l('Ex.: trabalho da mãe na África do Sul durante o período indicado', 'E.g. mother working abroad for the period') },
    { name: 'dataInicio', type: 'date', section: 'periodo', width: 'half', required: true, label: l('Desde', 'From'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'periodo', width: 'half', label: l('Até', 'Until'), help: l('Vazio = até os pais revogarem.', 'Empty = until the parents revoke it.') },
    ...PODERES.map((p) => ({ name: p.name, type: 'toggle' as const, section: 'periodo', default: true, label: l(p.pt.charAt(0).toUpperCase() + p.pt.slice(1), p.en) })),
    { name: 'despesas', type: 'text', section: 'periodo', label: l('Despesas do menor (opcional)', 'Child’s expenses (optional)'), placeholder: l('Ex.: os pais enviam mensalmente 5.000,00 MT para alimentação e escola', 'E.g. parents send 5,000 MT a month') },
    RECONHECIMENTO_FIELD('periodo'),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!filhos(v.menores).length) w.push({ level: 'error', field: 'menores', message: l('Indique o(s) menor(es).', 'Enter the child(ren).') });
    if (!str(v.guardaNome)) w.push({ level: 'error', field: 'guardaNome', message: l('Indique quem fica com o menor.', 'Enter who takes care of the child.') });
    w.push({
      level: 'warning',
      message: l(
        `Esta declaração não transfere o poder parental nem é uma tutela: os pais continuam responsáveis e podem revogá-la a todo o tempo (${cite('famEntregaMenor')}). Para uma entrega duradoura ou se os pais não puderem decidir, é preciso pedir a confiança do menor ao tribunal de menores. Para viajar para o estrangeiro use a Autorização de viagem de menor.`,
        'This does not transfer parental authority and is not guardianship: the parents remain responsible and may revoke it. Lasting placements need the juvenile court. For travel abroad use the minor travel authorisation.',
      ),
    });
    w.push({ level: 'info', message: l('Escolas e unidades sanitárias costumam pedir a assinatura reconhecida e cópias dos BI dos pais e de quem fica com o menor.', 'Schools and clinics usually ask for certified signatures and copies of the IDs.') });
    return w;
  },

  personName: (v) => filhos(v.menores)[0]?.nome || v.progenitor1Nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lista = filhos(v.menores);
    const m = oMenor(lista);
    const dois = Boolean(v.doisProgenitores);
    const q = (p: string) => qualidadeParental(v[`${p}Qualidade`], v[`${p}Genero`]);
    const fG = isF(v.guardaGenero);
    const poderes = PODERES.filter((p) => v[p.name]).map((p) => p.pt);
    const declarantes = dois
      ? `${identificacao(v, 'progenitor1', { estadoCivil: false })}, e ${identificacao(v, 'progenitor2', { estadoCivil: false })}, na qualidade de ${q('progenitor1')} e ${q('progenitor2')}`
      : `${identificacao(v, 'progenitor1', { estadoCivil: false })}, na qualidade de ${q('progenitor1')}`;
    const verbo = dois ? 'declaram que entregam' : 'declara que entrega';
    const menoresTxt = lista.length ? lista.map((f) => filhoTexto(f)).join('; ') : `**${BLANK}**`;
    const periodo = str(v.dataFim) ? `de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}` : `a partir de ${dateLong(v.dataInicio)} e até revogação`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de entrega temporária de menor' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${declarantes} ${m.de} ${menoresTxt}, ${verbo} temporariamente ${m.o} aos cuidados de ${identificacao(v, 'guarda', { estadoCivil: false })}${str(v.guardaParentesco) ? `, ${semPonto(v.guardaParentesco)} ${m.de}` : ''}, ${periodo}${str(v.motivo) ? `, por motivo de ${semPonto(v.motivo).replace(/^(por motivo de|devido a)\s+/i, '')}` : ''}.`,
        en: 'The parent(s) named entrust the child(ren) named to the person named for the period stated.',
      },
    ];
    if (poderes.length) {
      blocks.push(
        { type: 'paragraph', id: 'poderes', text: `Durante esse período, ${fG ? 'a referida' : 'o referido'} ${fG ? 'senhora' : 'senhor'} fica autorizad${fG ? 'a' : 'o'} a:`, en: 'During that period the carer is authorised to:' },
        { type: 'list', style: 'alpha', items: poderes.map((s, i) => `${s}${i === poderes.length - 1 ? '.' : ';'}`) },
      );
    }
    blocks.push({
      type: 'paragraph',
      id: 'limites',
      text: `A presente declaração não abrange a saída ${m.de} do país, a mudança de escola sem acordo ${dois ? 'dos pais' : `${isF(v.progenitor1Genero) ? 'da' : 'do'} declarante`} nem quaisquer actos de disposição de bens, e não transfere o poder parental, que ${dois ? 'os declarantes continuam a exercer e podem' : `${isF(v.progenitor1Genero) ? 'a declarante continua' : 'o declarante continua'} a exercer e pode`} revogar a todo o tempo.`,
      en: 'It does not cover travel abroad, a change of school without the parents’ agreement or disposal of property, and does not transfer parental authority, which the parents keep and may revoke at any time.',
    });
    if (str(v.despesas)) blocks.push({ type: 'paragraph', id: 'despesas', text: `Despesas: ${semPonto(v.despesas)}.`, en: 'Expenses as stated.' });
    blocks.push(
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: `${fG ? 'A' : 'O'} ${fG ? 'senhora' : 'senhor'} ${str(v.guardaNome) || BLANK} aceita cuidar ${m.de} com zelo e informar os pais de tudo o que for importante para a sua saúde, educação e bem-estar.`,
        en: 'The carer accepts and will keep the parents informed.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: `${isF(v.progenitor1Genero) ? 'A' : 'O'} ${q('progenitor1').replace(/^./, (x) => x.toUpperCase())}`, name: str(v.progenitor1Nome) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined },
          ...(dois ? [{ role: `${isF(v.progenitor2Genero) ? 'A' : 'O'} ${q('progenitor2').replace(/^./, (x) => x.toUpperCase())}`, name: str(v.progenitor2Nome) || undefined }] : []),
        ],
        keepWithNext: true,
      },
      { type: 'signatures', columns: [{ role: fG ? 'A Responsável pela guarda' : 'O Responsável pela guarda', name: str(v.guardaNome) || undefined }], keepWithNext: Boolean(v.espacoReconhecimento) },
    );
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
