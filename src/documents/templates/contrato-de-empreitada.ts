// Contrato de empreitada de obra particular (construção, ampliação,
// reabilitação). Public works follow the public procurement rules instead.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, juntar, lines, num, numerar, papel, partesBlocks,
  partyFields, partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

const OBRA_TIPOS = [
  { value: 'construcao', label: l('Construção nova', 'New construction'), pt: 'construção' },
  { value: 'ampliacao', label: l('Ampliação', 'Extension'), pt: 'ampliação' },
  { value: 'reabilitacao', label: l('Reabilitação / remodelação', 'Renovation'), pt: 'reabilitação' },
  { value: 'vedacao', label: l('Muro ou vedação', 'Wall or fence'), pt: 'construção de muro de vedação' },
  { value: 'outra', label: l('Outra obra', 'Other works'), pt: 'execução' },
];

const ANEXOS = [
  { name: 'anexoProjecto', pt: 'o projecto de execução e os desenhos', en: 'design and drawings' },
  { name: 'anexoCaderno', pt: 'o caderno de encargos', en: 'specifications' },
  { name: 'anexoQuantidades', pt: 'a lista de quantidades e preços unitários', en: 'bill of quantities' },
  { name: 'anexoCronograma', pt: 'o cronograma de execução', en: 'work schedule' },
];

