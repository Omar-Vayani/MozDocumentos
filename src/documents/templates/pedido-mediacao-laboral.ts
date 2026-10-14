// Pedido de mediação laboral: a letter from the employee (or the employer) to
// the Director of the provincial Labour Mediation and Arbitration Centre,
// stating the disputed matter, the facts, the amount and the parties' contacts.

import { diffDays } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerRep, formatMoney, l, lineItems, localField, money, placeDate, splitLines, workerFields } from './_shared';
import { doCite, moneyExt } from './_contrato-trabalho';
import { endDot, gx, identificacao, lowerFirst, pessoaFields, str } from './_pessoal-rh';

const CENTROS = [
  'Cidade de Maputo', 'Província de Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado',
];

const MATERIAS = [
  { value: 'salarios', label: l('Salários em atraso', 'Unpaid wages') },
  { value: 'indemnizacao', label: l('Indemnização por cessação do contrato', 'Termination compensation') },
  { value: 'ferias', label: l('Férias não gozadas ou não pagas', 'Untaken or unpaid leave') },
  { value: 'horas', label: l('Horas extraordinárias', 'Overtime') },
  { value: 'despedimento', label: l('Despedimento sem justa causa', 'Unfair dismissal') },
  { value: 'subsidios', label: l('Subsídios e outras prestações', 'Allowances and other payments') },
  { value: 'outro', label: l('Outra', 'Other') },
];
const MATERIA_TXT: Record<string, string> = {
  salarios: 'Salários em atraso',
  indemnizacao: 'Indemnização por cessação do contrato',
  ferias: 'Férias não gozadas ou não pagas',
  horas: 'Horas extraordinárias',
  despedimento: 'Despedimento sem justa causa',
  subsidios: 'Subsídios e outras prestações',
  outro: 'Outra matéria',
};

const isEmpregador = (v: Values) => v.requerenteTipo === 'empregador';

type Item = { tipo: string; descricao: string; valor: number | null };
function itens(v: Values): Item[] {
  return lineItems(v.materia)
    .map((r) => ({ tipo: str(r.tipo), descricao: str(r.descricao), valor: money(r.valor) }))
    .filter((r) => r.tipo || r.descricao || r.valor != null);
}

