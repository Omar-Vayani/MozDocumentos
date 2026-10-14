// Comunicação de rescisão do contrato de trabalho por motivos estruturais,
// tecnológicos ou de mercado (rescisão com aviso prévio por iniciativa do
// empregador). One template, three addressees: the employee, the union body
// and the Ministry of Labour, all of whom must receive written notice.

import { diffDays } from '@/lib/format';
import { MINIMUM_WAGES_2026, type MinimumWage } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, formatMoney, isF, l, lineItems, localField, money, refField, workerFields } from './_shared';
import { doCite, moneyExt, num, qty, wk } from './_contrato-trabalho';
import { str } from './_pessoal-rh';

type Motivo = 'estruturais' | 'tecnologicos' | 'mercado';
type Tabela = { avisoDias: number; ate7SM: number; ate18SM: number; mais18SM: number; limite1: number; limite2: number };

const MOTIVOS: Record<Motivo, { pt: string; en: string }> = {
  estruturais: { pt: 'estruturais', en: 'structural' },
  tecnologicos: { pt: 'tecnológicos', en: 'technological' },
  mercado: { pt: 'de mercado', en: 'market' },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function abrangidos(v: Values): { nome: string; categoria: string; admissao: string }[] {
  const rows = lineItems(v.abrangidos)
    .map((r) => ({ nome: str(r.nome), categoria: str(r.categoria), admissao: str(r.admissao) }))
    .filter((r) => r.nome);
  if (rows.length) return rows;
  return str(v.trabalhadorNome)
    ? [{ nome: str(v.trabalhadorNome), categoria: str(v.trabalhadorCategoria) || str(v.trabalhadorCargo), admissao: str(v.trabalhadorDataAdmissao) }]
    : [];
}

export default defineTemplate({
  id: 'rescisao-motivos-economicos',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'motivo', title: l('Motivo e data', 'Reason and date') },
    { id: 'indemnizacao', title: l('Indemnização', 'Compensation') },
    { id: 'abrangidos', title: l('Trabalhadores abrangidos', 'Employees affected') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da comunicação', 'Date of the notice')),
    {
      name: 'destinatario',
      type: 'radio',
      section: 'destinatario',
      label: l('Comunicação dirigida a', 'Notice addressed to'),
      default: 'trabalhador',
      options: [
        { value: 'trabalhador', label: l('Trabalhador abrangido', 'Employee affected') },
        { value: 'sindicato', label: l('Órgão sindical / associação sindical', 'Union body / trade union') },
        { value: 'ministerio', label: l('Ministério do Trabalho', 'Ministry of Labour') },
      ],
      help: l('A lei exige comunicação escrita aos três. Gere um documento para cada destinatário.', 'The law requires written notice to all three. Produce one document for each.'),
    },
    { name: 'sindicatoNome', type: 'text', section: 'destinatario', label: l('Órgão sindical', 'Union body'), placeholder: l('Ex.: Comité Sindical da Empresa', 'E.g. company union committee'), showIf: (v) => v.destinatario === 'sindicato' },
    {
      name: 'ministerioEntidade',
      type: 'text',
      section: 'destinatario',
      label: l('Serviço do Ministério', 'Ministry office'),
      default: 'Direcção Provincial do Trabalho, Emprego e Segurança Social da Cidade de Maputo',
      help: l('A representação do Ministério do Trabalho na província. Confirme a designação actual.', 'The Ministry of Labour office in the province. Check the current name.'),
      showIf: (v) => v.destinatario === 'ministerio',
    },
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'departamento', 'dataAdmissao', 'salario']).map((f) => (f.name === 'trabalhadorSalario' || f.name === 'trabalhadorDataAdmissao' ? { ...f, required: true } : f)),
    { name: 'bonusAntiguidade', type: 'money', section: 'trabalhador', width: 'half', label: l('Bónus de antiguidade mensal', 'Monthly seniority bonus'), help: l('Soma-se ao salário base para escolher o escalão da indemnização.', 'Added to the base salary to choose the compensation band.') },
    {
      name: 'tipoContrato',
      type: 'radio',
      section: 'trabalhador',
      label: l('Contrato', 'Contract'),
      default: 'indeterminado',
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
        { value: 'certo', label: l('A prazo certo', 'Fixed term') },
      ],
    },
    { name: 'dataFimContrato', type: 'date', section: 'trabalhador', width: 'half', label: l('Termo do contrato a prazo', 'End of the fixed-term contract'), showIf: (v) => v.tipoContrato === 'certo' },
    {
      name: 'motivo',
      type: 'select',
      section: 'motivo',
      required: true,
      label: l('Motivo', 'Reason'),
      default: 'estruturais',
      options: [
        { value: 'estruturais', label: l('Estruturais (reorganização, falta de recursos)', 'Structural (reorganisation, lack of funds)') },
        { value: 'tecnologicos', label: l('Tecnológicos (nova tecnologia, informatização)', 'Technological (new technology, automation)') },
        { value: 'mercado', label: l('De mercado (quebra de vendas, redução da actividade)', 'Market (falling sales, reduced activity)') },
      ],
    },
    {
      name: 'fundamentacao',
      type: 'textarea',
      section: 'motivo',
      rows: 4,
      required: true,
      label: l('Factos concretos', 'Specific facts'),
      legal: l('O empregador tem de provar os motivos. Descreva os factos e a ligação ao posto de trabalho.', 'The employer must prove the reasons. Describe the facts and the link to the job.'),
      placeholder: l('Ex.: encerramento da delegação da Beira em 31 de Dezembro de 2026, por quebra de 45 por cento das vendas em 2025 e 2026, com extinção dos postos de trabalho ali existentes', 'E.g. closure of the Beira branch after sales fell sharply, abolishing its posts'),
    },
    { name: 'dataCessacao', type: 'date', section: 'motivo', width: 'half', required: true, label: l('Data da cessação', 'Termination date') },
    {
      name: 'sector',
      type: 'select',
      section: 'indemnizacao',
      width: 'half',
      label: l('Sector (salário mínimo)', 'Sector (minimum wage)'),
      options: [{ value: '', label: l('Escolha o sector', 'Choose the sector') }, ...MINIMUM_WAGES_2026.map((w) => ({ value: w.sector, label: l(w.sector, w.sector) }))],
      default: '',
      help: l('A indemnização depende de quantos salários mínimos do sector o trabalhador ganha.', 'Compensation depends on how many sector minimum wages the employee earns.'),
    },
    { name: 'salarioMinimoSector', type: 'money', section: 'indemnizacao', width: 'half', computedKey: 'smSector', label: l('Salário mínimo do sector', 'Sector minimum wage') },
    { name: 'indemnizacaoAcordada', type: 'money', section: 'indemnizacao', width: 'half', label: l('Indemnização mais favorável (opcional)', 'Higher agreed compensation (optional)'), help: l('O contrato ou o acordo colectivo podem prever valor superior ao legal.', 'The contract or collective agreement may provide more.') },
    {
      name: 'outrosCreditos',
      type: 'lines',
      section: 'indemnizacao',
      label: l('Outros créditos a pagar', 'Other amounts due'),
      addLabel: l('Adicionar crédito', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [
        { descricao: 'Remuneração do mês da cessação', valor: '' },
        { descricao: 'Férias vencidas e não gozadas e proporcionais', valor: '' },
      ],
    },
    {
      name: 'classeEmpregador',
      type: 'select',
      section: 'abrangidos',
      width: 'half',
      label: l('Dimensão da empresa', 'Company size'),
      default: 'pequeno',
      options: [
        { value: 'micro', label: l('Micro', 'Micro') },
        { value: 'pequeno', label: l('Pequena', 'Small') },
        { value: 'medio', label: l('Média', 'Medium') },
        { value: 'grande', label: l('Grande', 'Large') },
      ],
    },
    { name: 'numeroAbrangidos3Meses', type: 'number', section: 'abrangidos', width: 'half', min: 1, default: 1, label: l('Contratos que cessam no período de referência', 'Contracts ended in the reference period'), help: l('Inclua os contratos já terminados por estes motivos nos últimos meses.', 'Include contracts already ended for these reasons in recent months.') },
    {
      name: 'abrangidos',
      type: 'lines',
      section: 'abrangidos',
      label: l('Lista de abrangidos (para o sindicato e o Ministério)', 'List of affected employees (for the union and Ministry)'),
      addLabel: l('Adicionar trabalhador', 'Add employee'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'categoria', type: 'text', label: l('Categoria', 'Grade') },
        { name: 'admissao', type: 'date', label: l('Admissão', 'Start date') },
      ],
      default: [],
    },
  ],

  computed: (v, ctx) => {
    const t = ctx.legal.value<Tabela>('indemnizacaoMotivosEconomicos');
    const wage = (ctx.legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector);
    const sm = money(v.salarioMinimoSector) ?? wage?.value ?? null;
    const base = (money(v.trabalhadorSalario) ?? 0) + (money(v.bonusAntiguidade) ?? 0);
    const mult = sm && base ? base / sm : null;
    const dias = mult == null ? null : mult <= t.limite1 ? t.ate7SM : mult <= t.limite2 ? t.ate18SM : t.mais18SM;
    const tempo = v.trabalhadorDataAdmissao && v.dataCessacao ? diffDays(v.trabalhadorDataAdmissao, v.dataCessacao) : NaN;
    const anos = Number.isFinite(tempo) && tempo > 0 ? tempo / 365 : null;
    const diario = base ? base / 30 : null;
    let legal: number | null = null;
    if (v.tipoContrato === 'certo') {
      const resto = v.dataFimContrato && v.dataCessacao ? diffDays(v.dataCessacao, v.dataFimContrato) : NaN;
      legal = Number.isFinite(resto) && diario ? round2(Math.max(0, resto) * diario) : null;
    } else if (dias != null && anos != null && diario) {
      legal = round2(diario * dias * anos);
    }
    const acordada = money(v.indemnizacaoAcordada);
    const indemnizacao = acordada != null && (legal == null || acordada > legal) ? acordada : legal;
    const aviso = v.data && v.dataCessacao ? diffDays(v.data, v.dataCessacao) : null;
    return { t, smSector: wage?.value ?? '', sm, base, mult, dias, anos, diario, legal, indemnizacao, acordada, aviso, lista: abrangidos(v) };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Comunique por escrito a cada trabalhador abrangido, ao órgão sindical (ou associação sindical) e ao Ministério do Trabalho, com pelo menos ${c.t.avisoDias} dias de antecedência (${cite('motivosEconomicosFormalidades')}). Sem estas formalidades, a justa causa não pode ser provada.`,
          `Give written notice to each employee, the union and the Ministry of Labour at least ${c.t.avisoDias} days in advance. Without these formalities the dismissal cannot be justified.`,
        ),
      },
    ];
    if (c.aviso != null && Number.isFinite(c.aviso) && c.aviso < c.t.avisoDias) {
      w.push({ level: 'error', field: 'dataCessacao', message: l(`A cessação tem de ocorrer pelo menos ${c.t.avisoDias} dias depois da comunicação.`, `Termination must be at least ${c.t.avisoDias} days after the notice.`) });
    }
    if (!str(v.fundamentacao) || str(v.fundamentacao).length < 40) {
      w.push({ level: 'warning', field: 'fundamentacao', message: l(`Descreva factos concretos: o ónus da prova dos motivos é do empregador (${cite('despedimentoColectivo')}).`, 'Describe specific facts: the employer must prove the reasons.') });
    }
    if (v.tipoContrato !== 'certo' && c.sm == null) {
      w.push({ level: 'warning', field: 'sector', message: l('Escolha o sector ou indique o salário mínimo para calcular a indemnização.', 'Choose the sector or enter the minimum wage to compute compensation.') });
    }
    const dc = ctx.legal.value<{ microPequenas: number; mediasGrandes: number; periodoMeses: number; consultaDias: number }>('despedimentoColectivo');
    const limite = v.classeEmpregador === 'medio' || v.classeEmpregador === 'grande' ? dc.mediasGrandes : dc.microPequenas;
    const n = num(v.numeroAbrangidos3Meses) ?? c.lista.length;
    if (n > limite) {
      w.push({
        level: 'warning',
        field: 'numeroAbrangidos3Meses',
        message: l(
          `Mais de ${limite} contratos em ${dc.periodoMeses} meses é despedimento colectivo (${cite('despedimentoColectivo')}): antes das comunicações individuais, informe o órgão sindical e os trabalhadores (motivos e número de abrangidos), comunique ao Ministério e faça a consulta, que não pode exceder ${dc.consultaDias} dias.`,
          `More than ${limite} contracts in ${dc.periodoMeses} months is a collective dismissal: inform the union and employees, notify the Ministry and consult (max ${dc.consultaDias} days) before individual notices.`,
        ),
      });
    }
    if (isF(v.trabalhadorGenero)) {
      w.push({ level: 'info', field: 'trabalhadorNome', message: l(`Se a trabalhadora estiver grávida ou em licença de maternidade, aplica-se protecção especial (${cite('protecaoMaternidade')}).`, 'If the employee is pregnant or on maternity leave, special protection applies.') });
    }
    w.push({ level: 'info', message: l(`O trabalhador pode impugnar a rescisão no prazo legal (${cite('impugnacaoRescisao')}). O recebimento da indemnização faz presumir a aceitação.`, 'The employee may challenge the dismissal within the legal period. Accepting compensation is presumed acceptance.') });
    return w;
  },

  personName: (v) => (v.destinatario === 'trabalhador' ? v.trabalhadorNome : v.destinatario === 'sindicato' ? 'sindicato' : 'ministerio'),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const W = wk(v.trabalhadorGenero);
    const motivo = MOTIVOS[(v.motivo as Motivo) ?? 'estruturais'] ?? MOTIVOS.estruturais;
    const fund = str(v.fundamentacao).replace(/\.$/, '') || BLANK;
    const empresa = employerName(ctx);
    const outros = lineItems(v.outrosCreditos).filter((r) => str(r.descricao));
    const blocks: Block[] = [{ type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) }];

    if (v.destinatario === 'trabalhador') {
      blocks.push(
        { type: 'recipient', salutation: exmo(v.trabalhadorGenero), lines: [str(v.trabalhadorNome) || BLANK, [str(v.trabalhadorCargo), str(v.trabalhadorDepartamento)].filter(Boolean).join(' — ')].filter(Boolean) },
        { type: 'subject', text: 'Comunicação de rescisão do contrato de trabalho com aviso prévio' },
        { type: 'salutation', text: `${exmo(v.trabalhadorGenero)},` },
        {
          type: 'paragraph',
          id: 'decisao',
          text: `Nos termos ${doCite('indemnizacaoMotivosEconomicos')}, comunicamos a V. Ex.ª que ${empresa} decidiu rescindir o contrato de trabalho ${v.tipoContrato === 'certo' ? 'a prazo certo' : 'por tempo indeterminado'} celebrado com V. Ex.ª em ${dateLong(v.trabalhadorDataAdmissao)}, com fundamento em **motivos ${motivo.pt}**, nomeadamente: ${fund}.`,
          en: `We notify you that ${empresa} has decided to end your employment contract for ${motivo.en} reasons, namely as described.`,
        },
        {
          type: 'paragraph',
          id: 'efeitos',
          text: `A cessação do contrato produz efeitos em **${dateLong(v.dataCessacao)}**${c.aviso != null && Number.isFinite(c.aviso) && c.aviso > 0 ? `, observando-se um aviso prévio de ${qty(c.aviso, 'dia', 'dias')}` : ''}. Até essa data, V. Ex.ª mantém todos os direitos e deveres decorrentes do contrato.`,
          en: `The contract ends on ${v.dataCessacao || '—'}. Until then all rights and duties remain.`,
        },
      );
      const ind =
        v.tipoContrato === 'certo'
          ? `a indemnização de ${c.indemnizacao != null ? `**${moneyExt(c.indemnizacao)}**` : BLANK}, correspondente às remunerações que se venceriam até ao termo do contrato, em ${dateLong(v.dataFimContrato)}`
          : c.acordada != null && c.indemnizacao === c.acordada
            ? `a indemnização de **${moneyExt(c.indemnizacao)}**, nos termos acordados`
            : `a indemnização de ${c.indemnizacao != null ? `**${moneyExt(c.indemnizacao)}**` : BLANK}, correspondente a ${c.dias != null ? qty(c.dias, 'dia', 'dias') : `${BLANK} dias`} de salário por cada ano de serviço, calculada sobre o salário base de ${formatMoney(c.base || null)}${money(v.bonusAntiguidade) ? ', incluindo o bónus de antiguidade' : ''}, para uma antiguidade de ${c.anos != null ? `${String(round2(c.anos)).replace('.', ',')} anos` : BLANK}`;
      blocks.push({
        type: 'paragraph',
        id: 'pagamentos',
        text: `Na data da cessação, serão colocados à sua disposição: ${ind}; ${outros.length ? `${outros.map((r) => `${str(r.descricao).charAt(0).toLowerCase()}${str(r.descricao).slice(1)}${money(r.valor) != null ? ` (${formatMoney(money(r.valor))})` : ''}`).join('; ')}; ` : 'os demais créditos vencidos; '}e o certificado de trabalho.`,
        en: 'On the termination date you will receive the compensation stated, the other amounts due and a certificate of employment.',
      });
      blocks.push(
        {
          type: 'paragraph',
          id: 'comunicacoes',
          text: 'A presente decisão foi igualmente comunicada, por escrito, ao órgão sindical e ao Ministério que superintende a área do trabalho.',
          en: 'This decision has also been notified in writing to the union body and the Ministry of Labour.',
          keepWithNext: true,
        },
        { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
        { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
        { type: 'acknowledgement', signer: W.O },
      );
      return blocks;
    }

    // Union body or Ministry: collective notice with the list of employees.
    const sindicato = v.destinatario === 'sindicato';
    blocks.push(
      {
        type: 'recipient',
        salutation: sindicato ? 'Ao' : 'À',
        lines: sindicato ? [str(v.sindicatoNome) || 'Órgão Sindical da Empresa'] : [str(v.ministerioEntidade) || BLANK],
      },
      { type: 'subject', text: `Comunicação de rescisão de contratos de trabalho por motivos ${motivo.pt}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'decisaoColectiva',
        text: `Nos termos ${doCite('motivosEconomicosFormalidades')}, comunicamos a V. Ex.as que ${empresa} decidiu rescindir, com efeitos a partir de **${dateLong(v.dataCessacao)}**, ${c.lista.length === 1 ? 'o contrato de trabalho do trabalhador abaixo indicado' : 'os contratos de trabalho dos trabalhadores abaixo indicados'}, com fundamento em **motivos ${motivo.pt}**, nomeadamente: ${fund}.`,
        en: `We notify you that ${empresa} has decided to end the employment contracts listed, from ${v.dataCessacao || '—'}, for ${motivo.en} reasons.`,
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.07, align: 'center' },
          { label: 'Nome', width: 0.45 },
          { label: 'Categoria', width: 0.3 },
          { label: 'Admissão', width: 0.18, align: 'center' },
        ],
        rows: (c.lista.length ? c.lista : [{ nome: BLANK, categoria: '', admissao: '' }]).map((r: { nome: string; categoria: string; admissao: string }, i: number) => [
          String(i + 1),
          r.nome,
          r.categoria || '—',
          r.admissao ? r.admissao.split('-').reverse().join('/') : '—',
        ]),
      },
      {
        type: 'paragraph',
        id: 'indemnizacoes',
        text: `A cada trabalhador abrangido será paga a indemnização prevista ${doCite('indemnizacaoMotivosEconomicos')}, bem como os demais créditos vencidos, e entregue o certificado de trabalho. ${c.lista.length === 1 ? 'O trabalhador foi notificado' : 'Os trabalhadores foram notificados'} por escrito na presente data.`,
        en: 'Each employee will receive the statutory compensation and other amounts due, plus a certificate of employment, and has been notified in writing today.',
      },
      {
        type: 'paragraph',
        id: 'esclarecimentos',
        text: sindicato
          ? 'Ficamos ao dispor para prestar os esclarecimentos que forem solicitados.'
          : 'Ficamos ao dispor para prestar os esclarecimentos e fornecer os elementos que forem solicitados pela Inspecção-Geral do Trabalho durante o prazo de aviso prévio.',
        en: 'We remain available to provide any clarification requested' + (sindicato ? '.' : ', including to the Labour Inspectorate during the notice period.'),
        keepWithNext: true,
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: sindicato ? 'Pelo Órgão Sindical' : 'Pelos Serviços' },
    );
    return blocks;
  },
});
