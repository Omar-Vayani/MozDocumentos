// Contrato de troca (permuta) de bens móveis: each party gives goods (a vehicle,
// a motorbike, livestock, equipment) in exchange for the other's, with an
// optional cash balance (torna). Real estate is excluded: it needs a deed.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, lineItems, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, conjugeColumn, consentimentoTexto, documentoFields, fecho, foroField, numerar, partesBlocks, partyName, partyWarnings, testemunhasField, valorTexto, type Papel,
} from './_contratos';
import { fechoJunto, partyFieldsWhen, str } from './_familia';

const bensField = (name: string, section: string) => ({
  name,
  type: 'lines' as const,
  section,
  required: true,
  label: l('Bens que entrega', 'Goods given'),
  addLabel: l('Adicionar bem', 'Add item'),
  columns: [
    { name: 'descricao', type: 'text' as const, label: l('Descrição (marca, modelo, matrícula, n.º de série)', 'Description (make, model, plate, serial no.)') },
    { name: 'valor', type: 'money' as const, label: l('Valor atribuído (MT)', 'Agreed value (MT)') },
  ],
  default: [{ descricao: '', valor: '' }],
});

const bens = (v: unknown) => lineItems(v).filter((r) => str(r.descricao));
const total = (xs: Record<string, unknown>[]) => xs.reduce((s, r) => s + (money(r.valor) ?? 0), 0);

function permutante(n: string): Papel {
  return { n, f: false, o: `o ${n}`, O: `O ${n}`, de: `do ${n}`, ao: `ao ${n}`, pelo: `pelo ${n}` };
}

