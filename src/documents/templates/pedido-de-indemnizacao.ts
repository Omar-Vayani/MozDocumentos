import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, l, lineItems, localField, money, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  daysBetween,
  endDot,
  envioBlock,
  envioField,
  eu,
  isEmpresa,
  opt,
  reciboBlock,
  reciboField,
  senderBlock,
  str,
} from './_cidadao';

const TIPOS = [
  opt('via', 'Buraco, obra ou falta de sinalização na via pública', 'Pothole, roadworks or missing signs'),
  opt('infiltracao', 'Infiltração ou inundação vinda do vizinho', 'Leak or flooding from a neighbour'),
  opt('obra', 'Danos causados por obra vizinha', 'Damage from neighbouring works'),
  opt('animal', 'Danos causados por um animal', 'Damage caused by an animal'),
  opt('viatura', 'Danos causados por uma viatura', 'Damage caused by a vehicle'),
  opt('servico', 'Danos causados por um prestador de serviços', 'Damage caused by a service provider'),
  opt('outro', 'Outro facto', 'Other'),
];
const CAUSA: Record<string, string> = {
  via: 'do mau estado e da falta de sinalização da via, cuja conservação é da vossa responsabilidade',
  infiltracao: 'de infiltrações de água provenientes do vosso imóvel',
  obra: 'das obras realizadas no vosso imóvel',
  animal: 'de um animal à vossa guarda',
  viatura: 'de uma viatura vossa ou conduzida sob a vossa responsabilidade',
  servico: 'da forma como foi executado o serviço que vos foi contratado',
  outro: 'de facto que vos é imputável',
};

