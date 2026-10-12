import { diffDays, MAX_EXTENSO, numeroPorExtenso, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type SignatureColumn, type TemplateContext, type Values, type Warning } from '../model';
import {
  blank, dateField, dateLong, employerName, employerSignature, formatMoney, g, isF, l, localField, money,
  placeDate, refField, workerFields,
} from './_shared';

// ---------------------------------------------------------------- Local helpers

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const extenso = (n: number | null | undefined) => (n != null && n > 0 && n <= MAX_EXTENSO ? ` (${numeroPorExtenso(n)})` : '');

/** "**Nome**, de nacionalidade X, portador do BI n.º Y, NUIT Z" */
function workerIdent(v: Values): { pt: string; en: string } {
  const f = isF(v.trabalhadorGenero);
  const pt = [`**${blank(v.trabalhadorNome)}**`];
  const en = [blank(v.trabalhadorNome)];
  if (v.trabalhadorNacionalidade) {
    pt.push(`de nacionalidade ${v.trabalhadorNacionalidade}`);
    en.push(`nationality: ${v.trabalhadorNacionalidade}`);
  }
  if (v.trabalhadorDocNumero) {
    pt.push(`${f ? 'portadora' : 'portador'} do ${v.trabalhadorDocTipo || 'BI'} n.º ${v.trabalhadorDocNumero}`);
    en.push(`holder of ${v.trabalhadorDocTipo || 'BI'} no. ${v.trabalhadorDocNumero}`);
  }
  if (v.trabalhadorNuit) {
    pt.push(`NUIT ${v.trabalhadorNuit}`);
    en.push(`NUIT ${v.trabalhadorNuit}`);
  }
  // Commas around the identification only when it follows the name ("que **X**, portador…, é").
  return { pt: pt.length > 1 ? `${pt.join(', ')},` : pt[0], en: en.length > 1 ? `${en.join(', ')},` : en[0] };
}

function employerRef(ctx: TemplateContext): { pt: string; en: string } {
  const name = employerName(ctx);
  if (ctx.profile?.kind === 'pessoa') return { pt: `ao serviço de **${name}**`, en: `employed by ${name}` };
  return { pt: `da **${name}**`, en: `of ${name}` };
}

function finalidade(v: Values): { pt: string; en: string } {
  const f = String(v.finalidade ?? '').trim().replace(/[.;,:]+$/, '');
  if (!f) return { pt: 'para os devidos efeitos', en: 'for all due purposes' };
  if (/^para\b/i.test(f)) return { pt: `p${f.slice(1)}`, en: `for the stated purpose (${f})` };
  if (/^(a fim|com vista|no âmbito|junto)/i.test(f)) return { pt: f, en: `for the stated purpose (${f})` };
  return { pt: `para efeitos de ${f}`, en: `for the purpose of: ${f}` };
}

/** Employer signature; an individual employer signs in their own name. */
function signer(ctx: TemplateContext): SignatureColumn {
  const s = employerSignature(ctx);
  return ctx.profile?.kind === 'pessoa' && !s.name ? { ...s, name: ctx.profile.nome || undefined } : s;
}

const CONTRATO_OPTIONS = [
  { value: 'indeterminado', label: l('Por tempo indeterminado (sem data de fim)', 'Permanent (no end date)') },
  { value: 'prazo incerto', label: l('A prazo incerto', 'Open-ended fixed term') },
  { value: 'prazo certo', label: l('A prazo certo (com data de fim)', 'Fixed term (with end date)') },
];

function contrato(v: Values): { pt: string; en: string } {
  if (v.tipoContrato === 'prazo certo') {
    return {
      pt: `a prazo certo, com termo em ${dateLong(v.dataFimContrato)}`,
      en: `a fixed-term contract ending on ${dateEn(v.dataFimContrato)}`,
    };
  }
  if (v.tipoContrato === 'prazo incerto') return { pt: 'a prazo incerto', en: 'an open-ended fixed-term contract' };
  return { pt: 'por tempo indeterminado', en: 'a permanent contract' };
}