export default defineTemplate({
  id: 'contrato-de-troca',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'parteA', title: l('Primeiro permutante', 'First party'), personRole: 'outro' },
    { id: 'parteB', title: l('Segundo permutante', 'Second party'), personRole: 'outro' },
    { id: 'bensA', title: l('Bens do primeiro permutante', 'First party’s goods') },
    { id: 'bensB', title: l('Bens do segundo permutante', 'Second party’s goods') },
    { id: 'condicoes', title: l('Torna, entrega e assinaturas', 'Balance, delivery and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('parteA', ['pessoa', 'empresa'], { conjuge: true }),
    ...partyFieldsWhen('parteB', [], { conjuge: true }),
    bensField('bensA', 'bensA'),
    bensField('bensB', 'bensB'),
    { name: 'torna', type: 'money', section: 'condicoes', width: 'half', label: l('Diferença paga em dinheiro (torna)', 'Cash balance'), help: l('Calculada pela diferença dos valores atribuídos. Escreva para substituir.', 'Worked out from the values. Type to override.'), computedKey: 'tornaCalc' },
    { name: 'dataEntrega', type: 'date', section: 'condicoes', width: 'half', label: l('Entrega dos bens', 'Delivery'), default: (c) => c.today },
    { name: 'examinados', type: 'toggle', section: 'condicoes', default: true, label: l('Cada parte examinou os bens que recebe', 'Each party inspected what it receives') },
    foroField('condicoes'),
    arbitragemField('condicoes'),
    testemunhasField('condicoes'),
  ],

  computed: (v) => {
    const a = bens(v.bensA);
    const b = bens(v.bensB);
    const diff = Math.round((total(a) - total(b)) * 100) / 100;
    const tornaCalc = Math.abs(diff) > 0 ? Math.abs(diff) : null;
    const torna = money(v.torna) ?? tornaCalc;
    // The party who gives less valuable goods pays the balance.
    const paga = diff > 0 ? 'parteB' : diff < 0 ? 'parteA' : null;
    return { a, b, tornaCalc, torna, paga };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [...partyWarnings(v, 'parteA', 'primeiro permutante', 'first party', { conjuge: true }), ...partyWarnings(v, 'parteB', 'segundo permutante', 'second party', { conjuge: true })];
    if (!c.a.length || !c.b.length) w.push({ level: 'error', field: 'bensA', message: l('Descreva os bens de cada parte.', 'Describe each party’s goods.') });
    const tudo = [...c.a, ...c.b].map((r: Record<string, unknown>) => str(r.descricao)).join(' ');
    if (/casa|terreno|talh[aã]o|flat|apartamento|moradia|im[oó]vel|machamba/i.test(tudo)) {
      w.push({ level: 'error', field: 'bensA', message: l('A troca de imóveis exige escritura pública ou documento autenticado no notário, e a terra não pode ser trocada (só as benfeitorias, com autorização). Este modelo é só para bens móveis.', 'Exchanging real estate needs a notarial deed, and land cannot be exchanged. This form is for movable goods only.') });
    }
    if (/viatura|carro|mota|motociclo|cami[aã]o|matr[ií]cula/i.test(tudo)) {
      w.push({ level: 'info', message: l(`Para as viaturas, cada parte assina também a declaração de venda e requer o registo na Conservatória do Registo Automóvel (${cite('famVendaViatura')}).`, 'For vehicles, each party also signs the sale declaration and registers the transfer.') });
    }
    w.push({ level: 'info', message: l(`A troca segue as regras da compra e venda (${cite('famTroca')}).`, 'An exchange follows the rules of sale.') });
    return w;
  },

  personName: (v) => partyName(v, 'parteB') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const A = permutante('Primeiro Permutante');
    const B = permutante('Segundo Permutante');
    const lista = (xs: Record<string, unknown>[]) => (xs.length ? xs : [{ descricao: BLANK }]).map((r, i, arr) => `${str(r.descricao)}${money(r.valor) != null ? `, com o valor atribuído de ${formatMoney(money(r.valor))}` : ''}${i === arr.length - 1 ? '.' : ';'}`);
    const P = c.paga === 'parteA' ? A : B;
    const R = c.paga === 'parteA' ? B : A;

    const clauses: ClauseItem[] = [
      { id: 'bensA', heading: 'Bens entregues pelo Primeiro Permutante', text: `${A.O} entrega ${B.ao}, que aceita, os seguintes bens:`, items: lista(c.a), en: 'The first party gives the second party the goods listed.' },
      { id: 'bensB', heading: 'Bens entregues pelo Segundo Permutante', text: `Em troca, ${B.o} entrega ${A.ao}, que aceita, os seguintes bens:`, items: lista(c.b), en: 'In exchange the second party gives the first party the goods listed.' },
      {
        id: 'torna',
        heading: 'Torna',
        text:
          c.torna != null && c.paga
            ? `Para compensar a diferença de valor, ${P.o} paga ${R.ao}, nesta data, a quantia de ${valorTexto(c.torna)}, de que ${R.o} dá quitação.`
            : 'As partes atribuem aos bens trocados valor equivalente, não havendo lugar ao pagamento de qualquer diferença.',
        en: c.torna != null && c.paga ? `The party giving less value pays a balance of ${formatMoney(c.torna)}.` : 'The goods are of equal value; no balance is paid.',
      },
      {
        id: 'entrega',
        heading: 'Entrega, estado e garantia',
        text: numerar([
          `Os bens são entregues em ${dateLong(v.dataEntrega)}, com as chaves, acessórios e documentos respectivos.`,
          `Cada parte declara que os bens que entrega lhe pertencem e estão livres de ónus ou encargos${v.examinados ? ', e que examinou os bens que recebe, aceitando-os no estado em que se encontram' : ''}, respondendo cada uma pelos defeitos que conhecia e não declarou.`,
          'Sendo os bens sujeitos a registo, as partes assinam os documentos necessários à transferência da propriedade e cada uma requer o registo dos bens que recebe.',
        ]),
        en: 'Goods are delivered with keys, accessories and papers. Each party warrants ownership and freedom from charges and accepts what it received as inspected; registrable goods are re-registered.',
      },
      ...clausulasFinais(v),
    ];

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de troca' },
      ...partesBlocks(v, [
        { p: 'parteA', role: A, en: 'First party' },
        { p: 'parteB', role: B, en: 'Second party' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de troca (permuta), que se rege pelas cláusulas seguintes:', en: 'this exchange contract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'parteA', A, true), assinatura(ctx, 'parteB', B)], {
        extraCols: [conjugeColumn(v, 'parteA'), conjugeColumn(v, 'parteB')],
        consentimento: [consentimentoTexto(v, 'parteA', A), consentimentoTexto(v, 'parteB', B)].filter(Boolean).join('\n') || undefined,
      })),
    ];
    return blocks;
  },
});