export default defineTemplate({
  id: 'contrato-de-empreitada',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'dono', title: l('Dono da obra', 'Owner'), personRole: 'outro' },
    { id: 'empreiteiro', title: l('Empreiteiro', 'Contractor'), personRole: 'outro' },
    { id: 'obra', title: l('Obra', 'Works') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'prazo', title: l('Prazo e penalidades', 'Time and penalties') },
    { id: 'garantia', title: l('Licenças, seguros e garantia', 'Permits, insurance and warranty') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('dono', { fromProfile: true }),
    ...partyFields('empreiteiro', { tipoDefault: 'empresa' }),
    { name: 'alvaraNumero', type: 'text', section: 'empreiteiro', width: 'half', label: l('Alvará de empreiteiro n.º', 'Contractor licence no.'), legal: l('O empreiteiro deve ter alvará válido da classe adequada ao valor da obra.', 'The contractor must hold a valid licence of the class matching the value of the works.') },
    { name: 'alvaraClasse', type: 'text', section: 'empreiteiro', width: 'half', label: l('Classe e categoria', 'Class and category'), placeholder: l('Ex.: 3.ª classe, edifícios', 'E.g. class 3, buildings') },

    { name: 'obraTipo', type: 'select', section: 'obra', width: 'half', label: l('Tipo de obra', 'Type of works'), options: OBRA_TIPOS.map(({ value, label }) => ({ value, label })), default: 'construcao' },
    { name: 'obraLocal', type: 'text', section: 'obra', width: 'half', required: true, label: l('Local da obra', 'Site address') },
    {
      name: 'obraDescricao',
      type: 'textarea',
      section: 'obra',
      required: true,
      rows: 3,
      label: l('Descrição da obra', 'Description of the works'),
      placeholder: l('Ex.: moradia do tipo 3, de rés-do-chão, com fossa séptica e cisterna, conforme projecto aprovado', 'E.g. three-bedroom house with septic tank and water tank, as per approved design'),
    },
    ...ANEXOS.map((a, i) => ({
      name: a.name,
      type: 'toggle' as const,
      section: 'obra',
      default: i < 3,
      label: l(`Anexo: ${a.pt.replace(/^(o|a) /, '')}`, `Annex: ${a.en}`),
    })),
    { name: 'materiaisDono', type: 'textarea', section: 'obra', rows: 2, label: l('Materiais fornecidos pelo dono da obra (se houver)', 'Materials supplied by the owner (if any)') },

    {
      name: 'modalidade',
      type: 'radio',
      section: 'preco',
      label: l('Modalidade', 'Pricing'),
      options: [
        { value: 'global', label: l('Preço global (valor fechado)', 'Lump sum') },
        { value: 'serie', label: l('Série de preços (por medição)', 'Measured (unit prices)') },
      ],
      default: 'global',
    },
    { name: 'preco', type: 'money', section: 'preco', required: true, width: 'half', label: l('Preço (ou valor estimado)', 'Price (or estimate)') },
    {
      name: 'ivaRegime',
      type: 'select',
      section: 'preco',
      width: 'half',
      label: l('IVA', 'VAT'),
      options: [
        { value: 'incluido', label: l('IVA incluído', 'VAT included') },
        { value: 'acrescido', label: l('Acresce IVA', 'Plus VAT') },
        { value: 'naoAplica', label: l('Sem IVA', 'No VAT') },
      ],
      default: 'acrescido',
    },
    { name: 'adiantamentoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 50, default: 20, label: l('Adiantamento na assinatura (%)', 'Advance on signing (%)') },
    { name: 'garantiaAdiantamento', type: 'toggle', section: 'preco', label: l('Adiantamento contra garantia bancária do empreiteiro', 'Advance against a bank guarantee from the contractor') },
    {
      name: 'pagamentoModo',
      type: 'radio',
      section: 'preco',
      label: l('Pagamento do restante', 'Payment of the balance'),
      options: [
        { value: 'autos', label: l('Autos de medição mensais', 'Monthly measurement certificates') },
        { value: 'fases', label: l('Por fases da obra', 'By stage') },
      ],
      default: 'fases',
    },
    {
      name: 'fases',
      type: 'lines',
      section: 'preco',
      label: l('Fases e percentagem do preço', 'Stages and share of the price'),
      help: l('Somadas ao adiantamento, as percentagens devem cobrir o preço total.', 'Together with the advance, the stages must cover the whole price.'),
      addLabel: l('Adicionar fase', 'Add stage'),
      showIf: (v) => v.pagamentoModo === 'fases',
      columns: [
        { name: 'fase', type: 'text', label: l('Fase', 'Stage') },
        { name: 'percentagem', type: 'number', label: l('% do preço', '% of price') },
      ],
      default: [
        { fase: 'Fundações e estrutura', percentagem: 30 },
        { fase: 'Paredes e cobertura', percentagem: 25 },
        { fase: 'Acabamentos, canalização e electricidade', percentagem: 25 },
      ],
    },
    { name: 'prazoPagamentoDias', type: 'number', section: 'preco', width: 'half', min: 1, max: 90, default: 15, label: l('Prazo de pagamento após factura (dias)', 'Payment term after invoice (days)') },
    { name: 'retencaoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 20, default: 5, label: l('Retenção de garantia (%)', 'Retention (%)'), help: l('Parte de cada pagamento retida até à recepção definitiva. É prática corrente, não uma exigência legal.', 'Part of each payment held until final acceptance. Common practice, not a legal requirement.') },

    { name: 'dataInicio', type: 'date', section: 'prazo', width: 'half', label: l('Início dos trabalhos', 'Start of works') },
    { name: 'prazoDias', type: 'number', section: 'prazo', width: 'half', required: true, min: 1, max: 1500, default: 180, label: l('Prazo de execução (dias)', 'Completion time (days)') },
    { name: 'multaDiaria', type: 'money', section: 'prazo', width: 'half', label: l('Multa por dia de atraso', 'Penalty per day of delay') },
    { name: 'multaLimitePct', type: 'number', section: 'prazo', width: 'half', min: 0, max: 30, default: 10, label: l('Limite das multas (% do preço)', 'Penalty cap (% of price)') },
    { name: 'abandonoDias', type: 'number', section: 'prazo', width: 'half', min: 1, max: 90, default: 15, label: l('Abandono da obra após (dias parados)', 'Abandonment after (days stopped)') },

    {
      name: 'licencaResponsavel',
      type: 'radio',
      section: 'garantia',
      label: l('Licença de construção obtida por', 'Building permit obtained by'),
      options: [
        { value: 'dono', label: l('Dono da obra', 'Owner') },
        { value: 'empreiteiro', label: l('Empreiteiro', 'Contractor') },
      ],
      default: 'dono',
    },
    { name: 'seguroRC', type: 'toggle', section: 'garantia', default: true, label: l('O empreiteiro tem seguro de responsabilidade civil', 'Contractor holds third-party liability insurance') },
    { name: 'garantiaMeses', type: 'number', section: 'garantia', width: 'half', min: 1, max: 60, default: 12, label: l('Prazo de garantia até à recepção definitiva (meses)', 'Warranty period to final acceptance (months)') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v, { legal }) => {
    const preco = money(v.preco);
    const taxaIva = legal.value<number>('ivaTaxaNormal');
    const iva = preco != null && v.ivaRegime === 'acrescido' ? roundMoney(preco * taxaIva) : 0;
    const adiant = num(v.adiantamentoPct) ?? 0;
    const fases = lines(v.fases)
      .filter((r) => str(r.fase))
      .map((r) => ({ fase: str(r.fase), pct: num(r.percentagem) ?? 0 }));
    const somaFases = fases.reduce((s, f) => s + f.pct, 0) + adiant;
    return { preco, iva, total: preco != null ? roundMoney(preco + iva) : null, adiant, fases, somaFases, valorAdiantamento: preco != null ? roundMoney((preco * adiant) / 100) : null };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [...partyWarnings(v, 'dono', 'dono da obra', 'owner'), ...partyWarnings(v, 'empreiteiro', 'empreiteiro', 'contractor')];
    if (!str(v.obraLocal)) w.push({ level: 'error', field: 'obraLocal', message: l('Indique o local da obra.', 'Enter the site address.') });
    if (c.preco == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço da empreitada.', 'Enter the contract price.') });
    if (v.pagamentoModo === 'fases' && c.fases.length && Math.abs(c.somaFases - 100) > 0.01) {
      w.push({ level: 'error', field: 'fases', message: l(`O adiantamento e as fases somam ${c.somaFases}% do preço; devem cobrir o preço total.`, `The advance and stages add up to ${c.somaFases}% of the price; they must cover the whole price.`) });
    }
    if (!str(v.alvaraNumero)) {
      w.push({
        level: 'warning',
        field: 'alvaraNumero',
        message: l(`Os empreiteiros devem ter alvará válido da classe adequada ao valor da obra (${cite('alvaraEmpreiteiro')}). Peça uma cópia e confirme a validade.`, 'Contractors must hold a valid licence of the right class. Ask for a copy and check it is valid.'),
      });
    }
    const d = legal.value<{ denunciaDias: number; caducidadeAnos: number; imoveisAnos: number }>('empreitadaDefeitos');
    w.push({
      level: 'info',
      message: l(
        `Defeitos: o dono da obra deve denunciá-los por escrito até ${d.denunciaDias} dias depois de os descobrir; nos imóveis de longa duração, o empreiteiro responde durante ${d.imoveisAnos} anos pelos defeitos graves (${cite('empreitadaDefeitos')}).`,
        `Defects: the owner must report them in writing within ${d.denunciaDias} days of discovery; for long-lasting buildings the contractor is liable for ${d.imoveisAnos} years for serious defects.`,
      ),
    });
    w.push({ level: 'info', message: l('Antes de começar, obtenha a licença de construção no Conselho Municipal. Pague contra autos ou fases concluídas, com factura e recibo.', 'Before starting, obtain the building permit from the Municipal Council. Pay against completed stages, with invoice and receipt.') });
    return w;
  },

  personName: (v) => partyName(v, 'empreiteiro') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const D = papel(v, 'dono', 'Dono da Obra', 'Dona da Obra');
    const E = papel(v, 'empreiteiro', 'Empreiteiro', 'Empreiteira');
    const tipo = OBRA_TIPOS.find((t) => t.value === v.obraTipo) ?? OBRA_TIPOS[0];
    const anexos = ANEXOS.filter((a) => v[a.name]);
    const prazoDias = int(v.prazoDias);
    const pagDias = int(v.prazoPagamentoDias);
    const abandono = int(v.abandonoDias);
    const garantia = int(v.garantiaMeses);
    const retencao = num(v.retencaoPct) ?? 0;

    const alvara = str(v.alvaraNumero)
      ? ` ${E.O} é titular do alvará de empreiteiro de construção civil n.º ${semPonto(v.alvaraNumero)}${str(v.alvaraClasse) ? `, ${semPonto(v.alvaraClasse)}` : ''}, válido, e declara estar habilitado a executar a obra.`
      : '';

    const clauses: ClauseItem[] = [];
    clauses.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${E.o} obriga-se a executar para ${D.o}, em regime de empreitada, a obra de ${tipo.pt} de ${semPonto(v.obraDescricao).replace(/^(a|uma|o|um)\s+/i, '') || BLANK}, no local sito em ${semPonto(v.obraLocal) || BLANK}.`,
        anexos.length
          ? `A obra é executada de acordo com ${juntar(anexos.map((a) => a.pt))}, que constituem anexos ao presente contrato e dele fazem parte integrante. Em caso de divergência, prevalece o disposto no presente contrato.`
          : 'A obra é executada de acordo com as boas regras da construção e as normas técnicas aplicáveis.',
        alvara.trim(),
      ]),
      en: `The Contractor will carry out the ${tipo.pt} works described at ${v.obraLocal || '—'}${anexos.length ? ', per the annexed documents' : ''}.`,
    });
    const ivaTxt = v.ivaRegime === 'acrescido' ? `, acrescido de IVA à taxa legal, no valor de ${valorTexto(c.iva)}` : v.ivaRegime === 'incluido' ? ', com IVA incluído' : '';
    clauses.push({
      id: 'preco',
      heading: 'Preço',
      text: numerar([
        v.modalidade === 'serie'
          ? `A empreitada é por série de preços, sendo o preço calculado pela aplicação dos preços unitários da lista de quantidades às quantidades efectivamente executadas e medidas, com o valor estimado de ${valorTexto(c.preco)}${ivaTxt}.`
          : `A empreitada é por preço global, no valor de ${valorTexto(c.preco)}${ivaTxt}.`,
        `O preço inclui todos os materiais, mão-de-obra, equipamentos, transportes, ferramentas e demais encargos necessários à completa execução da obra${str(v.materiaisDono) ? `, com excepção dos seguintes materiais, fornecidos ${D.pelo}: ${semPonto(v.materiaisDono)}` : ''}.`,
      ]),
      en: `${v.modalidade === 'serie' ? 'Measured contract, estimated at' : 'Lump sum of'} ${c.preco != null ? formatMoney(c.preco) : '—'}${v.ivaRegime === 'acrescido' ? ' plus VAT' : ''}, covering all materials, labour and equipment.`,
    });
    const pag: string[] = [];
    if (c.adiant > 0) {
      pag.push(
        `Na data da assinatura do presente contrato, ${D.o} paga ${E.ao}, a título de adiantamento, ${pct(c.adiant)} do preço, no valor de ${valorTexto(c.valorAdiantamento)}${v.garantiaAdiantamento ? `, contra a entrega de garantia bancária de igual valor, que é libertada à medida que o adiantamento for deduzido nos pagamentos seguintes` : ''}.`,
      );
    }
    if (v.pagamentoModo === 'fases' && c.fases.length) {
      pag.push(
        `O restante do preço é pago por fases, após a conclusão de cada uma, verificada por ambas as partes: ${c.fases.map((f: { fase: string; pct: number }) => `${f.fase.replace(/^./, (x) => x.toLowerCase())}, ${pct(f.pct)}`).join('; ')}.`,
      );
    } else {
      pag.push(`O restante do preço é pago mensalmente, com base em autos de medição dos trabalhos executados, elaborados ${E.pelo} e aprovados ${D.pelo}.`);
    }
    pag.push(`Cada pagamento é feito no prazo de ${quantos(pagDias, 'dia', 'dias')} após a aprovação da fase ou do auto e a apresentação da respectiva factura.`);
    if (retencao > 0) {
      pag.push(`Em cada pagamento, ${D.o} retém ${pct(retencao)} do respectivo valor, a título de garantia da boa execução da obra, montante que é restituído ${E.ao} com a recepção definitiva.`);
    }
    clauses.push({ id: 'pagamento', heading: 'Pagamento', text: numerar(pag), en: `Advance ${c.adiant}% on signing, balance by ${v.pagamentoModo === 'fases' ? 'stages' : 'monthly measurements'}, paid within ${pagDias ?? '—'} days of invoice${retencao ? `, with ${retencao}% retention until final acceptance` : ''}.` });

    const multa = money(v.multaDiaria);
    clauses.push({
      id: 'prazo',
      heading: 'Prazo de execução',
      text: numerar([
        `Os trabalhos iniciam-se em ${dateLong(v.dataInicio)} e a obra deve estar concluída no prazo de ${quantos(prazoDias, 'dia', 'dias')} a contar dessa data.`,
        multa != null && multa > 0
          ? `Por cada dia de atraso na conclusão da obra imputável ${E.ao}, este paga ${D.ao} uma multa de ${valorTexto(multa)}, até ao limite de ${pct(v.multaLimitePct)} do preço, que pode ser deduzida nos pagamentos devidos.`
          : '',
        `O prazo é prorrogado pelo período correspondente aos atrasos causados por facto ${D.de}, por alterações por ${D.f ? 'ela' : 'ele'} pedidas ou por caso de força maior, desde que comunicados por escrito logo que conhecidos.`,
      ]),
      en: `Works start on ${v.dataInicio || '—'} and finish within ${prazoDias ?? '—'} days${multa ? `; delay penalty ${formatMoney(multa)} a day (capped)` : ''}; extended for delays caused by the owner, changes or force majeure.`,
    });
    clauses.push({
      id: 'execucao',
      heading: 'Materiais, execução e pessoal',
      text: numerar([
        `${E.O} executa a obra com materiais de boa qualidade, conformes ao projecto e às normas técnicas aplicáveis, e responde pelos actos dos seus trabalhadores e subempreiteiros.`,
        `Os trabalhadores ao serviço da obra são da exclusiva responsabilidade ${E.de}, nomeadamente quanto a salários, inscrição na segurança social, seguro de acidentes de trabalho e segurança e saúde no trabalho.`,
        `${E.O} mantém o estaleiro limpo e seguro e, no fim da obra, remove os materiais sobrantes, o entulho e as instalações provisórias.`,
      ]),
      en: 'Good-quality materials per the design; the Contractor is responsible for its workers and subcontractors (pay, social security, accident insurance, safety) and clears the site at the end.',
    });
    clauses.push({
      id: 'fiscalizacao',
      heading: 'Fiscalização',
      text: `${D.O} pode fiscalizar a execução da obra, por si ou por técnico que designe, sem que isso diminua a responsabilidade ${E.de} pela sua boa execução.`,
      en: 'The Owner may inspect the works directly or through an engineer, without reducing the Contractor’s liability.',
    });
    clauses.push({
      id: 'trabalhosMais',
      heading: 'Alterações e trabalhos a mais',
      text: 'Nenhuma alteração ao projecto nem trabalho a mais é executado sem acordo escrito prévio das partes quanto ao seu preço e à eventual prorrogação do prazo.',
      en: 'No changes or extra works without prior written agreement on price and time.',
    });
    clauses.push({
      id: 'licencas',
      heading: 'Licenças e seguros',
      text: numerar([
        `A obtenção da licença de construção e das demais autorizações necessárias cabe ${v.licencaResponsavel === 'empreiteiro' ? E.ao : D.ao}.`,
        v.seguroRC ? `${E.O} mantém em vigor, durante a execução da obra, seguro de responsabilidade civil por danos causados a terceiros.` : '',
      ]),
      en: `The building permit is obtained by the ${v.licencaResponsavel === 'empreiteiro' ? 'Contractor' : 'Owner'}${v.seguroRC ? '; the Contractor keeps third-party liability insurance' : ''}.`,
    });
    clauses.push({
      id: 'recepcao',
      heading: 'Recepção e garantia',
      text: numerar([
        'Concluída a obra, as partes procedem em conjunto à sua vistoria e lavram auto de recepção provisória, onde se registam os defeitos a corrigir e o prazo para a sua correcção.',
        `${E.O} garante a obra contra defeitos pelo prazo de ${quantos(garantia, 'mês', 'meses')} a contar da recepção provisória, obrigando-se a corrigir, à sua custa, os defeitos que lhe forem comunicados por escrito.`,
        'Findo o prazo de garantia e corrigidos os defeitos, lavra-se auto de recepção definitiva, sem prejuízo da responsabilidade do empreiteiro prevista na lei para os imóveis destinados a longa duração.',
      ]),
      en: `Joint inspection and provisional acceptance; ${garantia ?? '—'}-month warranty; then final acceptance, without prejudice to the statutory liability for long-lasting buildings.`,
    });
    clauses.push({
      id: 'resolucao',
      heading: 'Resolução',
      text: numerar([
        `Qualquer das partes pode resolver o contrato em caso de incumprimento grave da outra que não seja sanado no prazo de quinze dias após interpelação escrita.`,
        `Considera-se incumprimento grave ${E.de}, nomeadamente, a paragem injustificada dos trabalhos por mais de ${quantos(abandono, 'dia', 'dias')} consecutivos e a execução reiterada de trabalhos com defeito.`,
        `Em caso de resolução, faz-se a medição dos trabalhos executados, que são pagos pelo seu valor, deduzidos dos adiantamentos, das multas e dos prejuízos causados.`,
        `${D.O} pode desistir da empreitada a todo o tempo, indemnizando ${E.o} dos gastos e trabalho realizados e do proveito que poderia tirar da obra, nos termos da lei civil.`,
      ]),
      en: `Either party may terminate for serious breach not remedied within fifteen days of notice; stopping work for ${abandono ?? '—'} days is serious breach. Works done are measured and paid less advances and penalties. The Owner may withdraw, compensating the Contractor as provided by law.`,
    });
    clauses.push(...clausulasFinais(v));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de empreitada' },
      ...partesBlocks(v, [
        { p: 'dono', role: D, en: 'Owner' },
        { p: 'empreiteiro', role: E, en: 'Contractor' },
      ]),
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado e reciprocamente aceite o presente contrato de empreitada, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:',
        en: 'This construction contract is entered into on the following terms and, where silent, the applicable law:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'dono', D, true), assinatura(ctx, 'empreiteiro', E)]),
    ];
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos.map((a) => a.pt.replace(/^(o|a) /, '').replace(/^./, (s) => s.toUpperCase())) });
    return blocks;
  },
});
