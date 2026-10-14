// Extracto de conta-corrente (statement of account) and aviso de vencimento
// (payment due notice). Lists invoices already issued and payments received;
// it is not a fiscal document.

import { diffDays, formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, localField, money, moneyText, refField } from './_shared';
import { int, issuerBlock, issuerSignature, rows, semPonto, str } from './_comercio';

const TIPOS: Record<string, string> = {
  factura: 'Factura',
  recibo: 'Recibo',
  notaCredito: 'Nota de crédito',
  notaDebito: 'Nota de débito',
  adiantamento: 'Adiantamento',
  outro: 'Outro',
};

type Mov = { data: string; doc: string; descricao: string; vencimento: string; debito: number; credito: number; saldo: number };

/** Ageing buckets (days overdue): a commercial convention, not a legal value. */
const B = [30, 60, 90] as const;

const fm = (n: number) => (n ? moneyText(n).replace(' MT', '') : '');

export default defineTemplate({
  id: 'extracto-conta-corrente',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Extracto', 'Statement') },
    { id: 'cliente', title: l('Cliente', 'Customer'), personRole: 'cliente' },
    { id: 'movimentos', title: l('Movimentos', 'Entries') },
    { id: 'pagamento', title: l('Pagamento e opções', 'Payment and options') },
  ],
  fields: [
    {
      name: 'modo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo de documento', 'Document type'),
      options: [
        { value: 'extracto', label: l('Extracto de conta-corrente', 'Statement of account') },
        { value: 'aviso', label: l('Aviso de vencimento', 'Payment due notice') },
      ],
      default: 'extracto',
    },
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data do extracto', 'Statement date'), default: (c) => c.today },
    { name: 'periodoInicio', type: 'date', section: 'documento', width: 'half', label: l('Período: de', 'Period: from'), showIf: (v) => v.modo !== 'aviso' },
    { name: 'periodoFim', type: 'date', section: 'documento', width: 'half', label: l('Período: até', 'Period: to'), showIf: (v) => v.modo !== 'aviso' },
    { name: 'dataVencimento', type: 'date', section: 'documento', width: 'half', label: l('Data de vencimento', 'Due date'), showIf: (v) => v.modo === 'aviso' },

    { name: 'clienteNome', type: 'text', section: 'cliente', required: true, label: l('Cliente', 'Customer'), personKey: 'nome' },
    { name: 'clienteNuit', type: 'text', section: 'cliente', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit' },
    { name: 'clienteCodigo', type: 'text', section: 'cliente', width: 'half', label: l('Código de cliente', 'Customer code') },
    { name: 'clienteMorada', type: 'text', section: 'cliente', label: l('Morada', 'Address'), personKey: 'morada' },
    { name: 'clienteAtencao', type: 'text', section: 'cliente', width: 'half', label: l('Ao cuidado de (opcional)', 'Attention of (optional)') },

    { name: 'saldoAnterior', type: 'money', section: 'movimentos', width: 'half', label: l('Saldo anterior (a favor da empresa)', 'Opening balance (owed to you)'), showIf: (v) => v.modo !== 'aviso' },
    {
      name: 'movimentos',
      type: 'lines',
      section: 'movimentos',
      required: true,
      label: l('Documentos e pagamentos', 'Documents and payments'),
      help: l('Facturas e notas de débito no débito; recibos, notas de crédito e adiantamentos no crédito.', 'Invoices and debit notes as debits; receipts, credit notes and advances as credits.'),
      addLabel: l('Adicionar movimento', 'Add entry'),
      columns: [
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        {
          name: 'tipo',
          type: 'select',
          label: l('Documento', 'Document'),
          options: Object.entries(TIPOS).map(([value, pt]) => ({ value, label: l(pt, pt) })),
        },
        { name: 'numero', type: 'text', label: l('N.º', 'No.') },
        { name: 'descricao', type: 'text', label: l('Descrição (opcional)', 'Description (optional)') },
        { name: 'vencimento', type: 'date', label: l('Vencimento', 'Due date') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'mostrarAntiguidade', type: 'toggle', section: 'movimentos', default: true, label: l('Mostrar antiguidade dos saldos (vencido há quantos dias)', 'Show ageing of balances'), showIf: (v) => v.modo !== 'aviso' },

    { name: 'prazoConferenciaDias', type: 'number', section: 'pagamento', width: 'half', min: 1, max: 60, default: 15, label: l('Prazo para o cliente indicar divergências (dias)', 'Days for the customer to report differences'), showIf: (v) => v.modo !== 'aviso' },
    { name: 'banco', type: 'text', section: 'pagamento', width: 'half', label: l('Banco', 'Bank'), default: (c) => c.profile?.banco || '' },
    { name: 'nib', type: 'text', section: 'pagamento', width: 'half', label: l('NIB', 'Account (NIB)'), default: (c) => c.profile?.nib || '' },
    { name: 'mobileMoney', type: 'text', section: 'pagamento', width: 'half', label: l('M-Pesa / e-Mola (opcional)', 'Mobile money (optional)') },
    { name: 'pedirConfirmacao', type: 'toggle', section: 'pagamento', label: l('Incluir destacável de confirmação do saldo', 'Include a balance confirmation slip') },
  ],

  computed: (v) => {
    const aviso = v.modo === 'aviso';
    const ref = (aviso ? v.dataVencimento : v.data) || v.data;
    let saldo = aviso ? 0 : money(v.saldoAnterior) ?? 0;
    const ageing = { naoVencido: 0, a30: 0, a60: 0, a90: 0, mais90: 0 };
    const movs: Mov[] = rows(v.movimentos)
      .filter((r) => str(r.numero) || str(r.descricao) || money(r.valor) != null)
      .map((r) => {
        const valor = Math.abs(money(r.valor) ?? 0);
        const credito = ['recibo', 'notaCredito', 'adiantamento'].includes(r.tipo);
        saldo = roundMoney(saldo + (credito ? -valor : valor));
        const tipo = TIPOS[r.tipo] ?? 'Factura';
        const doc = str(r.numero) || tipo;
        if (!credito && r.vencimento && v.data) {
          const atraso = diffDays(r.vencimento, v.data);
          const k = !Number.isFinite(atraso) || atraso <= 0 ? 'naoVencido' : atraso <= B[0] ? 'a30' : atraso <= B[1] ? 'a60' : atraso <= B[2] ? 'a90' : 'mais90';
          ageing[k as keyof typeof ageing] = roundMoney(ageing[k as keyof typeof ageing] + valor);
        }
        return { data: str(r.data), doc, descricao: str(r.descricao) || (str(r.numero) ? tipo : ''), vencimento: str(r.vencimento), debito: credito ? 0 : valor, credito: credito ? valor : 0, saldo };
      });
    const debitos = roundMoney(movs.reduce((t, m) => t + m.debito, 0));
    const creditos = roundMoney(movs.reduce((t, m) => t + m.credito, 0));
    return { movs, debitos, creditos, saldo, ageing, ref };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (!c.movs.length) w.push({ level: 'warning', field: 'movimentos', message: l('Acrescente os documentos e pagamentos.', 'Add the documents and payments.') });
    if (c.saldo < 0) {
      w.push({ level: 'warning', field: 'movimentos', message: l('O saldo é a favor do cliente. Confirme se deve emitir nota de crédito (no programa de facturação) ou devolver o valor.', 'The balance is in the customer’s favour. Check whether to issue a credit note (in your invoicing software) or refund it.') });
    }
    if (v.modo === 'aviso' && c.ageing && (c.ageing.a30 || c.ageing.a60 || c.ageing.a90 || c.ageing.mais90)) {
      w.push({ level: 'info', message: l('Há facturas já vencidas. Para cobrar um valor em atraso, use a "Carta de interpelação para pagamento".', 'Some invoices are already overdue. To chase them, use the payment demand letter.') });
    }
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const aviso = v.modo === 'aviso';
    const movs = c.movs as Mov[];
    const saldo = c.saldo as number;
    const titulo = aviso ? 'Aviso de vencimento' : 'Extracto de conta-corrente';
    const periodo = !aviso && (v.periodoInicio || v.periodoFim) ? `Período de ${formatDateShort(v.periodoInicio)} a ${formatDateShort(v.periodoFim)}` : '';

    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: 'Exmos. Senhores',
        lines: [str(v.clienteNome) || BLANK, str(v.clienteNuit) ? `NUIT ${str(v.clienteNuit)}` : '', semPonto(v.clienteMorada), str(v.clienteAtencao) ? `A/C ${str(v.clienteAtencao)}` : ''].filter(Boolean),
      },
      ...issuerBlock(ctx),
      { type: 'title', text: titulo, subtitle: [str(v.clienteCodigo) ? `Cliente n.º ${str(v.clienteCodigo)}` : '', periodo].filter(Boolean).join(' · ') || undefined },
    ];

    const valorSaldo = `**${moneyText(Math.abs(saldo))}**`;
    blocks.push(
      aviso
        ? {
            type: 'paragraph',
            id: 'av-intro',
            text: `Lembramos que os documentos abaixo indicados vencem em ${dateLong(v.dataVencimento)}, no valor total de ${valorSaldo}. Caso o pagamento já tenha sido efectuado, agradecemos que considere sem efeito este aviso e nos envie o comprovativo.`,
            en: 'This is a reminder that the documents below fall due on the date stated. If already paid, please disregard this notice and send us the proof of payment.',
          }
        : {
            type: 'paragraph',
            id: 'ext-intro',
            text: `Remetemos o extracto da V/ conta-corrente com referência a ${dateLong(v.data)}. O saldo ${saldo < 0 ? 'a V/ favor' : 'a nosso favor'} é de ${valorSaldo}.`,
            en: 'Please find your statement of account. The balance is shown below.',
          },
    );

    const tRows: string[][] = [];
    if (!aviso && money(v.saldoAnterior)) tRows.push(['', 'Saldo anterior', '', '', '', '', fm(money(v.saldoAnterior) ?? 0)]);
    for (const m of movs) {
      tRows.push([m.data ? formatDateShort(m.data) : '', m.doc, m.descricao, m.vencimento ? formatDateShort(m.vencimento) : '', fm(m.debito), fm(m.credito), aviso ? '' : moneyText(m.saldo).replace(' MT', '')]);
    }
    if (!tRows.length) tRows.push(['', BLANK, '', '', '', '', '']);
    blocks.push({
      type: 'table',
      columns: [
        { label: 'Data', width: 1.05, align: 'center' },
        { label: 'Documento', width: 1.6 },
        { label: 'Descrição', width: 1.85 },
        { label: 'Venc.', width: 1.05, align: 'center' },
        { label: 'Débito', width: 1.5, align: 'right' },
        { label: 'Crédito', width: 1.5, align: 'right' },
        ...(aviso ? [] : [{ label: 'Saldo', width: 1.65, align: 'right' as const }]),
      ],
      rows: aviso ? tRows.map((r) => r.slice(0, 6)) : tRows,
      totals: aviso
        ? [['', 'Total', '', '', fm(c.debitos) || '0,00', fm(c.creditos) || '0,00'], ['', saldo < 0 ? 'Saldo a favor do cliente' : 'Valor a pagar', '', '', '', moneyText(Math.abs(saldo)).replace(' MT', '')]]
        : [['', 'Totais', '', '', fm(c.debitos) || '0,00', fm(c.creditos) || '0,00', ''], ['', saldo < 0 ? 'Saldo a favor do cliente' : 'Saldo a pagar', '', '', '', '', moneyText(Math.abs(saldo)).replace(' MT', '')]],
      note: 'Valores em meticais (MT).',
    });

    if (!aviso && v.mostrarAntiguidade) {
      const a = c.ageing;
      blocks.push({ type: 'heading', text: 'Antiguidade dos saldos' });
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Não vencido', align: 'right' },
          { label: `Até ${B[0]} dias`, align: 'right' },
          { label: `${B[0] + 1} a ${B[1]} dias`, align: 'right' },
          { label: `${B[1] + 1} a ${B[2]} dias`, align: 'right' },
          { label: `Mais de ${B[2]} dias`, align: 'right' },
        ],
        rows: [[fm(a.naoVencido) || '—', fm(a.a30) || '—', fm(a.a60) || '—', fm(a.a90) || '—', fm(a.mais90) || '—']],
        note: 'Distribuição das facturas e notas de débito do extracto, sem imputação dos pagamentos.',
      });
    }

    const pagamento = [
      str(v.banco) || str(v.nib) ? `por transferência para a conta ${[str(v.banco), str(v.nib) ? `NIB ${str(v.nib)}` : ''].filter(Boolean).join(', ')}` : '',
      str(v.mobileMoney) ? `por ${str(v.mobileMoney)}` : '',
    ].filter(Boolean);
    if (pagamento.length && saldo > 0) {
      blocks.push({
        type: 'paragraph',
        id: 'ext-pagamento',
        text: `O pagamento pode ser efectuado ${pagamento.join(' ou ')}, indicando como referência ${str(v.clienteCodigo) ? `o código de cliente ${str(v.clienteCodigo)}` : 'os números dos documentos'}.`,
        en: 'Payment can be made to the account shown, quoting the customer code or document numbers.',
      });
    }
    if (!aviso) {
      const p = int(v.prazoConferenciaDias);
      blocks.push({
        type: 'paragraph',
        id: 'ext-conferencia',
        text: `Agradecemos que confira o extracto e nos comunique ${p ? `no prazo de ${p} dias` : 'com brevidade'} qualquer divergência.`,
        en: 'Please check the statement and let us know of any difference.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'ext-fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [issuerSignature(ctx, 'O Departamento Financeiro')] },
      {
        type: 'note',
        text: `Este ${aviso ? 'aviso' : 'extracto'} não é uma factura nem um recibo: os documentos fiscais nele referidos foram emitidos nos termos do Código do IVA. Em caso de atraso no pagamento são devidos juros de mora (${cite('codigoCivilMora')}).`,
        en: 'This is not an invoice or a receipt. Default interest is due on late payment.',
      },
    );

    if (v.pedirConfirmacao && !aviso) {
      blocks.push({
        type: 'box',
        cut: true,
        label: 'Confirmação do saldo',
        text: `${str(v.clienteNome) || BLANK} confirma que o saldo em ${formatDateShort(v.data)} é de ____________________ MT.\n[   ] Concordamos com o saldo indicado.   [   ] Não concordamos, pelas razões seguintes:`,
        lines: 2,
      });
      blocks.push({ type: 'signatures', columns: [{ role: 'O Cliente (assinatura e carimbo)', detail: 'Data: ___/___/______' }] });
    }
    return blocks;
  },
});
