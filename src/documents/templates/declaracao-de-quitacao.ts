import { diffDays, roundMoney } from '@/lib/format';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type FieldDef, type Values, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money,
  placeDate, workerFields, workerSignature,
} from './_shared';

const fromPessoa = (f: FieldDef, get: (p: Profile) => unknown): FieldDef => ({
  ...f,
  default: (c) => (c.profile?.kind === 'pessoa' ? get(c.profile) ?? '' : f.default ?? ''),
});

/** Identification of the worker without a contract designation. */
function identificacao(v: Values): string {
  const s = (k: string) => String(v[`trabalhador${k}`] ?? '').trim();
  const f = isF(s('Genero'));
  const parts = [
    `**${s('Nome') || BLANK}**`,
    s('EstadoCivil') ? (f ? s('EstadoCivil').replace(/^(solteir|casad|divorciad|viúv)o$/, '$1a') : s('EstadoCivil')) : '',
    s('Nacionalidade') ? `de nacionalidade ${s('Nacionalidade')}` : '',
    s('DocNumero')
      ? `${f ? 'portadora' : 'portador'} do ${s('DocTipo') || 'BI'} n.º ${s('DocNumero')}${s('DocEmissao') ? `, emitido em ${dateLong(s('DocEmissao'))}` : ''}${s('DocLocal') ? `, em ${s('DocLocal')}` : ''}`
      : '',
    s('Nuit') ? `NUIT ${s('Nuit')}` : '',
    s('Morada') ? `residente em ${s('Morada')}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

const MOTIVOS = [
  { value: '', label: l('Não indicar', 'Do not state') },
  { value: 'denúncia com aviso prévio, por iniciativa do trabalhador', label: l('Saída do trabalhador com aviso prévio (denúncia)', 'Resignation with notice') },
  { value: 'rescisão com justa causa, por iniciativa do trabalhador', label: l('Rescisão com justa causa pelo trabalhador', 'Resignation with just cause') },
  { value: 'acordo revogatório', label: l('Acordo entre as partes (acordo revogatório)', 'Mutual agreement') },
  { value: 'caducidade', label: l('Caducidade (fim do prazo)', 'Expiry of term') },
  { value: 'despedimento', label: l('Despedimento disciplinar', 'Disciplinary dismissal') },
  { value: 'rescisão por iniciativa do empregador, com aviso prévio', label: l('Rescisão pelo empregador por motivos económicos', 'Termination by the employer for economic reasons') },
];

const [fNome, fGenero, fEstadoCivil, fNacionalidade, fDocTipo, fDocNumero, fDocEmissao, fDocLocal, fNuit, fMorada, fCargo, fDataAdmissao] =
  workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'cargo', 'dataAdmissao']);

export default defineTemplate({
  id: 'declaracao-de-quitacao',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'trabalhador', title: l('Trabalhador (quem declara)', 'Employee (declarant)'), personRole: 'trabalhador' },
    { id: 'contrato', title: l('Empresa e contrato', 'Employer and contract') },
    { id: 'valores', title: l('Valores recebidos', 'Amounts received') },
    { id: 'documento', title: l('Data e assinaturas', 'Date and signatures') },
  ],
  fields: [
    fromPessoa(fNome, (p) => p.nome),
    fGenero,
    fromPessoa(fEstadoCivil, (p) => p.estadoCivil),
    fromPessoa(fNacionalidade, (p) => p.nacionalidade || 'moçambicana'),
    fromPessoa(fDocTipo, (p) => p.docTipo || 'BI'),
    fromPessoa(fDocNumero, (p) => p.docNumero),
    fromPessoa(fDocEmissao, (p) => p.docEmissao),
    fromPessoa(fDocLocal, (p) => p.docLocal),
    fromPessoa(fNuit, (p) => p.nuit),
    fromPessoa(fMorada, (p) => addressLine(p)),
    fCargo,
    {
      name: 'empresaNome',
      type: 'text',
      section: 'contrato',
      required: true,
      label: l('Nome da empresa (entidade empregadora)', 'Employer name'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
    { ...fDataAdmissao, section: 'contrato' },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'contrato',
      width: 'half',
      required: true,
      label: l('Data de cessação do contrato', 'End date'),
    },
    {
      name: 'motivoCessacao',
      type: 'select',
      section: 'contrato',
      width: 'half',
      label: l('Forma de cessação (opcional)', 'How the contract ended (optional)'),
      options: MOTIVOS,
      default: '',
    },
    {
      name: 'valores',
      type: 'lines',
      section: 'valores',
      required: true,
      label: l('Valores recebidos', 'Amounts received'),
      addLabel: l('Adicionar valor', 'Add amount'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [
        { descricao: 'Remuneração até à data da cessação', valor: '' },
        { descricao: 'Férias vencidas e não gozadas', valor: '' },
        { descricao: 'Férias proporcionais', valor: '' },
      ],
    },
    {
      name: 'formaPagamento',
      type: 'select',
      section: 'valores',
      width: 'half',
      label: l('Forma de pagamento', 'Payment method'),
      options: FORMA_PAGAMENTO_OPTIONS,
      default: 'transferência bancária',
    },
    {
      name: 'dataPagamento',
      type: 'date',
      section: 'valores',
      width: 'half',
      label: l('Data de pagamento', 'Payment date'),
      default: (c) => c.today,
    },
    localField(),
    dateField('data', 'documento', l('Data da declaração', 'Date of the declaration')),
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'documento',
      label: l('Incluir assinatura de duas testemunhas', 'Include two witness signatures'),
    },
    { name: 'testemunha1', type: 'text', section: 'documento', width: 'half', label: l('Testemunha 1 (nome)', 'Witness 1 (name)'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha2', type: 'text', section: 'documento', width: 'half', label: l('Testemunha 2 (nome)', 'Witness 2 (name)'), showIf: (v) => Boolean(v.testemunhas) },
  ],

  computed: (v) => {
    const linhas = lineItems(v.valores).filter((r) => String(r.descricao ?? '').trim() || money(r.valor) != null);
    const total = roundMoney(linhas.reduce((t, r) => t + (money(r.valor) ?? 0), 0));
    const preenchido = linhas.some((r) => money(r.valor) != null);
    return { linhas, total, preenchido };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    const prescricao = legal.value<{ meses: number }>('prescricaoCreditosLaborais').meses;
    w.push({
      level: 'info',
      message: l(
        `Assine só depois de receber os valores. Os créditos resultantes do contrato e da sua cessação prescrevem ${prescricao} meses após a cessação (${cite('prescricaoCreditosLaborais')}).`,
        `Sign only after receiving the amounts. Claims arising from the contract and its termination lapse ${prescricao} months after it ends.`,
      ),
    });
    if (!c.total) {
      w.push({ level: 'warning', field: 'valores', message: l('Indique os valores recebidos.', 'Enter the amounts received.') });
    }
    if (c.linhas.some((r: Record<string, any>) => money(r.valor) == null)) {
      w.push({ level: 'info', field: 'valores', message: l('Há linhas sem valor.', 'Some lines have no amount.') });
    }
    if (v.trabalhadorDataAdmissao && v.dataFimContrato && diffDays(v.trabalhadorDataAdmissao, v.dataFimContrato) < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('A data de cessação é anterior à admissão.', 'The end date is before the start date.') });
    }
    if (v.dataPagamento && v.data && diffDays(v.dataPagamento, v.data) < 0) {
      w.push({ level: 'warning', field: 'dataPagamento', message: l('A declaração é anterior ao pagamento.', 'The declaration is dated before the payment.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const empresa = v.empresaNome || BLANK;
    const f = isF(v.trabalhadorGenero);
    const periodo =
      v.trabalhadorDataAdmissao || v.dataFimContrato
        ? `, ao serviço da qual esteve de ${dateLong(v.trabalhadorDataAdmissao)} a ${dateLong(v.dataFimContrato)}`
        : '';
    const funcao = v.trabalhadorCargo ? `, com a função de ${v.trabalhadorCargo}` : '';
    const motivo = v.motivoCessacao ? `, por ${v.motivoCessacao}` : '';
    const rows: string[][] = c.linhas.length
      ? c.linhas.map((r: Record<string, any>) => [String(r.descricao ?? '').trim() || '—', money(r.valor) != null ? formatMoney(money(r.valor), false) : '__________'])
      : [[BLANK, '']];

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de quitação' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${identificacao(v)}, declara, para todos os efeitos legais, que recebeu da **${empresa}**${periodo}${funcao}, as importâncias abaixo discriminadas, devidas em consequência da cessação do contrato de trabalho${motivo}:`,
        en: `${v.trabalhadorNome || 'The employee'} declares for all legal purposes that they received from ${empresa} the amounts below, due on termination of the employment contract.`,
      },
      {
        type: 'table',
        columns: [
          { label: 'Descrição', width: 3.4 },
          { label: 'Valor (MT)', width: 1.4, align: 'right' },
        ],
        rows,
        totals: [['Total', c.preenchido ? formatMoney(c.total, false) : '__________']],
      },
      ...(c.preenchido ? [{ type: 'amount', label: 'Total recebido', value: c.total } as Block] : []),
      {
        type: 'paragraph',
        id: 'pagamento',
        text: `As importâncias foram pagas por ${v.formaPagamento || 'transferência bancária'} em ${dateLong(v.dataPagamento)}.`,
        en: `The amounts were paid by ${v.formaPagamento || 'bank transfer'} on ${v.dataPagamento || '___'}.`,
      },
      {
        type: 'paragraph',
        id: 'quitacao',
        text: `Com o recebimento destas importâncias, ${f ? 'a declarante' : 'o declarante'} dá plena e integral quitação a **${empresa}**, nada mais tendo a receber, seja a que título for, em consequência da celebração, execução ou cessação do contrato de trabalho.`,
        en: `Having received these amounts, the declarant states that nothing further is owed by ${empresa} on any ground arising from the employment contract or its termination, and gives it full and final release.`,
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, assina a presente declaração.',
        en: 'In witness whereof, the declarant signs this declaration.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          {
            ...workerSignature(v, f ? 'A Declarante' : 'O Declarante'),
            image: ctx.profile?.kind === 'pessoa' && ctx.profile.nome && ctx.profile.nome === v.trabalhadorNome ? 'signature' : undefined,
          },
        ],
      },
    ];
    if (v.testemunhas) {
      blocks.push(
        {
          type: 'signatures',
          columns: [
            { role: '1.ª Testemunha', name: v.testemunha1 || undefined },
            { role: '2.ª Testemunha', name: v.testemunha2 || undefined },
          ],
        },
      );
    }
    return blocks;
  },
});
