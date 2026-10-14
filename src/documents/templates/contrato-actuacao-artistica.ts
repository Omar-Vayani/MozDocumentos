// Contrato de actuação artística (espectáculo): an event organiser hires an
// artist or band for a show — fee and advance, technical rider, logistics,
// promotion, recording rights, cancellation and copyright fees.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

export default defineTemplate({
  id: 'contrato-actuacao-artistica',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'promotor', title: l('Promotor (quem contrata)', 'Promoter'), personRole: 'outro' },
    { id: 'artista', title: l('Artista ou banda', 'Artist or band'), personRole: 'outro' },
    { id: 'evento', title: l('Evento e actuação', 'Event and performance') },
    { id: 'preco', title: l('Cachê e logística', 'Fee and logistics') },
    { id: 'clausulas', title: l('Cancelamento e outras cláusulas', 'Cancellation and other terms') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('promotor', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('artista'),
    { name: 'nomeArtistico', type: 'text', section: 'artista', width: 'half', label: l('Nome artístico / banda', 'Stage name / band'), required: true },
    { name: 'elementos', type: 'number', section: 'artista', width: 'half', min: 1, max: 200, default: 1, label: l('Número de elementos (músicos, bailarinos, técnicos)', 'Number of members (musicians, dancers, crew)') },

    { name: 'eventoNome', type: 'text', section: 'evento', required: true, label: l('Evento', 'Event'), placeholder: l('Ex.: Festa de fim de ano da empresa; Festival da Marrabenta', 'E.g. company year-end party') },
    { name: 'eventoLocal', type: 'text', section: 'evento', required: true, label: l('Local', 'Venue') },
    { name: 'eventoData', type: 'date', section: 'evento', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'horaActuacao', type: 'text', section: 'evento', width: 'half', label: l('Hora de início da actuação', 'Show start time'), placeholder: l('Ex.: 22h00', 'E.g. 22:00') },
    { name: 'duracaoMin', type: 'number', section: 'evento', width: 'half', min: 5, max: 600, default: 90, label: l('Duração da actuação (minutos)', 'Set length (minutes)') },
    { name: 'horaEnsaio', type: 'text', section: 'evento', width: 'half', label: l('Ensaio de som (hora)', 'Soundcheck time'), placeholder: l('Ex.: 16h00', 'E.g. 16:00') },
    { name: 'publicoEstimado', type: 'number', section: 'evento', width: 'half', min: 0, max: 1000000, label: l('Público estimado (opcional)', 'Expected audience (optional)') },
    { name: 'tipoEvento', type: 'select', section: 'evento', width: 'half', label: l('Tipo de evento', 'Kind of event'), options: [{ value: 'publico', label: l('Público, com bilheteira', 'Public, ticketed') }, { value: 'privado', label: l('Privado ou corporativo', 'Private or corporate') }], default: 'publico' },

    { name: 'cache', type: 'money', section: 'preco', width: 'half', required: true, label: l('Cachê', 'Fee') },
    ivaField('preco'),
    { name: 'adiantamentoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 50, label: l('Adiantamento na assinatura (%)', 'Advance on signing (%)') },
    { name: 'saldoQuando', type: 'select', section: 'preco', width: 'half', label: l('Saldo pago', 'Balance paid'), options: [{ value: 'antes', label: l('Até ao dia anterior ao evento', 'By the day before') }, { value: 'chegada', label: l('À chegada, antes de subir ao palco', 'On arrival, before going on stage') }, { value: 'depois', label: l('Até três dias depois do evento', 'Within three days after') }], default: 'chegada' },
    ...formaPagamentoFields('preco'),
    { name: 'rider', type: 'radio', section: 'preco', label: l('Som, luz e palco', 'Sound, light and stage'), options: [{ value: 'promotor', label: l('O promotor fornece, segundo o rider técnico do artista', 'Promoter provides per the artist’s rider') }, { value: 'artista', label: l('O artista traz (incluído no cachê)', 'Artist brings (included in fee)') }], default: 'promotor' },
    { name: 'transporte', type: 'toggle', section: 'preco', default: true, label: l('O promotor paga o transporte', 'Promoter pays transport') },
    { name: 'alojamento', type: 'toggle', section: 'preco', default: false, label: l('O promotor paga alojamento', 'Promoter pays accommodation') },
    { name: 'refeicoes', type: 'toggle', section: 'preco', default: true, label: l('O promotor fornece refeições e camarim', 'Promoter provides meals and dressing room') },
    { name: 'convites', type: 'number', section: 'preco', width: 'half', min: 0, max: 200, default: 4, label: l('Convites para o artista', 'Guest passes for the artist') },

    { name: 'gravacao', type: 'select', section: 'clausulas', width: 'half', label: l('Gravação e transmissão', 'Recording and broadcast'), options: [{ value: 'proibida', label: l('Proibida sem autorização', 'Not allowed without consent') }, { value: 'promocional', label: l('Excertos para promoção', 'Clips for promotion') }, { value: 'autorizada', label: l('Autorizada (transmissão incluída)', 'Allowed (broadcast included)') }], default: 'promocional' },
    { name: 'exclusividadeKm', type: 'number', section: 'clausulas', width: 'half', min: 0, max: 2000, label: l('Exclusividade: sem outros espectáculos num raio de (km)', 'Exclusivity radius (km)') },
    { name: 'exclusividadeDias', type: 'number', section: 'clausulas', width: 'half', min: 0, max: 120, label: l('… nos dias anteriores ao evento', '… in the days before'), showIf: (v) => Number(v.exclusividadeKm) > 0 },
    { name: 'cancelamentoDias', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 180, default: 15, label: l('Cancelamento pelo promotor: antecedência mínima (dias)', 'Promoter cancellation: minimum notice (days)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'promotor', 'promotor', 'promoter'), ...partyWarnings(v, 'artista', 'artista', 'artist')];
    if (money(v.cache) == null) w.push({ level: 'error', field: 'cache', message: l('Indique o cachê.', 'Enter the fee.') });
    if (!v.eventoData) w.push({ level: 'error', field: 'eventoData', message: l('Indique a data do evento.', 'Enter the event date.') });
    w.push({ level: 'info', message: l('Num espectáculo público, o promotor precisa da licença da autoridade local para o evento e deve pagar os direitos de autor das obras executadas à entidade de gestão colectiva. O artista passa recibo ou factura; pode haver retenção na fonte — confirme com o contabilista.', 'For a public show the promoter needs a local event licence and must pay copyright fees for the music performed to the collecting society. The artist issues a receipt or invoice; tax may be withheld.') });
    return w;
  },

  personName: (v) => str(v.nomeArtistico) || partyName(v, 'artista') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = papel(v, 'promotor', 'Promotor', 'Promotora', true);
    const A = papel(v, 'artista', 'Artista', 'Artista');
    const cache = money(v.cache);
    const pct = Number(v.adiantamentoPct);
    const ad = cache != null && Number.isFinite(pct) && pct > 0 && pct < 100 ? Math.round(cache * pct) / 100 : null;
    const saldo = cache != null && ad != null ? Math.round((cache - ad) * 100) / 100 : null;
    const quandoSaldo = v.saldoQuando === 'antes' ? 'até ao dia anterior ao evento' : v.saldoQuando === 'depois' ? 'até três dias após o evento' : 'à chegada ao local do evento, antes do início da actuação';
    const nome = str(v.nomeArtistico) || BLANK;
    const elementos = Number(v.elementos);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `Pelo presente contrato, ${A.o}, com o nome artístico **${nome}**, obriga-se a realizar uma actuação ao vivo no evento **${semPonto(v.eventoNome) || BLANK}**, organizado ${P.pelo}, em ${semPonto(v.eventoLocal) || BLANK}, no dia ${dateLong(v.eventoData)}${str(v.horaActuacao) ? `, com início às ${semPonto(v.horaActuacao)}` : ''}, com a duração de ${prazo(v.duracaoMin, 'minuto')}${Number.isFinite(elementos) && elementos > 1 ? `, com ${elementos} elementos` : ''}.`,
      en: `The artist (${v.nomeArtistico || '—'}) performs live at the event, venue and date stated, for the stated length.`,
    });
    cl.push({
      id: 'obrigacoesArtista',
      heading: `Obrigações ${A.de}`,
      text: `${A.O} obriga-se a:`,
      items: [
        `apresentar-se no local${str(v.horaEnsaio) ? ` às ${semPonto(v.horaEnsaio)} para o ensaio de som` : ' com antecedência suficiente para o ensaio de som'};`,
        `cumprir o horário e a duração da actuação, salvo atraso imputável ${P.ao};`,
        'respeitar as regras de segurança do local e as instruções da organização;',
        'não actuar sob o efeito de álcool ou estupefacientes, nem proferir em palco expressões ofensivas ou discriminatórias.',
      ],
      en: 'The artist arrives for soundcheck, keeps time, follows safety rules and does not perform intoxicated or make offensive statements on stage.',
    });
    const logistica = [
      v.rider === 'artista' ? '' : `fornecer o palco, o equipamento de som e de luz e os técnicos, conforme o rider técnico ${A.de}, que faz parte do contrato`,
      'garantir a segurança do artista, da equipa e do equipamento, desde a chegada até à saída do local',
      v.transporte ? `assegurar o transporte ${A.de} e da sua equipa entre a cidade de residência e o local do evento` : '',
      v.alojamento ? 'assegurar o alojamento da equipa, em quartos de categoria adequada' : '',
      v.refeicoes ? 'fornecer camarim reservado, água e refeições à equipa' : '',
      Number(v.convites) > 0 ? `entregar ${Number(v.convites)} convites ${A.ao}` : '',
      v.tipoEvento === 'publico' ? 'obter as licenças do evento e pagar os direitos de autor e conexos devidos pelas obras executadas' : '',
    ].filter(Boolean);
    cl.push({
      id: 'obrigacoesPromotor',
      heading: `Obrigações ${P.de}`,
      text: `${P.O} obriga-se a:`,
      items: logistica.map((s, i) => `${s}${i === logistica.length - 1 ? '.' : ';'}`),
      en: 'The promoter provides stage, sound and light (per the rider), security, transport, accommodation and meals as stated, guest passes, event licences and copyright fees.',
    });
    cl.push({
      id: 'cache',
      heading: 'Cachê',
      text: numerar([
        `Pela actuação, ${P.o} paga ${A.ao} o cachê de ${valorTexto(cache)}${ivaTexto(v.iva)}${ad != null ? `, sendo ${valorTexto(ad)} pago na assinatura do contrato, a título de adiantamento, e o saldo de ${valorTexto(saldo)} pago ${quandoSaldo}` : `, pago ${quandoSaldo}`}.`,
        `Os pagamentos são feitos ${modoPagamento(v, A)}, contra recibo ou factura.`,
        `${A.O} pode recusar-se a actuar enquanto o valor vencido não for pago, sem perder o direito ao cachê.`,
      ]),
      en: `Fee ${cache != null ? formatMoney(cache) : '—'}${ad != null ? ', advance on signing and the balance as stated' : ''}. The artist may refuse to perform until amounts due are paid, keeping the right to the fee.`,
    });
    cl.push({
      id: 'imagem',
      heading: 'Promoção, imagem e gravações',
      text: numerar([
        `${A.O} autoriza ${P.o} a utilizar o seu nome artístico, fotografias e materiais promocionais fornecidos por ${A.f ? 'ela' : 'ele'} para divulgar o evento, até à sua realização.`,
        v.gravacao === 'autorizada'
          ? `A actuação pode ser gravada e transmitida pelos meios ${P.de} e dos seus parceiros de comunicação, ficando essa utilização incluída no cachê.`
          : v.gravacao === 'promocional'
            ? `${P.O} pode gravar e divulgar excertos da actuação, com a duração máxima de três minutos cada, apenas para promoção do evento; qualquer outra gravação ou transmissão depende de autorização escrita ${A.de}.`
            : `É proibida a gravação ou transmissão da actuação, salvo autorização escrita ${A.de}.`,
      ]),
      en: 'The promoter may use the artist’s name and press materials to promote the event. Recording and broadcast as stated.',
    });
    const km = Number(v.exclusividadeKm);
    if (Number.isFinite(km) && km > 0) {
      cl.push({
        id: 'exclusividade',
        heading: 'Exclusividade',
        text: `${A.O} não realiza outros espectáculos públicos num raio de ${km} km do local do evento nos ${prazo(v.exclusividadeDias)} que o antecedem.`,
        en: 'No other public shows within the stated radius in the days before the event.',
      });
    }
    cl.push({
      id: 'cancelamento',
      heading: 'Cancelamento',
      text: numerar([
        `Se ${P.o} cancelar o evento com antecedência igual ou superior a ${prazo(v.cancelamentoDias)}, ${A.o} faz seu o adiantamento recebido; se o cancelamento ocorrer com antecedência menor, é devido o cachê por inteiro.`,
        `Se ${A.o} não actuar por facto que lhe seja imputável, restitui em dobro o adiantamento recebido e reembolsa as despesas já feitas ${P.pelo} com o transporte e o alojamento da equipa.`,
        `Se o evento não se realizar por força maior, nomeadamente intempérie que ponha em risco a segurança, luto nacional ou proibição das autoridades, as partes procuram acordar nova data no prazo de seis meses; não havendo acordo, ${A.o} restitui o adiantamento, deduzido das despesas que comprovadamente tenha feito.`,
      ]),
      en: 'Promoter cancellation with enough notice: the artist keeps the advance; later: full fee. Artist no-show: double the advance back plus travel costs. Force majeure: a new date within six months, or the advance is returned less proven expenses.',
    });
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de actuação artística',
      subtitle: [nome !== BLANK ? nome : '', v.eventoData ? dateLong(v.eventoData) : ''].filter(Boolean).join(' · ') || undefined,
      parties: [
        { p: 'promotor', role: P, en: 'Promoter' },
        { p: 'artista', role: A, en: 'Artist' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'promotor', P, true), assinatura(ctx, 'artista', A)],
    });
  },
});
