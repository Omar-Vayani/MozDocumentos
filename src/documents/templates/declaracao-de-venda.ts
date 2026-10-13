import { MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type SignatureColumn, type Values, type Warning } from '../model';
import {
  blank, cite, dateField, dateLong, employerParty, employerSignature, FORMA_PAGAMENTO_OPTIONS, g, l,
  localField, money, moneyText, placeDate, workerFields, workerParty, workerSignature,
} from './_shared';

// ---------------------------------------------------------------- local helpers

const extenso = (n: number | null) => (n != null && n >= 0 && n <= MAX_EXTENSO ? numeroPorExtenso(n) : '');

/** Defaults a person section from an individual issuing profile. */
const PROFILE_GET: Record<string, (p: Profile) => unknown> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  Morada: (p) => addressLine(p),
  Telefone: (p) => p.telefones,
};
function fromPessoaProfile(defs: FieldDef[], prefix: string): FieldDef[] {
  return defs.map((f) => {
    const get = PROFILE_GET[f.name.slice(prefix.length)];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        if (c.profile?.kind === 'pessoa') {
          const val = get(c.profile);
          if (val) return val;
        }
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const isVeiculo = (v: Values) => v.bemTipo === 'viatura' || v.bemTipo === 'motociclo';
const vendedorEmpresa = (v: Values, profile: Profile | null) => Boolean(v.vendedorPerfil) && profile?.kind === 'empresa';

const TIPO_LABEL: Record<string, string> = {
  viatura: 'Viatura automóvel',
  motociclo: 'Motociclo',
  equipamento: 'Equipamento',
  outro: 'Bem móvel',
};

const PERSON_KEYS = ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone'] as const;

export default defineTemplate({
  id: 'declaracao-de-venda',
  family: 'declaracao',
  official: 'registo',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'vendedor', title: l('Vendedor', 'Seller'), personRole: 'outro' },
    { id: 'comprador', title: l('Comprador', 'Buyer'), personRole: 'cliente' },
    { id: 'bem', title: l('Bem vendido', 'Item sold') },
    { id: 'pagamento', title: l('Preço, pagamento e entrega', 'Price, payment and delivery') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField('data'),
    {
      name: 'vendedorPerfil',
      type: 'toggle',
      section: 'vendedor',
      label: l('O vendedor é a empresa deste perfil', 'The seller is this profile’s company'),
      help: l('Só para perfis de empresa: usa os dados e o representante da empresa.', 'Company profiles only: uses the company’s details and representative.'),
      default: (c) => c.profile?.kind === 'empresa',
    },
    ...fromPessoaProfile(workerFields([...PERSON_KEYS], 'vendedor', 'vendedor'), 'vendedor').map((f) => ({
      ...f,
      showIf: (v: Values) => !v.vendedorPerfil,
    })),
    ...workerFields([...PERSON_KEYS], 'comprador', 'comprador'),
    {
      name: 'bemTipo',
      type: 'select',
      section: 'bem',
      width: 'half',
      required: true,
      label: l('Tipo de bem', 'Type of item'),
      options: [
        { value: 'viatura', label: l('Viatura automóvel', 'Car') },
        { value: 'motociclo', label: l('Motociclo', 'Motorbike') },
        { value: 'equipamento', label: l('Equipamento', 'Equipment') },
        { value: 'outro', label: l('Outro bem móvel', 'Other movable item') },
      ],
      default: 'viatura',
    },
    { name: 'marca', type: 'text', section: 'bem', width: 'half', label: l('Marca', 'Make'), required: true, showIf: isVeiculo, placeholder: l('Ex.: Toyota', 'E.g. Toyota') },
    { name: 'modelo', type: 'text', section: 'bem', width: 'half', label: l('Modelo', 'Model'), required: true, showIf: isVeiculo, placeholder: l('Ex.: Hilux', 'E.g. Hilux') },
    { name: 'matricula', type: 'text', section: 'bem', width: 'half', label: l('Matrícula', 'Registration plate'), required: true, showIf: isVeiculo, placeholder: l('Ex.: AAA 123 MC', 'E.g. AAA 123 MC') },
    { name: 'quadro', type: 'text', section: 'bem', width: 'half', label: l('N.º de quadro (chassis)', 'Chassis number (VIN)'), required: true, showIf: isVeiculo },
    { name: 'motor', type: 'text', section: 'bem', width: 'half', label: l('N.º de motor', 'Engine number'), showIf: isVeiculo },
    { name: 'cor', type: 'text', section: 'bem', width: 'half', label: l('Cor', 'Colour'), showIf: isVeiculo },
    { name: 'ano', type: 'text', section: 'bem', width: 'half', label: l('Ano de fabrico', 'Year of manufacture'), showIf: isVeiculo },
    {
      name: 'tituloRegisto',
      type: 'text',
      section: 'bem',
      width: 'half',
      label: l('Título de registo de propriedade n.º', 'Certificate of title no.'),
      help: l('Emitido pela Conservatória do Registo Automóvel em nome do vendedor.', 'Issued by the Motor Vehicle Registry in the seller’s name.'),
      showIf: isVeiculo,
    },
    {
      name: 'livrete',
      type: 'text',
      section: 'bem',
      width: 'half',
      label: l('Livrete n.º (opcional)', 'Vehicle logbook no. (optional)'),
      showIf: isVeiculo,
    },
    {
      name: 'bemDescricao',
      type: 'textarea',
      section: 'bem',
      rows: 3,
      label: l('Descrição do bem', 'Description of the item'),
      help: l('Identifique o bem de forma a não haver dúvidas: marca, modelo, características, acessórios.', 'Describe the item unambiguously: make, model, features, accessories.'),
      required: true,
      showIf: (v) => !isVeiculo(v),
    },
    { name: 'numeroSerie', type: 'text', section: 'bem', width: 'half', label: l('N.º de série (se houver)', 'Serial number (if any)'), showIf: (v) => !isVeiculo(v) },
    {
      name: 'estadoBem',
      type: 'text',
      section: 'bem',
      label: l('Estado de conservação (opcional)', 'Condition (optional)'),
      placeholder: l('Ex.: usado, em bom estado de funcionamento', 'E.g. used, in good working order'),
    },
    { name: 'preco', type: 'money', section: 'pagamento', width: 'half', required: true, label: l('Preço de venda', 'Sale price') },
    { name: 'formaPagamento', type: 'select', section: 'pagamento', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    {
      name: 'pagamento',
      type: 'radio',
      section: 'pagamento',
      label: l('Situação do pagamento', 'Payment status'),
      options: [
        { value: 'recebido', label: l('O vendedor já recebeu o preço total', 'The seller has received the full price') },
        { value: 'aPagar', label: l('O comprador paga até uma data', 'The buyer pays by a date') },
      ],
      default: 'recebido',
    },
    {
      name: 'dataPagamento',
      type: 'date',
      section: 'pagamento',
      width: 'half',
      label: l('Pagar até', 'Pay by'),
      required: true,
      showIf: (v) => v.pagamento === 'aPagar',
    },
    { name: 'dataEntrega', type: 'date', section: 'pagamento', width: 'half', label: l('Data de entrega do bem', 'Delivery date'), required: true, default: (c) => c.today },
    {
      name: 'custosRegisto',
      type: 'radio',
      section: 'opcoes',
      label: l('Quem paga as despesas de registo', 'Who pays the registration costs'),
      options: [
        { value: 'comprador', label: l('Comprador', 'Buyer') },
        { value: 'vendedor', label: l('Vendedor', 'Seller') },
        { value: 'ambos', label: l('Em partes iguais', 'Shared equally') },
      ],
      default: 'comprador',
      showIf: isVeiculo,
    },
    {
      name: 'examinado',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('O comprador examinou o bem e aceita-o no estado em que se encontra', 'The buyer has inspected the item and accepts it as is'),
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'opcoes',
      label: l('Incluir duas testemunhas', 'Include two witnesses'),
      help: l('Recomendado quando o pagamento é em numerário ou o valor é elevado.', 'Recommended for cash payments or high values.'),
    },
    { name: 'testemunha1Nome', type: 'text', section: 'opcoes', width: 'half', label: l('1.ª testemunha — nome', '1st witness — name'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha1Doc', type: 'text', section: 'opcoes', width: 'half', label: l('1.ª testemunha — BI n.º', '1st witness — ID no.'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha2Nome', type: 'text', section: 'opcoes', width: 'half', label: l('2.ª testemunha — nome', '2nd witness — name'), showIf: (v) => Boolean(v.testemunhas) },
    { name: 'testemunha2Doc', type: 'text', section: 'opcoes', width: 'half', label: l('2.ª testemunha — BI n.º', '2nd witness — ID no.'), showIf: (v) => Boolean(v.testemunhas) },
  ],

  computed: (v) => ({ preco: money(v.preco) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const empresa = vendedorEmpresa(v, ctx.profile);
    if (v.vendedorPerfil && !empresa) {
      w.push({
        level: 'warning',
        field: 'vendedorPerfil',
        message: l('O perfil activo não é de uma empresa. Preencha os dados do vendedor.', 'The active profile is not a company. Fill in the seller’s details.'),
      });
    }
    if (!empresa && !v.vendedorDocNumero) {
      w.push({ level: 'warning', field: 'vendedorDocNumero', message: l('Falta o número do documento de identificação do vendedor.', 'The seller’s ID number is missing.') });
    }
    if (!v.compradorDocNumero) {
      w.push({ level: 'warning', field: 'compradorDocNumero', message: l('Falta o número do documento de identificação do comprador.', 'The buyer’s ID number is missing.') });
    }
    if (ctx.computed.preco == null) {
      w.push({ level: 'warning', field: 'preco', message: l('Indique o preço de venda.', 'Enter the sale price.') });
    }
    if (isVeiculo(v)) {
      if (!v.matricula || !v.quadro) {
        w.push({
          level: 'warning',
          field: v.matricula ? 'quadro' : 'matricula',
          message: l('A matrícula e o n.º de quadro são necessários para o registo na Conservatória do Registo Automóvel.', 'The plate and chassis number are needed for registration at the Motor Vehicle Registry.'),
        });
      }
      w.push({
        level: 'info',
        message: l(
          'O registo da propriedade a favor do comprador faz-se na Conservatória do Registo Automóvel, com o requerimento próprio, o título de registo de propriedade, o livrete e os documentos de identificação e NUIT de ambas as partes. A Conservatória pode exigir o reconhecimento presencial das assinaturas no notário. Confirme os documentos antes de assinar.',
          'Ownership is registered in the buyer’s name at the Motor Vehicle Registry, with its application form, the certificate of title, the logbook and both parties’ ID and NUIT. The Registry may require the signatures to be certified in person by a notary. Check the documents before signing.',
        ),
      });
    }
    if (v.pagamento === 'aPagar' && v.dataPagamento && v.data && v.dataPagamento < v.data) {
      w.push({ level: 'warning', field: 'dataPagamento', message: l('A data limite de pagamento é anterior à data do documento.', 'The payment deadline is before the document date.') });
    }
    if (v.pagamento === 'aPagar' && !v.testemunhas) {
      w.push({ level: 'info', field: 'testemunhas', message: l('Com pagamento em falta, considere incluir testemunhas.', 'With payment outstanding, consider adding witnesses.') });
    }
    return w;
  },

  personName: (v) => v.compradorNome || v.vendedorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = vendedorEmpresa(v, ctx.profile);
    const vend = empresa ? 'Vendedora' : g(v.vendedorGenero, 'Vendedor', 'Vendedora');
    const comp = g(v.compradorGenero, 'Comprador', 'Compradora');
    const art = (d: string) => (d.endsWith('a') ? 'a' : 'o');
    const oV = `${art(vend)} ${vend}`;
    const oC = `${art(comp)} ${comp}`;
    const OV = oV.charAt(0).toUpperCase() + oV.slice(1);
    const OC = oC.charAt(0).toUpperCase() + oC.slice(1);
    const doC = `${art(comp) === 'a' ? 'da' : 'do'} ${comp}`;
    const aoC = `${art(comp) === 'a' ? 'à' : 'ao'} ${comp}`;
    const veiculo = isVeiculo(v);
    const preco = ctx.computed.preco as number | null;
    const ext = extenso(preco);

    const vendedorText = empresa ? employerParty(ctx, vend) : workerParty(v, vend, 'vendedor');
    const compradorText = workerParty(v, comp, 'comprador');

    const bemItems = veiculo
      ? [
          { label: 'Tipo', value: TIPO_LABEL[v.bemTipo] },
          { label: 'Marca', value: blank(v.marca) },
          { label: 'Modelo', value: blank(v.modelo) },
          { label: 'Matrícula', value: blank(v.matricula) },
          { label: 'N.º de quadro (chassis)', value: blank(v.quadro) },
          { label: 'N.º de motor', value: blank(v.motor) },
          { label: 'Cor', value: v.cor || '' },
          { label: 'Ano de fabrico', value: v.ano || '' },
          { label: 'Título de registo de propriedade n.º', value: v.tituloRegisto || '' },
          { label: 'Livrete n.º', value: v.livrete || '' },
        ].filter((it) => it.value)
      : [
          { label: 'Tipo', value: TIPO_LABEL[v.bemTipo] || TIPO_LABEL.outro },
          { label: 'Descrição', value: blank(v.bemDescricao) },
          { label: 'N.º de série', value: v.numeroSerie || '' },
        ].filter((it) => it.value);
    if (v.estadoBem) bemItems.push({ label: 'Estado', value: v.estadoBem });

    const forma = v.formaPagamento || 'transferência bancária';
    const precoTexto = `**${moneyText(v.preco)}**${ext ? ` (${ext})` : ''}`;
    const pagamentoTexto =
      v.pagamento === 'aPagar'
        ? `O preço da venda é de ${precoTexto}, que ${oC} se obriga a pagar ${art(vend) === 'a' ? 'à' : 'ao'} ${vend} por ${forma} até ${dateLong(v.dataPagamento)}. ${OV} dará quitação no acto do pagamento integral.`
        : `O preço da venda é de ${precoTexto}, pago por ${forma}. ${OV} declara ter recebido ${doC} a totalidade do preço, de que dá plena e integral quitação.`;
    const pagamentoEn =
      v.pagamento === 'aPagar'
        ? `The sale price is ${moneyText(v.preco)}, which the Buyer undertakes to pay by ${forma} by ${v.dataPagamento || '—'}. The Seller will issue a receipt on full payment.`
        : `The sale price is ${moneyText(v.preco)}, paid by ${forma}. The Seller acknowledges receipt of the full price from the Buyer.`;

    const custos =
      v.custosRegisto === 'vendedor'
        ? `suportados pel${art(vend)} ${vend}`
        : v.custosRegisto === 'ambos'
          ? 'suportados por ambas as partes, em partes iguais'
          : `suportados pel${art(comp)} ${comp}`;

    const clauses = [
      { id: 'preco', heading: 'Preço e pagamento', text: pagamentoTexto, en: pagamentoEn },
      {
        id: 'entrega',
        heading: 'Entrega',
        text: `O bem é entregue ${aoC} em ${dateLong(v.dataEntrega)}, ${veiculo ? 'juntamente com as respectivas chaves, o livrete, o título de registo de propriedade e os demais documentos da viatura' : 'juntamente com os documentos e acessórios que o acompanham'}. A partir dessa data correm por conta ${doC} os riscos do bem e as responsabilidades decorrentes da sua utilização, incluindo multas, taxas e outros encargos; os anteriores à entrega são da responsabilidade ${art(vend) === 'a' ? 'da' : 'do'} ${vend}.`,
        en: 'The item is handed over to the Buyer on the delivery date with its keys, documents and accessories. From then on the Buyer bears the risks and liabilities arising from its use, including fines and charges; those before delivery remain with the Seller.',
      },
      {
        id: 'onus',
        heading: 'Propriedade e ónus',
        text: `${OV} declara ser ${art(vend) === 'a' ? 'a legítima proprietária' : 'o legítimo proprietário'} do bem e que este se encontra livre de quaisquer ónus ou encargos, designadamente penhoras, hipotecas, reservas de propriedade ou locação financeira, responsabilizando-se perante ${oC} por qualquer reclamação de terceiros relativa a factos anteriores à entrega.`,
        en: 'The Seller declares that it is the lawful owner of the item and that it is free of any charges or encumbrances (attachments, mortgages, retention of title or leasing), and is liable to the Buyer for any third-party claim relating to the period before delivery.',
      },
    ];
    if (v.examinado) {
      clauses.push({
        id: 'estado',
        heading: 'Estado do bem',
        text: `${OC} declara ter examinado o bem e aceitá-lo no estado de conservação e funcionamento em que se encontra${v.estadoBem ? ` (${String(v.estadoBem).trim().replace(/\.$/, '')})` : ''}.`,
        en: 'The Buyer declares that it has inspected the item and accepts it in its current condition.',
      });
    }
    if (veiculo) {
      clauses.push({
        id: 'registo',
        heading: 'Registo',
        text: `${OV} obriga-se a assinar o requerimento de registo e os demais documentos necessários ao registo da propriedade a favor ${doC} na Conservatória do Registo Automóvel, sendo os respectivos emolumentos e despesas ${custos}. ${OC} obriga-se a requerer esse registo com a maior brevidade.`,
        en: 'The Seller undertakes to sign the registration application and any other documents needed to register ownership in the Buyer’s name at the Motor Vehicle Registry; the fees are paid as agreed. The Buyer undertakes to apply for registration as soon as possible.',
      });
    }

    const vendSig: SignatureColumn = empresa
      ? employerSignature(ctx, `${OV}`)
      : workerSignature(v, OV, 'vendedor');
    const compSig = workerSignature(v, OC, 'comprador');

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de venda' },
      { type: 'paragraph', id: 'vendedor', text: `${vendedorText};`, en: 'The Seller, identified above;' },
      { type: 'paragraph', id: 'comprador', text: `e ${compradorText},`, en: 'and the Buyer, identified above,' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `declaram, para todos os efeitos legais, que ${oV} vende ${aoC}, que o compra, o bem abaixo identificado, nos termos do ${cite('codigoCivilCompraVenda')} e nas condições seguintes.`,
        en: 'declare that the Seller sells to the Buyer, who buys it, the item identified below, under the Civil Code and on the following terms.',
      },
      { type: 'keyValue', title: 'Identificação do bem', columns: 2, items: bemItems },
    ];
    if (preco != null && preco > 0) blocks.push({ type: 'amount', label: 'Preço de venda', value: preco });
    blocks.push(
      { type: 'numberedClauses', style: 'numeric', items: clauses },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade e corresponder à vontade das partes, vai a presente declaração assinada por ambas, em dois exemplares de igual valor, ficando um em poder de cada uma.',
        en: 'In witness whereof, this declaration is signed by both parties in two copies of equal value, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [vendSig, compSig] },
    );
    if (v.testemunhas) {
      const tDetail = (doc: unknown) => (doc ? `BI n.º ${doc}` : undefined);
      blocks.push(
        { type: 'paragraph', id: 'testemunhas', text: 'Testemunhas:', align: 'left', keepWithNext: true, en: 'Witnesses:' },
        {
          type: 'signatures',
          columns: [
            { role: '1.ª Testemunha', name: v.testemunha1Nome || undefined, detail: tDetail(v.testemunha1Doc) },
            { role: '2.ª Testemunha', name: v.testemunha2Nome || undefined, detail: tDetail(v.testemunha2Doc) },
          ],
        },
      );
    }
    return blocks;
  },
});
