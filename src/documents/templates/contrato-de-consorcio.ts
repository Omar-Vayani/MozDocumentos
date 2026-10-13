// Contrato de consórcio: companies join forces for a tender or project without
// creating a new company. Written form, notarised signatures and registration
// (Regime Jurídico dos Contratos Comerciais).

import { defineTemplate, type Block, type ClauseItem, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, identificacao, num, numerar, partyFields, partyName,
  partyWarnings, pct, semPonto, str, testemunhasField, type Papel,
} from './_contratos';

const ORD = ['Primeiro', 'Segundo', 'Terceiro'];
const membroRole = (i: number): Papel => {
  const n = `${ORD[i]} Membro`;
  return { n, f: false, o: `o ${n}`, O: `O ${n}`, de: `do ${n}`, ao: `ao ${n}`, pelo: `pelo ${n}` };
};
const terceiro = (f: FieldDef): FieldDef => ({ ...f, showIf: (v: Values) => Boolean(v.terceiroMembro) && (f.showIf ? f.showIf(v) : true) });

function membroExtra(p: string, i: number): FieldDef[] {
  return [
    { name: `${p}Participacao`, type: 'number', section: p, width: 'half', min: 0, max: 100, label: l('Participação (%)', 'Share (%)'), default: i === 0 ? 50 : i === 1 ? 50 : 0 },
    { name: `${p}Actividades`, type: 'textarea', section: p, rows: 2, label: l('Actividades a cargo deste membro', 'Activities of this member'), placeholder: l('Ex.: execução da construção civil e fornecimento de materiais', 'E.g. civil works and materials') },
  ];
}

