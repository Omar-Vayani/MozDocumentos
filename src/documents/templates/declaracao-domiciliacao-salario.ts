// Declaração e compromisso de domiciliação de salário, emitida pela entidade
// empregadora para o banco conceder crédito ao trabalhador, com a autorização
// escrita deste.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, g, l, localField, money, moneyText, refField, workerFields } from './_shared';
import { contrair, s, semPonto } from './_financas';

export default defineTemplate({
  id: 'declaracao-domiciliacao-salario',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'banco', title: l('Banco e crédito', 'Bank and loan') },
    { id: 'compromissos', title: l('Compromissos', 'Undertakings') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'docNumero', 'nuit', 'cargo', 'dataAdmissao', 'salario'], 'trabalhador'),
    {
      name: 'contratoTipo',
      type: 'radio',
      section: 'trabalhador',
      label: l('Contrato', 'Contract'),
      options: [
        { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
        { value: 'prazo', label: l('A prazo, até', 'Fixed term, until') },
      ],
      default: 'indeterminado',
    },
    { name: 'contratoFim', type: 'date', section: 'trabalhador', width: 'half', label: l('Termo do contrato', 'Contract end date'), showIf: (v) => v.contratoTipo === 'prazo' },
    { name: 'salarioLiquido', type: 'money', section: 'trabalhador', width: 'half', label: l('Salário líquido mensal', 'Net monthly salary') },
    { name: 'bancoNome', type: 'text', section: 'banco', required: true, label: l('Banco', 'Bank'), placeholder: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. the bank') },
    { name: 'bancoBalcao', type: 'text', section: 'banco', width: 'half', label: l('Balcão (opcional)', 'Branch (optional)') },
    { name: 'contaNumero', type: 'text', section: 'banco', width: 'half', label: l('Conta do trabalhador n.º', 'Employee’s account no.') },
    { name: 'credito', type: 'text', section: 'banco', label: l('Crédito a que se destina (opcional)', 'Loan concerned (optional)'), placeholder: l('Ex.: crédito pessoal de 250.000,00 MT', 'E.g. a personal loan') },
    { name: 'naoAlterar', type: 'toggle', section: 'compromissos', default: true, label: l('Não transferir o salário para outro banco sem acordo do banco ou o crédito pago', 'Not move the salary to another bank without the bank’s consent or repayment') },
    { name: 'informarCessacao', type: 'toggle', section: 'compromissos', default: true, label: l('Informar o banco se o contrato de trabalho cessar', 'Tell the bank if employment ends') },
    { name: 'descontoFolha', type: 'toggle', section: 'compromissos', label: l('Descontar a prestação no salário e transferi-la para o banco', 'Deduct the instalment from pay and send it to the bank') },
    { name: 'prestacao', type: 'money', section: 'compromissos', width: 'half', label: l('Prestação a descontar', 'Instalment to deduct'), showIf: (v) => Boolean(v.descontoFolha) },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!s(v.trabalhadorNome)) w.push({ level: 'error', field: 'trabalhadorNome', message: l('Indique o trabalhador.', 'Enter the employee.') });
    if (!s(v.bancoNome)) w.push({ level: 'warning', field: 'bancoNome', message: l('Indique o banco.', 'Enter the bank.') });
    w.push({
      level: 'info',
      message: l(
        'O trabalhador assina a autorização no fim: sem ela, a empresa não pode comprometer-se a manter o salário num banco nem a fazer descontos. Use os modelos do banco se este os exigir.',
        'The employee signs the authorisation at the end: without it the employer cannot commit the salary to a bank or make deductions. Use the bank’s own forms if it requires them.',
      ),
    });
    if (v.descontoFolha) {
      const lim = ctx.legal.value<{ fracaoMaxima: number }>('descontosRemuneracao').fracaoMaxima;
      const sal = money(v.trabalhadorSalario);
      const pre = money(v.prestacao);
      if (sal != null && pre != null && pre > sal * lim) {
        w.push({ level: 'error', field: 'prestacao', message: l(`A prestação excede o limite dos descontos no salário (${cite('descontosRemuneracao')}).`, 'The instalment exceeds the legal limit on pay deductions.') });
      } else {
        w.push({ level: 'info', field: 'prestacao', message: l(`Os descontos no salário dependem de autorização escrita do trabalhador e têm um limite legal (${cite('descontosRemuneracao')}).`, 'Pay deductions need the employee’s written authorisation and are capped by law.') });
      }
    }
    return w;
  },

  personName: (v) => s(v.trabalhadorNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.trabalhadorGenero === 'F';
    const banco = s(v.bancoNome) || BLANK;
    const bancoArt = /^(banco|millennium|standard|absa|moza|bci|fnb|ecobank|nedbank|first)/i.test(banco) ? `o ${banco}` : `a ${banco}`;
    const deBanco = contrair('de', bancoArt);
    const empresa = employerName(ctx);
    const compromissos: string[] = [
      `domiciliar o salário ${g(v.trabalhadorGenero, 'do trabalhador', 'da trabalhadora')} na conta n.º ${s(v.contaNumero) || BLANK}, ${contrair('em', bancoArt)}${s(v.bancoBalcao) ? `, ${semPonto(v.bancoBalcao)}` : ''}, enquanto se mantiver o contrato de trabalho`,
    ];
    if (v.naoAlterar) compromissos.push(`não transferir a domiciliação do salário para outra instituição sem o acordo escrito ${deBanco} ou sem a apresentação de declaração de liquidação do crédito`);
    if (v.descontoFolha) compromissos.push(`descontar mensalmente no salário a prestação de ${money(v.prestacao) != null ? `**${moneyText(v.prestacao)}**` : `${BLANK} MT`} e transferi-la para a referida conta na data do pagamento do salário, enquanto durar o crédito`);
    if (v.informarCessacao) compromissos.push(`informar ${contrair('a', bancoArt)}, no prazo mais curto possível, da cessação do contrato de trabalho por qualquer motivo`);

    const blocks: Block[] = [
      { type: 'reference', ref: s(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Declaração e compromisso de domiciliação de salário' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `**${empresa}** declara, para efeitos de ${s(v.credito) ? `concessão de ${semPonto(v.credito).replace(/^(o|a|um|uma)\s+/i, '')}` : 'concessão de crédito'} ${contrair('por', bancoArt)}, que **${s(v.trabalhadorNome) || BLANK}**${s(v.trabalhadorDocNumero) ? `, ${f ? 'portadora' : 'portador'} do BI n.º ${s(v.trabalhadorDocNumero)}` : ''}${s(v.trabalhadorNuit) ? `, NUIT ${s(v.trabalhadorNuit)}` : ''}, é ${f ? 'sua trabalhadora' : 'seu trabalhador'} desde ${dateLong(v.trabalhadorDataAdmissao)}, com a categoria de ${s(v.trabalhadorCargo) || BLANK}, ao abrigo de contrato de trabalho ${v.contratoTipo === 'prazo' ? `a prazo, válido até ${dateLong(v.contratoFim)}` : 'por tempo indeterminado'}, auferindo o salário base mensal ilíquido de **${money(v.trabalhadorSalario) != null ? moneyText(v.trabalhadorSalario) : `${BLANK} MT`}**${money(v.salarioLiquido) != null ? ` e o salário líquido de **${moneyText(v.salarioLiquido)}**` : ''}.`,
        en: 'The employer confirms the employee’s employment, position, contract and salary for the purpose of a bank loan.',
      },
      { type: 'paragraph', id: 'compromissoIntro', text: `Com a autorização ${g(v.trabalhadorGenero, 'do trabalhador', 'da trabalhadora')}, abaixo assinada, a entidade empregadora compromete-se a:`, en: 'With the employee’s authorisation, the employer undertakes to:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: compromissos.map((c, i) => `${c}${i === compromissos.length - 1 ? '.' : ';'}`) },
      {
        type: 'paragraph',
        id: 'limite',
        text: 'A presente declaração não constitui garantia da entidade empregadora pelo pagamento do crédito, nem limita os direitos das partes no contrato de trabalho.',
        en: 'This statement is not a guarantee by the employer and does not limit employment rights.',
        keepWithNext: true,
      },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
      {
        type: 'box',
        label: g(v.trabalhadorGenero, 'Autorização do trabalhador', 'Autorização da trabalhadora'),
        text: `Eu, ${s(v.trabalhadorNome) || BLANK}, autorizo a entidade empregadora a assumir os compromissos acima${v.descontoFolha ? ', incluindo o desconto mensal da prestação no meu salário,' : ''} enquanto durar o crédito.\n\nAssinatura: __________________________________   Data: ___/___/______`,
      },
    ];
    return blocks;
  },
});
