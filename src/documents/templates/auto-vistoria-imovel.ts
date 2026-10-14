// Auto de entrega e vistoria do imóvel arrendado: joint record of the state of
// the property, keys, meter readings and inventory when the tenant moves in or
// out. At move-out it also settles damages to deduct from the deposit.

import { formatDateShort, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, isF, l, lineItems, localField, money, splitLines, workerFields } from './_shared';
import { valorTexto } from './_contratos';
import { semPonto, str } from './_familia';

const ESTADO_OPTIONS = [
  { value: 'bom', label: l('Bom', 'Good') },
  { value: 'razoável', label: l('Razoável', 'Fair') },
  { value: 'mau', label: l('Mau / danificado', 'Poor / damaged') },
  { value: 'n/a', label: l('Não se aplica', 'Not applicable') },
];

const DIVISOES_DEFAULT = [
  { local: 'Entrada e sala', estado: 'bom', obs: '' },
  { local: 'Cozinha (bancada, lava-loiça, armários)', estado: 'bom', obs: '' },
  { local: 'Quartos', estado: 'bom', obs: '' },
  { local: 'Casa(s) de banho (loiças, torneiras, autoclismo)', estado: 'bom', obs: '' },
  { local: 'Portas, janelas, fechaduras e vidros', estado: 'bom', obs: '' },
  { local: 'Paredes, tectos e pintura', estado: 'bom', obs: '' },
  { local: 'Pavimentos', estado: 'bom', obs: '' },
  { local: 'Instalação eléctrica (tomadas, interruptores, lâmpadas)', estado: 'bom', obs: '' },
  { local: 'Canalização e esgotos', estado: 'bom', obs: '' },
  { local: 'Quintal, muro e portão', estado: 'n/a', obs: '' },
];

/** "Bom", "Razoável", "Mau"; "—" when not applicable. */
const estadoTxt = (e: unknown) => {
  const t = str(e);
  return t === 'n/a' ? '—' : t.charAt(0).toUpperCase() + t.slice(1);
};