export default defineTemplate({
  id: 'pedido-de-indemnizacao',
  sections: [
    { id: 'autor', title: l('Lesado', 'Injured party'), personRole: 'outro' },
    { id: 'destinatario', title: l('Responsável', 'Person responsible') },
    { id: 'facto', title: l('O que aconteceu', 'What happened') },
    { id: 'danos', title: l('Danos', 'Losses') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'destinatario', type: 'text', section: 'destinatario', required: true, label: l('Pessoa ou entidade responsável', 'Responsible person or body'), placeholder: l('Ex.: Conselho Municipal da Cidade da Matola', 'E.g. the municipality') },
    { name: 'destinatarioAc', type: 'text', section: 'destinatario', label: l('À atenção de (opcional)', 'Attention of (optional)') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Endereço', 'Address') },
    { name: 'tipo', type: 'select', section: 'facto', label: l('Tipo de facto', 'Kind of event'), options: TIPOS, default: 'via' },
    { name: 'dataFacto', type: 'date', section: 'facto', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'localFacto', type: 'text', section: 'facto', width: 'half', label: l('Local', 'Place') },
    { name: 'factos', type: 'textarea', section: 'facto', required: true, rows: 5, label: l('Factos', 'Facts'), help: l('Por ordem: o que aconteceu, porque é culpa do destinatário, testemunhas, participação à polícia.', 'In order: what happened, why it is the recipient’s fault, witnesses, police report.') },
    { name: 'participacao', type: 'text', section: 'facto', width: 'half', label: l('Participação policial n.º (opcional)', 'Police report no. (optional)') },
    {
      name: 'danos',
      type: 'lines',
      section: 'danos',
      label: l('Danos', 'Losses'),
      addLabel: l('Adicionar dano', 'Add loss'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Substituição de pneu e jante dianteiros', 'E.g. new tyre and rim') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [],
    },
    { name: 'prazo', type: 'number', section: 'danos', width: 'half', min: 1, max: 90, default: 15, label: l('Prazo para pagar (dias)', 'Days to pay') },
    { name: 'conta', type: 'text', section: 'danos', label: l('Conta ou NIB para pagamento', 'Account for payment') },
    anexosField('danos', l('Ex.: Fotografias, orçamento da oficina, participação policial', 'E.g. photos, repair quote, police report')),
    localField('documento'),
    dateField('data'),
    envioField('documento', 'registada'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.destinatario)) w.push({ level: 'warning', field: 'destinatario', message: l('Indique quem é o responsável.', 'State who is responsible.') });
    if (!lineItems(v.danos).some((r) => str(r.descricao))) w.push({ level: 'warning', field: 'danos', message: l('Liste os danos e o valor de cada um; junte orçamentos ou facturas.', 'List the losses with values and attach quotes or invoices.') });
    const anos = ctx.legal.value<{ anos: number }>('cidPrescricaoIndemnizacao').anos;
    const d = daysBetween(v.dataFacto, v.data);
    if (d != null && d > anos * 365 - 60) w.push({ level: 'warning', field: 'dataFacto', message: l(`O direito de indemnização prescreve em ${anos} anos a contar do conhecimento do dano (${cite('cidPrescricaoIndemnizacao')}). Fale já com um advogado.`, `The claim is time-barred ${anos} years after you learned of the damage. See a lawyer now.`) });
    w.push({ level: 'info', field: 'factos', message: l(`Quem, com culpa, causa danos a outrem deve indemnizá-lo (${cite('cidResponsabilidadeCivil')}). Nos acidentes de viação, participe também à seguradora; nos danos eléctricos causados pela rede, use a «Reclamação à EDM».`, 'Whoever negligently causes damage must compensate. For road accidents also notify the insurer; for electrical damage use the complaint to the power company.') });
    return w;
  },

  personName: (v) => v.destinatario,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const factos = splitLines(v.factos);
    const danos = lineItems(v.danos).filter((r) => str(r.descricao));
    const total = danos.reduce((a, r) => a + (money(r.valor) ?? 0), 0);
    const prazo = Number(v.prazo) > 0 ? Math.round(Number(v.prazo)) : 15;
    const causa = CAUSA[String(v.tipo)] ?? CAUSA.outro;
    const quem = isEmpresa(ctx) ? `a **${profileDisplayName(ctx.profile)}** sofreu` : 'sofri';

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.destinatario) || BLANK, str(v.destinatarioAc) ? `A/C: ${str(v.destinatarioAc)}` : '', str(v.destinatarioMorada)].filter(Boolean) },
      { type: 'subject', text: `Pedido de indemnização por danos${v.dataFacto ? ` — ${dateLong(v.dataFacto)}` : ''}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Em ${dateLong(v.dataFacto)}${str(v.localFacto) ? `, ${/^(no|na|em)\s/i.test(str(v.localFacto)) ? '' : 'em '}${str(v.localFacto)}` : ''}, ${quem} danos em consequência ${causa}, nos termos seguintes:`,
        en: 'On the date stated I suffered damage caused by you, as follows:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: [...(factos.length ? factos.map(endDot) : [BLANK, BLANK]), ...(str(v.participacao) ? [`Os factos foram participados à polícia (participação n.º ${str(v.participacao)}).`] : [])] },
    ];
    if (danos.length) {
      blocks.push(
        { type: 'paragraph', id: 'danosIntro', text: `Os danos sofridos são os seguintes${total > 0 ? `, no total de **${formatMoney(total)}**` : ''}:`, en: 'The losses are:', keepWithNext: true },
        { type: 'list', style: 'bullet', items: danos.map((r) => `${str(r.descricao)}${money(r.valor) != null ? ` — ${formatMoney(money(r.valor)!)}` : ''}`) },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Sendo da vossa responsabilidade a reparação desses danos, ${eu(ctx, 'solicito', 'solicitamos')} o pagamento da indemnização de **${total > 0 ? formatMoney(total) : `${BLANK} MT`}**, no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'} a contar da recepção desta carta${str(v.conta) ? `, por transferência para ${str(v.conta)}` : ''}, ou a reparação dos danos a vosso cargo, em data a combinar.`,
        en: `As you are liable, payment of the compensation within ${prazo} day(s), or repair at your cost, is requested.`,
      },
      {
        type: 'paragraph',
        id: 'mora',
        text: `Na falta de pagamento ou de resposta nesse prazo, ${eu(ctx, 'recorrerei', 'recorreremos')} aos meios judiciais para obter a indemnização, acrescida de juros e das despesas que vier a suportar.`,
        en: 'Failing payment or reply, court action will follow for damages plus interest and costs.',
      },
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Lesado', 'A Lesada')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});

