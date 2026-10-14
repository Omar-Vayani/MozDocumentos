// Recibo de caução: the landlord acknowledges the security deposit paid by the
// tenant, or — at the end of the lease — the tenant acknowledges the refund,
// with the deductions agreed (damage, unpaid rent or utilities).

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, lineItems, localField, money, refField, workerFields } from './_shared';
import { valorTexto } from './_contratos';
import { semPonto, str } from './_familia';

const MODO: Record<string, string> = {
  'transferência bancária': 'por transferência bancária',
  numerário: 'em numerário',
  cheque: 'por cheque',
};

const ident = (v: Values, p: string) => {
  const f = isF(v[`${p}Genero`]);
  const doc = str(v[`${p}DocNumero`]);
  const nuit = str(v[`${p}Nuit`]);
  return [`**${str(v[`${p}Nome`]) || BLANK}**`, doc ? `${f ? 'portadora' : 'portador'} do BI n.º ${doc}` : '', nuit ? `NUIT ${nuit}` : ''].filter(Boolean).join(', ');
};

export default defineTemplate({
  id: 'recibo-de-caucao',
  family: 'recibo',
  page: (v) => (v.formato === 'A5' ? 'A5' : 'A4'),
  sections: [
    { id: 'documento', title: l('Recibo', 'Receipt') },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'caucao', title: l('Imóvel e caução', 'Property and deposit') },
    { id: 'devolucao', title: l('Devolução e deduções', 'Refund and deductions') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      required: true,
      label: l('Tipo de recibo', 'Kind of receipt'),
      options: [
        { value: 'recebimento', label: l('Recebimento da caução (início do contrato)', 'Deposit received (start of the lease)') },
        { value: 'devolucao', label: l('Devolução da caução (fim do contrato)', 'Deposit refunded (end of the lease)') },
      ],
      default: 'recebimento',
    },
    { ...refField(), label: l('Número do recibo (opcional)', 'Receipt number (optional)') },
    localField(),
    dateField('data', 'documento', l('Data', 'Date')),
    {
      name: 'formato',
      type: 'select',
      section: 'documento',
      width: 'half',
      default: 'A5',
      label: l('Formato do papel', 'Paper size'),
      options: [
        { value: 'A4', label: l('A4', 'A4') },
        { value: 'A5', label: l('A5 (meia folha)', 'A5 (half sheet)') },
      ],
    },
    ...workerFields(['nome', 'genero', 'docNumero', 'nuit'], 'senhorio', 'senhorio').map((f) => ({
      ...f,
      default: f.name === 'senhorioNome' ? (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.kind === 'empresa' ? c.profile.firma ?? '' : '') : f.default,
    })),
    ...workerFields(['nome', 'genero', 'docNumero', 'nuit'], 'inquilino', 'inquilino'),
    { name: 'imovelMorada', type: 'text', section: 'caucao', required: true, label: l('Morada do imóvel arrendado', 'Address of the leased property') },
    { name: 'contratoData', type: 'date', section: 'caucao', width: 'half', label: l('Data do contrato de arrendamento', 'Date of the lease') },
    { name: 'caucaoValor', type: 'money', section: 'caucao', width: 'half', required: true, label: l('Valor da caução', 'Deposit amount') },
    { name: 'formaPagamento', type: 'select', section: 'caucao', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'pagamentoReferencia', type: 'text', section: 'caucao', width: 'half', label: l('Referência do pagamento (opcional)', 'Payment reference (optional)') },
    {
      name: 'deducoes',
      type: 'lines',
      section: 'devolucao',
      label: l('Deduções acordadas', 'Agreed deductions'),
      addLabel: l('Adicionar dedução', 'Add deduction'),
      help: l('Danos, rendas ou consumos em dívida, conforme o auto de vistoria de saída.', 'Damage, unpaid rent or utilities, as per the move-out inspection.'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Motivo', 'Reason') },
        { name: 'valor', type: 'money', label: l('Valor (MT)', 'Amount (MT)') },
      ],
      default: [],
      showIf: (v) => v.tipo === 'devolucao',
    },
  ],

  computed: (v) => {
    const caucao = money(v.caucaoValor);
    const deducoes = v.tipo === 'devolucao' ? lineItems(v.deducoes).filter((r) => str(r.descricao)) : [];
    const totalDeducoes = roundMoney(deducoes.reduce((s, r) => s + (money(r.valor) ?? 0), 0));
    const devolvido = caucao != null ? roundMoney(caucao - totalDeducoes) : null;
    return { caucao, deducoes, totalDeducoes, devolvido };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.caucao == null) w.push({ level: 'error', field: 'caucaoValor', message: l('Indique o valor da caução.', 'Enter the deposit amount.') });
    if (!str(v.imovelMorada)) w.push({ level: 'warning', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    if (c.devolvido != null && c.devolvido < 0) w.push({ level: 'error', field: 'deducoes', message: l('As deduções excedem a caução.', 'Deductions exceed the deposit.') });
    if (v.tipo === 'recebimento') {
      w.push({ level: 'info', message: l('A caução não é renda: não pode ser usada pelo inquilino para pagar rendas, salvo acordo. Guarde este recibo até ao fim do contrato.', 'The deposit is not rent and cannot be used to pay rent unless agreed. Keep this receipt until the lease ends.') });
    }
    return w;
  },

  personName: (v) => v.inquilinoNome || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const fS = isF(v.senhorioGenero);
    const fI = isF(v.inquilinoGenero);
    const S = fS ? 'senhoria' : 'senhorio';
    const I = fI ? 'inquilina' : 'inquilino';
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const modo = MODO[forma] ?? `através de ${forma}`;
    const refPag = forma !== 'numerário' && str(v.pagamentoReferencia) ? ` (referência ${str(v.pagamentoReferencia)})` : '';
    const contrato = str(v.contratoData) ? `do contrato de arrendamento celebrado em ${dateLong(v.contratoData)}` : 'do contrato de arrendamento';
    const imovel = semPonto(v.imovelMorada) || BLANK;
    const devolucao = v.tipo === 'devolucao';
    const numero = str(v.ref) ? ` n.º ${str(v.ref)}` : '';

    const sS: SignatureColumn = { role: fS ? 'A Senhoria' : 'O Senhorio', name: str(v.senhorioNome) || undefined, image: ctx.profile && !devolucao ? (ctx.profile.kind === 'empresa' ? 'both' : 'signature') : undefined };
    const sI: SignatureColumn = { role: fI ? 'A Inquilina' : 'O Inquilino', name: str(v.inquilinoNome) || undefined };

    const blocks: Block[] = [{ type: 'title', text: `${devolucao ? 'Recibo de devolução da caução' : 'Recibo de caução'}${numero}` }];
    if (!devolucao) {
      blocks.push(
        { type: 'amount', label: 'Valor recebido a título de caução', value: c.caucao },
        {
          type: 'paragraph',
          id: 'declaracao',
          text: `${ident(v, 'senhorio')}, na qualidade de ${S} do imóvel sito em ${imovel}, declara ter recebido de ${ident(v, 'inquilino')}, na qualidade de ${I}, a quantia de ${valorTexto(c.caucao)}, paga ${modo}${refPag}, a título de caução, para garantia do cumprimento das obrigações emergentes ${contrato}.`,
          en: `The landlord confirms receipt from the tenant of ${c.caucao != null ? formatMoney(c.caucao) : '—'} as a security deposit under the lease of the property above, paid by ${forma}.`,
        },
        {
          type: 'paragraph',
          id: 'restituicao',
          text: `A caução não vence juros e não pode ser imputada no pagamento de rendas. Será restituída ${fI ? 'à' : 'ao'} ${I} após a cessação do contrato e a entrega do imóvel e das chaves, deduzida apenas dos montantes que comprovadamente forem devidos por rendas, consumos ou danos, nos termos do contrato.`,
          en: 'The deposit bears no interest and cannot be used as rent. It is returned after the lease ends and the property and keys are handed back, less only amounts proven to be due.',
          keepWithNext: true,
        },
        { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [sS] },
      );
      return blocks;
    }

    blocks.push({ type: 'amount', label: 'Valor devolvido', value: c.devolvido });
    blocks.push({
      type: 'paragraph',
      id: 'declaracao',
      text: `${ident(v, 'inquilino')}, na qualidade de ${I} do imóvel sito em ${imovel}, declara ter recebido de ${ident(v, 'senhorio')}, na qualidade de ${S}, a quantia de ${valorTexto(c.devolvido)}, paga ${modo}${refPag}, por restituição da caução de ${valorTexto(c.caucao)} prestada no âmbito ${contrato}${c.deducoes.length ? ', deduzida dos montantes abaixo indicados, que aceita' : ''}.`,
      en: `The tenant confirms receiving ${c.devolvido != null ? formatMoney(c.devolvido) : '—'} from the landlord as the refund of the ${c.caucao != null ? formatMoney(c.caucao) : '—'} deposit${c.deducoes.length ? ', less the deductions below, which the tenant accepts' : ''}.`,
    });
    if (c.deducoes.length) {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Dedução', width: 5 },
          { label: 'Valor (MT)', width: 1.6, align: 'right' },
        ],
        rows: c.deducoes.map((r: Record<string, unknown>) => [str(r.descricao), formatMoney(money(r.valor), false)]),
        totals: [['Total deduzido', formatMoney(c.totalDeducoes, false)]],
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'quitacao',
        text: 'Com o presente recibo, as partes dão por integralmente acertada a caução, nada mais tendo a exigir uma da outra a esse título.',
        en: 'With this receipt the deposit is fully settled and neither party has any further claim in respect of it.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [sI, sS] },
    );
    return blocks;
  },
});