export default defineTemplate({
  id: 'pedido-mediacao-laboral',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'centro', title: l('Centro de mediação', 'Mediation centre') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'contraparte', title: l('Outra parte', 'Other party') },
    { id: 'relacao', title: l('Relação de trabalho', 'Employment details') },
    { id: 'conflito', title: l('Conflito', 'Dispute') },
    { id: 'documento', title: l('Documentos, local e data', 'Documents, place and date') },
  ],
  fields: [
    {
      name: 'centro',
      type: 'select',
      section: 'centro',
      label: l('Centro de Mediação e Arbitragem Laboral', 'Labour Mediation and Arbitration Centre'),
      default: 'Cidade de Maputo',
      options: CENTROS.map((c) => ({ value: c, label: l(c, c) })),
      help: l('O centro da província onde o trabalhador presta ou prestou trabalho.', 'The centre in the province where the work is or was done.'),
    },
    {
      name: 'requerenteTipo',
      type: 'radio',
      section: 'requerente',
      label: l('Quem pede', 'Who is applying'),
      default: (c) => (c.profile?.kind === 'empresa' ? 'empregador' : 'trabalhador'),
      options: [
        { value: 'trabalhador', label: l('O trabalhador', 'The employee') },
        { value: 'empregador', label: l('A empresa do perfil (empregador)', 'The profile’s company (employer)') },
      ],
    },
    ...pessoaFields('requerente', 'requerente', { profile: true, keys: ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada'] }).map((f) => ({
      ...f,
      showIf: (v: Values) => !isEmpregador(v),
    })),
    ...workerFields(['telefone'], 'requerente', 'requerente').map((f) => ({ ...f, required: true, default: (c: DefaultsContext) => c.profile?.telefones || '' })),
    { name: 'requerenteEmail', type: 'email', section: 'requerente', width: 'half', label: l('Email (opcional)', 'Email (optional)'), default: (c) => c.profile?.email || '' },
    {
      name: 'representanteTipo',
      type: 'select',
      section: 'requerente',
      width: 'half',
      label: l('Representado por (opcional)', 'Represented by (optional)'),
      default: 'nenhum',
      options: [
        { value: 'nenhum', label: l('Ninguém (comparece pessoalmente)', 'Nobody (attends in person)') },
        { value: 'sindicato', label: l('Sindicato', 'Trade union') },
        { value: 'associacao', label: l('Associação de empregadores', 'Employers’ association') },
        { value: 'advogado', label: l('Advogado', 'Lawyer') },
      ],
    },
    { name: 'representanteNome', type: 'text', section: 'requerente', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => Boolean(v.representanteTipo) && v.representanteTipo !== 'nenhum' },
    { name: 'contraparteNome', type: 'text', section: 'contraparte', required: true, label: l('Nome / denominação', 'Name / company name'), placeholder: l('Ex.: Machava & Filhos — Construção, Lda', 'E.g. employer’s company name') },
    { name: 'contraparteNuit', type: 'text', section: 'contraparte', width: 'half', label: l('NUIT (se souber)', 'NUIT (if known)') },
    { name: 'contraparteContacto', type: 'text', section: 'contraparte', width: 'half', label: l('Telefone / email', 'Phone / email') },
    { name: 'contraparteMorada', type: 'text', section: 'contraparte', required: true, label: l('Morada / sede', 'Address / office') },
    { name: 'trabalhadorNome', type: 'text', section: 'relacao', label: l('Nome do trabalhador', 'Employee’s name'), showIf: (v) => isEmpregador(v) },
    { name: 'dataAdmissao', type: 'date', section: 'relacao', width: 'half', label: l('Data de admissão', 'Start date') },
    { name: 'categoria', type: 'text', section: 'relacao', width: 'half', label: l('Categoria / função', 'Grade / job') },
    { name: 'salario', type: 'money', section: 'relacao', width: 'half', label: l('Salário mensal', 'Monthly salary') },
    {
      name: 'situacao',
      type: 'radio',
      section: 'relacao',
      label: l('O contrato', 'The contract'),
      default: 'cessou',
      options: [
        { value: 'vigor', label: l('Ainda está em vigor', 'Is still in force') },
        { value: 'cessou', label: l('Já terminou', 'Has ended') },
      ],
    },
    { name: 'dataCessacao', type: 'date', section: 'relacao', width: 'half', label: l('Data em que terminou', 'End date'), showIf: (v) => v.situacao === 'cessou' },
    {
      name: 'factos',
      type: 'textarea',
      section: 'conflito',
      rows: 6,
      required: true,
      label: l('Factos', 'Facts'),
      help: l('Um facto por linha, por ordem de datas. Seja concreto: datas, valores, quem disse o quê.', 'One fact per line, in date order. Be specific: dates, amounts, who said what.'),
      placeholder: l('Ex.: Desde Junho de 2026, a empresa deixou de pagar o salário mensal.', 'E.g. Since June 2026 the company stopped paying my salary.'),
    },
    {
      name: 'materia',
      type: 'lines',
      section: 'conflito',
      required: true,
      label: l('Matéria em conflito e valores', 'Disputed matters and amounts'),
      addLabel: l('Adicionar matéria', 'Add item'),
      columns: [
        { name: 'tipo', type: 'select', label: l('Matéria', 'Matter'), options: MATERIAS },
        { name: 'descricao', type: 'text', label: l('Pormenor', 'Detail'), placeholder: l('Ex.: salários de Junho a Setembro de 2026', 'E.g. June–September 2026 wages') },
        { name: 'valor', type: 'money', label: l('Valor reclamado', 'Amount claimed') },
      ],
      default: [{ tipo: 'salarios', descricao: '', valor: '' }],
    },
    {
      name: 'pretensao',
      type: 'textarea',
      section: 'conflito',
      rows: 2,
      label: l('O que pretende (opcional)', 'What you want (optional)'),
      placeholder: l('Ex.: o pagamento dos valores em dívida e a entrega do certificado de trabalho', 'E.g. payment of the amounts due and the certificate of employment'),
    },
    {
      name: 'documentos',
      type: 'lines',
      section: 'documento',
      label: l('Documentos que junta', 'Enclosed documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [{ descricao: 'Cópia do Bilhete de Identidade' }, { descricao: 'Cópia do contrato de trabalho' }, { descricao: 'Cópias dos recibos de salário' }],
    },
    localField('documento'),
    dateField('data'),
  ],

  computed: (v) => {
    const lista = itens(v);
    const total = lista.reduce((s, r) => s + (r.valor ?? 0), 0);
    return { lista, total: lista.some((r) => r.valor != null) ? total : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A mediação é facultativa: pode também recorrer directamente ao tribunal do trabalho. O mediador é nomeado em poucos dias e a mediação tem prazo curto (${cite('mediacaoLaboralProcesso')}). Se quem pediu faltar sem justificação, o processo é arquivado. Podem ser devidas custas conforme o valor (${cite('mediacaoPedidoComal')}).`,
          'Mediation is optional; you may go straight to the labour court. A mediator is appointed within days and mediation is short. If the applicant fails to attend without reason, the case is closed. Fees may apply depending on the amount.',
        ),
      },
    ];
    const pres = ctx.legal.value<{ meses: number }>('prescricaoCreditosLaborais').meses;
    if (v.situacao === 'cessou' && v.dataCessacao) {
      const dias = diffDays(v.dataCessacao, v.data || ctx.today);
      if (Number.isFinite(dias) && dias > (pres - 1) * 30) {
        w.push({
          level: 'warning',
          field: 'dataCessacao',
          message: l(
            `Os créditos laborais prescrevem ${pres} meses após a cessação do contrato (${cite('prescricaoCreditosLaborais')}), e a impugnação do despedimento tem o mesmo prazo (${cite('impugnacaoRescisao')}). Apresente o pedido com urgência; a mediação suspende a prescrição.`,
            `Employment claims lapse ${pres} months after termination, as does a dismissal challenge. File urgently; mediation suspends the limitation period.`,
          ),
        });
      }
    }
    if (!splitLines(v.factos).length) w.push({ level: 'error', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
    if (!itens(v).length) w.push({ level: 'warning', field: 'materia', message: l('Indique a matéria em conflito: o pedido deve indicá-la.', 'State the disputed matter: the request must include it.') });
    if (!str(v.contraparteMorada)) w.push({ level: 'warning', field: 'contraparteMorada', message: l('Indique a morada da outra parte, para ser notificada.', 'Enter the other party’s address so it can be notified.') });
    if (isEmpregador(v) && ctx.profile?.kind !== 'empresa') w.push({ level: 'warning', field: 'requerenteTipo', message: l('O perfil activo não é de uma empresa.', 'The active profile is not a company.') });
    return w;
  },

  personName: (v) => (isEmpregador(v) ? v.trabalhadorNome : v.requerenteNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const emp = isEmpregador(v) && ctx.profile?.kind === 'empresa';
    const p = ctx.profile;
    const contacto = [str(v.requerenteTelefone), str(v.requerenteEmail)].filter(Boolean).join(' / ');
    const quem = emp
      ? [
          `**${(profileDisplayName(p) || BLANK).toUpperCase()}**`,
          p && addressLine(p) ? `com sede em ${addressLine(p)}` : '',
          p?.nuit ? `NUIT ${p.nuit}` : '',
          employerRep(ctx).nome ? `representada por ${employerRep(ctx).nome}${employerRep(ctx).cargo ? `, ${employerRep(ctx).cargo}` : ''}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : identificacao(v, 'requerente', { nuit: false });
    const qualidade = emp ? 'na qualidade de empregador' : `na qualidade de ${v.situacao === 'cessou' ? gx(v.requerenteGenero, 'ex-trabalhador', 'ex-trabalhadora') : gx(v.requerenteGenero, 'trabalhador', 'trabalhadora')}`;
    const contraparte = [
      `**${str(v.contraparteNome) || BLANK}**`,
      str(v.contraparteNuit) ? `NUIT ${str(v.contraparteNuit)}` : '',
      `com ${emp ? 'residência' : 'sede'} em ${str(v.contraparteMorada) || BLANK}`,
      str(v.contraparteContacto) ? `contacto ${str(v.contraparteContacto)}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const relacao = [
      emp && str(v.trabalhadorNome) ? `${str(v.trabalhadorNome)} foi admitido ao serviço da Requerente` : emp ? `O trabalhador foi admitido ao serviço da Requerente` : `${gx(v.requerenteGenero, 'O Requerente foi admitido', 'A Requerente foi admitida')} ao serviço da Requerida`,
      v.dataAdmissao ? `em ${dateLong(v.dataAdmissao)}` : '',
      str(v.categoria) ? `com a categoria de ${str(v.categoria)}` : '',
      money(v.salario) != null ? `auferindo o salário mensal de ${formatMoney(money(v.salario))}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const relacaoFim = v.situacao === 'cessou' ? `${relacao}. O contrato cessou em ${v.dataCessacao ? dateLong(v.dataCessacao) : BLANK}.` : `${relacao}. O contrato mantém-se em vigor.`;
    const factos = [relacaoFim, ...splitLines(v.factos).map(endDot)];
    const docs = lineItems(v.documentos).map((r) => str(r.descricao)).filter(Boolean);
    const rep = v.representanteTipo && v.representanteTipo !== 'nenhum' && str(v.representanteNome)
      ? `${emp ? 'A Requerente' : gx(v.requerenteGenero, 'O Requerente', 'A Requerente')} faz-se representar por ${str(v.representanteNome)}${v.representanteTipo === 'sindicato' ? ', do sindicato' : v.representanteTipo === 'associacao' ? ', da associação de empregadores' : ', advogado'}.`
      : '';

    const blocks: Block[] = [
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: ['Director do Centro de Mediação e Arbitragem Laboral', `${/^(Cidade|Província|Zambézia)/.test(str(v.centro)) ? 'da' : /^Niassa/.test(str(v.centro)) ? 'do' : 'de'} ${str(v.centro) || BLANK}`] },
      { type: 'subject', text: 'Pedido de mediação laboral' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${quem}${contacto ? `, contacto ${contacto}` : ''}, ${qualidade}, vem, nos termos ${doCite('mediacaoLaboralProcesso')}, requerer a intervenção desse Centro para **mediação** do conflito laboral que ${emp ? 'a' : gx(v.requerenteGenero, 'o', 'a')} opõe a ${contraparte}, adiante ${emp ? 'designado' : 'designada'} por **Requerid${emp ? 'o' : 'a'}**, com os fundamentos seguintes:`,
        en: 'The applicant, identified above, asks the Centre to mediate the labour dispute with the other party, on the following grounds:',
      },
      { type: 'heading', text: 'I — Factos' },
      { type: 'list', style: 'numeric', items: factos },
      { type: 'heading', text: 'II — Matéria controvertida e valor' },
    ];
    const rows = (c.lista as Item[]).map((r) => [MATERIA_TXT[r.tipo] ?? 'Outra matéria', r.descricao || '—', r.valor != null ? formatMoney(r.valor) : '—']);
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Matéria', width: 0.36 },
        { label: 'Pormenor', width: 0.42 },
        { label: 'Valor', width: 0.22, align: 'right' },
      ],
      rows: rows.length ? rows : [[BLANK, '', '']],
      totals: c.total != null ? [['Total', '', formatMoney(c.total)]] : undefined,
    });
    blocks.push({
      type: 'paragraph',
      id: 'pretensao',
      text: `Pretende ${emp ? 'a Requerente' : gx(v.requerenteGenero, 'o Requerente', 'a Requerente')} ${str(v.pretensao) ? endDot(lowerFirst(str(v.pretensao))) : 'a resolução do conflito por acordo, com o pagamento dos valores acima indicados.'}${c.total != null ? ` Valor do pedido: **${moneyExt(c.total)}**.` : ''}`,
      en: `The applicant seeks the stated outcome${c.total != null ? `; amount claimed ${formatMoney(c.total)}` : ''}.`,
      keepWithNext: true,
    });
    if (rep) blocks.push({ type: 'paragraph', id: 'representacao', text: rep, en: 'The applicant is represented as stated.', keepWithNext: true });
    if (docs.length) blocks.push({ type: 'note', text: `**Junta:** ${docs.map((d) => lowerFirst(d).replace(/[.;]$/, '')).join('; ')}.`, en: 'Enclosures as listed.', keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          emp
            ? { role: 'A Requerente', name: employerRep(ctx).nome || undefined, detail: employerRep(ctx).cargo || undefined, image: 'both' }
            : { role: gx(v.requerenteGenero, 'O Requerente', 'A Requerente'), name: str(v.requerenteNome) || undefined },
        ],
      },
    );
    return blocks;
  },
});
