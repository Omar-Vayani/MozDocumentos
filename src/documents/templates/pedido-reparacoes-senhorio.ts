// Pedido de reparações ao senhorio: the tenant reports defects in the leased
// property that are the landlord's responsibility and asks for repairs by a
// date. Keeps a written record before any urgent repair the tenant may make.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import { partyName, partyWarnings } from './_contratos';
import {
  arrendamentoFields, assinaturaCarta, contratoTexto, destinatarioLinhas, papeisArrendamento, partyFieldsWhen, remetenteBlock, saudacaoParte, semPonto, str,
} from './_familia';

export default defineTemplate({
  id: 'pedido-reparacoes-senhorio',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'inquilino', title: l('Inquilino (quem escreve)', 'Tenant (sender)'), personRole: 'inquilino' },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), personRole: 'senhorio' },
    { id: 'contrato', title: l('Contrato e imóvel', 'Lease and property') },
    { id: 'avarias', title: l('Avarias e pedido', 'Defects and request') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da carta', 'Date of the letter')),
    { name: 'telefone', type: 'tel', section: 'documento', width: 'half', label: l('Telefone do inquilino', 'Tenant’s phone'), default: (c) => c.profile?.telefones || '' },
    ...partyFieldsWhen('inquilino', ['pessoa', 'empresa']),
    ...partyFieldsWhen('senhorio', []),
    ...arrendamentoFields('contrato'),
    {
      name: 'avarias',
      type: 'lines',
      section: 'avarias',
      required: true,
      label: l('Avarias ou defeitos', 'Defects'),
      addLabel: l('Adicionar avaria', 'Add defect'),
      columns: [
        { name: 'local', type: 'text', label: l('Onde', 'Where'), placeholder: l('Ex.: casa de banho', 'E.g. bathroom') },
        { name: 'descricao', type: 'text', label: l('O que se passa', 'What is wrong'), placeholder: l('Ex.: infiltração de água no tecto', 'E.g. water leak in the ceiling') },
        { name: 'desde', type: 'date', label: l('Desde', 'Since') },
      ],
      default: [{ local: '', descricao: '', desde: '' }],
    },
    { name: 'urgente', type: 'toggle', section: 'avarias', label: l('É urgente (risco para pessoas, bens ou para o próprio imóvel)', 'Urgent (risk to people, belongings or the building)') },
    { name: 'prazo', type: 'date', section: 'avarias', width: 'half', label: l('Reparar até', 'Repair by') },
    { name: 'contactosAnteriores', type: 'text', section: 'avarias', label: l('Avisos anteriores (opcional)', 'Earlier notices (optional)'), placeholder: l('Ex.: telefonema de 2 de Setembro e mensagem de 15 de Setembro', 'E.g. phone call on 2 September and message on 15 September') },
    { name: 'fotografias', type: 'toggle', section: 'avarias', default: true, label: l('Junta fotografias', 'Photos enclosed') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'inquilino', 'inquilino', 'tenant'), ...partyWarnings(v, 'senhorio', 'senhorio', 'landlord')];
    if (!lineItems(v.avarias).some((r) => str(r.descricao))) w.push({ level: 'error', field: 'avarias', message: l('Descreva as avarias.', 'Describe the defects.') });
    w.push({
      level: 'info',
      message: l(
        `As reparações de conservação do imóvel cabem ao senhorio; as pequenas reparações do uso normal cabem ao inquilino (${cite('famObrigacoesLocador')}). Não deixe de pagar a renda por causa das avarias: pode dar motivo a despejo. Se a reparação for urgente e o senhorio não a fizer, guarde facturas e consulte um jurista antes de a descontar.`,
        'Maintenance repairs are the landlord’s; small repairs from normal use are the tenant’s. Do not withhold rent because of defects: it may justify eviction. If an urgent repair is not done, keep invoices and get legal advice before deducting it.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'senhorio') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const { S, I } = papeisArrendamento(v);
    const avarias = lineItems(v.avarias).filter((r) => str(r.descricao));
    const itens = (avarias.length ? avarias : [{ local: '', descricao: '____________________', desde: '' }]).map(
      (r, i, a) => `${str(r.local) ? `${semPonto(r.local)}: ` : ''}${semPonto(r.descricao)}${str(r.desde) ? `, desde ${dateLong(r.desde)}` : ''}${i === a.length - 1 ? '.' : ';'}`,
    );
    const anteriores = semPonto(v.contactosAnteriores);

    const blocks: Block[] = [
      ...remetenteBlock(ctx, 'inquilino', v.telefone),
      ...(v.urgente ? [{ type: 'tags' as const, items: ['URGENTE'] }] : []),
      { type: 'reference', ref: undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: saudacaoParte(v, 'senhorio'), lines: destinatarioLinhas(v, 'senhorio') },
      { type: 'subject', text: 'Pedido de reparações no imóvel arrendado' },
      { type: 'salutation', text: `${saudacaoParte(v, 'senhorio')},` },
      {
        type: 'paragraph',
        id: 'factos',
        text: `Na qualidade de ${I.n.toLowerCase()}, e no âmbito ${contratoTexto(v, 'do')}, comunico a V. Ex.ª que o imóvel apresenta as seguintes avarias, que não resultam de uso indevido e cuja reparação cabe ${S.ao}:`,
        en: 'As tenant, I report the following defects in the property, which are not caused by misuse and are for the landlord to repair:',
      },
      { type: 'list', style: 'alpha', items: itens },
    ];
    if (anteriores) {
      blocks.push({ type: 'paragraph', id: 'anteriores', text: `Estas avarias já foram comunicadas a V. Ex.ª anteriormente (${anteriores}), sem que tenham sido reparadas.`, en: 'These defects were reported before and have not been repaired.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Assim, solicito a V. Ex.ª que proceda à sua reparação ${str(v.prazo) ? `até ${dateLong(v.prazo)}` : 'com a maior brevidade'}${v.urgente ? ', atendendo à urgência da situação e ao risco de agravamento dos danos' : ''}, combinando comigo o dia e a hora de acesso ao imóvel.`,
      en: `I ask you to repair them ${v.prazo ? `by ${v.prazo}` : 'as soon as possible'}${v.urgente ? ', given the urgency' : ''}, arranging access with me.`,
    });
    if (v.urgente) {
      blocks.push({
        type: 'paragraph',
        id: 'urgente',
        text: 'Caso a reparação não seja feita no prazo indicado, reservo-me o direito de a mandar executar, nos termos da lei, e de exigir o reembolso das despesas, mediante apresentação das respectivas facturas.',
        en: 'If the repair is not done in time, I reserve the right to have it done as the law allows and to claim the cost against invoices.',
      });
    }
    if (v.fotografias) blocks.push({ type: 'paragraph', id: 'anexos', text: 'Junto fotografias das avarias.', en: 'Photos of the defects are enclosed.' });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [assinaturaCarta(ctx, 'inquilino', I)] },
      { type: 'acknowledgement', text: 'Recebi o original desta carta em ___/___/______', signer: S.O },
    );
    return blocks;
  },
});
