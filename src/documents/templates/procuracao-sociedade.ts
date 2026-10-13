// Procuração outorgada por sociedade: management gives an attorney powers to act
// for the company. The signatories must match the company's signing rules.
import { defineTemplate, type Block, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, localField } from './_shared';
import {
  companySignatures, isEmpresa, parte, parteFields, parteNome, RECONHECIMENTO_OPTIONS, comReconhecimento, representadaPor, representantes,
  REPRESENTANTE_COLUMNS, representantesDefault, semPonto, sociedadeFields, sociedadeIdent, splitOutros, str, valorTexto,
} from './_sociedades';

const sec = 'poderes';
const when = (k: string) => (v: Values) => Boolean(v[k]);

const PODERES: { name: string; label: [string, string]; texto: (v: Values) => string }[] = [
  {
    name: 'poderAT',
    label: ['Autoridade Tributária (impostos)', 'Tax Authority'],
    texto: () => 'representar a sociedade junto da Autoridade Tributária de Moçambique e das Direcções de Área Fiscal, entregar declarações fiscais, requerer e levantar certidões, pagar impostos e tratar de todos os assuntos fiscais da sociedade',
  },
  {
    name: 'poderINSS',
    label: ['INSS (segurança social)', 'Social security (INSS)'],
    texto: () => 'representar a sociedade junto do Instituto Nacional de Segurança Social, inscrever trabalhadores, entregar as declarações de remunerações, pagar contribuições e requerer certidões',
  },
  {
    name: 'poderRegisto',
    label: ['Conservatória e notário (registos)', 'Registry and notary'],
    texto: () => 'representar a sociedade junto da Conservatória do Registo das Entidades Legais e de quaisquer cartórios notariais, requerer registos, averbamentos, certidões e publicações, e assinar os respectivos requerimentos e declarações',
  },
  {
    name: 'poderAlfandegas',
    label: ['Alfândegas (importação e exportação)', 'Customs'],
    texto: () => 'representar a sociedade junto das Alfândegas de Moçambique, por si ou através de despachante oficial, no desembaraço aduaneiro de mercadorias importadas ou exportadas pela sociedade, assinar declarações e pagar direitos e taxas',
  },
  {
    name: 'poderBanco',
    label: ['Movimentar conta bancária', 'Operate a bank account'],
    texto: (v) =>
      `movimentar a conta bancária${str(v.contaNumero) ? ` n.º ${str(v.contaNumero)}` : ''} da sociedade junto do ${semPonto(v.banco) || BLANK}, efectuar depósitos, levantamentos e transferências${v.bancoLimite ? ` até ao limite de ${valorTexto(v.bancoLimite, false)} por operação` : ''}, requisitar extractos e assinar os documentos exigidos pelo banco`,
  },
  {
    name: 'poderContratos',
    label: ['Assinar contratos', 'Sign contracts'],
    texto: (v) =>
      `negociar, celebrar e assinar, em nome da sociedade, contratos de fornecimento, prestação de serviços e outros relativos à sua actividade${v.contratosLimite ? `, até ao valor de ${valorTexto(v.contratosLimite, false)} por contrato` : ''}`,
  },
  {
    name: 'poderAssembleia',
    label: ['Votar na assembleia de outra sociedade', 'Vote at another company’s meeting'],
    texto: (v) => `representar a sociedade na assembleia geral da sociedade ${semPonto(v.participada) || BLANK}, discutir e votar todos os pontos da ordem de trabalhos e assinar a respectiva lista de presenças e acta`,
  },
  {
    name: 'poderLicencas',
    label: ['Licenças e alvarás', 'Licences and permits'],
    texto: () => 'requerer licenças, alvarás e autorizações para o exercício da actividade da sociedade junto do Balcão de Atendimento Único, dos municípios e de quaisquer outras autoridades, e praticar os actos necessários aos respectivos processos',
  },
  {
    name: 'poderCorrespondencia',
    label: ['Receber correspondência e valores', 'Collect mail and goods'],
    texto: () => 'receber e levantar correspondência, encomendas, documentos e valores dirigidos à sociedade e assinar os respectivos recibos',
  },
  {
    name: 'poderJuizo',
    label: ['Representar em tribunal (advogado)', 'Represent in court (lawyer)'],
    texto: () => 'representar a sociedade em juízo, em quaisquer tribunais, activa e passivamente, com os mais amplos poderes forenses em direito permitidos, incluindo os de confessar, desistir e transigir',
  },
];

