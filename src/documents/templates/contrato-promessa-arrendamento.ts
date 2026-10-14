// Contrato-promessa de arrendamento: the parties promise to sign a lease later
// (e.g. when the property is finished, vacated or repaired), fixing the rent
// and term in advance; a deposit (sinal) may be paid.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money, splitLines } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyName, partyWarnings, quantos, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, itensLista, partyFieldsWhen, semPonto } from './_familia';

export default defineTemplate({
  id: 'contrato-promessa-arrendamento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'senhorio', title: l('Promitente-senhorio', 'Prospective landlord'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Promitente-inquilino', 'Prospective tenant'), personRole: 'inquilino' },
    { id: 'imovel', title: l('Imóvel e condições', 'Property and conditions') },
    { id: 'arrendamento', title: l('Arrendamento prometido', 'Promised lease') },
    { id: 'sinal', title: l('Sinal', 'Deposit (sinal)') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('senhorio', ['pessoa', 'empresa']),
    ...partyFieldsWhen('inquilino', []),
    { name: 'imovelDescricao', type: 'text', section: 'imovel', required: true, label: l('Imóvel', 'Property'), placeholder: l('Ex.: loja n.º 3 do rés-do-chão, com 80 m²', 'E.g. ground-floor shop no. 3, 80 m²') },
    { name: 'imovelMorada', type: 'text', section: 'imovel', required: true, label: l('Morada', 'Address') },
    {
      name: 'condicoes',
      type: 'textarea',
      section: 'imovel',
      rows: 3,
      label: l('O que o senhorio deve fazer antes (opcional)', 'What the landlord must do first (optional)'),
      help: l('Uma condição por linha. Ex.: concluir a pintura; instalar contador de energia próprio.', 'One per line. E.g. finish painting; install a separate meter.'),
    },
    { name: 'dataContrato', type: 'date', section: 'arrendamento', width: 'half', required: true, label: l('Assinar o contrato até', 'Sign the lease by') },
    {
      name: 'fim',
      type: 'select',
      section: 'arrendamento',
      width: 'half',
      label: l('Destino', 'Use'),
      options: [
        { value: 'habitacao', label: l('Habitação', 'Housing') },
        { value: 'comercio', label: l('Comércio', 'Commerce') },
        { value: 'escritorio', label: l('Escritório ou serviços', 'Office or services') },
      ],
      default: 'habitacao',
    },
    { name: 'actividade', type: 'text', section: 'arrendamento', label: l('Actividade (opcional)', 'Activity (optional)'), showIf: (v) => v.fim !== 'habitacao' },
    { name: 'rendaMensal', type: 'money', section: 'arrendamento', width: 'half', required: true, label: l('Renda mensal', 'Monthly rent') },
    { name: 'duracaoMeses', type: 'number', section: 'arrendamento', width: 'half', min: 1, max: 360, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'caucaoMeses', type: 'number', section: 'arrendamento', width: 'half', min: 0, max: 12, default: 1, label: l('Caução (n.º de rendas)', 'Deposit (months of rent)') },
    { name: 'sinalValor', type: 'money', section: 'sinal', width: 'half', label: l('Sinal entregue hoje (opcional)', 'Deposit paid today (optional)') },
    {
      name: 'sinalImputacao',
      type: 'select',
      section: 'sinal',
      width: 'half',
      label: l('O sinal conta como', 'The deposit counts as'),
      options: [
        { value: 'rendas', label: l('Primeiras rendas', 'First rents') },
        { value: 'caucao', label: l('Caução', 'Security deposit') },
      ],
      default: 'rendas',
      showIf: (v) => money(v.sinalValor) != null,
    },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'senhorio', 'promitente-senhorio', 'prospective landlord'), ...partyWarnings(v, 'inquilino', 'promitente-inquilino', 'prospective tenant')];
    if (money(v.rendaMensal) == null) w.push({ level: 'error', field: 'rendaMensal', message: l('Indique a renda prometida.', 'Enter the promised rent.') });
    if (!v.dataContrato) w.push({ level: 'warning', field: 'dataContrato', message: l('Indique a data-limite para assinar o contrato de arrendamento.', 'Enter the deadline to sign the lease.') });
    if (money(v.sinalValor) != null) {
      w.push({ level: 'info', field: 'sinalValor', message: l(`Com sinal: quem o entregou e não cumprir perde-o; quem o recebeu e não cumprir devolve-o em dobro (${cite('contratoPromessaSinal')}).`, 'With a deposit: if the payer defaults it is lost; if the recipient defaults it is returned double.') });
    }
    return w;
  },

  personName: (v) => partyName(v, 'inquilino') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const S = papel(v, 'senhorio', 'Promitente-senhorio', 'Promitente-senhoria');
    const I = papel(v, 'inquilino', 'Promitente-inquilino', 'Promitente-inquilina');
    const renda = money(v.rendaMensal);
    const sinal = money(v.sinalValor);
    const meses = int(v.duracaoMeses);
    const caucaoMeses = int(v.caucaoMeses) ?? 0;
    const condicoes = splitLines(v.condicoes);
    const fimTxt = v.fim === 'comercio' ? 'comércio' : v.fim === 'escritorio' ? 'escritório ou prestação de serviços' : 'habitação';
    const actividade = semPonto(v.actividade);

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${S.O} promete dar de arrendamento ${I.ao}, que promete tomá-lo, ${semPonto(v.imovelDescricao) || 'o imóvel'}, sito em ${semPonto(v.imovelMorada) || BLANK}, destinado a ${fimTxt}${actividade ? `, designadamente ${actividade}` : ''}.`,
        en: 'The prospective landlord promises to let, and the prospective tenant to take, the property described for the stated use.',
      },
      {
        id: 'condicoes',
        heading: 'Condições do arrendamento prometido',
        text: numerar([
          `O arrendamento é celebrado pelo prazo de ${meses ? quantos(meses, 'mês', 'meses') : `${BLANK} meses`}, renovável, com a renda mensal de ${valorTexto(renda)}${caucaoMeses > 0 ? ` e uma caução equivalente a ${caucaoMeses === 1 ? 'uma renda' : quantos(caucaoMeses, 'renda', 'rendas', true)}` : ''}.`,
          'Em tudo o mais, o contrato de arrendamento seguirá as cláusulas habituais, a acordar de boa-fé entre as partes.',
        ]),
        en: `Lease term ${meses || '—'} months, renewable, rent ${renda != null ? formatMoney(renda) : '—'} a month${caucaoMeses ? `, deposit of ${caucaoMeses} month(s)` : ''}.`,
      },
    ];
    if (condicoes.length) {
      clauses.push({
        id: 'obrigacoesPrevias',
        heading: 'Obrigações prévias',
        text: `Até à data da celebração do contrato de arrendamento, ${S.o} obriga-se a:`,
        items: itensLista(condicoes),
        en: 'Before the lease is signed the prospective landlord will do the listed works or tasks.',
      });
    }
    clauses.push({
      id: 'celebracaoDefinitivo',
      heading: 'Celebração do contrato de arrendamento',
      text: `O contrato de arrendamento é assinado até ${dateLong(v.dataContrato)}, em data e local a combinar, sendo o imóvel entregue ${I.ao} nessa data${condicoes.length ? ', com as obrigações da cláusula anterior cumpridas' : ''}.`,
      en: `The lease is signed by ${v.dataContrato || '—'} and the property handed over then.`,
    });
    if (sinal != null) {
      clauses.push({
        id: 'sinal',
        heading: 'Sinal',
        text: numerar([
          `Na data da assinatura do presente contrato, ${I.o} entrega ${S.ao}, que dá quitação, a quantia de ${valorTexto(sinal)}, a título de sinal, que será imputada ${v.sinalImputacao === 'caucao' ? 'na caução' : 'no pagamento das primeiras rendas'} do contrato de arrendamento.`,
          `Se ${I.o} não cumprir a promessa, perde o sinal entregue; se o incumprimento for ${S.de}, ${S.f ? 'esta' : 'este'} restitui o sinal em dobro, nos termos da lei (${cite('contratoPromessaSinal')}).`,
        ]),
        en: `A deposit of ${formatMoney(sinal)} is paid today and counted ${v.sinalImputacao === 'caucao' ? 'as the security deposit' : 'towards the first rents'}. If the tenant defaults it is lost; if the landlord defaults it is returned double.`,
      });
    } else {
      clauses.push({
        id: 'incumprimento',
        heading: 'Incumprimento',
        text: 'O incumprimento da promessa por qualquer das partes obriga-a a indemnizar a outra pelos prejuízos causados, nos termos gerais de direito.',
        en: 'A party that fails to perform must compensate the other for the loss caused.',
      });
    }
    clauses.push(...clausulasFinais(v));

    return [
      { type: 'title', text: 'Contrato-promessa de arrendamento' },
      ...partesBlocks(v, [
        { p: 'senhorio', role: S, en: 'Prospective landlord' },
        { p: 'inquilino', role: I, en: 'Prospective tenant' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato-promessa de arrendamento, que se rege pelas cláusulas seguintes:', en: 'this promise to lease is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'senhorio', S, true), assinatura(ctx, 'inquilino', I)])),
    ];
  },
});
