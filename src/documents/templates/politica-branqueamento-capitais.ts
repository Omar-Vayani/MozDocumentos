// Política interna de prevenção e combate ao branqueamento de capitais e ao
// financiamento do terrorismo, para entidades obrigadas não financeiras
// (imobiliárias, comerciantes de bens de alto valor, contabilistas, advogados,
// prestadores de serviços a sociedades) e pequenas instituições financeiras.

import { defineTemplate, type Block, type ClauseItem, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, l, localField, money, moneyText } from './_shared';
import { quantos } from './_contratos';
import { s, semPonto } from './_financas';

const SECTOR_OPTIONS: FieldOption[] = [
  { value: 'imobiliario', label: l('Mediação imobiliária / compra e venda de imóveis', 'Real estate') },
  { value: 'bens', label: l('Comércio de viaturas, metais e pedras preciosas ou outros bens de valor elevado', 'High-value goods dealer') },
  { value: 'contabilidade', label: l('Contabilidade, auditoria ou consultoria fiscal', 'Accounting, audit or tax advice') },
  { value: 'juridico', label: l('Serviços jurídicos ou notariais', 'Legal or notarial services') },
  { value: 'sociedades', label: l('Constituição e gestão de sociedades', 'Company formation and management') },
  { value: 'jogo', label: l('Jogos de fortuna ou azar', 'Gaming') },
  { value: 'financeira', label: l('Instituição financeira não bancária / microfinanças / câmbios', 'Non-bank financial institution / microfinance / FX') },
  { value: 'outro', label: l('Outro', 'Other') },
];

const SECTOR_TEXTO: Record<string, string> = {
  imobiliario: 'mediação imobiliária e compra e venda de imóveis',
  bens: 'comércio de bens de valor elevado',
  contabilidade: 'contabilidade, auditoria e consultoria fiscal',
  juridico: 'prestação de serviços jurídicos',
  sociedades: 'constituição e gestão de sociedades',
  jogo: 'exploração de jogos de fortuna ou azar',
  financeira: 'actividade financeira',
};

