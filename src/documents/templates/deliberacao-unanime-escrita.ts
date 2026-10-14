// Deliberação social unânime por escrito (all members, no meeting) and the
// single-member variant "Decisão do sócio único". Preset resolutions cover the
// everyday cases; free text covers the rest.
import { defineTemplate, ORDINAIS_M, type Block, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, GENERO_OPTIONS, isF, l, lineItems, localField, money, splitLines } from './_shared';
import {
  juntar, minus, pct, quantos, comReconhecimento, semPonto, signatureRows, sociedadeFields, sociedadeIdent, sociedadeNome, str, valorTexto,
} from './_sociedades';

type Membro = { nome: string; f: boolean; quota: number | null; representante: string };

const membros = (v: Values): Membro[] =>
  lineItems(v.socios)
    .map((r) => ({ nome: str(r.nome), f: isF(r.genero), quota: money(r.quota), representante: semPonto(r.representante) }))
    .filter((m) => m.nome || m.quota != null);

const unico = (v: Values) => v.variante === 'socioUnico';

const PRESETS: { name: string; pt: string; en: string; registavel: boolean }[] = [
  { name: 'nomearGerente', pt: 'Nomear gerente', en: 'Appoint a manager', registavel: true },
  { name: 'destituirGerente', pt: 'Destituir gerente', en: 'Remove a manager', registavel: true },
  { name: 'aceitarRenuncia', pt: 'Aceitar a renúncia de um gerente', en: 'Accept a manager’s resignation', registavel: true },
  { name: 'aprovarContas', pt: 'Aprovar as contas do exercício', en: 'Approve the annual accounts', registavel: false },
  { name: 'mudarSede', pt: 'Mudar a sede', en: 'Move the registered office', registavel: true },
  { name: 'contaBancaria', pt: 'Abrir conta bancária / designar assinantes', en: 'Open a bank account / bank signatories', registavel: false },
  { name: 'consentirCessao', pt: 'Consentir numa cessão de quota', en: 'Consent to a quota transfer', registavel: false },
  { name: 'aumentoCapital', pt: 'Aumentar o capital social', en: 'Increase the share capital', registavel: true },
  { name: 'mandatoRegisto', pt: 'Mandatar alguém para o registo', en: 'Authorise someone to register', registavel: false },
];

const sec = 'deliberacoes';
const when = (k: string) => (v: Values) => Boolean(v[k]);

