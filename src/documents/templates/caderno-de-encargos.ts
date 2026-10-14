// Caderno de encargos simplificado (fornecimento de bens): the technical and
// contractual conditions of a supply to the State — goods and specifications,
// delivery, inspection, warranty, payment, guarantees and penalties — for
// quotations and small tenders, or as Section of the tender document.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, entityName, l, localField } from './_shared';
import { signatarioColumn, signatarioFields } from './_estado';
import { deArt, diasTexto, entidadeProfileWarning, items, itensField, procedimentoFields, procedimentoNome, objectoComArtigo, qtd, semPonto, str } from './_contratacao';

export default defineTemplate({
  id: 'caderno-de-encargos',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'procedimento', title: l('Procedimento', 'Procedure') },
    { id: 'bens', title: l('Bens e especificações técnicas', 'Goods and specifications') },
    { id: 'entrega', title: l('Entrega, recepção e garantia', 'Delivery, acceptance and warranty') },
    { id: 'pagamento', title: l('Pagamento, garantias e multas', 'Payment, securities and penalties') },
    { id: 'assinatura', title: l('Aprovação', 'Approval') },
  ],
  fields: [
    localField(),
    dateField('data'),
    ...procedimentoFields('procedimento', { defaultModalidade: 'cotacoes' }),
    itensField('bens', { especificacao: true, label: l('Bens, especificações e quantidades', 'Goods, specifications and quantities') }),
    { name: 'amostras', type: 'toggle', section: 'bens', label: l('Exigir amostras ou catálogos com a proposta', 'Require samples or catalogues with the bid') },
    { name: 'localEntrega', type: 'text', section: 'entrega', label: l('Local de entrega', 'Delivery place'), placeholder: l('Ex.: Armazém da Direcção Provincial, Bairro de Muahivire, Nampula', 'E.g. Provincial store, Nampula') },
    { name: 'prazoEntrega', type: 'text', section: 'entrega', width: 'half', label: l('Prazo de entrega', 'Delivery period'), placeholder: l('Ex.: trinta dias após a assinatura do contrato', 'E.g. thirty days after signing') },
    { name: 'entregasParciais', type: 'toggle', section: 'entrega', width: 'half', label: l('Admitir entregas parciais', 'Allow partial deliveries') },
    { name: 'prazoSubstituicao', type: 'number', section: 'entrega', width: 'half', min: 1, max: 90, label: l('Prazo para substituir bens rejeitados (dias)', 'Days to replace rejected goods') },
    { name: 'garantiaTecnicaMeses', type: 'number', section: 'entrega', width: 'half', min: 0, max: 120, label: l('Garantia técnica (meses)', 'Warranty (months)') },
    { name: 'prazoPagamentoDias', type: 'number', section: 'pagamento', width: 'half', min: 1, max: 120, label: l('Pagamento: prazo após a factura (dias)', 'Payment: days after invoice') },
    { name: 'garantiaDefinitivaPct', type: 'number', section: 'pagamento', width: 'half', min: 0, max: 20, label: l('Garantia definitiva (% do contrato; 0 = não exigida)', 'Performance security (% of contract; 0 = none)') },
    { name: 'multaPermilagem', type: 'number', section: 'pagamento', width: 'half', min: 0, max: 10, label: l('Multa diária por atraso (‰)', 'Daily delay penalty (‰)') },
    { name: 'multaMaxPct', type: 'number', section: 'pagamento', width: 'half', min: 0, max: 100, label: l('Limite das multas (% do contrato)', 'Penalty cap (% of contract)') },
    ...signatarioFields('assinatura', l('Cargo de quem aprova', 'Approver’s position')),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!items(v).length) w.push({ level: 'error', field: 'itens', message: l('Acrescente os bens com as especificações e quantidades.', 'Add the goods with specifications and quantities.') });
    w.push({
      level: 'info',
      message: l(
        `Descreva as especificações pela função e pelo desempenho; não indique marcas, salvo se acompanhadas de «ou equivalente». O caderno de encargos integra o contrato (${cite('ctContratoClausulas')}).`,
        'Specify by function and performance; do not name brands unless followed by “or equivalent”. The specifications form part of the contract.',
      ),
    });
    return w;
  },

  personName: (v) => v.concursoNumero,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const list = items(v);
    const ent = entityName(ctx);
    const pct = (x: unknown) => (str(x) ? `${String(x).replace('.', ',')}` : BLANK);
    const meses = Number(v.garantiaTecnicaMeses);
    const gd = Number(v.garantiaDefinitivaPct);
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `O presente caderno de encargos fixa as condições técnicas e contratuais ${objectoComArtigo(v).replace(/^(o|a)\s/, (m) => (m.trim() === 'a' ? 'da ' : 'do '))}, no âmbito do ${procedimentoNome(v)}, lançado pel${deArt(ent) === 'da' ? 'a' : 'o'} ${ent}, adiante designad${deArt(ent) === 'da' ? 'a' : 'o'} por entidade contratante.`,
        en: 'These specifications set the technical and contractual terms of the supply.',
      },
      {
        id: 'especificacoes',
        heading: 'Especificações técnicas e quantidades',
        text: numerarTxt([
          'Os bens a fornecer, as quantidades e as especificações técnicas mínimas constam do quadro anexo, que faz parte integrante do presente caderno de encargos.',
          'Os bens são novos, de primeira qualidade, conformes às especificações e às normas técnicas aplicáveis, e com prazo de validade compatível com a sua utilização, quando aplicável.',
          'As referências a marcas ou modelos entendem-se sempre seguidas da expressão «ou equivalente».',
          v.amostras ? 'Os concorrentes apresentam com a proposta as amostras ou os catálogos dos bens propostos, que ficam na posse da entidade contratante até à recepção.' : '',
        ]),
        en: 'Goods, quantities and minimum specifications are in the annexed table; new, conforming goods; brands mean “or equivalent”.',
      },
      {
        id: 'entrega',
        heading: 'Local e prazo de entrega',
        text: numerarTxt([
          `Os bens são entregues em ${semPonto(v.localEntrega) || BLANK}, no prazo de ${semPonto(v.prazoEntrega) || BLANK}, por conta e risco do fornecedor, incluindo transporte, seguro e descarga.`,
          v.entregasParciais ? 'São admitidas entregas parciais, acompanhadas da respectiva guia de remessa.' : 'Não são admitidas entregas parciais, salvo autorização escrita da entidade contratante.',
        ]),
        en: 'Delivery place and period; transport, insurance and unloading by the supplier.',
      },
      {
        id: 'recepcao',
        heading: 'Inspecção e recepção',
        text: numerarTxt([
          'Os bens são inspeccionados no acto da entrega por uma comissão de recepção designada pela entidade contratante, que verifica a quantidade, a qualidade e a conformidade com as especificações e lavra o auto de recepção.',
          `Os bens desconformes são rejeitados e substituídos pelo fornecedor, à sua custa, no prazo de ${diasTexto(v.prazoSubstituicao)} contados da comunicação da rejeição.`,
        ]),
        en: 'Inspection and acceptance by a committee; rejected goods replaced at the supplier’s cost.',
      },
    ];
    if (Number.isFinite(meses) && meses > 0) {
      clauses.push({
        id: 'garantiaTecnica',
        heading: 'Garantia técnica',
        text: `O fornecedor garante os bens contra defeitos de fabrico e de funcionamento durante ${meses} ${meses === 1 ? 'mês' : 'meses'} contados da recepção, reparando-os ou substituindo-os sem custos para a entidade contratante.`,
        en: `Warranty of ${meses} months from acceptance.`,
      });
    }
    clauses.push(
      {
        id: 'preco',
        heading: 'Preço e pagamento',
        text: numerarTxt([
          'O preço inclui todos os encargos com o fornecimento, nomeadamente embalagem, transporte, seguro, descarga, impostos e taxas.',
          `O pagamento é feito por transferência bancária, no prazo de ${diasTexto(v.prazoPagamentoDias)} contados da recepção da factura, acompanhada do auto de recepção.`,
        ]),
        en: 'All-inclusive price; payment by transfer within the stated days after invoice and acceptance.',
      },
      {
        id: 'garantia',
        heading: 'Garantia definitiva',
        text:
          Number.isFinite(gd) && gd > 0
            ? `Antes da assinatura do contrato, o adjudicatário presta garantia definitiva no valor de ${pct(v.garantiaDefinitivaPct)}% do valor do contrato, por garantia bancária, seguro-caução ou depósito, libertada depois da recepção e do termo da garantia técnica.`
            : 'Não é exigida garantia definitiva.',
        en: gd > 0 ? 'Performance security as a percentage of the contract value.' : 'No performance security required.',
      },
      {
        id: 'multas',
        heading: 'Multas',
        text: `Pelo atraso na entrega, por facto imputável ao fornecedor, é aplicada uma multa diária de ${pct(v.multaPermilagem)}‰ do valor dos bens em atraso, até ao limite de ${pct(v.multaMaxPct)}% do valor do contrato, a partir do qual a entidade contratante pode rescindir o contrato.`,
        en: 'Daily delay penalty up to the cap; termination when reached.',
      },
      {
        id: 'legislacao',
        heading: 'Legislação aplicável',
        text: 'Em tudo o que não estiver previsto no presente caderno de encargos aplica-se o regulamento de contratação de empreitada de obras públicas, fornecimento de bens e prestação de serviços ao Estado e a demais legislação aplicável.',
        en: 'The public procurement regulation applies to anything not provided for.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Caderno de encargos', subtitle: `${procedimentoNome(v)} — ${semPonto(v.objecto) || BLANK}` },
      { type: 'numberedClauses', style: 'artigo', items: clauses },
      { type: 'heading', text: 'Anexo — Especificações técnicas e quantidades', align: 'center' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'right' },
          { label: 'Descrição', width: 2.4 },
          { label: 'Especificação técnica mínima', width: 3.4 },
          { label: 'Un.', width: 0.6, align: 'center' },
          { label: 'Qtd.', width: 0.7, align: 'right' },
        ],
        rows: (list.length ? list : [{ descricao: '', especificacao: '', unidade: '', quantidade: null }, { descricao: '', especificacao: '', unidade: '', quantidade: null }]).map((i, n) => [String(n + 1), i.descricao, i.especificacao, i.unidade, qtd(i.quantidade)]),
        grid: !list.length,
      },
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
      { type: 'signatures', columns: [{ ...signatarioColumn(v), role: `Aprovado — ${signatarioColumn(v).role}` }] },
    ];
    return blocks;
  },
});

function numerarTxt(parts: string[]): string {
  const p = parts.filter(Boolean);
  return p.length === 1 ? p[0] : p.map((t, i) => `${i + 1}. ${t}`).join('\n');
}
