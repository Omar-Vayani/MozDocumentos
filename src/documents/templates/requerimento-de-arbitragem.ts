import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, isF, l, lawyerFields, lawyerSignature, localField, money } from './_shared';
import { artigos, partyDesc, partyFields } from './_advocacia';
import { closing, g3, linhas, prova, provaFields, sem, str } from './_processo-civil';

const institucional = (v: Values) => v.tipoArbitragem === 'institucional';

export default defineTemplate({
  id: 'requerimento-de-arbitragem',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'destino', title: l('Arbitragem', 'Arbitration') },
    { id: 'demandante', title: l('Demandante', 'Claimant'), personRole: 'cliente' },
    { id: 'demandado', title: l('Demandado', 'Respondent'), personRole: 'outro' },
    { id: 'convencao', title: l('Convenção de arbitragem', 'Arbitration agreement') },
    { id: 'litigio', title: l('Litígio e pedido', 'Dispute and claim') },
    { id: 'arbitro', title: l('Árbitro', 'Arbitrator') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    {
      name: 'tipoArbitragem',
      type: 'radio',
      section: 'destino',
      label: l('Apresentar', 'File with'),
      default: 'adhoc',
      options: [
        { value: 'adhoc', label: l('À outra parte (arbitragem ad hoc)', 'The other party (ad hoc)') },
        { value: 'institucional', label: l('Ao centro de arbitragem', 'The arbitration centre') },
      ],
    },
    { name: 'centro', type: 'text', section: 'destino', label: l('Centro de arbitragem', 'Arbitration centre'), default: 'Centro de Arbitragem, Conciliação e Mediação (CACM)', showIf: institucional },
    { name: 'presidenteGenero', type: 'radio', section: 'destino', width: 'half', label: l('Presidente do centro', 'Centre president'), options: GENERO_OPTIONS, default: 'M', showIf: institucional },
    ...partyFields('demandante', 'demandante', { defaultTipo: 'empresa' }),
    ...partyFields('demandado', 'demandado', { defaultTipo: 'empresa', light: true }),
    { name: 'convencao', type: 'text', section: 'convencao', required: true, label: l('Convenção de arbitragem', 'Arbitration agreement'), placeholder: l('Ex.: a cláusula 18.ª do contrato de empreitada celebrado em 3 de Março de 2025', 'E.g. clause 18 of the works contract of 3 March 2025') },
    { name: 'convencaoTexto', type: 'textarea', section: 'convencao', rows: 3, label: l('Texto da cláusula (opcional)', 'Text of the clause (optional)') },
    { name: 'factos', type: 'textarea', section: 'litigio', rows: 8, required: true, label: l('Factos (um artigo por linha)', 'Facts (one article per line)') },
    { name: 'pedidos', type: 'textarea', section: 'litigio', rows: 3, required: true, label: l('Pedidos (um por linha)', 'Claims (one per line)'), placeholder: l('A condenação da Demandada no pagamento de 2.300.000,00 MT\nJuros de mora à taxa legal desde 1 de Julho de 2026', 'Payment of 2,300,000.00 MT\nInterest'), help: l('Completa «Ser…» / «A…». Um pedido por linha.', 'One claim per line.') },
    { name: 'valor', type: 'money', section: 'litigio', width: 'half', label: l('Valor do litígio', 'Amount in dispute') },
    { name: 'arbitroNome', type: 'text', section: 'arbitro', label: l('Árbitro que designa (opcional)', 'Arbitrator appointed (optional)'), help: l('Com tribunal de três árbitros, cada parte designa um.', 'With three arbitrators, each party appoints one.') },
    { name: 'arbitroGenero', type: 'radio', section: 'arbitro', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'arbitroContacto', type: 'text', section: 'arbitro', width: 'half', label: l('Contacto do árbitro', 'Arbitrator’s contact') },
    { name: 'prazoDesignacao', type: 'text', section: 'arbitro', label: l('Prazo para a outra parte designar árbitro', 'Time for the other party to appoint'), placeholder: l('Ex.: no prazo previsto na convenção de arbitragem', 'E.g. within the period in the agreement'), default: 'no prazo previsto na convenção ou na lei' },
    ...provaFields('prova', { testemunhas: false, docsPlaceholder: 'Contrato com a convenção de arbitragem\nFacturas\nCorrespondência' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => [
    { level: 'info', message: l(`${cite('pcInicioArbitragem')}: indique a convenção, o litígio, o pedido e o árbitro que designa. A arbitragem considera-se iniciada com a recepção desta comunicação; envie-a com prova de recepção.`, 'State the agreement, dispute, claim and arbitrator; send with proof of receipt.') },
    ...(institucional(v) ? [{ level: 'info' as const, field: 'centro', message: l('Confirme no regulamento do centro os requisitos do requerimento, o número de cópias e os encargos iniciais.', 'Check the centre’s rules for requirements, copies and fees.') }] : []),
  ] satisfies Warning[],

  personName: (v) => v.demandadoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = g3(v, 'demandante');
    const D = g3(v, 'demandado');
    const inst = institucional(v);
    const centro = sem(v.centro) || 'Centro de Arbitragem ____________';
    const addressee = inst
      ? `${isF(v.presidenteGenero) ? 'Exma. Senhora Presidente' : 'Exmo. Senhor Presidente'} do ${centro}`.toLocaleUpperCase('pt')
      : `${v.demandadoTipo === 'empresa' ? 'Exmos. Senhores' : D.w('Exmo. Senhor', 'Exma. Senhora')} ${str(v.demandadoNome) || '____________'}`.toLocaleUpperCase('pt');
    const arbF = isF(v.arbitroGenero);
    const conv = [
      `${A.O} Demandante e ${D.o} ${D.w('Demandado', 'Demandada')} celebraram convenção de arbitragem, constante d${/^a\s/i.test(sem(v.convencao)) ? 'a' : 'o'} ${sem(v.convencao).replace(/^(a|o)\s+/i, '') || '____________________'} (Documento n.º 1).`,
      ...(str(v.convencaoTexto) ? [`A convenção dispõe o seguinte: «${sem(v.convencaoTexto)}».`] : []),
      'O litígio adiante descrito está abrangido pela convenção e respeita a direitos disponíveis.',
    ];
    const arb = str(v.arbitroNome)
      ? [`${A.O} Demandante designa como ${arbF ? 'árbitra' : 'árbitro'} ${arbF ? 'a' : 'o'} Dr${arbF ? '.ª' : '.'} ${sem(v.arbitroNome)}${str(v.arbitroContacto) ? ` (${sem(v.arbitroContacto)})` : ''}, que aceitará o encargo.`, `${D.O} ${D.w('Demandado', 'Demandada')} é ${D.w('convidado', 'convidada')} a designar o seu árbitro ${sem(v.prazoDesignacao) || 'no prazo previsto na convenção ou na lei'}, sob pena de a designação ser feita nos termos ${inst ? 'do regulamento do centro' : 'da lei'}.`]
      : [`Requer-se a constituição do tribunal arbitral nos termos da convenção${inst ? ' e do regulamento do centro' : ' e da lei'}.`];
    const pv = prova(v);
    const cols: SignatureColumn[] = [lawyerSignature(v)];
    const blocks: Block[] = [
      { type: 'courtHeader', addressee },
      { type: 'paragraph', id: 'demandante', text: `${partyDesc(v, 'demandante')}, adiante ${A.w('designado', 'designada')} por **Demandante**,`, en: 'Identification of the claimant.' },
      { type: 'paragraph', id: 'vem', text: `vem, por intermédio do seu mandatário${inst ? ', requerer a instauração de arbitragem contra' : ', notificar'}`, en: 'through its lawyer, starts arbitration against' },
      { type: 'paragraph', id: 'demandado', text: `${partyDesc(v, 'demandado')}, adiante ${D.w('designado', 'designada')} por **${D.w('Demandado', 'Demandada')}**,`, en: 'Identification of the respondent.' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: inst ? 'apresentando o seu\n**REQUERIMENTO DE ARBITRAGEM**,' : 'para os efeitos do início de\n**ARBITRAGEM**,', en: 'REQUEST FOR ARBITRATION' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Da convenção de arbitragem', items: conv },
          { heading: 'II — Do litígio', items: artigos(v.factos).length ? artigos(v.factos) : ['____________________'] },
          { heading: 'III — Do tribunal arbitral', items: arb },
        ],
      },
      ...closing(ctx, {
        intro: `Nestes termos, ${A.o} Demandante pretende que o tribunal arbitral julgue procedente a sua pretensão e, em consequência, condene ${D.o} ${D.w('Demandado', 'Demandada')} no seguinte:`,
        introEn: 'The claimant asks the arbitral tribunal for the following:',
        pedidos: linhas(v.pedidos).length ? linhas(v.pedidos) : ['____________________'],
        valor: money(v.valor) ?? undefined,
        valorLabel: 'Valor do litígio',
        docs: pv.docs,
        procuracao: pv.procuracao,
        fecho: inst ? 'Pede deferimento.' : 'Com os melhores cumprimentos,',
        cols,
      }),
    ];
    return blocks;
  },
});
