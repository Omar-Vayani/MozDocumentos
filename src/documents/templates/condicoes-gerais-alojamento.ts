// Condições gerais de reserva e alojamento: the standard terms of a hotel,
// lodge or guest house (booking and deposit, check-in and check-out, children,
// cancellation and no-show, damage, valuables, guest data). Handed over or
// published before the booking; consumer rights are not excluded.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { arbitragemField, foroField, lines, semPonto, str } from './_contratos';
import { contactos, entidadeTexto, politicaHeader, prazo } from './_digital';

type Escalao = { ate: string; retencao: string };
const escaloes = (v: Values): Escalao[] =>
  lines(v.cancelamento)
    .map((r) => ({ ate: str(r.ate), retencao: str(r.retencao) }))
    .filter((r) => r.ate || r.retencao);

export default defineTemplate({
  id: 'condicoes-gerais-alojamento',
  family: 'mapa',
  sections: [
    { id: 'estabelecimento', title: l('Estabelecimento', 'Establishment') },
    { id: 'reservas', title: l('Reservas e pagamento', 'Bookings and payment') },
    { id: 'cancelamento', title: l('Cancelamento', 'Cancellation') },
    { id: 'estadia', title: l('Estadia', 'Stay') },
    { id: 'outras', title: l('Outras cláusulas', 'Other terms') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'estabelecimento', width: 'half', required: true, label: l('Nome do estabelecimento', 'Establishment name'), default: (c) => c.profile?.nomeComercial || c.profile?.firma || '' },
    { name: 'classificacao', type: 'text', section: 'estabelecimento', width: 'half', label: l('Tipo e classificação', 'Type and rating'), placeholder: l('Ex.: lodge de 3 estrelas; casa de hóspedes', 'E.g. 3-star lodge; guest house') },
    { name: 'licenca', type: 'text', section: 'estabelecimento', label: l('Licença', 'Licence'), default: (c) => c.profile?.licenca || '' },
    { name: 'versaoData', type: 'date', section: 'estabelecimento', width: 'half', label: l('Data desta versão', 'Version date'), default: (c) => c.today },

    { name: 'depositoPct', type: 'number', section: 'reservas', width: 'half', min: 0, max: 100, default: 50, label: l('Depósito para garantir a reserva (%)', 'Deposit to guarantee the booking (%)') },
    { name: 'depositoDias', type: 'number', section: 'reservas', width: 'half', min: 1, max: 30, default: 3, label: l('Prazo para pagar o depósito (dias)', 'Days to pay the deposit') },
    { name: 'saldo', type: 'select', section: 'reservas', width: 'half', label: l('Saldo pago', 'Balance paid'), options: [{ value: 'checkin', label: l('No check-in', 'At check-in') }, { value: 'checkout', label: l('No check-out', 'At check-out') }, { value: 'antes', label: l('Antes da chegada', 'Before arrival') }], default: 'checkin' },
    { name: 'meios', type: 'text', section: 'reservas', label: l('Meios de pagamento aceites', 'Payment methods'), default: 'numerário, cartão bancário, M-Pesa, e-Mola e transferência bancária' },

    {
      name: 'cancelamento',
      type: 'lines',
      section: 'cancelamento',
      label: l('Escalões de cancelamento', 'Cancellation tiers'),
      addLabel: l('Adicionar escalão', 'Add tier'),
      columns: [
        { name: 'ate', type: 'text', label: l('Quando cancela', 'When cancelled') },
        { name: 'retencao', type: 'text', label: l('O que é cobrado', 'Charge') },
      ],
      default: [
        { ate: 'Até um mês antes da chegada', retencao: 'Sem custos; o depósito é devolvido' },
        { ate: 'Entre um mês e uma semana antes', retencao: 'Metade do depósito' },
        { ate: 'Na última semana antes da chegada, ou não comparência', retencao: 'Todo o depósito' },
      ],
    },
    { name: 'saidaAntecipada', type: 'toggle', section: 'cancelamento', default: true, label: l('Saída antecipada: cobrar a noite seguinte', 'Early departure: charge the next night') },

    { name: 'checkin', type: 'text', section: 'estadia', width: 'half', label: l('Check-in a partir de', 'Check-in from'), default: '14h00' },
    { name: 'checkout', type: 'text', section: 'estadia', width: 'half', label: l('Check-out até', 'Check-out by'), default: '10h00' },
    { name: 'criancasGratis', type: 'number', section: 'estadia', width: 'half', min: 0, max: 17, default: 5, label: l('Crianças grátis até à idade de (anos)', 'Children free up to age') },
    { name: 'criancasReducao', type: 'text', section: 'estadia', width: 'half', label: l('Crianças mais velhas', 'Older children'), default: 'metade do preço em cama extra, até aos doze anos' },
    { name: 'animais', type: 'toggle', section: 'estadia', default: false, label: l('Aceita animais de estimação', 'Pets allowed') },
    { name: 'fumar', type: 'toggle', section: 'estadia', default: false, label: l('Permite fumar nos quartos', 'Smoking in rooms allowed') },
    { name: 'taxaLimpeza', type: 'text', section: 'estadia', label: l('Penalização por fumar ou limpeza extraordinária (opcional)', 'Smoking or special cleaning fee (optional)') },
    { name: 'cofre', type: 'toggle', section: 'estadia', default: true, label: l('Há cofre nos quartos ou na recepção', 'Safe available') },

    { name: 'contactoReclamacoes', type: 'text', section: 'outras', label: l('Contacto para reclamações', 'Complaints contact'), default: (c) => [c.profile?.email, c.profile?.telefones].filter(Boolean).join(' · ') },
    foroField('outras'),
    arbitragemField('outras'),
    { name: 'linhaAceitacao', type: 'toggle', section: 'outras', default: false, label: l('Incluir linha para o hóspede assinar', 'Include a guest signature line') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.licenca)) w.push({ level: 'warning', field: 'licenca', message: l(`Indique a licença: o alojamento turístico só funciona licenciado e deve afixar a licença, a classificação e os preços (${cite('turLicencaAlojamento')}).`, 'State the licence: tourist accommodation must be licensed and display licence, rating and prices.') });
    w.push({ level: 'info', message: l(`Entregue ou publique estas condições antes da reserva (no site, na confirmação ou na recepção). Cláusulas não comunicadas podem considerar-se não escritas (${cite('clausulasNaoEscritas')}).`, 'Give or publish these terms before booking. Terms not communicated may be treated as not written.') });
    return w;
  },

  personName: () => 'condicoes-gerais-alojamento',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const nome = str(v.nome) || BLANK;
    const esc = escaloes(v);
    const dep = Number(v.depositoPct);
    const saldo = v.saldo === 'checkout' ? 'no check-out' : v.saldo === 'antes' ? 'antes da chegada' : 'no check-in';
    const gratis = Number(v.criancasGratis);

    const items: ClauseItem[] = [];
    items.push({
      id: 'ca-ambito',
      heading: 'Âmbito',
      text: `Estas condições aplicam-se às reservas e estadias no **${nome}**${str(v.classificacao) ? `, ${semPonto(v.classificacao)}` : ''}, explorado por ${entidadeTexto(p)}${str(v.licenca) ? `, ${semPonto(v.licenca).charAt(0).toLowerCase() + semPonto(v.licenca).slice(1)}` : ''}. As condições particulares indicadas na confirmação de reserva prevalecem sobre estas.`,
      en: 'These terms apply to bookings and stays at the establishment; specific terms in the booking confirmation prevail.',
    });
    items.push({
      id: 'ca-reservas',
      heading: 'Reservas e depósito',
      text: `A reserva fica garantida com o pagamento de um depósito de ${Number.isFinite(dep) && dep > 0 ? `${dep}%` : BLANK} do valor total da estadia, no prazo de ${prazo(v.depositoDias)} após o pedido, e com o envio da confirmação de reserva. Não sendo pago o depósito nesse prazo, a reserva pode ser cancelada sem aviso. O saldo é pago ${saldo}, por ${semPonto(v.meios) || BLANK}.`,
      en: 'A booking is guaranteed by the stated deposit and our confirmation; unpaid deposits may lead to cancellation. The balance is paid as stated.',
    });
    items.push({
      id: 'ca-precos',
      heading: 'Preços',
      text: 'Os preços são indicados em meticais, por quarto e por noite, de acordo com o regime escolhido, e incluem o IVA e as taxas legais, salvo indicação em contrário. Os preços confirmados na reserva não são alterados, salvo alteração da estadia pedida pelo hóspede.',
      en: 'Prices in meticais per room per night for the chosen board, including VAT and taxes unless stated; confirmed prices do not change unless the guest changes the stay.',
    });
    items.push({
      id: 'ca-cancelamento',
      heading: 'Cancelamento e não comparência',
      text: `O cancelamento é comunicado por escrito (e-mail ou mensagem) e produz efeitos na data da sua recepção. Aplicam-se as seguintes condições:`,
      items: esc.length ? esc.map((e, i) => `${semPonto(e.ate) || BLANK}: ${semPonto(e.retencao).charAt(0).toLowerCase() + semPonto(e.retencao).slice(1) || BLANK}${i === esc.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: 'Cancellations in writing, effective on receipt; charges per the tiers listed.',
    });
    if (v.saidaAntecipada) {
      items.push({
        id: 'ca-saida',
        heading: 'Saída antecipada',
        text: 'Se o hóspede sair antes da data prevista, é cobrada a noite seguinte à saída; as restantes noites pagas são reembolsadas ou creditadas para uma estadia futura.',
        en: 'Early departure: the next night is charged; the rest is refunded or credited.',
      });
    }
    items.push({
      id: 'ca-checkin',
      heading: 'Entrada e saída',
      text: `Os quartos estão disponíveis a partir das ${semPonto(v.checkin) || BLANK} do dia de chegada e devem ser libertados até às ${semPonto(v.checkout) || BLANK} do dia de saída. A entrada antecipada e a saída tardia dependem de disponibilidade e podem ter custo. No check-in, cada hóspede adulto apresenta documento de identificação válido e preenche a ficha de registo.`,
      en: 'Check-in and check-out times as stated; early or late depend on availability and may be charged. Adults show valid ID and fill in the registration form.',
    });
    items.push({
      id: 'ca-criancas',
      heading: 'Crianças',
      text: `${Number.isFinite(gratis) && gratis > 0 ? `As crianças até ${gratis} anos ficam gratuitamente no quarto dos pais, sem cama extra. ` : ''}${str(v.criancasReducao) ? `Para crianças mais velhas aplica-se ${semPonto(v.criancasReducao)}. ` : ''}Os menores estão sempre sob a responsabilidade dos adultos que os acompanham, em especial na piscina, na praia e nas actividades.`,
      en: 'Children’s rates as stated; minors are always the responsibility of accompanying adults.',
    });
    items.push({
      id: 'ca-regras',
      heading: 'Regras da casa',
      text: `Os hóspedes cumprem o regulamento interno afixado no estabelecimento. ${v.fumar ? 'É permitido fumar apenas nos quartos identificados para o efeito.' : `Não é permitido fumar nos quartos nem nos espaços interiores${str(v.taxaLimpeza) ? `, sob pena de ${semPonto(v.taxaLimpeza)}` : ''}.`} ${v.animais ? 'São aceites animais de estimação, mediante aviso prévio e nas condições indicadas na reserva.' : 'Não são aceites animais, salvo cães de assistência.'}`,
      en: `Guests follow the posted house rules. ${v.fumar ? 'Smoking only in designated rooms.' : 'No smoking indoors.'} ${v.animais ? 'Pets accepted on notice.' : 'No pets except assistance dogs.'}`,
    });
    items.push({
      id: 'ca-danos',
      heading: 'Danos e objectos de valor',
      text: `O hóspede responde pelos danos que causar no quarto, no mobiliário e nas instalações, para além do desgaste normal. ${v.cofre ? 'Os objectos de valor e o dinheiro devem ser guardados no cofre; o estabelecimento' : 'O estabelecimento'} não responde pelo desaparecimento de valores não confiados à recepção contra recibo, salvo se o dano resultar de culpa sua ou do seu pessoal.`,
      en: 'Guests are liable for damage beyond normal wear. Valuables should be kept in the safe; the establishment is not liable for valuables not deposited against receipt, unless at fault.',
    });
    items.push({
      id: 'ca-alteracoes',
      heading: 'Impossibilidade de alojar',
      text: 'Se, por razão imprevista, não for possível disponibilizar o quarto reservado, o estabelecimento oferece um quarto de categoria igual ou superior, ou alojamento equivalente nas proximidades, suportando a diferença de preço e o transporte, ou devolve de imediato as quantias pagas, à escolha do hóspede.',
      en: 'If the booked room is unavailable, we offer an equal or better room or equivalent nearby accommodation at our cost, or refund at once, as the guest chooses.',
    });
    items.push({
      id: 'ca-dados',
      heading: 'Dados dos hóspedes',
      text: `Os dados de identificação são registados para cumprir as obrigações legais dos estabelecimentos de alojamento, incluindo a comunicação de hóspedes estrangeiros aos serviços de migração, e para a gestão da estadia. Não são usados para outros fins sem o consentimento do hóspede.`,
      en: 'Guest ID data are recorded to meet legal duties of accommodation providers (including reporting foreign guests to migration) and to manage the stay; no other use without consent.',
    });
    const contacto = str(v.contactoReclamacoes) || contactos(p) || BLANK;
    items.push({
      id: 'ca-reclamacoes',
      heading: 'Reclamações',
      text: `As reclamações podem ser apresentadas na recepção, através de ${contacto}, ou no livro de reclamações, que está à disposição dos hóspedes.`,
      en: 'Complaints at reception, by the contacts given, or in the complaints book.',
    });
    const foro = semPonto(v.foro) || 'tribunal judicial competente';
    items.push({
      id: 'ca-lei',
      heading: 'Lei aplicável',
      text: `Estas condições regem-se pela lei moçambicana e não afastam os direitos dos consumidores. Os litígios que não sejam resolvidos por acordo são decididos ${v.arbitragem ? 'por arbitragem, com sede em Maputo, nos termos da legislação moçambicana sobre arbitragem, conciliação e mediação' : `pelo ${foro}`}.`,
      en: 'Mozambican law applies; consumer rights are not excluded. Disputes go to the court or arbitration stated.',
    });

    const blocks: Block[] = [
      ...politicaHeader(ctx, 'Condições gerais de reserva e alojamento', v.versaoData, nome !== BLANK ? nome : undefined),
      { type: 'paragraph', id: 'intro', text: `Leia estas condições antes de fazer a sua reserva no ${nome}. Ao confirmar a reserva, o hóspede aceita-as.`, en: 'Please read these terms before booking; confirming a booking means accepting them.' },
      { type: 'numberedClauses', style: 'numeric', items },
    ];
    if (v.linhaAceitacao) {
      blocks.push(
        { type: 'paragraph', id: 'aceitacao', text: 'O hóspede declara ter recebido e lido as presentes condições, que aceita.', en: 'The guest has received and read these terms and accepts them.', keepWithNext: true },
        { type: 'signatures', placeDate: `${ctx.place}, ___ de ______________ de ______`, columns: [{ role: 'O Hóspede', detail: 'Nome: ______________________________' }] },
      );
    }
    return blocks;
  },
});