export default defineTemplate({
  id: 'contrato-de-consorcio',
  family: 'contrato',
  official: 'notario',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'membro1', title: l('Primeiro membro', 'First member'), personRole: 'outro' },
    { id: 'membro2', title: l('Segundo membro', 'Second member'), personRole: 'outro' },
    { id: 'membro3', title: l('Terceiro membro (opcional)', 'Third member (optional)'), personRole: 'outro' },
    { id: 'consorcio', title: l('Consórcio e objecto', 'Consortium and purpose') },
    { id: 'organizacao', title: l('Organização e responsabilidade', 'Organisation and liability') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('membro1', { fromProfile: true, tipoDefault: 'empresa' }),
    ...membroExtra('membro1', 0),
    ...partyFields('membro2', { tipoDefault: 'empresa' }),
    ...membroExtra('membro2', 1),
    { name: 'terceiroMembro', type: 'toggle', section: 'membro3', label: l('Há um terceiro membro', 'There is a third member') },
    ...partyFields('membro3', { tipoDefault: 'empresa' }).map(terceiro),
    ...membroExtra('membro3', 2).map(terceiro),

    { name: 'nomeConsorcio', type: 'text', section: 'consorcio', width: 'half', required: true, label: l('Denominação do consórcio', 'Consortium name'), placeholder: l('Ex.: Consórcio Machava–Sitoe', 'E.g. Machava–Sitoe Consortium') },
    {
      name: 'tipo',
      type: 'radio',
      section: 'consorcio',
      width: 'half',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'externo', label: l('Externo (actua perante terceiros como consórcio)', 'External (acts as a consortium towards third parties)') },
        { value: 'interno', label: l('Interno (só entre os membros)', 'Internal (between members only)') },
      ],
      default: 'externo',
    },
    { name: 'objecto', type: 'textarea', section: 'consorcio', required: true, rows: 3, label: l('Objecto', 'Purpose'), placeholder: l('Ex.: apresentar proposta conjunta ao concurso e, se adjudicado, executar a empreitada de construção da Escola Secundária de…', 'E.g. submit a joint bid and, if awarded, carry out the works') },
    { name: 'concursoNumero', type: 'text', section: 'consorcio', width: 'half', label: l('Concurso n.º (opcional)', 'Tender no. (optional)') },
    { name: 'entidadeContratante', type: 'text', section: 'consorcio', width: 'half', label: l('Entidade contratante (opcional)', 'Contracting entity (optional)') },
    { name: 'sede', type: 'text', section: 'consorcio', label: l('Endereço do consórcio', 'Consortium address'), help: l('Normalmente a sede do chefe do consórcio.', 'Usually the lead member’s office.') },

    {
      name: 'chefe',
      type: 'select',
      section: 'organizacao',
      width: 'half',
      label: l('Chefe do consórcio', 'Lead member'),
      options: [
        { value: '0', label: l('Primeiro membro', 'First member') },
        { value: '1', label: l('Segundo membro', 'Second member') },
        { value: '2', label: l('Terceiro membro', 'Third member') },
      ],
      default: '0',
    },
    {
      name: 'facturacao',
      type: 'radio',
      section: 'organizacao',
      label: l('Facturação e recebimentos', 'Invoicing and payments'),
      options: [
        { value: 'directa', label: l('Cada membro factura a sua parte', 'Each member invoices its own part') },
        { value: 'chefe', label: l('O chefe factura e reparte', 'The lead invoices and distributes') },
      ],
      default: 'directa',
    },
    { name: 'fundoComum', type: 'toggle', section: 'organizacao', label: l('Há um fundo comum', 'There is a common fund') },
    { name: 'responsabilidadeSolidaria', type: 'toggle', section: 'organizacao', default: true, label: l('Responsabilidade solidária perante a entidade contratante', 'Joint and several liability to the client'), help: l('Muitos cadernos de encargos exigem que os membros respondam solidariamente.', 'Many tender documents require joint and several liability.') },
    {
      name: 'decisoesUnanimes',
      type: 'textarea',
      section: 'organizacao',
      rows: 2,
      label: l('Decisões que exigem unanimidade', 'Decisions requiring unanimity'),
      default: 'apresentação e alteração da proposta\naceitação da adjudicação e assinatura do contrato\nentrada, saída ou substituição de membros\nalteração das participações',
    },
    { name: 'confidencialidade', type: 'toggle', section: 'clausulas', default: true, label: l('Cláusula de confidencialidade', 'Confidentiality clause') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => {
    const ms = ['membro1', 'membro2', ...(v.terceiroMembro ? ['membro3'] : [])];
    const soma = ms.reduce((s, p) => s + (num(v[`${p}Participacao`]) ?? 0), 0);
    return { ms, soma };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    (c.ms as string[]).forEach((p, i) => w.push(...partyWarnings(v, p, `${ORD[i].toLowerCase()} membro`, `member ${i + 1}`)));
    if (Math.abs(c.soma - 100) > 0.01) {
      w.push({ level: 'error', field: 'membro1Participacao', message: l(`As participações somam ${c.soma}%; devem perfazer o total.`, `Shares add up to ${c.soma}%; they must total the whole.`) });
    }
    if (Number(v.chefe) >= c.ms.length) w.push({ level: 'error', field: 'chefe', message: l('O chefe do consórcio tem de ser um dos membros.', 'The lead must be one of the members.') });
    w.push({
      level: 'warning',
      message: l(
        `O contrato de consórcio deve ser escrito, ter as assinaturas reconhecidas no notário e ser registado (${cite('consorcioForma')}). O consórcio não tem personalidade jurídica.`,
        'A consortium agreement must be in writing, with notarised signatures, and registered. A consortium has no legal personality.',
      ),
    });
    w.push({ level: 'info', message: l('Confirme no caderno de encargos do concurso a forma exigida para o consórcio e a responsabilidade dos membros.', 'Check the tender documents for the required consortium form and liability.') });
    return w;
  },

  personName: (v) => str(v.nomeConsorcio) || partyName(v, 'membro2') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ms: string[] = c.ms;
    const roles = ms.map((_, i) => membroRole(i));
    const chefeI = Math.min(Number(v.chefe) || 0, ms.length - 1);
    const chefe = roles[chefeI];
    const nome = semPonto(v.nomeConsorcio) || BLANK;
    const externo = v.tipo !== 'interno';

    const partyParas: Block[] = ms.map((p, i) => ({
      type: 'paragraph' as const,
      id: `parte_${p}`,
      text: `${i === 0 ? 'Entre:\n' : i === ms.length - 1 ? 'e\n' : ''}${identificacao(v, p)}, adiante designada por **${roles[i].n}**${i === ms.length - 1 ? ',' : ';'}`,
      en: `${i === 0 ? 'Between' : 'and'} member ${i + 1}, identified above;`,
    }));

    const concurso = [str(v.concursoNumero) ? `concurso n.º ${semPonto(v.concursoNumero)}` : '', str(v.entidadeContratante) ? `lançado por ${semPonto(v.entidadeContratante)}` : ''].filter(Boolean).join(', ');
    const unanimes = str(v.decisoesUnanimes).split(/\n+/).map(semPonto).filter(Boolean);

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'constituicao',
      heading: 'Constituição e objecto',
      text: numerar([
        `Pelo presente contrato, os membros constituem entre si um consórcio ${externo ? 'externo' : 'interno'}, denominado ${nome}, com o seguinte objecto: ${semPonto(v.objecto) || BLANK}${concurso ? ` (${concurso})` : ''}.`,
        str(v.sede) ? `O consórcio tem o seu endereço em ${semPonto(v.sede)}.` : '',
      ]),
      en: `The members form an ${externo ? 'external' : 'internal'} consortium named ${v.nomeConsorcio || '—'} for the stated purpose.`,
    });
    clauses.push({
      id: 'natureza',
      heading: 'Natureza',
      text: `O consórcio não tem personalidade jurídica${v.fundoComum ? '' : ' nem fundo comum'}, mantendo cada membro a sua autonomia jurídica, patrimonial e fiscal${v.fundoComum ? '. O fundo comum é constituído pelas contribuições dos membros na proporção das suas participações e destina-se exclusivamente às despesas comuns do consórcio' : ''}.`,
      en: `The consortium has no legal personality${v.fundoComum ? '; a common fund is set up in proportion to the shares' : ' and no common fund'}; each member stays independent.`,
    });
    clauses.push({
      id: 'participacoes',
      heading: 'Participações e actividades',
      text: 'Cada membro participa no consórcio na seguinte proporção e com as seguintes actividades:',
      items: ms.map((p, i) => `${roles[i].O}, ${partyName(v, p) || BLANK}: ${pct(v[`${p}Participacao`])}${str(v[`${p}Actividades`]) ? `, ${semPonto(v[`${p}Actividades`]).replace(/^./, (s) => s.toLowerCase())}` : ''}${i === ms.length - 1 ? '.' : ';'}`),
      en: 'Each member’s share and activities are as listed.',
    });
    clauses.push({
      id: 'chefe',
      heading: 'Chefe do consórcio',
      text: `É designado chefe do consórcio ${chefe.o}, ${partyName(v, ms[chefeI]) || BLANK}, a quem compete:`,
      items: [
        externo ? 'representar o consórcio perante a entidade contratante e terceiros, nos limites dos poderes conferidos pelos membros;' : 'coordenar as relações entre os membros;',
        'assinar a proposta e os documentos do concurso, depois de aprovados nos termos da cláusula sobre decisões;',
        'organizar a cooperação entre os membros e coordenar a execução das actividades;',
        v.facturacao === 'chefe' ? 'facturar e receber os pagamentos da entidade contratante e reparti-los pelos membros no prazo de cinco dias úteis após o recebimento;' : 'acompanhar a facturação, que cada membro faz directamente relativamente às actividades que executa;',
        'informar regularmente os demais membros sobre a execução do objecto do consórcio.',
      ],
      en: `The ${chefe.n} leads the consortium: represents it, signs the bid documents once approved, coordinates the work${v.facturacao === 'chefe' ? ', invoices and distributes payments within five working days' : ''}, and reports to the members.`,
    });
    clauses.push({
      id: 'resultados',
      heading: 'Repartição de resultados',
      text: v.facturacao === 'chefe'
        ? 'Os valores recebidos da entidade contratante são repartidos pelos membros na proporção das respectivas participações, deduzidas as despesas comuns.'
        : 'Cada membro recebe directamente o valor correspondente às actividades que executa, suportando os respectivos custos; as despesas comuns são repartidas na proporção das participações.',
      en: v.facturacao === 'chefe' ? 'Receipts are split by share, after common costs.' : 'Each member is paid directly for its own activities; common costs are split by share.',
    });
    clauses.push({
      id: 'responsabilidade',
      heading: 'Responsabilidade',
      text: numerar([
        v.responsabilidadeSolidaria
          ? 'Perante a entidade contratante, os membros respondem solidariamente pelo cumprimento das obrigações do consórcio.'
          : 'Perante terceiros, cada membro responde apenas pelas obrigações relativas às actividades que lhe cabem.',
        'Nas relações internas, cada membro responde pelas actividades a seu cargo, tendo os demais direito de regresso contra o membro faltoso pelo que tiverem pago por causa dele.',
      ]),
      en: `${v.responsabilidadeSolidaria ? 'Joint and several liability to the client. ' : 'Each member is liable only for its own activities. '}Internally, each member answers for its activities, with recourse against the member at fault.`,
    });
    clauses.push({
      id: 'decisoes',
      heading: 'Decisões',
      text: `As decisões sobre a execução do objecto são tomadas por um conselho de orientação composto por um representante de cada membro, deliberando por maioria das participações, excepto quanto às seguintes matérias, que exigem unanimidade: ${unanimes.length ? unanimes.join('; ') : BLANK}.`,
      en: 'A steering committee with one representative per member decides by majority of shares; listed matters need unanimity.',
    });
    clauses.push({
      id: 'exclusividade',
      heading: 'Exclusividade',
      text: 'Durante o concurso e a execução do objecto, nenhum membro concorre, isoladamente ou com terceiros, ao mesmo concurso ou a contrato com o mesmo objecto.',
      en: 'No member bids separately or with others for the same tender or contract.',
    });
    if (v.confidencialidade) {
      clauses.push({
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: 'Os membros mantêm confidenciais os preços, as propostas e as demais informações trocadas no âmbito do consórcio, durante a sua vigência e após a sua extinção.',
        en: 'Prices, bids and other information are confidential during and after the consortium.',
      });
    }
    clauses.push({
      id: 'membros',
      heading: 'Entrada, saída e substituição de membros',
      text: 'A entrada, saída ou substituição de membros só é possível por acordo unânime e, após a adjudicação, com o consentimento da entidade contratante.',
      en: 'Changes in membership need unanimity and, after award, the client’s consent.',
    });
    clauses.push({
      id: 'extincao',
      heading: 'Duração e extinção',
      text: 'O consórcio extingue-se com a não adjudicação do concurso, com a realização integral do objecto e o termo dos prazos de garantia, ou por acordo unânime dos membros.',
      en: 'The consortium ends if the tender is not awarded, when the purpose is completed and warranty periods end, or by unanimous agreement.',
    });
    clauses.push(...clausulasFinais(v, { lei: `sobre o consórcio (${cite('consorcioForma')})` }));

    const cols = ms.map((p, i) => assinatura(ctx, p, roles[i], i === 0));
    return [
      { type: 'title', text: 'Contrato de consórcio', subtitle: nome !== BLANK ? nome : undefined },
      ...partyParas,
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de consórcio, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pelo Regime Jurídico dos Contratos Comerciais e demais legislação aplicável:',
        en: 'This consortium agreement is entered into on the following terms and, where silent, the Commercial Contracts Regime:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, cols, {
        exemplares: ms.length + 1,
        restante: 'ao registo',
        notario: `Reconhecimento presencial das assinaturas dos representantes dos membros do consórcio, celebrado em ${dateLong(v.data)}.`,
      }),
    ];
  },
});
