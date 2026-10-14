// Acordo de partilha de bens: heirs divide an estate, or former spouses /
// partners divide their joint property, by agreement. Lists the participants,
// each asset and who takes it, the shares and any cash balances (tornas).
// Real estate and vehicles need a notarial deed or authenticated document
// afterwards; this agreement fixes what the parties agreed.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, isF, l, lineItems, money, splitLines } from './_shared';
import { documentoFields, testemunhasField } from './_contratos';
import { itensLista, semPonto, str } from './_familia';

type Interessado = { nome: string; genero: string; doc: string; morada: string; qualidade: string; quota: number | null };

function interessados(v: unknown): Interessado[] {
  return lineItems(v)
    .map((r) => ({ nome: str(r.nome), genero: str(r.genero), doc: str(r.doc), morada: str(r.morada), qualidade: str(r.qualidade), quota: money(r.quota) }))
    .filter((p) => p.nome);
}

export default defineTemplate({
  id: 'acordo-de-partilha',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'origem', title: l('O que se partilha', 'What is divided') },
    { id: 'interessados', title: l('Interessados (herdeiros ou ex-cônjuges)', 'Parties (heirs or former spouses)') },
    { id: 'bens', title: l('Bens, dívidas e tornas', 'Assets, debts and balances') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    ...documentoFields(),
    {
      name: 'tipo',
      type: 'radio',
      section: 'origem',
      required: true,
      label: l('Partilha de', 'Division of'),
      options: [
        { value: 'heranca', label: l('Uma herança', 'An estate') },
        { value: 'casal', label: l('Bens do casal (divórcio ou fim da união de facto)', 'A couple’s property (divorce or end of union)') },
      ],
      default: 'heranca',
    },
    { name: 'falecidoNome', type: 'text', section: 'origem', required: true, label: l('Nome do falecido', 'Name of the deceased'), showIf: (v) => v.tipo === 'heranca' },
    { name: 'falecidoGenero', type: 'radio', section: 'origem', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M', showIf: (v) => v.tipo === 'heranca' },
    { name: 'falecidoData', type: 'date', section: 'origem', width: 'half', label: l('Data do óbito', 'Date of death'), showIf: (v) => v.tipo === 'heranca' },
    { name: 'falecidoDomicilio', type: 'text', section: 'origem', label: l('Último domicílio', 'Last address'), showIf: (v) => v.tipo === 'heranca' },
    { name: 'habilitacao', type: 'text', section: 'origem', label: l('Habilitação de herdeiros', 'Declaration of heirs'), placeholder: l('Ex.: escritura de 12 de Março de 2026, lavrada no 2.º Cartório Notarial de Maputo', 'E.g. deed of … at the … Notary Office'), showIf: (v) => v.tipo === 'heranca' },
    { name: 'testamento', type: 'toggle', section: 'origem', label: l('O falecido deixou testamento', 'The deceased left a will'), showIf: (v) => v.tipo === 'heranca' },
    { name: 'dissolucao', type: 'text', section: 'origem', label: l('Fim do casamento ou da união', 'End of the marriage or union'), placeholder: l('Ex.: divórcio decretado pela Conservatória do Registo Civil de Maputo em 3 de Março de 2026', 'E.g. divorce granted by … on …'), showIf: (v) => v.tipo === 'casal' },
    {
      name: 'interessados',
      type: 'lines',
      section: 'interessados',
      required: true,
      label: l('Interessados', 'Parties'),
      addLabel: l('Adicionar interessado', 'Add party'),
      help: l('Todos os herdeiros (ou os dois ex-cônjuges) devem constar e assinar. Quota em percentagem, se não for em partes iguais.', 'All heirs (or both former spouses) must be listed and sign. Share in per cent, if not equal.'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
        { name: 'doc', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'morada', type: 'text', label: l('Residência', 'Address') },
        { name: 'qualidade', type: 'text', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: cônjuge sobrevivo, filho', 'E.g. surviving spouse, son') },
        { name: 'quota', type: 'number', label: l('Quota (%)', 'Share (%)'), min: 0, max: 100 },
      ],
      default: [{ nome: '', genero: 'M', doc: '', morada: '', qualidade: '', quota: '' }],
    },
    {
      name: 'bens',
      type: 'lines',
      section: 'bens',
      required: true,
      label: l('Bens a partilhar', 'Assets'),
      addLabel: l('Adicionar bem', 'Add asset'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Bem (com registo, matrícula, conta)', 'Asset (with registration, plate, account)') },
        { name: 'valor', type: 'money', label: l('Valor atribuído (MT)', 'Agreed value (MT)') },
        { name: 'para', type: 'text', label: l('Fica para (nome)', 'Goes to (name)') },
      ],
      default: [{ descricao: '', valor: '', para: '' }],
    },
    { name: 'dividas', type: 'textarea', section: 'bens', rows: 2, label: l('Dívidas e como são pagas (opcional)', 'Debts and how they are paid (optional)'), help: l('Uma por linha.', 'One per line.') },
    { name: 'tornas', type: 'textarea', section: 'bens', rows: 2, label: l('Tornas (acertos em dinheiro)', 'Cash balances'), help: l('Uma por linha. Ex.: João Cossa paga a Maria Cossa 150.000,00 MT até 30 de Novembro de 2026.', 'One per line.') },
    { name: 'reconhecimento', type: 'toggle', section: 'opcoes', default: true, label: l('Espaço para reconhecimento notarial das assinaturas', 'Space for notarial certification of signatures') },
    testemunhasField('opcoes'),
  ],

  computed: (v) => {
    const pessoas = interessados(v.interessados);
    const bens = lineItems(v.bens).filter((r) => str(r.descricao));
    const total = roundMoney(bens.reduce((s, r) => s + (money(r.valor) ?? 0), 0));
    const quotaIgual = pessoas.length ? 100 / pessoas.length : 0;
    const resumo = pessoas.map((p) => {
      const quota = p.quota ?? quotaIgual;
      const recebe = roundMoney(bens.filter((b) => str(b.para).toLowerCase() === p.nome.toLowerCase()).reduce((s, b) => s + (money(b.valor) ?? 0), 0));
      return { nome: p.nome, quota, direito: roundMoney((total * quota) / 100), recebe };
    });
    return { pessoas, bens, total, resumo, somaQuotas: pessoas.reduce((s, p) => s + (p.quota ?? quotaIgual), 0) };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.pessoas.length < 2) w.push({ level: 'error', field: 'interessados', message: l('Indique todos os interessados (pelo menos dois).', 'List all parties (at least two).') });
    if (!c.bens.length) w.push({ level: 'error', field: 'bens', message: l('Indique os bens a partilhar.', 'List the assets.') });
    if (c.pessoas.length && Math.abs(c.somaQuotas - 100) > 0.5) w.push({ level: 'warning', field: 'interessados', message: l('A soma das quotas não é 100%.', 'The shares do not add up to 100%.') });
    const nomes = c.pessoas.map((p: Interessado) => p.nome.toLowerCase());
    if (c.bens.some((b: Record<string, unknown>) => str(b.para) && !nomes.includes(str(b.para).toLowerCase()))) {
      w.push({ level: 'warning', field: 'bens', message: l('Há bens atribuídos a um nome que não consta dos interessados. Escreva o nome exactamente igual.', 'Some assets go to a name not in the list of parties. Use the exact same name.') });
    }
    if (c.bens.some((b: Record<string, unknown>) => /casa|terreno|talh[aã]o|flat|apartamento|moradia|im[oó]vel|pr[eé]dio|viatura|carro|matr[ií]cula|quota/i.test(str(b.descricao)))) {
      w.push({
        level: 'warning',
        field: 'bens',
        message: l(
          `Imóveis, viaturas e quotas de sociedades: a partilha tem de ser feita por escritura pública ou documento autenticado no notário, e depois registada. Leve este acordo ao notário como base (${cite(v.tipo === 'casal' ? 'famPartilhaCasal' : 'famPartilhaHeranca')}). A terra não se partilha: transmite-se o DUAT com a herança.`,
          'Real estate, vehicles and company shares must be divided by notarial deed or authenticated document and then registered. Take this agreement to the notary as the basis.',
        ),
      });
    }
    if (v.tipo === 'heranca') {
      w.push({ level: 'warning', message: l(`Antes da partilha da herança é precisa a habilitação de herdeiros e a participação ao imposto sobre sucessões (${cite('famImpostoSucessoes')}). Se houver herdeiros menores ou incapazes, a partilha faz-se por inventário judicial.`, 'An estate division needs the declaration of heirs and the inheritance tax report first. With minor or incapable heirs, the division goes through a court inventory.') });
    }
    return w;
  },

  personName: (v) => (v.tipo === 'heranca' ? str(v.falecidoNome) : interessados(v.interessados).map((p) => p.nome).join(' e ')) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const heranca = v.tipo === 'heranca';
    const fFal = isF(v.falecidoGenero);
    const pessoas: Interessado[] = c.pessoas.length ? c.pessoas : [{ nome: '', genero: 'M', doc: '', morada: '', qualidade: '', quota: null }, { nome: '', genero: 'M', doc: '', morada: '', qualidade: '', quota: null }];
    const ident = (p: Interessado, i: number) =>
      `**${p.nome || BLANK}**, ${isF(p.genero) ? 'portadora' : 'portador'} do Bilhete de Identidade n.º ${p.doc || BLANK}, residente em ${semPonto(p.morada) || BLANK}${p.qualidade ? `, na qualidade de ${semPonto(p.qualidade)}` : ''}${i === pessoas.length - 1 ? ',' : ';'}`;

    const origem = heranca
      ? `Considerando que, em ${dateLong(v.falecidoData)}, faleceu ${fFal ? 'a' : 'o'} **${str(v.falecidoNome) || BLANK}**, com último domicílio em ${semPonto(v.falecidoDomicilio) || BLANK}, ${v.testamento ? 'tendo deixado testamento' : 'sem testamento'}, e que os outorgantes são os seus únicos herdeiros${str(v.habilitacao) ? `, conforme ${semPonto(v.habilitacao).replace(/^(a|conforme)\s+/i, '')}` : ''}, acordam na partilha dos bens da herança nos termos seguintes:`
      : `Considerando a cessação da comunhão de vida entre os outorgantes${str(v.dissolucao) ? ` (${semPonto(v.dissolucao)})` : ''}, acordam na partilha dos seus bens comuns nos termos seguintes:`;

    const destino = (r: Record<string, unknown>) => str(r.para) || 'A definir';
    const blocks: Block[] = [
      { type: 'title', text: heranca ? 'Acordo de partilha de herança' : 'Acordo de partilha de bens do casal' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'list', style: 'alpha', items: pessoas.map(ident) },
      { type: 'paragraph', id: 'considerando', text: origem, en: heranca ? 'Whereas the person named died and the parties are the sole heirs, they agree to divide the estate as follows:' : 'Whereas the parties’ life in common has ended, they agree to divide their joint property as follows:' },
      { type: 'heading', text: '1. Bens partilhados e seu destino', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Bem', width: 4 },
          { label: 'Valor (MT)', width: 1.5, align: 'right' },
          { label: 'Fica para', width: 2.2 },
        ],
        rows: (c.bens.length ? c.bens : [{}, {}, {}]).map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.descricao), str(r.descricao) ? formatMoney(money(r.valor), false) : '', str(r.descricao) ? destino(r) : '']),
        totals: c.bens.length ? [['', 'Valor total', formatMoney(c.total, false), '']] : undefined,
        grid: true,
      },
      { type: 'heading', text: '2. Quotas e valores recebidos', keepWithNext: true },
      {
        type: 'table',
        columns: [
          { label: 'Interessado', width: 3.4 },
          { label: 'Quota', width: 1, align: 'right' },
          { label: 'Valor a que tem direito', width: 1.8, align: 'right' },
          { label: 'Valor dos bens recebidos', width: 1.8, align: 'right' },
        ],
        rows: c.resumo.map((r: { nome: string; quota: number; direito: number; recebe: number }) => [r.nome, `${(Math.round(r.quota * 100) / 100).toString().replace('.', ',')} %`, formatMoney(r.direito, false), formatMoney(r.recebe, false)]),
      },
    ];
    let n = 3;
    const dividas = splitLines(v.dividas);
    if (dividas.length) blocks.push({ type: 'heading', text: `${n++}. Dívidas`, keepWithNext: true }, { type: 'list', style: 'bullet', items: itensLista(dividas) });
    const tornas = splitLines(v.tornas);
    blocks.push({ type: 'heading', text: `${n++}. Tornas`, keepWithNext: true });
    blocks.push(
      tornas.length
        ? { type: 'list', style: 'bullet', items: itensLista(tornas) }
        : { type: 'paragraph', id: 'semTornas', text: 'Os bens atribuídos correspondem às quotas de cada interessado, não havendo lugar ao pagamento de tornas.', en: 'The assets match each share; no cash balances are due.' },
    );
    blocks.push(
      { type: 'heading', text: `${n++}. Disposições finais`, keepWithNext: true },
      {
        type: 'list',
        style: 'numeric',
        items: [
          'Os outorgantes declaram que a relação de bens é completa e que aceitam os valores atribuídos e o destino de cada bem.',
          `Cada outorgante entra na posse dos bens que lhe cabem ${heranca ? 'logo que cumpridas as formalidades legais' : 'na data da assinatura'}, suportando a partir daí os respectivos encargos.`,
          'Os bens sujeitos a registo (imóveis, viaturas, quotas, contas bancárias) são transmitidos pela forma legal exigida, comprometendo-se todos os outorgantes a assinar os documentos necessários e a comparecer no notário, na conservatória ou no banco.',
          'Com o cumprimento do presente acordo, os outorgantes dão-se mútua quitação quanto aos bens partilhados.',
        ],
      },
      {
        type: 'paragraph',
        id: 'feito',
        text: `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em tantos exemplares quantos os outorgantes, todos de igual valor, que vão ser assinados e rubricados por todos.`,
        en: 'Made in as many copies as there are parties, signed and initialled by all.',
        keepWithNext: true,
      },
    );
    const cols: SignatureColumn[] = pessoas.map((p) => ({ role: isF(p.genero) ? 'A Outorgante' : 'O Outorgante', name: p.nome || undefined, detail: p.qualidade || undefined }));
    for (let i = 0; i < cols.length; i += 2) {
      blocks.push({ type: 'signatures', columns: cols.slice(i, i + 2), keepWithNext: i + 2 < cols.length || Boolean(v.testemunhas) || Boolean(v.reconhecimento) });
    }
    if (v.testemunhas) {
      blocks.push({ type: 'signatures', columns: [{ role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }, { role: 'Testemunha', detail: `Nome e BI n.º: ${BLANK}` }], keepWithNext: Boolean(v.reconhecimento) });
    }
    if (v.reconhecimento) blocks.push({ type: 'box', label: 'Reconhecimento notarial das assinaturas', text: 'Reconhecimento presencial das assinaturas de todos os outorgantes.', lines: 3, dashed: true });
    return blocks;
  },
});
