// Shared building blocks for the technology, media and intellectual-property
// documents ("digital") and the tourism, transport, agriculture and security
// documents ("turismo"): payment and VAT clauses, standard service clauses
// (confidentiality, data, termination, force majeure), the identification of
// the business that publishes a policy, and the contract skeleton built on
// the shared contract helpers (_contratos.ts).

import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine, contactsLine } from '../layouts/address';
import type { Block, ClauseItem, FieldDef, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, l } from './_shared';
import { clausulasFinais, fecho, num, numerar, partesBlocks, quantos, semPonto, str, type Papel } from './_contratos';

// ---------------------------------------------------------------- Text

/** "30 (trinta) dias" from a number the user typed; a blank when missing. */
export function prazo(n: unknown, unidade: 'dia' | 'dia útil' | 'hora' | 'mês' | 'ano' | 'minuto' | 'semana' = 'dia'): string {
  const plural: Record<string, string> = { dia: 'dias', 'dia útil': 'dias úteis', hora: 'horas', mês: 'meses', ano: 'anos', minuto: 'minutos', semana: 'semanas' };
  const x = num(n);
  if (x == null || x <= 0) return `${BLANK} ${plural[unidade]}`;
  if (!Number.isInteger(x)) return `${String(x).replace('.', ',')} ${plural[unidade]}`;
  return quantos(x, unidade, plural[unidade], unidade === 'hora' || unidade === 'semana');
}

/** Splits a textarea into non-empty lines (keeps the text as typed). */
export const linhas = (x: unknown): string[] =>
  String(x ?? '')
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

/** "a), b), c)" sub-items or a single sentence. */
export const itensOuTexto = (x: unknown): string[] => linhas(x).map((s) => semPonto(s));

export const lower1 = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// ---------------------------------------------------------------- Issuer

export const issuer = (ctx: TemplateContext) => profileDisplayName(ctx.profile) || BLANK;

