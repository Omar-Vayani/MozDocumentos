import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField } from './_shared';
import { artigos, papel } from './_advocacia';
import { closing, fechoField, lawyerWarnings, nosArtigos, parteNome, pendingHead, processoFields, prova, provaFields, seccoes, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'replica',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'peca', title: l('Réplica ou tréplica', 'Reply or rejoinder') },
    { id: 'excepcoes', title: l('Resposta às excepções', 'Answer to the objections') },
    { id: 'reconvencao', title: l('Resposta à reconvenção', 'Answer to the counterclaim') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    { name: 'dataNotificacao', type: 'date', section: 'tribunal', width: 'half', label: l('Notificado da contestação em', 'Notified of the defence on') },
    ...parteNome('autor', 'partes', 'Autor (o seu cliente, na réplica)', 'Claimant (your client, for a reply)', 'empresa'),
    ...parteNome('reu', 'partes', 'Réu', 'Defendant', 'empresa'),
    {
      name: 'peca',
      type: 'radio',
      section: 'peca',
      label: l('Peça', 'Pleading'),
      default: 'replica',
      options: [
        { value: 'replica', label: l('Réplica (pelo autor)', 'Reply (by the claimant)') },
        { value: 'treplica', label: l('Tréplica (pelo réu)', 'Rejoinder (by the defendant)') },
      ],
      help: l('A réplica responde às excepções e à reconvenção da contestação. A tréplica só cabe se a réplica alterou o pedido ou a causa de pedir, ou respondeu à reconvenção.', 'A reply answers the objections and counterclaim; a rejoinder only if the reply changed the claim or answered the counterclaim.'),
    },
    {
      name: 'excepcoesInvocadas',
      type: 'text',
      section: 'excepcoes',
      label: l('Excepções invocadas pela parte contrária', 'Objections raised by the other party'),
      placeholder: l('Ex.: prescrição e pagamento (artigos 3.º a 15.º da contestação)', 'E.g. limitation and payment'),
    },
    {
      name: 'respostaExcepcoes',
      type: 'textarea',
      section: 'excepcoes',
      rows: 6,
      label: l('Resposta às excepções (um artigo por linha)', 'Answer to the objections (one article per line)'),
      help: l('Tome posição sobre cada facto novo: o que não for impugnado pode ser dado como admitido.', 'Take a position on each new fact: what is not denied may be taken as admitted.'),
    },
    { name: 'impugnados', type: 'text', section: 'excepcoes', width: 'half', label: l('Artigos impugnados', 'Articles denied'), placeholder: l('Ex.: 3.º a 15.º e 22.º', 'E.g. 3 to 15 and 22') },
    { name: 'pecaImpugnada', type: 'text', section: 'excepcoes', width: 'half', label: l('Da peça', 'Of the pleading'), default: 'contestação' },
    { name: 'temReconvencao', type: 'toggle', section: 'reconvencao', label: l('Responder a pedido reconvencional', 'Answer a counterclaim') },
    {
      name: 'respostaReconvencao',
      type: 'textarea',
      section: 'reconvencao',
      rows: 5,
      label: l('Resposta à reconvenção (um artigo por linha)', 'Answer to the counterclaim (one article per line)'),
      showIf: (v) => Boolean(v.temReconvencao),
    },
    {
      name: 'alteracaoPedido',
      type: 'textarea',
      section: 'reconvencao',
      rows: 2,
      label: l('Ampliação ou alteração do pedido (opcional)', 'Extension or change of the claim (optional)'),
      help: l('Um pedido por linha. Só nos casos que a lei admite.', 'One per line. Only where the law allows it.'),
      showIf: (v) => v.peca !== 'treplica',
    },
    { name: 'direito', type: 'textarea', section: 'reconvencao', rows: 3, label: l('Fundamentos de direito (opcional)', 'Legal grounds (optional)') },
    ...provaFields('prova', { procuracao: false }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A réplica só é admissível quando a contestação contém excepção ou reconvenção (${cite('pcReplica')}). Confirme o prazo a contar da notificação da contestação.`,
          'A reply is only admissible when the defence raises objections or a counterclaim. Confirm the time limit from notice of the defence.',
        ),
      },
    ];
    if (!str(v.respostaExcepcoes) && !(v.temReconvencao && str(v.respostaReconvencao))) {
      w.push({ level: 'warning', field: 'respostaExcepcoes', message: l('Escreva a resposta às excepções ou à reconvenção.', 'Write the answer to the objections or counterclaim.') });
    }
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => (v.peca === 'treplica' ? v.autorNome : v.reuNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const treplica = v.peca === 'treplica';
    const p = treplica ? 'reu' : 'autor';
    const c = treplica ? 'autor' : 'reu';
    const meuPapel = treplica ? papel(v, p, 'Réu', 'Ré') : papel(v, p, 'Autor', 'Autora');
    const outroPapel = treplica ? papel(v, c, 'Autor', 'Autora') : papel(v, c, 'Réu', 'Ré');
    const oOutro = treplica ? papel(v, c, 'o Autor', 'a Autora') : papel(v, c, 'o Réu', 'a Ré');
    const peca = sem(v.pecaImpugnada) || (treplica ? 'réplica' : 'contestação');

    const excep: string[] = [];
    if (str(v.excepcoesInvocadas)) excep.push(`Na ${peca}, ${oOutro} invoca ${sem(v.excepcoesInvocadas)}, matéria que não procede, como se demonstra.`);
    if (str(v.impugnados)) excep.push(`Impugnam-se, por não corresponderem à verdade, os factos alegados ${nosArtigos(sem(v.impugnados))} da ${peca}.`);
    excep.push(...artigos(v.respostaExcepcoes));
    const recon = v.temReconvencao ? artigos(v.respostaReconvencao) : [];
    const alteracao = !treplica ? artigos(v.alteracaoPedido) : [];

    const sections = seccoes([
      ['Da resposta às excepções', excep],
      ['Da resposta à reconvenção', v.temReconvencao ? (recon.length ? recon : ['____________________']) : []],
      ['Da alteração do pedido', alteracao],
      ['Do direito', artigos(v.direito)],
    ]);
    if (!sections.length) sections.push({ heading: 'I — Da resposta às excepções', items: ['____________________'] });

    const absolvido = papel(v, p, 'absolvido', 'absolvida');
    const pedidos = treplica
      ? [`Ser julgada improcedente a matéria da réplica, mantendo-se o alegado na contestação`, ...(v.temReconvencao ? ['Ser julgado procedente o pedido reconvencional, nos termos deduzidos'] : []), 'Prosseguirem os autos os ulteriores termos até final']
      : [
          'Serem julgadas improcedentes, por não provadas, as excepções deduzidas',
          ...(v.temReconvencao ? [`Ser julgado improcedente o pedido reconvencional, ${absolvido} ${papel(v, p, 'o Autor', 'a Autora')} do mesmo`] : []),
          ...alteracao.length ? ['Ser admitida a alteração do pedido nos termos expostos'] : [],
          'Ser a acção julgada procedente, nos termos da petição inicial, seguindo-se os ulteriores termos até final',
        ];
    const pv = prova(v);
    return [
      ...pendingHead(v, {
        p,
        papel: meuPapel,
        contra: c,
        contraPapel: outroPapel,
        verbo: `tendo sido ${papel(v, p, 'notificado', 'notificada')} da ${peca}${v.dataNotificacao ? ` em ${dateLong(v.dataNotificacao)}` : ''}, apresentar a sua`,
        titulo: `**${treplica ? 'TRÉPLICA' : 'RÉPLICA'}**,`,
        tituloEn: treplica ? 'REJOINDER' : 'REPLY',
      }),
      { type: 'articulado', sections },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve:',
        introEn: 'On these grounds, the court should:',
        pedidos,
        docs: pv.docs,
        testemunhas: pv.testemunhas,
      }),
    ] satisfies Block[];
  },
});
