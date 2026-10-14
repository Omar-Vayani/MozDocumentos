// Comunicação de promoção / alteração de categoria e remuneração: promotion,
// appointment to a management or trust position, acting role (substituição)
// or pay review. Pay may never go down.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerSignature, exmo, formatMoney, l, lineItems, localField, money, refField, workerFields } from './_shared';
import { moneyExt, wk } from './_contrato-trabalho';
import { lowerFirst, str } from './_pessoal-rh';

type Tipo = 'promocao' | 'chefia' | 'substituicao' | 'revisao';

const ASSUNTO: Record<Tipo, string> = {
  promocao: 'Promoção',
  chefia: 'Nomeação para cargo de chefia',
  substituicao: 'Exercício de funções em substituição',
  revisao: 'Revisão salarial',
};

export default defineTemplate({
  id: 'carta-promocao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'alteracao', title: l('Alteração', 'Change') },
    { id: 'remuneracao', title: l('Remuneração', 'Pay') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'departamento', 'salario']).map((f) =>
      f.name === 'trabalhadorCargo' ? { ...f, label: l('Cargo actual', 'Current position') } : f.name === 'trabalhadorSalario' ? { ...f, label: l('Salário base actual', 'Current base salary'), required: true } : f,
    ),
    {
      name: 'tipo',
      type: 'select',
      section: 'alteracao',
      required: true,
      label: l('O que comunica', 'What you are notifying'),
      default: 'promocao',
      options: [
        { value: 'promocao', label: l('Promoção (nova categoria)', 'Promotion (new grade)') },
        { value: 'chefia', label: l('Nomeação para cargo de chefia ou confiança', 'Appointment to a management or trust position') },
        { value: 'substituicao', label: l('Substituição temporária de outro trabalhador', 'Acting for another employee') },
        { value: 'revisao', label: l('Revisão salarial (mesma categoria)', 'Pay review (same grade)') },
      ],
    },
    { name: 'novaCategoria', type: 'text', section: 'alteracao', label: l('Nova categoria / cargo', 'New grade / position'), showIf: (v) => v.tipo !== 'revisao', placeholder: l('Ex.: Técnica Superior de Contabilidade', 'E.g. Senior Accountant') },
    { name: 'substituidoNome', type: 'text', section: 'alteracao', width: 'half', label: l('Trabalhador substituído', 'Employee replaced'), showIf: (v) => v.tipo === 'substituicao' },
    { name: 'substituicaoFim', type: 'date', section: 'alteracao', width: 'half', label: l('Até (previsão)', 'Until (expected)'), showIf: (v) => v.tipo === 'substituicao' },
    { name: 'dataEfeito', type: 'date', section: 'alteracao', width: 'half', required: true, label: l('Com efeitos a partir de', 'Effective from'), default: (c) => c.today },
    { name: 'motivo', type: 'text', section: 'alteracao', label: l('Motivo (opcional)', 'Reason (optional)'), placeholder: l('Ex.: avaliação de desempenho de 2025', 'E.g. 2025 performance review') },
    { name: 'anexoDescricao', type: 'toggle', section: 'alteracao', default: true, label: l('Junta a descrição de funções', 'Attach the job description'), showIf: (v) => v.tipo !== 'revisao' },
    { name: 'novoSalario', type: 'money', section: 'remuneracao', width: 'half', required: true, label: l('Novo salário base', 'New base salary') },
    {
      name: 'subsidios',
      type: 'lines',
      section: 'remuneracao',
      label: l('Novos subsídios (opcional)', 'New allowances (optional)'),
      addLabel: l('Adicionar subsídio', 'Add allowance'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Subsídio de chefia', 'E.g. Management allowance') },
        { name: 'valor', type: 'money', label: l('Valor mensal', 'Monthly amount') },
      ],
      default: [],
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const antes = money(v.trabalhadorSalario);
    const depois = money(v.novoSalario);
    if (antes != null && depois != null && depois < antes) {
      w.push({ level: 'error', field: 'novoSalario', message: l(`A remuneração não pode diminuir (${cite('alteracaoCategoria')}).`, 'Pay may not be reduced.') });
    }
    if (depois == null) w.push({ level: 'warning', field: 'novoSalario', message: l('Indique o novo salário base.', 'Enter the new base salary.') });
    if (v.tipo === 'chefia') {
      const pct = ctx.legal.value<{ acrescimoMin: number }>('remuneracaoChefia').acrescimoMin;
      if (antes != null && depois != null && depois < antes * (1 + pct / 100)) {
        w.push({
          level: 'info',
          field: 'novoSalario',
          message: l(
            `Se o salário actual já for igual ou superior ao do cargo, o trabalhador tem direito a um acréscimo de pelo menos ${pct} por cento enquanto exercer o cargo (${cite('remuneracaoChefia')}).`,
            `If current pay is already equal to or above the position’s pay, the employee gets at least ${pct}% extra while in the role.`,
          ),
        });
      }
    }
    if (v.tipo === 'substituicao') {
      const s = ctx.legal.value<{ substituicaoDias: number }>('remuneracaoSubstituicao').substituicaoDias;
      if (v.dataEfeito && v.substituicaoFim && diffDays(v.dataEfeito, v.substituicaoFim) + 1 >= s) {
        w.push({ level: 'info', field: 'novoSalario', message: l(`Substituição por ${s} dias ou mais: o trabalhador recebe a remuneração da categoria substituída (${cite('remuneracaoSubstituicao')}).`, `Acting for ${s} days or more: the employee is paid at the replaced grade.`) });
      }
    }
    w.push({ level: 'info', message: l('Actualize a folha de salários e o registo no INSS a partir da data de efeito.', 'Update payroll and INSS records from the effective date.') });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = (v.tipo || 'promocao') as Tipo;
    const W = wk(v.trabalhadorGenero);
    const nova = str(v.novaCategoria) || BLANK;
    const anterior = str(v.trabalhadorCategoria) || str(v.trabalhadorCargo) || BLANK;
    const subs = lineItems(v.subsidios).filter((s) => str(s.descricao));
    const motivo = str(v.motivo) ? `, ${str(v.motivo).replace(/^(na sequência|em resultado|com base)/i, (m) => m.toLowerCase()).replace(/\.$/, '')}` : '';

    let abertura: string;
    let en: string;
    switch (t) {
      case 'chefia':
        abertura = `Comunicamos a V. Ex.ª que foi ${W.a('nomeado', 'nomeada')} para o cargo de **${nova}**, com efeitos a partir de ${dateLong(v.dataEfeito)}${motivo}. Trata-se de um cargo de chefia e confiança, nos termos ${`do ${cite('remuneracaoChefia')}`}: cessando o seu exercício, V. Ex.ª regressa à remuneração da categoria de ${anterior}.`;
        en = `You are appointed to the position of ${v.novaCategoria || '—'} from ${v.dataEfeito || '—'}. This is a management/trust position; when it ends you return to your grade’s pay.`;
        break;
      case 'substituicao':
        abertura = `Comunicamos a V. Ex.ª que, a partir de ${dateLong(v.dataEfeito)}${v.substituicaoFim ? ` e até ${dateLong(v.substituicaoFim)}` : ''}, exercerá em substituição as funções de **${nova}**${str(v.substituidoNome) ? `, durante o impedimento de ${str(v.substituidoNome)}` : ''}${motivo}, nos termos do ${cite('remuneracaoSubstituicao')}.`;
        en = `From ${v.dataEfeito || '—'} you will act as ${v.novaCategoria || '—'}${v.substituidoNome ? ` in place of ${v.substituidoNome}` : ''}.`;
        break;
      case 'revisao':
        abertura = `Comunicamos a V. Ex.ª que a sua remuneração foi revista, com efeitos a partir de ${dateLong(v.dataEfeito)}${motivo}, mantendo-se a categoria de ${anterior}.`;
        en = `Your pay has been reviewed with effect from ${v.dataEfeito || '—'}; your grade is unchanged.`;
        break;
      default:
        abertura = `Comunicamos a V. Ex.ª que, em reconhecimento do seu desempenho${motivo}, foi ${W.a('promovido', 'promovida')} da categoria de ${anterior} para a categoria de **${nova}**, com efeitos a partir de ${dateLong(v.dataEfeito)}.`;
        en = `In recognition of your performance, you are promoted from ${anterior} to ${v.novaCategoria || '—'} from ${v.dataEfeito || '—'}.`;
    }
    const antes = money(v.trabalhadorSalario);
    const salario =
      t === 'substituicao'
        ? `Durante a substituição, V. Ex.ª aufere a remuneração base mensal de **${moneyExt(v.novoSalario)}**, correspondente às funções exercidas, regressando à remuneração actual${antes != null ? ` de ${formatMoney(antes)}` : ''} quando a substituição terminar.`
        : `Em consequência, a sua remuneração base mensal passa${antes != null ? ` de ${formatMoney(antes)}` : ''} para **${moneyExt(v.novoSalario)}**${
            subs.length
              ? `, acrescida ${subs.length === 1 ? 'de' : 'de:'} ${subs
                  .map((x) => {
                    const d = lowerFirst(str(x.descricao));
                    return `${/^subs[ií]dio\b/i.test(d) ? d : `subsídio de ${d}`} de ${moneyExt(x.valor)} por mês`;
                  })
                  .join('; ')}.`
              : ', mantendo-se os demais subsídios e regalias.'
          }`;

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(v.trabalhadorGenero),
        lines: [str(v.trabalhadorNome) || BLANK, [str(v.trabalhadorCargo), str(v.trabalhadorDepartamento)].filter(Boolean).join(' — ')].filter(Boolean),
      },
      { type: 'subject', text: ASSUNTO[t] },
      { type: 'salutation', text: `${exmo(v.trabalhadorGenero)},` },
      { type: 'paragraph', id: 'abertura', text: abertura, en },
      { type: 'paragraph', id: 'salario', text: salario, en: `Your base salary becomes ${formatMoney(money(v.novoSalario))}.` },
    ];
    const anexo = t !== 'revisao' && v.anexoDescricao;
    blocks.push(
      {
        type: 'paragraph',
        id: 'mantem',
        text: `${anexo ? 'As funções correspondentes constam da descrição de funções em anexo. ' : ''}Mantêm-se inalteradas as demais cláusulas do seu contrato de trabalho. ${t === 'promocao' || t === 'chefia' ? 'Endereçamos a V. Ex.ª votos de sucesso no exercício das novas funções.' : 'Contamos com o seu empenho habitual.'}`,
        en: `${anexo ? 'The duties are set out in the attached job description. ' : ''}All other terms of your employment contract remain unchanged. ${t === 'promocao' || t === 'chefia' ? 'We wish you every success in your new role.' : 'We count on your continued commitment.'}`,
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Direcção')] },
      { type: 'acknowledgement', text: 'Tomei conhecimento e aceito. Data: ___/___/______', signer: W.O },
    );
    return blocks;
  },
});
