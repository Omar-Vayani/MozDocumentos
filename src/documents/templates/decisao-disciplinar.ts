import type { LegalRefId } from '@/legal/mz-legal';
import { recusaBox } from './_contrato-trabalho';
import { addDays, addWorkingDays, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  splitLines, workerFields,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

const num = (v: unknown): number | null => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};
const dias = (n: number | null) => (n == null ? '____ dias' : `${n} ${n === 1 ? 'dia' : 'dias'}`);
const meses = (n: number | null) => (n == null ? '____ meses' : `${n} ${n === 1 ? 'mês' : 'meses'}`);

/** Sanctions that may be challenged (all except verbal and recorded warnings). */
const IMPUGNAVEIS = ['suspensao', 'multa', 'despromocao', 'despedimento'];

export default defineTemplate({
  id: 'decisao-disciplinar',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'processo', title: l('Tramitação do processo', 'Procedure followed') },
    { id: 'prova', title: l('Prova e fundamentação', 'Evidence and reasons') },
    { id: 'sancao', title: l('Sanção', 'Sanction') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    {
      name: 'processoNumero',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('N.º do processo disciplinar', 'Disciplinary case number'),
      default: (c) => `PD/${c.today.slice(0, 4)}/001`,
    },
    localField(),
    dateField('data', 'documento', l('Data da decisão', 'Date of the decision')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataNotaCulpa',
      type: 'date',
      section: 'processo',
      width: 'half',
      required: true,
      label: l('Data de entrega da nota de culpa', 'Date the charge was delivered'),
      legal: l('Os prazos de resposta, parecer sindical e decisão contam a partir desta data.', 'The reply, union opinion and decision deadlines run from this date.'),
    },
    {
      name: 'respostaApresentada',
      type: 'toggle',
      section: 'processo',
      label: l('O trabalhador respondeu por escrito', 'The employee replied in writing'),
    },
    {
      name: 'dataResposta',
      type: 'date',
      section: 'processo',
      width: 'half',
      label: l('Data da resposta', 'Date of the reply'),
      showIf: (v) => Boolean(v.respostaApresentada),
    },
    {
      name: 'audicaoRealizada',
      type: 'toggle',
      section: 'processo',
      label: l('O trabalhador foi ouvido em audição', 'The employee was heard at a hearing'),
    },
    {
      name: 'dataAudicao',
      type: 'date',
      section: 'processo',
      width: 'half',
      label: l('Data da audição', 'Hearing date'),
      showIf: (v) => Boolean(v.audicaoRealizada),
    },
    {
      name: 'parecerSindical',
      type: 'toggle',
      section: 'processo',
      label: l('O comité sindical emitiu parecer', 'The union committee gave an opinion'),
    },
    {
      name: 'dataParecer',
      type: 'date',
      section: 'processo',
      width: 'half',
      label: l('Data do parecer', 'Date of the opinion'),
      showIf: (v) => Boolean(v.parecerSindical),
    },
    {
      name: 'provas',
      type: 'textarea',
      section: 'prova',
      required: true,
      rows: 4,
      label: l('Meios de prova considerados', 'Evidence considered'),
      legal: l('A decisão deve indicar as provas em que se baseia.', 'The decision must state the evidence it relies on.'),
      help: l('Um por linha. Ex.: depoimento da testemunha X; relatório de ponto de Setembro; resposta do trabalhador.', 'One per line. E.g. statement of witness X; September attendance report; employee’s reply.'),
    },
    {
      name: 'factosProvados',
      type: 'textarea',
      section: 'prova',
      required: true,
      rows: 6,
      label: l('Factos provados', 'Facts proven'),
      legal: l('A decisão deve indicar quais os factos que ficaram provados.', 'The decision must state which facts were proven.'),
      help: l('Um facto por linha.', 'One fact per line.'),
    },
    {
      name: 'factosNaoProvados',
      type: 'textarea',
      section: 'prova',
      rows: 3,
      label: l('Factos não provados (opcional)', 'Facts not proven (optional)'),
    },
    {
      name: 'fundamentacao',
      type: 'textarea',
      section: 'prova',
      required: true,
      rows: 5,
      label: l('Fundamentação', 'Reasons'),
      help: l(
        'Explique porque os factos provados são uma infracção, que deveres foram violados e como foram consideradas a resposta e o parecer sindical.',
        'Explain why the proven facts are an offence, which duties were breached and how the reply and union opinion were considered.',
      ),
    },
    {
      name: 'sancao',
      type: 'select',
      section: 'sancao',
      required: true,
      label: l('Sanção aplicada', 'Sanction applied'),
      default: 'repreensao',
      options: [
        { value: 'admoestacao', label: l('Admoestação verbal', 'Verbal warning') },
        { value: 'repreensao', label: l('Repreensão registada', 'Recorded reprimand') },
        { value: 'suspensao', label: l('Suspensão com perda de remuneração', 'Unpaid suspension') },
        { value: 'multa', label: l('Multa', 'Fine') },
        { value: 'despromocao', label: l('Despromoção', 'Demotion') },
        { value: 'despedimento', label: l('Despedimento com justa causa', 'Dismissal with just cause') },
      ],
    },
    {
      name: 'suspensaoDias',
      type: 'number',
      section: 'sancao',
      width: 'half',
      min: 1,
      label: l('Dias de suspensão', 'Days of suspension'),
      showIf: (v) => v.sancao === 'suspensao',
    },
    {
      name: 'multaDias',
      type: 'number',
      section: 'sancao',
      width: 'half',
      min: 1,
      label: l('Multa: número de dias de salário', 'Fine: number of days’ pay'),
      showIf: (v) => v.sancao === 'multa',
    },
    {
      name: 'despromocaoCategoria',
      type: 'text',
      section: 'sancao',
      width: 'half',
      label: l('Nova categoria', 'New grade'),
      showIf: (v) => v.sancao === 'despromocao',
    },
    {
      name: 'despromocaoMeses',
      type: 'number',
      section: 'sancao',
      width: 'half',
      min: 1,
      label: l('Duração da despromoção (meses)', 'Demotion length (months)'),
      showIf: (v) => v.sancao === 'despromocao',
    },
    {
      name: 'dataInicioSancao',
      type: 'date',
      section: 'sancao',
      width: 'half',
      label: l('Início do cumprimento', 'Start date'),
      showIf: (v) => v.sancao === 'suspensao' || v.sancao === 'despromocao',
    },
    {
      name: 'dataEfeitos',
      type: 'date',
      section: 'sancao',
      width: 'half',
      label: l('Data de efeitos do despedimento', 'Dismissal effective date'),
      help: l('Normalmente a data em que a decisão é entregue ao trabalhador.', 'Normally the date the decision is delivered to the employee.'),
      default: (c) => c.today,
      showIf: (v) => v.sancao === 'despedimento',
    },
    {
      name: 'devolucaoBens',
      type: 'toggle',
      section: 'sancao',
      default: true,
      label: l('Pedir a devolução de bens da empresa', 'Ask for company property to be returned'),
      showIf: (v) => v.sancao === 'despedimento',
    },
    {
      name: 'orgaoSindical',
      type: 'text',
      section: 'opcoes',
      label: l('Comité sindical (cópia)', 'Union committee (copy)'),
      legal: l('A decisão é comunicada ao trabalhador e ao órgão sindical.', 'The decision is sent to the employee and to the union.'),
      default: 'Comité Sindical',
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Incluir espaço para testemunhas (se recusar receber)', 'Include witness lines (if receipt is refused)'),
    },
  ],

  computed: (v, { legal }) => {
    const resposta = legal.value<number>('notaCulpaPrazoResposta');
    const proc = legal.value<{ diligenciasDias: number; parecerSindicalDiasUteis: number }>('procedimentoDisciplinar');
    const dec = legal.value<{ decisaoDias: number; execucaoDias: number }>('decisaoDisciplinarPrazo');
    const sancoes = legal.value<{ suspensaoMaxDias: number; suspensaoMaxAno: number; multaMaxDias: number; despromocaoMaxAnos: number }>('sancoesDisciplinares');
    const impugnacao = legal.value<{ meses: number }>('impugnacaoSancao').meses;
    const fimResposta = v.dataNotaCulpa ? addDays(v.dataNotaCulpa, resposta) : null;
    const fimDiligencias = fimResposta ? addDays(fimResposta, proc.diligenciasDias) : null;
    const fimParecer = fimDiligencias ? addWorkingDays(fimDiligencias, proc.parecerSindicalDiasUteis) : null;
    const limiteDecisao = fimParecer ? addDays(fimParecer, dec.decisaoDias) : null;
    return {
      prazoResposta: resposta,
      ...proc,
      ...dec,
      ...sancoes,
      impugnacaoMeses: impugnacao,
      fimResposta,
      fimParecer,
      limiteDecisao,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.limiteDecisao && v.data && diffDays(c.limiteDecisao, v.data) > 0) {
      w.push({
        level: 'warning',
        field: 'data',
        message: l(
          `Pelas nossas contas, a decisão devia ser comunicada até ${dateLong(c.limiteDecisao)}. É uma estimativa: soma o prazo de resposta (${c.prazoResposta} dias), o das diligências de prova (${c.diligenciasDias} dias), o do parecer sindical (${c.parecerSindicalDiasUteis} dias úteis, sem contar feriados) e o da decisão (${c.decisaoDias} dias). Se não houve diligências de prova, o prazo pode terminar ${c.diligenciasDias} dias antes. Confirme as datas reais do processo.`,
          `By our count the decision had to be sent by ${c.limiteDecisao}. This is an estimate adding the reply period (${c.prazoResposta} days), evidence (${c.diligenciasDias} days), union opinion (${c.parecerSindicalDiasUteis} working days, holidays not counted) and decision (${c.decisaoDias} days). Check the actual dates of the case.`,
        ),
      });
    }
    if (c.fimResposta && v.data && !v.respostaApresentada && diffDays(c.fimResposta, v.data) <= 0) {
      w.push({
        level: 'error',
        field: 'data',
        message: l(
          `O prazo de resposta à nota de culpa só termina em ${dateLong(c.fimResposta)}. Não decida antes disso.`,
          `The reply period only ends on ${c.fimResposta}. Do not decide before then.`,
        ),
      });
    }
    if (!v.parecerSindical && c.fimParecer && v.data && diffDays(v.data, c.fimParecer) > 0) {
      w.push({
        level: 'warning',
        field: 'data',
        message: l(
          `O comité sindical pode emitir parecer até cerca de ${dateLong(c.fimParecer)}. Não decida antes de terminar esse prazo, salvo se o parecer já tiver sido emitido.`,
          `The union committee may give its opinion until about ${c.fimParecer}. Do not decide before then unless the opinion has been given.`,
        ),
      });
    }
    if (!v.respostaApresentada && !v.audicaoRealizada && v.sancao) {
      w.push({
        level: 'info',
        message: l(
          'Nenhuma sanção pode ser aplicada sem ouvir o trabalhador. Confirme que lhe foi dada a oportunidade de responder.',
          'No sanction may be applied without hearing the employee. Make sure they had the chance to reply.',
        ),
      });
    }
    const sd = num(v.suspensaoDias);
    if (v.sancao === 'suspensao' && sd != null && sd > c.suspensaoMaxDias) {
      w.push({
        level: 'error',
        field: 'suspensaoDias',
        message: l(
          `A suspensão não pode exceder ${c.suspensaoMaxDias} dias por infracção (nem ${c.suspensaoMaxAno} dias por ano).`,
          `Suspension cannot exceed ${c.suspensaoMaxDias} days per offence (or ${c.suspensaoMaxAno} days a year).`,
        ),
      });
    }
    const md = num(v.multaDias);
    if (v.sancao === 'multa' && md != null && md > c.multaMaxDias) {
      w.push({
        level: 'error',
        field: 'multaDias',
        message: l(`A multa não pode exceder ${c.multaMaxDias} dias de salário.`, `The fine cannot exceed ${c.multaMaxDias} days’ pay.`),
      });
    }
    const dm = num(v.despromocaoMeses);
    if (v.sancao === 'despromocao' && dm != null && dm > c.despromocaoMaxAnos * 12) {
      w.push({
        level: 'error',
        field: 'despromocaoMeses',
        message: l(
          `A despromoção não pode exceder ${c.despromocaoMaxAnos === 1 ? 'um ano' : `${c.despromocaoMaxAnos} anos`}.`,
          `Demotion cannot exceed ${c.despromocaoMaxAnos} year(s).`,
        ),
      });
    }
    if (v.sancao === 'despromocao') {
      w.push({
        level: 'info',
        field: 'despromocaoCategoria',
        message: l('A despromoção é feita apenas para a categoria imediatamente inferior.', 'Demotion is only to the next lower grade.'),
      });
    }
    if ((v.sancao === 'suspensao' || v.sancao === 'despromocao') && v.dataInicioSancao && v.data) {
      if (diffDays(addDays(v.data, c.execucaoDias), v.dataInicioSancao) > 0) {
        w.push({
          level: 'warning',
          field: 'dataInicioSancao',
          message: l(`A sanção deve ser executada nos ${c.execucaoDias} dias seguintes à decisão.`, `The sanction must be carried out within ${c.execucaoDias} days of the decision.`),
        });
      }
      if (diffDays(v.data, v.dataInicioSancao) < 0) {
        w.push({ level: 'error', field: 'dataInicioSancao', message: l('O início da sanção é anterior à decisão.', 'The sanction starts before the decision.') });
      }
    }
    if (v.sancao === 'despedimento' && v.dataEfeitos && v.data && diffDays(v.data, v.dataEfeitos) < 0) {
      w.push({
        level: 'error',
        field: 'dataEfeitos',
        message: l('O despedimento não pode produzir efeitos antes da data da decisão.', 'The dismissal cannot take effect before the decision date.'),
      });
    }
    if (v.sancao === 'admoestacao' || v.sancao === 'repreensao') {
      w.push({
        level: 'info',
        field: 'sancao',
        message: l(
          'Para esta sanção a lei não exige processo disciplinar; basta ouvir o trabalhador. Também pode usar o documento "Repreensão registada".',
          'This sanction does not require a disciplinary procedure, only hearing the employee. You can also use the "Recorded reprimand" document.',
        ),
      });
    }
    if (!splitLines(v.factosProvados).length) {
      w.push({ level: 'warning', field: 'factosProvados', message: l('Indique os factos provados: a lei exige-o.', 'List the facts proven: the law requires it.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    // An individual employer (personal profile) takes no article and is not "a empresa".
    const pessoa = ctx.profile?.kind === 'pessoa';
    const quem = pessoa ? `**${empresa}**` : `a **${empresa}**`;
    const emp = pessoa ? 'entidade empregadora' : 'empresa';
    const provas = splitLines(v.provas);
    const provados = splitLines(v.factosProvados);
    const naoProvados = splitLines(v.factosNaoProvados);
    const sancao: string = v.sancao || 'repreensao';
    const despedimento = sancao === 'despedimento';

    // ---- Procedure summary
    const tramites: string[] = [`Nota de culpa entregue a V. Ex.ª em ${dateLong(v.dataNotaCulpa)}, com cópia ao comité sindical.`];
    tramites.push(
      v.respostaApresentada
        ? `Resposta escrita apresentada por V. Ex.ª em ${dateLong(v.dataResposta)}, que foi analisada.`
        : `V. Ex.ª não apresentou resposta escrita no prazo legal${c.fimResposta ? `, que terminou em ${dateLong(c.fimResposta)}` : ''}.`,
    );
    tramites.push(v.audicaoRealizada ? `Audição de V. Ex.ª realizada em ${dateLong(v.dataAudicao)}.` : 'Não houve lugar a audição.');
    tramites.push(
      v.parecerSindical
        ? `Processo remetido ao comité sindical, que emitiu parecer em ${dateLong(v.dataParecer)}, tido em conta na presente decisão.`
        : 'Processo remetido ao comité sindical para parecer, que não foi emitido no prazo legal.',
    );

    // ---- Sanction wording
    let sancaoTexto: string;
    let sancaoEn: string;
    switch (sancao) {
      case 'admoestacao':
        sancaoTexto = 'a sanção disciplinar de **admoestação verbal**, que fica registada no processo individual de V. Ex.ª';
        sancaoEn = 'the disciplinary sanction of a verbal warning, recorded in your personal file';
        break;
      case 'suspensao': {
        const n = num(v.suspensaoDias);
        sancaoTexto = `a sanção disciplinar de **suspensão do trabalho com perda de remuneração por ${dias(n)}**, com início em ${dateLong(v.dataInicioSancao)}. Durante esse período V. Ex.ª não presta trabalho e não tem direito à remuneração correspondente`;
        sancaoEn = `the disciplinary sanction of unpaid suspension for ${n ?? '___'} day(s), starting on ${v.dataInicioSancao || '___'}`;
        break;
      }
      case 'multa': {
        const n = num(v.multaDias);
        sancaoTexto = `a sanção disciplinar de **multa correspondente a ${dias(n)} de salário**`;
        sancaoEn = `the disciplinary sanction of a fine equal to ${n ?? '___'} day(s) of pay`;
        break;
      }
      case 'despromocao': {
        const n = num(v.despromocaoMeses);
        sancaoTexto = `a sanção disciplinar de **despromoção para a categoria de ${v.despromocaoCategoria || BLANK}**, pelo período de **${meses(n)}**, com início em ${dateLong(v.dataInicioSancao)}`;
        sancaoEn = `the disciplinary sanction of demotion to the grade of ${v.despromocaoCategoria || '___'} for ${n ?? '___'} month(s)`;
        break;
      }
      case 'despedimento':
        sancaoTexto = `a sanção disciplinar de **despedimento com justa causa**, que produz efeitos em **${dateLong(v.dataEfeitos)}**`;
        sancaoEn = `the disciplinary sanction of dismissal with just cause, effective ${v.dataEfeitos || '___'}`;
        break;
      default:
        sancaoTexto = 'a sanção disciplinar de **repreensão registada**, que fica averbada no processo individual de V. Ex.ª';
        sancaoEn = 'the disciplinary sanction of a recorded reprimand, entered in your personal file';
    }

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: `Decisão disciplinar — Processo disciplinar n.º ${v.processoNumero || BLANK}` },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Concluída a instrução do processo disciplinar acima referido, instaurado contra V. Ex.ª, ${quem} comunica-lhe, nos termos ${doCite('decisaoDisciplinarPrazo')} (Lei do Trabalho), a decisão final, que se fundamenta no seguinte.`,
        en: `Having completed the investigation of the above disciplinary case, ${empresa} informs you of its final decision, based on the following.`,
      },
      { type: 'heading', text: '1. Tramitação do processo' },
      {
        type: 'paragraph',
        id: 'tramitacao',
        text: `O processo seguiu os trâmites previstos ${doCite('procedimentoDisciplinar')}:`,
        en: 'The procedure followed the steps required by the Labour Law:',
      },
      { type: 'list', style: 'bullet', items: tramites },
      { type: 'heading', text: '2. Prova produzida' },
      {
        type: 'paragraph',
        id: 'provas',
        text: 'Foram considerados os seguintes meios de prova:',
        en: 'The following evidence was considered:',
      },
      { type: 'list', style: 'alpha', items: provas.length ? provas : [BLANK] },
      { type: 'heading', text: '3. Factos provados' },
      {
        type: 'paragraph',
        id: 'provados',
        text: 'Da prova produzida resultaram provados os seguintes factos:',
        en: 'The evidence established the following facts:',
      },
      { type: 'list', style: 'numeric', items: provados.length ? provados : [BLANK] },
    ];
    if (naoProvados.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'naoProvados',
          text: 'Não resultaram provados os seguintes factos constantes da nota de culpa:',
          en: 'The following facts in the charge were not proven:',
        },
        { type: 'list', style: 'numeric', items: naoProvados },
      );
    }
    blocks.push({ type: 'heading', text: '4. Fundamentação' });
    if (String(v.fundamentacao ?? '').trim()) {
      blocks.push({
        type: 'paragraph',
        id: 'fundamentacao',
        text: String(v.fundamentacao).trim(),
        en: 'Reasons for the decision, as written above.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'ponderacao',
      text: `Os factos provados constituem infracção disciplinar, por violação culposa dos deveres de V. Ex.ª enquanto ${g(ge, 'trabalhador', 'trabalhadora')}. Na determinação da sanção foram ponderados a gravidade da infracção e as suas consequências, o grau de culpa, o comportamento profissional anterior de V. Ex.ª, as circunstâncias em que os factos ocorreram${
        v.respostaApresentada && v.parecerSindical
          ? ' e os argumentos apresentados na defesa e no parecer sindical'
          : v.respostaApresentada
            ? ' e os argumentos apresentados na defesa'
            : v.parecerSindical
              ? ' e o parecer sindical'
              : ''
      }.`,
      en: 'The proven facts are a disciplinary offence through culpable breach of your duties. The seriousness and consequences of the offence, the degree of fault, your disciplinary record and the arguments in the defence and union opinion were weighed.',
    });
    if (despedimento) {
      blocks.push({
        type: 'paragraph',
        id: 'justaCausa',
        text: 'Pela sua gravidade e consequências, o comportamento de V. Ex.ª tornou imediata e praticamente impossível a manutenção da relação de trabalho, o que constitui justa causa de despedimento.',
        en: 'Given its seriousness and consequences, your conduct made it immediately and practically impossible to continue the employment relationship, which is just cause for dismissal.',
      });
    }
    blocks.push(
      { type: 'heading', text: '5. Decisão' },
      {
        type: 'paragraph',
        id: 'decisao',
        text: `Nestes termos, ao abrigo ${doCite('sancoesDisciplinares')}, ${quem} decide aplicar a V. Ex.ª ${sancaoTexto}.`,
        en: `Accordingly, ${empresa} decides to apply ${sancaoEn}.`,
      },
    );
    if (['suspensao', 'multa', 'despromocao'].includes(sancao)) {
      blocks.push({
        type: 'paragraph',
        id: 'execucao',
        text: `A sanção é executada nos ${c.execucaoDias} dias subsequentes à presente decisão.`,
        en: `The sanction is carried out within ${c.execucaoDias} days of this decision.`,
      });
    }
    if (despedimento) {
      blocks.push({
        type: 'paragraph',
        id: 'contasFinais',
        text: `Com a cessação do contrato, a ${emp} pagará a V. Ex.ª as importâncias que lhe sejam devidas, designadamente a remuneração até à data de efeitos do despedimento e as férias vencidas e não gozadas, bem como as proporcionais ao tempo de serviço prestado no ano da cessação, e entregar-lhe-á o certificado de trabalho previsto ${doCite('certificadoTrabalho')}.`,
        en: 'On termination, the company will pay the amounts due to you, namely pay up to the effective date and accrued and pro-rata annual leave, and will issue your certificate of employment.',
      });
      if (v.devolucaoBens) {
        blocks.push({
          type: 'paragraph',
          id: 'bens',
          text: `V. Ex.ª deve devolver, até à data de efeitos do despedimento, todos os bens, equipamentos, documentos e cartões de acesso da ${emp} que se encontrem em seu poder.`,
          en: 'You must return all company property, equipment, documents and access cards in your possession by the effective date.',
        });
      }
    }
    if (!IMPUGNAVEIS.includes(sancao)) {
      blocks.push({
        type: 'paragraph',
        id: 'reclamacao',
        text: 'V. Ex.ª pode reclamar desta decisão junto de quem a proferiu ou dela recorrer para o superior hierárquico.',
        en: 'You may lodge a complaint about this decision with whoever took it or appeal to the next level of management.',
      });
    }
    if (IMPUGNAVEIS.includes(sancao)) {
      blocks.push({
        type: 'paragraph',
        id: 'impugnacao',
        text: `Nos termos ${doCite('impugnacaoSancao')}, V. Ex.ª pode impugnar esta sanção junto dos órgãos competentes de resolução de conflitos laborais, no prazo de ${c.impugnacaoMeses} ${c.impugnacaoMeses === 1 ? 'mês' : 'meses'}.`,
        en: `You may challenge this sanction before the competent labour dispute bodies within ${c.impugnacaoMeses} month(s).`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'copia', text: `Cópia: ${v.orgaoSindical || 'Comité Sindical'}; processo individual.`, size: 'small', align: 'left' },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta decisão em ___/___/______, às ____:____ horas.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    if (v.testemunhas) blocks.push(recusaBox(`Em caso de recusa de recepção, ${g(ge, 'o trabalhador foi notificado', 'a trabalhadora foi notificada')} na presença das testemunhas abaixo, em ___/___/______.`));
    return blocks;
  },
});
