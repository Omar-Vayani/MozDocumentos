import { formatMonthYear, roundMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, formatMoney, g, isF, l, lineItems, localField, money, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- Local helpers

const PROFILE_VALUES: Record<string, (p: Profile) => string | undefined> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Naturalidade: (p) => p.naturalidade,
  Morada: (p) => addressLine(p),
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

/** Full identification of a person, notarial style. Missing document data prints a blank line to fill in. */
function identificacao(v: Values, p: string): string {
  const get = (k: string) => String(v[`${p}${k}`] ?? '').trim();
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? ec.replace(/o$/, 'a') : ec;
  const emissao = [get('DocLocal') ? `em ${get('DocLocal')}` : '', get('DocEmissao') ? `a ${dateLong(get('DocEmissao'))}` : '']
    .filter(Boolean)
    .join(', ');
  const doc = `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`;
  return [
    `**${get('Nome') || BLANK}**`,
    estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    get('Naturalidade') ? `natural de ${get('Naturalidade')}` : '',
    get('Profissao') ? `de profissão ${get('Profissao')}` : '',
    doc,
    get('Nuit') ? `titular do NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

const ENT_F = /^(direc[cç][aã]o|conservat[oó]ria|autoridade|embaixada|universidade|escola|reparti[cç][aã]o|c[aâ]mara|secretaria|administra[cç][aã]o|pol[ií]cia|empresa|sociedade|ag[eê]ncia|delega[cç][aã]o|procuradoria|comiss[aã]o|associa[cç][aã]o|cooperativa|funda[cç][aã]o|inspec[cç][aã]o|alf[aâ]ndega|edm|at)\b/i;
const ENT_M = /^(banco|instituto|minist[eé]rio|tribunal|conselho|servi[cç]o|munic[ií]pio|registo|gabinete|hospital|consulado|arquivo|inss|inatter|fundo|centro|departamento|governo|comando|cart[oó]rio|millennium|bci|standard|absa|moza|fnb|ecobank|nedbank|bni)\b/i;

/** "de"/"da"/"do" + entity name: "da Embaixada…", "do Banco…", "de Maria Silva". */
function deEntidade(e: string): string {
  const m = /^(a|o|as|os)\s+(.*)$/i.exec(e);
  if (m) return `d${m[1].toLowerCase()} ${m[2]}`;
  if (ENT_F.test(e)) return `da ${e}`;
  if (ENT_M.test(e)) return `do ${e}`;
  return `de ${e}`;
}

const PESSOA_KEYS = [
  'nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada',
] as const;

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "October 2026" from "2026-10" (English reading aid). */
const monthEn = (ym: unknown) => {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym ?? ''));
  return m ? `${MONTHS_EN[Number(m[2]) - 1] ?? ''} ${m[1]}`.trim() : '';
};

const FINALIDADES: Record<string, { pt: string; en: string }> = {
  visto: { pt: 'pedido de visto', en: 'a visa application' },
  credito: { pt: 'pedido de crédito', en: 'a loan application' },
  conta: { pt: 'abertura de conta bancária', en: 'opening a bank account' },
  arrendamento: { pt: 'arrendamento de imóvel', en: 'renting a property' },
  bolsa: { pt: 'candidatura a bolsa de estudo', en: 'a scholarship application' },
};

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'declaracao-de-rendimentos-pessoal',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    {
      id: 'declarante',
      title: l('Declarante', 'Declarant'),
      description: l('Os dados vêm do seu perfil pessoal. Pode alterá-los.', 'Details come from your personal profile. You can change them.'),
      personRole: 'outro',
    },
    { id: 'rendimentos', title: l('Rendimentos', 'Income') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
  ],
  fields: [
    localField(),
    dateField(),
    ...fromPersonalProfile(workerFields([...PESSOA_KEYS], 'declarante', 'declarante'), 'declarante'),
    {
      name: 'declaranteProfissao',
      type: 'text',
      section: 'declarante',
      width: 'half',
      personKey: 'cargo',
      label: l('Profissão / actividade', 'Occupation'),
      placeholder: l('Ex.: comerciante; consultor independente', 'E.g. trader; independent consultant'),
    },
    {
      name: 'rendimentos',
      type: 'lines',
      section: 'rendimentos',
      required: true,
      label: l('Fontes de rendimento', 'Sources of income'),
      help: l(
        'Uma linha por fonte, com o valor médio por mês. Ex.: "Venda de produtos agrícolas no Mercado do Zimpeto"; "Arrendamento de uma flat na Sommerschield".',
        'One row per source, with the average monthly amount. E.g. "Sale of farm produce"; "Rent from a flat".',
      ),
      addLabel: l('Adicionar fonte de rendimento', 'Add income source'),
      columns: [
        { name: 'fonte', type: 'text', label: l('Fonte / actividade', 'Source / activity') },
        { name: 'valor', type: 'money', label: l('Valor mensal médio', 'Average monthly amount') },
      ],
      default: [],
    },
    {
      name: 'periodoInicio',
      type: 'month',
      section: 'rendimentos',
      width: 'half',
      label: l('Período: desde', 'Period: from'),
      help: l('Meses a que se refere a média. Opcional.', 'Months the average refers to. Optional.'),
    },
    { name: 'periodoFim', type: 'month', section: 'rendimentos', width: 'half', label: l('Período: até', 'Period: to') },
    {
      name: 'semOutrosRendimentos',
      type: 'toggle',
      section: 'rendimentos',
      default: true,
      label: l('Declaro que não tenho outros rendimentos', 'I declare I have no other income'),
    },
    {
      name: 'anexos',
      type: 'textarea',
      section: 'rendimentos',
      rows: 3,
      label: l('Documentos que junta (opcional)', 'Supporting documents attached (optional)'),
      placeholder: l('Ex.: extractos bancários dos últimos meses\nCópia do alvará', 'E.g. recent bank statements\nCopy of trading licence'),
      help: l('Um documento por linha.', 'One document per line.'),
    },
    {
      name: 'finalidade',
      type: 'select',
      section: 'finalidade',
      width: 'half',
      default: 'visto',
      label: l('Para que serve', 'Purpose'),
      options: [
        { value: 'visto', label: l('Pedido de visto', 'Visa application') },
        { value: 'credito', label: l('Pedido de crédito', 'Loan application') },
        { value: 'conta', label: l('Abertura de conta bancária', 'Opening a bank account') },
        { value: 'arrendamento', label: l('Arrendamento de casa', 'Renting a home') },
        { value: 'bolsa', label: l('Bolsa de estudo', 'Scholarship') },
        { value: 'outro', label: l('Outro fim', 'Other purpose') },
      ],
    },
    {
      name: 'finalidadeOutra',
      type: 'text',
      section: 'finalidade',
      width: 'half',
      label: l('Qual?', 'Which?'),
      placeholder: l('Ex.: matrícula do meu filho em escola privada', 'E.g. enrolling my child in a private school'),
      help: l('Completa a frase "para efeitos de…".', 'Completes the phrase "for the purpose of…".'),
      showIf: (v) => v.finalidade === 'outro',
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'finalidade',
      label: l('Entidade a quem se destina (opcional)', 'Receiving institution (optional)'),
      placeholder: l('Ex.: Embaixada de Portugal em Maputo', 'E.g. Embassy of Portugal in Maputo'),
    },
  ],

  computed: (v) => {
    const linhas = lineItems(v.rendimentos)
      .map((r) => ({ fonte: String(r.fonte ?? '').trim(), valor: money(r.valor) }))
      .filter((r) => r.fonte || r.valor != null);
    const total = roundMoney(linhas.reduce((t, r) => t + (r.valor ?? 0), 0));
    return { linhas, total };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.linhas.length === 0) {
      w.push({ level: 'warning', field: 'rendimentos', message: l('Indique pelo menos uma fonte de rendimento e o seu valor.', 'Enter at least one income source and its amount.') });
    } else if (c.linhas.some((r: { valor: number | null }) => r.valor == null)) {
      w.push({ level: 'warning', field: 'rendimentos', message: l('Há fontes de rendimento sem valor.', 'Some income sources have no amount.') });
    }
    if (!v.declaranteDocNumero) {
      w.push({ level: 'warning', field: 'declaranteDocNumero', message: l('Falta o número do documento de identificação.', 'The ID document number is missing.') });
    }
    if (!v.declaranteNuit) {
      w.push({
        level: 'info',
        field: 'declaranteNuit',
        message: l('Falta o NUIT. Bancos e embaixadas pedem-no com frequência.', 'The NUIT is missing. Banks and embassies often ask for it.'),
      });
    }
    if (v.periodoInicio && v.periodoFim && String(v.periodoFim) < String(v.periodoInicio)) {
      w.push({ level: 'error', field: 'periodoFim', message: l('O fim do período é anterior ao início.', 'The end of the period is before the start.') });
    }
    if (v.periodoFim && v.data && String(v.periodoFim) > String(v.data).slice(0, 7)) {
      w.push({ level: 'warning', field: 'periodoFim', message: l('O período termina depois da data da declaração.', 'The period ends after the date of the statement.') });
    }
    if (v.finalidade === 'outro' && !String(v.finalidadeOutra ?? '').trim()) {
      w.push({ level: 'warning', field: 'finalidadeOutra', message: l('Indique para que serve a declaração.', 'State what the statement is for.') });
    }
    w.push({
      level: 'info',
      message: l(
        'Esta declaração não substitui comprovativos. Junte, se os tiver, extractos bancários ou documentos da actividade.',
        'This statement does not replace evidence. Attach bank statements or business documents if you have them.',
      ),
    });
    return w;
  },

  personName: (v) => v.declaranteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const linhas: { fonte: string; valor: number | null }[] = c.linhas ?? [];
    const total: number = c.total ?? 0;
    const de = v.periodoInicio ? formatMonthYear(v.periodoInicio) : '';
    const ate = v.periodoFim ? formatMonthYear(v.periodoFim) : '';
    const passado = Boolean(v.periodoFim && v.data && String(v.periodoFim) < String(v.data).slice(0, 7));
    const periodo =
      de && ate ? `no período compreendido entre ${de} e ${ate}, ` : de ? `desde ${de}, ` : ate ? `até ${ate}, ` : '';
    const deEn = monthEn(v.periodoInicio);
    const ateEn = monthEn(v.periodoFim);
    const periodoEn = deEn && ateEn ? `from ${deEn} to ${ateEn}, ` : deEn ? `since ${deEn}, ` : ateEn ? `until ${ateEn}, ` : '';

    const fimPt = v.finalidade === 'outro' ? String(v.finalidadeOutra ?? '').trim().replace(/[.;,:]+$/, '') : FINALIDADES[v.finalidade]?.pt ?? '';
    const fimEn = v.finalidade === 'outro' ? 'the purpose stated' : FINALIDADES[v.finalidade]?.en ?? 'the purpose stated';
    const entidade = String(v.entidade ?? '').trim().replace(/[.;,:]+$/, '');

    const rows = linhas.length
      ? linhas.map((r) => [r.fonte || 'Rendimento', r.valor != null ? formatMoney(r.valor, false) : ''])
      : [['', ''], ['', ''], ['', '']];

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de rendimentos', subtitle: 'Sob compromisso de honra' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Eu, ${identificacao(v, 'declarante')}, declaro, sob compromisso de honra, que ${periodo}${passado ? 'auferi' : 'aufiro'} os rendimentos mensais médios a seguir discriminados:`,
        en: `I, the undersigned, identified above, declare on my honour that ${periodoEn}my average monthly income ${passado ? 'was' : 'is'} as follows:`,
      },
      {
        type: 'table',
        columns: [
          { label: 'Fonte de rendimento / actividade', width: 3.2 },
          { label: 'Valor mensal médio (MT)', width: 1.4, align: 'right' },
        ],
        rows,
        totals: [['Total mensal', linhas.length ? formatMoney(total, false) : '']],
      },
    ];
    if (total > 0) {
      blocks.push({ type: 'amount', label: 'Rendimento mensal médio total', value: total });
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'totalManual',
        text: `Rendimento mensal médio total: ${BLANK} MT (${BLANK}${BLANK}).`,
        en: 'Total average monthly income (in figures and in words).',
      });
    }
    if (v.semOutrosRendimentos) {
      blocks.push({
        type: 'paragraph',
        id: 'semOutros',
        text: 'Declaro ainda que não aufiro quaisquer outros rendimentos além dos acima indicados.',
        en: 'I further declare that I receive no income other than that stated above.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'finalidade',
      text: `A presente declaração é emitida para efeitos de ${fimPt || BLANK}${entidade ? `, junto ${deEntidade(entidade)}` : ''}, não podendo ser utilizada para outros fins.`,
      en: `This statement is issued for ${fimEn}${entidade ? `, to be submitted to ${entidade}` : ''}, and may not be used for any other purpose.`,
    });
    const anexos = splitLines(v.anexos);
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Documentos anexos:', items: anexos });
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, assino a presente declaração sob compromisso de honra, ciente de que a prestação de falsas declarações me faz incorrer em responsabilidade civil e criminal, nos termos da lei.',
        en: 'In witness whereof I sign this statement on my honour, aware that making false statements gives rise to civil and criminal liability under the law.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: g(v.declaranteGenero, 'O Declarante', 'A Declarante'), name: v.declaranteNome || undefined }],
      },
    );
    return blocks;
  },
});
