import { inteiroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, PARTE_TIPO_OPTIONS, artigos, courtAddressee, courtFields, documentosList, juntaText, linePara, nomeParte, parteF } from './_advocacia';

// ---------------------------------------------------------------- Local helpers

const QUALIDADES: Record<string, { m: string; f: string; contra?: { m: string; f: string } }> = {
  autor: { m: 'Autor', f: 'Autora', contra: { m: 'Réu', f: 'Ré' } },
  reu: { m: 'Réu', f: 'Ré', contra: { m: 'Autor', f: 'Autora' } },
  requerente: { m: 'Requerente', f: 'Requerente', contra: { m: 'Requerido', f: 'Requerida' } },
  requerido: { m: 'Requerido', f: 'Requerida', contra: { m: 'Requerente', f: 'Requerente' } },
  exequente: { m: 'Exequente', f: 'Exequente', contra: { m: 'Executado', f: 'Executada' } },
  executado: { m: 'Executado', f: 'Executada', contra: { m: 'Exequente', f: 'Exequente' } },
  assistente: { m: 'Assistente', f: 'Assistente', contra: { m: 'Arguido', f: 'Arguida' } },
  arguido: { m: 'Arguido', f: 'Arguida' },
};

const QUALIDADE_OPTIONS: FieldOption[] = Object.entries(QUALIDADES).map(([value, q]) => ({ value, label: l(`${q.m}${q.f !== q.m ? ` / ${q.f}` : ''}`, value) }));

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'juncao', label: l('Juntar documentos ao processo', 'File documents') },
  { value: 'prorrogacao', label: l('Prorrogação de prazo', 'Extension of a time limit') },
  { value: 'consulta', label: l('Consulta ou confiança do processo', 'Inspect or borrow the case file') },
  { value: 'certidao', label: l('Pedido de certidão', 'Request a certificate') },
  { value: 'procuracao', label: l('Juntar procuração ou substabelecimento', 'File a power of attorney or delegation') },
  { value: 'homologacao', label: l('Homologação de acordo (transacção)', 'Court approval of a settlement') },
  { value: 'outro', label: l('Outro pedido (escrever)', 'Other request (write it)') },
];

const isTipo = (t: string) => (v: Values) => v.tipo === t;

