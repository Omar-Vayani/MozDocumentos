// Contrato de subarrendamento: the tenant lets all or part of the leased
// property to a sub-tenant, with the landlord's authorisation. The sublease
// ends with the head lease and its rent is capped by law.

import { addDays, addMonths, diffDays, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, FORMA_PAGAMENTO_OPTIONS, formatMoney, isF, l, money } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyName, partyWarnings, quantos, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

export default defineTemplate({
  id: 'contrato-subarrendamento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'sublocador', title: l('Inquilino que subarrenda', 'Tenant who sublets'), personRole: 'senhorio' },
    { id: 'subarrendatario', title: l('Subarrendatário', 'Sub-tenant'), personRole: 'inquilino' },
    { id: 'arrendamento', title: l('Arrendamento principal e autorização', 'Head lease and consent') },
    { id: 'objecto', title: l('Parte subarrendada e prazo', 'Sublet part and term') },
    { id: 'renda', title: l('Renda', 'Rent') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('sublocador', ['pessoa', 'empresa']),
    ...partyFieldsWhen('subarrendatario', []),
    { name: 'imovelMorada', type: 'text', section: 'arrendamento', required: true, label: l('Morada do imóvel', 'Property address') },
    { name: 'senhorioNome', type: 'text', section: 'arrendamento', required: true, label: l('Nome do senhorio (proprietário)', 'Landlord’s (owner’s) name') },
    { name: 'senhorioGenero', type: 'radio', section: 'arrendamento', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M' },
    { name: 'contratoData', type: 'date', section: 'arrendamento', width: 'half', label: l('Data do contrato de arrendamento', 'Date of the head lease') },
    { name: 'contratoFim', type: 'date', section: 'arrendamento', width: 'half', label: l('Fim do prazo do arrendamento', 'End of the head lease term') },
    { name: 'rendaPrincipal', type: 'money', section: 'arrendamento', width: 'half', label: l('Renda paga ao senhorio', 'Rent paid to the landlord') },
    {
      name: 'autorizacao',
      type: 'radio',
      section: 'arrendamento',
      required: true,
      label: l('Autorização do senhorio', 'Landlord’s consent'),
      options: [
        { value: 'assina', label: l('O senhorio assina este contrato a autorizar', 'The landlord signs this contract to consent') },
        { value: 'contrato', label: l('Já autorizado no contrato de arrendamento', 'Already allowed in the lease') },
        { value: 'escrito', label: l('Autorizado por escrito em separado', 'Consented in a separate letter') },
      ],
      default: 'assina',
    },
    { name: 'autorizacaoData', type: 'date', section: 'arrendamento', width: 'half', label: l('Data da autorização escrita', 'Date of the written consent'), showIf: (v) => v.autorizacao === 'escrito' },
    {
      name: 'parte',
      type: 'radio',
      section: 'objecto',
      label: l('O que é subarrendado', 'What is sublet'),
      options: [
        { value: 'total', label: l('Todo o imóvel', 'The whole property') },
        { value: 'parcial', label: l('Parte do imóvel', 'Part of the property') },
      ],
      default: 'parcial',
    },
    { name: 'parteDescricao', type: 'text', section: 'objecto', label: l('Parte subarrendada', 'Part sublet'), placeholder: l('Ex.: um quarto com casa de banho e uso comum da cozinha', 'E.g. a room with bathroom and shared kitchen'), showIf: (v) => v.parte === 'parcial' },
    {
      name: 'fim',
      type: 'select',
      section: 'objecto',
      width: 'half',
      label: l('Destino', 'Use'),
      options: [
        { value: 'habitacao', label: l('Habitação', 'Housing') },
        { value: 'comercio', label: l('Comércio ou escritório', 'Business or office') },
      ],
      default: 'habitacao',
    },
    { name: 'dataInicio', type: 'date', section: 'objecto', width: 'half', required: true, label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'duracaoMeses', type: 'number', section: 'objecto', width: 'half', min: 1, max: 120, default: 12, label: l('Duração (meses)', 'Term (months)') },
    { name: 'rendaMensal', type: 'money', section: 'renda', width: 'half', required: true, label: l('Renda do subarrendamento', 'Sublease rent') },
    { name: 'diaPagamento', type: 'number', section: 'renda', width: 'half', min: 1, max: 31, default: 5, label: l('Pagar até ao dia', 'Pay by day') },
    { name: 'formaPagamento', type: 'select', section: 'renda', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'conta', type: 'text', section: 'renda', width: 'half', label: l('Conta ou número', 'Account or number') },
    { name: 'caucaoValor', type: 'money', section: 'renda', width: 'half', label: l('Caução (opcional)', 'Deposit (optional)') },
    foroField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v, ctx) => {
    const meses = int(v.duracaoMeses) ?? 0;
    const inicio = str(v.dataInicio);
    const max = ctx.legal.value<{ acrescimoMax: number }>('famSublocacao').acrescimoMax;
    const principal = money(v.rendaPrincipal);
    return {
      renda: money(v.rendaMensal),
      meses,
      dataFim: inicio && meses > 0 ? addDays(addMonths(inicio, meses), -1) : '',
      limite: principal != null ? roundMoney(principal * (1 + max)) : null,
      max,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'sublocador', 'inquilino que subarrenda', 'tenant'), ...partyWarnings(v, 'subarrendatario', 'subarrendatário', 'sub-tenant')];
    if (c.renda == null) w.push({ level: 'error', field: 'rendaMensal', message: l('Indique a renda do subarrendamento.', 'Enter the sublease rent.') });
    if (v.autorizacao === 'contrato') w.push({ level: 'info', field: 'autorizacao', message: l('Confirme que o contrato de arrendamento autoriza expressamente o subarrendamento.', 'Check that the lease expressly allows subletting.') });
    if (c.renda != null && c.limite != null && v.parte === 'total' && c.renda > c.limite) {
      w.push({
        level: 'warning',
        field: 'rendaMensal',
        message: l(
          `A renda do subarrendamento total não deve exceder em mais de ${Math.round(c.max * 100)} por cento a renda paga ao senhorio (${formatMoney(c.limite)}) (${cite('famSublocacao')}; limite a confirmar).`,
          `The rent for subletting the whole property should not exceed the head rent by more than ${Math.round(c.max * 100)} per cent (to be confirmed).`,
        ),
      });
    }
    if (c.dataFim && str(v.contratoFim) && diffDays(v.contratoFim, c.dataFim) > 0) {
      w.push({ level: 'warning', field: 'duracaoMeses', message: l('O subarrendamento termina depois do arrendamento principal: caduca quando este terminar.', 'The sublease runs past the head lease and will end when it ends.') });
    }
    w.push({ level: 'info', message: l(`O subarrendamento deve ser comunicado por escrito ao senhorio (${cite('famSublocacao')}). Sem autorização, o senhorio pode pedir em tribunal o despejo do inquilino.`, 'The landlord must be notified in writing. Without consent, the landlord may seek eviction of the tenant in court.') });
    return w;
  },

  personName: (v) => partyName(v, 'subarrendatario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const SL = papel(v, 'sublocador', 'Sublocador', 'Sublocadora');
    const SA = papel(v, 'subarrendatario', 'Subarrendatário', 'Subarrendatária');
    const fSen = isF(v.senhorioGenero);
    const senhorio = `${fSen ? 'senhoria' : 'senhorio'} ${str(v.senhorioNome) || BLANK}`;
    const oSenhorio = fSen ? 'a senhoria' : 'o senhorio';
    const forma = str(v.formaPagamento) || 'transferência bancária';
    const conta = str(v.conta);
    const modo = forma === 'numerário' ? 'em numerário, contra recibo' : `por ${forma}${conta ? ` para ${forma === 'transferência bancária' ? 'a conta' : 'o número'} ${conta}` : ''}`;
    const caucao = money(v.caucaoValor);
    const objeto = v.parte === 'total' ? 'a totalidade do imóvel' : semPonto(v.parteDescricao) || 'parte do imóvel';

    const autorizacao =
      v.autorizacao === 'assina'
        ? `${fSen ? 'A senhoria' : 'O senhorio'} autoriza o presente subarrendamento, assinando-o para esse efeito.`
        : v.autorizacao === 'contrato'
          ? 'O subarrendamento é permitido pelo contrato de arrendamento.'
          : `O subarrendamento foi autorizado por escrito ${fSen ? 'pela senhoria' : 'pelo senhorio'} em ${dateLong(v.autorizacaoData)}.`;

    const clauses: ClauseItem[] = [
      {
        id: 'antecedentes',
        heading: 'Arrendamento principal',
        text: numerar([
          `${SL.O} é ${SL.f ? 'arrendatária' : 'arrendatário'} do imóvel sito em ${semPonto(v.imovelMorada) || BLANK}, de que é ${senhorio}, por contrato de arrendamento${str(v.contratoData) ? ` celebrado em ${dateLong(v.contratoData)}` : ''}${str(v.contratoFim) ? `, cujo prazo em curso termina em ${dateLong(v.contratoFim)}` : ''}.`,
          autorizacao,
        ]),
        en: 'The sublessor leases the property from the landlord named; the landlord has consented to this sublease.',
      },
      {
        id: 'objecto',
        heading: 'Objecto e fim',
        text: `${SL.O} subarrenda ${SA.ao}, que aceita, ${objeto}, para ${v.fim === 'comercio' ? 'o exercício da actividade comercial ou de escritório' : 'habitação'} ${SA.de}, não lhe podendo ser dado outro uso.`,
        en: `The sublessor sublets ${v.parte === 'total' ? 'the whole property' : 'the part described'} to the sub-tenant for ${v.fim === 'comercio' ? 'business' : 'housing'} use only.`,
      },
      {
        id: 'prazo',
        heading: 'Prazo',
        text: numerar([
          `O subarrendamento tem a duração de ${c.meses > 0 ? quantos(c.meses, 'mês', 'meses') : `${BLANK} meses`}, com início em ${dateLong(v.dataInicio)} e termo em ${dateLong(c.dataFim)}.`,
          `O subarrendamento caduca com a extinção, por qualquer causa, do contrato de arrendamento principal, sem direito a indemnização ${SA.ao}, devendo ${SL.o} avisá-${SA.f ? 'la' : 'lo'} logo que tenha conhecimento dessa extinção.`,
        ]),
        en: 'The sublease lasts for the term stated and ends automatically if the head lease ends, without compensation; the sublessor will warn the sub-tenant as soon as possible.',
      },
      {
        id: 'renda',
        heading: 'Renda',
        text: `A renda mensal é de ${valorTexto(c.renda)}, paga até ao dia ${int(v.diaPagamento) || '____'} do mês a que respeita, ${modo}, contra recibo.`,
        en: `Monthly rent ${c.renda != null ? formatMoney(c.renda) : '—'}.`,
      },
    ];
    if (caucao != null) {
      clauses.push({
        id: 'caucao',
        heading: 'Caução',
        text: `${SA.O} entrega nesta data a quantia de ${valorTexto(caucao)} a título de caução, restituída no fim do subarrendamento, deduzida dos montantes comprovadamente devidos.`,
        en: `Deposit of ${formatMoney(caucao)}, returned at the end less amounts due.`,
      });
    }
    clauses.push(
      {
        id: 'obrigacoes',
        heading: 'Obrigações',
        text: numerar([
          `${SA.O} obriga-se a cumprir, na parte que lhe diz respeito, as obrigações do contrato de arrendamento principal, cuja cópia declara ter recebido, e a não ceder ou subarrendar por sua vez o imóvel.`,
          `${SL.O} continua responsável perante ${oSenhorio} pelo pagamento da renda e pelo cumprimento do contrato de arrendamento.`,
        ]),
        en: 'The sub-tenant complies with the head lease and may not sublet further; the sublessor remains liable to the landlord.',
      },
      ...clausulasFinais(v).filter((x) => x.id !== 'alteracoes'),
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de subarrendamento' },
      ...partesBlocks(v, [
        { p: 'sublocador', role: SL, en: 'Sublessor' },
        { p: 'subarrendatario', role: SA, en: 'Sub-tenant' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de subarrendamento, que se rege pelas cláusulas seguintes:', en: 'this sublease is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'sublocador', SL, true), assinatura(ctx, 'subarrendatario', SA)], {
        exemplares: v.autorizacao === 'assina' ? 3 : 2,
        restante: v.autorizacao === 'assina' ? `${fSen ? 'à senhoria' : 'ao senhorio'}` : undefined,
        extraCols: v.autorizacao === 'assina' ? [{ role: `${fSen ? 'A Senhoria' : 'O Senhorio'} (autorização)`, name: str(v.senhorioNome) || undefined }] : [],
      })),
    ];
    return blocks;
  },
});