const poderFields: FieldDef[] = [
  ...PODERES.flatMap((p): FieldDef[] => {
    const base: FieldDef = { name: p.name, type: 'toggle', section: sec, label: l(p.label[0], p.label[1]) };
    if (p.name === 'poderBanco') {
      return [
        base,
        { name: 'banco', type: 'text', section: sec, width: 'half', label: l('Banco', 'Bank'), showIf: when('poderBanco') },
        { name: 'contaNumero', type: 'text', section: sec, width: 'half', label: l('N.º da conta', 'Account no.'), showIf: when('poderBanco') },
        { name: 'bancoLimite', type: 'money', section: sec, width: 'half', label: l('Limite por operação (opcional)', 'Limit per transaction (optional)'), showIf: when('poderBanco') },
      ];
    }
    if (p.name === 'poderContratos') {
      return [base, { name: 'contratosLimite', type: 'money', section: sec, width: 'half', label: l('Valor máximo por contrato (opcional)', 'Maximum per contract (optional)'), showIf: when('poderContratos') }];
    }
    if (p.name === 'poderAssembleia') {
      return [base, { name: 'participada', type: 'text', section: sec, label: l('Sociedade em cuja assembleia vota', 'Company whose meeting it attends'), showIf: when('poderAssembleia') }];
    }
    return [base];
  }),
  {
    name: 'outrosPoderes',
    type: 'textarea',
    section: sec,
    rows: 3,
    label: l('Outros poderes (um por linha)', 'Other powers (one per line)'),
    placeholder: l('Ex.: assinar o contrato de arrendamento do armazém da Matola', 'E.g. sign the lease of the Matola warehouse'),
  },
];

function procuradorIdent(v: Values): string {
  return parte(v, 'procurador', 'Procurador').replace(/, adiante designad[ao] por \*\*Procurador\*\*$/, '');
}