export default defineTemplate({
  id: 'requerimento-ao-tribunal',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties'), personRole: 'cliente' },
    { id: 'pedido', title: l('O que pede', 'What you ask for') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', required: true, label: l('Processo n.º', 'Case no.'), placeholder: l('Ex.: 245/2026', 'E.g. 245/2026') },
    ...courtFields('tribunal'),
    {
      name: 'tipoAccao',
      type: 'text',
      section: 'tribunal',
      label: l('Tipo de processo', 'Type of case'),
      default: 'acção declarativa de condenação, com processo ordinário',
      help: l('Completa «nos autos de …».', 'Completes “in the case of …”.'),
    },
    { name: 'requerenteNome', type: 'text', section: 'partes', required: true, label: l('Parte que requer (o seu cliente)', 'Party applying (your client)'), personKey: 'nome' },
    { name: 'requerenteTipo', type: 'radio', section: 'partes', width: 'half', label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: 'pessoa' },
    { name: 'requerenteGenero', type: 'radio', section: 'partes', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.requerenteTipo !== 'empresa' },
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_OPTIONS, default: 'autor' },
    { name: 'contrariaNome', type: 'text', section: 'partes', width: 'half', label: l('Parte contrária (opcional)', 'Other party (optional)') },
    { name: 'contrariaTipo', type: 'radio', section: 'partes', width: 'half', label: l('A parte contrária é', 'The other party is'), options: PARTE_TIPO_OPTIONS, default: 'empresa', showIf: (v) => Boolean(v.contrariaNome) },
    { name: 'contrariaGenero', type: 'radio', section: 'partes', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => Boolean(v.contrariaNome) && v.contrariaTipo !== 'empresa' },
    { name: 'tipo', type: 'select', section: 'pedido', required: true, label: l('Tipo de pedido', 'Type of request'), options: TIPO_OPTIONS, default: 'juncao' },
    // Junção de documentos
    { name: 'documentos', type: 'textarea', section: 'pedido', rows: 3, label: l('Documentos (um por linha)', 'Documents (one per line)'), showIf: (v) => v.tipo === 'juncao' || v.tipo === 'outro' },
    { name: 'juncaoPeca', type: 'text', section: 'pedido', width: 'half', label: l('Peça a que respeitam', 'Pleading they relate to'), default: 'petição inicial', showIf: isTipo('juncao') },
    { name: 'juncaoArtigos', type: 'text', section: 'pedido', width: 'half', label: l('Artigos que provam (opcional)', 'Articles they prove (optional)'), placeholder: l('Ex.: 4.º a 7.º', 'E.g. 4 to 7'), showIf: isTipo('juncao') },
    {
      name: 'juncaoMotivo',
      type: 'text',
      section: 'pedido',
      label: l('Porque não foram juntos antes (opcional)', 'Why they were not filed earlier (optional)'),
      placeholder: l('Ex.: só foram obtidos em 2 de Outubro de 2026, junto do banco', 'E.g. only obtained on 2 October 2026 from the bank'),
      showIf: isTipo('juncao'),
    },
    // Prorrogação
    { name: 'prazoActo', type: 'text', section: 'pedido', width: 'half', label: l('Prazo para', 'Time limit to'), default: 'contestar', placeholder: l('Ex.: contestar; apresentar alegações', 'E.g. file a defence'), showIf: isTipo('prorrogacao') },
    { name: 'prazoFim', type: 'date', section: 'pedido', width: 'half', label: l('O prazo termina em', 'The time limit ends on'), showIf: isTipo('prorrogacao') },
    { name: 'prorrogacaoDias', type: 'number', section: 'pedido', width: 'half', min: 1, max: 60, label: l('Prorrogação pedida (dias)', 'Extension requested (days)'), showIf: isTipo('prorrogacao') },
    { name: 'prorrogacaoMotivo', type: 'textarea', section: 'pedido', rows: 3, label: l('Motivo (um artigo por linha)', 'Reason (one article per line)'), help: l('Explique o motivo ponderoso: complexidade, documentos em falta, impedimento.', 'Explain the serious reason.'), showIf: isTipo('prorrogacao') },
    // Consulta
    { name: 'consultaConfianca', type: 'toggle', section: 'pedido', label: l('Pedir também a confiança do processo (levar os autos)', 'Also ask to borrow the file'), showIf: isTipo('consulta') },
    { name: 'consultaFim', type: 'text', section: 'pedido', label: l('Para que fim', 'Purpose'), placeholder: l('Ex.: preparar as alegações de recurso', 'E.g. prepare the appeal'), showIf: isTipo('consulta') },
    // Certidão
    {
      name: 'certidaoTipo',
      type: 'radio',
      section: 'pedido',
      label: l('Tipo de certidão', 'Type of certificate'),
      default: 'teor',
      options: [
        { value: 'teor', label: l('De teor (cópia integral)', 'Full copy') },
        { value: 'narrativa', label: l('Narrativa (resumo)', 'Summary') },
      ],
      showIf: isTipo('certidao'),
    },
    { name: 'certidaoPecas', type: 'text', section: 'pedido', label: l('Peças a certificar', 'Documents to certify'), placeholder: l('Ex.: sentença proferida nos autos', 'E.g. the judgment'), showIf: isTipo('certidao') },
    { name: 'certidaoTransito', type: 'toggle', section: 'pedido', default: true, label: l('Com nota de trânsito em julgado', 'With note that the judgment is final'), showIf: isTipo('certidao') },
    { name: 'certidaoFim', type: 'text', section: 'pedido', label: l('Destina-se a', 'For'), placeholder: l('Ex.: instruir acção executiva', 'E.g. enforcement proceedings'), showIf: isTipo('certidao') },
    // Procuração
    {
      name: 'procuracaoTipo',
      type: 'radio',
      section: 'pedido',
      label: l('Documento a juntar', 'Document to file'),
      default: 'procuracao',
      options: [
        { value: 'procuracao', label: l('Procuração forense', 'Power of attorney') },
        { value: 'substabelecimento', label: l('Substabelecimento', 'Delegation') },
      ],
      showIf: isTipo('procuracao'),
    },
    // Homologação
    { name: 'acordoData', type: 'date', section: 'pedido', width: 'half', label: l('Data do acordo', 'Date of the settlement'), showIf: isTipo('homologacao') },
    {
      name: 'custas',
      type: 'select',
      section: 'pedido',
      width: 'half',
      label: l('Custas', 'Costs'),
      default: 'acordo',
      options: [
        { value: 'acordo', label: l('Conforme o acordo', 'As per the settlement') },
        { value: 'iguais', label: l('Em partes iguais', 'Split equally') },
        { value: 'requerente', label: l('Pelo requerente', 'By the applicant') },
        { value: 'contraria', label: l('Pela parte contrária', 'By the other party') },
      ],
      showIf: isTipo('homologacao'),
    },
    { name: 'conjunto', type: 'toggle', section: 'pedido', label: l('Requerimento conjunto (assina também o advogado da outra parte)', 'Joint application (the other lawyer signs too)'), default: true, showIf: isTipo('homologacao') },
    { name: 'outroAdvogadoNome', type: 'text', section: 'pedido', width: 'half', label: l('Advogado da outra parte', 'Other party’s lawyer'), showIf: (v) => v.tipo === 'homologacao' && Boolean(v.conjunto) },
    { name: 'outroAdvogadoCarteira', type: 'text', section: 'pedido', width: 'half', label: l('Carteira profissional n.º', 'Bar card no.'), showIf: (v) => v.tipo === 'homologacao' && Boolean(v.conjunto) },
    // Outro
    { name: 'exposicao', type: 'textarea', section: 'pedido', rows: 5, label: l('Exposição (um artigo por linha)', 'Statement (one article per line)'), showIf: isTipo('outro') },
    { name: 'pedidoLivre', type: 'text', section: 'pedido', label: l('O que requer', 'What you request'), placeholder: l('Ex.: a designação de nova data para a audiência de julgamento', 'E.g. a new hearing date'), help: l('Completa «requer a V. Ex.ª …».', 'Completes “requests …”.'), showIf: isTipo('outro') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.tipo === 'prorrogacao') {
      w.push({
        level: 'info',
        field: 'prorrogacaoMotivo',
        message: l(
          'A prorrogação só é possível quando a lei o admite e depende de despacho do juiz. Apresente o requerimento antes do fim do prazo e continue a preparar a peça.',
          'An extension is only possible where the law allows it and depends on the judge. File before the deadline and keep preparing the pleading.',
        ),
      });
    }
    if (v.tipo === 'homologacao') {
      w.push({ level: 'info', message: l(`Junte o acordo assinado pelas partes; o juiz verifica a sua validade e homologa-o por sentença (${cite('advHomologacaoTransaccao')}).`, 'Attach the signed settlement; the judge checks it and approves it by judgment.') });
    }
    if (v.tipo === 'certidao') {
      w.push({ level: 'info', message: l('A emissão de certidões está sujeita a custas, pagas na secretaria.', 'Certificates are subject to court fees, paid at the court office.') });
    }
    if (!v.advogadoCarteira) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') });
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const q = QUALIDADES[v.qualidade as string] ?? QUALIDADES.autor;
    const f = parteF(v, 'requerente');
    const papelReq = f ? q.f : q.m;
    const contra = String(v.contrariaNome ?? '').trim() && q.contra ? (parteF(v, 'contraria') ? q.contra.f : q.contra.m) : '';
    const identificado = f ? 'identificada' : 'identificado';
    const tipoAccao = String(v.tipoAccao ?? '').trim() || '____________________';
    const docs = documentosList(v.documentos);
    const t = String(v.tipo ?? 'juncao');

    const intro: Block = {
      type: 'paragraph',
      id: 'identificacao',
      text: `${nomeParte(v, 'requerente')}, ${papelReq} nos autos à margem referenciados, de ${tipoAccao}${contra ? `, em que é ${contra} ${nomeParte(v, 'contraria')}` : ''}, e neles melhor ${identificado}, vem, por intermédio do seu mandatário judicial, ${t === 'homologacao' && v.conjunto ? 'conjuntamente com a parte contrária, ' : ''}expor e requerer a V. Ex.ª o seguinte:`,
      en: 'The party identified in the case referred to in the margin applies to the court as follows:',
    };

    let corpo: string[] = [];
    let pedido = '';
    let junta = '';
    switch (t) {
      case 'juncao': {
        const peca = String(v.juncaoPeca ?? '').trim() || 'petição inicial';
        corpo = [
          `Mostra-se relevante para a boa decisão da causa a junção aos autos ${docs.length === 1 ? 'do documento que se anexa' : `dos ${docs.length ? inteiroPorExtenso(docs.length) : '___'} documentos que se anexam`}${String(v.juncaoArtigos ?? '').trim() ? `, destinados a provar os factos alegados ${/\s(a|e)\s|,/.test(String(v.juncaoArtigos).trim()) ? 'nos artigos' : 'no artigo'} ${String(v.juncaoArtigos).trim()} da ${peca}` : ''}.`,
          ...(String(v.juncaoMotivo ?? '').trim() ? [`Não foi possível juntá-los anteriormente porque ${String(v.juncaoMotivo).trim().replace(/[.;]$/, '')}.`] : []),
        ];
        pedido = `Termos em que requer a V. Ex.ª se digne admitir a junção aos autos ${docs.length === 1 ? 'do documento anexo' : 'dos documentos anexos'}, ordenando a notificação da parte contrária.`;
        junta = juntaText({ documentos: docs.length, duplicados: true });
        break;
      }
      case 'prorrogacao':
        corpo = [
          `Corre termos o prazo para ${String(v.prazoActo ?? '').trim() || 'contestar'}, que termina em ${dateLong(v.prazoFim)}.`,
          ...artigos(v.prorrogacaoMotivo),
        ];
        pedido = `Nestes termos, por existir motivo ponderoso, requer a V. Ex.ª se digne prorrogar o referido prazo por ${v.prorrogacaoDias ? `${v.prorrogacaoDias} ${Number(v.prorrogacaoDias) === 1 ? 'dia' : 'dias'}` : '____ dias'}.`;
        break;
      case 'consulta':
        corpo = [
          `Para ${String(v.consultaFim ?? '').trim().replace(/[.;]$/, '') || 'os fins tidos por convenientes'}, o signatário necessita de consultar os autos.`,
        ];
        pedido = v.consultaConfianca
          ? 'Termos em que requer a V. Ex.ª se digne autorizar a confiança do processo ao signatário, pelo prazo legal.'
          : 'Termos em que requer a V. Ex.ª se digne autorizar a consulta dos autos na secretaria pelo signatário.';
        break;
      case 'certidao':
        corpo = [];
        pedido = `Requer a V. Ex.ª se digne ordenar a passagem de certidão ${v.certidaoTipo === 'narrativa' ? 'narrativa' : 'de teor'} ${String(v.certidaoPecas ?? '').trim() ? `da ${String(v.certidaoPecas).trim().replace(/^(a|da)\s+/i, '').replace(/[.;]$/, '')}` : 'das peças processuais relevantes'}${v.certidaoTransito ? ', com nota de trânsito em julgado' : ''}${String(v.certidaoFim ?? '').trim() ? `, destinada a ${String(v.certidaoFim).trim().replace(/[.;]$/, '')}` : ''}.`;
        break;
      case 'procuracao':
        corpo = [];
        pedido =
          v.procuracaoTipo === 'substabelecimento'
            ? 'Requer a V. Ex.ª se digne admitir a junção aos autos do substabelecimento que se anexa, passando as notificações a ser feitas também ao signatário.'
            : 'Requer a V. Ex.ª se digne admitir a junção aos autos da procuração forense que se anexa, passando as notificações a ser feitas ao signatário.';
        junta = v.procuracaoTipo === 'substabelecimento' ? 'substabelecimento' : 'procuração forense';
        break;
      case 'homologacao': {
        const custas: Record<string, string> = {
          acordo: 'nos termos acordados',
          iguais: 'em partes iguais',
          requerente: `a cargo ${f ? 'da' : 'do'} ${papelReq}`,
          contraria: contra ? `a cargo ${/a$|ré$/i.test(contra) ? 'da' : 'do'} ${contra}` : 'a cargo da parte contrária',
        };
        corpo = [
          `As partes chegaram a acordo quanto ao objecto do litígio, nos termos do acordo de transacção celebrado em ${dateLong(v.acordoData)}, que se junta.`,
        ];
        pedido = `Termos em que requer${v.conjunto ? 'em' : ''} a V. Ex.ª se digne homologar o referido acordo por sentença, julgando extinta a instância, com custas ${custas[v.custas as string] ?? custas.acordo}.`;
        junta = 'acordo de transacção';
        break;
      }
      default:
        corpo = artigos(v.exposicao);
        pedido = `Nestes termos, requer a V. Ex.ª ${String(v.pedidoLivre ?? '').trim().replace(/[.;]$/, '') || '____________________'}.`;
        junta = docs.length ? juntaText({ documentos: docs.length }) : '';
    }

    const blocks: Block[] = [
      { type: 'courtHeader', processo: String(v.processoNumero ?? '').trim() || '________/______', extra: String(v.seccao ?? '').trim() || undefined, addressee: courtAddressee(v) },
      intro,
    ];
    if (corpo.length) blocks.push({ type: 'articulado', sections: [{ items: corpo }] });
    blocks.push(
      { type: 'paragraph', id: 'pedido', text: pedido, en: 'Request to the court.' },
      { type: 'paragraph', id: 'fecho', align: 'center', text: `**${v.fecho || 'Pede deferimento.'}**`, en: 'Requests approval.', keepWithNext: !junta },
    );
    if (junta) blocks.push(linePara('junta', 'Junta', `${junta}.`, 'Attached.', true));
    const cols: SignatureColumn[] = [lawyerSignature(v)];
    if (t === 'homologacao' && v.conjunto) {
      cols.push({
        role: 'O Advogado da parte contrária',
        name: String(v.outroAdvogadoNome ?? '').trim() || undefined,
        detail: `Carteira Profissional n.º ${String(v.outroAdvogadoCarteira ?? '').trim() || '________'} — OAM`,
      });
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols });
    if (docs.length && (t === 'juncao' || t === 'outro')) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return blocks;
  },
});
