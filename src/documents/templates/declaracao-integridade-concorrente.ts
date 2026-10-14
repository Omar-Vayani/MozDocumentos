// Declaração de compromisso de integridade (anticorrupção) do concorrente:
// commitments not to bribe, collude or misuse information in a public tender,
// with the disclosure of commissions paid to agents.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, l, lineItems, money } from './_shared';
import { concorrenteWarnings, DECLARACAO_SECTIONS, declaracaoBaseFields, declaracaoFecho, declaracaoTitulo, declaranteAbertura, semPonto, str, valorTexto } from './_contratacao';

export default defineTemplate({
  id: 'declaracao-integridade-concorrente',
  family: 'declaracao',
  official: 'estado',
  sections: [...DECLARACAO_SECTIONS, { id: 'compromissos', title: l('Compromissos e comissões', 'Commitments and commissions') }],
  fields: [
    ...declaracaoBaseFields(),
    {
      name: 'comissoes',
      type: 'lines',
      section: 'compromissos',
      label: l('Comissões pagas a agentes ou intermediários (se houver)', 'Commissions paid to agents or intermediaries (if any)'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome e endereço do agente', 'Agent’s name and address') },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
        { name: 'finalidade', type: 'text', label: l('Finalidade', 'Purpose') },
      ],
      default: [],
      help: l('Deixe vazio se não houver: a declaração dirá que nenhuma comissão foi paga ou é devida.', 'Leave empty if none: the declaration will state that none was paid or is due.'),
    },
    { name: 'conflitos', type: 'textarea', section: 'compromissos', rows: 2, label: l('Conflitos de interesses a revelar (opcional)', 'Conflicts of interest to disclose (optional)'), placeholder: l('Ex.: o sócio X é primo do técnico Y da entidade contratante, que não integra o júri', 'E.g. partner X is a cousin of officer Y, who is not on the jury') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...concorrenteWarnings(v)];
    if (!str(v.entidadeNome)) w.push({ level: 'warning', field: 'entidadeNome', message: l('Indique a entidade contratante.', 'Enter the contracting body.') });
    w.push({
      level: 'info',
      message: l(
        `Oferecer ou prometer vantagens a servidores públicos é crime (${cite('ctCorrupcao')}). Os servidores com interesse no contrato estão impedidos de intervir (${cite('ctProbidade')}).`,
        'Offering or promising advantages to public servants is a crime. Officials with an interest in the contract may not take part.',
      ),
    });
    return w;
  },

  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const com = lineItems(v.comissoes).filter((r) => str(r.nome) || money(r.valor) != null);
    const conflitos = semPonto(v.conflitos);
    const blocks: Block[] = [
      declaracaoTitulo('Declaração de compromisso de integridade', v),
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${declaranteAbertura(v, 'compromete-se, por si e pelos seus representantes, trabalhadores e subcontratados,')} a observar, no procedimento e na execução do contrato que dele resultar, os seguintes deveres de integridade:`,
        en: 'The bidder undertakes, for itself and its staff, agents and subcontractors, to observe the following integrity duties:',
      },
      {
        type: 'list',
        style: 'alpha',
        items: [
          'não oferecer, prometer, dar, solicitar ou aceitar, directamente ou por interposta pessoa, qualquer pagamento, presente ou vantagem indevida para influenciar o procedimento ou a execução do contrato;',
          'não combinar preços nem repartir lotes com outros concorrentes, nem praticar qualquer acto de conluio;',
          'não apresentar documentos falsos ou declarações inexactas, nem procurar obter informação confidencial sobre as outras propostas ou sobre a avaliação;',
          'revelar à entidade contratante qualquer conflito de interesses e denunciar às autoridades qualquer pedido de vantagem indevida.',
        ],
      },
      {
        type: 'paragraph',
        id: 'comissoes',
        text: com.length
          ? 'Declara que foram pagas ou são devidas, em relação a este procedimento, as seguintes comissões ou remunerações a agentes ou intermediários:'
          : `Declara que não pagou nem se obrigou a pagar, em relação a este procedimento, qualquer comissão ou remuneração a agentes ou intermediários${conflitos ? '.' : ', e que não tem conhecimento de qualquer conflito de interesses entre si e os servidores da entidade contratante que intervêm no procedimento.'}`,
        en: com.length ? 'Commissions paid or due to agents:' : 'No commission has been paid or promised to agents or intermediaries.',
      },
    ];
    if (com.length) {
      blocks.push({
        type: 'table',
        columns: [
          { label: 'Agente / intermediário', width: 2.4 },
          { label: 'Valor', width: 1.2, align: 'right' },
          { label: 'Finalidade', width: 2.2 },
        ],
        rows: com.map((r) => [str(r.nome), money(r.valor) != null ? valorTexto(money(r.valor)).replace(/\*\*/g, '').replace(/ \(.*\)$/, '') : '', str(r.finalidade)]),
      });
    }
    if (conflitos || com.length) {
      blocks.push({
        type: 'paragraph',
        id: 'conflitos',
        text: conflitos ? `Revela o seguinte conflito de interesses potencial: ${conflitos}.` : 'Declara que não tem conhecimento de qualquer conflito de interesses entre si e os servidores da entidade contratante que intervêm no procedimento.',
        en: conflitos ? 'Disclosed conflict of interest.' : 'No known conflict of interest.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'sancoes',
      text: 'Aceita que a violação destes compromissos determine a exclusão da proposta, a anulação da adjudicação ou a rescisão do contrato e a execução das garantias, sem prejuízo da responsabilidade civil e criminal.',
      keepWithNext: true,
      en: 'Breach leads to exclusion, annulment or termination, calling of securities and reporting to the authorities, besides civil and criminal liability.',
    });
    blocks.push(...declaracaoFecho(ctx));
    return blocks;
  },
});
