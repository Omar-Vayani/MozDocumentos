import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, l, localField, refField } from './_shared';
import { entidadeNome, pessoaFields, semPonto, str } from './_associacoes';

// Carta de transferência (or recommendation / release) of a church member to
// another congregation. Neutral wording: no disciplinary details.

const TIPO_OPTIONS = [
  { value: 'transferencia', label: l('Transferência', 'Transfer') },
  { value: 'recomendacao', label: l('Recomendação (visita ou estadia temporária)', 'Recommendation (temporary stay)') },
  { value: 'desvinculacao', label: l('Desvinculação', 'Release') },
];

export default defineTemplate({
  id: 'carta-transferencia-membro',
  family: 'carta',
  sections: [
    { id: 'carta', title: l('Carta', 'Letter') },
    { id: 'membro', title: l('Membro', 'Member'), personRole: 'outro' },
    { id: 'documento', title: l('Data e assinaturas', 'Date and signatures') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'carta', width: 'half', required: true, label: l('Tipo de carta', 'Type of letter'), options: TIPO_OPTIONS, default: 'transferencia' },
    refField('carta'),
    { name: 'igrejaDestino', type: 'text', section: 'carta', label: l('Igreja ou congregação de destino', 'Receiving church'), showIf: (v) => v.tipo !== 'desvinculacao' },
    { name: 'enderecoDestino', type: 'text', section: 'carta', label: l('Endereço / cidade de destino', 'Address / city'), showIf: (v) => v.tipo !== 'desvinculacao' },
    { name: 'saudacaoReligiosa', type: 'toggle', section: 'carta', label: l('Usar saudação cristã («Amados irmãos em Cristo»)', 'Use Christian greeting'), default: true },
    ...pessoaFields('membro', 'membro', ['nome', 'genero', 'doc']),
    { name: 'membroDesde', type: 'date', section: 'membro', width: 'half', label: l('Membro desde', 'Member since') },
    { name: 'baptismoData', type: 'date', section: 'membro', width: 'half', label: l('Data do baptismo (opcional)', 'Baptism date (optional)') },
    { name: 'baptismoLocal', type: 'text', section: 'membro', width: 'half', label: l('Local do baptismo (opcional)', 'Baptism place (optional)') },
    { name: 'cargo', type: 'text', section: 'membro', width: 'half', label: l('Ministério ou cargo exercido (opcional)', 'Ministry or office held (optional)'), placeholder: l('Ex.: diácono, membro do coro', 'E.g. deacon, choir member') },
    { name: 'motivo', type: 'text', section: 'membro', label: l('Motivo', 'Reason'), default: 'ter fixado residência noutra localidade' },
    localField(),
    dateField(),
    { name: 'pastorNome', type: 'text', section: 'documento', width: 'half', label: l('Pastor / responsável', 'Pastor / minister'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'pastorCargo', type: 'text', section: 'documento', width: 'half', label: l('Título', 'Title'), default: (c) => c.profile?.representanteCargo || 'O Pastor' },
    { name: 'secretarioNome', type: 'text', section: 'documento', width: 'half', label: l('Secretário(a) (opcional)', 'Secretary (optional)') },
    { name: 'canhoto', type: 'toggle', section: 'documento', label: l('Talão de confirmação de recepção (destacável)', 'Tear-off receipt slip'), default: true, showIf: (v) => v.tipo === 'transferencia' },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.membroGenero === 'F';
    const irmao = f ? 'a irmã' : 'o irmão';
    const Irmao = f ? 'A irmã' : 'O irmão';
    const nome = str(v.membroNome) || BLANK;
    const igreja = entidadeNome(ctx);
    const cristo = v.saudacaoReligiosa !== false;
    const doc = str(v.membroDocNumero) ? `, ${f ? 'portadora' : 'portador'} do ${str(v.membroDocTipo) || 'BI'} n.º ${str(v.membroDocNumero)}` : '';
    const historia = [
      str(v.membroDesde) ? `é membro desta igreja desde ${dateLong(v.membroDesde)}` : 'é membro desta igreja',
      str(v.baptismoData) ? `, tendo sido ${f ? 'baptizada' : 'baptizado'} em ${dateLong(v.baptismoData)}${str(v.baptismoLocal) ? `, em ${str(v.baptismoLocal)}` : ''}` : '',
      str(v.cargo) ? `, e exerceu o ministério de ${semPonto(v.cargo)}` : '',
    ].join('');
    const destino = str(v.igrejaDestino);
    const titulo = v.tipo === 'recomendacao' ? 'recomendação' : v.tipo === 'desvinculacao' ? 'desvinculação' : 'transferência';

    const blocks: Block[] = [{ type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: v.data }];
    if (v.tipo !== 'desvinculacao') {
      blocks.push({ type: 'recipient', salutation: 'À', lines: [destino || BLANK, ...(str(v.enderecoDestino) ? [str(v.enderecoDestino)] : [])] });
    }
    blocks.push(
      { type: 'subject', text: `Carta de ${titulo} ${f ? 'da irmã' : 'do irmão'} ${nome}` },
      { type: 'salutation', text: cristo ? 'Amados irmãos em Cristo,' : 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `A **${igreja}** certifica que ${irmao} **${nome}**${doc}, ${historia}.`,
        en: 'The church certifies that the person named is a member, with the dates stated.',
      },
    );
    if (v.tipo === 'transferencia') {
      blocks.push(
        {
          type: 'paragraph',
          id: 'comunhao',
          text: `${Irmao} ${nome} encontra-se em plena comunhão com esta igreja e não tem qualquer impedimento disciplinar. Por ${semPonto(v.motivo) || 'motivos pessoais'}, pediu a transferência da sua membresia para essa igreja, pelo que ${f ? 'a' : 'o'} recomendamos ao vosso acolhimento e cuidado pastoral.`,
          en: 'The member is in full communion, has no disciplinary impediment and asked to transfer; we commend them to your care.',
        },
        {
          type: 'paragraph',
          id: 'rol',
          text: `Com a recepção desta carta, ${irmao} deixa de constar do rol de membros desta igreja. Agradecemos a confirmação da recepção, devolvendo o talão abaixo.`,
          en: 'On receipt the member is removed from our roll; please confirm by returning the slip below.',
        },
      );
    } else if (v.tipo === 'recomendacao') {
      blocks.push({
        type: 'paragraph',
        id: 'recomendacao',
        text: `${Irmao} ${nome} encontra-se em plena comunhão com esta igreja. Por ${semPonto(v.motivo) || 'motivos pessoais'}, permanecerá por algum tempo nessa localidade, pelo que ${f ? 'a' : 'o'} recomendamos ao vosso acolhimento, continuando a ser membro desta igreja.`,
        en: 'The member is in full communion and will stay in your area for a time; we commend them to you; they remain our member.',
      });
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'desvinculacao',
        text: `A pedido ${f ? 'da interessada' : 'do interessado'}, por ${semPonto(v.motivo) || 'motivos pessoais'}, ${irmao} ${nome} deixa, a partir desta data, de ser membro desta igreja, não existindo qualquer obrigação pendente entre as partes.`,
        en: 'At the member’s request, they cease to be a member from this date, with no outstanding obligations.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: cristo ? 'Na graça de Cristo,' : 'Com os melhores cumprimentos,', en: 'Closing.', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          { role: str(v.pastorCargo) || 'O Pastor', name: str(v.pastorNome) || undefined, image: 'both' },
          ...(str(v.secretarioNome) ? [{ role: 'O(A) Secretário(a)', name: str(v.secretarioNome) }] : []),
        ],
      },
    );
    if (v.tipo === 'transferencia' && v.canhoto !== false) {
      blocks.push({
        type: 'box',
        label: 'Confirmação de recepção',
        cut: true,
        text: `A ${destino || '____________________'} confirma a recepção ${f ? 'da irmã' : 'do irmão'} ${nome} como membro, em ___/___/______.\nO Pastor: ______________________________          (carimbo)`,
      });
    }
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.membroNome)) w.push({ level: 'warning', field: 'membroNome', message: l('Indique o nome do membro.', 'Enter the member’s name.') });
    if (v.tipo !== 'desvinculacao' && !str(v.igrejaDestino)) w.push({ level: 'warning', field: 'igrejaDestino', message: l('Indique a igreja de destino.', 'Enter the receiving church.') });
    w.push({ level: 'info', message: l('Não inclua detalhes disciplinares ou de saúde: a carta circula entre igrejas.', 'Do not include disciplinary or health details: the letter is shared between churches.') });
    return w;
  },
  personName: (v) => str(v.membroNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