const presetFields: FieldDef[] = [
  { name: 'nomearGerente', type: 'toggle', section: sec, label: l('Nomear gerente', 'Appoint a manager') },
  { name: 'gerenteNome', type: 'text', section: sec, width: 'half', label: l('Nome do novo gerente', 'New manager’s name'), showIf: when('nomearGerente') },
  { name: 'gerenteGenero', type: 'radio', section: sec, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: when('nomearGerente') },
  { name: 'gerenteIdent', type: 'text', section: sec, label: l('Identificação (BI n.º, residência)', 'Identification (ID no., address)'), placeholder: l('Ex.: portador do BI n.º 110100123456B, residente em Maputo', 'E.g. ID number and address'), showIf: when('nomearGerente') },
  {
    name: 'gerenteMandato', type: 'select', section: sec, width: 'half', label: l('Mandato', 'Term'), default: 'indeterminado', showIf: when('nomearGerente'),
    options: [
      { value: 'indeterminado', label: l('Tempo indeterminado', 'Indefinite') },
      { value: 'anos', label: l('Número de anos', 'Number of years') },
    ],
  },
  { name: 'gerenteAnos', type: 'number', section: sec, width: 'half', min: 1, max: 10, label: l('Anos', 'Years'), showIf: (v) => Boolean(v.nomearGerente) && v.gerenteMandato === 'anos' },
  { name: 'gerenteRemunerado', type: 'toggle', section: sec, label: l('Com remuneração', 'Paid'), showIf: when('nomearGerente') },

  { name: 'destituirGerente', type: 'toggle', section: sec, label: l('Destituir gerente', 'Remove a manager') },
  { name: 'destituidoNome', type: 'text', section: sec, width: 'half', label: l('Nome do gerente destituído', 'Name of the manager removed'), showIf: when('destituirGerente') },
  { name: 'destituicaoData', type: 'date', section: sec, width: 'half', label: l('Com efeitos a partir de', 'Effective from'), showIf: when('destituirGerente') },

  { name: 'aceitarRenuncia', type: 'toggle', section: sec, label: l('Tomar conhecimento da renúncia de um gerente', 'Note a manager’s resignation') },
  { name: 'renunciaNome', type: 'text', section: sec, label: l('Nome do gerente que renunciou', 'Name of the manager who resigned'), showIf: when('aceitarRenuncia') },
  { name: 'renunciaCarta', type: 'date', section: sec, width: 'half', label: l('Data da carta de renúncia', 'Date of the resignation letter'), showIf: when('aceitarRenuncia') },
  { name: 'renunciaEfeitos', type: 'date', section: sec, width: 'half', label: l('Com efeitos a partir de', 'Effective from'), showIf: when('aceitarRenuncia') },

  { name: 'aprovarContas', type: 'toggle', section: sec, label: l('Aprovar o relatório e as contas do exercício', 'Approve the annual report and accounts') },
  { name: 'contasAno', type: 'text', section: sec, width: 'half', label: l('Exercício (ano)', 'Financial year'), placeholder: l('Ex.: 2025', 'E.g. 2025'), showIf: when('aprovarContas') },
  {
    name: 'contasResultadoTipo', type: 'select', section: sec, width: 'half', label: l('Resultado', 'Result'), default: 'positivo', showIf: when('aprovarContas'),
    options: [
      { value: 'positivo', label: l('Lucro', 'Profit') },
      { value: 'negativo', label: l('Prejuízo', 'Loss') },
    ],
  },
  { name: 'contasResultado', type: 'money', section: sec, width: 'half', label: l('Resultado líquido (MT)', 'Net result (MT)'), showIf: when('aprovarContas') },
  {
    name: 'contasAplicacao', type: 'textarea', section: sec, rows: 3, label: l('Aplicação do resultado', 'Appropriation of the result'), showIf: when('aprovarContas'),
    placeholder: l('Ex.: reserva legal: 25.000,00 MT\nresultados transitados: 175.000,00 MT\ndividendos: 300.000,00 MT', 'E.g. legal reserve, retained earnings, dividends'),
  },

  { name: 'mudarSede', type: 'toggle', section: sec, label: l('Mudar a sede', 'Move the registered office') },
  { name: 'novaSede', type: 'text', section: sec, label: l('Nova sede (morada completa)', 'New office (full address)'), showIf: when('mudarSede') },
  { name: 'artigoSede', type: 'text', section: sec, width: 'half', label: l('Artigo do contrato sobre a sede', 'Article on the office'), placeholder: l('Ex.: segundo', 'E.g. second'), showIf: when('mudarSede') },

  { name: 'contaBancaria', type: 'toggle', section: sec, label: l('Conta bancária e assinantes', 'Bank account and signatories') },
  { name: 'banco', type: 'text', section: sec, width: 'half', label: l('Banco', 'Bank'), placeholder: l('Ex.: Banco Comercial e de Investimentos', 'E.g. bank name'), showIf: when('contaBancaria') },
  {
    name: 'contaAccao', type: 'select', section: sec, width: 'half', label: l('Deliberação', 'Resolution'), default: 'abrir', showIf: when('contaBancaria'),
    options: [
      { value: 'abrir', label: l('Abrir conta e designar assinantes', 'Open an account and name signatories') },
      { value: 'alterar', label: l('Alterar os assinantes de conta existente', 'Change the signatories of an existing account') },
    ],
  },
  { name: 'contaNumero', type: 'text', section: sec, width: 'half', label: l('N.º da conta (se existente)', 'Account no. (if existing)'), showIf: (v) => Boolean(v.contaBancaria) && v.contaAccao === 'alterar' },
  { name: 'signatarios', type: 'textarea', section: sec, rows: 2, label: l('Assinantes (um por linha)', 'Signatories (one per line)'), showIf: when('contaBancaria') },
  {
    name: 'movimentacao', type: 'select', section: sec, width: 'half', label: l('A conta movimenta-se com', 'The account is operated by'), default: 'uma', showIf: when('contaBancaria'),
    options: [
      { value: 'uma', label: l('Uma assinatura', 'One signature') },
      { value: 'duas', label: l('Duas assinaturas em conjunto', 'Two signatures jointly') },
    ],
  },
  { name: 'limite', type: 'money', section: sec, width: 'half', label: l('Limite por operação com uma assinatura (opcional)', 'Single-signature limit (optional)'), showIf: (v) => Boolean(v.contaBancaria) && v.movimentacao === 'uma' },

  { name: 'consentirCessao', type: 'toggle', section: sec, label: l('Consentir numa cessão de quota', 'Consent to a quota transfer') },
  { name: 'cessaoCedente', type: 'text', section: sec, width: 'half', label: l('Sócio que cede (cedente)', 'Transferor'), showIf: when('consentirCessao') },
  { name: 'cessaoQuota', type: 'money', section: sec, width: 'half', label: l('Valor nominal da quota cedida (MT)', 'Nominal value transferred (MT)'), showIf: when('consentirCessao') },
  { name: 'cessaoCessionario', type: 'text', section: sec, label: l('A favor de (cessionário)', 'In favour of (transferee)'), showIf: when('consentirCessao') },

  { name: 'aumentoCapital', type: 'toggle', section: sec, label: l('Aumentar o capital social', 'Increase the share capital') },
  { name: 'capitalNovo', type: 'money', section: sec, width: 'half', label: l('Novo capital social (MT)', 'New share capital (MT)'), showIf: when('aumentoCapital') },
  {
    name: 'capitalModalidade', type: 'select', section: sec, width: 'half', label: l('Modalidade', 'Method'), default: 'dinheiro', showIf: when('aumentoCapital'),
    options: [
      { value: 'dinheiro', label: l('Novas entradas em dinheiro', 'New cash contributions') },
      { value: 'reservas', label: l('Incorporação de reservas', 'Capitalising reserves') },
      { value: 'suprimentos', label: l('Conversão de suprimentos', 'Converting shareholder loans') },
    ],
  },
  { name: 'capitalSubscricao', type: 'textarea', section: sec, rows: 2, label: l('Como é subscrito o aumento', 'How the increase is subscribed'), placeholder: l('Ex.: pelos sócios, na proporção das respectivas quotas', 'E.g. by the members pro rata'), showIf: when('aumentoCapital') },
  { name: 'artigoCapital', type: 'text', section: sec, width: 'half', label: l('Artigo do contrato sobre o capital', 'Article on the capital'), placeholder: l('Ex.: quinto', 'E.g. fifth'), showIf: (v) => Boolean(v.aumentoCapital) },
  { name: 'capitalRedaccao', type: 'textarea', section: sec, rows: 4, label: l('Nova redacção do artigo do capital', 'New wording of the capital article'), showIf: when('aumentoCapital') },

  { name: 'mandatoRegisto', type: 'toggle', section: sec, label: l('Mandatar alguém para tratar do registo', 'Authorise someone to register') },
  { name: 'mandatarioNome', type: 'text', section: sec, label: l('Nome do mandatário', 'Authorised person'), showIf: when('mandatoRegisto') },

  { name: 'outras', type: 'textarea', section: sec, rows: 4, label: l('Outras deliberações (uma por linha)', 'Other resolutions (one per line)') },
];

