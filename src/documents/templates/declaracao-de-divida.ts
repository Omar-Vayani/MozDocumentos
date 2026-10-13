import { addMonths, formatDateShort, MAX_EXTENSO, numeroPorExtenso, roundMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type ClauseItem, type DefaultsContext, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerParty, employerSignature, FORMA_PAGAMENTO_OPTIONS, formatMoney, g, l, localField,
  money, moneyText, placeDate, splitLines, workerFields, workerParty, workerSignature,
} from './_shared';

// ---------------------------------------------------------------- local helpers

const extenso = (n: number | null) => (n != null && n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');

const PROFILE_GET: Record<string, (p: Profile) => unknown> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  Morada: (p) => addressLine(p),
  Telefone: (p) => p.telefones,
};
function fromPessoaProfile(defs: FieldDef[], prefix: string): FieldDef[] {
  return defs.map((f) => {
    const get = PROFILE_GET[f.name.slice(prefix.length)];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        if (c.profile?.kind === 'pessoa') {
          const val = get(c.profile);
          if (val) return val;
        }
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const credorEmpresa = (v: Values, profile: Profile | null) => Boolean(v.credorPerfil) && profile?.kind === 'empresa';
const isMensal = (v: Values) => v.plano === 'mensal';

const PERSON_KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'nuit', 'morada', 'telefone'] as const;

type Prestacao = { n: number; data: string; valor: number };

export default defineTemplate({
  id: 'declaracao-de-divida',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'devedor', title: l('Devedor (quem deve)', 'Debtor (who owes)'), personRole: 'outro' },
    { id: 'credor', title: l('Credor (a quem se deve)', 'Creditor (who is owed)'), personRole: 'outro' },
    { id: 'divida', title: l('Dívida', 'Debt') },
    { id: 'plano', title: l('Plano de pagamento', 'Payment plan') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField('data'),
    ...fromPessoaProfile(workerFields([...PERSON_KEYS], 'devedor', 'devedor'), 'devedor'),
    {
      name: 'credorPerfil',
      type: 'toggle',
      section: 'credor',
      label: l('O credor é a empresa deste perfil', 'The creditor is this profile’s company'),
      help: l('Só para perfis de empresa: usa os dados e o representante da empresa.', 'Company profiles only: uses the company’s details and representative.'),
      default: (c) => c.profile?.kind === 'empresa',
    },
    ...workerFields([...PERSON_KEYS], 'credor', 'credor').map((f) => ({ ...f, showIf: (v: Values) => !v.credorPerfil })),
    {
      name: 'valor',
      type: 'money',
      section: 'divida',
      width: 'half',
      required: true,
      label: l('Valor em dívida', 'Amount owed'),
    },
    { name: 'dataOrigem', type: 'date', section: 'divida', width: 'half', label: l('Data em que a dívida surgiu (opcional)', 'Date the debt arose (optional)') },
    {
      name: 'origem',
      type: 'textarea',
      section: 'divida',
      required: true,
      rows: 3,
      label: l('Origem da dívida', 'Origin of the debt'),
      help: l(
        'Continua a frase «…proveniente de…». Ex.: «empréstimo em dinheiro concedido pelo Credor» ou «fornecimento de mercadorias constantes das facturas n.º 12 e 15».',
        'Continues “…arising from…”. E.g. “a cash loan from the Creditor” or “goods supplied under invoices 12 and 15”.',
      ),
    },
    {
      name: 'plano',
      type: 'select',
      section: 'plano',
      width: 'half',
      label: l('Forma de pagamento da dívida', 'How the debt is paid'),
      options: [
        { value: 'unica', label: l('Prestação única', 'Single payment') },
        { value: 'mensal', label: l('Prestações mensais', 'Monthly instalments') },
      ],
      default: 'mensal',
    },
    {
      name: 'numeroPrestacoes',
      type: 'number',
      section: 'plano',
      width: 'half',
      min: 2,
      max: 120,
      default: 2,
      label: l('Número de prestações', 'Number of instalments'),
      showIf: isMensal,
    },
    {
      name: 'dataPrimeira',
      type: 'date',
      section: 'plano',
      width: 'half',
      required: true,
      label: l('Data de vencimento (1.ª prestação)', 'Due date (1st instalment)'),
      help: l('As prestações seguintes vencem no mesmo dia dos meses seguintes.', 'Later instalments fall due on the same day of the following months.'),
      default: (c) => addMonths(c.today, 1),
    },
    { name: 'formaPagamento', type: 'select', section: 'plano', width: 'half', label: l('Meio de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: 'contaPagamento',
      type: 'text',
      section: 'plano',
      label: l('Conta ou número para pagamento (opcional)', 'Account or number for payment (optional)'),
      placeholder: l('Ex.: NIB 0001 0000 0012 3456 7890 1 (BCI) ou M-Pesa 84 123 4567', 'E.g. bank NIB or M-Pesa number'),
    },
    {
      name: 'vencimentoAntecipado',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Falta de uma prestação torna exigível toda a dívida', 'A missed instalment makes the whole debt due'),
      help: l('Se uma prestação não for paga, o credor pode exigir de imediato o valor total em falta.', 'If an instalment is missed, the creditor may demand the full outstanding amount at once.'),
      showIf: isMensal,
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'opcoes',
      label: l('Incluir duas testemunhas', 'Include two witnesses'),
    },
    { name: 'testemunha1Nome', type: 'text', section: 'opcoes', width: 'half', label: l('1.ª testemunha — nome', '1st witness — name'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha1Doc', type: 'text', section: 'opcoes', width: 'half', label: l('1.ª testemunha — BI n.º', '1st witness — ID no.'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha2Nome', type: 'text', section: 'opcoes', width: 'half', label: l('2.ª testemunha — nome', '2nd witness — name'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha2Doc', type: 'text', section: 'opcoes', width: 'half', label: l('2.ª testemunha — BI n.º', '2nd witness — ID no.'), showIf: (v) => Boolean(v.testemunhas) },
  ],

  computed: (v) => {
    const total = money(v.valor);
    const n = isMensal(v) ? Math.min(120, Math.max(1, Math.round(Number(v.numeroPrestacoes) || 0))) : 1;
    const prestacoes: Prestacao[] = [];
    if (total != null && total > 0) {
      const cents = Math.round(total * 100);
      const base = Math.floor(cents / n);
      for (let i = 0; i < n; i++) {
        const valor = (i === n - 1 ? cents - base * (n - 1) : base) / 100;
        prestacoes.push({ n: i + 1, data: v.dataPrimeira ? addMonths(v.dataPrimeira, i) : '', valor: roundMoney(valor) });
      }
    }
    const ultima = prestacoes.length ? prestacoes[prestacoes.length - 1] : null;
    return { total, n, prestacoes, ultimaData: ultima?.data || '', desigual: prestacoes.length > 1 && prestacoes[0].valor !== ultima!.valor };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.computed;
    if (c.total == null || c.total <= 0) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor em dívida.', 'Enter the amount owed.') });
    if (!v.devedorDocNumero) w.push({ level: 'warning', field: 'devedorDocNumero', message: l('Falta o número do documento de identificação do devedor.', 'The debtor’s ID number is missing.') });
    if (v.credorPerfil && ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'warning', field: 'credorPerfil', message: l('O perfil activo não é de uma empresa. Preencha os dados do credor.', 'The active profile is not a company. Fill in the creditor’s details.') });
    } else if (!credorEmpresa(v, ctx.profile) && !v.credorDocNumero) {
      w.push({ level: 'warning', field: 'credorDocNumero', message: l('Falta o número do documento de identificação do credor.', 'The creditor’s ID number is missing.') });
    }
    if (!splitLines(v.origem).length) w.push({ level: 'warning', field: 'origem', message: l('Indique a origem da dívida.', 'State where the debt comes from.') });
    if (v.dataPrimeira && v.data && v.dataPrimeira < v.data) {
      w.push({ level: 'warning', field: 'dataPrimeira', message: l('A primeira prestação vence antes da data do documento.', 'The first instalment falls due before the document date.') });
    }
    if (v.dataOrigem && v.data && v.dataOrigem > v.data) {
      w.push({ level: 'warning', field: 'dataOrigem', message: l('A data de origem da dívida é posterior à data do documento.', 'The debt’s origin date is after the document date.') });
    }
    w.push({
      level: 'info',
      message: l(
        `A declaração vale como reconhecimento de dívida (${cite('codigoCivilReconhecimentoDivida')}). Para que possa ser cobrada judicialmente com mais facilidade, reconheça a assinatura do devedor no notário (de preferência, reconhecimento presencial).`,
        'To make the declaration easier to enforce in court, have the debtor’s signature certified by a notary (preferably in person).',
      ),
    });
    if (c.desigual) {
      w.push({
        level: 'info',
        field: 'numeroPrestacoes',
        message: l('O valor não se divide em partes iguais: a última prestação foi ajustada.', 'The amount does not divide evenly: the last instalment was adjusted.'),
      });
    }
    return w;
  },

  personName: (v) => v.devedorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const empresaCredora = credorEmpresa(v, ctx.profile);
    const dev = g(v.devedorGenero, 'Devedor', 'Devedora');
    const cred = empresaCredora ? 'Credora' : g(v.credorGenero, 'Credor', 'Credora');
    const fem = (d: string) => d.endsWith('a');
    const o = (d: string) => `${fem(d) ? 'a' : 'o'} ${d}`;
    const O = (d: string) => `${fem(d) ? 'A' : 'O'} ${d}`;
    const ao = (d: string) => `${fem(d) ? 'à' : 'ao'} ${d}`;
    const total = c.total as number | null;
    const ext = extenso(total);
    const prestacoes = c.prestacoes as Prestacao[];
    const mensal = isMensal(v) && c.n > 1;

    const devedorText = workerParty(v, dev, 'devedor');
    const credorText = empresaCredora ? employerParty(ctx, cred) : workerParty(v, cred, 'credor');
    const origem = splitLines(v.origem).join('; ').replace(/\.$/, '');
    const valorTexto = `**${moneyText(v.valor)}**${ext ? ` (${ext})` : ''}`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de dívida e acordo de pagamento' },
      {
        type: 'paragraph',
        id: 'reconhecimento',
        text: `${devedorText}, declara, para todos os efeitos legais, que deve a ${credorText}, a quantia de ${valorTexto}, proveniente de ${origem || BLANK}${v.dataOrigem ? `, com data de ${dateLong(v.dataOrigem)}` : ''}, e reconhece que esta dívida é certa, líquida e exigível.`,
        en: `The Debtor, identified above, declares that it owes the Creditor, identified above, the sum of ${moneyText(v.valor)}, arising from the stated origin, and acknowledges that the debt is certain, liquid and due.`,
      },
    ];
    if (total != null && total > 0) blocks.push({ type: 'amount', label: 'Valor em dívida', value: total });
    blocks.push({
      type: 'paragraph',
      id: 'acordo',
      text: `${O(dev)} e ${o(cred)} acordam no pagamento da dívida nos termos seguintes:`,
      en: 'The Debtor and the Creditor agree on payment of the debt as follows:',
    });

    const pagamento = `${v.formaPagamento || 'transferência bancária'}${v.contaPagamento ? ` (${v.contaPagamento})` : ''}`;
    const clauses: ClauseItem[] = [
      {
        id: 'plano',
        heading: 'Prazo de pagamento',
        text: mensal
          ? `${O(dev)} pagará a dívida em ${c.n} prestações mensais e sucessivas, conforme o plano abaixo, vencendo-se a primeira em ${dateLong(v.dataPrimeira)} e as restantes no mesmo dia de cada um dos meses seguintes${c.ultimaData ? `, até ${dateLong(c.ultimaData)}` : ''}.`
          : `${O(dev)} pagará a totalidade da dívida, numa única prestação, até ${dateLong(v.dataPrimeira)}.`,
        en: mensal
          ? `The Debtor will pay the debt in ${c.n} consecutive monthly instalments, as set out in the plan below.`
          : 'The Debtor will pay the whole debt in a single payment by the due date.',
      },
      {
        id: 'meio',
        heading: 'Meio de pagamento',
        text: `Os pagamentos são feitos por ${pagamento}. ${O(cred)} emitirá recibo de cada pagamento recebido; o comprovativo de transferência ou de envio vale como prova de pagamento.`,
        en: `Payments are made by ${v.formaPagamento || 'bank transfer'}. The Creditor will issue a receipt for each payment; the transfer slip is proof of payment.`,
      },
      {
        id: 'antecipacao',
        heading: 'Pagamento antecipado',
        text: `${O(dev)} pode, a todo o tempo, antecipar o pagamento, total ou parcial, da dívida, sem qualquer penalização.`,
        en: 'The Debtor may prepay all or part of the debt at any time without penalty.',
      },
    ];
    if (mensal && v.vencimentoAntecipado) {
      clauses.push({
        id: 'incumprimento',
        heading: 'Falta de pagamento',
        text: `A falta de pagamento de qualquer prestação na data do respectivo vencimento implica o vencimento imediato de todas as prestações em falta, nos termos do ${cite('codigoCivilPrestacoes')}, podendo ${o(cred)} exigir de imediato o pagamento da totalidade do valor em dívida.`,
        en: 'Failure to pay any instalment when due makes all remaining instalments immediately due, and the Creditor may demand the full outstanding amount at once.',
      });
    } else {
      clauses.push({
        id: 'incumprimento',
        heading: 'Falta de pagamento',
        text: `Na falta de pagamento ${mensal ? 'de qualquer prestação na data do respectivo vencimento' : 'na data acordada'}, ${o(cred)} pode exigir o cumprimento pelos meios legais.`,
        en: 'If payment is not made when due, the Creditor may enforce payment by legal means.',
      });
    }
    clauses.push({
      id: 'quitacao',
      heading: 'Quitação',
      text: `Com o pagamento integral do valor em dívida, ${o(cred)} dará ${ao(dev)} plena e integral quitação, nada mais tendo a exigir com fundamento na dívida aqui reconhecida.`,
      en: 'On full payment, the Creditor will give the Debtor a full discharge and will have no further claim based on this debt.',
    });
    blocks.push({ type: 'numberedClauses', style: 'numeric', items: clauses });

    if (mensal) {
      const rows = prestacoes.length
        ? prestacoes.map((p) => [`${p.n}.ª`, p.data ? formatDateShort(p.data) : '___/___/______', formatMoney(p.valor, false)])
        : Array.from({ length: c.n }, (_, i) => [`${i + 1}.ª`, v.dataPrimeira ? formatDateShort(addMonths(v.dataPrimeira, i)) : '___/___/______', '']);
      blocks.push({
        type: 'table',
        caption: 'Plano de pagamento',
        columns: [
          { label: 'Prestação', width: 1 },
          { label: 'Data de vencimento', width: 2, align: 'center' },
          { label: 'Valor (MT)', width: 2, align: 'right' },
        ],
        rows,
        totals: [['Total', '', total != null ? formatMoney(total, false) : '']],
      });
    }

    const credSig: SignatureColumn = empresaCredora ? employerSignature(ctx, O(cred)) : workerSignature(v, O(cred), 'credor');
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade e corresponder à vontade das partes, vai a presente declaração assinada por ambas, em dois exemplares de igual valor, ficando um em poder de cada uma.',
        en: 'In witness whereof, this declaration is signed by both parties in two copies of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [workerSignature(v, O(dev), 'devedor'), credSig] },
    );
    if (v.testemunhas) {
      const det = (d: unknown) => (d ? `BI n.º ${d}` : undefined);
      blocks.push(
        { type: 'paragraph', id: 'testemunhas', text: 'Testemunhas:', align: 'left', keepWithNext: true, en: 'Witnesses:' },
        {
          type: 'signatures',
          columns: [
            { role: '1.ª Testemunha', name: v.testemunha1Nome || undefined, detail: det(v.testemunha1Doc) },
            { role: '2.ª Testemunha', name: v.testemunha2Nome || undefined, detail: det(v.testemunha2Doc) },
          ],
        },
      );
    }
    return blocks;
  },
});
