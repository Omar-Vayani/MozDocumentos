// Contrato de edição: the author authorises the publisher to reproduce and
// distribute the work at the publisher's cost, for royalties. Written form,
// with editions, print run, deadline, retail price and remuneration.

import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clForcaMaior, contratoBlocks, formaPagamentoFields, modoPagamento, prazo } from './_digital';

const FORMATOS: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'fmtPapel', pt: 'Livro impresso', en: 'Printed book', texto: 'em livro impresso' },
  { name: 'fmtDigital', pt: 'Livro digital (e-book)', en: 'E-book', texto: 'em livro digital' },
  { name: 'fmtAudio', pt: 'Audiolivro', en: 'Audiobook', texto: 'em audiolivro' },
];

const pctTxt = (x: unknown) => `${String(x ?? BLANK).replace('.', ',')}%`;
const n = (x: unknown) => {
  const y = Number(x);
  return x !== '' && x != null && Number.isFinite(y) ? y : null;
};

export default defineTemplate({
  id: 'contrato-de-edicao',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'autor', title: l('Autor', 'Author'), personRole: 'outro' },
    { id: 'editor', title: l('Editor', 'Publisher'), personRole: 'outro' },
    { id: 'obra', title: l('Obra e edição', 'Work and edition') },
    { id: 'preco', title: l('Remuneração do autor', 'Author’s remuneration') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('autor'),
    ...partyFields('editor', { fromProfile: true, tipoDefault: 'empresa' }),

    { name: 'titulo', type: 'text', section: 'obra', required: true, label: l('Título da obra', 'Title') },
    { name: 'genero', type: 'text', section: 'obra', width: 'half', label: l('Género', 'Genre'), placeholder: l('Ex.: romance; poesia; manual escolar', 'E.g. novel; poetry; textbook') },
    { name: 'paginas', type: 'number', section: 'obra', width: 'half', min: 1, max: 5000, label: l('Número aproximado de páginas', 'Approximate pages') },
    { name: 'original', type: 'radio', section: 'obra', label: l('O original', 'The manuscript'), options: [{ value: 'entregue', label: l('Já foi entregue', 'Has been delivered') }, { value: 'entregar', label: l('Será entregue até uma data', 'Will be delivered by a date') }], default: 'entregue' },
    { name: 'dataOriginal', type: 'date', section: 'obra', width: 'half', label: l('Entrega do original até', 'Manuscript due'), showIf: (v) => v.original === 'entregar' },
    ...FORMATOS.map((f, i) => ({ name: f.name, type: 'toggle' as const, section: 'obra', default: i < 2, label: l(f.pt, f.en) })),
    { name: 'edicoes', type: 'number', section: 'obra', width: 'half', min: 1, max: 20, default: 1, label: l('Número de edições autorizadas', 'Editions authorised') },
    { name: 'tiragem', type: 'number', section: 'obra', width: 'half', min: 1, max: 1000000, default: 1000, label: l('Tiragem da 1.ª edição (exemplares)', 'First print run (copies)') },
    { name: 'publicacaoMeses', type: 'number', section: 'obra', width: 'half', min: 1, max: 36, default: 12, label: l('Prazo para publicar (meses após o original)', 'Months to publish after manuscript') },
    { name: 'precoCapa', type: 'money', section: 'obra', width: 'half', label: l('Preço de venda ao público previsto', 'Expected retail price') },
    { name: 'territorio', type: 'select', section: 'obra', width: 'half', label: l('Território', 'Territory'), options: [{ value: 'mocambique', label: l('Moçambique', 'Mozambique') }, { value: 'lusofonia', label: l('Países de língua portuguesa', 'Portuguese-speaking countries') }, { value: 'mundo', label: l('Todo o mundo', 'Worldwide') }], default: 'mocambique' },
    { name: 'exclusivo', type: 'toggle', section: 'obra', default: true, label: l('Edição em exclusivo', 'Exclusive edition') },

    { name: 'direitosPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 10, label: l('Direitos de autor (% do preço de capa por exemplar vendido)', 'Royalty (% of cover price per copy sold)') },
    { name: 'digitalPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 25, label: l('Direitos sobre vendas digitais (% das receitas líquidas)', 'Royalty on digital sales (% of net receipts)') },
    { name: 'adiantamento', type: 'money', section: 'preco', width: 'half', label: l('Adiantamento por conta dos direitos (opcional)', 'Advance against royalties (optional)') },
    { name: 'exemplaresAutor', type: 'number', section: 'preco', width: 'half', min: 0, max: 500, default: 20, label: l('Exemplares gratuitos para o autor', 'Free author copies') },
    { name: 'contasPeriodo', type: 'select', section: 'preco', width: 'half', label: l('Prestação de contas', 'Statements'), options: [{ value: 'semestral', label: l('Semestral', 'Half-yearly') }, { value: 'anual', label: l('Anual', 'Yearly') }], default: 'semestral' },
    ...formaPagamentoFields('preco'),

    { name: 'provasDias', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 60, default: 15, label: l('Prazo do autor para rever as provas (dias)', 'Days for the author to review proofs') },
    { name: 'traducao', type: 'toggle', section: 'clausulas', default: false, label: l('O editor pode negociar traduções e adaptações', 'The publisher may negotiate translations and adaptations') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v: Values) => {
    const w: Warning[] = [...partyWarnings(v, 'autor', 'autor', 'author'), ...partyWarnings(v, 'editor', 'editor', 'publisher')];
    if (!str(v.titulo)) w.push({ level: 'error', field: 'titulo', message: l('Indique o título da obra.', 'Enter the title.') });
    w.push({ level: 'info', message: l(`O contrato de edição deve ser escrito e indicar as edições, a tiragem, o prazo, o preço e a remuneração do autor (${cite('digContratoEdicao')}). Sobre os direitos de autor pagos pode haver retenção de IRPS: confirme com o contabilista.`, 'A publishing contract must be written and state editions, print run, deadline, price and remuneration. Income tax may be withheld on royalties.') });
    return w;
  },

  personName: (v) => partyName(v, 'autor') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = papel(v, 'autor', 'Autor', 'Autora');
    const E = papel(v, 'editor', 'Editor', 'Editora', true);
    const formatos = FORMATOS.filter((f) => v[f.name]).map((f) => f.texto);
    const fmt = formatos.length > 1 ? `${formatos.slice(0, -1).join(', ')} e ${formatos[formatos.length - 1]}` : formatos[0] ?? BLANK;
    const territorio = v.territorio === 'mundo' ? 'em todo o mundo' : v.territorio === 'lusofonia' ? 'nos países de língua oficial portuguesa' : 'em Moçambique';
    const ed = n(v.edicoes);
    const exAutor = n(v.exemplaresAutor);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${A.o} autoriza ${E.o} a editar, por sua conta, a obra intitulada **"${str(v.titulo) || BLANK}"**${str(v.genero) ? `, ${semPonto(v.genero)}` : ''}${n(v.paginas) ? `, com cerca de ${n(v.paginas)} páginas` : ''}, ${fmt}, e a distribuí-la e vendê-la ${territorio}.`,
        `A autorização é concedida ${v.exclusivo ? 'em exclusivo' : 'sem exclusividade'}, para ${ed && ed > 1 ? `${ed} edições` : 'uma edição'}, e não transmite ${E.ao} a propriedade da obra nem quaisquer outros direitos de autor.`,
      ]),
      en: `The author authorises the publisher to publish "${v.titulo || '—'}" at its own cost, ${formatos.length ? FORMATOS.filter((f) => v[f.name]).map((f) => f.en).join(', ') : '—'}, and sell it in the territory stated; ${v.exclusivo ? 'exclusive' : 'non-exclusive'}, for the editions stated, without transferring ownership.`,
    });
    cl.push({
      id: 'original',
      heading: 'Original e revisão',
      text: numerar([
        v.original === 'entregar'
          ? `${A.O} entrega ${E.ao} o original completo, em formato digital editável, até ${dateLong(v.dataOriginal)}.`
          : `${A.O} entregou ${E.ao} o original completo, em formato digital editável, que ${E.o} declara ter recebido.`,
        `${E.O} pode fazer a revisão ortográfica e gráfica, mas não pode introduzir alterações ao conteúdo sem o acordo escrito ${A.de}.`,
        `${A.O} revê as provas tipográficas no prazo de ${prazo(v.provasDias)} a contar da sua recepção; na falta de devolução nesse prazo, ${E.o} pode prosseguir com a edição.`,
      ]),
      en: 'Manuscript in editable digital form. Copy-editing allowed but no content changes without consent. The author reviews proofs within the stated days.',
    });
    cl.push({
      id: 'edicao',
      heading: 'Edição, tiragem e preço',
      text: numerar([
        `${E.O} obriga-se a publicar a obra no prazo de ${prazo(v.publicacaoMeses, 'mês')} a contar da entrega do original, com uma tiragem inicial de ${n(v.tiragem) ? `${n(v.tiragem)} exemplares` : `${BLANK} exemplares`}, em edição cuidada, com o nome ${A.de} na capa.`,
        `${E.O} suporta todos os custos de edição, impressão, distribuição e promoção.`,
        money(v.precoCapa) != null ? `O preço de venda ao público previsto é de ${valorTexto(money(v.precoCapa))}, podendo ser ajustado ${E.pelo} após informação ${A.ao}.` : `O preço de venda ao público é fixado ${E.pelo}, que o comunica ${A.ao} antes do lançamento.`,
        `${E.O} indica em cada exemplar o número da edição, o ano e a menção de reserva dos direitos de autor.`,
      ]),
      en: 'The publisher publishes within the stated months with the stated print run, at its own cost, with the author’s name on the cover, and sets the retail price after informing the author.',
    });
    const adiantamento = money(v.adiantamento);
    cl.push({
      id: 'remuneracao',
      heading: 'Remuneração do autor',
      text: numerar([
        `${E.O} paga ${A.ao}, a título de direitos de autor, ${pctTxt(v.direitosPct)} do preço de venda ao público, sem IVA, por cada exemplar impresso vendido${v.fmtDigital || v.fmtAudio ? `, e ${pctTxt(v.digitalPct)} das receitas líquidas das vendas em formato digital e áudio` : ''}.`,
        adiantamento != null ? `Na assinatura do contrato, ${E.o} paga ${A.ao} ${valorTexto(adiantamento)}, por conta dos direitos de autor, que é descontado nos primeiros pagamentos e não é restituível.` : '',
        `${E.O} presta contas ${A.ao} com periodicidade ${str(v.contasPeriodo) || 'semestral'}, indicando os exemplares impressos, vendidos, oferecidos e em armazém, e paga o montante devido nos trinta dias seguintes, ${modoPagamento(v, A)}.`,
        `${A.O} tem direito a examinar os registos de impressão e de vendas relativos à obra.`,
        exAutor ? `${A.O} recebe gratuitamente ${exAutor} exemplares de cada edição e pode adquirir outros com desconto de livreiro.` : '',
      ]),
      en: `Royalty of ${v.direitosPct ?? '—'}% of the cover price (net of VAT) per printed copy sold${v.fmtDigital || v.fmtAudio ? ` and ${v.digitalPct ?? '—'}% of net digital receipts` : ''}; advance as stated; periodic statements and payment; audit right; free author copies.`,
    });
    cl.push({
      id: 'promocao',
      heading: 'Promoção',
      text: `${A.O} colabora no lançamento e na promoção da obra, nomeadamente em sessões de apresentação e de autógrafos, em datas acordadas, suportando ${E.o} as despesas de deslocação e estadia fora da sua cidade de residência.`,
      en: 'The author helps launch and promote the book on agreed dates; the publisher pays travel outside the author’s city.',
    });
    if (v.traducao) {
      cl.push({
        id: 'traducao',
        heading: 'Traduções e adaptações',
        text: `${E.O} pode negociar com terceiros, em nome ${A.de} e com o seu acordo escrito em cada caso, a tradução e a adaptação da obra, cabendo ${A.ao} metade das receitas líquidas daí resultantes.`,
        en: 'The publisher may negotiate translations and adaptations with the author’s written consent each time; the author receives half of net receipts.',
      });
    }
    cl.push({
      id: 'esgotamento',
      heading: 'Fim da edição e reversão dos direitos',
      text: numerar([
        `Se ${E.o} não publicar a obra no prazo acordado, ou se a edição se esgotar e ${E.o} não fizer nova edição no prazo de ${prazo(v.publicacaoMeses, 'mês')} após pedido escrito ${A.de}, ${A.o} pode resolver o contrato, recuperando todos os direitos, sem devolver o adiantamento recebido.`,
        `Cessando o contrato, ${E.o} pode vender os exemplares em armazém durante seis meses, pagando os direitos correspondentes, ou ${A.o} pode adquiri-los ao preço de custo.`,
      ]),
      en: 'If the publisher does not publish on time, or does not reprint after the book is out of print and the author asks, the author may terminate and recover all rights, keeping the advance. Remaining stock may be sold off for six months or bought by the author at cost.',
    });
    cl.push({
      id: 'garantias',
      heading: 'Garantias',
      text: `${A.O} garante que é ${A.f ? 'a autora' : 'o autor'} da obra, que esta é original e que não ofende direitos de terceiros, nem contém afirmações difamatórias, responsabilizando-se perante ${E.o} pelas reclamações que daí resultem.`,
      en: 'The author warrants authorship, originality and non-infringement and that the book is not defamatory.',
    });
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de edição',
      subtitle: str(v.titulo) ? `"${str(v.titulo)}"` : undefined,
      parties: [
        { p: 'autor', role: A, en: 'Author' },
        { p: 'editor', role: E, en: 'Publisher' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'autor', A), assinatura(ctx, 'editor', E, true)],
    });
  },
});