export default defineTemplate({
  id: 'politica-branqueamento-capitais',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'entidade', title: l('Entidade e actividade', 'Entity and business') },
    { id: 'responsavel', title: l('Responsável pela conformidade', 'Compliance officer') },
    { id: 'regras', title: l('Regras internas', 'Internal rules') },
    { id: 'aprovacao', title: l('Aprovação', 'Approval') },
  ],
  fields: [
    { name: 'sector', type: 'select', section: 'entidade', label: l('Actividade', 'Business'), options: SECTOR_OPTIONS, default: 'imobiliario' },
    { name: 'sectorOutro', type: 'text', section: 'entidade', label: l('Descreva a actividade', 'Describe the business'), showIf: (v) => v.sector === 'outro' },
    { name: 'supervisor', type: 'text', section: 'entidade', label: l('Entidade de supervisão do sector', 'Sector supervisor'), placeholder: l('Ex.: Banco de Moçambique; Instituto Nacional de Jogos; Ordem profissional', 'E.g. the sector supervisor'), help: l('A autoridade que fiscaliza o cumprimento destas regras no seu sector. Confirme-a.', 'The authority that supervises AML compliance in your sector.') },
    { name: 'responsavelNome', type: 'text', section: 'responsavel', width: 'half', required: true, label: l('Nome do responsável', 'Officer’s name') },
    { name: 'responsavelCargo', type: 'text', section: 'responsavel', width: 'half', label: l('Cargo', 'Position') },
    { name: 'responsavelContacto', type: 'text', section: 'responsavel', label: l('Contacto', 'Contact'), placeholder: l('Ex.: conformidade@empresa.co.mz · +258 84 …', 'E.g. email and phone') },
    { name: 'limiteNumerario', type: 'money', section: 'regras', width: 'half', label: l('Limite interno para pagamentos em numerário', 'Internal cash payment limit'), help: l('Valor acima do qual a empresa não aceita dinheiro vivo. É uma regra interna: confirme também os limites e as comunicações obrigatórias fixados na lei e pelo supervisor.', 'Above this the company refuses cash. Internal rule: also check legal thresholds and mandatory reports.') },
    { name: 'revisaoMeses', type: 'number', section: 'regras', width: 'half', min: 1, max: 60, default: 12, label: l('Revisão da política (meses)', 'Policy review (months)') },
    { name: 'formacao', type: 'toggle', section: 'regras', default: true, label: l('Formação anual obrigatória dos trabalhadores', 'Mandatory annual staff training') },
    { name: 'orgao', type: 'text', section: 'aprovacao', width: 'half', label: l('Aprovada por', 'Approved by'), default: 'Conselho de Gerência', placeholder: l('Ex.: Conselho de Administração', 'E.g. Board of Directors') },
    { name: 'dataAprovacao', type: 'date', section: 'aprovacao', width: 'half', label: l('Data da aprovação', 'Approval date') },
    localField('aprovacao'),
    dateField('data', 'aprovacao'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (ctx.profile?.kind !== 'empresa') w.push({ level: 'warning', message: l('A política é da empresa: use o perfil da empresa.', 'The policy belongs to the company: use its profile.') });
    if (!s(v.responsavelNome)) w.push({ level: 'warning', field: 'responsavelNome', message: l('Designe o responsável pela conformidade.', 'Appoint the compliance officer.') });
    w.push({
      level: 'warning',
      message: l(
        `Esta política resume os deveres gerais das entidades obrigadas (${cite('finBranqueamentoDeveres')}). Adapte-a ao risco do negócio e confirme no regulamento e nas directivas do seu supervisor os prazos de conservação de documentos, os limiares de operações e a forma de comunicação ao GIFiM.`,
        'This policy summarises the general duties of obliged entities. Adapt it to your risk and check the record-keeping periods, thresholds and reporting method in the regulation and your supervisor’s guidance.',
      ),
    });
    return w;
  },

  personName: () => undefined,
  documentDate: (v) => v.dataAprovacao || v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ent = employerName(ctx);
    const sector = v.sector === 'outro' ? semPonto(v.sectorOutro) || BLANK : SECTOR_TEXTO[v.sector] ?? BLANK;
    const lim = money(v.limiteNumerario);
    const resp = `${s(v.responsavelNome) || BLANK}${s(v.responsavelCargo) ? `, ${s(v.responsavelCargo)}` : ''}`;
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e âmbito',
        text: numerar([
          `A presente política estabelece as regras que ${ent} aplica para prevenir e detectar o uso da sua actividade de ${sector} para o branqueamento de capitais, o financiamento do terrorismo e da proliferação de armas de destruição em massa, em cumprimento da ${cite('finBranqueamentoDeveres')} e do respectivo regulamento.`,
          'Aplica-se a todos os sócios, gerentes, trabalhadores e colaboradores, em todas as relações de negócio e operações ocasionais.',
        ]),
        en: 'Purpose and scope: rules to prevent the business being used for money laundering and terrorist financing; applies to everyone in the company.',
      },
      {
        id: 'definicoes',
        heading: 'Definições',
        text: 'Para efeitos desta política:',
        items: [
          '«Beneficiário efectivo»: a pessoa singular que, em última instância, detém ou controla o cliente ou por conta de quem a operação é realizada;',
          '«Pessoa politicamente exposta»: quem exerce ou exerceu, em Moçambique ou no estrangeiro, cargo político ou público relevante, bem como os seus familiares próximos e pessoas estreitamente associadas;',
          '«Operação suspeita»: a operação que, pelo valor, natureza, complexidade ou falta de justificação económica, levante suspeita de estar relacionada com fundos de origem ilícita ou com o financiamento do terrorismo.',
        ],
        en: 'Definitions of beneficial owner, politically exposed person and suspicious transaction.',
      },
      {
        id: 'responsavel',
        heading: 'Responsável pela conformidade',
        text: numerar([
          `É designado responsável pela conformidade ${resp}${s(v.responsavelContacto) ? ` (contacto: ${semPonto(v.responsavelContacto)})` : ''}, com autonomia e acesso a toda a informação necessária.`,
          'Compete-lhe aplicar e actualizar esta política, analisar os alertas internos, decidir e efectuar as comunicações ao Gabinete de Informação Financeira de Moçambique (GIFiM), ser o interlocutor das autoridades e organizar a formação.',
        ]),
        en: 'The compliance officer named applies the policy, reviews alerts, reports to the FIU, liaises with authorities and organises training.',
      },
      {
        id: 'risco',
        heading: 'Avaliação de risco',
        text: 'A entidade avalia e documenta o risco dos seus clientes, produtos, canais e zonas geográficas, classificando cada cliente como de risco baixo, médio ou elevado, e revê essa classificação sempre que haja alterações relevantes.',
        en: 'Risk assessment of customers, products, channels and geographies, with a low / medium / high rating.',
      },
      {
        id: 'identificacao',
        heading: 'Identificação e verificação dos clientes',
        text: 'Antes de estabelecer uma relação de negócio ou de realizar uma operação ocasional, a entidade identifica o cliente e verifica a sua identidade com documentos válidos:',
        items: [
          'pessoas singulares: nome, data de nascimento, nacionalidade, documento de identificação, NUIT, morada, profissão e entidade empregadora;',
          'pessoas colectivas: denominação, sede, NUEL e NUIT, certidão do registo, estatutos, identificação dos representantes e dos beneficiários efectivos;',
          'representantes e procuradores: identificação e documento que comprove os poderes;',
          'em todos os casos: a finalidade e a natureza pretendida da relação de negócio.',
        ],
        en: 'Customer identification and verification for individuals, companies and representatives, and the purpose of the relationship.',
      },
      {
        id: 'diligencia',
        heading: 'Diligência reforçada e origem dos fundos',
        text: numerar([
          'É aplicada diligência reforçada a clientes de risco elevado, pessoas politicamente expostas, clientes ou fundos de países de risco e operações complexas, invulgares ou sem justificação económica aparente, incluindo a aprovação pela gerência e a verificação da origem dos fundos e do património.',
          'Sempre que o risco o justifique, é pedida ao cliente declaração escrita sobre a origem dos fundos, acompanhada de comprovativos.',
          'A relação de negócio é acompanhada de forma contínua, verificando se as operações são coerentes com o perfil do cliente.',
        ]),
        en: 'Enhanced due diligence for high-risk customers and PEPs, source-of-funds statements and ongoing monitoring.',
      },
      {
        id: 'numerario',
        heading: 'Pagamentos em numerário',
        text: lim != null
          ? `A entidade não aceita pagamentos em numerário de valor superior a **${moneyText(lim)}** por operação ou por operações relacionadas, devendo os pagamentos acima desse valor ser feitos por meios bancários rastreáveis.`
          : 'A entidade privilegia pagamentos por meios bancários rastreáveis e regista a identificação de quem entrega numerário, nos termos legais.',
        en: lim != null ? 'Cash above the internal limit is refused; larger payments must be traceable.' : 'Traceable payments are preferred; cash is recorded.',
      },
      {
        id: 'abstencao',
        heading: 'Dever de abstenção e comunicação',
        text: numerar([
          'Qualquer trabalhador que suspeite de uma operação informa de imediato o responsável pela conformidade, por escrito, sem alertar o cliente.',
          'A entidade abstém-se de executar operações que saiba ou suspeite estarem relacionadas com fundos ilícitos ou com o financiamento do terrorismo, e o responsável comunica-as ao GIFiM pelos meios por este definidos.',
          'É proibido revelar ao cliente ou a terceiros que foi feita ou está a ser analisada uma comunicação; as comunicações de boa-fé não geram responsabilidade para quem as faz.',
        ]),
        en: 'Staff report suspicions internally; the entity refrains from suspicious operations and reports them to the FIU; tipping off is prohibited.',
      },
      {
        id: 'sancoes',
        heading: 'Listas de sanções',
        text: 'Os clientes e beneficiários efectivos são verificados contra as listas de sanções das Nações Unidas e as listas nacionais, aplicando-se de imediato as medidas de congelamento determinadas pelas autoridades.',
        en: 'Customers are screened against UN and national sanctions lists; freezing orders are applied immediately.',
      },
      {
        id: 'conservacao',
        heading: 'Conservação de documentos',
        text: 'Os documentos de identificação, os registos das operações e as comunicações são conservados pelo prazo legal, de forma a poderem ser apresentados às autoridades quando solicitados.',
        en: 'Records are kept for the legal period and made available to the authorities.',
      },
      {
        id: 'formacao',
        heading: 'Formação e controlo',
        text: numerar([
          v.formacao ? 'Todos os trabalhadores recebem formação sobre esta política na admissão e, depois, pelo menos uma vez por ano.' : 'Todos os trabalhadores recebem formação sobre esta política na admissão e sempre que ela for alterada.',
          `A política é revista a cada ${quantos(Math.round(Number(v.revisaoMeses) || 12), 'mês', 'meses')} e sempre que a lei, as directivas${s(v.supervisor) ? ` ${contrairDe(s(v.supervisor))}` : ' do supervisor'} ou o risco do negócio o justifiquem.`,
          'A violação desta política constitui infracção disciplinar, sem prejuízo da responsabilidade legal.',
        ]),
        en: 'Training, periodic review and disciplinary consequences.',
      },
      {
        id: 'vigor',
        heading: 'Entrada em vigor',
        text: `A presente política foi aprovada ${s(v.orgao) ? pelo(semPonto(v.orgao)) : ''}${v.dataAprovacao ? ` em ${dateLong(v.dataAprovacao)}` : ''} e entra em vigor na data da sua aprovação.`,
        en: 'Approval and entry into force.',
      },
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Política de prevenção e combate ao branqueamento de capitais e ao financiamento do terrorismo', subtitle: ent },
      { type: 'numberedClauses', style: 'artigo', items },
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.dataAprovacao || v.data)}.`, align: 'center', keepWithNext: true, en: 'Place and date.' },
      { type: 'signatures', columns: [{ role: s(v.orgao) ? pelo(semPonto(v.orgao)).replace(/^p/, 'P') : 'A Gerência', name: ctx.profile?.representanteNome || undefined, detail: ctx.profile?.representanteCargo || undefined, image: 'both' }, { role: 'O Responsável pela Conformidade', name: s(v.responsavelNome) || undefined, detail: s(v.responsavelCargo) || undefined }] },
    ];
    return blocks;
  },
});

function numerar(parts: string[]): string {
  const p = parts.filter(Boolean);
  return p.length === 1 ? p[0] : p.map((t, i) => `${i + 1}. ${t}`).join('\n');
}

function contrairDe(x: string): string {
  return /^(banco|instituto|gabinete)/i.test(x) ? `do ${x}` : /^(ordem|autoridade|inspecção)/i.test(x) ? `da ${x}` : `de ${x}`;
}

function pelo(x: string): string {
  const n = x.replace(/^(o|a|pelo|pela)\s+/i, '');
  return /^(assembleia|gerência|direcção|administração|comissão)/i.test(n) ? `pela ${n}` : `pelo ${n}`;
}
