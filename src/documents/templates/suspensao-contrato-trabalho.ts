// Comunicação de suspensão do contrato de trabalho por motivo respeitante ao
// empregador: economic reasons (market, technological) or force majeure /
// unforeseeable events. One written notice to each employee, with copies to the
// Ministry of Labour and the union body; with economic reasons the employee
// receives a decreasing share of pay for up to three months.

import { MINIMUM_WAGES_2026, type MinimumWage } from '@/legal/mz-legal';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, g, l, localField, money, refField, workerFields } from './_shared';
import { moneyExt } from './_contrato-trabalho';
import { cartaAoTrabalhador, fechoEmpregador, linhas, nosTermos, ponto, str } from './_rh-politicas';

type S = { mes1: number; mes2: number; mes3: number; pmeMinimoPercent: number; meses: number };

/** The employee this letter is for. */
function trabalhador(v: Values) {
  return {
    nome: str(v.trabalhadorNome),
    genero: (v.trabalhadorGenero as string) || 'M',
    cargo: str(v.trabalhadorCargo),
    salario: money(v.trabalhadorSalario),
  };
}

export default defineTemplate({
  id: 'suspensao-contrato-trabalho',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'suspensao', title: l('Suspensão', 'Suspension') },
    { id: 'remuneracao', title: l('Remuneração durante a suspensão', 'Pay during the suspension') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'motivo', type: 'radio', section: 'suspensao', label: l('Motivo', 'Reason'), default: 'economico', options: [
      { value: 'economico', label: l('Razões económicas (mercado, tecnológicas, outras)', 'Economic reasons (market, technological, other)') },
      { value: 'forcaMaior', label: l('Força maior ou caso fortuito (cheias, ciclone, epidemia, incêndio…)', 'Force majeure (floods, cyclone, epidemic, fire…)') },
    ] },
    { name: 'fundamentos', type: 'textarea', section: 'suspensao', rows: 4, required: true, label: l('Fundamentos', 'Grounds'), legal: l('A comunicação tem de indicar os fundamentos.', 'The notice must state the grounds.'), placeholder: l('Ex.: suspensão pelo cliente da obra da Ponte de Moamba, único contrato em curso da Delegação', 'E.g. the client suspended the only ongoing contract') },
    { name: 'dataInicio', type: 'date', section: 'suspensao', width: 'half', required: true, label: l('Início da suspensão', 'Suspension starts') },
    { name: 'dataFim', type: 'date', section: 'suspensao', width: 'half', label: l('Fim previsto', 'Expected end'), help: l('Em caso de força maior, indique-o se for possível prever.', 'For force majeure, give it if it can be foreseen.') },
    {
      name: 'classeEmpregador',
      type: 'select',
      section: 'remuneracao',
      width: 'half',
      label: l('Dimensão do empregador', 'Employer size'),
      default: 'medio',
      showIf: (v) => v.motivo !== 'forcaMaior',
      options: [
        { value: 'micro', label: l('Micro (até 10 trabalhadores)', 'Micro (up to 10)') },
        { value: 'pequeno', label: l('Pequeno (11 a 30)', 'Small (11–30)') },
        { value: 'medio', label: l('Médio (31 a 100)', 'Medium (31–100)') },
        { value: 'grande', label: l('Grande (mais de 100)', 'Large (over 100)') },
      ],
    },
    {
      name: 'sector',
      type: 'select',
      section: 'remuneracao',
      width: 'half',
      label: l('Sector (salário mínimo)', 'Sector (minimum wage)'),
      default: '',
      showIf: (v) => v.motivo !== 'forcaMaior',
      options: [{ value: '', label: l('Não indicar', 'Not stated') }, ...MINIMUM_WAGES_2026.map((w) => ({ value: w.sector, label: l(w.sector, w.sector) }))],
    },
    { name: 'pagamentoForcaMaior', type: 'text', section: 'remuneracao', label: l('Remuneração durante a suspensão (força maior)', 'Pay during the suspension (force majeure)'), showIf: (v) => v.motivo === 'forcaMaior', placeholder: l('Ex.: metade do salário base, por decisão da empresa', 'E.g. half the base pay, by company decision'), help: l('A lei não fixa a remuneração na suspensão por força maior; indique o que a empresa vai pagar, se pagar.', 'The law sets no pay for a force-majeure suspension; state what the company will pay, if anything.') },
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'salario']),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.trabalhadorNome)) w.push({ level: 'warning', field: 'trabalhadorNome', message: l('Indique o trabalhador. A lei exige uma comunicação escrita a cada trabalhador abrangido: faça uma carta para cada um (pode duplicar este documento).', 'Name the employee. Each employee must receive a written notice: make one letter per employee.') });
    if (!str(v.fundamentos)) w.push({ level: 'warning', field: 'fundamentos', message: l('Indique os fundamentos da suspensão.', 'State the grounds for the suspension.') });
    w.push({
      level: 'info',
      message: l(
        `Envie ao mesmo tempo cópia das comunicações ao Ministério do Trabalho e ao órgão sindical (${cite(v.motivo === 'forcaMaior' ? 'rhpSuspensaoForcaMaior' : 'rhpSuspensaoEconomica')}). Durante a suspensão não pode contratar trabalhadores para os substituir; a Inspecção do Trabalho pode pôr termo à suspensão.`,
        'Send copies to the Ministry of Labour and the union body at the same time. You may not hire replacements; the Labour Inspectorate may end the suspension.',
      ),
    });
    return w;
  },
  personName: (v) => trabalhador(v).nome || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = trabalhador(v);
    const forca = v.motivo === 'forcaMaior';
    const s = ctx.legal.value<S>('rhpSuspensaoEconomica');
    const fund = linhas(v.fundamentos).join('; ');
    const tv: Values = { ...v, trabalhadorNome: t.nome, trabalhadorGenero: t.genero, trabalhadorCargo: t.cargo, ref: v.ref };
    const tctx = { ...ctx, values: tv };
    const periodo = v.dataFim ? `de **${dateLong(v.dataInicio)}** a **${dateLong(v.dataFim)}**` : `a partir de **${dateLong(v.dataInicio)}**${forca ? ', por período que não é possível determinar nesta data' : ''}`;
    const blocks: Block[] = [
      ...cartaAoTrabalhador(tctx, 'Suspensão do contrato de trabalho'),
      {
        type: 'paragraph',
        id: 'decisao',
        text: `${nosTermos(forca ? 'rhpSuspensaoForcaMaior' : 'rhpSuspensaoEconomica').replace(/^n/, 'N')}, comunicamos a V. Ex.ª que o seu contrato de trabalho fica suspenso ${periodo}, por ${forca ? 'motivo de força maior' : 'razões económicas'} que afectam a actividade normal da Empresa.`,
        en: `Your employment contract is suspended ${v.dataInicio ? `from ${v.dataInicio}` : ''}${v.dataFim ? ` to ${v.dataFim}` : ''} for ${forca ? 'force majeure' : 'economic reasons'}.`,
      },
      { type: 'paragraph', id: 'fundamentos', text: `Fundamentos: ${fund ? ponto(fund.charAt(0).toLowerCase() + fund.slice(1)) : `${BLANK}.`}`, en: 'Grounds.' },
    ];
    if (!forca) {
      const wage = v.sector ? (ctx.legal.table('salarioMinimo') as MinimumWage[]).find((m) => m.sector === v.sector)?.value ?? null : null;
      const pme = v.classeEmpregador !== 'grande';
      const piso = wage != null ? (pme ? (wage * s.pmeMinimoPercent) / 100 : wage) : null;
      const linha = (pct: number) => {
        if (t.salario == null) return `${pct} por cento da remuneração`;
        const valor = Math.max((t.salario * pct) / 100, piso ?? 0);
        return `${formatMoney(Math.round(valor * 100) / 100)} (${pct} por cento da remuneração${piso != null && valor > (t.salario * pct) / 100 ? ', elevado ao mínimo legal' : ''})`;
      };
      blocks.push(
        {
          type: 'paragraph',
          id: 'remuneracao',
          text: `Durante a suspensão, V. Ex.ª tem direito ao pagamento de ${linha(s.mes1)} no primeiro mês, ${linha(s.mes2)} no segundo mês e ${linha(s.mes3)} no terceiro mês, nunca inferior ${pme ? `a ${s.pmeMinimoPercent} por cento do salário mínimo do sector` : 'ao salário mínimo do sector'}${wage != null ? ` (${formatMoney(wage)})` : ''}. Se o impedimento se mantiver para além de ${s.meses} meses, o pagamento suspende-se, podendo as partes acordar a modificação ou a cessação do contrato, com a indemnização devida.`,
          en: `During the suspension you receive ${s.mes1}%, ${s.mes2}% and ${s.mes3}% of pay in months 1–3, never below the legal minimum; after ${s.meses} months pay stops and the parties may agree changes or termination.`,
        },
      );
      if (t.salario != null) blocks.push({ type: 'note', text: `Salário base considerado: ${moneyExt(t.salario)}.` });
    } else {
      const pag = str(v.pagamentoForcaMaior);
      blocks.push({
        type: 'paragraph',
        id: 'remuneracaoFM',
        text: `${pag ? `Durante a suspensão a Empresa paga a V. Ex.ª ${ponto(pag.charAt(0).toLowerCase() + pag.slice(1))} ` : ''}Com o termo da suspensão, a Empresa retoma o pagamento da remuneração normal.`,
        en: 'Normal pay resumes when the suspension ends.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'direitos',
      text: `Durante a suspensão cessam os direitos e deveres que pressupõem a prestação efectiva de trabalho, mantendo-se os deveres de lealdade e respeito mútuos. V. Ex.ª conserva o seu posto de trabalho e será ${g(t.genero, 'notificado', 'notificada')} por escrito da data de regresso ao serviço. Foi enviada cópia desta comunicação ao Ministério que superintende a área do Trabalho e ao órgão sindical.`,
      en: 'Rights and duties tied to actual work cease, loyalty remains; you keep your job and will be told in writing when to return. Copies were sent to the Ministry of Labour and the union body.',
      keepWithNext: true,
    });
    blocks.push(...fechoEmpregador(tctx));
    return blocks;
  },
});
