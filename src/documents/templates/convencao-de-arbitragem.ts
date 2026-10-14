import { defineTemplate, type Block, type ClauseItem, type FieldOption, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField } from './_shared';
import { partyDesc, partyFields } from './_advocacia';
import { g3, sem, str } from './_processo-civil';

const MODALIDADE_OPTIONS: FieldOption[] = [
  { value: 'compromisso', label: l('Compromisso arbitral (litígio já existente)', 'Submission agreement (existing dispute)') },
  { value: 'clausula', label: l('Cláusula compromissória (litígios futuros de um contrato)', 'Arbitration clause (future disputes under a contract)') },
];

const compromisso = (v: Values) => v.modalidade !== 'clausula';
const institucional = (v: Values) => v.tipoArbitragem === 'institucional';

export default defineTemplate({
  id: 'convencao-de-arbitragem',
  family: 'contrato',
  letterhead: false,
  sections: [
    { id: 'modalidade', title: l('Modalidade', 'Type') },
    { id: 'primeiro', title: l('Primeira parte', 'First party'), personRole: 'cliente' },
    { id: 'segundo', title: l('Segunda parte', 'Second party'), personRole: 'outro' },
    { id: 'objecto', title: l('Objecto', 'Subject') },
    { id: 'tribunal', title: l('Tribunal arbitral', 'Arbitral tribunal') },
    { id: 'processo', title: l('Processo e decisão', 'Procedure and award') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'modalidade', type: 'radio', section: 'modalidade', label: l('Modalidade', 'Type'), options: MODALIDADE_OPTIONS, default: 'compromisso' },
    ...partyFields('primeiro', 'primeiro', { defaultTipo: 'empresa' }),
    ...partyFields('segundo', 'segundo', { defaultTipo: 'empresa' }),
    { name: 'litigio', type: 'textarea', section: 'objecto', rows: 3, label: l('Litígio a submeter', 'Dispute to submit'), placeholder: l('Ex.: o pagamento do preço da empreitada do armazém da Machava e os alegados defeitos da obra', 'E.g. payment of the price and alleged defects'), showIf: compromisso },
    { name: 'contrato', type: 'text', section: 'objecto', label: l('Contrato de que resultam os litígios', 'Contract the disputes arise from'), placeholder: l('Ex.: contrato de fornecimento celebrado em 5 de Janeiro de 2026', 'E.g. supply agreement of 5 January 2026'), showIf: (v) => !compromisso(v) },
    { name: 'processoPendente', type: 'text', section: 'objecto', label: l('Processo judicial pendente (opcional)', 'Pending court case (optional)'), placeholder: l('Ex.: processo n.º 245/2026, da 3.ª Secção Cível do Tribunal Judicial da Cidade de Maputo', 'E.g. case 245/2026'), showIf: compromisso },
    {
      name: 'tipoArbitragem',
      type: 'radio',
      section: 'tribunal',
      label: l('Arbitragem', 'Arbitration'),
      default: 'adhoc',
      options: [
        { value: 'adhoc', label: l('Ad hoc (as partes organizam)', 'Ad hoc') },
        { value: 'institucional', label: l('Institucional (centro de arbitragem)', 'Institutional (arbitration centre)') },
      ],
    },
    { name: 'centro', type: 'text', section: 'tribunal', label: l('Centro de arbitragem', 'Arbitration centre'), default: 'Centro de Arbitragem, Conciliação e Mediação (CACM), em Maputo', showIf: institucional },
    {
      name: 'numeroArbitros',
      type: 'radio',
      section: 'tribunal',
      width: 'half',
      label: l('Número de árbitros', 'Number of arbitrators'),
      default: '3',
      options: [
        { value: '1', label: l('Árbitro único', 'Sole arbitrator') },
        { value: '3', label: l('Três árbitros', 'Three arbitrators') },
      ],
    },
    { name: 'arbitroUnico', type: 'text', section: 'tribunal', width: 'half', label: l('Árbitro único (opcional)', 'Sole arbitrator (optional)'), showIf: (v) => v.numeroArbitros === '1' },
    { name: 'sede', type: 'text', section: 'processo', width: 'half', label: l('Lugar da arbitragem', 'Seat'), default: 'Maputo' },
    { name: 'lingua', type: 'text', section: 'processo', width: 'half', label: l('Língua', 'Language'), default: 'portuguesa' },
    { name: 'equidade', type: 'toggle', section: 'processo', label: l('Os árbitros julgam segundo a equidade', 'Arbitrators decide ex aequo et bono'), help: l('Sem esta opção, julgam segundo o direito constituído.', 'Without it, they apply the law.') },
    { name: 'prazoDecisao', type: 'text', section: 'processo', width: 'half', label: l('Prazo para a decisão (opcional)', 'Time for the award (optional)'), placeholder: l('Ex.: seis meses a contar da aceitação do último árbitro', 'E.g. six months from acceptance'), help: l('Se vazio, aplica-se o prazo do regulamento ou da lei.', 'If empty, the rules or the law apply.') },
    { name: 'renunciaRecurso', type: 'toggle', section: 'processo', label: l('Renunciar aos recursos', 'Waive appeals'), help: l('A decisão arbitral fica definitiva, sem prejuízo dos meios que a lei não permita afastar (anulação).', 'The award is final, save remedies the law does not allow to waive (annulment).') },
    { name: 'confidencial', type: 'toggle', section: 'processo', default: true, label: l('Arbitragem confidencial', 'Confidential arbitration') },
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', field: 'modalidade', message: l(`${cite('pcConvencaoArbitragem')}: a convenção tem de ser escrita, sob pena de nulidade, e só abrange direitos disponíveis (não, por exemplo, questões de estado das pessoas).`, 'The agreement must be in writing and cover only rights the parties can freely dispose of.') },
    ];
    if (institucional(v)) w.push({ level: 'info', field: 'centro', message: l('Na arbitragem institucional aplica-se o regulamento do centro escolhido (designação de árbitros, prazos, encargos). Confirme o nome exacto do centro.', 'The chosen centre’s rules apply. Confirm the centre’s exact name.') });
    return w;
  },

  personName: (v) => v.segundoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = g3(v, 'primeiro');
    const S = g3(v, 'segundo');
    const comp = compromisso(v);
    const tres = v.numeroArbitros !== '1';
    const centro = sem(v.centro) || 'centro de arbitragem ____________________';

    const clauses: ClauseItem[] = [
      comp
        ? {
            id: 'objecto',
            heading: 'Objecto',
            text: `As partes submetem a arbitragem o litígio que entre elas existe relativo a ${sem(v.litigio) || '____________________'}${str(v.processoPendente) ? `, objecto do ${sem(v.processoPendente).replace(/^o\s+/i, '')}, de que desistirão da instância após a constituição do tribunal arbitral` : ''}.`,
            en: 'The parties submit the existing dispute to arbitration.',
          }
        : {
            id: 'objecto',
            heading: 'Objecto',
            text: `Todos os litígios emergentes ${str(v.contrato) ? `do ${sem(v.contrato).replace(/^o\s+/i, '')}` : 'do contrato celebrado entre as partes'}, incluindo os relativos à sua validade, interpretação, execução, incumprimento e cessação, são resolvidos definitivamente por arbitragem, nos termos da presente convenção.`,
            en: 'All disputes arising from the contract are finally settled by arbitration.',
          },
      {
        id: 'tribunal',
        heading: 'Tribunal arbitral',
        text: tres
          ? `O tribunal arbitral é composto por três árbitros. Cada parte designa um árbitro e os dois árbitros assim designados escolhem o terceiro, que preside. ${institucional(v) ? `Na falta de designação no prazo aplicável, a designação é feita nos termos do regulamento do ${centro}.` : 'Na falta de designação no prazo legal, a designação é feita nos termos da lei.'}`
          : `O tribunal arbitral é composto por um árbitro único${str(v.arbitroUnico) ? `, ${sem(v.arbitroUnico)}` : ', designado por acordo das partes'}. ${institucional(v) ? `Na falta de acordo, a designação é feita nos termos do regulamento do ${centro}.` : 'Na falta de acordo, a designação é feita nos termos da lei.'}`,
        en: 'Composition and appointment of the arbitral tribunal.',
      },
      {
        id: 'regras',
        heading: 'Regras do processo',
        text: institucional(v)
          ? `A arbitragem é institucional e decorre no ${centro}, de acordo com o seu regulamento em vigor à data do início do processo, que as partes declaram conhecer e aceitar.`
          : `A arbitragem é ad hoc. O processo é fixado pelo tribunal arbitral, com respeito pelos princípios da igualdade das partes, do contraditório e da audição das partes antes da decisão final, aplicando-se subsidiariamente a ${cite('pcConvencaoArbitragem')}.`,
        en: 'Procedural rules.',
      },
      {
        id: 'sede',
        heading: 'Lugar, língua e direito aplicável',
        text: `A arbitragem tem lugar em ${sem(v.sede) || 'Maputo'} e decorre em língua ${sem(v.lingua) || 'portuguesa'}. ${v.equidade ? 'Os árbitros julgam segundo a equidade.' : 'Os árbitros julgam segundo o direito moçambicano constituído.'}`,
        en: 'Seat, language and applicable law.',
      },
      {
        id: 'decisao',
        heading: 'Decisão',
        text: `${str(v.prazoDecisao) ? `A decisão é proferida no prazo de ${sem(v.prazoDecisao)}.` : 'A decisão é proferida no prazo previsto no regulamento aplicável ou, na sua falta, na lei.'} ${v.renunciaRecurso ? 'A decisão arbitral é definitiva e as partes renunciam aos recursos, sem prejuízo dos meios de impugnação que a lei não permita afastar.' : 'Da decisão arbitral cabem os recursos previstos na lei.'}`,
        en: 'Time for the award and appeals.',
      },
      {
        id: 'encargos',
        heading: 'Encargos',
        text: 'Os honorários dos árbitros e os encargos da arbitragem são adiantados pelas partes em partes iguais e suportados a final na proporção fixada na decisão arbitral.',
        en: 'Costs of the arbitration.',
      },
    ];
    if (v.confidencial) clauses.push({ id: 'confidencialidade', heading: 'Confidencialidade', text: 'O processo arbitral e a decisão são confidenciais, salvo na medida necessária à sua execução, impugnação ou cumprimento de obrigações legais.', en: 'Confidentiality.' });

    const sig = (p: string): SignatureColumn => {
      const empresa = v[`${p}Tipo`] === 'empresa';
      return { role: p === 'primeiro' ? (P.f ? 'A Primeira Outorgante' : 'O Primeiro Outorgante') : S.f ? 'A Segunda Outorgante' : 'O Segundo Outorgante', name: str(v[`${p}Nome`]) || undefined, detail: empresa && str(v[`${p}Representante`]) ? str(v[`${p}Representante`]) : undefined };
    };
    const blocks: Block[] = [
      { type: 'title', text: comp ? 'Compromisso arbitral' : 'Convenção de arbitragem', subtitle: comp ? undefined : 'Cláusula compromissória' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'primeiro', text: `${partyDesc(v, 'primeiro')}, adiante ${P.w('designado', 'designada')} por **${P.w('Primeiro Outorgante', 'Primeira Outorgante')}**;`, en: 'First party.' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'segundo', text: `${partyDesc(v, 'segundo')}, adiante ${S.w('designado', 'designada')} por **${S.w('Segundo Outorgante', 'Segunda Outorgante')}**;`, en: 'Second party.' },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: `É celebrad${comp ? 'o o presente compromisso arbitral' : 'a a presente convenção de arbitragem'}, ao abrigo da ${cite('pcConvencaoArbitragem')}, que se rege pelas cláusulas seguintes:`,
        en: 'This arbitration agreement is entered into on the following clauses.',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      { type: 'paragraph', id: 'feito', text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em dois exemplares de igual valor, ficando um em poder de cada uma das partes.`, en: 'Made in two copies of equal value.', keepWithNext: true },
      { type: 'signatures', columns: [sig('primeiro'), sig('segundo')] },
    ];
    return blocks;
  },
});
