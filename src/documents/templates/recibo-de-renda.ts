import { addMonths, formatMonthYear, MAX_EXTENSO, numeroPorExtenso, roundMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, localField, money, refField, workerFields } from './_shared';

// ---------------------------------------------------------------- Local helpers

const PROFILE_VALUES: Record<string, (p: Profile) => string | undefined> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  Nuit: (p) => p.nuit,
};

/** Defaults the author's fields from a personal profile (kind 'pessoa'). */
function fromPersonalProfile(fields: FieldDef[], prefix: string): FieldDef[] {
  return fields.map((f) => {
    const pick = PROFILE_VALUES[f.name.slice(prefix.length)];
    if (!pick) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const fromProfile = c.profile?.kind === 'pessoa' ? pick(c.profile) : '';
        if (fromProfile) return fromProfile;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };
const str = (x: unknown) => String(x ?? '').trim();
const isEmpresa = (v: Values, p: string) => v[`${p}Tipo`] === 'empresa';

const extenso = (n: number | null) => (n != null && n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');
const valorTexto = (n: number | null) => (n == null ? `${BLANK} MT` : `**${formatMoney(n)}**${extenso(n) ? ` (${extenso(n)})` : ''}`);

function tipoField(p: string, fromProfile: boolean): FieldDef {
  return {
    name: `${p}Tipo`,
    type: 'radio',
    section: p,
    label: l('Tipo', 'Type'),
    options: [
      { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
      { value: 'empresa', label: l('Empresa', 'Company') },
    ],
    default: fromProfile ? (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa') : 'pessoa',
  };
}

const MODO: Record<string, string> = {
  'transferência bancária': 'por transferência bancária',
  numerário: 'em numerário',
  cheque: 'por cheque',
};

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'recibo-de-renda',
  family: 'recibo',
  sections: [
    { id: 'documento', title: l('Recibo', 'Receipt') },
    {
      id: 'senhorio',
      title: l('Senhorio (quem recebe)', 'Landlord (payee)'),
      description: l('Os dados vêm do seu perfil.', 'Details come from your profile.'),
      personRole: 'senhorio',
    },
    { id: 'inquilino', title: l('Inquilino (quem paga)', 'Tenant (payer)'), personRole: 'inquilino' },
    { id: 'pagamento', title: l('Imóvel e pagamento', 'Property and payment') },
  ],
  fields: [
    { ...refField(), label: l('Número do recibo', 'Receipt number'), required: true },
    localField(),
    dateField('data', 'documento', l('Data do recebimento', 'Date received')),

    tipoField('senhorio', true),
    ...fromPersonalProfile(workerFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit'], 'senhorio', 'senhorio'), 'senhorio').map((f) => ({
      ...f,
      showIf: (v: Values) => !isEmpresa(v, 'senhorio'),
    })),
    {
      name: 'senhorioEmpresaNome',
      type: 'text',
      section: 'senhorio',
      label: l('Denominação da empresa', 'Company name'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : ''),
      showIf: (v) => isEmpresa(v, 'senhorio'),
    },
    {
      name: 'senhorioEmpresaNuit',
      type: 'text',
      section: 'senhorio',
      width: 'half',
      label: l('NUIT', 'Tax number (NUIT)'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.nuit ?? '' : ''),
      showIf: (v) => isEmpresa(v, 'senhorio'),
    },
    {
      name: 'senhorioRepNome',
      type: 'text',
      section: 'senhorio',
      width: 'half',
      label: l('Quem assina', 'Signatory'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : ''),
      showIf: (v) => isEmpresa(v, 'senhorio'),
    },
    {
      name: 'senhorioRepCargo',
      type: 'text',
      section: 'senhorio',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
      showIf: (v) => isEmpresa(v, 'senhorio'),
    },

    tipoField('inquilino', false),
    ...workerFields(['nome', 'genero', 'nuit'], 'inquilino', 'inquilino').map((f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v, 'inquilino') })),
    { name: 'inquilinoEmpresaNome', type: 'text', section: 'inquilino', label: l('Denominação da empresa', 'Company name'), showIf: (v) => isEmpresa(v, 'inquilino') },
    { name: 'inquilinoEmpresaNuit', type: 'text', section: 'inquilino', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), showIf: (v) => isEmpresa(v, 'inquilino') },

    {
      name: 'imovelMorada',
      type: 'text',
      section: 'pagamento',
      required: true,
      label: l('Morada do imóvel arrendado', 'Address of the rented property'),
      placeholder: l('Ex.: Rua da Resistência, n.º 45, flat 3, Bairro da Malhangalene, Cidade de Maputo', 'E.g. street, number, flat, neighbourhood, city'),
    },
    {
      name: 'contratoData',
      type: 'date',
      section: 'pagamento',
      width: 'half',
      label: l('Data do contrato de arrendamento (opcional)', 'Date of the lease (optional)'),
    },
    {
      name: 'mesReferencia',
      type: 'month',
      section: 'pagamento',
      width: 'half',
      required: true,
      label: l('Mês da renda', 'Rent month'),
      help: l('Se paga vários meses, indique o primeiro.', 'If several months are paid, enter the first one.'),
      default: (c) => c.today.slice(0, 7),
    },
    {
      name: 'numeroMeses',
      type: 'number',
      section: 'pagamento',
      width: 'half',
      min: 1,
      max: 24,
      default: 1,
      label: l('Número de meses pagos', 'Number of months paid'),
    },
    { name: 'rendaMensal', type: 'money', section: 'pagamento', width: 'half', required: true, label: l('Renda mensal', 'Monthly rent') },
    {
      name: 'valor',
      type: 'money',
      section: 'pagamento',
      width: 'half',
      computedKey: 'totalCalc',
      label: l('Valor recebido', 'Amount received'),
      help: l('Calculado: renda × meses. Escreva outro valor se recebeu um montante diferente.', 'Computed: rent × months. Type another amount if you received a different sum.'),
    },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: 'pagamentoReferencia',
      type: 'text',
      section: 'pagamento',
      width: 'half',
      label: l('Referência do pagamento (opcional)', 'Payment reference (optional)'),
      placeholder: l('Ex.: n.º da transacção ou do cheque', 'E.g. transaction or cheque number'),
      showIf: (v) => v.formaPagamento !== 'numerário',
    },
    {
      name: 'retencao',
      type: 'toggle',
      section: 'pagamento',
      label: l('O inquilino reteve imposto na fonte', 'The tenant withheld tax at source'),
      help: l(
        'Algumas empresas inquilinas retêm imposto (IRPS ou IRPC) sobre a renda e entregam-no à Autoridade Tributária. Indique o valor retido para o recibo mostrar o valor ilíquido e o líquido.',
        'Some company tenants withhold tax (IRPS or IRPC) on the rent and pay it to the Tax Authority. Enter the amount withheld so the receipt shows gross and net amounts.',
      ),
      showIf: (v) => isEmpresa(v, 'inquilino'),
    },
    {
      name: 'valorRetido',
      type: 'money',
      section: 'pagamento',
      width: 'half',
      label: l('Imposto retido na fonte', 'Tax withheld'),
      showIf: (v) => isEmpresa(v, 'inquilino') && Boolean(v.retencao),
    },
  ],

  computed: (v) => {
    const renda = money(v.rendaMensal);
    const n = Math.max(1, Math.floor(Number(v.numeroMeses) || 1));
    const totalCalc = renda != null ? roundMoney(renda * n) : null;
    const total = money(v.valor) ?? totalCalc;
    const retido = isEmpresa(v, 'inquilino') && v.retencao ? money(v.valorRetido) : null;
    const liquido = total != null && retido != null && retido > 0 ? roundMoney(total - retido) : null;
    const mes = typeof v.mesReferencia === 'string' && v.mesReferencia ? `${v.mesReferencia.slice(0, 7)}-01` : '';
    return {
      n,
      renda,
      totalCalc,
      total,
      retido: liquido != null ? retido : null,
      liquido,
      de: mes ? formatMonthYear(mes) : '',
      ate: mes && n > 1 ? formatMonthYear(addMonths(mes, n - 1)) : '',
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.total == null) w.push({ level: 'error', field: 'rendaMensal', message: l('Indique a renda mensal ou o valor recebido.', 'Enter the monthly rent or the amount received.') });
    if (c.total != null && c.totalCalc != null && c.total !== c.totalCalc) {
      w.push({
        level: 'info',
        field: 'valor',
        message: l(
          `O valor recebido é diferente de renda × meses (${formatMoney(c.totalCalc)}). Confirme se é um pagamento parcial.`,
          `The amount received differs from rent × months (${formatMoney(c.totalCalc)}). Check whether it is a partial payment.`,
        ),
      });
    }
    if (isEmpresa(v, 'inquilino') && v.retencao && money(v.valorRetido) == null) {
      w.push({ level: 'warning', field: 'valorRetido', message: l('Indique o valor do imposto retido.', 'Enter the amount of tax withheld.') });
    }
    if (c.liquido != null && c.liquido < 0) {
      w.push({ level: 'error', field: 'valorRetido', message: l('O imposto retido é superior à renda.', 'The tax withheld exceeds the rent.') });
    }
    if (isEmpresa(v, 'senhorio')) {
      w.push({
        level: 'info',
        message: l(
          'Uma empresa senhoria deve também emitir a factura ou factura-recibo exigida pelo Código do IVA, em impresso de tipografia autorizada ou programa certificado. Este recibo não a substitui.',
          'A company landlord must also issue the invoice or invoice-receipt required by the VAT Code, on authorised printed forms or certified software. This receipt does not replace it.',
        ),
      });
    }
    if (!str(v.ref)) w.push({ level: 'warning', field: 'ref', message: l('Indique o número do recibo.', 'Enter the receipt number.') });
    if (!str(v.imovelMorada)) w.push({ level: 'warning', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    const nuitS = isEmpresa(v, 'senhorio') ? v.senhorioEmpresaNuit : v.senhorioNuit;
    if (!str(nuitS)) {
      w.push({
        level: 'info',
        field: isEmpresa(v, 'senhorio') ? 'senhorioEmpresaNuit' : 'senhorioNuit',
        message: l('Falta o NUIT do senhorio. Inquilinos empresa precisam dele para registar a despesa.', 'The landlord’s NUIT is missing. Company tenants need it to record the expense.'),
      });
    }
    return w;
  },

  personName: (v) => (isEmpresa(v, 'inquilino') ? v.inquilinoEmpresaNome : v.inquilinoNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const empS = isEmpresa(v, 'senhorio');
    const fS = !empS && isF(v.senhorioGenero);
    const papelS = fS ? 'senhoria' : 'senhorio';

    const senhorio = empS
      ? [`**${str(v.senhorioEmpresaNome) || BLANK}**`, str(v.senhorioEmpresaNuit) ? `titular do NUIT ${str(v.senhorioEmpresaNuit)}` : '']
      : [
          `**${str(v.senhorioNome) || BLANK}**`,
          str(v.senhorioDocNumero) ? `${fS ? 'portadora' : 'portador'} do ${DOC_NOME[v.senhorioDocTipo] ?? 'Bilhete de Identidade'} n.º ${str(v.senhorioDocNumero)}` : '',
          str(v.senhorioNuit) ? `titular do NUIT ${str(v.senhorioNuit)}` : '',
        ];
    const inquilino = isEmpresa(v, 'inquilino')
      ? [`**${str(v.inquilinoEmpresaNome) || BLANK}**`, str(v.inquilinoEmpresaNuit) ? `titular do NUIT ${str(v.inquilinoEmpresaNuit)}` : '']
      : [`**${str(v.inquilinoNome) || BLANK}**`, str(v.inquilinoNuit) ? `titular do NUIT ${str(v.inquilinoNuit)}` : ''];

    const periodo = c.n > 1 ? `dos meses de ${c.de || BLANK} a ${c.ate || BLANK}` : `do mês de ${c.de || BLANK}`;
    const periodoCurto = c.n > 1 ? `${c.de || BLANK} a ${c.ate || BLANK}` : c.de || BLANK;
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const modo = MODO[forma] ?? `através de ${forma}`;
    const refPag = forma !== 'numerário' && str(v.pagamentoReferencia) ? ` (referência ${str(v.pagamentoReferencia)})` : '';
    const contrato = v.contratoData ? `, nos termos do contrato de arrendamento celebrado em ${dateLong(v.contratoData)}` : '';
    const total: number | null = c.total;

    let assinatura: SignatureColumn;
    if (empS) {
      assinatura = {
        role: 'O Senhorio',
        name: str(v.senhorioRepNome) || undefined,
        detail: [str(v.senhorioRepCargo), str(v.senhorioEmpresaNome)].filter(Boolean).join(', ') || undefined,
        image: ctx.profile?.kind === 'empresa' ? 'both' : undefined,
      };
    } else {
      const ownProfile = ctx.profile?.kind === 'pessoa' && str(ctx.profile.nome) && str(ctx.profile.nome) === str(v.senhorioNome);
      assinatura = { role: fS ? 'A Senhoria' : 'O Senhorio', name: str(v.senhorioNome) || undefined, image: ownProfile ? 'signature' : undefined };
    }

    const blocks: Block[] = [
      { type: 'title', text: `Recibo de renda n.º ${str(v.ref) || BLANK}`, subtitle: `Referente a ${periodoCurto}` },
    ];
    if (c.liquido != null && c.liquido >= 0) blocks.push({ type: 'amount', label: 'Valor líquido recebido', value: c.liquido });
    else if (total != null && total > 0) blocks.push({ type: 'amount', label: 'Valor recebido', value: total });
    blocks.push(
      {
        type: 'paragraph',
        id: 'declaracao',
        text:
          c.liquido != null
            ? `${senhorio.filter(Boolean).join(', ')}, na qualidade de ${papelS} do imóvel sito em ${str(v.imovelMorada).replace(/[.;,:]+$/, '') || BLANK}, declara ter recebido de ${inquilino.filter(Boolean).join(', ')} a renda ${periodo}${contrato}, no valor ilíquido de ${valorTexto(total)}, deduzida do imposto retido na fonte de ${formatMoney(c.retido)}, correspondendo o valor líquido recebido a ${valorTexto(c.liquido)}, pago ${modo}${refPag}, em ${dateLong(v.data)}.`
            : `${senhorio.filter(Boolean).join(', ')}, na qualidade de ${papelS} do imóvel sito em ${str(v.imovelMorada).replace(/[.;,:]+$/, '') || BLANK}, declara ter recebido de ${inquilino.filter(Boolean).join(', ')} a quantia de ${valorTexto(total)}, referente à renda ${periodo}${contrato}, paga ${modo}${refPag}, em ${dateLong(v.data)}.`,
        en: `The landlord named above confirms receipt from the tenant named above of ${total != null ? formatMoney(total) : '—'} as rent for ${periodoCurto}${c.liquido != null ? `, less ${formatMoney(c.retido)} withheld at source (net ${formatMoney(c.liquido)})` : ''}, paid by ${forma} on ${v.data || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'quitacao',
        text:
          forma === 'cheque'
            ? 'O presente recibo constitui quitação da quantia nele indicada, sob reserva de boa cobrança do cheque.'
            : 'O presente recibo constitui quitação da quantia nele indicada.',
        en: forma === 'cheque' ? 'This receipt discharges the amount stated, subject to the cheque clearing.' : 'This receipt discharges the amount stated.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [assinatura] },
    );
    return blocks;
  },
});