/** "**Firma, Lda**, NUIT 400…, com sede em …" — the business that publishes a policy or terms. */
export function entidadeTexto(p: Profile | null, nomeAlt?: string): string {
  const nome = str(nomeAlt) || profileDisplayName(p);
  if (!p) return `**${nome || BLANK}**`;
  const sede = addressLine(p);
  return [
    `**${nome || BLANK}**`,
    p.kind === 'empresa' && p.nuel ? `registada sob o NUEL ${p.nuel}` : '',
    p.nuit ? `NUIT ${p.nuit}` : '',
    sede ? `${p.kind === 'empresa' ? 'com sede em' : 'com domicílio em'} ${sede}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export const contactos = (p: Profile | null) => (p ? contactsLine(p) : '');

// ---------------------------------------------------------------- Money and VAT

export const IVA_OPTIONS = [
  { value: 'acrescido', label: l('Acresce IVA à taxa legal', 'Plus VAT at the legal rate') },
  { value: 'incluido', label: l('IVA incluído', 'VAT included') },
  { value: 'isento', label: l('Sem IVA (isento ou não sujeito)', 'No VAT (exempt or not liable)') },
];

export function ivaField(section: string, name = 'iva'): FieldDef {
  return {
    name,
    type: 'select',
    section,
    width: 'half',
    label: l('IVA', 'VAT'),
    options: IVA_OPTIONS,
    default: 'acrescido',
    help: l('Só quem está registado em IVA o cobra. Se não sabe, confirme com o contabilista.', 'Only VAT-registered businesses charge it. If unsure, ask your accountant.'),
  };
}

/** ", acrescido de IVA à taxa legal em vigor" / ", com IVA incluído" / "". */
export function ivaTexto(iva: unknown): string {
  if (iva === 'incluido') return ', com IVA incluído';
  if (iva === 'isento') return '';
  return ', acrescido de IVA à taxa legal em vigor';
}

export function formaPagamentoFields(section: string, prefix = 'pagamento'): FieldDef[] {
  return [
    { name: `${prefix}Forma`, type: 'select', section, width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: `${prefix}Conta`,
      type: 'text',
      section,
      width: 'half',
      label: l('NIB ou número da carteira (opcional)', 'Account (NIB) or wallet number (optional)'),
      default: (c) => (c.profile?.nib ? String(c.profile.nib) : ''),
    },
  ];
}

/** "por transferência bancária para a conta com o NIB …, titulada pelo Prestador". */
export function modoPagamento(v: Values, recebedor: Papel, prefix = 'pagamento'): string {
  const forma = str(v[`${prefix}Forma`]) || 'transferência bancária';
  const conta = str(v[`${prefix}Conta`]);
  switch (forma) {
    case 'numerário':
      return `em numerário, contra recibo assinado ${recebedor.pelo}`;
    case 'cheque':
      return `por cheque emitido à ordem ${recebedor.de}`;
    case 'M-Pesa':
    case 'e-Mola':
    case 'mKesh':
      return `através de ${forma}${conta ? `, para o número ${conta}` : ''}, titulado ${recebedor.pelo}`;
    default:
      return `por transferência bancária para a conta com o NIB ${conta || BLANK}, titulada ${recebedor.pelo}`;
  }
}

// ---------------------------------------------------------------- Standard clauses

export function clConfidencialidade(A: Papel, B: Papel, anosApos?: unknown): ClauseItem {
  const n = Number(anosApos);
  return {
    id: 'confidencialidade',
    heading: 'Confidencialidade',
    text: numerar([
      `As partes obrigam-se a manter confidenciais todas as informações técnicas, comerciais e financeiras, dados de clientes, códigos de acesso e demais informações da outra parte a que tenham acesso por causa do presente contrato, e a não as utilizar para outro fim que não a sua execução.`,
      `Não são confidenciais as informações que sejam do domínio público sem culpa da parte que as recebeu, ou cuja divulgação seja exigida por lei ou por ordem de autoridade competente, devendo neste caso a outra parte ser avisada de imediato.`,
      Number.isFinite(n) && n > 0
        ? `O dever de confidencialidade mantém-se durante ${prazo(n, 'ano')} após a cessação do contrato.`
        : 'O dever de confidencialidade mantém-se após a cessação do contrato.',
    ]),
    en: `Both parties keep the other’s technical, commercial and financial information, client data and access codes confidential and use them only to perform this contract; the duty survives termination. (${A.n} / ${B.n})`,
  };
}

/** Personal data handled on behalf of the client (processor clause). */
export function clDadosPessoais(responsavel: Papel, subcontratado: Papel): ClauseItem {
  return {
    id: 'dadosPessoais',
    heading: 'Dados pessoais',
    text: numerar([
      `Na medida em que, para executar o contrato, ${subcontratado.o} tenha acesso a dados pessoais de clientes, trabalhadores ou outras pessoas ${responsavel.de}, trata-os apenas por conta e segundo as instruções escritas ${responsavel.de} e para os fins do presente contrato.`,
      `${subcontratado.O} adopta medidas técnicas e organizativas adequadas para proteger os dados contra acesso, perda ou divulgação não autorizados, limita o acesso às pessoas que dele precisem, que ficam sujeitas a sigilo, e comunica de imediato ${responsavel.ao} qualquer incidente de segurança que os afecte.`,
      `No fim do contrato, ${subcontratado.o} devolve ou apaga os dados, à escolha ${responsavel.de}, salvo se a lei exigir a sua conservação.`,
    ]),
    en: 'Personal data accessed to perform the contract are processed only on the client’s written instructions and for this purpose, kept secure, accessed only by those who need them under confidentiality, incidents are reported at once, and the data are returned or deleted at the end.',
  };
}

export function clForcaMaior(): ClauseItem {
  return {
    id: 'forcaMaior',
    heading: 'Força maior',
    text: numerar([
      'Nenhuma das partes responde pelo incumprimento ou atraso causado por facto imprevisível e inevitável, alheio à sua vontade, tal como calamidade natural, epidemia, guerra, alteração da ordem pública, interrupção geral de energia ou de comunicações, ou decisão de autoridade.',
      'A parte afectada comunica o facto à outra logo que possível, indicando os efeitos previsíveis, e retoma o cumprimento assim que cessar o impedimento.',
    ]),
    en: 'Neither party is liable for failure or delay caused by unforeseeable, unavoidable events beyond its control; the affected party notifies the other promptly and resumes performance when the event ends.',
  };
}

export function clCessaoPosicao(): ClauseItem {
  return {
    id: 'cessaoPosicao',
    heading: 'Cessão da posição contratual',
    text: 'Nenhuma das partes pode ceder a sua posição no presente contrato, no todo ou em parte, sem o consentimento prévio e escrito da outra.',
    en: 'Neither party may assign its position in this contract without the other’s prior written consent.',
  };
}

/** Independent provider (not an employment contract). */
export function clAutonomia(P: Papel): ClauseItem {
  return {
    id: 'autonomia',
    heading: 'Autonomia',
    text: `${P.O} executa o contrato com autonomia técnica, com os seus próprios meios e pessoal, pelos quais é exclusivamente responsável, incluindo as obrigações laborais, fiscais e de segurança social. O presente contrato não estabelece qualquer relação de trabalho subordinado entre as partes.`,
    en: 'The provider works with technical autonomy, with its own means and staff, for whom it alone is responsible (labour, tax, social security). This is not an employment contract.',
  };
}

/** Term and termination: notice period, termination for breach after a cure period. */
export function clCessacao(opts: { avisoDias?: unknown; curaDias?: unknown; extra?: string[]; quem?: string } = {}): ClauseItem {
  return {
    id: 'cessacao',
    heading: 'Cessação',
    text: numerar([
      opts.avisoDias != null && Number(opts.avisoDias) > 0
        ? `${opts.quem ?? 'Qualquer das partes'} pode denunciar o presente contrato, sem necessidade de invocar motivo, mediante comunicação escrita enviada à outra com a antecedência mínima de ${prazo(opts.avisoDias)}.`
        : '',
      `Qualquer das partes pode resolver o contrato, por comunicação escrita, se a outra não cumprir uma obrigação essencial e não sanar o incumprimento no prazo de ${prazo(opts.curaDias ?? '')} após ter sido interpelada por escrito para o efeito.`,
      ...(opts.extra ?? []),
      'A cessação do contrato não prejudica o pagamento dos serviços já prestados nem as obrigações que, pela sua natureza, devam subsistir, designadamente as de confidencialidade.',
    ]),
    en: 'Either party may terminate on written notice as stated, or for an uncured material breach after written notice. Services already provided remain payable and confidentiality survives.',
  };
}

// ---------------------------------------------------------------- Contract skeleton

export type Parte = { p: string; role: Papel; en: string };

/**
 * Title, parties ("Entre: … e …"), the opening formula, the numbered clauses
 * (with the standard closing clauses) and the signatures.
 */
export function contratoBlocks(
  ctx: TemplateContext,
  o: {
    title: string;
    subtitle?: string;
    parties: Parte[];
    clauses: ClauseItem[];
    signatures: SignatureColumn[];
    intro?: string;
    introEn?: string;
    lei?: string;
    notario?: string;
    exemplares?: number;
    annex?: Block[];
    beforeClauses?: Block[];
  },
): Block[] {
  const v = ctx.values;
  return [
    { type: 'title', text: o.title, subtitle: o.subtitle },
    ...partesBlocks(v, o.parties),
    {
      type: 'paragraph',
      id: 'celebracao',
      text: o.intro ?? 'É celebrado e reciprocamente aceite o presente contrato, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
      en: o.introEn ?? 'This contract is entered into on the following terms and, where silent, the applicable law:',
    },
    ...(o.beforeClauses ?? []),
    { type: 'numberedClauses', style: 'clausula', items: [...o.clauses, ...clausulasFinais(v, { lei: o.lei })] },
    ...fecho(ctx, o.signatures, { notario: o.notario, exemplares: o.exemplares }),
    ...(o.annex ?? []),
  ];
}

// ---------------------------------------------------------------- Policies (terms, privacy, house rules)

/** Version line: "Versão de 14 de Outubro de 2026". */
export const versao = (iso: unknown) => `Versão de ${dateLong(iso)}`;

/** Policy document header: title, subtitle and the identification of the business. */
export function politicaHeader(ctx: TemplateContext, title: string, iso: unknown, nomeAlt?: string): Block[] {
  return [{ type: 'title', text: title, subtitle: [str(nomeAlt) || profileDisplayName(ctx.profile), versao(iso)].filter(Boolean).join(' · ') }];
}

export { cite };

/** "titular do alvará n.º …" / "titular da licença n.º …" / "titular das licenças …" from a licence description. */
export function titularDe(licenca: unknown): string {
  const t = semPonto(licenca);
  if (!t) return '';
  const low = t.charAt(0).toLowerCase() + t.slice(1);
  const art = /^(alvarás|títulos|certificados)\b/i.test(t) ? 'dos' : /^(licenças|credenciais|autorizações)\b/i.test(t) ? 'das' : /^(alvará|título|certificado|registo|despacho)\b/i.test(t) ? 'do' : 'da';
  return `titular ${art} ${low}`;
}
