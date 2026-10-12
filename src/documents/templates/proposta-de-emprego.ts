import { addDays, addMonths, diffDays, inteiroPorExtenso, MAX_EXTENSO, numeroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, formatMoney, g, l, lineItems, localField, money,
  refField, splitLines, workerFields,
} from './_shared';

type TipoContrato = 'indeterminado' | 'prazo-certo' | 'prazo-incerto';

const num = (x: unknown): number | null => {
  if (x === '' || x == null || typeof x === 'boolean') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};

/** "3 (três) meses" */
const qty = (n: number, sing: string, plural: string) =>
  Number.isInteger(n) && n >= 0 && n < 1_000_000 ? `${n} (${inteiroPorExtenso(n)}) ${n === 1 ? sing : plural}` : `${n} ${plural}`;

const moneyExt = (v: unknown) => {
  const n = money(v);
  if (n == null) return formatMoney(null);
  return n >= 0 && n <= MAX_EXTENSO ? `${formatMoney(n)} (${numeroPorExtenso(n)})` : formatMoney(n);
};

const trim = (s: unknown) => String(s ?? '').trim();

export default defineTemplate({
  id: 'proposta-de-emprego',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Candidato', 'Candidate'), personRole: 'trabalhador' },
    { id: 'posto', title: l('Posto de trabalho', 'Position') },
    { id: 'remuneracao', title: l('Remuneração e benefícios', 'Pay and benefits') },
    { id: 'resposta', title: l('Condições e resposta', 'Conditions and reply') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da proposta', 'Offer date')),
    {
      name: 'dataEntrevista',
      type: 'date',
      section: 'documento',
      width: 'half',
      label: l('Data da entrevista (opcional)', 'Interview date (optional)'),
    },
    ...workerFields(['nome', 'genero', 'morada', 'telefone'], 'trabalhador'),
    {
      name: 'trabalhadorEmail',
      type: 'email',
      section: 'trabalhador',
      width: 'half',
      personKey: 'email',
      label: l('Email', 'Email'),
    },
    ...workerFields(['cargo', 'categoria', 'departamento'], 'posto').map((f) =>
      f.name === 'trabalhadorCargo' ? { ...f, required: true, label: l('Cargo proposto', 'Position offered') } : f,
    ),
    {
      name: 'localTrabalho',
      type: 'text',
      section: 'posto',
      label: l('Local de trabalho', 'Workplace'),
      placeholder: l('Ex.: Sede da empresa, Maputo', 'E.g. Head office, Maputo'),
    },
    {
      name: 'tipoContrato',
      type: 'select',
      section: 'posto',
      width: 'half',
      default: 'indeterminado',
      label: l('Tipo de contrato', 'Contract type'),
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado (sem data de fim)', 'Permanent') },
        { value: 'prazo-certo', label: l('A prazo certo (com data de fim)', 'Fixed term') },
        { value: 'prazo-incerto', label: l('A prazo incerto (até terminar a tarefa)', 'Until a task ends') },
      ],
    },
    {
      name: 'duracaoMeses',
      type: 'number',
      section: 'posto',
      width: 'half',
      min: 1,
      max: 120,
      showIf: (v) => v.tipoContrato === 'prazo-certo',
      label: l('Duração do contrato (meses)', 'Contract term (months)'),
    },
    {
      ...workerFields(['dataAdmissao'], 'posto')[0],
      required: true,
      label: l('Data prevista de início', 'Expected start date'),
    },
    {
      name: 'horario',
      type: 'text',
      section: 'posto',
      label: l('Horário de trabalho', 'Working hours'),
      placeholder: l('Ex.: de segunda a sexta-feira, das 8h00 às 17h00', 'E.g. Monday to Friday, 8:00 to 17:00'),
    },
    {
      name: 'periodoProbatorio',
      type: 'toggle',
      section: 'posto',
      default: true,
      label: l('Período probatório', 'Probation period'),
    },
    {
      name: 'probatorioMeses',
      type: 'number',
      section: 'posto',
      width: 'half',
      min: 1,
      max: 12,
      showIf: (v) => Boolean(v.periodoProbatorio) && (v.tipoContrato ?? 'indeterminado') === 'indeterminado',
      computedKey: 'probatorioIndetDefault',
      label: l('Duração do período probatório (meses)', 'Probation length (months)'),
    },
    {
      name: 'probatorioDias',
      type: 'number',
      section: 'posto',
      width: 'half',
      min: 1,
      max: 365,
      showIf: (v) => Boolean(v.periodoProbatorio) && (v.tipoContrato ?? 'indeterminado') !== 'indeterminado',
      computedKey: 'probatorioPrazoDefault',
      label: l('Duração do período probatório (dias)', 'Probation length (days)'),
    },
    {
      ...workerFields(['salario'], 'remuneracao')[0],
      required: true,
      label: l('Salário base mensal (ilíquido)', 'Monthly base salary (gross)'),
    },
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Subsídios', 'Allowances'),
      addLabel: l('Adicionar subsídio', 'Add allowance'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Subsídio de transporte', 'E.g. Transport allowance') },
        { name: 'valor', type: 'money', label: l('Valor mensal', 'Monthly amount') },
      ],
      default: [],
    },
    {
      name: 'beneficios',
      type: 'textarea',
      section: 'remuneracao',
      rows: 3,
      label: l('Outros benefícios (opcional)', 'Other benefits (optional)'),
      help: l('Um por linha.', 'One per line.'),
      placeholder: l('Ex.: Seguro de saúde para o trabalhador e agregado familiar', 'E.g. Health insurance for the employee and family'),
    },
    {
      name: 'condicoes',
      type: 'textarea',
      section: 'resposta',
      rows: 4,
      label: l('Condições da admissão (opcional)', 'Conditions of hiring (optional)'),
      help: l('Uma por linha. Documentos a apresentar, exames, referências…', 'One per line. Documents to submit, medical check, references…'),
      default:
        'Apresentação de cópia do documento de identificação, do NUIT e do cartão de beneficiário do INSS\nApresentação de cópia dos certificados de habilitações literárias e profissionais',
    },
    {
      name: 'dataLimite',
      type: 'date',
      section: 'resposta',
      width: 'half',
      required: true,
      label: l('Prazo para responder', 'Reply by'),
      default: (c) => addDays(c.today, 7),
    },
    {
      name: 'contactoNome',
      type: 'text',
      section: 'resposta',
      width: 'half',
      label: l('Pessoa de contacto (opcional)', 'Contact person (optional)'),
    },
    {
      name: 'contactoMeio',
      type: 'text',
      section: 'resposta',
      width: 'half',
      label: l('Telefone ou email de contacto', 'Contact phone or email'),
      showIf: (v) => Boolean(v.contactoNome),
    },
  ],

  computed: (v, { legal }) => {
    const pp = legal.value<{ geral: number; tecnicoMedio: number; tecnicoSuperior: number }>('periodoProbatorioIndeterminado');
    const ppz = legal.value<{ maisDe1Ano: number; de6MesesA1Ano: number; ate6Meses: number }>('periodoProbatorioPrazo');
    const tipo = (v.tipoContrato || 'indeterminado') as TipoContrato;
    const meses = num(v.duracaoMeses);
    const prazoMax = tipo === 'prazo-certo' && meses != null ? (meses > 12 ? ppz.maisDe1Ano : meses > 6 ? ppz.de6MesesA1Ano : ppz.ate6Meses) : ppz.ate6Meses;
    return {
      tipo,
      meses,
      pp,
      prazoMax,
      probatorioIndetDefault: pp.geral,
      probatorioPrazoDefault: prazoMax,
      probMeses: num(v.probatorioMeses) ?? pp.geral,
      probDias: num(v.probatorioDias) ?? prazoMax,
      maxAnos: legal.value<{ duracaoMaxAnos: number }>('contratoPrazoCerto').duracaoMaxAnos,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (v.dataLimite && v.data && diffDays(v.data, v.dataLimite) < 0) {
      w.push({ level: 'error', field: 'dataLimite', message: l('O prazo de resposta é anterior à data da proposta.', 'The reply date is before the offer date.') });
    }
    if (v.dataLimite && v.trabalhadorDataAdmissao && diffDays(v.trabalhadorDataAdmissao, v.dataLimite) > 0) {
      w.push({
        level: 'warning',
        field: 'dataLimite',
        message: l('O prazo de resposta termina depois da data prevista de início.', 'The reply deadline is after the expected start date.'),
      });
    }
    if (money(v.trabalhadorSalario) == null) {
      w.push({ level: 'warning', field: 'trabalhadorSalario', message: l('Indique o salário proposto.', 'Enter the salary offered.') });
    }
    if (v.periodoProbatorio && c.tipo === 'indeterminado') {
      if (c.probMeses > c.pp.tecnicoSuperior) {
        w.push({
          level: 'error',
          field: 'probatorioMeses',
          message: l(
            `O período probatório excede o máximo legal de ${c.pp.tecnicoSuperior} meses (${cite('periodoProbatorioIndeterminado')}).`,
            `Probation exceeds the legal maximum of ${c.pp.tecnicoSuperior} months.`,
          ),
        });
      } else if (c.probMeses > c.pp.geral) {
        w.push({
          level: 'info',
          field: 'probatorioMeses',
          message: l(
            `Mais de ${c.pp.geral} meses de período probatório só é permitido para técnicos médios (até ${c.pp.tecnicoMedio}) e técnicos superiores ou cargos de direcção e chefia (até ${c.pp.tecnicoSuperior}).`,
            `Probation over ${c.pp.geral} months is only allowed for mid-level technicians (up to ${c.pp.tecnicoMedio}) and senior technicians or managers (up to ${c.pp.tecnicoSuperior}).`,
          ),
        });
      }
    }
    if (v.periodoProbatorio && c.tipo !== 'indeterminado' && c.probDias > c.prazoMax) {
      w.push({
        level: 'error',
        field: 'probatorioDias',
        message: l(
          `O período probatório excede o máximo legal de ${c.prazoMax} dias para este contrato (${cite('periodoProbatorioPrazo')}).`,
          `Probation exceeds the legal maximum of ${c.prazoMax} days for this contract.`,
        ),
      });
    }
    if (c.tipo === 'prazo-certo') {
      if (c.meses == null) {
        w.push({ level: 'warning', field: 'duracaoMeses', message: l('Indique a duração do contrato.', 'Enter the contract term.') });
      } else if (c.meses > c.maxAnos * 12) {
        w.push({
          level: 'warning',
          field: 'duracaoMeses',
          message: l(
            `A duração excede ${c.maxAnos} anos, o limite do contrato a prazo certo (${cite('contratoPrazoCerto')}). Confirme com um jurista.`,
            `The term exceeds ${c.maxAnos} years, the fixed-term limit. Confirm with a lawyer.`,
          ),
        });
      }
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    const cargo = trim(v.trabalhadorCargo);
    const inicio = v.trabalhadorDataAdmissao as string | undefined;

    const tipoTexto: Record<TipoContrato, string> = {
      indeterminado: 'Contrato de trabalho por tempo indeterminado',
      'prazo-certo': `Contrato de trabalho a prazo certo${c.meses ? `, pelo período de ${qty(c.meses, 'mês', 'meses')}` : ''}`,
      'prazo-incerto': 'Contrato de trabalho a prazo incerto',
    };
    let probatorio = 'Não aplicável';
    if (v.periodoProbatorio) {
      probatorio = c.tipo === 'indeterminado' ? qty(c.probMeses, 'mês', 'meses') : qty(c.probDias, 'dia', 'dias');
      if (inicio) {
        const fim = c.tipo === 'indeterminado' ? addDays(addMonths(inicio, c.probMeses), -1) : addDays(inicio, c.probDias - 1);
        probatorio += `, até ${dateLong(fim)}`;
      }
    }

    const items: { label: string; value: string }[] = [{ label: 'Cargo', value: cargo || BLANK }];
    if (trim(v.trabalhadorCategoria)) items.push({ label: 'Categoria profissional', value: trim(v.trabalhadorCategoria) });
    if (trim(v.trabalhadorDepartamento)) items.push({ label: 'Departamento', value: trim(v.trabalhadorDepartamento) });
    items.push(
      { label: 'Local de trabalho', value: trim(v.localTrabalho) || BLANK },
      { label: 'Tipo de contrato', value: tipoTexto[c.tipo as TipoContrato] },
      { label: 'Data de início', value: dateLong(inicio) },
      { label: 'Período probatório', value: probatorio },
    );
    if (trim(v.horario)) items.push({ label: 'Horário de trabalho', value: trim(v.horario) });
    items.push({ label: 'Salário base mensal', value: moneyExt(v.trabalhadorSalario) });
    for (const s of lineItems(v.subsidios)) {
      if (!s.descricao && money(s.valor) == null) continue;
      items.push({ label: trim(s.descricao) || 'Subsídio', value: `${formatMoney(money(s.valor))} por mês` });
    }
    const beneficios = splitLines(v.beneficios);
    if (beneficios.length) items.push({ label: 'Outros benefícios', value: beneficios.join('; ') });

    const condicoes = splitLines(v.condicoes);
    // "a Sociedade X, Lda" for a company; no article for an individual employer.
    const art = ctx.profile?.kind === 'pessoa' ? '' : 'a ';
    const sujeito = `${art}**${empresa}** propõe a V. Ex.ª a sua admissão para o cargo de **${cargo || BLANK}**, nas condições seguintes:`;
    const aberturaPt = v.dataEntrevista
      ? `Na sequência da entrevista realizada em ${dateLong(v.dataEntrevista)}, ${sujeito}`
      : `${sujeito.charAt(0).toUpperCase()}${sujeito.slice(1)}`;

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, trim(v.trabalhadorMorada), trim(v.trabalhadorEmail)],
      },
      { type: 'subject', text: `Proposta de emprego${cargo ? ` — ${cargo}` : ''}` },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: aberturaPt,
        en: `${v.dataEntrevista ? `Following the interview on ${v.dataEntrevista}, ` : ''}${empresa} offers you employment as ${cargo || '—'} on the following terms:`,
      },
      { type: 'keyValue', title: 'Condições propostas', columns: 1, items },
      {
        type: 'paragraph',
        id: 'iliquido',
        text: 'Os valores indicados são ilíquidos e estão sujeitos aos descontos obrigatórios por lei, designadamente a contribuição para o INSS e a retenção na fonte do IRPS.',
        en: 'The amounts are gross and subject to statutory deductions (INSS and IRPS withholding).',
      },
    ];
    if (condicoes.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'condicoes',
          text: 'A admissão fica sujeita às seguintes condições:',
          en: 'Hiring is subject to the following conditions:',
          keepWithNext: true,
        },
        { type: 'list', style: 'alpha', items: condicoes.map((s, i) => `${s.replace(/[.;]$/, '')}${i === condicoes.length - 1 ? '.' : ';'}`) },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'contrato',
        text: 'As condições definitivas da relação de trabalho constarão do contrato de trabalho escrito a celebrar entre as partes até à data de início de funções, nos termos da Lei do Trabalho.',
        en: 'The final terms will be set out in the written employment contract, to be signed by the start date under the Labour Law.',
      },
      {
        type: 'paragraph',
        id: 'prazo',
        text: `Solicitamos que V. Ex.ª nos comunique a sua decisão até **${dateLong(v.dataLimite)}**, devolvendo uma cópia desta carta assinada. Na falta de resposta até essa data, a presente proposta considera-se retirada.`,
        en: `Please reply by ${v.dataLimite || '—'} by returning a signed copy of this letter. Without a reply by then, the offer lapses.`,
      },
    );
    if (trim(v.contactoNome)) {
      blocks.push({
        type: 'paragraph',
        id: 'contacto',
        text: `Para qualquer esclarecimento, V. Ex.ª pode dirigir-se a ${trim(v.contactoNome)}${trim(v.contactoMeio) ? ` (${trim(v.contactoMeio)})` : ''}.`,
        en: `For any questions, contact ${trim(v.contactoNome)}${trim(v.contactoMeio) ? ` (${trim(v.contactoMeio)})` : ''}.`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'Pela Entidade Empregadora')] },
      { type: 'heading', text: 'Aceitação da proposta', keepWithNext: true },
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: `Eu, **${v.trabalhadorNome || BLANK}**, declaro que aceito a presente proposta de emprego, nas condições nela descritas, e que me apresentarei ao serviço em ${dateLong(inicio)}.`,
        en: `I, ${v.trabalhadorNome || '—'}, accept this job offer on the terms described and will report for work on ${inicio || '—'}.`,
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: '____________________, ___ de __________ de ______',
        columns: [{ role: g(ge, 'O Candidato', 'A Candidata'), name: v.trabalhadorNome || undefined }],
      },
    );
    return blocks;
  },
});
