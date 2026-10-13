import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, placeDate } from './_shared';
import { ext, pessoaFields, pessoaIdent, semPonto, str } from './_associacoes';

// Requerimento de reconhecimento de uma associação como pessoa jurídica
// (Lei n.º 8/91 + Decreto n.º 21/91). Written by the interim committee to the
// Minister of Justice or to the provincial state authority: plain, no letterhead.

const AUTORIDADE_OPTIONS = [
  { value: 'ministro', label: l('Ministro da Justiça, Assuntos Constitucionais e Religiosos (âmbito nacional)', 'Minister of Justice (national)') },
  { value: 'secretarioEstado', label: l('Secretário de Estado na Província (âmbito provincial)', 'Secretary of State in the Province (provincial)') },
  { value: 'governador', label: l('Governador da Província (âmbito provincial)', 'Provincial Governor (provincial)') },
];

const ANEXOS_DEFAULT = [
  'Acta da Assembleia Constituinte, com a identificação e as assinaturas dos membros fundadores',
  'Estatutos da Associação, em triplicado',
  'Cópias dos documentos de identificação dos membros fundadores',
  'Comprovativo dos meios para o funcionamento da Associação',
  'Declaração de cedência ou contrato das instalações da sede',
];

export default defineTemplate({
  id: 'requerimento-reconhecimento-associacao',
  family: 'carta',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destino', title: l('Entidade competente', 'Authority') },
    { id: 'requerente', title: l('Requerente (mandatário)', 'Applicant (mandated person)'), personRole: 'representante' },
    { id: 'associacao', title: l('Associação', 'Association') },
    { id: 'anexos', title: l('Documentos juntos', 'Attached documents') },
    { id: 'documento', title: l('Data e contactos', 'Date and contacts') },
  ],
  fields: [
    { name: 'autoridade', type: 'select', section: 'destino', required: true, label: l('Dirigido a', 'Addressed to'), options: AUTORIDADE_OPTIONS, default: 'ministro', legal: l('O Ministro reconhece as associações de âmbito nacional; o órgão do Estado na província, as de âmbito provincial.', 'The Minister recognises national associations; the provincial authority, provincial ones.') },
    { name: 'provincia', type: 'text', section: 'destino', width: 'half', label: l('Província', 'Province'), showIf: (v) => v.autoridade !== 'ministro', default: (c) => c.profile?.morada?.provincia ?? '' },
    { name: 'cidadeDestino', type: 'text', section: 'destino', width: 'half', label: l('Cidade', 'City'), default: 'Maputo' },
    ...pessoaFields('requerente', 'requerente', ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'doc', 'morada']),
    { name: 'requerenteQualidade', type: 'text', section: 'requerente', label: l('Qualidade', 'Capacity'), default: 'Presidente da Comissão Instaladora' },
    { name: 'nome', type: 'text', section: 'associacao', required: true, label: l('Nome da associação', 'Name of the association') },
    { name: 'sede', type: 'text', section: 'associacao', required: true, label: l('Sede', 'Seat') },
    { name: 'objectivoGeral', type: 'textarea', section: 'associacao', rows: 2, required: true, label: l('Objectivo geral', 'General objective') },
    { name: 'numeroFundadores', type: 'number', section: 'associacao', width: 'half', required: true, label: l('Número de fundadores', 'Number of founders'), min: 0 },
    { name: 'dataConstituinte', type: 'date', section: 'associacao', width: 'half', required: true, label: l('Data da assembleia constituinte', 'Founding meeting date') },
    {
      name: 'meios',
      type: 'textarea',
      section: 'associacao',
      rows: 2,
      required: true,
      label: l('Meios de funcionamento', 'Means of operation'),
      legal: l('A lei exige a prova dos meios necessários ao funcionamento.', 'The law requires proof of the means to operate.'),
      default: 'as jóias e quotas dos membros, instalações cedidas para a sede e os apoios de parceiros para as suas actividades',
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'anexos',
      label: l('Documentos juntos', 'Attached documents'),
      help: l('Lista indicativa: confirme a lista actual nos serviços que recebem o pedido.', 'Indicative list: confirm the current list with the office receiving the application.'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'documento', type: 'text', label: l('Documento', 'Document') }],
      default: ANEXOS_DEFAULT.map((documento) => ({ documento })),
    },
    localField(),
    dateField(),
    { name: 'contacto', type: 'text', section: 'documento', label: l('Telefone / email para notificações', 'Phone / email for notices') },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.nome) || BLANK;
    const prov = str(v.provincia) || BLANK;
    const destino =
      v.autoridade === 'secretarioEstado'
        ? ['Sua Excelência', `O Secretário de Estado na Província de ${prov}`]
        : v.autoridade === 'governador'
          ? ['Sua Excelência', `O Governador da Província de ${prov}`]
          : ['Sua Excelência', 'O Ministro da Justiça, Assuntos Constitucionais e Religiosos'];
    const ambito = v.autoridade === 'ministro' ? 'em todo o território nacional' : `na Província de ${prov}`;
    const nf = Number(v.numeroFundadores);
    const anexos = lineItems(v.anexos).map((r) => semPonto(r.documento)).filter(Boolean);
    const blocks: Block[] = [
      { type: 'recipient', lines: [...destino, str(v.cidadeDestino) || 'Maputo'] },
      { type: 'subject', text: `Pedido de reconhecimento da ${nome} como pessoa jurídica` },
      { type: 'salutation', text: 'Excelência,' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${pessoaIdent(v, 'requerente')}, na qualidade de ${semPonto(v.requerenteQualidade) || BLANK} da **${nome}**, mandatado(a) pela Assembleia Constituinte realizada em ${dateLong(v.dataConstituinte)}, vem, nos termos do ${cite('assocReconhecimento')}, conjugado com o ${cite('assocReconhecimentoDecreto')}, requerer a Vossa Excelência o reconhecimento da **${nome}** como pessoa jurídica.`,
        en: 'The applicant, mandated by the founding meeting, applies for recognition of the association as a legal person.',
      },
      {
        type: 'paragraph',
        id: 'associacao',
        text: `A ${nome} é uma associação sem fins lucrativos, com sede em ${str(v.sede) || BLANK}, que desenvolve as suas actividades ${ambito} e tem por objectivo geral ${semPonto(v.objectivoGeral) || BLANK}.`,
        en: 'Description of the association, its seat, area and objective.',
      },
      {
        type: 'paragraph',
        id: 'requisitos',
        text: `A Associação foi constituída por ${nf > 0 ? `${nf} (${ext(nf)})` : BLANK} membros fundadores, prossegue fins lícitos, determinados e legalmente possíveis, e os seus estatutos observam os requisitos da lei. Para o seu funcionamento, a Associação dispõe dos seguintes meios: ${semPonto(v.meios) || BLANK}.`,
        en: 'The association meets the legal requirements: founders, lawful aims, compliant statutes and means of operation.',
      },
      { type: 'paragraph', id: 'junta', text: 'Para o efeito, junta os seguintes documentos:', en: 'The following documents are attached:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: (anexos.length ? anexos : [BLANK]).map((a, i, arr) => `${a}${i === arr.length - 1 ? '.' : ';'}`) },
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: v.requerenteGenero === 'F' ? 'A Requerente' : 'O Requerente', name: str(v.requerenteNome) || undefined, detail: str(v.requerenteQualidade) || undefined }],
      },
    ];
    if (str(v.contacto)) blocks.push({ type: 'note', text: `Contactos para notificações: ${str(v.contacto)}`, en: 'Contacts for notices.' });
    blocks.push({ type: 'box', label: 'Para uso dos serviços', lines: 3, width: 'half', align: 'right' });
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const min = ctx.legal.value<number>('assocRequisitos');
    const prazo = ctx.legal.value<{ despacho: number; recurso: number }>('assocReconhecimentoPrazo');
    const nf = Number(v.numeroFundadores);
    if (Number.isFinite(nf) && nf < min)
      w.push({ level: 'error', field: 'numeroFundadores', message: l(`São necessários pelo menos ${min} fundadores (${cite('assocRequisitos')}).`, `At least ${min} founders are required.`) });
    if (!str(v.meios)) w.push({ level: 'warning', field: 'meios', message: l('A lei exige a prova dos meios para o funcionamento da associação.', 'The law requires proof of the means to operate.') });
    w.push({
      level: 'info',
      message: l(
        `O despacho deve ser proferido em ${prazo.despacho} dias e é publicado no Boletim da República com os estatutos. A recusa tem de ser fundamentada e admite recurso para o Tribunal Administrativo em ${prazo.recurso} dias a contar da notificação.`,
        `The decision is due within ${prazo.despacho} days and is published with the statutes. A refusal must give reasons and may be appealed to the Administrative Court within ${prazo.recurso} days.`,
      ),
    });
    if (v.autoridade !== 'ministro')
      w.push({ level: 'info', field: 'autoridade', message: l(`Confirme nos serviços provinciais quem assina hoje o despacho (${cite('assocReconhecimentoDecreto')}).`, 'Confirm with the provincial services who signs the decision today.') });
    return w;
  },
  personName: (v) => str(v.nome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