export default defineTemplate({
  id: 'deliberacao-unanime-escrita',
  family: 'acta',
  official: 'registo',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'socios', title: l('Sócios', 'Members') },
    { id: 'deliberacoes', title: l('O que se decide', 'What is decided'), description: l('Escolha as deliberações; cada uma gera um ponto do documento.', 'Pick the resolutions; each becomes a numbered point.') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField(),
    ...sociedadeFields('sociedade'),
    {
      name: 'variante',
      type: 'radio',
      section: 'socios',
      label: l('Quem decide', 'Who decides'),
      options: [
        { value: 'socios', label: l('Todos os sócios (deliberação unânime)', 'All members (unanimous resolution)') },
        { value: 'socioUnico', label: l('O sócio único (decisão)', 'The sole member (decision)') },
      ],
      default: 'socios',
    },
    {
      name: 'socios',
      type: 'lines',
      section: 'socios',
      required: true,
      label: l('Sócios', 'Members'),
      help: l('Todos os sócios têm de constar e assinar. Se o sócio for uma sociedade, indique quem a representa.', 'Every member must be listed and sign. For a corporate member, give its representative.'),
      addLabel: l('Adicionar sócio', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome ou firma', 'Name or company') },
        { name: 'genero', type: 'select', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS },
        { name: 'quota', type: 'money', label: l('Valor nominal da quota (MT)', 'Quota (MT)') },
        { name: 'representante', type: 'text', label: l('Representante (se sociedade)', 'Representative (if a company)') },
      ],
      default: [
        { nome: '', genero: 'M', quota: '', representante: '' },
        { nome: '', genero: 'M', quota: '', representante: '' },
      ],
    },
    ...presetFields,
    {
      name: 'datasAssinatura',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Linha para a data de cada assinatura', 'Line for the date of each signature'),
      help: l('A deliberação considera-se tomada quando a sociedade recebe a última assinatura.', 'The resolution is taken when the company receives the last signature.'),
    },
    {
      name: 'reconhecimento',
      type: 'toggle',
      section: 'opcoes',
      label: l('Espaço para reconhecimento notarial', 'Space for notarial recognition'),
      help: l('Recomendado quando a deliberação vai a registo (gerentes, sede, capital).', 'Recommended when the resolution is registered (managers, office, capital).'),
    },
  ],

  personName: (v) => str(v.sociedadeFirma) || undefined,
  documentDate: (v) => v.data,

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const ms = membros(v);
    if (!ms.length) w.push({ level: 'warning', field: 'socios', message: l('Indique os sócios.', 'List the members.') });
    if (unico(v) && ms.length > 1) {
      w.push({ level: 'warning', field: 'socios', message: l('Na decisão do sócio único indique apenas um sócio.', 'For a sole-member decision list only one member.') });
    }
    if (!unico(v)) {
      w.push({ level: 'info', message: l(`Todos os sócios têm de assinar e votar no mesmo sentido (${cite('deliberacaoPorEscrito')}). Se algum não assinar, convoque a assembleia geral e lavre acta.`, 'Every member must sign and agree. If one does not, call a general meeting and draw up minutes.') });
    }
    const capital = money(v.sociedadeCapital);
    const soma = ms.reduce((a, m) => a + (m.quota ?? 0), 0);
    if (!unico(v) && capital != null && soma > 0 && Math.abs(soma - capital) > 0.5) {
      w.push({ level: 'warning', field: 'socios', message: l('A soma das quotas não corresponde ao capital social: a deliberação escrita exige todos os sócios.', 'The quotas do not add up to the share capital: a written resolution needs every member.') });
    }
    const reg = PRESETS.filter((p) => p.registavel && v[p.name]);
    if (reg.length) {
      w.push({
        level: 'info',
        message: l(
          `Esta deliberação está sujeita a registo (${reg.map((p) => p.pt.toLowerCase()).join(', ')}): requeira-o na Conservatória do Registo das Entidades Legais no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')}. A Conservatória costuma exigir as assinaturas reconhecidas.`,
          `This resolution must be registered within ${ctx.legal.value<number>('registoEntidadesPrazo')} days at the Legal Entities Registry, usually with certified signatures.`,
        ),
      });
    }
    if (v.mudarSede || v.aumentoCapital) {
      w.push({ level: 'info', message: l('Alteração do contrato de sociedade: junte ao pedido de registo o texto actualizado e completo do contrato.', 'Amendment of the articles: attach the updated full text to the registration request.') });
    }
    if (v.consentirCessao) {
      w.push({ level: 'info', message: l(`Após a cessão, actualize a declaração do beneficiário efectivo (${cite('beneficiarioEfectivoSociedade')}).`, 'After the transfer, update the beneficial owner declaration.') });
    }
    if (v.nomearGerente) {
      w.push({ level: 'info', message: l('Junte a declaração de aceitação do cargo assinada pelo novo gerente (modelo «Aceitar o cargo de gerente»).', 'Attach the new manager’s signed acceptance of office.') });
    }
    if (!PRESETS.some((p) => v[p.name]) && !splitLines(v.outras).length) {
      w.push({ level: 'warning', field: 'outras', message: l('Escolha pelo menos uma deliberação.', 'Choose at least one resolution.') });
    }
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const ms = membros(v);
    const capital = money(v.sociedadeCapital) ?? (ms.some((m) => m.quota != null) ? ms.reduce((a, m) => a + (m.quota ?? 0), 0) : null);
    const so = unico(v);
    const m0 = ms[0];
    const fUnico = Boolean(m0?.f);
    const firma = sociedadeNome(v);

    // Resolutions
    const pontos: { id: string; text: string; en: string }[] = [];
    if (v.nomearGerente) {
      const f = isF(v.gerenteGenero);
      const mandato = v.gerenteMandato === 'anos' ? `para um mandato de ${quantos(Number(v.gerenteAnos) || null, 'ano', 'anos')}` : 'por tempo indeterminado';
      pontos.push({
        id: 'nomearGerente',
        text: `Nomear ${f ? 'gerente da sociedade a Senhora' : 'gerente da sociedade o Senhor'} **${str(v.gerenteNome) || BLANK}**${str(v.gerenteIdent) ? `, ${semPonto(v.gerenteIdent)}` : ''}, ${mandato}, com dispensa de caução e ${v.gerenteRemunerado ? 'com a remuneração que vier a ser fixada' : 'sem remuneração'}.`,
        en: `Appoint ${v.gerenteNome || '—'} as manager, ${v.gerenteMandato === 'anos' ? `for ${v.gerenteAnos || '—'} years` : 'for an indefinite term'}, without security, ${v.gerenteRemunerado ? 'paid' : 'unpaid'}.`,
      });
    }
    if (v.destituirGerente) {
      pontos.push({
        id: 'destituirGerente',
        text: `Destituir do cargo de gerente da sociedade **${str(v.destituidoNome) || BLANK}**, com efeitos a partir de ${dateLong(v.destituicaoData)}.`,
        en: `Remove ${v.destituidoNome || '—'} as manager, effective ${v.destituicaoData || '—'}.`,
      });
    }
    if (v.aceitarRenuncia) {
      pontos.push({
        id: 'aceitarRenuncia',
        text: `Tomar conhecimento da renúncia apresentada por **${str(v.renunciaNome) || BLANK}** ao cargo de gerente, por carta datada de ${dateLong(v.renunciaCarta)}, com efeitos a partir de ${dateLong(v.renunciaEfeitos)}, e agradecer-lhe os serviços prestados.`,
        en: `Note the resignation of ${v.renunciaNome || '—'} as manager, by letter dated ${v.renunciaCarta || '—'}, effective ${v.renunciaEfeitos || '—'}.`,
      });
    }
    if (v.aprovarContas) {
      const aplic = splitLines(v.contasAplicacao).map((s) => minus(semPonto(s)));
      const neg = v.contasResultadoTipo === 'negativo';
      pontos.push({
        id: 'aprovarContas',
        text: `Aprovar o relatório de gestão, o balanço e as demais contas do exercício de ${str(v.contasAno) || '______'}, que apresentam um resultado líquido ${neg ? 'negativo' : 'positivo'} de ${valorTexto(v.contasResultado, false)}${aplic.length ? `, e aplicar o resultado da seguinte forma: ${aplic.join('; ')}` : neg ? ', que transita para o exercício seguinte' : ''}.`,
        en: `Approve the management report and accounts for ${v.contasAno || '—'}, showing a net ${neg ? 'loss' : 'profit'} of the amount stated${aplic.length ? ', appropriated as listed' : ''}.`,
      });
    }
    if (v.mudarSede) {
      const nova = semPonto(v.novaSede) || BLANK;
      pontos.push({
        id: 'mudarSede',
        text: `Transferir a sede da sociedade para ${nova}, alterando-se em conformidade o artigo ${semPonto(v.artigoSede) || '______'} do contrato de sociedade, que passa a ter a seguinte redacção: «A sociedade tem a sua sede em ${nova}.»`,
        en: `Move the registered office to ${v.novaSede || '—'} and amend the articles accordingly.`,
      });
    }
    if (v.contaBancaria) {
      const sig = splitLines(v.signatarios).map(semPonto);
      const assinantes = sig.length ? juntar(sig) : BLANK;
      const modo = v.movimentacao === 'duas'
        ? 'com a assinatura conjunta de dois dos assinantes designados'
        : `com a assinatura de qualquer um dos assinantes designados${money(v.limite) != null ? `, até ao limite de ${valorTexto(v.limite, false)} por operação, e com duas assinaturas acima desse valor` : ''}`;
      const banco = semPonto(v.banco) || BLANK;
      pontos.push({
        id: 'contaBancaria',
        text:
          v.contaAccao === 'alterar'
            ? `Alterar os assinantes da conta bancária n.º ${str(v.contaNumero) || BLANK} da sociedade junto do ${banco}, passando a ser assinantes ${assinantes}, e obrigando-se a sociedade ${modo}, revogando-se as autorizações anteriores.`
            : `Autorizar a abertura de conta bancária em nome da sociedade junto do ${banco} e designar como assinantes ${assinantes}, obrigando-se a sociedade ${modo}.`,
        en: `${v.contaAccao === 'alterar' ? 'Change the signatories of the account' : 'Open an account'} at ${v.banco || '—'}; signatories: ${sig.join(', ') || '—'}; ${v.movimentacao === 'duas' ? 'two signatures jointly' : 'one signature'}.`,
      });
    }
    if (v.consentirCessao) {
      pontos.push({
        id: 'consentirCessao',
        text: `Consentir na cessão de uma quota com o valor nominal de ${valorTexto(v.cessaoQuota, false)}, pertencente a ${str(v.cessaoCedente) || BLANK}, a favor de ${str(v.cessaoCessionario) || BLANK}, renunciando a sociedade e os demais sócios ao direito de preferência.`,
        en: `Consent to the transfer of a quota held by ${v.cessaoCedente || '—'} to ${v.cessaoCessionario || '—'}, waiving pre-emption rights.`,
      });
    }
    if (v.aumentoCapital) {
      const mod = v.capitalModalidade === 'reservas' ? 'por incorporação de reservas' : v.capitalModalidade === 'suprimentos' ? 'por conversão de créditos de suprimentos' : 'por novas entradas em dinheiro';
      const red = semPonto(v.capitalRedaccao);
      pontos.push({
        id: 'aumentoCapital',
        text: `Aumentar o capital social de ${valorTexto(v.sociedadeCapital, false)} para ${valorTexto(v.capitalNovo, false)}, ${mod}${str(v.capitalSubscricao) ? `, ${minus(semPonto(v.capitalSubscricao))}` : ''}, alterando-se em conformidade o artigo ${semPonto(v.artigoCapital) || '______'} do contrato de sociedade, que passa a ter a seguinte redacção: «${red ? `${red}.` : BLANK}»`,
        en: 'Increase the share capital to the amount stated and amend the capital article as worded.',
      });
    }
    if (v.mandatoRegisto) {
      pontos.push({
        id: 'mandatoRegisto',
        text: `Mandatar ${str(v.mandatarioNome) || BLANK} para praticar todos os actos necessários ao registo ${so ? 'da presente decisão' : 'da presente deliberação'} na Conservatória do Registo das Entidades Legais e à respectiva publicação, podendo assinar requerimentos e declarações e pagar taxas e emolumentos.`,
        en: `Authorise ${v.mandatarioNome || '—'} to register this resolution and arrange its publication.`,
      });
    }
    splitLines(v.outras).forEach((t, i) => pontos.push({ id: `outra-${i + 1}`, text: `${semPonto(t)}.`, en: 'Further resolution, as worded.' }));
    if (!pontos.length) pontos.push({ id: 'outra-1', text: BLANK, en: 'Resolution.' });

    // Opening
    const linhaSocio = (m: Membro) => `**${m.nome || BLANK}**${m.representante ? `, representada por ${m.representante}` : ''}, titular de uma quota com o valor nominal de ${valorTexto(m.quota, false)}, correspondente a ${pct(m.quota, capital)} do capital social`;
    const abertura = so
      ? `**${m0?.nome || BLANK}**${m0?.representante ? `, representada por ${m0.representante}` : ''}, ${fUnico ? 'sócia única' : 'sócio único'} da sociedade ${sociedadeIdent(v)}, titular da única quota representativa da totalidade do capital social, no exercício das competências da assembleia geral, decide o seguinte:`
      : `Os abaixo assinados, ${ms.length ? juntar(ms.map(linhaSocio)) : BLANK}, únicos sócios da sociedade ${sociedadeIdent(v)}, representando a totalidade do capital social, deliberam, por unanimidade e por escrito, sem reunião da assembleia geral, nos termos do Código Comercial e do contrato de sociedade, o seguinte:`;

    const blocks: Block[] = [
      { type: 'title', text: so ? 'Decisão do Sócio Único' : 'Deliberação Social Unânime por Escrito', subtitle: firma },
      {
        type: 'paragraph',
        id: 'abertura',
        text: abertura,
        en: so ? 'The sole member, exercising the powers of the general meeting, decides as follows:' : 'The undersigned, being all the members and holding the whole share capital, resolve unanimously and in writing, without a meeting, as follows:',
      },
      ...pontos.map((p, i): Block => ({
        type: 'paragraph',
        id: p.id,
        text: `**${ORDINAIS_M[i] ?? `${i + 1}.º`}:** ${p.text}`,
        en: p.en,
      })),
      {
        type: 'paragraph',
        id: 'fecho',
        text: so
          ? `A presente decisão é lançada no livro de actas da sociedade.`
          : 'A presente deliberação considera-se tomada na data em que a sociedade receber a última das assinaturas e é lançada no livro de actas da sociedade.',
        en: so ? 'This decision is entered in the minutes book.' : 'This resolution is taken on the date the company receives the last signature and is entered in the minutes book.',
        keepWithNext: true,
      },
    ];
    const cols: SignatureColumn[] = (ms.length ? (so ? [m0] : ms) : [null]).map((m) => ({
      role: m?.representante ? (so ? 'A Sócia Única' : 'A Sócia') : so ? (fUnico ? 'A Sócia Única' : 'O Sócio Único') : m?.f ? 'A Sócia' : 'O Sócio',
      name: m ? (m.representante ? m.representante.split(',')[0].trim() : m.nome) || undefined : undefined,
      detail: [m?.representante ? [m.representante.split(',').slice(1).join(',').trim(), m.nome].filter(Boolean).join(', ') : '', v.datasAssinatura ? 'Data: ___/___/______' : ''].filter(Boolean).join('\n') || undefined,
    }));
    blocks.push(...signatureRows(cols, `${ctx.place}, ${dateLong(v.data)}`));
    if (v.reconhecimento) comReconhecimento(blocks);
    return blocks;
  },
});
