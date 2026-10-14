// Contrato de subempreitada: the main contractor hires a subcontractor for
// part of the works (electricity, plumbing, metalwork, painting…), on the
// terms of the main contract and usually with the owner's consent.

import { roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, isEmpresa, num, numerar, papel, partesBlocks,
  partyFields, partyName, partyWarnings, pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { alvaraFrase, IVA_OPTIONS, profileLicenca } from './_construcao';

export default defineTemplate({
  id: 'contrato-de-subempreitada',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'empreiteiro', title: l('Empreiteiro (contratante)', 'Main contractor'), personRole: 'outro' },
    { id: 'sub', title: l('Subempreiteiro', 'Subcontractor'), personRole: 'outro' },
    { id: 'principal', title: l('Contrato principal', 'Main contract') },
    { id: 'trabalhos', title: l('Trabalhos subcontratados', 'Subcontracted works') },
    { id: 'preco', title: l('Preço, pagamento e prazo', 'Price, payment and time') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('empreiteiro', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'empreiteiroAlvara', type: 'text', section: 'empreiteiro', label: l('Alvará do empreiteiro (n.º, classe, categoria)', 'Contractor’s licence (no., class, category)'), default: (c) => profileLicenca(c.profile) },
    ...partyFields('sub', { tipoDefault: 'empresa' }),
    {
      name: 'subAlvara',
      type: 'text',
      section: 'sub',
      label: l('Alvará do subempreiteiro (n.º, classe, categoria)', 'Subcontractor’s licence (no., class, category)'),
      legal: l('O subempreiteiro que seja empresa de construção também precisa de alvará adequado aos trabalhos.', 'A subcontracting construction firm also needs a licence suited to the works.'),
    },

    { name: 'donoNome', type: 'text', section: 'principal', required: true, width: 'half', label: l('Dono da obra', 'Owner') },
    { name: 'contratoData', type: 'date', section: 'principal', width: 'half', label: l('Data do contrato principal', 'Main contract date') },
    { name: 'obraDesignacao', type: 'text', section: 'principal', required: true, label: l('Obra', 'Works'), placeholder: l('Ex.: construção de edifício de habitação com 4 pisos', 'E.g. construction of a 4-storey housing block') },
    { name: 'obraLocal', type: 'text', section: 'principal', required: true, label: l('Local da obra', 'Site address') },
    {
      name: 'autorizacaoDono',
      type: 'radio',
      section: 'principal',
      label: l('Autorização do dono da obra', 'Owner’s consent'),
      options: [
        { value: 'autorizada', label: l('Dada por escrito', 'Given in writing') },
        { value: 'contrato', label: l('O contrato principal permite subcontratar', 'The main contract allows subcontracting') },
        { value: 'pendente', label: l('Ainda não obtida', 'Not yet obtained') },
      ],
      default: 'autorizada',
    },
    { name: 'dataAutorizacao', type: 'date', section: 'principal', width: 'half', label: l('Data da autorização', 'Consent date'), showIf: (v) => v.autorizacaoDono === 'autorizada' },

    { name: 'especialidade', type: 'text', section: 'trabalhos', required: true, width: 'half', label: l('Especialidade', 'Trade'), placeholder: l('Ex.: instalações eléctricas', 'E.g. electrical installations') },
    { name: 'descricaoTrabalhos', type: 'textarea', section: 'trabalhos', required: true, rows: 3, label: l('Descrição dos trabalhos', 'Description of the works') },
    { name: 'anexoQuantidades', type: 'toggle', section: 'trabalhos', default: true, label: l('Anexo: mapa de quantidades e preços', 'Annex: bill of quantities') },
    { name: 'anexoProjecto', type: 'toggle', section: 'trabalhos', default: true, label: l('Anexo: peças do projecto da especialidade', 'Annex: design drawings for the trade') },
    { name: 'materiais', type: 'radio', section: 'trabalhos', label: l('Materiais', 'Materials'), options: [{ value: 'sub', label: l('Fornecidos pelo subempreiteiro', 'Supplied by the subcontractor') }, { value: 'empreiteiro', label: l('Fornecidos pelo empreiteiro (só mão-de-obra)', 'Supplied by the contractor (labour only)') }], default: 'sub' },

    { name: 'modalidade', type: 'radio', section: 'preco', label: l('Modalidade', 'Pricing'), options: [{ value: 'global', label: l('Preço global', 'Lump sum') }, { value: 'serie', label: l('Série de preços (por medição)', 'Measured') }], default: 'global' },
    { name: 'preco', type: 'money', section: 'preco', required: true, width: 'half', label: l('Preço (ou valor estimado)', 'Price (or estimate)') },
    { name: 'ivaRegime', type: 'select', section: 'preco', width: 'half', label: l('IVA', 'VAT'), options: IVA_OPTIONS, default: 'acrescido' },
    {
      name: 'pagamentoModo',
      type: 'radio',
      section: 'preco',
      label: l('Pagamento', 'Payment'),
      options: [
        { value: 'autos', label: l('Contra autos de medição mensais', 'Against monthly measurements') },
        { value: 'espelho', label: l('Depois de o dono da obra pagar ao empreiteiro', 'After the owner pays the contractor') },
        { value: 'conclusao', label: l('Na conclusão dos trabalhos', 'On completion') },
      ],
      default: 'autos',
    },
    { name: 'pagamentoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 120, default: 15, label: l('Prazo de pagamento (dias)', 'Payment term (days)') },
    { name: 'pagamentoMaxDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 180, default: 45, label: l('Prazo máximo após o auto (dias)', 'Longest term after the certificate (days)'), showIf: (v) => v.pagamentoModo === 'espelho' },
    { name: 'retencaoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 20, default: 5, label: l('Retenção de garantia (%)', 'Retention (%)') },
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', label: l('Início dos trabalhos', 'Start') },
    { name: 'prazoDias', type: 'number', section: 'preco', width: 'half', required: true, min: 1, max: 1500, default: 60, label: l('Prazo de execução (dias)', 'Completion time (days)') },
    { name: 'multaDiaria', type: 'money', section: 'preco', width: 'half', label: l('Multa por dia de atraso', 'Penalty per day of delay') },
    { name: 'multaLimitePct', type: 'number', section: 'preco', width: 'half', min: 0, max: 30, default: 10, label: l('Limite das multas (% do preço)', 'Penalty cap (% of price)') },
    { name: 'garantiaIgual', type: 'toggle', section: 'preco', default: true, label: l('Garantia igual à do contrato principal', 'Warranty equal to the main contract') },
    { name: 'garantiaMeses', type: 'number', section: 'preco', width: 'half', min: 1, max: 120, default: 12, label: l('Prazo de garantia (meses)', 'Warranty (months)'), showIf: (v) => !v.garantiaIgual },
    { name: 'resolucaoDias', type: 'number', section: 'preco', width: 'half', min: 1, max: 60, default: 15, label: l('Prazo para sanar incumprimento (dias)', 'Days to cure a breach') },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  computed: (v, { legal }) => {
    const preco = money(v.preco);
    const taxa = legal.value<number>('ivaTaxaNormal');
    const iva = preco != null && v.ivaRegime === 'acrescido' ? roundMoney(preco * taxa) : 0;
    return { preco, iva };
  },

  warnings: (v, { legal }) => {
    const w: Warning[] = [...partyWarnings(v, 'empreiteiro', 'empreiteiro', 'contractor'), ...partyWarnings(v, 'sub', 'subempreiteiro', 'subcontractor')];
    if (v.autorizacaoDono === 'pendente') {
      w.push({ level: 'warning', field: 'autorizacaoDono', message: l(`O contrato principal normalmente exige autorização do dono da obra para subcontratar (${cite('subcontratacaoAutorizacao')}). Obtenha-a por escrito.`, 'The main contract usually requires the owner’s consent to subcontract. Get it in writing.') });
    }
    if (isEmpresa(v, 'sub') && !str(v.subAlvara)) {
      w.push({ level: 'warning', field: 'subAlvara', message: l(`Peça o alvará do subempreiteiro e confirme a classe e a validade (${cite('alvaraEmpreiteiro')}).`, 'Ask for the subcontractor’s licence and check class and validity.') });
    }
    if (!isEmpresa(v, 'sub')) {
      w.push({ level: 'info', message: l(`Se o subempreiteiro for uma pessoa que trabalha só para si, sob as suas ordens e horário, pode haver um contrato de trabalho disfarçado (${cite('presuncaoContratoTrabalho')}).`, 'If the subcontractor is an individual working only for you under your direction and hours, this may be a disguised employment contract.') });
    }
    const r = legal.value<{ regressoDias: number }>('subempreitadaRegime');
    w.push({ level: 'info', message: l(`Comunique ao subempreiteiro, por escrito, qualquer reclamação de defeitos do dono da obra até ${r.regressoDias} dias depois de a receber, para não perder o direito de regresso (${cite('subempreitadaRegime')}).`, `Pass any defect claim from the owner to the subcontractor in writing within ${r.regressoDias} days to keep your recourse.`) });
    return w;
  },

  personName: (v) => partyName(v, 'sub') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const E = papel(v, 'empreiteiro', 'Empreiteiro', 'Empreiteira');
    const S = papel(v, 'sub', 'Subempreiteiro', 'Subempreiteira');
    const prazo = int(v.prazoDias);
    const pagDias = int(v.pagamentoDias);
    const ret = num(v.retencaoPct) ?? 0;
    const multa = money(v.multaDiaria);
    const resol = int(v.resolucaoDias);
    const anexos = [v.anexoQuantidades ? 'o mapa de quantidades e preços' : '', v.anexoProjecto ? 'as peças do projecto da especialidade' : ''].filter(Boolean);

    const considerandos = [
      `${E.O} celebrou com ${semPonto(v.donoNome) || BLANK} (adiante «Dono da Obra»)${v.contratoData ? `, em ${dateLong(v.contratoData)},` : ''} um contrato de empreitada para a execução da obra de ${semPonto(v.obraDesignacao).replace(/^./, (s) => s.toLowerCase()) || BLANK}, sita em ${semPonto(v.obraLocal) || BLANK} (adiante «Contrato Principal»)${str(v.empreiteiroAlvara) ? `, sendo ${alvaraFrase(v.empreiteiroAlvara)}` : ''};`,
      v.autorizacaoDono === 'autorizada'
        ? `O Dono da Obra autorizou${v.dataAutorizacao ? `, em ${dateLong(v.dataAutorizacao)},` : ''} a subcontratação dos trabalhos de ${semPonto(v.especialidade) || BLANK};`
        : v.autorizacaoDono === 'contrato'
          ? 'O Contrato Principal permite a subcontratação de parte dos trabalhos;'
          : `A subcontratação fica dependente da autorização do Dono da Obra, que ${E.o} se obriga a obter;`,
      `${S.O} dispõe dos meios técnicos e humanos adequados à execução desses trabalhos${str(v.subAlvara) ? ` e é ${alvaraFrase(v.subAlvara)}` : ''}.`,
    ];

    const ivaTxt = v.ivaRegime === 'acrescido' ? `, acrescido de IVA à taxa legal, no valor de ${valorTexto(c.iva)}` : v.ivaRegime === 'incluido' ? ', com IVA incluído' : '';
    const pagamento =
      v.pagamentoModo === 'espelho'
        ? `O preço é pago no prazo de ${quantos(pagDias, 'dia', 'dias')} após ${E.o} receber do Dono da Obra o pagamento dos trabalhos correspondentes, mas nunca depois de ${quantos(int(v.pagamentoMaxDias), 'dia', 'dias')} a contar da aprovação do respectivo auto de medição.`
        : v.pagamentoModo === 'conclusao'
          ? `O preço é pago no prazo de ${quantos(pagDias, 'dia', 'dias')} após a conclusão dos trabalhos, verificada em conjunto, e a apresentação da factura.`
          : `O preço é pago mensalmente, contra autos de medição dos trabalhos executados aprovados ${E.pelo} e pela fiscalização da obra, no prazo de ${quantos(pagDias, 'dia', 'dias')} após a aprovação e a apresentação da factura.`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${S.O} obriga-se a executar para ${E.o}, em regime de subempreitada, os trabalhos de ${semPonto(v.especialidade) || BLANK} da obra identificada no considerando a), que consistem em: ${semPonto(v.descricaoTrabalhos) || BLANK}${anexos.length ? `, de acordo com ${anexos.join(' e ')}, que constituem anexos ao presente contrato` : ''}.`,
        en: 'The Subcontractor will carry out the trade works described for the Contractor.',
      },
      {
        id: 'principal',
        heading: 'Contrato Principal',
        text: numerar([
          `${S.O} declara conhecer as condições do Contrato Principal aplicáveis aos trabalhos subcontratados, nomeadamente as especificações técnicas, os prazos, as regras de segurança e o regime de recepção e garantia, e obriga-se a cumpri-las perante ${E.o}.`,
          `O presente contrato não cria qualquer relação jurídica entre ${S.o} e o Dono da Obra.`,
        ]),
        en: 'The Subcontractor knows and complies with the relevant terms of the main contract; there is no contract with the Owner.',
      },
      {
        id: 'preco',
        heading: 'Preço',
        text: numerar([
          v.modalidade === 'serie'
            ? `A subempreitada é por série de preços, aplicando-se os preços unitários do mapa anexo às quantidades executadas e medidas, com o valor estimado de ${valorTexto(c.preco)}${ivaTxt}.`
            : `A subempreitada é por preço global, no valor de ${valorTexto(c.preco)}${ivaTxt}.`,
          v.materiais === 'empreiteiro'
            ? `Os materiais são fornecidos ${E.pelo}; o preço corresponde à mão-de-obra, ferramentas e equipamentos ${S.de}.`
            : 'O preço inclui materiais, mão-de-obra, ferramentas, equipamentos e transportes necessários aos trabalhos.',
        ]),
        en: `${v.modalidade === 'serie' ? 'Measured' : 'Lump sum'} price of ${c.preco != null ? formatMoney(c.preco) : '—'}.`,
      },
      {
        id: 'pagamento',
        heading: 'Pagamento',
        text: numerar([pagamento, ret > 0 ? `Em cada pagamento é retido ${pct(ret)} do respectivo valor, a título de garantia da boa execução, restituído com a recepção definitiva dos trabalhos.` : '']),
        en: 'Payment terms and retention.',
      },
      {
        id: 'prazo',
        heading: 'Prazo e coordenação',
        text: numerar([
          `Os trabalhos iniciam-se em ${dateLong(v.dataInicio)} e são concluídos no prazo de ${quantos(prazo, 'dia', 'dias')}, de acordo com o plano de trabalhos da obra definido ${E.pelo}.`,
          multa != null && multa > 0 ? `Por cada dia de atraso imputável ${S.ao}, este paga uma multa de ${valorTexto(multa)}, até ao limite de ${pct(v.multaLimitePct)} do preço, que pode ser deduzida nos pagamentos.` : '',
          `${S.O} responde perante ${E.o} pelas multas e prejuízos que o atraso nos seus trabalhos cause no Contrato Principal.`,
        ]),
        en: 'Start, completion time and coordination with the site programme; delay penalties.',
      },
      {
        id: 'pessoal',
        heading: 'Pessoal, segurança e seguros',
        text: `Os trabalhadores ${S.de} trabalham sob a sua exclusiva direcção e responsabilidade, nomeadamente quanto a salários, inscrição e contribuições para a segurança social, seguro de acidentes de trabalho e equipamentos de protecção individual. ${S.O} cumpre as regras de segurança e saúde do estaleiro definidas ${E.pelo}.`,
        en: 'The Subcontractor is solely responsible for its workers, social security, insurance and protective equipment, and follows site safety rules.',
      },
      {
        id: 'cessao',
        heading: 'Proibição de nova subcontratação',
        text: `${S.O} não pode subcontratar, no todo ou em parte, os trabalhos objecto do presente contrato sem autorização escrita ${E.de}.`,
        en: 'No further subcontracting without written consent.',
      },
      {
        id: 'recepcao',
        heading: 'Recepção e garantia',
        text: numerar([
          'Os trabalhos são recebidos provisória e definitivamente em simultâneo com a recepção do Contrato Principal, ou em auto próprio se as partes assim acordarem.',
          v.garantiaIgual
            ? `${S.O} garante os trabalhos pelo prazo de garantia do Contrato Principal e obriga-se a corrigir, à sua custa, os defeitos que ${E.o} lhe comunique por escrito.`
            : `${S.O} garante os trabalhos pelo prazo de ${quantos(int(v.garantiaMeses), 'mês', 'meses')} a contar da recepção provisória e obriga-se a corrigir, à sua custa, os defeitos que ${E.o} lhe comunique por escrito.`,
        ]),
        en: 'Acceptance together with the main contract; warranty and correction of defects.',
      },
      {
        id: 'resolucao',
        heading: 'Resolução',
        text: numerar([
          `Qualquer das partes pode resolver o contrato em caso de incumprimento grave da outra que não seja sanado no prazo de ${quantos(resol, 'dia', 'dias')} após interpelação escrita.`,
          'A cessação do Contrato Principal, por qualquer causa, faz cessar o presente contrato, sendo pagos os trabalhos executados até essa data.',
        ]),
        en: 'Termination for unremedied serious breach; the subcontract ends with the main contract, work done is paid.',
      },
      ...clausulasFinais(v),
    ];

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de subempreitada' },
      ...partesBlocks(v, [
        { p: 'empreiteiro', role: E, en: 'Contractor' },
        { p: 'sub', role: S, en: 'Subcontractor' },
      ]),
      { type: 'paragraph', id: 'considerando', text: 'Considerando que:', en: 'Whereas:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: considerandos },
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de subempreitada, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela legislação aplicável:', en: 'This subcontract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'empreiteiro', E, true), assinatura(ctx, 'sub', S)]),
    ];
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos.map((a) => a.replace(/^(o|as) /, '').replace(/^./, (s) => s.toUpperCase())) });
    return blocks;
  },
});
