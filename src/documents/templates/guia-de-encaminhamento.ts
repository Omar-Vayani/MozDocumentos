// Guia de encaminhamento: the neighbourhood structure refers a resident to
// another entity (administrative post, police, health centre, legal aid, social
// action, community court, civil registry) with a short statement of why.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, exmo, g, l, localField } from './_shared';
import { assinaturaBlocks, assinaturaFields, comunidadeWarnings, identificacao, neste, numeroComunidadeField, numeroRef, pessoaFields, str, unidadeField } from './_comunidade';

const DESTINOS = [
  { value: 'Chefe do Posto Administrativo', label: l('Posto Administrativo', 'Administrative post') },
  { value: 'Chefe da Localidade', label: l('Localidade', 'Locality') },
  { value: 'Comandante da Esquadra da PRM', label: l('Esquadra da Polícia (PRM)', 'Police station') },
  { value: 'Responsável do Gabinete de Atendimento à Família e Menores Vítimas de Violência', label: l('Gabinete de Atendimento à Família e Menores', 'Family and child victims unit') },
  { value: 'Director do Centro de Saúde', label: l('Centro de saúde', 'Health centre') },
  { value: 'Delegado do Instituto do Patrocínio e Assistência Jurídica (IPAJ)', label: l('IPAJ (assistência jurídica)', 'Legal aid (IPAJ)') },
  { value: 'Director do Serviço Distrital de Saúde, Mulher e Acção Social', label: l('Acção social (SDSMAS)', 'Social action services') },
  { value: 'Presidente do Tribunal Comunitário', label: l('Tribunal comunitário', 'Community court') },
  { value: 'Conservador do Registo Civil', label: l('Conservatória do Registo Civil', 'Civil registry') },
  { value: 'outro', label: l('Outra entidade', 'Other') },
];

export default defineTemplate({
  id: 'guia-de-encaminhamento',
  family: 'oficio',
  official: 'estado',
  page: 'A5',
  sections: [
    { id: 'documento', title: l('Guia', 'Referral') },
    { id: 'destino', title: l('Destinatário', 'Addressee') },
    { id: 'cidadao', title: l('Morador encaminhado', 'Resident referred'), personRole: 'outro' },
    { id: 'motivo', title: l('Motivo', 'Reason') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    { name: 'urgente', type: 'toggle', section: 'documento', width: 'half', label: l('Urgente', 'Urgent'), default: false },
    { name: 'destinatario', type: 'select', section: 'destino', label: l('Entidade', 'Body'), options: DESTINOS, default: 'Chefe do Posto Administrativo', required: true },
    { name: 'destinatarioOutro', type: 'text', section: 'destino', label: l('Cargo do destinatário', 'Addressee’s position'), placeholder: l('Ex.: Director da Escola Secundária de …', 'E.g. head of a school'), showIf: (v) => v.destinatario === 'outro' },
    { name: 'destinatarioEntidade', type: 'text', section: 'destino', label: l('Nome ou local da entidade', 'Name or place of the body'), placeholder: l('Ex.: de KaMpfumo / 7.ª Esquadra', 'E.g. of KaMpfumo / 7th station') },
    { name: 'destinatarioGenero', type: 'radio', section: 'destino', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Exmo. Senhor', 'Sir') }, { value: 'F', label: l('Exma. Senhora', 'Madam') }], default: 'M' },
    ...pessoaFields(['nome', 'genero', 'docTipo', 'docNumero', 'quarteirao', 'casa', 'telefone']),
    {
      name: 'motivo',
      type: 'textarea',
      section: 'motivo',
      required: true,
      rows: 2,
      label: l('Para quê', 'What for'),
      placeholder: l('Ex.: solicitar assistência jurídica num caso de despejo', 'E.g. request legal aid in an eviction case'),
    },
    { name: 'informacao', type: 'textarea', section: 'motivo', rows: 3, label: l('O que esta estrutura sabe do caso (opcional)', 'What the structure knows (optional)') },
    ...assinaturaFields('assinatura', { visto: false, confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    if (/viol[êe]ncia|abuso|agress|viola[cç]/i.test(`${str(v.motivo)} ${str(v.informacao)}`)) {
      w.push({ level: 'warning', field: 'motivo', message: l('Violência e abuso de menores: encaminhe directamente à Polícia ou ao Gabinete de Atendimento; não faça mediação.', 'Violence and child abuse: refer directly to the police or the victims unit; do not mediate.') });
    }
    w.push({ level: 'info', message: l('A guia apresenta o morador; a entidade de destino não fica obrigada por ela.', 'The referral introduces the resident; it does not bind the receiving body.') });
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const cargo = v.destinatario === 'outro' ? str(v.destinatarioOutro) : str(v.destinatario);
    const ent = str(v.destinatarioEntidade);
    const end = [str(v.cidadaoQuarteirao) ? `Quarteirão n.º ${str(v.cidadaoQuarteirao)}` : '', str(v.cidadaoCasa) ? `Casa n.º ${str(v.cidadaoCasa)}` : ''].filter(Boolean).join(', ');
    const motivo = str(v.motivo).replace(/\s*\n+\s*/g, ' ').replace(/[.;]+$/, '');
    const blocks: Block[] = [];
    if (v.urgente) blocks.push({ type: 'tags', items: ['URGENTE'] });
    blocks.push(
      { type: 'reference', ref: `Guia de Encaminhamento ${numeroRef(ctx)}`, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: exmo(v.destinatarioGenero), lines: [cargo || BLANK, ent].filter(Boolean) },
      { type: 'subject', text: `Encaminhamento ${g(gen, 'do cidadão', 'da cidadã')} ${str(v.cidadaoNome) || BLANK}` },
      {
        type: 'paragraph',
        id: 'encaminhamento',
        text: `Encaminha-se a V. Ex.ª ${g(gen, 'o cidadão', 'a cidadã')} ${identificacao(v)}, residente ${neste(str(v.unidade))}${end ? `, ${end}` : ''}${str(v.cidadaoTelefone) ? `, contacto ${str(v.cidadaoTelefone)}` : ''}, que se apresenta a fim de ${motivo ? motivo.replace(/^(para|a fim de)\s+/i, '') : BLANK}.`,
        en: 'The resident named is referred to you for the purpose stated.',
      },
    );
    if (str(v.informacao)) blocks.push({ type: 'paragraph', id: 'informacao', text: str(v.informacao).replace(/\s*\n+\s*/g, ' '), en: 'What the community structure knows about the case.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Agradecemos a atenção que V. Ex.ª se dignar dispensar ao assunto.', keepWithNext: true, en: 'Thank you for your attention to this matter.' },
      ...assinaturaBlocks(ctx, { placeDate: false }),
      { type: 'box', label: 'Para uso da entidade de destino', text: 'Recebido em ___/___/______    Assinatura: ____________________', width: 'full' },
    );
    return blocks;
  },
});
