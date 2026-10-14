// Acordo de alimentos: maintenance agreed between relatives outside the
// child-custody agreement — to a former spouse, an adult child still studying,
// or an elderly parent. Amount, payment, extra expenses, update and duration.

import { formatMonthYear } from '@/lib/format';
import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, l, money } from './_shared';
import { assinatura, documentoFields, fecho, int, numerar, papel, partesBlocks, partyName, partyWarnings, testemunhasField, valorTexto } from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

const RELACAO: Record<string, { pt: string; en: string }> = {
  exConjuge: { pt: 'ex-cônjuge', en: 'former spouse' },
  conjuge: { pt: 'cônjuge, de quem vive separado de facto', en: 'separated spouse' },
  filhoMaior: { pt: 'filho maior que ainda não completou a sua formação', en: 'adult child still in education' },
  ascendente: { pt: 'ascendente (pai ou mãe)', en: 'parent' },
  outro: { pt: 'familiar', en: 'relative' },
};

export default defineTemplate({
  id: 'acordo-de-alimentos',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'obrigado', title: l('Quem paga os alimentos', 'Payer'), personRole: 'outro' },
    { id: 'beneficiario', title: l('Quem recebe os alimentos', 'Recipient'), personRole: 'outro' },
    { id: 'alimentos', title: l('Valor e pagamento', 'Amount and payment') },
    { id: 'duracao', title: l('Duração, actualização e opções', 'Duration, update and options') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('obrigado', ['pessoa']),
    ...partyFieldsWhen('beneficiario', []),
    {
      name: 'relacao',
      type: 'select',
      section: 'beneficiario',
      required: true,
      label: l('Quem recebe é, de quem paga, o/a', 'The recipient is the payer’s'),
      options: [
        { value: 'exConjuge', label: l('Ex-cônjuge', 'Former spouse') },
        { value: 'conjuge', label: l('Cônjuge separado de facto', 'Separated spouse') },
        { value: 'filhoMaior', label: l('Filho(a) maior a estudar', 'Adult child studying') },
        { value: 'ascendente', label: l('Pai ou mãe', 'Parent') },
        { value: 'outro', label: l('Outro familiar', 'Other relative') },
      ],
      default: 'filhoMaior',
      help: l('Para filhos menores use o Acordo de Regulação do Exercício do Poder Parental.', 'For minor children use the parental responsibilities agreement.'),
    },
    { name: 'curso', type: 'text', section: 'beneficiario', label: l('Curso e estabelecimento de ensino', 'Course and school'), placeholder: l('Ex.: Licenciatura em Direito, Universidade Eduardo Mondlane', 'E.g. Law degree, Eduardo Mondlane University'), showIf: (v) => v.relacao === 'filhoMaior' },
    { name: 'valor', type: 'money', section: 'alimentos', width: 'half', required: true, label: l('Valor mensal', 'Monthly amount') },
    { name: 'dia', type: 'number', section: 'alimentos', width: 'half', min: 1, max: 31, default: 5, label: l('Pagar até ao dia', 'Pay by day') },
    { name: 'formaPagamento', type: 'select', section: 'alimentos', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'conta', type: 'text', section: 'alimentos', width: 'half', label: l('Conta ou número de quem recebe', 'Recipient’s account or number') },
    { name: 'inicio', type: 'month', section: 'alimentos', width: 'half', label: l('Primeiro pagamento (mês)', 'First payment (month)') },
    { name: 'extras', type: 'text', section: 'alimentos', label: l('Despesas extraordinárias pagas por quem paga (opcional)', 'Extra costs paid by the payer (optional)'), placeholder: l('Ex.: metade das propinas e das despesas de saúde não cobertas', 'E.g. half of fees and uncovered health costs') },
    {
      name: 'duracao',
      type: 'select',
      section: 'duracao',
      label: l('Duração', 'Duration'),
      options: [
        { value: 'indeterminada', label: l('Enquanto se mantiver a necessidade', 'While the need lasts') },
        { value: 'curso', label: l('Até concluir o curso', 'Until the course is completed') },
        { value: 'data', label: l('Até uma data', 'Until a date') },
      ],
      default: 'curso',
    },
    { name: 'dataFim', type: 'date', section: 'duracao', width: 'half', label: l('Até', 'Until'), showIf: (v) => v.duracao === 'data' },
    { name: 'actualizacao', type: 'text', section: 'duracao', label: l('Actualização anual (opcional)', 'Yearly update (optional)'), placeholder: l('Ex.: em Janeiro de cada ano, na proporção do aumento do salário mínimo', 'E.g. each January, in line with the minimum wage') },
    { name: 'reconhecimento', type: 'toggle', section: 'duracao', default: true, label: l('Espaço para reconhecimento notarial das assinaturas', 'Space for notarial certification of signatures'), help: l('Com as assinaturas reconhecidas, o acordo tem mais força para ser cobrado em tribunal se não for cumprido.', 'Certified signatures make the agreement easier to enforce in court.') },
    testemunhasField('duracao'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'obrigado', 'quem paga', 'payer'), ...partyWarnings(v, 'beneficiario', 'quem recebe', 'recipient')];
    if (money(v.valor) == null) w.push({ level: 'error', field: 'valor', message: l('Indique o valor mensal.', 'Enter the monthly amount.') });
    w.push({ level: 'info', message: l(`Os alimentos medem-se pelas necessidades de quem recebe e pelas possibilidades de quem paga, e podem ser revistos (${cite('famAlimentos')}). Não é possível renunciar ao direito a alimentos. Se o acordo não for cumprido, pode pedir alimentos ao tribunal.`, 'Maintenance depends on needs and means and can be reviewed. The right cannot be waived. If unpaid, maintenance can be claimed in court.') });
    return w;
  },

  personName: (v) => partyName(v, 'beneficiario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const O = papel(v, 'obrigado', 'Primeiro Outorgante', 'Primeira Outorgante');
    const B = papel(v, 'beneficiario', 'Segundo Outorgante', 'Segunda Outorgante');
    const rel = RELACAO[v.relacao] ?? RELACAO.outro;
    const relTxt = v.relacao === 'filhoMaior' && B.f ? 'filha maior que ainda não completou a sua formação' : rel.pt;
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const conta = str(v.conta);
    const modo = forma === 'numerário' ? 'em numerário, contra recibo' : `por ${forma}${conta ? ` para ${forma === 'transferência bancária' ? 'a conta' : 'o número'} ${conta}` : ''}`;
    const dia = int(v.dia);
    const duracao =
      v.duracao === 'data'
        ? `até ${dateLong(v.dataFim)}`
        : v.duracao === 'curso'
          ? `até à conclusão ${str(v.curso) ? `do curso de ${semPonto(v.curso)}` : 'do curso que frequenta'}, desde que ${B.o} mantenha aproveitamento escolar e o comprove no início de cada ano lectivo`
          : `enquanto ${B.o} deles necessitar e ${O.o} tiver possibilidade de os prestar`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${O.O} obriga-se a prestar alimentos ${B.ao}, ${B.f ? 'sua' : 'seu'} ${relTxt}, que os aceita, nos termos do presente acordo.`,
        en: `The first party will pay maintenance to the second party, their ${rel.en}.`,
      },
      {
        id: 'valor',
        heading: 'Montante e pagamento',
        text: numerar([
          `Os alimentos consistem na prestação mensal de ${valorTexto(money(v.valor))}, paga até ao dia ${dia || '____'} de cada mês, ${modo}${str(v.inicio) ? `, com início em ${formatMonthYear(`${str(v.inicio)}-01`)}` : ''}.`,
          str(v.extras) ? `${O.O} suporta ainda ${semPonto(v.extras)}, mediante apresentação dos comprovativos.` : '',
          str(v.actualizacao) ? `A prestação é actualizada ${semPonto(v.actualizacao)}.` : '',
        ]),
        en: `Monthly payment of ${formatMoney(money(v.valor))} by day ${dia || '—'} by ${forma}.`,
      },
      {
        id: 'duracao',
        heading: 'Duração e revisão',
        text: numerar([
          `A obrigação de alimentos mantém-se ${duracao}.`,
          'Qualquer das partes pode pedir a alteração do montante quando se modificarem as necessidades de quem recebe ou as possibilidades de quem paga, por acordo escrito ou, na falta dele, junto do tribunal.',
        ]),
        en: 'The obligation lasts as stated; either party may ask for a change when needs or means change.',
      },
      {
        id: 'incumprimento',
        heading: 'Incumprimento',
        text: `A falta de pagamento de qualquer prestação no prazo devido constitui ${O.o} em mora, podendo ${B.o} exigir judicialmente as prestações vencidas e as que se forem vencendo, acrescidas de juros de mora à taxa legal.`,
        en: 'Late payment puts the payer in default; the recipient may claim arrears and future payments in court with legal interest.',
      },
    ];

    return [
      { type: 'title', text: 'Acordo de alimentos' },
      ...partesBlocks(v, [
        { p: 'obrigado', role: O, en: 'Payer' },
        { p: 'beneficiario', role: B, en: 'Recipient' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente acordo de alimentos, que se rege pelas cláusulas seguintes e pela lei da família:', en: 'this maintenance agreement is entered into on the following terms and the family law:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'obrigado', O, true), assinatura(ctx, 'beneficiario', B)], { notario: v.reconhecimento ? 'Reconhecimento presencial das assinaturas dos outorgantes.' : undefined })),
    ];
  },
});