export default defineTemplate({
  id: 'declaracao-de-trabalho',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'contrato', title: l('Contrato', 'Contract') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    {
      name: 'destinatario',
      type: 'text',
      section: 'documento',
      label: l('Entidade destinatária (opcional)', 'Addressee (optional)'),
      placeholder: l('Ex.: Embaixada de Portugal em Maputo', 'E.g. Embassy of Portugal in Maputo'),
      help: l('Deixe em branco para emitir "A quem possa interessar".', 'Leave blank to address it "To whom it may concern".'),
    },
    {
      name: 'destinatarioEndereco',
      type: 'text',
      section: 'documento',
      label: l('Endereço da entidade (opcional)', 'Addressee address (optional)'),
      showIf: (v) => Boolean(v.destinatario),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'documento',
      label: l('Finalidade (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: para efeitos de pedido de visto', 'E.g. para efeitos de pedido de visto (visa application)'),
      help: l('Sem finalidade, o texto diz "para os devidos efeitos".', 'Without a purpose the text says "for all due purposes".'),
    },
    ...workerFields([
      'nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'nuit', 'cargo', 'categoria', 'departamento', 'dataAdmissao',
    ]).map((f) => (f.name === 'trabalhadorDataAdmissao' || f.name === 'trabalhadorCargo' ? { ...f, required: true } : f)),
    {
      name: 'tipoContrato',
      type: 'select',
      section: 'contrato',
      width: 'half',
      label: l('Tipo de contrato', 'Contract type'),
      options: CONTRATO_OPTIONS,
      default: 'indeterminado',
    },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'contrato',
      width: 'half',
      required: true,
      label: l('Data de fim do contrato', 'Contract end date'),
      showIf: (v) => v.tipoContrato === 'prazo certo',
    },
    {
      name: 'regime',
      type: 'radio',
      section: 'contrato',
      label: l('Regime de trabalho', 'Working time'),
      options: [
        { value: 'tempo inteiro', label: l('Tempo inteiro', 'Full time') },
        { value: 'tempo parcial', label: l('Tempo parcial', 'Part time') },
      ],
      default: 'tempo inteiro',
    },
    {
      name: 'incluirSalario',
      type: 'toggle',
      section: 'opcoes',
      label: l('Indicar o salário', 'State the salary'),
      help: l('Inclui o salário base mensal na declaração.', 'Includes the monthly base salary in the letter.'),
    },
    ...workerFields(['salario'], 'opcoes').map((f) => ({ ...f, showIf: (v: Values) => Boolean(v.incluirSalario) })),
    {
      name: 'referenciaConduta',
      type: 'toggle',
      section: 'opcoes',
      label: l('Incluir referência ao bom desempenho', 'Include a good-performance statement'),
      help: l('Acrescenta que o trabalhador tem demonstrado assiduidade, zelo e competência.', 'Adds that the employee has shown diligence, care and competence.'),
    },
  ],

  warnings: (v, { today }) => {
    const w: Warning[] = [];
    if (!v.trabalhadorDataAdmissao) {
      w.push({ level: 'warning', field: 'trabalhadorDataAdmissao', message: l('Indique a data de admissão.', 'Enter the start date.') });
    }
    if (!v.trabalhadorCargo) {
      w.push({ level: 'warning', field: 'trabalhadorCargo', message: l('Indique o cargo ou função.', 'Enter the position.') });
    }
    if (!v.trabalhadorDocNumero) {
      w.push({
        level: 'info',
        field: 'trabalhadorDocNumero',
        message: l('Embaixadas e bancos pedem normalmente o número do documento de identificação.', 'Embassies and banks usually ask for the ID number.'),
      });
    }
    if (v.tipoContrato === 'prazo certo') {
      if (!v.dataFimContrato) {
        w.push({ level: 'warning', field: 'dataFimContrato', message: l('Indique a data de fim do contrato.', 'Enter the contract end date.') });
      } else if (diffDays(v.data || today, v.dataFimContrato) < 0) {
        w.push({
          level: 'warning',
          field: 'dataFimContrato',
          message: l(
            'O contrato já terminou. Para quem já não trabalha na empresa use o certificado de trabalho.',
            'The contract has already ended. For former employees use the work certificate.',
          ),
        });
      }
    }
    if (v.incluirSalario && money(v.trabalhadorSalario) == null) {
      w.push({ level: 'warning', field: 'trabalhadorSalario', message: l('Indique o salário base.', 'Enter the base salary.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const f = isF(ge);
    const empresa = ctx.profile?.kind !== 'pessoa';
    const who = workerIdent(v);
    const emp = employerRef(ctx);
    const fin = finalidade(v);
    const ct = contrato(v);
    const parcial = v.regime === 'tempo parcial';

    const funcoesPt = `**${blank(v.trabalhadorCargo)}**${v.trabalhadorDepartamento ? ` (${v.trabalhadorDepartamento})` : ''}${v.trabalhadorCategoria ? `, com a categoria profissional de ${v.trabalhadorCategoria}` : ''}`;
    const funcoesEn = `${blank(v.trabalhadorCargo)}${v.trabalhadorDepartamento ? ` (${v.trabalhadorDepartamento})` : ''}${v.trabalhadorCategoria ? `, job grade ${v.trabalhadorCategoria}` : ''}`;

    const blocks: Block[] = [];
    if (v.ref) blocks.push({ type: 'reference', ref: v.ref });
    if (v.destinatario) {
      blocks.push({ type: 'recipient', salutation: 'Exmos. Senhores', lines: [v.destinatario, v.destinatarioEndereco || ''] });
    }
    blocks.push(
      { type: 'title', text: 'Declaração', subtitle: v.destinatario ? undefined : 'A quem possa interessar' },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${fin.pt.charAt(0).toUpperCase()}${fin.pt.slice(1)}, declara-se que ${who.pt} é ${g(ge, 'trabalhador', 'trabalhadora')} ${emp.pt} desde ${dateLong(v.trabalhadorDataAdmissao)}, onde exerce as funções de ${funcoesPt}.`,
        en: `This is to certify, ${fin.en}, that ${who.en} has been an employee ${emp.en} since ${dateEn(v.trabalhadorDataAdmissao)}, holding the position of ${funcoesEn}.`,
      },
      {
        type: 'paragraph',
        id: 'vinculo',
        text: `${g(ge, 'O referido trabalhador', 'A referida trabalhadora')} presta trabalho em regime de ${parcial ? 'tempo parcial' : 'tempo inteiro'}, ao abrigo de contrato de trabalho ${ct.pt}.`,
        en: `${f ? 'She' : 'He'} works ${parcial ? 'part time' : 'full time'} under ${ct.en}.`,
      },
    );
    if (v.incluirSalario) {
      const s = money(v.trabalhadorSalario);
      blocks.push({
        type: 'paragraph',
        id: 'salario',
        text: `Mais se declara que ${g(ge, 'o referido trabalhador', 'a referida trabalhadora')} aufere o salário base mensal ilíquido de **${formatMoney(s)}**${extenso(s)}.`,
        en: `${f ? 'She' : 'He'} earns a gross monthly base salary of ${formatMoney(s)}.`,
      });
    }
    if (v.referenciaConduta) {
      blocks.push({
        type: 'paragraph',
        id: 'conduta',
        text: `No exercício das suas funções, ${g(ge, 'o trabalhador', 'a trabalhadora')} tem demonstrado assiduidade, zelo e competência.`,
        en: `In the performance of ${f ? 'her' : 'his'} duties, the employee has shown diligence, care and competence.`,
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: empresa
          ? 'Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai por mim assinada e autenticada com o carimbo em uso nesta empresa.'
          : 'Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai por mim assinada.',
        en: empresa
          ? 'This declaration is issued at the request of the person concerned, signed and authenticated with the company stamp.'
          : 'This declaration is issued at the request of the person concerned and signed by me.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer(ctx)] },
    );
    return blocks;
  },
});
