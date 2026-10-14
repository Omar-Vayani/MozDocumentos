// Contrato de cessão de direitos de autor / encomenda de obra / licença de
// utilização: one template, three models. The contract must be written and
// state the forms of use, time, place and price; moral rights stay with the
// author.

import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clConfidencialidade, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

const MODELOS: Record<string, { titulo: string; en: string }> = {
  cessao: { titulo: 'Contrato de cessão de direitos de autor', en: 'Copyright assignment agreement' },
  encomenda: { titulo: 'Contrato de encomenda de obra', en: 'Commissioned work agreement' },
  licenca: { titulo: 'Contrato de licença de direitos de autor', en: 'Copyright licence agreement' },
};

const TIPOS: Record<string, string> = {
  fotografica: 'obra fotográfica',
  musical: 'obra musical',
  literaria: 'obra literária',
  audiovisual: 'obra audiovisual',
  grafica: 'obra de arte gráfica ou de desenho (incluindo logótipo e identidade visual)',
  plastica: 'obra de artes plásticas',
  software: 'programa de computador',
  arquitectura: 'projecto de arquitectura',
  outra: 'obra',
};

const USOS: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'usoReproducao', pt: 'Reprodução (cópias, impressão, gravação)', en: 'Reproduction', texto: 'reprodução, por qualquer meio e em qualquer suporte' },
  { name: 'usoDistribuicao', pt: 'Distribuição e venda de exemplares', en: 'Distribution and sale of copies', texto: 'distribuição e venda de exemplares' },
  { name: 'usoComunicacao', pt: 'Comunicação pública (TV, rádio, espectáculos)', en: 'Public communication (TV, radio, shows)', texto: 'comunicação ao público, incluindo radiodifusão e execução pública' },
  { name: 'usoInternet', pt: 'Colocação na Internet e plataformas digitais', en: 'Making available online', texto: 'colocação à disposição do público na Internet e em plataformas digitais' },
  { name: 'usoAdaptacao', pt: 'Adaptação, alteração e tradução', en: 'Adaptation, modification, translation', texto: 'adaptação, alteração, tradução e criação de obras derivadas' },
  { name: 'usoPublicidade', pt: 'Uso publicitário e em produtos (merchandising)', en: 'Advertising and merchandise', texto: 'utilização em publicidade e em produtos comerciais' },
];

const modelo = (v: Values) => (str(v.modelo) in MODELOS ? str(v.modelo) : 'cessao');

