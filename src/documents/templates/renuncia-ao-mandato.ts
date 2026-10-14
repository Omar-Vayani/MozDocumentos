import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';
import { courtAddressee } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, g3, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'renuncia-ao-mandato',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'cliente', title: l('Cliente (mandante)', 'Client') },
    { id: 'renuncia', title: l('Renúncia', 'Withdrawal') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('cliente', 'cliente', 'Nome do cliente', 'Client’s name', 'pessoa'),
    { name: 'qualidade', type: 'select', section: 'cliente', width: 'half', label: l('Posição do cliente no processo', 'Client’s role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'autor' },
    { name: 'clienteMorada', type: 'text', section: 'cliente', label: l('Residência ou sede do cliente', 'Client’s address'), help: l('Para a notificação da renúncia ao cliente.', 'For serving the withdrawal on the client.') },
    {
      name: 'motivo',
      type: 'select',
      section: 'renuncia',
      label: l('Motivo indicado', 'Reason stated'),
      default: 'reserva',
      options: [
        { value: 'reserva', label: l('Não indicar (reserva profissional)', 'Not stated (professional confidentiality)') },
        { value: 'confianca', label: l('Quebra da relação de confiança', 'Breakdown of trust') },
        { value: 'provisao', label: l('Falta de pagamento de provisão ou honorários', 'Unpaid advance or fees') },
        { value: 'outro', label: l('Outro (escrever)', 'Other (write it)') },
      ],
    },
    { name: 'motivoOutro', type: 'text', section: 'renuncia', label: l('Motivo', 'Reason'), showIf: (v) => v.motivo === 'outro' },
    { name: 'cartaCliente', type: 'toggle', section: 'renuncia', default: true, label: l('Incluir carta de comunicação ao cliente', 'Include a letter to the client') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`${cite('pcRenunciaMandato')}: a renúncia produz efeitos a partir da notificação ao mandante; até lá, e nos termos legais, continue a assegurar os actos urgentes. Avise o cliente por escrito.`, 'The withdrawal takes effect from service on the client; keep handling urgent steps until then. Tell the client in writing.') },
    ];
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = g3(v, 'cliente');
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const papel = C.f ? q.f : q.m;
    const advF = v.advogadoGenero === 'F';
    const adv = `**${(str(v.advogadoNome) || '____________').toLocaleUpperCase('pt')}**`;
    const cliente = `**${(str(v.clienteNome) || '____________').toLocaleUpperCase('pt')}**`;
    const tipo = str(v.tipoAccao) || '____________________';
    const motivos: Record<string, string> = {
      reserva: '',
      confianca: ', por se ter quebrado a relação de confiança indispensável ao exercício do mandato',
      provisao: ', por falta de pagamento da provisão para honorários e despesas solicitada',
      outro: str(v.motivoOutro) ? `, ${sem(v.motivoOutro)}` : '',
    };
    const motivo = motivos[v.motivo as string] ?? '';

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${adv}, ${advF ? 'advogada' : 'advogado'}, com a carteira profissional n.º ${str(v.advogadoCarteira) || '________'}, mandatári${advF ? 'a' : 'o'} ${C.do} ${papel} ${cliente} nos autos de ${tipo} à margem referenciados, vem, nos termos legais, comunicar a V. Ex.ª que`,
        en: 'The lawyer for the party informs the court that',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**RENUNCIA AO MANDATO**', en: 'WITHDRAWS FROM THE MANDATE' },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `que lhe foi conferido ${C.pelo} ${papel}${motivo}.`,
        en: 'conferred by the party.',
      },
      ...closing(ctx, {
        intro: `Termos em que requer a V. Ex.ª se digne ordenar a notificação ${C.do} ${papel}${str(v.clienteMorada) ? `, na sua residência ou sede, em ${sem(v.clienteMorada)}` : ''}, da presente renúncia e para constituir novo mandatário no prazo legal, com as cominações da lei.`,
        introEn: 'The lawyer asks the court to serve the withdrawal on the client and invite them to appoint a new lawyer.',
      }),
    ];
    if (v.cartaCliente) {
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'recipient', salutation: v.clienteTipo === 'empresa' ? 'Exmos. Senhores' : C.w('Exmo. Senhor', 'Exma. Senhora'), lines: [str(v.clienteNome) || '____________', str(v.clienteMorada) || '____________'] },
        { type: 'subject', text: `Renúncia ao mandato — processo n.º ${str(v.processoNumero) || '________'}, ${str(v.tribunal) || '____________'}` },
        {
          type: 'paragraph',
          id: 'cartaCorpo',
          text: `Comunico a V. Ex.ª que, nesta data, renunciei ao mandato que me conferiu no processo acima identificado, tendo requerido ao tribunal a sua notificação. Para defesa dos seus interesses, deve constituir novo mandatário no prazo legal a contar dessa notificação. Até lá assegurarei os actos urgentes, nos termos legais, e coloco à sua disposição, no meu escritório, os documentos que me confiou.`,
          en: 'I inform you that I have withdrawn from the mandate in the case above and asked the court to notify you. Please appoint a new lawyer within the legal time limit; meanwhile I will handle urgent steps, and your documents are available at my office.',
        },
        { type: 'paragraph', id: 'cartaFecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
        { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
        { type: 'acknowledgement', signer: C.w('O Cliente', 'A Cliente') },
      );
    }
    return blocks;
  },
});
