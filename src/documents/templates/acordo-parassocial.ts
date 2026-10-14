// Acordo parassocial: private agreement among members on voting, management,
// transfers, non-compete and deadlock. Binds only the parties.
import { inteiroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money } from './_shared';
import {
  num, numerar, pct, quantos, semPonto, signatureRows, SOCIO_COLUMNS, socioIdent, socios, socioSignature, sociedadeFields, sociedadeIdent,
  sociedadeNome, splitOutros, str, valorTexto, type Socio,
} from './_sociedades';
import { deEntidade } from './_pessoal-rh';

const sec = 'clausulas';
const when = (k: string) => (v: Values) => Boolean(v[k]);

const MATERIAS_DEFAULT = [
  'alteração do contrato de sociedade, aumento ou redução do capital',
  'entrada de novos sócios',
  'contracção de empréstimos ou prestação de garantias acima de ____________ MT',
  'venda ou oneração de bens do activo imobilizado',
  'aprovação do orçamento anual e do plano de negócios',
  'distribuição de dividendos',
].join('\n');

export default defineTemplate({
  id: 'acordo-parassocial',
  family: 'contrato',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'partes', title: l('Partes (sócios)', 'Parties (members)') },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'clausulas', title: l('Cláusulas', 'Clauses'), description: l('Active só as regras que pretende.', 'Turn on only the rules you want.') },
    { id: 'final', title: l('Duração e litígios', 'Term and disputes') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    {
      name: 'partes',
      type: 'lines',
      section: 'partes',
      required: true,
      label: l('Sócios que assinam o acordo', 'Members signing the agreement'),
      addLabel: l('Adicionar sócio', 'Add member'),
      columns: SOCIO_COLUMNS,
      default: [
        { tipo: 'pessoa', nome: '', genero: 'M', nacionalidade: 'moçambicana', docTipo: 'BI', quota: '' },
        { tipo: 'pessoa', nome: '', genero: 'M', nacionalidade: 'moçambicana', docTipo: 'BI', quota: '' },
      ],
    },
    ...sociedadeFields('sociedade'),

    { name: 'gerencia', type: 'toggle', section: sec, label: l('Composição da gerência', 'Composition of management') },
    { name: 'gerenciaTexto', type: 'textarea', section: sec, rows: 2, label: l('Como é composta a gerência', 'How management is composed'), placeholder: l('Ex.: cada parte indica um gerente; a sociedade obriga-se com a assinatura de dois gerentes', 'E.g. each party appoints one manager…'), showIf: when('gerencia') },

    { name: 'reservadas', type: 'toggle', section: sec, label: l('Matérias que exigem acordo reforçado', 'Reserved matters') },
    { name: 'materias', type: 'textarea', section: sec, rows: 5, label: l('Matérias (uma por linha)', 'Matters (one per line)'), default: MATERIAS_DEFAULT, showIf: when('reservadas') },
    {
      name: 'maioriaReservada',
      type: 'select',
      section: sec,
      width: 'half',
      label: l('Aprovação', 'Approval'),
      options: [
        { value: 'unanimidade', label: l('Todas as partes', 'All parties') },
        { value: 'percentagem', label: l('Partes com uma percentagem do capital', 'Parties holding a share of capital') },
      ],
      default: 'unanimidade',
      showIf: when('reservadas'),
    },
    { name: 'maioriaPct', type: 'number', section: sec, width: 'half', min: 51, max: 100, label: l('Percentagem mínima do capital', 'Minimum share of capital'), showIf: (v) => Boolean(v.reservadas) && v.maioriaReservada === 'percentagem' },

    { name: 'dividendos', type: 'toggle', section: sec, label: l('Política de dividendos', 'Dividend policy') },
    { name: 'dividendosPct', type: 'number', section: sec, width: 'half', min: 0, max: 100, label: l('Percentagem dos lucros distribuíveis a distribuir', 'Share of distributable profit paid out'), showIf: when('dividendos') },

    { name: 'lockup', type: 'toggle', section: sec, label: l('Proibição de vender durante um período (lock-up)', 'Lock-up period') },
    { name: 'lockupAnos', type: 'number', section: sec, width: 'half', min: 1, max: 10, label: l('Anos', 'Years'), showIf: when('lockup') },

    { name: 'preferencia', type: 'toggle', section: sec, default: true, label: l('Direito de preferência entre as partes', 'Pre-emption among the parties') },
    { name: 'preferenciaDias', type: 'number', section: sec, width: 'half', min: 1, max: 180, default: 30, label: l('Prazo para exercer (dias)', 'Period to exercise (days)'), showIf: when('preferencia') },

    { name: 'tagAlong', type: 'toggle', section: sec, label: l('Direito de acompanhar a venda (tag-along)', 'Tag-along right') },
    { name: 'dragAlong', type: 'toggle', section: sec, label: l('Obrigação de acompanhar a venda (drag-along)', 'Drag-along right') },
    { name: 'dragPct', type: 'number', section: sec, width: 'half', min: 51, max: 100, label: l('A partir de que percentagem do capital', 'From which share of capital'), showIf: when('dragAlong') },

    { name: 'naoConcorrencia', type: 'toggle', section: sec, label: l('Não concorrência', 'Non-compete') },
    { name: 'naoConcorrenciaAnos', type: 'number', section: sec, width: 'half', min: 1, max: 5, label: l('Anos após deixar de ser sócio', 'Years after ceasing to be a member'), showIf: when('naoConcorrencia') },
    { name: 'territorio', type: 'text', section: sec, width: 'half', label: l('Território', 'Territory'), default: 'República de Moçambique', showIf: when('naoConcorrencia') },

    { name: 'confidencialidade', type: 'toggle', section: sec, default: true, label: l('Confidencialidade', 'Confidentiality') },
    { name: 'impasse', type: 'toggle', section: sec, label: l('Resolução de impasses', 'Deadlock resolution') },
    { name: 'penal', type: 'toggle', section: sec, label: l('Cláusula penal por incumprimento', 'Penalty for breach') },
    { name: 'penalValor', type: 'money', section: sec, width: 'half', label: l('Valor da cláusula penal (MT)', 'Penalty amount (MT)'), showIf: when('penal') },
    { name: 'outras', type: 'textarea', section: sec, rows: 3, label: l('Outras regras (uma por linha)', 'Other rules (one per line)') },

    {
      name: 'duracao',
      type: 'select',
      section: 'final',
      width: 'half',
      label: l('Duração', 'Term'),
      options: [
        { value: 'socios', label: l('Enquanto forem sócios', 'While they are members') },
        { value: 'anos', label: l('Número de anos', 'Number of years') },
      ],
      default: 'socios',
    },
    { name: 'duracaoAnos', type: 'number', section: 'final', width: 'half', min: 1, max: 30, label: l('Anos', 'Years'), showIf: (v) => v.duracao === 'anos' },
    {
      name: 'litigios',
      type: 'select',
      section: 'final',
      width: 'half',
      label: l('Litígios', 'Disputes'),
      options: [
        { value: 'tribunal', label: l('Tribunal judicial', 'Court') },
        { value: 'arbitragem', label: l('Arbitragem', 'Arbitration') },
      ],
      default: 'tribunal',
    },
    { name: 'foro', type: 'text', section: 'final', width: 'half', label: l('Tribunal ou centro de arbitragem', 'Court or arbitration centre'), default: 'Tribunal Judicial da Cidade de Maputo' },
  ],

  personName: (v) => str(v.sociedadeFirma) || undefined,
  documentDate: (v) => v.data,

  warnings: (v) => {
    const w: Warning[] = [];
    if (socios(v.partes).length < 2) w.push({ level: 'warning', field: 'partes', message: l('O acordo precisa de pelo menos dois sócios.', 'The agreement needs at least two members.') });
    w.push(
      { level: 'info', message: l(`O acordo vincula apenas as partes e não pode ser invocado contra a sociedade nem contra terceiros (${cite('acordoParassocial')}). Regras que devam valer perante todos têm de constar do contrato de sociedade.`, 'The agreement binds only the parties and cannot be invoked against the company or third parties. Rules that must bind everyone belong in the articles.') },
      { level: 'info', message: l('Cláusulas contrárias a normas imperativas são nulas. Recomenda-se revisão por advogado.', 'Clauses contrary to mandatory law are void. Legal review is recommended.') },
    );
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const ps: Socio[] = socios(v.partes);
    const capital = money(v.sociedadeCapital) ?? (ps.some((p) => p.quota != null) ? ps.reduce((a, p) => a + (p.quota ?? 0), 0) : null);
    const pcto = (x: unknown) => {
      const n = num(x);
      return n != null ? `${n}%` : '____%';
    };

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: 'O presente acordo regula as relações entre as partes enquanto sócios da Sociedade, designadamente quanto ao exercício do direito de voto, à composição da gerência e à transmissão das respectivas quotas.',
        en: 'This agreement governs the parties’ relations as members of the company: voting, management and transfer of quotas.',
      },
      {
        id: 'natureza',
        heading: 'Natureza e prevalência',
        text: numerar([
          'O presente acordo vincula apenas as partes e não é oponível à Sociedade nem a terceiros.',
          'Em caso de conflito entre o presente acordo e o contrato de sociedade, as partes obrigam-se a votar no sentido de alterar o contrato de sociedade de modo a reflectir o aqui acordado, na medida em que a lei o permita.',
        ]),
        en: 'The agreement binds only the parties. If it conflicts with the articles, the parties will vote to amend the articles accordingly, as far as the law allows.',
      },
    ];
    if (v.gerencia) {
      clauses.push({ id: 'gerencia', heading: 'Composição da gerência', text: `As partes obrigam-se a votar de modo a que a gerência da Sociedade tenha a seguinte composição e funcionamento: ${semPonto(v.gerenciaTexto).replace(/^[A-ZÁÉÍÓÚ](?=[a-záéíóúâêôãõç])/, (x) => x.toLowerCase()) || BLANK}.`, en: 'The parties will vote so that management is composed as stated.' });
    }
    if (v.reservadas) {
      const ms = splitOutros(v.materias);
      const aprov = v.maioriaReservada === 'percentagem' ? `com o voto favorável de partes que representem, pelo menos, ${pcto(v.maioriaPct)} do capital social` : 'com o voto favorável de todas as partes';
      clauses.push({
        id: 'reservadas',
        heading: 'Matérias reservadas',
        text: `As partes obrigam-se a só votar favoravelmente, na assembleia geral ou na gerência, as deliberações sobre as matérias seguintes ${aprov}:\n${(ms.length ? ms : [BLANK]).map((m, i, a) => `${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}) ${m}${i === a.length - 1 ? '.' : ';'}`).join('\n')}`,
        en: 'The listed matters need the stated approval of the parties.',
      });
    }
    if (v.dividendos) {
      clauses.push({ id: 'dividendos', heading: 'Política de dividendos', text: `As partes obrigam-se a votar a distribuição anual de, pelo menos, ${pcto(v.dividendosPct)} dos lucros distribuíveis de cada exercício, salvo se as necessidades de investimento ou a situação financeira da Sociedade, devidamente fundamentadas pela gerência, o desaconselharem.`, en: 'The parties will vote to pay out at least the stated share of distributable profit each year, unless investment needs or the financial situation justify otherwise.' });
    }
    if (v.lockup) {
      clauses.push({ id: 'lockup', heading: 'Período de indisponibilidade', text: `Durante ${quantos(num(v.lockupAnos), 'ano', 'anos')} a contar da data do presente acordo, nenhuma das partes pode ceder ou onerar, no todo ou em parte, a sua quota sem o consentimento escrito das demais.`, en: 'During the stated years no party may transfer or encumber its quota without the others’ written consent.' });
    }
    if (v.preferencia) {
      clauses.push({ id: 'preferencia', heading: 'Direito de preferência', text: `A parte que pretenda ceder a sua quota a terceiro comunica-o por escrito às demais, indicando o adquirente, o preço e as condições; as demais partes têm direito de preferência, na proporção das suas quotas, a exercer no prazo de ${quantos(num(v.preferenciaDias), 'dia', 'dias')} a contar da comunicação.`, en: 'A party selling to a third party must notify the others, who have a pre-emption right pro rata within the stated period.' });
    }
    if (v.tagAlong) {
      clauses.push({ id: 'tagAlong', heading: 'Direito de acompanhar a venda', text: 'Se uma parte pretender ceder a sua quota a terceiro e as demais não exercerem a preferência, estas podem exigir que o adquirente compre também as suas quotas, nas mesmas condições e pelo mesmo preço proporcional.', en: 'Tag-along: the others may require the buyer to purchase their quotas on the same terms.' });
    }
    if (v.dragAlong) {
      clauses.push({ id: 'dragAlong', heading: 'Obrigação de acompanhar a venda', text: `Se partes que representem, pelo menos, ${pcto(v.dragPct)} do capital social aceitarem uma proposta de terceiro para a aquisição da totalidade do capital, as demais partes obrigam-se a ceder-lhe as suas quotas nas mesmas condições e pelo mesmo preço proporcional.`, en: 'Drag-along: holders of the stated share may require the others to sell on the same terms.' });
    }
    if (v.naoConcorrencia) {
      clauses.push({ id: 'naoConcorrencia', heading: 'Não concorrência', text: `Enquanto forem sócios e durante ${quantos(num(v.naoConcorrenciaAnos), 'ano', 'anos')} após deixarem de o ser, as partes não exercem, directa ou indirectamente, no território ${semPonto(v.territorio) ? deEntidade(semPonto(v.territorio)) : `de ${BLANK}`}, actividade concorrente com a da Sociedade, nem aliciam os seus trabalhadores ou clientes.`, en: 'Non-compete and non-solicitation while members and for the stated period afterwards, in the stated territory.' });
    }
    if (v.confidencialidade) {
      clauses.push({ id: 'confidencialidade', heading: 'Confidencialidade', text: 'As partes mantêm confidenciais o conteúdo do presente acordo e as informações sobre a Sociedade a que tenham acesso, salvo quando a sua divulgação seja exigida por lei ou por autoridade competente.', en: 'The parties keep this agreement and company information confidential unless disclosure is required by law.' });
    }
    if (v.impasse) {
      clauses.push({ id: 'impasse', heading: 'Resolução de impasses', text: numerar(['Se, em duas reuniões consecutivas, não for possível deliberar sobre uma matéria essencial ao funcionamento da Sociedade, as partes reúnem-se para procurar uma solução de boa-fé.', 'Persistindo o impasse, as partes submetem a questão a mediação por mediador escolhido de comum acordo, antes de recorrerem aos meios previstos na cláusula sobre litígios.']), en: 'Deadlock: good-faith meeting, then mediation before litigation or arbitration.' });
    }
    if (v.penal) {
      clauses.push({ id: 'penal', heading: 'Incumprimento', text: `A parte que incumprir o presente acordo paga às demais, a título de cláusula penal, a quantia de ${valorTexto(v.penalValor, false)}, sem prejuízo da indemnização pelo dano excedente.`, en: 'A party in breach pays the stated penalty, plus any further damages.' });
    }
    splitOutros(v.outras).forEach((t, i) => clauses.push({ id: `outra-${i + 1}`, heading: 'Outras disposições', text: `${t.charAt(0).toLocaleUpperCase('pt')}${t.slice(1)}.`, en: 'Further provision, as worded.' }));
    clauses.push(
      {
        id: 'duracao',
        heading: 'Duração',
        text: v.duracao === 'anos' ? `O presente acordo vigora pelo prazo de ${quantos(num(v.duracaoAnos), 'ano', 'anos')} a contar da sua assinatura e caduca, quanto a cada parte, quando esta deixar de ser sócia da Sociedade.` : 'O presente acordo vigora enquanto as partes, ou pelo menos duas delas, forem sócias da Sociedade.',
        en: v.duracao === 'anos' ? 'The agreement lasts for the stated years.' : 'The agreement lasts while at least two parties remain members.',
      },
      {
        id: 'litigios',
        heading: 'Lei aplicável e litígios',
        text:
          v.litigios === 'arbitragem'
            ? `O presente acordo rege-se pela lei moçambicana. Os litígios dele emergentes são resolvidos por arbitragem, de acordo com o regulamento do ${semPonto(v.foro) || BLANK}, cuja decisão as partes aceitam como definitiva.`
            : `O presente acordo rege-se pela lei moçambicana. Para dirimir os litígios dele emergentes, as partes elegem o foro do ${semPonto(v.foro) || 'tribunal competente'}, com expressa renúncia a qualquer outro.`,
        en: v.litigios === 'arbitragem' ? 'Mozambican law; disputes by arbitration at the centre named.' : 'Mozambican law; disputes go to the court named.',
      },
    );

    const ordem = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto', 'Sexto', 'Sétimo', 'Oitavo', 'Nono', 'Décimo'];
    const blocks: Block[] = [
      { type: 'title', text: 'Acordo Parassocial', subtitle: sociedadeNome(v) },
      { type: 'paragraph', id: 'entre', text: 'Entre:', align: 'left', keepWithNext: true, en: 'Between:' },
      ...(ps.length ? ps : [null, null]).map((p, i, a): Block => ({
        type: 'paragraph',
        id: `parte-${i + 1}`,
        text: `**${ordem[i] ?? `${i + 1}.º`}:** ${p ? `${socioIdent(p)}, titular de uma quota com o valor nominal de ${valorTexto(p.quota, false)}, correspondente a ${pct(p.quota, capital)} do capital social` : BLANK}${i === a.length - 1 ? ',' : ';'}`,
        en: `Party ${i + 1}, identified above.`,
      })),
      {
        type: 'paragraph',
        id: 'considerando',
        text: `sendo todos sócios da sociedade ${sociedadeIdent(v)}, adiante designada por **Sociedade**${ps.some((p) => p.quota != null) ? `, representando em conjunto ${pct(ps.reduce((a, p) => a + (p.quota ?? 0), 0), capital)} do capital social` : ''}, é celebrado o presente acordo parassocial, que se rege pelas cláusulas seguintes:`,
        en: 'all members of the company identified above, enter into this shareholders’ agreement on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, a ${dateLong(v.data)}, em ${inteiroPorExtenso(Math.max(2, ps.length))} exemplares de igual teor e valor, ficando um em poder de cada uma das partes.`,
        en: 'Made in as many copies as parties, one for each.',
        keepWithNext: true,
      },
      ...signatureRows((ps.length ? ps : []).map(socioSignature)),
    ];
    return blocks;
  },
});