export default defineTemplate({
  id: 'contrato-cessao-direitos-autor',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Modelo, local e data', 'Model, place and date') },
    { id: 'autor', title: l('Autor (titular dos direitos)', 'Author (rights holder)'), personRole: 'outro' },
    { id: 'adquirente', title: l('Quem adquire ou utiliza', 'Assignee or licensee'), personRole: 'cliente' },
    { id: 'obra', title: l('Obra', 'Work') },
    { id: 'direitos', title: l('Direitos e utilizações', 'Rights and uses') },
    { id: 'preco', title: l('Remuneração', 'Remuneration') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    {
      name: 'modelo',
      type: 'radio',
      section: 'documento',
      label: l('Modelo', 'Model'),
      options: [
        { value: 'cessao', label: l('Cessão (venda) dos direitos sobre uma obra já feita', 'Assignment of rights in an existing work') },
        { value: 'encomenda', label: l('Encomenda de uma obra nova, com transmissão dos direitos', 'Commission of a new work, with transfer of rights') },
        { value: 'licenca', label: l('Licença: autorização de uso, sem transmitir os direitos', 'Licence: permission to use, no transfer') },
      ],
      default: 'encomenda',
    },
    ...documentoFields(),
    ...partyFields('autor'),
    ...partyFields('adquirente', { fromProfile: true, tipoDefault: 'empresa' }),

    { name: 'obraTipo', type: 'select', section: 'obra', width: 'half', label: l('Tipo de obra', 'Kind of work'), options: Object.entries(TIPOS).map(([value, t]) => ({ value, label: l(t.charAt(0).toUpperCase() + t.slice(1), value) })), default: 'grafica' },
    { name: 'obraTitulo', type: 'text', section: 'obra', width: 'half', label: l('Título ou designação', 'Title'), placeholder: l('Ex.: Logótipo e manual de marca', 'E.g. Logo and brand manual') },
    { name: 'obraDescricao', type: 'textarea', section: 'obra', rows: 3, required: true, label: l('Descrição da obra (ou da encomenda)', 'Description of the work (or brief)'), help: l('Na encomenda, descreva o que deve ser criado, o formato e o número de propostas.', 'For a commission, describe what must be created, the format and number of proposals.') },
    { name: 'dataEntrega', type: 'date', section: 'obra', width: 'half', label: l('Data de entrega', 'Delivery date'), showIf: (v) => modelo(v) === 'encomenda' },
    { name: 'revisoes', type: 'number', section: 'obra', width: 'half', min: 0, max: 20, default: 2, label: l('Rondas de alterações incluídas', 'Revision rounds included'), showIf: (v) => modelo(v) === 'encomenda' },

    ...USOS.map((u) => ({ name: u.name, type: 'toggle' as const, section: 'direitos', default: true, label: l(u.pt, u.en) })),
    { name: 'exclusivo', type: 'toggle', section: 'direitos', default: true, label: l('Em exclusivo', 'Exclusive'), help: l('Na cessão e na encomenda, normalmente sim. Numa licença, o autor pode querer licenciar a outros.', 'For assignments and commissions usually yes; a licensor may want to license others.') },
    { name: 'territorio', type: 'select', section: 'direitos', width: 'half', label: l('Território', 'Territory'), options: [{ value: 'mundo', label: l('Todo o mundo', 'Worldwide') }, { value: 'mocambique', label: l('Moçambique', 'Mozambique') }], default: 'mundo' },
    { name: 'duracaoAnos', type: 'number', section: 'direitos', width: 'half', min: 0, max: 99, label: l('Duração (anos; vazio = toda a duração legal)', 'Term (years; empty = full legal term)') },
    { name: 'creditos', type: 'text', section: 'direitos', label: l('Menção do autor (créditos)', 'Author credit'), placeholder: l('Ex.: "Fotografia: Ana Sitoe"', 'E.g. "Photo: Ana Sitoe"'), help: l('O autor tem sempre direito a ser identificado, salvo se aceitar que não seja (por ex. num logótipo).', 'The author always has the right to be named unless they agree otherwise (e.g. a logo).') },
    { name: 'semCreditos', type: 'toggle', section: 'direitos', default: false, label: l('O autor aceita que a obra seja usada sem menção do nome', 'The author agrees the work may be used without credit') },

    {
      name: 'remuneracao',
      type: 'radio',
      section: 'preco',
      label: l('Remuneração', 'Remuneration'),
      options: [
        { value: 'fixa', label: l('Valor fixo', 'Fixed fee') },
        { value: 'percentagem', label: l('Percentagem das receitas', 'Share of revenue') },
        { value: 'mista', label: l('Valor fixo e percentagem', 'Fixed fee and share') },
      ],
      default: 'fixa',
    },
    { name: 'valor', type: 'money', section: 'preco', width: 'half', label: l('Valor fixo', 'Fixed fee'), showIf: (v) => v.remuneracao !== 'percentagem' },
    { name: 'percentagem', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, label: l('Percentagem das receitas líquidas (%)', 'Share of net revenue (%)'), showIf: (v) => v.remuneracao !== 'fixa' },
    { name: 'contasPeriodo', type: 'select', section: 'preco', width: 'half', label: l('Prestação de contas', 'Statements'), options: [{ value: 'trimestral', label: l('Trimestral', 'Quarterly') }, { value: 'semestral', label: l('Semestral', 'Half-yearly') }, { value: 'anual', label: l('Anual', 'Yearly') }], default: 'semestral', showIf: (v) => v.remuneracao !== 'fixa' },
    ivaField('preco'),
    ...formaPagamentoFields('preco'),

    { name: 'reconhecimento', type: 'toggle', section: 'clausulas', default: true, label: l('Espaço para reconhecimento notarial das assinaturas', 'Space for notarial certification'), help: l('Recomendado na cessão total: dá data certa e prova a autoria da assinatura.', 'Recommended for a full assignment: certain date and proof of signature.') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'autor', 'autor', 'author'), ...partyWarnings(v, 'adquirente', 'adquirente', 'assignee')];
    if (!USOS.some((u) => v[u.name])) w.push({ level: 'error', message: l('Indique pelo menos um modo de utilização: a lei exige que o contrato os indique.', 'Choose at least one form of use: the law requires the contract to state them.') });
    if (v.remuneracao !== 'percentagem' && money(v.valor) == null) w.push({ level: 'warning', field: 'valor', message: l('Indique o valor (ou "0" se for gratuito).', 'Enter the fee (or 0 if free).') });
    w.push({ level: 'info', message: l(`O contrato deve ser escrito e indicar os modos de utilização, o tempo, o lugar e o preço. Os direitos morais (ser identificado como autor e a integridade da obra) não se transmitem (${cite('digDireitosAutorTransmissao')}).`, 'The contract must be written and state forms of use, time, place and price. Moral rights cannot be transferred.') });
    if (modelo(v) === 'encomenda') w.push({ level: 'info', message: l(`Sem cláusula expressa, os direitos sobre a obra encomendada ficam com o autor (${cite('digObraEncomenda')}).`, 'Without an express clause, rights in a commissioned work stay with the author.') });
    return w;
  },

  personName: (v) => partyName(v, 'autor') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const mo = modelo(v);
    const A = mo === 'licenca' ? papel(v, 'autor', 'Licenciante', 'Licenciante') : papel(v, 'autor', 'Autor', 'Autora');
    const B = mo === 'licenca' ? papel(v, 'adquirente', 'Licenciado', 'Licenciada', true) : papel(v, 'adquirente', 'Cessionário', 'Cessionária', true);
    const A2 = A;
    const tipo = TIPOS[str(v.obraTipo)] ?? 'obra';
    const titulo = str(v.obraTitulo);
    const obra = `${tipo}${titulo ? ` intitulada "${titulo}"` : ''}`;
    const usos = USOS.filter((u) => v[u.name]).map((u) => u.texto);
    const anos = Number(v.duracaoAnos);
    const tempo = Number.isFinite(anos) && anos > 0 ? `pelo prazo de ${prazo(anos, 'ano')}` : 'por todo o período de protecção legal da obra';
    const lugar = v.territorio === 'mocambique' ? 'em Moçambique' : 'em todo o mundo';
    const pctTxt = `${String(v.percentagem ?? BLANK).replace('.', ',')}%`;

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar(
        mo === 'encomenda'
          ? [
              `Pelo presente contrato, ${B.o} encomenda ${A.ao} a criação de uma ${obra}, com as seguintes características: ${semPonto(v.obraDescricao) || BLANK}.`,
              `${A.O} entrega a obra até ${dateLong(v.dataEntrega)}, em formato adequado à utilização prevista, incluindo os ficheiros editáveis, e executa até ${Number(v.revisoes) > 0 ? Number(v.revisoes) : 'zero'} ${Number(v.revisoes) === 1 ? 'ronda' : 'rondas'} de alterações pedidas por escrito ${B.pelo}; as alterações adicionais são orçamentadas à parte.`,
            ]
          : [
              `${A.O} é ${A.f ? 'a autora' : 'o autor'} e ${A.f ? 'a titular' : 'o titular'} dos direitos patrimoniais sobre a ${obra}: ${semPonto(v.obraDescricao) || BLANK}.`,
              mo === 'licenca'
                ? `Pelo presente contrato, ${A2.o} autoriza ${B.o} a utilizar a obra nos termos das cláusulas seguintes, mantendo a titularidade dos direitos.`
                : `Pelo presente contrato, ${A.o} transmite ${B.ao} os direitos patrimoniais sobre a obra, nos termos das cláusulas seguintes.`,
            ],
      ),
      en: mo === 'encomenda' ? 'The client commissions the work described, delivered by the stated date with editable files and the revision rounds stated.' : mo === 'licenca' ? 'The author owns the work and licenses its use, keeping ownership.' : 'The author owns the work and assigns the economic rights.',
    });
    cl.push({
      id: 'direitos',
      heading: mo === 'licenca' ? 'Âmbito da licença' : 'Direitos transmitidos',
      text: numerar([
        mo === 'licenca'
          ? `A licença é ${v.exclusivo ? 'exclusiva' : 'não exclusiva'}, válida ${lugar}, ${tempo}, e abrange os seguintes modos de utilização:`
          : `${mo === 'encomenda' ? `Com a entrega e o pagamento integral do preço, ${A.o} transmite ${B.ao}` : `${A.O} transmite ${B.ao}`}, ${v.exclusivo ? 'em exclusivo' : 'sem exclusividade'}, ${lugar} e ${tempo}, os direitos patrimoniais de autor sobre a obra, para os seguintes modos de utilização:`,
      ]),
      items: usos.length ? usos.map((s, i) => `${s}${i === usos.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: `${mo === 'licenca' ? 'Licence' : 'Assignment'} ${v.exclusivo ? 'exclusive' : 'non-exclusive'}, ${v.territorio === 'mocambique' ? 'Mozambique' : 'worldwide'}, ${Number.isFinite(anos) && anos > 0 ? `${anos} years` : 'full legal term'}, for the forms of use listed.`,
    });
    cl.push({
      id: 'reserva',
      heading: 'Utilizações não previstas',
      text: `Os modos de utilização não indicados na cláusula anterior ${mo === 'licenca' ? 'não estão autorizados' : 'continuam a pertencer ' + A.ao} e dependem de novo acordo escrito.`,
      en: 'Uses not listed are not granted and require a new written agreement.',
    });
    cl.push({
      id: 'moral',
      heading: 'Direitos morais',
      text: numerar([
        `${A.O} conserva o direito de reivindicar a autoria da obra e de se opor a qualquer deformação ou modificação que afecte a sua honra ou reputação, direitos que são inalienáveis e irrenunciáveis.`,
        v.semCreditos
          ? `${A.O} aceita que a obra seja utilizada sem menção do seu nome, por a sua natureza o justificar, sem prejuízo de poder reivindicar a autoria a todo o tempo.`
          : `Em cada utilização, ${B.o} identifica ${A.o}${str(v.creditos) ? ` com a menção ${semPonto(v.creditos)}` : ' de forma adequada ao meio utilizado'}.`,
      ]),
      en: v.semCreditos ? 'The author keeps moral rights but agrees the work may be used without credit.' : 'The author keeps moral rights; each use credits the author as stated.',
    });
    cl.push({
      id: 'garantias',
      heading: 'Garantias do autor',
      text: `${A.O} garante que a obra é original, que não viola direitos de terceiros e que não transmitiu nem onerou anteriormente os direitos agora ${mo === 'licenca' ? 'licenciados' : 'transmitidos'}${mo === 'licenca' && !v.exclusivo ? ' em termos incompatíveis com o presente contrato' : ''}, obrigando-se a indemnizar ${B.o} pelos prejuízos resultantes da falta destas garantias.`,
      en: 'The author warrants originality, non-infringement and that the rights were not previously granted, and indemnifies the other party otherwise.',
    });
    const valor = money(v.valor);
    cl.push({
      id: 'remuneracao',
      heading: 'Remuneração',
      text: numerar([
        v.remuneracao === 'percentagem'
          ? `Como contrapartida, ${B.o} paga ${A.ao} ${pctTxt} das receitas líquidas obtidas com a exploração da obra.`
          : v.remuneracao === 'mista'
            ? `Como contrapartida, ${B.o} paga ${A.ao} o valor fixo de ${valorTexto(valor)}${ivaTexto(v.iva)} e, ainda, ${pctTxt} das receitas líquidas obtidas com a exploração da obra.`
            : `Como contrapartida, ${B.o} paga ${A.ao} o valor de ${valorTexto(valor)}${ivaTexto(v.iva)}${mo === 'encomenda' ? ', sendo metade paga na assinatura e o restante na entrega da obra' : ''}.`,
        v.remuneracao !== 'fixa' ? `${B.O} presta contas ${A.ao} com periodicidade ${str(v.contasPeriodo) || 'semestral'}, com indicação das utilizações e das receitas, e paga o montante devido nos trinta dias seguintes; ${A.o} pode verificar os registos correspondentes.` : '',
        `Os pagamentos são feitos ${modoPagamento(v, A)}, contra recibo.`,
      ]),
      en: v.remuneracao === 'percentagem' ? 'A share of net revenue, with periodic statements.' : v.remuneracao === 'mista' ? 'A fixed fee plus a share of net revenue, with statements.' : `Fixed fee ${valor != null ? formatMoney(valor) : '—'}${mo === 'encomenda' ? ', half on signing, half on delivery' : ''}.`,
    });
    if (mo === 'encomenda') {
      cl.push({
        id: 'portfolio',
        heading: 'Portefólio',
        text: `${A.O} pode mostrar a obra no seu portefólio e em concursos, depois de ${B.o} a divulgar publicamente, salvo oposição escrita ${B.de}.`,
        en: 'The author may show the work in a portfolio once it is public, unless the client objects in writing.',
      });
    }
    cl.push(clConfidencialidade(A, B));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: MODELOS[mo].titulo,
      subtitle: titulo || undefined,
      parties: [
        { p: 'autor', role: A2, en: 'Author' },
        { p: 'adquirente', role: B, en: mo === 'licenca' ? 'Licensee' : 'Assignee' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'autor', A2), assinatura(ctx, 'adquirente', B, true)],
      notario: v.reconhecimento ? `Reconhecimento das assinaturas ${A2.de} e ${B.de}.` : undefined,
    });
  },
});
