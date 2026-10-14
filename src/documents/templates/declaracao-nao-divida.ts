// Declaração de não dívida / quitação geral (fora do trabalho): o credor
// declara que nada lhe é devido por um cliente, inquilino ou devedor.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText } from './_shared';
import { assinaturaCliente, clienteFields, clienteIdent, clienteWarnings, contrair, eu, isEmp, s, semPonto } from './_financas';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'naoDivida', label: l('Declaração de não dívida (nada é devido até uma data)', 'No-debt statement (nothing owed up to a date)') },
  { value: 'quitacao', label: l('Quitação geral (recebeu o pagamento final e encerra a relação)', 'Full and final discharge') },
];

export default defineTemplate({
  id: 'declaracao-nao-divida',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'credor', title: l('Quem declara (credor)', 'Declarant (creditor)'), personRole: 'outro' },
    { id: 'devedor', title: l('A favor de (devedor)', 'In favour of (debtor)'), personRole: 'cliente' },
    { id: 'declaracao', title: l('Declaração', 'Declaration') },
  ],
  fields: [
    localField(),
    dateField('data'),
    ...clienteFields('credor', 'credor', { contactos: false }),
    { name: 'devedorTipo', type: 'radio', section: 'devedor', label: l('É', 'Is'), options: [{ value: 'pessoa', label: l('Pessoa', 'Individual') }, { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') }], default: 'pessoa' },
    { name: 'devedorNome', type: 'text', section: 'devedor', required: true, label: l('Nome ou denominação', 'Name'), personKey: 'nome' },
    { name: 'devedorGenero', type: 'radio', section: 'devedor', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M', personKey: 'genero', showIf: (v) => v.devedorTipo !== 'empresa' },
    { name: 'devedorDoc', type: 'text', section: 'devedor', width: 'half', label: l('BI / NUIT', 'ID / NUIT'), personKey: 'docNumero' },
    { name: 'tipo', type: 'select', section: 'declaracao', required: true, label: l('Tipo', 'Type'), options: TIPO_OPTIONS, default: 'naoDivida' },
    {
      name: 'relacao',
      type: 'text',
      section: 'declaracao',
      required: true,
      label: l('Relação em causa', 'Relationship concerned'),
      placeholder: l('Ex.: o contrato de arrendamento da casa n.º 45 da Rua das Acácias; a conta de cliente n.º 1023', 'E.g. the lease of …; customer account no. …'),
      help: l('Escreva com o artigo: «o contrato…», «a conta de cliente…».', 'Start with the article: «o contrato…», «a conta…».'),
    },
    { name: 'dataReferencia', type: 'date', section: 'declaracao', width: 'half', label: l('Situação regularizada até', 'Settled up to'), help: l('Vazio = até à data da declaração.', 'Empty = up to the date of this statement.') },
    { name: 'valorFinal', type: 'money', section: 'declaracao', width: 'half', label: l('Pagamento final recebido', 'Final payment received'), showIf: (v) => v.tipo === 'quitacao' },
    { name: 'finalidade', type: 'text', section: 'declaracao', label: l('Para que fim (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: apresentação ao banco para concessão de crédito', 'E.g. for a bank loan application') },
    { name: 'devolucao', type: 'text', section: 'declaracao', label: l('Garantias devolvidas ou canceladas (opcional)', 'Security returned or cancelled (optional)'), placeholder: l('Ex.: a caução de 30.000,00 MT; a livrança em branco', 'E.g. the deposit; the blank promissory note') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'credor')];
    if (!s(v.devedorNome)) w.push({ level: 'warning', field: 'devedorNome', message: l('Indique a favor de quem é a declaração.', 'Enter who the statement is for.') });
    if (v.tipo === 'quitacao') {
      w.push({
        level: 'warning',
        message: l(
          `Uma quitação geral impede o credor de exigir depois quaisquer outros valores da mesma relação (${cite('finQuitacao')}). Confirme as contas antes de assinar. Para contratos de trabalho use a declaração de quitação laboral.`,
          'A full discharge bars any later claim from the same relationship. Check the accounts before signing. For employment, use the labour discharge.',
        ),
      });
    }
    return w;
  },

  personName: (v) => s(v.devedorNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'credor';
    const emp = v.devedorTipo === 'empresa';
    const f = !emp && v.devedorGenero === 'F';
    const dev = `${emp ? 'a' : f ? 'a Senhora' : 'o Senhor'} **${s(v.devedorNome) || BLANK}**${s(v.devedorDoc) ? ` (${emp ? 'NUIT' : 'BI / NUIT'} ${s(v.devedorDoc)})` : ''}`;
    const ate = v.dataReferencia ? `até ${dateLong(v.dataReferencia)}` : 'até à presente data';
    const quitacao = v.tipo === 'quitacao';
    const blocks: Block[] = [
      { type: 'title', text: quitacao ? 'Declaração de quitação' : 'Declaração de não dívida' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: quitacao
          ? `${isEmp(v, P) ? 'A' : 'Eu,'} ${clienteIdent(v, P)}, ${eu(v, P, 'declaro', 'declara')} que ${eu(v, P, 'recebi', 'recebeu')} ${dev.replace(/^(a|o) /, (m) => (m === 'a ' ? 'da ' : 'do '))}${money(v.valorFinal) != null ? ` a quantia de **${moneyText(v.valorFinal)}**, em pagamento integral e final` : ' o pagamento integral e final'} de todos os valores devidos no âmbito ${contrair('de', semPonto(v.relacao) || BLANK)}, pelo que ${eu(v, P, 'dou', 'dá')} plena, geral e irrevogável quitação, nada mais tendo a exigir a esse título.`
          : `${isEmp(v, P) ? 'A' : 'Eu,'} ${clienteIdent(v, P)}, ${eu(v, P, 'declaro', 'declara')}, para os devidos efeitos, que ${dev} nada ${eu(v, P, 'me', 'lhe')} deve ${ate}, no âmbito ${contrair('de', semPonto(v.relacao) || BLANK)}, encontrando-se regularizados todos os pagamentos vencidos.`,
        en: quitacao ? 'The declarant received the final payment and gives a full and final discharge.' : 'The declarant states that nothing is owed by the person named up to the date given.',
      },
    ];
    if (s(v.devolucao)) {
      blocks.push({ type: 'paragraph', id: 'devolucao', text: `Em consequência, ${eu(v, P, 'restituo', 'restitui')} ou ${eu(v, P, 'considero', 'considera')} cancelada a seguinte garantia: ${semPonto(v.devolucao)}.`, en: 'The security named is returned or cancelled.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'fim',
      text: `A presente declaração é emitida a pedido ${emp ? 'da interessada' : f ? 'da interessada' : 'do interessado'}${s(v.finalidade) ? `, para ${semPonto(v.finalidade).replace(/^(para|a)\s+/i, '')}` : ''}.`,
      en: 'Issued at the request of the person concerned.',
    });
    blocks.push(
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'center', keepWithNext: true, en: 'Place and date.' },
      { type: 'signatures', columns: [assinaturaCliente(ctx, P, { m: 'O Declarante', f: 'A Declarante', empresa: s(v.credorEmpresaNome) || 'A Declarante' })] },
    );
    return blocks;
  },
});
