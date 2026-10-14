// Contrato de comodato: free loan of a house, vehicle or equipment, with the
// duty to return it. If any payment is agreed it is a lease, not a comodato.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, juntar, lines, numerar, papel, partesBlocks,
  partyFields, partyName, partyWarnings, quantos, semPonto, str, testemunhasField,
} from './_contratos';

const DESPESAS = [
  { name: 'despesaConsumos', pt: 'os consumos de água, energia e comunicações', en: 'utilities', imovel: true, viatura: false },
  { name: 'despesaManutencao', pt: 'a manutenção corrente e as pequenas reparações', en: 'routine maintenance', imovel: true, viatura: true },
  { name: 'despesaCombustivel', pt: 'o combustível e as portagens', en: 'fuel and tolls', imovel: false, viatura: true },
];

export default defineTemplate({
  id: 'contrato-de-comodato',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'comodante', title: l('Comodante (quem empresta)', 'Lender (owner)'), personRole: 'outro' },
    { id: 'comodatario', title: l('Comodatário (quem recebe)', 'Borrower (user)'), personRole: 'outro' },
    { id: 'bem', title: l('Bem emprestado', 'Item lent') },
    { id: 'prazo', title: l('Uso, prazo e despesas', 'Use, term and costs') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('comodante', { fromProfile: true }),
    ...partyFields('comodatario'),

    {
      name: 'bemTipo',
      type: 'radio',
      section: 'bem',
      label: l('Tipo de bem', 'Type of item'),
      options: [
        { value: 'imovel', label: l('Casa ou outro imóvel', 'House or property') },
        { value: 'viatura', label: l('Viatura', 'Vehicle') },
        { value: 'equipamento', label: l('Equipamento ou outro bem', 'Equipment or other item') },
      ],
      default: 'imovel',
    },
    {
      name: 'bemDescricao',
      type: 'text',
      section: 'bem',
      required: true,
      label: l('Descrição', 'Description'),
      placeholder: l('Ex.: moradia do tipo 2 / Toyota Hilux, cor branca / gerador Honda 5 kVA', 'E.g. two-bedroom house / white Toyota Hilux / Honda 5 kVA generator'),
    },
    { name: 'imovelMorada', type: 'text', section: 'bem', label: l('Localização do imóvel', 'Property location'), showIf: (v) => v.bemTipo === 'imovel' },
    { name: 'viaturaMatricula', type: 'text', section: 'bem', width: 'half', label: l('Matrícula', 'Registration number'), showIf: (v) => v.bemTipo === 'viatura' },
    { name: 'viaturaSeguro', type: 'text', section: 'bem', width: 'half', label: l('Seguro (apólice e seguradora)', 'Insurance (policy and insurer)'), showIf: (v) => v.bemTipo === 'viatura' },
    { name: 'equipamentoSerie', type: 'text', section: 'bem', width: 'half', label: l('N.º de série / identificação', 'Serial number'), showIf: (v) => v.bemTipo === 'equipamento' },
    { name: 'estadoBem', type: 'text', section: 'bem', label: l('Estado do bem na entrega', 'Condition on handover'), placeholder: l('Ex.: bom estado, pintura recente, sem avarias', 'E.g. good condition, no faults') },
    {
      name: 'inventario',
      type: 'lines',
      section: 'bem',
      label: l('Inventário (opcional)', 'Inventory (optional)'),
      addLabel: l('Adicionar artigo', 'Add item'),
      columns: [
        { name: 'item', type: 'text', label: l('Artigo', 'Item') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity'), min: 1 },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition') },
      ],
    },

    {
      name: 'fim',
      type: 'text',
      section: 'prazo',
      required: true,
      label: l('Uso permitido', 'Permitted use'),
      placeholder: l('Ex.: habitação do comodatário e do seu agregado familiar', 'E.g. home for the borrower and family'),
    },
    {
      name: 'prazoTipo',
      type: 'radio',
      section: 'prazo',
      label: l('Prazo', 'Term'),
      options: [
        { value: 'certo', label: l('Até uma data', 'Until a date') },
        { value: 'indeterminado', label: l('Sem data de fim', 'No end date') },
      ],
      default: 'certo',
    },
    { name: 'dataInicio', type: 'date', section: 'prazo', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'prazo', width: 'half', label: l('Fim', 'End'), showIf: (v) => v.prazoTipo === 'certo' },
    { name: 'avisoRestituicaoDias', type: 'number', section: 'prazo', width: 'half', min: 1, max: 180, default: 30, label: l('Aviso para devolver (dias)', 'Notice to return (days)'), help: l('Prazo para devolver depois de o comodante pedir por escrito.', 'Time to return the item after a written request.') },
    ...DESPESAS.map((d) => ({
      name: d.name,
      type: 'toggle' as const,
      section: 'prazo',
      default: true,
      label: l(`O comodatário paga ${d.pt}`, `The borrower pays ${d.en}`),
      showIf: (v: Record<string, unknown>) => (v.bemTipo === 'viatura' ? d.viatura : d.imovel),
    })),
    { name: 'obrasPermitidas', type: 'toggle', section: 'prazo', label: l('O comodatário pode fazer obras ou alterações', 'The borrower may make alterations'), showIf: (v) => v.bemTipo === 'imovel' },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v) => ({ inventario: lines(v.inventario).filter((r) => str(r.item)) }),

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'comodante', 'comodante', 'lender'), ...partyWarnings(v, 'comodatario', 'comodatário', 'borrower')];
    if (!str(v.bemDescricao)) w.push({ level: 'error', field: 'bemDescricao', message: l('Descreva o bem emprestado.', 'Describe the item lent.') });
    if (!str(v.fim)) w.push({ level: 'warning', field: 'fim', message: l('Indique o uso permitido.', 'State the permitted use.') });
    w.push({
      level: 'info',
      message: l(
        `O comodato é sempre gratuito (${cite('comodatoRegime')}). Se o comodatário pagar alguma contrapartida, é um arrendamento ou aluguer: use o Contrato de arrendamento.`,
        'A comodato is always free. If the borrower pays anything, it is a lease: use the Lease agreement.',
      ),
    });
    if (v.bemTipo === 'viatura') {
      w.push({ level: 'info', message: l('Entregue ao comodatário cópia do livrete, do título de propriedade e do seguro. Confirme se o seguro cobre outros condutores.', 'Give the borrower copies of the registration papers and insurance. Check the insurance covers other drivers.') });
    }
    return w;
  },

  personName: (v) => partyName(v, 'comodatario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const D = papel(v, 'comodante', 'Comodante', 'Comodante');
    const T = papel(v, 'comodatario', 'Comodatário', 'Comodatária');
    const tipo = v.bemTipo;
    const desc = semPonto(v.bemDescricao) || BLANK;
    const ident =
      tipo === 'imovel'
        ? `o imóvel composto por ${desc}, sito em ${semPonto(v.imovelMorada) || BLANK}`
        : tipo === 'viatura'
          ? `a viatura ${desc}, com a matrícula ${semPonto(v.viaturaMatricula) || BLANK}`
          : `o seguinte bem: ${desc}${str(v.equipamentoSerie) ? `, com o n.º de série ${semPonto(v.equipamentoSerie)}` : ''}`;
    const aviso = int(v.avisoRestituicaoDias);
    const despesas = DESPESAS.filter((d) => (tipo === 'viatura' ? d.viatura : d.imovel) && v[d.name]).map((d) => d.pt);

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `${D.O} é ${D.f ? 'dona' : 'dono'} e legítim${D.f ? 'a' : 'o'} possuidor${D.f ? 'a' : ''} d${ident}, que, pelo presente contrato, entrega gratuitamente ${T.ao}, para seu uso, com a obrigação de restituição nos termos deste contrato.`,
        `O bem é entregue ${str(v.estadoBem) ? `no seguinte estado: ${semPonto(v.estadoBem)}` : 'em bom estado de conservação e funcionamento'}${c.inventario.length ? ', com os artigos constantes do inventário anexo' : ''}, que ${T.o} declara conhecer e aceitar.`,
      ]),
      en: `The Lender hands ${tipo === 'viatura' ? 'the vehicle' : 'the item'} described to the Borrower free of charge, to use and return. It is handed over in the condition stated, which the Borrower accepts.`,
    });
    clauses.push({
      id: 'fim',
      heading: 'Uso',
      text: `O bem destina-se exclusivamente a ${semPonto(v.fim).replace(/^(a|para)\s+/i, '') || BLANK}, não podendo ${T.o} dar-lhe outro uso sem autorização escrita ${D.de}.`,
      en: `The item may only be used for: ${v.fim || '—'}.`,
    });
    clauses.push({
      id: 'prazo',
      heading: 'Prazo',
      text:
        v.prazoTipo === 'indeterminado'
          ? `O comodato tem início em ${dateLong(v.dataInicio)} e é feito por tempo indeterminado, devendo o bem ser restituído no prazo de ${quantos(aviso, 'dia', 'dias')} a contar da interpelação escrita ${D.de}.`
          : `O comodato tem início em ${dateLong(v.dataInicio)} e termina em ${dateLong(v.dataFim)}, data em que o bem deve ser restituído, salvo prorrogação acordada por escrito.`,
      en: v.prazoTipo === 'indeterminado' ? `No end date; the item is returned within ${aviso ?? '—'} days of a written request.` : `From ${v.dataInicio || '—'} to ${v.dataFim || '—'}.`,
    });
    clauses.push({
      id: 'gratuitidade',
      heading: 'Gratuitidade e despesas',
      text: numerar([
        `O presente comodato é gratuito, não sendo devida ${D.ao} qualquer contrapartida pelo uso do bem.`,
        despesas.length ? `São da responsabilidade ${T.de} ${juntar(despesas)}, durante a vigência do contrato.` : '',
        `As despesas extraordinárias${tipo === 'imovel' ? ', o imposto predial' : tipo === 'viatura' ? ', o imposto sobre veículos, a inspecção e o seguro' : ''} e as reparações não resultantes do uso normal ou de culpa ${T.de} são da responsabilidade ${D.de}.`,
      ]),
      en: `The loan is free. The Borrower pays ${despesas.length ? 'the running costs stated' : 'no running costs'}; extraordinary costs and taxes are for the Lender.`,
    });
    clauses.push({
      id: 'obrigacoes',
      heading: `Obrigações ${T.de}`,
      text: `${T.O} obriga-se a:`,
      items: [
        'guardar e conservar o bem com a diligência de um bom pai de família, respondendo pela sua perda ou deterioração que não resulte do uso normal;',
        `não o ceder, emprestar, arrendar ou por qualquer forma entregar a terceiros, sem autorização escrita ${D.de};`,
        tipo === 'imovel' && !v.obrasPermitidas
          ? `não fazer obras ou alterações sem autorização escrita ${D.de};`
          : tipo === 'viatura'
            ? 'conduzir ou permitir a condução apenas por pessoas legalmente habilitadas, respondendo pelas multas e transgressões cometidas durante o comodato;'
            : 'usar o bem de acordo com as instruções do fabricante;',
        `avisar imediatamente ${D.ao} de qualquer avaria, dano ou perigo que ameace o bem;`,
        `permitir ${D.ao}, mediante aviso prévio, verificar o estado do bem;`,
        'restituir o bem no fim do contrato, no estado em que o recebeu, salvo o desgaste resultante do uso normal e prudente.',
      ],
      en: 'The Borrower must look after the item, not pass it on, follow the use rules, report damage, allow inspection and return it in the same condition (normal wear excepted).',
    });
    if (tipo === 'imovel' && v.obrasPermitidas) {
      clauses.push({
        id: 'obras',
        heading: 'Obras',
        text: `${T.O} pode fazer obras de conservação e beneficiação, mediante comunicação prévia ${D.ao}; as benfeitorias realizadas ficam a fazer parte do imóvel, sem direito a indemnização, salvo acordo escrito em contrário.`,
        en: 'The Borrower may make improvements after notifying the Lender; they stay with the property without compensation unless agreed otherwise.',
      });
    }
    clauses.push({
      id: 'restituicao',
      heading: 'Restituição antecipada',
      text: `${D.O} pode exigir a restituição antecipada do bem se dele necessitar por motivo urgente e imprevisto, ou se ${T.o} violar as obrigações deste contrato, mediante comunicação escrita com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}, salvo em caso de uso indevido grave, em que a restituição é imediata.`,
      en: `The Lender may demand early return for an urgent unforeseen need or breach, with ${aviso ?? '—'} days’ written notice (immediately for serious misuse).`,
    });
    clauses.push(...clausulasFinais(v, { lei: `sobre o comodato (${cite('comodatoRegime')})` }));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de comodato' },
      ...partesBlocks(v, [
        { p: 'comodante', role: D, en: 'Lender' },
        { p: 'comodatario', role: T, en: 'Borrower' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de comodato, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This free-loan agreement is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'comodante', D, true), assinatura(ctx, 'comodatario', T)]),
    ];
    if (c.inventario.length) {
      blocks.push(
        { type: 'spacer', size: 'large' },
        { type: 'heading', text: 'Anexo — Inventário', align: 'center', keepWithNext: true },
        {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'right' },
            { label: 'Artigo', width: 3.5 },
            { label: 'Quant.', width: 0.8, align: 'right' },
            { label: 'Estado', width: 1.6 },
          ],
          rows: c.inventario.map((r: Record<string, unknown>, i: number) => [String(i + 1), str(r.item), str(r.quantidade) || '1', str(r.estado)]),
        },
        { type: 'signatures', columns: [assinatura(ctx, 'comodante', D), assinatura(ctx, 'comodatario', T)] },
      );
    }
    return blocks;
  },
});