const pessoaCurta = (v: Values, p: string) => {
  const nome = str(v[`${p}Nome`]);
  const doc = str(v[`${p}DocNumero`]);
  const f = isF(v[`${p}Genero`]);
  return `**${nome || BLANK}**${doc ? `, ${f ? 'portadora' : 'portador'} do ${str(v[`${p}DocTipo`]) === 'Passaporte' ? 'Passaporte' : str(v[`${p}DocTipo`]) === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade'} n.º ${doc}` : ''}`;
};

export default defineTemplate({
  id: 'auto-vistoria-imovel',
  family: 'acta',
  sections: [
    { id: 'documento', title: l('Vistoria', 'Inspection') },
    { id: 'senhorio', title: l('Senhorio', 'Landlord'), personRole: 'senhorio' },
    { id: 'inquilino', title: l('Inquilino', 'Tenant'), personRole: 'inquilino' },
    { id: 'imovel', title: l('Imóvel, chaves e contadores', 'Property, keys and meters') },
    { id: 'estado', title: l('Estado das divisões', 'Condition of the rooms') },
    { id: 'inventario', title: l('Inventário (mobília e equipamento)', 'Inventory (furniture and equipment)') },
    { id: 'saida', title: l('Danos e caução (na saída)', 'Damage and deposit (move-out)') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      required: true,
      label: l('Momento', 'Stage'),
      options: [
        { value: 'entrada', label: l('Entrada — entrega do imóvel ao inquilino', 'Move-in — hand-over to the tenant') },
        { value: 'saida', label: l('Saída — restituição do imóvel ao senhorio', 'Move-out — return to the landlord') },
      ],
      default: 'entrada',
    },
    localField(),
    dateField('data', 'documento', l('Data da vistoria', 'Date of the inspection')),
    { name: 'hora', type: 'text', section: 'documento', width: 'half', label: l('Hora (opcional)', 'Time (optional)'), placeholder: l('Ex.: 10h00', 'E.g. 10:00') },
    ...workerFields(['nome', 'genero', 'docTipo', 'docNumero'], 'senhorio', 'senhorio').map((f) => ({
      ...f,
      default: f.name === 'senhorioNome' ? (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : '') : f.default,
    })),
    {
      name: 'senhorioRepresentante',
      type: 'text',
      section: 'senhorio',
      label: l('Em representação de (opcional)', 'On behalf of (optional)'),
      placeholder: l('Ex.: Imobiliária Polana, Lda, mediadora', 'E.g. letting agency'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || '' : ''),
    },
    ...workerFields(['nome', 'genero', 'docTipo', 'docNumero'], 'inquilino', 'inquilino'),
    {
      name: 'imovelMorada',
      type: 'text',
      section: 'imovel',
      required: true,
      label: l('Morada do imóvel', 'Property address'),
    },
    { name: 'contratoData', type: 'date', section: 'imovel', width: 'half', label: l('Data do contrato de arrendamento', 'Date of the lease') },
    {
      name: 'chaves',
      type: 'text',
      section: 'imovel',
      label: l('Chaves e comandos entregues', 'Keys and remotes handed over'),
      placeholder: l('Ex.: 2 chaves da porta principal, 1 do portão, 1 comando da garagem', 'E.g. 2 front door keys, 1 gate key, 1 garage remote'),
    },
    { name: 'energiaContador', type: 'text', section: 'imovel', width: 'half', label: l('Contador de energia (n.º)', 'Electricity meter no.') },
    { name: 'energiaLeitura', type: 'text', section: 'imovel', width: 'half', label: l('Leitura / saldo Credelec', 'Reading / prepaid balance') },
    { name: 'aguaContador', type: 'text', section: 'imovel', width: 'half', label: l('Contador de água (n.º)', 'Water meter no.') },
    { name: 'aguaLeitura', type: 'text', section: 'imovel', width: 'half', label: l('Leitura da água (m³)', 'Water reading (m³)') },
    {
      name: 'divisoes',
      type: 'lines',
      section: 'estado',
      label: l('Divisões e elementos', 'Rooms and items'),
      addLabel: l('Adicionar divisão ou elemento', 'Add room or item'),
      columns: [
        { name: 'local', type: 'text', label: l('Divisão / elemento', 'Room / item') },
        { name: 'estado', type: 'select', label: l('Estado', 'Condition'), options: ESTADO_OPTIONS },
        { name: 'obs', type: 'text', label: l('Observações', 'Notes'), placeholder: l('Ex.: mancha no tecto junto à janela', 'E.g. stain on the ceiling by the window') },
      ],
      default: DIVISOES_DEFAULT,
    },
    {
      name: 'fotografias',
      type: 'number',
      section: 'estado',
      width: 'half',
      min: 0,
      max: 500,
      label: l('Fotografias tiradas (n.º)', 'Photos taken (no.)'),
      help: l('Tire fotografias datadas de cada divisão e guarde-as: completam este auto.', 'Take dated photos of each room and keep them: they complete this record.'),
    },
    {
      name: 'inventario',
      type: 'lines',
      section: 'inventario',
      label: l('Mobília e equipamento', 'Furniture and equipment'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item'), placeholder: l('Ex.: Frigorífico Samsung', 'E.g. Samsung fridge') },
        { name: 'quantidade', type: 'number', label: l('Quant.', 'Qty'), min: 1 },
        { name: 'estado', type: 'select', label: l('Estado', 'Condition'), options: ESTADO_OPTIONS },
      ],
      default: [],
    },
    {
      name: 'danos',
      type: 'lines',
      section: 'saida',
      label: l('Danos a reparar por conta do inquilino', 'Damage charged to the tenant'),
      addLabel: l('Adicionar dano', 'Add damage'),
      help: l('Só danos além do desgaste normal de uma utilização prudente.', 'Only damage beyond normal wear and tear.'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Dano', 'Damage') },
        { name: 'valor', type: 'money', label: l('Custo (MT)', 'Cost (MT)') },
      ],
      default: [],
      showIf: (v) => v.tipo === 'saida',
    },
    { name: 'caucaoValor', type: 'money', section: 'saida', width: 'half', label: l('Caução entregue no início', 'Deposit paid at the start'), showIf: (v) => v.tipo === 'saida' },
    { name: 'dividas', type: 'money', section: 'saida', width: 'half', label: l('Rendas ou consumos em dívida', 'Unpaid rent or utilities'), showIf: (v) => v.tipo === 'saida' },
    {
      name: 'observacoes',
      type: 'textarea',
      section: 'saida',
      rows: 3,
      label: l('Observações e reservas das partes', 'Parties’ notes and reservations'),
      help: l('Uma por linha. Ex.: «O Inquilino não concorda com o dano n.º 2.»', 'One per line. E.g. “The Tenant disputes damage no. 2.”'),
    },
    { name: 'testemunhas', type: 'toggle', section: 'saida', label: l('Incluir assinatura de duas testemunhas', 'Include signatures of two witnesses') },
  ],

  computed: (v) => {
    const divisoes = lineItems(v.divisoes).filter((r) => str(r.local));
    const inventario = lineItems(v.inventario).filter((r) => str(r.item));
    const danos = v.tipo === 'saida' ? lineItems(v.danos).filter((r) => str(r.descricao)) : [];
    const totalDanos = roundMoney(danos.reduce((s, r) => s + (money(r.valor) ?? 0), 0));
    const caucao = money(v.caucaoValor);
    const dividas = money(v.dividas) ?? 0;
    const devolver = caucao != null ? roundMoney(caucao - totalDanos - dividas) : null;
    return { divisoes, inventario, danos, totalDanos, caucao, dividas, devolver };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!str(v.imovelMorada)) w.push({ level: 'error', field: 'imovelMorada', message: l('Indique a morada do imóvel.', 'Enter the property address.') });
    if (!str(v.senhorioNome) || !str(v.inquilinoNome)) w.push({ level: 'warning', field: 'inquilinoNome', message: l('Indique os nomes do senhorio e do inquilino.', 'Enter the landlord’s and tenant’s names.') });
    if (!c.divisoes.length) w.push({ level: 'warning', field: 'divisoes', message: l('Descreva o estado das divisões.', 'Describe the condition of the rooms.') });
    if (v.tipo === 'saida' && c.devolver != null && c.devolver < 0) {
      w.push({ level: 'warning', field: 'danos', message: l('Os danos e dívidas excedem a caução: o inquilino fica a dever a diferença.', 'Damage and debts exceed the deposit: the tenant owes the difference.') });
    }
    w.push({
      level: 'info',
      message: l(
        `Sem auto de entrada, presume-se que o imóvel foi entregue em bom estado (${cite('famRestituicaoImovel')}). Assinem os dois, com data, e guardem fotografias.`,
        'Without a move-in record, the property is presumed to have been handed over in good condition. Both should sign and date it, and keep photos.',
      ),
    });
    return w;
  },

  personName: (v) => v.inquilinoNome || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const saida = v.tipo === 'saida';
    const fS = isF(v.senhorioGenero);
    const fI = isF(v.inquilinoGenero);
    const S = fS ? 'Senhoria' : 'Senhorio';
    const I = fI ? 'Inquilina' : 'Inquilino';
    const rep = str(v.senhorioRepresentante);
    const contrato = str(v.contratoData) ? `, objecto do contrato de arrendamento celebrado em ${dateLong(v.contratoData)}` : '';
    const hora = str(v.hora) ? `, pelas ${str(v.hora)}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Auto de entrega e vistoria do imóvel', subtitle: saida ? 'Saída — restituição do imóvel ao senhorio' : 'Entrada — entrega do imóvel ao inquilino' },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Aos ${dateLong(v.data)}${hora}, no imóvel sito em ${semPonto(v.imovelMorada) || BLANK}${contrato}, compareceram ${pessoaCurta(v, 'senhorio')}, na qualidade de ${S.toLowerCase()}${rep ? `, por si ou representad${fS ? 'a' : 'o'} por ${rep}` : ''}, e ${pessoaCurta(v, 'inquilino')}, na qualidade de ${I.toLowerCase()}, que procederam em conjunto à vistoria do imóvel para efeitos da sua ${saida ? `restituição ${fS ? 'à' : 'ao'} ${S.toLowerCase()}` : `entrega ${fI ? 'à' : 'ao'} ${I.toLowerCase()}`}, tendo verificado o seguinte:`,
        en: `On the date above the landlord and the tenant jointly inspected the property for its ${saida ? 'return to the landlord' : 'hand-over to the tenant'} and recorded the following:`,
      },
    ];

    const kv = [
      { label: 'Chaves e comandos', value: str(v.chaves) || BLANK },
      { label: 'Contador de energia', value: [str(v.energiaContador) ? `n.º ${str(v.energiaContador)}` : '', str(v.energiaLeitura) ? `leitura/saldo ${str(v.energiaLeitura)}` : ''].filter(Boolean).join(' — ') || BLANK },
      { label: 'Contador de água', value: [str(v.aguaContador) ? `n.º ${str(v.aguaContador)}` : '', str(v.aguaLeitura) ? `leitura ${str(v.aguaLeitura)} m³` : ''].filter(Boolean).join(' — ') || BLANK },
    ];
    blocks.push({ type: 'heading', text: '1. Chaves e contadores' }, { type: 'keyValue', items: kv, columns: 1 });

    blocks.push(
      { type: 'heading', text: '2. Estado do imóvel', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Divisão / elemento', width: 3.2 },
          { label: 'Estado', width: 1.2, align: 'center' },
          { label: 'Observações', width: 3.4 },
        ],
        rows: (c.divisoes.length ? c.divisoes : [{ local: '', estado: '', obs: '' }, { local: '', estado: '', obs: '' }, { local: '', estado: '', obs: '' }]).map((r: Record<string, unknown>, i: number) => [
          String(i + 1),
          str(r.local),
          estadoTxt(r.estado),
          str(r.obs),
        ]),
        grid: true,
      },
    );
    const fotos = Number(v.fotografias) || 0;
    if (fotos > 0) {
      blocks.push({
        type: 'paragraph',
        id: 'fotografias',
        text: `Foram tiradas ${fotos === 1 ? 'uma fotografia datada' : `${fotos} fotografias datadas`} do imóvel, que as partes reconhecem como retrato fiel do seu estado e que fazem parte integrante do presente auto.`,
        en: `${fotos} dated photo(s) of the property were taken; the parties accept them as a true record and they form part of this record.`,
      });
    }

    let n = 3;
    if (c.inventario.length) {
      blocks.push(
        { type: 'heading', text: `${n++}. Mobília e equipamento`, keepWithNext: true },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'center' },
            { label: 'Artigo', width: 4.6 },
            { label: 'Quant.', width: 0.9, align: 'center' },
            { label: 'Estado', width: 1.4, align: 'center' },
          ],
          rows: c.inventario.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.item), str(r.quantidade) || '1', estadoTxt(r.estado)]),
          grid: true,
        },
      );
    }

    if (saida) {
      blocks.push({ type: 'heading', text: `${n++}. Danos e acerto da caução`, keepWithNext: true });
      if (c.danos.length) {
        blocks.push({
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'center' },
            { label: 'Dano a reparar por conta do inquilino', width: 5.2 },
            { label: 'Custo (MT)', width: 1.6, align: 'right' },
          ],
          rows: c.danos.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), formatMoney(money(r.valor), false)]),
          totals: [['', 'Total', formatMoney(c.totalDanos, false)]],
        });
      } else {
        blocks.push({
          type: 'paragraph',
          id: 'semDanos',
          text: `As partes verificaram que o imóvel é restituído no estado em que foi entregue, ressalvadas as deteriorações inerentes a uma utilização normal e prudente, não havendo danos a imputar ${fI ? 'à' : 'ao'} ${I.toLowerCase()}.`,
          en: 'The parties found the property returned in the condition received, apart from normal wear; no damage is charged to the tenant.',
        });
      }
      if (c.caucao != null) {
        const resto = c.devolver as number;
        blocks.push({
          type: 'paragraph',
          id: 'caucao',
          text:
            resto >= 0
              ? `Da caução de ${valorTexto(c.caucao)} são deduzidos ${valorTexto(roundMoney(c.totalDanos + c.dividas))} por danos${c.dividas ? ' e por rendas ou consumos em dívida' : ''}, pelo que ${fS ? 'a' : 'o'} ${S.toLowerCase()} restitui ${fI ? 'à' : 'ao'} ${I.toLowerCase()} a quantia de ${valorTexto(resto)}.`
              : `Os danos${c.dividas ? ' e as rendas ou consumos em dívida' : ''} excedem a caução de ${valorTexto(c.caucao)}, pelo que ${fI ? 'a' : 'o'} ${I.toLowerCase()} fica a dever ${fS ? 'à' : 'ao'} ${S.toLowerCase()} a quantia de ${valorTexto(-resto)}.`,
          en: resto >= 0 ? `After deductions, the landlord returns ${formatMoney(resto)} of the deposit to the tenant.` : `Damage and debts exceed the deposit; the tenant owes ${formatMoney(-resto)}.`,
        });
      }
    }

    const obs = splitLines(v.observacoes);
    if (obs.length) {
      blocks.push({ type: 'heading', text: `${n++}. Observações e reservas` }, { type: 'list', style: 'bullet', items: obs.map((s) => `${semPonto(s)}.`) });
    }

    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `E, por nada mais haver a registar, lavra-se o presente auto em dois exemplares, que vão ser assinados pelas partes, ficando um em poder de cada uma.${saida ? '' : ` O estado agora descrito servirá de referência na restituição do imóvel no fim do contrato.`}`,
        en: `Made in two copies signed by both parties.${saida ? '' : ' The condition recorded is the reference for the return of the property at the end of the lease.'}`,
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${formatDateShort(v.data)}`,
        columns: [
          { role: `${fS ? 'A' : 'O'} ${S}`, name: str(v.senhorioNome) || undefined, detail: rep || undefined },
          { role: `${fI ? 'A' : 'O'} ${I}`, name: str(v.inquilinoNome) || undefined },
        ],
      },
    );
    if (v.testemunhas) {
      blocks.push({ type: 'signatures', columns: [{ role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }, { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }] });
    }
    return blocks;
  },
});