export default defineTemplate({
  id: 'procuracao-sociedade',
  family: 'declaracao',
  official: 'notario',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'sociedade', title: l('Sociedade (quem dá os poderes)', 'Company (grantor)') },
    { id: 'procurador', title: l('Procurador (quem recebe os poderes)', 'Attorney'), personRole: 'representante' },
    { id: 'poderes', title: l('Poderes', 'Powers') },
    { id: 'opcoes', title: l('Validade e opções', 'Validity and options') },
  ],
  fields: [
    localField(),
    dateField(),
    ...sociedadeFields('sociedade'),
    {
      name: 'representantes',
      type: 'lines',
      section: 'sociedade',
      label: l('Quem assina pela sociedade', 'Who signs for the company'),
      help: l('Os gerentes ou administradores que obrigam a sociedade (por exemplo, dois em conjunto).', 'The managers or directors who bind the company (e.g. two jointly).'),
      addLabel: l('Adicionar', 'Add'),
      columns: REPRESENTANTE_COLUMNS,
      default: representantesDefault,
    },
    {
      name: 'artigoObrigar',
      type: 'text',
      section: 'sociedade',
      width: 'half',
      label: l('Artigo do contrato sobre a forma de obrigar (opcional)', 'Article on signing powers (optional)'),
      placeholder: l('Ex.: décimo quarto', 'E.g. fourteenth'),
    },
    ...parteFields('procurador', 'procurador'),
    ...poderFields,
    { name: 'substabelecer', type: 'toggle', section: 'opcoes', label: l('Pode passar os poderes a outra pessoa (substabelecer)', 'May delegate the powers') },
    { name: 'validade', type: 'date', section: 'opcoes', width: 'half', label: l('Válida até (opcional)', 'Valid until (optional)'), help: l('Em branco: válida até ser revogada.', 'Blank: valid until revoked.') },
    {
      name: 'reconhecimento',
      type: 'select',
      section: 'opcoes',
      width: 'half',
      label: l('Reconhecimento das assinaturas', 'Signature recognition'),
      options: RECONHECIMENTO_OPTIONS,
      default: 'presencial',
      legal: l('Para actos que exigem intervenção notarial, a procuração tem as assinaturas reconhecidas presencialmente ou é lavrada pelo notário.', 'For acts requiring a notary, signatures are recognised in person or the deed is drawn up by the notary.'),
    },
  ],

  personName: (v) => parteNome(v, 'procurador') || undefined,
  documentDate: (v) => v.data,

  warnings: (v) => {
    const w: Warning[] = [];
    const reps = representantes(v.representantes);
    if (!reps.some((r) => r.nome)) w.push({ level: 'warning', field: 'representantes', message: l('Indique quem assina pela sociedade.', 'Say who signs for the company.') });
    w.push({
      level: 'info',
      field: 'representantes',
      message: l('Quem assina tem de corresponder à forma de obrigar do contrato de sociedade (por exemplo, dois gerentes em conjunto). O notário verifica-o pela certidão de registo comercial.', 'Signatories must match the signing rules in the articles; the notary checks the registry certificate.'),
    });
    if (!PODERES.some((p) => v[p.name]) && !splitOutros(v.outrosPoderes).length) {
      w.push({ level: 'warning', field: 'outrosPoderes', message: l('Escolha pelo menos um poder.', 'Choose at least one power.') });
    }
    if (v.poderJuizo) {
      w.push({ level: 'warning', field: 'poderJuizo', message: l('Só um advogado inscrito na Ordem dos Advogados pode representar a sociedade em tribunal (mandato forense).', 'Only a registered lawyer may represent the company in court.') });
    }
    if (v.poderBanco) {
      w.push({ level: 'info', field: 'poderBanco', message: l('Muitos bancos exigem o seu próprio impresso ou a assinatura reconhecida.', 'Many banks require their own form or a certified signature.') });
    }
    w.push({ level: 'info', message: l(`Forma: ${cite('procuracaoForma')}. A revogação deve ser comunicada ao procurador e às entidades onde a procuração foi usada.`, 'Form: see the notarial rules. Revocation must be notified to the attorney and to the institutions where it was used.') });
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const reps = representantes(v.representantes);
    const fP = !isEmpresa(v, 'procurador') && isF(v.procuradorGenero);
    const oProc = isEmpresa(v, 'procurador') ? 'a procuradora' : fP ? 'a procuradora' : 'o procurador';
    const OProc = oProc.charAt(0).toUpperCase() + oProc.slice(1);
    const poderes = [...PODERES.filter((p) => v[p.name]).map((p) => p.texto(v)), ...splitOutros(v.outrosPoderes)];
    const items = (poderes.length ? poderes : [BLANK]).map((p, i, arr) => `${p}${i === arr.length - 1 ? '.' : ';'}`);
    const artigo = semPonto(v.artigoObrigar);

    const blocks: Block[] = [
      { type: 'title', text: 'Procuração' },
      {
        type: 'paragraph',
        id: 'constituicao',
        text: `${sociedadeIdent(v)}, ${representadaPor(reps)}${artigo ? `, nos termos do artigo ${artigo} do contrato de sociedade` : ''}, constitui ${isEmpresa(v, 'procurador') || fP ? 'sua bastante procuradora' : 'seu bastante procurador'} ${procuradorIdent(v)}, a quem confere os poderes necessários para, em nome e em representação da sociedade, praticar os actos seguintes:`,
        en: 'The company, through its representatives, appoints the attorney named above, with the powers needed to act in its name to do the following:',
      },
      { type: 'list', style: 'alpha', items },
      {
        type: 'paragraph',
        id: 'actosNecessarios',
        text: `Para os referidos fins, ${oProc} pode requerer, assinar e apresentar quaisquer requerimentos, declarações e documentos, pagar taxas e emolumentos, receber notificações e praticar tudo o mais que se mostre necessário ao bom e cabal desempenho do presente mandato.`,
        en: 'To this end the attorney may sign and submit applications and documents, pay fees, receive notices and do anything else needed to perform this mandate.',
      },
      {
        type: 'paragraph',
        id: 'validade',
        text: `${v.substabelecer ? `${OProc} pode substabelecer, no todo ou em parte, com ou sem reserva, os poderes ora conferidos.` : 'Os poderes ora conferidos não podem ser substabelecidos.'} ${v.validade ? `A presente procuração é válida até ${dateLong(v.validade)}, salvo revogação anterior.` : 'A presente procuração mantém-se válida até ser revogada pela sociedade.'}`,
        en: `${v.substabelecer ? 'The attorney may delegate these powers.' : 'The powers may not be delegated.'} ${v.validade ? `Valid until ${v.validade}, unless revoked earlier.` : 'Valid until revoked by the company.'}`,
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, vai a presente procuração assinada pelos representantes da sociedade e autenticada com o respectivo carimbo.',
        en: 'In witness whereof this power of attorney is signed by the company’s representatives and stamped.',
        keepWithNext: true,
      },
      ...companySignatures(ctx, reps, `${ctx.place}, ${dateLong(v.data)}`),
    ];
    if (v.reconhecimento !== 'nenhum') {
      comReconhecimento(blocks, v.reconhecimento === 'presencial' ? 'Reconhecimento presencial das assinaturas' : 'Reconhecimento notarial das assinaturas');
    }
    return blocks;
  },
});
