// Contrato de cessão da posição contratual: one party (cedente) transfers its
// whole position in a contract (lease, supply, services, promise to buy…) to a
// third party (cessionário), with the consent of the other party (cedido).

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, numerar, papel, partesBlocks, partyName, partyWarnings, testemunhasField, valorTexto,
} from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

export default defineTemplate({
  id: 'cessao-posicao-contratual',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'cedente', title: l('Cedente (quem sai do contrato)', 'Assignor (leaving the contract)'), personRole: 'outro' },
    { id: 'cessionario', title: l('Cessionário (quem entra)', 'Assignee (joining)'), personRole: 'outro' },
    { id: 'cedido', title: l('Contraente cedido (a outra parte do contrato)', 'Other party to the contract'), personRole: 'outro' },
    { id: 'contrato', title: l('Contrato cedido', 'Contract assigned') },
    { id: 'condicoes', title: l('Condições da cessão', 'Terms of the assignment') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('cedente', ['pessoa', 'empresa']),
    ...partyFieldsWhen('cessionario', []),
    ...partyFieldsWhen('cedido', []),
    { name: 'contratoTitulo', type: 'text', section: 'contrato', required: true, label: l('Contrato', 'Contract'), placeholder: l('Ex.: contrato de arrendamento comercial', 'E.g. commercial lease'), default: 'contrato de arrendamento' },
    { name: 'contratoData', type: 'date', section: 'contrato', width: 'half', required: true, label: l('Data do contrato', 'Date of the contract') },
    { name: 'posicao', type: 'text', section: 'contrato', width: 'half', label: l('Posição do cedente no contrato', 'Assignor’s role in the contract'), placeholder: l('Ex.: arrendatário, promitente-comprador, prestador', 'E.g. tenant, buyer, provider'), default: 'arrendatário' },
    { name: 'contratoObjecto', type: 'text', section: 'contrato', label: l('Objecto do contrato', 'Subject of the contract'), placeholder: l('Ex.: loja n.º 3 do prédio sito na Av. 24 de Julho, n.º 1500, Maputo', 'E.g. shop no. 3 at …') },
    { name: 'dataEfeitos', type: 'date', section: 'condicoes', width: 'half', label: l('A cessão produz efeitos em', 'Assignment takes effect on'), default: (c) => c.today },
    { name: 'preco', type: 'money', section: 'condicoes', width: 'half', label: l('Preço pago pelo cessionário (opcional)', 'Price paid by the assignee (optional)') },
    { name: 'exoneracao', type: 'toggle', section: 'condicoes', default: true, label: l('O cedente fica liberto das obrigações futuras', 'The assignor is released from future obligations'), help: l('O cedido aceita deixar de exigir ao cedente o cumprimento a partir da data da cessão.', 'The other party agrees to stop claiming from the assignor from the assignment date.') },
    { name: 'caucaoTransfere', type: 'toggle', section: 'condicoes', label: l('A caução ou garantia prestada passa para o cessionário', 'The deposit or guarantee passes to the assignee') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'cedente', 'cedente', 'assignor'),
      ...partyWarnings(v, 'cessionario', 'cessionário', 'assignee'),
      ...partyWarnings(v, 'cedido', 'contraente cedido', 'other party'),
    ];
    w.push({
      level: 'info',
      message: l(
        `A cessão só é válida com o consentimento do outro contraente, que assina este contrato, e segue a forma do contrato cedido (${cite('famCessaoPosicao')}). Se o contrato cedido exigiu escritura ou reconhecimento notarial, a cessão também o exige. No trespasse de um estabelecimento, use o Contrato de trespasse.`,
        'The assignment needs the other party’s consent (they sign) and the form of the original contract. If that contract needed a deed or notarised signatures, so does the assignment. For the transfer of a business, use the business transfer contract.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'cessionario') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const CE = papel(v, 'cedente', 'Cedente', 'Cedente');
    const CS = papel(v, 'cessionario', 'Cessionário', 'Cessionária');
    const CD = papel(v, 'cedido', 'Contraente Cedido', 'Contraente Cedida');
    const preco = money(v.preco);
    const posicao = semPonto(v.posicao) || 'contraente';
    const contrato = `${semPonto(v.contratoTitulo) || 'contrato'} celebrado em ${dateLong(v.contratoData)} entre ${CE.o} e ${CD.o}${str(v.contratoObjecto) ? `, relativo a ${semPonto(v.contratoObjecto).replace(/^(o|a)\s+/i, '')}` : ''}`;
    const efeitos = dateLong(v.dataEfeitos || v.data);

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${CE.O} cede ${CS.ao}, que aceita, a sua posição de ${posicao} no ${contrato}, com todos os direitos e obrigações dela emergentes, a partir de ${efeitos}.`,
        en: `The assignor transfers to the assignee its whole position as ${posicao} in the contract identified, from ${v.dataEfeitos || v.data || '—'}.`,
      },
      {
        id: 'consentimento',
        heading: 'Consentimento',
        text: `${CD.O} consente na presente cessão e reconhece ${CS.o} como ${posicao} a partir da data referida na cláusula anterior.`,
        en: 'The other party consents and recognises the assignee in the assignor’s place.',
      },
      {
        id: 'obrigacoes',
        heading: 'Obrigações anteriores e posteriores',
        text: numerar([
          `As obrigações vencidas até à data da produção de efeitos da cessão são da responsabilidade ${CE.de}, que declara tê-las cumprido integralmente, e as que se vencerem a partir dessa data são da responsabilidade ${CS.de}.`,
          v.exoneracao
            ? `${CD.O} libera ${CE.o} do cumprimento das obrigações que se vençam a partir da produção de efeitos da cessão.`
            : `${CE.O} continua a garantir perante ${CD.o} o cumprimento das obrigações ${CS.de}.`,
          `${CE.O} garante ${CS.ao} a existência e a validade da posição contratual cedida e entrega-lhe, nesta data, cópia do contrato e dos documentos com ele relacionados.`,
        ]),
        en: `Obligations due before the effective date are the assignor’s, later ones the assignee’s.${v.exoneracao ? ' The other party releases the assignor.' : ' The assignor remains guarantor.'} The assignor warrants that the position exists and hands over the documents.`,
      },
    ];
    if (v.caucaoTransfere) {
      clauses.push({ id: 'caucao', heading: 'Caução e garantias', text: `A caução ou garantia prestada ${CE.pelo} no âmbito do contrato cedido passa a valer a favor ${CS.de}, acertando o cedente e o cessionário entre si o respectivo valor.`, en: 'Any deposit or guarantee now stands for the assignee; assignor and assignee settle its value between them.' });
    }
    if (preco != null) {
      clauses.push({ id: 'preco', heading: 'Preço', text: `Pela cessão, ${CS.o} paga ${CE.ao} a quantia de ${valorTexto(preco)}, de que ${CE.o} dá quitação com a assinatura do presente contrato.`, en: `The assignee pays ${formatMoney(preco)} for the assignment, receipt acknowledged.` });
    }
    clauses.push(...clausulasFinais(v));

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de cessão da posição contratual' },
      ...partesBlocks(v, [
        { p: 'cedente', role: CE, en: 'Assignor' },
        { p: 'cessionario', role: CS, en: 'Assignee' },
        { p: 'cedido', role: CD, en: 'Other party' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de cessão da posição contratual, que se rege pelas cláusulas seguintes:', en: 'this assignment of contract is entered into on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, [assinatura(ctx, 'cedente', CE, true), assinatura(ctx, 'cessionario', CS), assinatura(ctx, 'cedido', CD)], { exemplares: 3 })),
    ];
    return blocks;
  },
});
