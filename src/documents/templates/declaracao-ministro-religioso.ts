// Declaração de ministro de culto: a registered church states that a person is
// its minister, missionary or religious worker — for a visa or residence
// permit (the church hosts the foreign minister and takes responsibility for
// the stay), for travel abroad, or for any other purpose.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { entidadeNome } from './_associacoes';
import { emLocal, or, semPonto, str } from './_saude-educacao';

const FIM_OPTIONS = [
  { value: 'entrada', label: l('Visto / autorização de residência em Moçambique (estrangeiro)', 'Visa / residence permit in Mozambique (foreigner)') },
  { value: 'viagem', label: l('Viagem ao estrangeiro (conferência, missão)', 'Travel abroad (conference, mission)') },
  { value: 'outro', label: l('Para os devidos efeitos', 'For all due purposes') },
];

const FUNCAO_OPTIONS = [
  { value: 'pastor', label: l('Pastor(a)', 'Pastor'), m: 'pastor', f: 'pastora' },
  { value: 'padre', label: l('Padre / sacerdote', 'Priest'), m: 'sacerdote', f: 'sacerdote' },
  { value: 'missionario', label: l('Missionário(a)', 'Missionary'), m: 'missionário', f: 'missionária' },
  { value: 'evangelista', label: l('Evangelista', 'Evangelist'), m: 'evangelista', f: 'evangelista' },
  { value: 'religiosa', label: l('Religioso(a) / irmã', 'Religious brother / sister'), m: 'religioso', f: 'religiosa' },
  { value: 'outro', label: l('Outra função', 'Other role'), m: '', f: '' },
];

