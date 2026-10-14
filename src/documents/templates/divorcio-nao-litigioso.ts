// Divórcio não litigioso (por mútuo consentimento): both spouses ask the Civil
// Registry to dissolve the marriage and file the agreements the Family Law
// requires — maintenance between spouses, the family home and, with minor
// children, parental responsibilities (separate court-style agreement) — plus
// the list of joint assets and debts and, optionally, how they will be divided.

import { formatMonthYear, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money } from './_shared';
import { identificacao, pessoaFields } from './_pessoal-rh';
import { valorTexto } from './_contratos';
import { filhos, filhosField, filhoTexto, oMenor, semPonto, str } from './_familia';

const KEYS = ['nome', 'genero', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'] as const;

const REGIMES: Record<string, string> = {
  adquiridos: 'comunhão de adquiridos',
  geral: 'comunhão geral de bens',
  separacao: 'separação de bens',
};

const nomeDe = (v: Values, p: string) => str(v[`${p}Nome`]) || BLANK;
const oConj = (v: Values, p: string) => (isF(v[`${p}Genero`]) ? 'a requerente' : 'o requerente');

export default defineTemplate({
  id: 'divorcio-nao-litigioso',
  family: 'carta',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Pedido', 'Application') },
    { id: 'conjuge1', title: l('Primeiro cônjuge', 'First spouse'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'conjuge2', title: l('Segundo cônjuge', 'Second spouse'), personRole: 'outro' },
    { id: 'casamento', title: l('Casamento e filhos', 'Marriage and children') },
    { id: 'alimentos', title: l('Alimentos entre os cônjuges', 'Maintenance between spouses') },
    { id: 'casa', title: l('Casa de morada de família', 'Family home') },
    { id: 'bens', title: l('Bens comuns e dívidas', 'Joint assets and debts') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data do pedido', 'Date of the application')),
    {
      name: 'conservatoria',
      type: 'text',
      section: 'documento',
      required: true,
      label: l('Conservatória do Registo Civil', 'Civil Registry'),
      default: (c) => `Conservatória do Registo Civil de ${c.profile?.morada?.cidade || 'Maputo'}`,
      help: l('A da área de residência dos cônjuges.', 'The one for the spouses’ area of residence.'),
    },
    ...pessoaFields('conjuge1', 'conjuge1', { profile: true, keys: KEYS }),
    ...pessoaFields('conjuge2', 'conjuge2', { keys: KEYS }).map((f) =>
      f.name === 'conjuge2Genero' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'M' : 'F') } : f,
    ),
    { name: 'casamentoData', type: 'date', section: 'casamento', width: 'half', required: true, label: l('Data do casamento', 'Date of marriage') },
    { name: 'casamentoLocal', type: 'text', section: 'casamento', width: 'half', label: l('Local do casamento', 'Place of marriage') },
    { name: 'casamentoAssento', type: 'text', section: 'casamento', label: l('Assento de casamento (n.º e conservatória)', 'Marriage registration (no. and registry)'), placeholder: l('Ex.: assento n.º 1234/2012 da Conservatória do Registo Civil de Maputo', 'E.g. entry no. … of the Maputo Civil Registry') },
    {
      name: 'regime',
      type: 'select',
      section: 'casamento',
      width: 'half',
      label: l('Regime de bens', 'Property regime'),
      options: [
        { value: 'adquiridos', label: l('Comunhão de adquiridos (sem convenção)', 'Community of acquired property (default)') },
        { value: 'geral', label: l('Comunhão geral', 'Full community') },
        { value: 'separacao', label: l('Separação de bens', 'Separate property') },
      ],
      default: 'adquiridos',
    },
    { name: 'separadosDesde', type: 'month', section: 'casamento', width: 'half', label: l('Separados de facto desde (opcional)', 'Living apart since (optional)') },
    filhosField('filhos', 'casamento', l('Filhos menores do casal', 'Minor children of the couple')),
    {
      name: 'alimentos',
      type: 'radio',
      section: 'alimentos',
      label: l('Alimentos entre os cônjuges', 'Spousal maintenance'),
      options: [
        { value: 'nenhum', label: l('Nenhum precisa de alimentos', 'Neither needs maintenance') },
        { value: 'paga1', label: l('O primeiro paga ao segundo', 'The first pays the second') },
        { value: 'paga2', label: l('O segundo paga ao primeiro', 'The second pays the first') },
      ],
      default: 'nenhum',
    },
    { name: 'alimentosValor', type: 'money', section: 'alimentos', width: 'half', label: l('Valor mensal', 'Monthly amount'), showIf: (v) => v.alimentos !== 'nenhum' },
    { name: 'alimentosAte', type: 'text', section: 'alimentos', width: 'half', label: l('Durante', 'For'), placeholder: l('Ex.: dois anos; até voltar a casar', 'E.g. 24 months; until remarriage'), showIf: (v) => v.alimentos !== 'nenhum' },
    { name: 'alimentosForma', type: 'select', section: 'alimentos', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária', showIf: (v) => v.alimentos !== 'nenhum' },
    {
      name: 'casaTipo',
      type: 'select',
      section: 'casa',
      width: 'half',
      label: l('A casa de morada de família é', 'The family home is'),
      options: [
        { value: 'comum', label: l('Bem comum do casal', 'Jointly owned') },
        { value: 'propria1', label: l('Do primeiro cônjuge', 'Owned by the first spouse') },
        { value: 'propria2', label: l('Do segundo cônjuge', 'Owned by the second spouse') },
        { value: 'arrendada', label: l('Arrendada', 'Rented') },
      ],
      default: 'comum',
    },
    {
      name: 'casaFica',
      type: 'select',
      section: 'casa',
      width: 'half',
      label: l('Fica a viver na casa', 'Stays in the home'),
      options: [
        { value: 'conjuge1', label: l('O primeiro cônjuge', 'The first spouse') },
        { value: 'conjuge2', label: l('O segundo cônjuge', 'The second spouse') },
      ],
      default: 'conjuge2',
    },
    { name: 'casaMorada', type: 'text', section: 'casa', label: l('Morada da casa', 'Address of the home') },
    { name: 'casaCompensacao', type: 'money', section: 'casa', width: 'half', label: l('Compensação mensal ao outro (opcional)', 'Monthly compensation to the other (optional)'), showIf: (v) => v.casaTipo !== 'arrendada' },
    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      label: l('Bens comuns', 'Joint assets'),
      addLabel: l('Adicionar bem', 'Add asset'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Bem', 'Asset'), placeholder: l('Ex.: viatura Toyota RAV4, AEB 456 MC', 'E.g. car …') },
        { name: 'valor', type: 'money', label: l('Valor (MT)', 'Value (MT)') },
        {
          name: 'fica',
          type: 'select',
          label: l('Fica para', 'Goes to'),
          options: [
            { value: '', label: l('A partilhar depois', 'To be divided later') },
            { value: 'conjuge1', label: l('Primeiro cônjuge', 'First spouse') },
            { value: 'conjuge2', label: l('Segundo cônjuge', 'Second spouse') },
          ],
        },
      ],
      default: [],
    },
    {
      name: 'dividas',
      type: 'lines',
      section: 'bens',
      label: l('Dívidas comuns', 'Joint debts'),
      addLabel: l('Adicionar dívida', 'Add debt'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Dívida (credor)', 'Debt (creditor)') },
        { name: 'valor', type: 'money', label: l('Valor (MT)', 'Amount (MT)') },
        {
          name: 'paga',
          type: 'select',
          label: l('Paga', 'Paid by'),
          options: [
            { value: 'ambos', label: l('Ambos, em partes iguais', 'Both equally') },
            { value: 'conjuge1', label: l('Primeiro cônjuge', 'First spouse') },
            { value: 'conjuge2', label: l('Segundo cônjuge', 'Second spouse') },
          ],
        },
      ],
      default: [],
    },
  ],

  computed: (v) => {
    const lista = filhos(v.filhos);
    const bens = lineItems(v.bens).filter((r) => str(r.descricao));
    const dividas = lineItems(v.dividas).filter((r) => str(r.descricao));
    return {
      lista,
      bens,
      dividas,
      totalBens: roundMoney(bens.reduce((s, r) => s + (money(r.valor) ?? 0), 0)),
      totalDividas: roundMoney(dividas.reduce((s, r) => s + (money(r.valor) ?? 0), 0)),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    for (const p of ['conjuge1', 'conjuge2']) {
      if (!str(v[`${p}Nome`])) w.push({ level: 'error', field: `${p}Nome`, message: l('Indique o nome dos dois cônjuges.', 'Enter both spouses’ names.') });
      if (!str(v[`${p}DocNumero`])) w.push({ level: 'warning', field: `${p}DocNumero`, message: l('Falta o número do documento de identificação de um dos cônjuges.', 'One spouse’s ID number is missing.') });
    }
    if (!v.casamentoData) w.push({ level: 'warning', field: 'casamentoData', message: l('Indique a data do casamento.', 'Enter the date of marriage.') });
    w.push({
      level: 'warning',
      message: l(
        `O pedido é feito pelos dois cônjuges na conservatória da área de residência, com a certidão de casamento, os documentos de identificação e os acordos (${cite('famDivorcioNaoLitigioso')}). Confirme na conservatória se há tempo mínimo de casamento ou de separação, o prazo de reflexão e os emolumentos. Os dois devem comparecer.`,
        'Both spouses file at the registry of their area, with the marriage certificate, IDs and agreements. Check with the registry any minimum period of marriage or separation, the reflection period and the fees. Both must attend.',
      ),
    });
    if (c.lista.length) {
      w.push({
        level: 'warning',
        field: 'filhos',
        message: l(
          'Com filhos menores, juntem também o Acordo de Regulação do Exercício do Poder Parental e de Alimentos (residência, visitas e pensão). O conservador pode enviar o processo ao tribunal ou ao Ministério Público se o acordo não proteger os filhos.',
          'With minor children, also attach the Parental Responsibilities and Maintenance Agreement. The registrar may refer the case to the court or Public Prosecutor if the children are not protected.',
        ),
      });
    }
    if (c.bens.some((b: Record<string, unknown>) => /casa|terreno|flat|apartamento|moradia|im[oó]vel|viatura|carro/i.test(str(b.descricao)) && str(b.fica))) {
      w.push({ level: 'info', field: 'bens', message: l(`A partilha de imóveis e viaturas faz-se depois, por escritura ou documento autenticado, e exige registo (${cite('famPartilhaCasal')}). Aqui fica só o acordo sobre quem fica com cada bem.`, 'Dividing real estate and vehicles needs a deed or authenticated document and registration later. This records only who will keep each asset.') });
    }
    w.push({ level: 'info', message: l('O IPAJ presta assistência jurídica gratuita a quem não pode pagar advogado.', 'IPAJ provides free legal aid to those who cannot afford a lawyer.') });
    return w;
  },

  personName: (v) => [str(v.conjuge1Nome), str(v.conjuge2Nome)].filter(Boolean).join(' e ') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const lista = c.lista as ReturnType<typeof filhos>;
    const regime = REGIMES[v.regime] ?? REGIMES.adquiridos;
    const casamento = `casaram entre si em ${dateLong(v.casamentoData)}${str(v.casamentoLocal) ? `, em ${semPonto(v.casamentoLocal)}` : ''}, no regime de ${regime}`;
    const m = oMenor(lista);
    const sig = (p: string) => ({ role: isF(v[`${p}Genero`]) ? 'A Requerente' : 'O Requerente', name: str(v[`${p}Nome`]) || undefined });

    const factos = [
      `Os requerentes ${casamento}${str(v.casamentoAssento) ? ` (${semPonto(v.casamentoAssento)})` : ''}.`,
      str(v.separadosDesde) ? `Os requerentes vivem separados de facto desde ${formatMonthYear(`${str(v.separadosDesde)}-01`)}.` : '',
      lista.length
        ? `Do casamento ${lista.length > 1 ? 'nasceram os seguintes filhos, ainda menores' : `nasceu ${m.o === 'a menor' ? 'a filha' : 'o filho'}, ainda menor`}: ${lista.map((f) => filhoTexto(f)).join('; ')}.`
        : 'Do casamento não existem filhos menores.',
      'Os requerentes acordaram livremente em dissolver o casamento por divórcio, sem necessidade de indicar a respectiva causa.',
      `Os requerentes acordaram ainda quanto aos alimentos entre si, ao destino da casa de morada de família${lista.length ? ' e ao exercício do poder parental relativamente aos filhos menores' : ''}, nos termos dos acordos que juntam, bem como na relação dos bens comuns.`,
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: [`Conservador da ${semPonto(v.conservatoria).replace(/^(a\s+)/i, '') || `Conservatória do Registo Civil de ${BLANK}`}`] },
      { type: 'subject', text: 'Pedido de divórcio não litigioso (por mútuo consentimento)' },
      {
        type: 'paragraph',
        id: 'requerentes',
        text: `${identificacao(v, 'conjuge1', { estadoCivil: false })}, e ${identificacao(v, 'conjuge2', { estadoCivil: false })}, casados entre si, vêm, nos termos da ${cite('famDivorcioNaoLitigioso')}, requerer a V. Ex.ª o **divórcio não litigioso**, com os fundamentos seguintes:`,
        en: 'The spouses named above jointly apply for an uncontested divorce on the following grounds:',
      },
      { type: 'list', style: 'numeric', items: factos },
      {
        type: 'paragraph',
        id: 'pedido',
        text: 'Nestes termos, requerem a V. Ex.ª que, verificados os requisitos legais e homologados os acordos juntos, seja decretado o divórcio entre os requerentes, com o consequente averbamento ao assento de casamento.',
        en: 'They therefore ask that, the legal requirements being met and the agreements approved, the divorce be granted and recorded on the marriage entry.',
      },
      { type: 'paragraph', id: 'deferimento', text: 'Pedem deferimento.', align: 'left', editable: false, keepWithNext: true },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [sig('conjuge1'), sig('conjuge2')], keepWithNext: true },
      {
        type: 'annexList',
        items: [
          'Certidão de narrativa completa do registo de casamento',
          'Cópias dos documentos de identificação dos requerentes',
          ...(lista.length ? ['Certidões de nascimento dos filhos menores', 'Acordo de regulação do exercício do poder parental e de alimentos'] : []),
          'Acordos sobre alimentos e casa de morada de família e relação dos bens comuns (em anexo)',
        ],
      },
      { type: 'pageBreakHint' },
      { type: 'title', text: 'Acordos dos cônjuges', subtitle: 'Anexo ao pedido de divórcio não litigioso' },
      {
        type: 'paragraph',
        id: 'acordosIntro',
        text: `**${nomeDe(v, 'conjuge1')}** e **${nomeDe(v, 'conjuge2')}**, requerentes no pedido de divórcio não litigioso a que este documento se anexa, acordam no seguinte:`,
        en: 'The spouses agree as follows:',
      },
    ];

    // I — Alimentos
    const paga = v.alimentos === 'paga1' ? 'conjuge1' : 'conjuge2';
    const recebe = paga === 'conjuge1' ? 'conjuge2' : 'conjuge1';
    blocks.push(
      { type: 'heading', text: 'I — Alimentos entre os cônjuges' },
      {
        type: 'paragraph',
        id: 'alimentos',
        text:
          v.alimentos === 'nenhum'
            ? 'Cada um dos cônjuges declara dispor de meios próprios de subsistência, pelo que nenhum deles necessita de alimentos do outro.'
            : `${oConj(v, paga).replace(/^./, (x) => x.toUpperCase())} **${nomeDe(v, paga)}** paga ${oConj(v, recebe).replace(/^o /, 'ao ').replace(/^a /, 'à ')} **${nomeDe(v, recebe)}**, a título de alimentos, a quantia mensal de ${valorTexto(money(v.alimentosValor))}${str(v.alimentosAte) ? `, durante ${semPonto(v.alimentosAte)}` : ''}, até ao dia oito de cada mês, por ${str(v.alimentosForma) || 'transferência bancária'}, com início no mês seguinte ao divórcio. O montante pode ser alterado se as circunstâncias mudarem (${cite('famAlimentos')}).`,
        en: v.alimentos === 'nenhum' ? 'Neither spouse needs maintenance.' : `One spouse pays the other ${formatMoney(money(v.alimentosValor))} a month in maintenance.`,
      },
    );

    // II — Casa de morada de família
    const fica = v.casaFica === 'conjuge1' ? 'conjuge1' : 'conjuge2';
    const sai = fica === 'conjuge1' ? 'conjuge2' : 'conjuge1';
    const casa = `a casa de morada de família${str(v.casaMorada) ? `, sita em ${semPonto(v.casaMorada)}` : ''}`;
    const comp = money(v.casaCompensacao);
    const casaTxt =
      v.casaTipo === 'arrendada'
        ? `O arrendamento d${casa.slice(2)} fica a pertencer exclusivamente a **${nomeDe(v, fica)}**, que passa a ser o único responsável pelo pagamento da renda, comprometendo-se ambos a comunicar esta transmissão ao senhorio.`
        : `${casa.charAt(0).toUpperCase() + casa.slice(1)}, ${v.casaTipo === 'comum' ? 'bem comum do casal' : `bem próprio de ${nomeDe(v, v.casaTipo === 'propria1' ? 'conjuge1' : 'conjuge2')}`}, fica atribuída ao uso exclusivo de **${nomeDe(v, fica)}**${v.casaTipo === 'comum' ? ' até à partilha dos bens comuns' : ''}${comp != null ? `, que paga a **${nomeDe(v, sai)}**, como compensação, a quantia mensal de ${valorTexto(comp)}` : ', sem contrapartida'}. **${nomeDe(v, sai)}** retira os seus bens pessoais e entrega as chaves no prazo acordado entre ambos.`;
    blocks.push(
      { type: 'heading', text: 'II — Casa de morada de família' },
      { type: 'paragraph', id: 'casa', text: `${casaTxt}${lista.length ? ` Na decisão, os cônjuges tiveram em conta o interesse ${m.de}.` : ''}`, en: 'The family home goes to the spouse named, on the terms stated.' },
    );

    // III — Poder parental
    let n = 3;
    if (lista.length) {
      blocks.push(
        { type: 'heading', text: 'III — Exercício do poder parental' },
        {
          type: 'paragraph',
          id: 'poderParental',
          text: `A residência, o convívio e os alimentos ${m.de} constam do acordo de regulação do exercício do poder parental assinado pelos cônjuges, que se junta e aqui se dá por reproduzido.`,
          en: 'Residence, contact and maintenance for the children are set in the separate parental responsibilities agreement attached.',
        },
      );
      n = 4;
    }

    // IV — Bens e dívidas
    const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V'];
    const destino = (r: Record<string, unknown>) => (r.fica === 'conjuge1' ? nomeDe(v, 'conjuge1') : r.fica === 'conjuge2' ? nomeDe(v, 'conjuge2') : 'A partilhar');
    blocks.push({ type: 'heading', text: `${ROMANOS[n]} — Relação dos bens comuns e das dívidas`, keepWithNext: true });
    if (v.regime === 'separacao' && !c.bens.length) {
      blocks.push({ type: 'paragraph', id: 'semBens', text: 'Sendo o casamento celebrado no regime de separação de bens, não existem bens comuns a relacionar.', en: 'Under separate property there are no joint assets.' });
    } else {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Bem comum', width: 3.8 },
          { label: 'Valor (MT)', width: 1.4, align: 'right' },
          { label: 'Fica para', width: 2 },
        ],
        rows: (c.bens.length ? c.bens : [{}, {}, {}]).map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), str(r.descricao) ? formatMoney(money(r.valor), false) : '', str(r.descricao) ? destino(r) : '']),
        totals: c.bens.length ? [['', 'Total', formatMoney(c.totalBens, false), '']] : undefined,
        grid: true,
      });
    }
    if (c.dividas.length) {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Dívida comum (credor)', width: 3.8 },
          { label: 'Valor (MT)', width: 1.4, align: 'right' },
          { label: 'Paga', width: 2 },
        ],
        rows: c.dividas.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), formatMoney(money(r.valor), false), r.paga === 'conjuge1' ? nomeDe(v, 'conjuge1') : r.paga === 'conjuge2' ? nomeDe(v, 'conjuge2') : 'Ambos']),
        totals: [['', 'Total', formatMoney(c.totalDividas, false), '']],
        grid: true,
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'partilha',
        text: 'Os cônjuges declaram que a relação acima está completa. A partilha dos bens comuns será feita por acordo, depois de decretado o divórcio, com a forma exigida por lei para os bens sujeitos a registo, respeitando a atribuição acima indicada.',
        en: 'The list is complete. The division will follow the divorce, by agreement and in the legal form for registrable assets, respecting the allocation above.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [sig('conjuge1'), sig('conjuge2')] },
    );
    return blocks;
  },
});
