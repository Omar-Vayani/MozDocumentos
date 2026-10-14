// Ficha de cliente e pedido de abertura de crédito: the supplier's form that a
// business customer fills in and signs to buy on credit (conta-corrente).
// Often printed blank and filled by hand, so empty fields print lines.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Warning } from '../model';
import { BLANK, l, money, moneyText } from './_shared';
import { int, issuerName, rows, semPonto, str } from './_comercio';

const LINE = '______________________';

export default defineTemplate({
  id: 'ficha-de-cliente',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Ficha', 'Form') },
    { id: 'cliente', title: l('Cliente', 'Customer'), personRole: 'cliente' },
    { id: 'representantes', title: l('Representantes', 'Representatives') },
    { id: 'credito', title: l('Pagamento e crédito', 'Payment and credit') },
    { id: 'fiador', title: l('Fiador (opcional)', 'Guarantor (optional)') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    { name: 'ref', type: 'text', section: 'documento', width: 'half', label: l('Código de cliente (opcional)', 'Customer code (optional)') },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    {
      name: 'situacao',
      type: 'radio',
      section: 'documento',
      width: 'half',
      label: l('Situação', 'Status'),
      options: [
        { value: 'novo', label: l('Novo cliente', 'New customer') },
        { value: 'actualizacao', label: l('Actualização de dados', 'Update of details') },
      ],
      default: 'novo',
    },
    {
      name: 'clienteTipo',
      type: 'radio',
      section: 'cliente',
      label: l('O cliente é', 'The customer is'),
      options: [
        { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') },
        { value: 'pessoa', label: l('Empresário em nome individual / particular', 'Sole trader / individual') },
      ],
      default: 'empresa',
    },
    { name: 'clienteNome', type: 'text', section: 'cliente', label: l('Firma ou nome', 'Company or name'), personKey: 'nome', help: l('Deixe em branco para imprimir a ficha para preencher à mão.', 'Leave blank to print the form to fill in by hand.') },
    { name: 'clienteNuit', type: 'text', section: 'cliente', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), personKey: 'nuit' },
    { name: 'clienteNuel', type: 'text', section: 'cliente', width: 'half', label: l('NUEL / registo comercial', 'Registration (NUEL)') },
    { name: 'clienteLicenca', type: 'text', section: 'cliente', width: 'half', label: l('Alvará, licença ou certidão n.º', 'Licence or certificate no.') },
    { name: 'clienteActividade', type: 'text', section: 'cliente', width: 'half', label: l('Actividade', 'Business activity') },
    { name: 'clienteMorada', type: 'text', section: 'cliente', label: l('Sede / morada', 'Address'), personKey: 'morada' },
    { name: 'clienteTelefone', type: 'tel', section: 'cliente', width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone' },
    { name: 'clienteEmail', type: 'email', section: 'cliente', width: 'half', label: l('Email', 'Email'), personKey: 'email' },
    { name: 'contactoNome', type: 'text', section: 'cliente', width: 'half', label: l('Pessoa de contacto', 'Contact person') },
    { name: 'contactoFacturas', type: 'text', section: 'cliente', width: 'half', label: l('Email para facturas e extractos', 'Email for invoices and statements') },
    {
      name: 'representantes',
      type: 'lines',
      section: 'representantes',
      label: l('Sócios, gerentes ou pessoas autorizadas a encomendar', 'Partners, managers or persons authorised to order'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'documento', type: 'text', label: l('Documento de identificação n.º', 'ID no.') },
        { name: 'contacto', type: 'text', label: l('Contacto', 'Contact') },
      ],
      default: [],
    },
    { name: 'banco', type: 'text', section: 'credito', width: 'half', label: l('Banco', 'Bank'), personKey: 'banco' },
    { name: 'nib', type: 'text', section: 'credito', width: 'half', label: l('NIB', 'Account (NIB)'), personKey: 'nib' },
    { name: 'limitePedido', type: 'money', section: 'credito', width: 'half', label: l('Limite de crédito pedido', 'Credit limit requested') },
    { name: 'prazoPagamentoDias', type: 'number', section: 'credito', width: 'half', min: 0, max: 180, default: 30, label: l('Prazo de pagamento das facturas (dias)', 'Invoice payment term (days)') },
    { name: 'volumeMensal', type: 'money', section: 'credito', width: 'half', label: l('Compras mensais previstas', 'Expected monthly purchases') },
    { name: 'referencias', type: 'textarea', section: 'credito', rows: 2, label: l('Referências comerciais (fornecedores, contacto)', 'Trade references (suppliers, contact)'), help: l('Um por linha.', 'One per line.') },
    { name: 'fiador', type: 'toggle', section: 'fiador', label: l('Incluir fiador (garantia pessoal)', 'Include a guarantor (personal guarantee)'), help: l('Normalmente o sócio ou dono garante as dívidas da empresa até um limite.', 'Usually the owner guarantees the company’s debts up to a limit.') },
    { name: 'fiadorNome', type: 'text', section: 'fiador', label: l('Nome do fiador', 'Guarantor’s name'), showIf: (v) => Boolean(v.fiador) },
    { name: 'fiadorDocNumero', type: 'text', section: 'fiador', width: 'half', label: l('BI / DIRE / Passaporte n.º', 'ID number'), showIf: (v) => Boolean(v.fiador) },
    { name: 'fiadorNuit', type: 'text', section: 'fiador', width: 'half', label: l('NUIT do fiador', 'Guarantor’s NUIT'), showIf: (v) => Boolean(v.fiador) },
    { name: 'fiadorMorada', type: 'text', section: 'fiador', label: l('Morada do fiador', 'Guarantor’s address'), showIf: (v) => Boolean(v.fiador) },
    { name: 'fiadorLimite', type: 'money', section: 'fiador', width: 'half', label: l('Limite da fiança', 'Guarantee limit'), showIf: (v) => Boolean(v.fiador) },
    { name: 'caixaAprovacao', type: 'toggle', section: 'opcoes', default: true, label: l('Incluir caixa "Reservado ao fornecedor" (aprovação)', 'Include the supplier’s approval box') },
    { name: 'listaDocumentos', type: 'toggle', section: 'opcoes', default: true, label: l('Incluir lista de documentos a juntar', 'Include the list of documents to attach') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.fiador && money(v.fiadorLimite) == null) {
      w.push({ level: 'warning', field: 'fiadorLimite', message: l('Indique o limite da fiança. Uma fiança sem limite pode ser contestada.', 'State the guarantee limit. An unlimited guarantee may be challenged.') });
    }
    if (str(v.clienteNome) && !str(v.clienteNuit)) {
      w.push({ level: 'warning', field: 'clienteNuit', message: l('Falta o NUIT do cliente: é necessário para emitir as facturas.', 'The customer’s NUIT is missing: it is needed to issue invoices.') });
    }
    w.push({
      level: 'info',
      message: l(
        'Peça cópia do NUIT, da certidão de registo e da licença ou certidão de actividade. Entregue ao cliente as condições gerais de venda antes de abrir a conta: cláusulas não comunicadas podem considerar-se não escritas.',
        'Ask for copies of the NUIT, registration certificate and business licence. Give the customer your general terms of sale before opening the account: terms not communicated may be treated as not written.',
      ),
    });
    return w;
  },

  personName: (v) => v.clienteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const emp = v.clienteTipo !== 'pessoa';
    const fornecedor = issuerName(ctx);
    const val = (x: unknown) => str(x) || LINE;
    const prazo = int(v.prazoPagamentoDias);
    const limite = money(v.limitePedido);
    const volume = money(v.volumeMensal);

    const blocks: Block[] = [
      { type: 'tags', items: [v.situacao === 'actualizacao' ? 'ACTUALIZAÇÃO' : 'NOVO CLIENTE'] },
      { type: 'title', text: 'Ficha de cliente', subtitle: `e pedido de abertura de crédito${str(v.ref) ? ` · Cliente n.º ${str(v.ref)}` : ''}` },
      { type: 'heading', text: '1. Identificação do cliente' },
      // Long values on full-width rows; short ones two per row.
      {
        type: 'keyValue',
        columns: 1,
        items: [
          { label: emp ? 'Firma' : 'Nome', value: val(v.clienteNome) },
          { label: 'Actividade', value: val(v.clienteActividade) },
          { label: 'Sede / morada', value: val(v.clienteMorada) },
        ],
      },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'NUIT', value: val(v.clienteNuit) },
          { label: emp ? 'NUEL' : 'BI / DIRE n.º', value: val(v.clienteNuel) },
          { label: 'Licença / alvará', value: val(v.clienteLicenca) },
          { label: 'Telefone', value: val(v.clienteTelefone) },
          { label: 'Email', value: val(v.clienteEmail) },
          { label: 'Pessoa de contacto', value: val(v.contactoNome) },
          { label: 'Email para facturas', value: val(v.contactoFacturas) },
        ],
      },
    ];

    const reps = rows(v.representantes).filter((r) => str(r.nome));
    blocks.push(
      { type: 'heading', text: `2. ${emp ? 'Sócios, gerentes e pessoas autorizadas a encomendar' : 'Pessoas autorizadas a encomendar'}` },
      {
        type: 'table',
        columns: [
          { label: 'Nome', width: 3 },
          { label: 'Cargo', width: 1.6 },
          { label: 'Documento n.º', width: 1.7 },
          { label: 'Contacto', width: 1.7 },
        ],
        rows: reps.length ? reps.map((r) => [str(r.nome), str(r.cargo), str(r.documento), str(r.contacto)]) : [[' ', '', '', ''], [' ', '', '', '']],
      },
      { type: 'heading', text: '3. Pagamento e crédito pedido' },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Banco', value: val(v.banco) },
          { label: 'NIB', value: val(v.nib) },
          { label: 'Limite pedido', value: limite != null ? moneyText(limite) : `${LINE} MT` },
          { label: 'Prazo de pagamento', value: prazo ? `${prazo} dias após a factura` : `${'_____'} dias após a factura` },
          { label: 'Compras mensais previstas', value: volume != null ? moneyText(volume) : `${LINE} MT` },
        ],
      },
      { type: 'keyValue', columns: 1, items: [{ label: 'Referências comerciais', value: str(v.referencias).split(/\n+/).filter(Boolean).join('; ') || LINE }] },
    );
    if (v.listaDocumentos) {
      blocks.push(
        { type: 'note', text: '**Documentos a juntar (cópias):**', en: 'Documents to attach (copies):', keepWithNext: true },
        {
          type: 'checklist',
          columns: 2,
          items: [
            emp ? 'Certidão de registo comercial (NUEL)' : 'Bilhete de Identidade ou DIRE',
            'Cartão ou declaração de NUIT',
            'Licença, alvará ou certidão de actividade',
            emp ? 'Identificação dos representantes' : 'Comprovativo de morada',
          ].map((label) => ({ label, checked: false })),
        },
      );
    }

    const clausulas: ClauseItem[] = [
      {
        id: 'fc-veracidade',
        text: 'O cliente declara que as informações prestadas são verdadeiras e completas e compromete-se a comunicar por escrito qualquer alteração, nomeadamente da firma, sede, representantes ou NUIT.',
        en: 'The customer declares the information is true and complete and will notify any change in writing.',
      },
      {
        id: 'fc-condicoes',
        text: `O cliente declara ter recebido, lido e aceite as Condições Gerais de Venda de ${fornecedor}, que fazem parte do acordo de crédito.`,
        en: 'The customer declares having received, read and accepted the supplier’s general terms of sale.',
      },
      {
        id: 'fc-pagamento',
        text: `As facturas são pagas no prazo ${prazo ? `de ${prazo} dias` : 'acordado'} a contar da sua emissão. Em caso de atraso, o fornecedor pode suspender novos fornecimentos e exigir juros de mora à taxa legal, sem prejuízo de outros meios de cobrança.`,
        en: 'Invoices are paid within the agreed term. If late, the supplier may suspend supplies and charge default interest at the legal rate.',
      },
      {
        id: 'fc-limite',
        text: 'O limite de crédito é fixado pelo fornecedor, que o pode rever ou cancelar a todo o tempo, mediante comunicação escrita.',
        en: 'The supplier sets the credit limit and may review or cancel it at any time in writing.',
      },
      {
        id: 'fc-dados',
        text: 'O cliente autoriza o tratamento dos dados aqui indicados para a gestão da relação comercial, a facturação e a cobrança, e a sua comunicação às entidades a quem a lei o imponha.',
        en: 'The customer authorises the use of these data to manage the account, invoicing and collection, and their disclosure where the law requires.',
      },
    ];
    if (v.fiador) {
      const lim = money(v.fiadorLimite);
      clausulas.push({
        id: 'fc-fiador',
        text: `**${str(v.fiadorNome) || BLANK}**, portador(a) do documento de identificação n.º ${str(v.fiadorDocNumero) || BLANK}${str(v.fiadorNuit) ? `, NUIT ${str(v.fiadorNuit)}` : ''}, residente em ${semPonto(v.fiadorMorada) || BLANK}, declara constituir-se fiador(a) e principal pagador(a) de todas as quantias que o cliente venha a dever ao fornecedor ao abrigo desta conta, até ao limite de ${lim != null ? moneyText(lim) : `${BLANK} MT`}, com renúncia ao benefício da excussão prévia.`,
        en: 'The guarantor named above guarantees, as principal debtor and up to the stated limit, all amounts the customer comes to owe under this account, waiving the benefit of prior enforcement against the customer.',
      });
    }
    blocks.push({ type: 'heading', text: '4. Declarações' });
    clausulas.forEach((c, i) =>
      blocks.push({ type: 'paragraph', id: c.id, text: `${i + 1}. ${c.text}`, en: c.en, size: 'small', keepWithNext: i === clausulas.length - 1 }),
    );

    const cols: SignatureColumn[] = [{ role: 'O Cliente', name: str(v.clienteNome) || undefined, detail: emp ? '(assinatura e carimbo)' : undefined }];
    if (v.fiador) cols.push({ role: 'O Fiador', name: str(v.fiadorNome) || undefined });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${v.data ? formatDateShort(v.data) : '___/___/______'}`, columns: cols });

    if (v.caixaAprovacao) {
      blocks.push({
        type: 'box',
        label: `Reservado a ${fornecedor}`,
        text: 'Limite aprovado: _______________ MT   ·   Prazo: _____ dias   ·   Código de cliente: __________\nAprovado por: ________________________   ·   Data: ___/___/______   ·   Assinatura: ______________',
      });
    }
    return blocks;
  },
});