export default defineTemplate({
  id: 'declaracao-ministro-religioso',
  family: 'declaracao',
  official: (v) => (v.finalidade === 'entrada' ? 'estado' : undefined),
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'ministro', title: l('Ministro', 'Minister'), personRole: 'outro' },
    { id: 'missao', title: l('Função e estadia', 'Role and stay') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    { name: 'finalidade', type: 'select', section: 'documento', label: l('Destina-se a', 'For'), options: FIM_OPTIONS, default: 'entrada' },
    { name: 'destinatario', type: 'text', section: 'documento', label: l('Destinatário (opcional)', 'Addressee (optional)'), placeholder: l('Ex.: Serviço Nacional de Migração · Embaixada de Portugal', 'E.g. National Migration Service') },
    localField(),
    dateField(),
    { name: 'nome', type: 'text', section: 'ministro', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'genero', type: 'radio', section: 'ministro', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'nacionalidade', type: 'text', section: 'ministro', width: 'half', label: l('Nacionalidade', 'Nationality'), personKey: 'nacionalidade' },
    { name: 'nascimento', type: 'date', section: 'ministro', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'passaporte', type: 'text', section: 'ministro', width: 'half', label: l('Passaporte / BI n.º', 'Passport / ID no.'), personKey: 'docNumero' },
    { name: 'passaporteValidade', type: 'date', section: 'ministro', width: 'half', label: l('Válido até', 'Valid until') },
    { name: 'funcao', type: 'select', section: 'missao', width: 'half', label: l('Função', 'Role'), options: FUNCAO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'pastor' },
    { name: 'funcaoOutra', type: 'text', section: 'missao', width: 'half', label: l('Qual função?', 'Which role?'), showIf: (v) => v.funcao === 'outro' },
    { name: 'ordenacao', type: 'text', section: 'missao', width: 'half', label: l('Ordenado / consagrado em (opcional)', 'Ordained in (optional)'), placeholder: l('Ex.: 2014', 'E.g. 2014') },
    { name: 'igrejaOrigem', type: 'text', section: 'missao', width: 'half', label: l('Igreja ou missão de origem (opcional)', 'Sending church (optional)') },
    { name: 'actividades', type: 'text', section: 'missao', label: l('Actividades', 'Activities'), placeholder: l('Ex.: pastoral, formação de líderes e acção social na Província de Nampula', 'E.g. pastoral work and training in Nampula') },
    { name: 'periodo', type: 'text', section: 'missao', width: 'half', label: l('Período', 'Period'), placeholder: l('Ex.: dois anos a partir de Janeiro de 2027', 'E.g. two years from January 2027') },
    { name: 'localMissao', type: 'text', section: 'missao', width: 'half', label: l('Local', 'Place'), placeholder: l('Ex.: Nampula', 'E.g. Nampula') },
    {
      name: 'encargos',
      type: 'select',
      section: 'missao',
      label: l('Alojamento e despesas', 'Housing and expenses'),
      options: [
        { value: 'igreja', label: l('Suportados pela igreja em Moçambique', 'Paid by the church in Mozambique') },
        { value: 'origem', label: l('Suportados pela igreja ou missão de origem', 'Paid by the sending church') },
        { value: 'proprio', label: l('Suportados pelo próprio', 'Paid by the person') },
      ],
      default: 'igreja',
      showIf: (v) => v.finalidade === 'entrada',
    },
    { name: 'eventoViagem', type: 'text', section: 'missao', label: l('Evento ou motivo da viagem', 'Event or reason for travel'), placeholder: l('Ex.: Conferência Pan-Africana de Pastores, Nairobi, 3 a 7 de Março de 2027', 'E.g. conference name, city, dates'), showIf: (v) => v.finalidade === 'viagem' },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Quem assina', 'Signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinanteCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || 'Presidente do Conselho Nacional' },
    { name: 'reconhecimento', type: 'toggle', section: 'assinatura', default: true, label: l('Espaço para reconhecimento notarial da assinatura', 'Space for notarial certification') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.nome)) w.push({ level: 'error', field: 'nome', message: l('Indique o nome do ministro.', 'Enter the minister’s name.') });
    if (!ctx.profile?.licenca) w.push({ level: 'warning', message: l(`Indique no perfil o registo da igreja no Ministério da Justiça: as autoridades verificam se a confissão está registada (${cite('assocConfissaoRegisto')}).`, 'Add the church’s registration to the profile.') });
    if (v.finalidade === 'entrada') w.push({ level: 'info', message: l(`O pedido de visto e de autorização de residência é instruído com esta declaração, em regra com a assinatura reconhecida (${cite('seMinistroCulto')}; ${cite('reconhecimentoAssinaturaPessoal')}).`, 'The visa/residence application includes this declaration, normally with a certified signature.') });
    return w;
  },

  personName: (v) => v.nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.genero);
    const igreja = entidadeNome(ctx);
    const lic = str(ctx.profile?.licenca);
    const fn = FUNCAO_OPTIONS.find((x) => x.value === v.funcao) ?? FUNCAO_OPTIONS[0];
    const funcao = v.funcao === 'outro' ? str(v.funcaoOutra) || '____________________' : f ? fn.f : fn.m;
    const id = [
      str(v.nacionalidade) ? `de nacionalidade ${str(v.nacionalidade)}` : '',
      str(v.nascimento) ? `${f ? 'nascida' : 'nascido'} em ${dateLong(v.nascimento)}` : '',
      str(v.passaporte) ? `${f ? 'portadora' : 'portador'} do passaporte n.º ${str(v.passaporte)}${str(v.passaporteValidade) ? `, válido até ${dateLong(v.passaporteValidade)}` : ''}` : '',
    ].filter(Boolean);
    const blocks: Block[] = [];
    if (str(v.destinatario)) blocks.push({ type: 'recipient', lines: [str(v.destinatario)] });
    blocks.push(
      { type: 'title', text: 'Declaração', subtitle: 'Ministro de culto' },
      {
        type: 'paragraph',
        id: 'declara',
        text: `A **${igreja}**${lic ? `, ${lic.charAt(0).toLowerCase()}${semPonto(lic.slice(1))},` : ''} representada por ${or(v.assinanteNome)}, na qualidade de ${str(v.assinanteCargo) || 'Presidente'}, declara que **${or(v.nome)}**${id.length ? `, ${id.join(', ')},` : ''} é ${funcao} desta Igreja${str(v.ordenacao) ? `, ${f ? 'ordenada' : 'ordenado'} em ${semPonto(v.ordenacao)}` : ''}${str(v.igrejaOrigem) ? `, ao serviço da ${semPonto(v.igrejaOrigem)}` : ''}.`,
        en: `The church declares that ${v.nome || '___'}${v.nacionalidade ? `, a ${v.nacionalidade} national` : ''}${v.passaporte ? `, passport no. ${v.passaporte}` : ''}, is a ${funcao} of this church.`,
      },
    );
    if (v.finalidade === 'entrada') {
      const enc = v.encargos === 'origem' ? `pela ${semPonto(v.igrejaOrigem) || 'igreja de origem'}` : v.encargos === 'proprio' ? `${f ? 'pela própria' : 'pelo próprio'}` : 'por esta Igreja';
      blocks.push(
        {
          type: 'paragraph',
          id: 'missao',
          text: `${f ? 'A referida' : 'O referido'} ${funcao} vem exercer em Moçambique actividade de natureza religiosa${str(v.actividades) ? `, designadamente ${semPonto(v.actividades)}` : ''}${str(v.localMissao) ? `, ${emLocal(v.localMissao)}` : ''}${str(v.periodo) ? `, pelo período de ${semPonto(v.periodo).replace(/^(de|por)\s+/i, '')}` : ''}, a convite e sob a responsabilidade desta Igreja.`,
          en: `The ${funcao} comes to Mozambique for religious work${v.actividades ? ` (${v.actividades})` : ''}${v.localMissao ? ` in ${v.localMissao}` : ''}${v.periodo ? ` for ${v.periodo}` : ''}, invited by and under the responsibility of this church.`,
        },
        {
          type: 'paragraph',
          id: 'responsabilidade',
          text: `O alojamento, a alimentação e as demais despesas de estadia são suportados ${enc}. Esta Igreja compromete-se a velar pelo cumprimento das leis moçambicanas e das condições do visto e, sendo necessário, a assegurar o regresso ${f ? 'da interessada' : 'do interessado'} ao país de origem.`,
          en: `Housing, food and other costs are paid ${v.encargos === 'origem' ? 'by the sending church' : v.encargos === 'proprio' ? 'by the person' : 'by this church'}. The church will ensure compliance with Mozambican law and the visa conditions and, if needed, the person’s return home.`,
        },
      );
    } else if (v.finalidade === 'viagem') {
      blocks.push({
        type: 'paragraph',
        id: 'viagem',
        text: `${f ? 'A referida' : 'O referido'} ${funcao} desloca-se ao estrangeiro em representação desta Igreja${str(v.eventoViagem) ? `, para participar em ${semPonto(v.eventoViagem)}` : ''}, regressando a Moçambique no fim da deslocação para retomar as suas funções.`,
        en: `The ${funcao} travels abroad on behalf of this church${v.eventoViagem ? ` to attend ${v.eventoViagem}` : ''} and will return to resume their duties.`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Por ser verdade, passa-se a presente declaração, que vai assinada e autenticada com o carimbo em uso nesta Igreja.', en: 'Issued as true, signed and stamped by the church.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: 'Pela Igreja', name: str(v.assinanteNome) || undefined, detail: str(v.assinanteCargo) || undefined, image: 'both' }] },
    );
    if (v.reconhecimento) blocks.push({ type: 'box', label: 'Reconhecimento notarial da assinatura', lines: 3, dashed: true });
    return blocks;
  },
});
