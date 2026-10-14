import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, localField, placeDate } from './_shared';
import { entidadeNome, juntar, str } from './_associacoes';

// Certificado de casamento religioso: a religious and commemorative record
// (A4 landscape, framed). For civil purposes the marriage is proved by the
// civil registry after transcription; the page always says so.

const NOTA =
  'Certificado de natureza religiosa. Para efeitos civis, o casamento prova-se pela certidão emitida pela Conservatória do Registo Civil, após a transcrição do casamento religioso nos termos da Lei da Família.';

export default defineTemplate({
  id: 'certificado-casamento-religioso',
  family: 'declaracao',
  page: 'A4-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'noivos', title: l('Noivos', 'Couple') },
    { id: 'cerimonia', title: l('Cerimónia', 'Ceremony') },
    { id: 'registo', title: l('Registo civil e assinaturas', 'Civil registry and signatures') },
  ],
  fields: [
    { name: 'noivo', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Nome do noivo', 'Groom’s name') },
    { name: 'noiva', type: 'text', section: 'noivos', width: 'half', required: true, label: l('Nome da noiva', 'Bride’s name') },
    { name: 'igreja', type: 'text', section: 'cerimonia', label: l('Igreja / paróquia', 'Church / parish'), default: (c) => c.profile?.firma ?? '' },
    { name: 'dataCasamento', type: 'date', section: 'cerimonia', width: 'half', required: true, label: l('Data do casamento', 'Wedding date'), default: (c) => c.today },
    localField('cerimonia'),
    { name: 'ministro', type: 'text', section: 'cerimonia', width: 'half', required: true, label: l('Ministro que celebrou', 'Officiating minister'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'ministroTitulo', type: 'text', section: 'cerimonia', width: 'half', label: l('Título', 'Title'), default: 'Pastor' },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'cerimonia',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [{ name: 'nome', type: 'text', label: l('Nome', 'Name') }],
      default: [{ nome: '' }, { nome: '' }],
    },
    { name: 'versiculo', type: 'text', section: 'cerimonia', label: l('Versículo (opcional)', 'Bible verse (optional)'), placeholder: l('Ex.: «Portanto, o que Deus ajuntou não o separe o homem.» (Marcos 10:9)', 'E.g. Mark 10:9') },
    {
      name: 'certificadoCapacidade',
      type: 'text',
      section: 'registo',
      width: 'half',
      label: l('Certificado de capacidade matrimonial n.º', 'Certificate of capacity no.'),
      legal: l('Sem o processo preliminar no Registo Civil, o casamento religioso não produz efeitos civis.', 'Without the preliminary process at the civil registry the religious marriage has no civil effect.'),
    },
    { name: 'conservatoria', type: 'text', section: 'registo', width: 'half', label: l('Conservatória do Registo Civil de', 'Civil Registry of'), placeholder: l('Ex.: Maputo — 1.ª Conservatória', 'E.g. Maputo') },
    { name: 'livro', type: 'text', section: 'registo', width: 'third', label: l('Livro n.º (igreja)', 'Church book no.') },
    { name: 'folhas', type: 'text', section: 'registo', width: 'third', label: l('Folhas', 'Page') },
    { name: 'data', type: 'date', section: 'registo', width: 'third', label: l('Data de emissão', 'Issue date'), default: (c) => c.today },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const igreja = str(v.igreja) || entidadeNome(ctx);
    const test = lineItems(v.testemunhas).map((r) => str(r.nome)).filter(Boolean);
    const tit = str(v.ministroTitulo) || 'Pastor';
    const cap = str(v.certificadoCapacidade)
      ? `, precedido do processo preliminar na Conservatória do Registo Civil${str(v.conservatoria) ? ` de ${str(v.conservatoria)}` : ''} (certificado de capacidade matrimonial n.º ${str(v.certificadoCapacidade)})`
      : '';
    const reg = [str(v.livro) ? `Livro n.º ${str(v.livro)}` : '', str(v.folhas) ? `folhas ${str(v.folhas)}` : ''].filter(Boolean).join(', ');
    const blocks: Block[] = [
      { type: 'logo', size: 'sm' },
      { type: 'display', text: igreja, size: 'xs', uppercase: true, weight: 'bold', tone: 'accent', fit: true, after: 2 },
      { type: 'display', text: 'Certificado de Casamento', size: 'xxl', weight: 'bold', after: 2 },
      { type: 'ornament', style: 'cross' },
      { type: 'display', text: 'Certificamos que', size: 'sm', italic: true, tone: 'muted', after: 4 },
      { type: 'display', text: `${str(v.noivo) || '____________________'}  &  ${str(v.noiva) || '____________________'}`, size: 'xl', weight: 'bold', fit: true, after: 6 },
      {
        type: 'display',
        text: `contraíram matrimónio religioso no dia ${dateLong(v.dataCasamento)}, na ${igreja}${str(v.local) ? `, em ${str(v.local)}` : ''}, perante o ${tit} ${str(v.ministro) || BLANK}${test.length ? `, sendo testemunhas ${juntar(test)}` : ''}${cap}.`,
        size: 'md',
        after: 4,
      },
    ];
    if (str(v.versiculo)) blocks.push({ type: 'display', text: str(v.versiculo), size: 'sm', italic: true, tone: 'muted', after: 6 });
    blocks.push(
      {
        type: 'signatures',
        columns: [
          { role: 'O Noivo', name: str(v.noivo) || undefined },
          { role: 'A Noiva', name: str(v.noiva) || undefined },
        ],
      },
      {
        type: 'signatures',
        columns: [
          { role: `O ${tit}`, name: str(v.ministro) || undefined, image: 'both' },
          { role: '1.ª Testemunha', name: test[0] || undefined },
          { role: '2.ª Testemunha', name: test[1] || undefined },
        ],
      },
      { type: 'display', text: [placeDate(ctx, v.data), reg].filter(Boolean).join('   ·   '), size: 'xs', tone: 'muted', after: 2 },
      { type: 'display', text: NOTA, size: 'xs', italic: true, tone: 'muted', after: 0 },
    );
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.certificadoCapacidade)) {
      w.push({
        level: 'warning',
        field: 'certificadoCapacidade',
        message: l(
          `Sem o processo preliminar na Conservatória do Registo Civil e a transcrição, este casamento não produz efeitos civis (${cite('assocCasamentoReligioso')}).`,
          'Without the preliminary process at the civil registry and transcription, this marriage has no civil effect.',
        ),
      });
    }
    w.push({ level: 'info', message: l('O certificado leva sempre a nota de que não substitui a certidão do Registo Civil.', 'The certificate always states that it does not replace the civil registry certificate.') });
    return w;
  },
  personName: (v) => [str(v.noivo), str(v.noiva)].filter(Boolean).join(' e ') || undefined,
  documentDate: (v) => str(v.dataCasamento) || undefined,
});
