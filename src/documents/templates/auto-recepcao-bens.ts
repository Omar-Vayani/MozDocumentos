// Auto de recepção de bens: the acceptance committee's record of goods
// delivered under a public contract or purchase order — quantities ordered,
// delivered and accepted, non-conformities and the time to correct them.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, l, lineItems, localField } from './_shared';
import { dataPorExtenso, hora } from './_estado';
import { diasTexto, entidadeProfileWarning, qtd, semPonto, str } from './_contratacao';

const num = (x: unknown) => (x === '' || x == null || !Number.isFinite(Number(x)) ? null : Number(x));

export default defineTemplate({
  id: 'auto-recepcao-bens',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Auto, local e data', 'Record, place and date') },
    { id: 'fornecimento', title: l('Fornecimento', 'Supply') },
    { id: 'comissao', title: l('Comissão de recepção', 'Acceptance committee') },
    { id: 'bens', title: l('Bens recebidos', 'Goods received') },
    { id: 'resultado', title: l('Resultado', 'Result') },
  ],
  fields: [
    { name: 'autoNumero', type: 'text', section: 'documento', width: 'half', label: l('Auto n.º (opcional)', 'Record no. (optional)') },
    localField(),
    dateField('data', 'documento', l('Data da recepção', 'Date of receipt')),
    { name: 'hora', type: 'text', section: 'documento', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 9:00', 'E.g. 9:00') },
    { name: 'localRecepcao', type: 'text', section: 'documento', label: l('Local da recepção', 'Place of receipt'), placeholder: l('Ex.: Armazém Provincial de Medicamentos, Nampula', 'E.g. Provincial store, Nampula') },
    { name: 'contratoRef', type: 'text', section: 'fornecimento', label: l('Contrato / nota de encomenda n.º', 'Contract / purchase order no.'), placeholder: l('Ex.: Contrato n.º 07/UGEA/DPS-NPL/2026', 'E.g. Contract 07/UGEA/DPS-NPL/2026') },
    { name: 'fornecedor', type: 'text', section: 'fornecimento', required: true, width: 'half', label: l('Fornecedor', 'Supplier') },
    { name: 'fornecedorNuit', type: 'text', section: 'fornecimento', width: 'half', label: l('NUIT do fornecedor', 'Supplier NUIT') },
    { name: 'fornecedorRep', type: 'text', section: 'fornecimento', width: 'half', label: l('Representante do fornecedor presente', 'Supplier’s representative present') },
    { name: 'guia', type: 'text', section: 'fornecimento', width: 'half', label: l('Guia de remessa / factura n.º', 'Delivery note / invoice no.') },
    {
      name: 'comissao',
      type: 'lines',
      section: 'comissao',
      label: l('Membros da comissão', 'Committee members'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo / função', 'Position') },
      ],
      default: [{ nome: '', cargo: 'Presidente' }, { nome: '', cargo: 'Vogal' }, { nome: '', cargo: 'Vogal' }],
    },
    {
      name: 'itens',
      type: 'lines',
      section: 'bens',
      label: l('Bens', 'Goods'),
      addLabel: l('Adicionar linha', 'Add line'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'unidade', type: 'text', label: l('Unidade', 'Unit') },
        { name: 'contratada', type: 'number', label: l('Qtd. contratada', 'Qty ordered') },
        { name: 'entregue', type: 'number', label: l('Qtd. entregue', 'Qty delivered') },
        { name: 'aceite', type: 'number', label: l('Qtd. aceite', 'Qty accepted') },
        { name: 'observacao', type: 'text', label: l('Observações', 'Notes') },
      ],
      default: [],
    },
    {
      name: 'resultado',
      type: 'radio',
      section: 'resultado',
      label: l('Resultado', 'Result'),
      options: [
        { value: 'aceite', label: l('Bens aceites na totalidade', 'Goods fully accepted') },
        { value: 'reservas', label: l('Aceites com reservas / parcialmente', 'Accepted with reservations / partly') },
        { value: 'rejeitado', label: l('Bens rejeitados', 'Goods rejected') },
      ],
      default: 'aceite',
    },
    { name: 'reservas', type: 'textarea', section: 'resultado', rows: 3, label: l('Desconformidades verificadas', 'Non-conformities found'), showIf: (v) => v.resultado !== 'aceite' },
    { name: 'prazoCorrecao', type: 'number', section: 'resultado', width: 'half', min: 1, max: 90, label: l('Prazo para substituir / completar (dias)', 'Days to replace / complete'), showIf: (v) => v.resultado !== 'aceite' },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    const its = lineItems(v.itens);
    if (!its.some((r) => str(r.descricao))) w.push({ level: 'warning', field: 'itens', message: l('Registe os bens recebidos.', 'Record the goods received.') });
    if (its.some((r) => num(r.aceite) != null && num(r.entregue) != null && num(r.aceite)! < num(r.entregue)!) && v.resultado === 'aceite') {
      w.push({ level: 'warning', field: 'resultado', message: l('Há quantidades aceites inferiores às entregues: escolha «aceites com reservas» e descreva as desconformidades.', 'Some accepted quantities are below delivered: choose “with reservations” and describe the issues.') });
    }
    w.push({ level: 'info', message: l(`O auto de recepção acompanha a factura para pagamento (${cite('ctRecepcaoBens')}). Guarde uma cópia no processo do contrato e entregue outra ao fornecedor.`, 'The acceptance record goes with the invoice for payment. Keep a copy in the contract file and give one to the supplier.') });
    return w;
  },

  personName: (v) => v.fornecedor,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const com = lineItems(v.comissao).filter((r) => str(r.nome) || str(r.cargo));
    const its = lineItems(v.itens).filter((r) => str(r.descricao));
    const comTxt = (com.length ? com : [{ nome: '', cargo: '' }]).map((r) => `${str(r.nome) || '____________________'}${str(r.cargo) ? ` (${str(r.cargo)})` : ''}`).join(', ');
    const res = str(v.resultado) || 'aceite';
    const resultado =
      res === 'aceite'
        ? 'Verificada a quantidade, a qualidade e a conformidade dos bens com as especificações contratadas, a comissão considerou-os conformes e **aceita-os na totalidade**.'
        : res === 'reservas'
          ? `A comissão **aceita os bens com reservas**, nas quantidades indicadas no quadro, tendo verificado as seguintes desconformidades: ${semPonto(v.reservas) || '____________________'}. O fornecedor obriga-se a substituir ou completar os bens em falta ou desconformes no prazo de ${diasTexto(v.prazoCorrecao)}.`
          : `A comissão **rejeita os bens** entregues, pelas seguintes razões: ${semPonto(v.reservas) || '____________________'}. O fornecedor obriga-se a substituí-los no prazo de ${diasTexto(v.prazoCorrecao)}, ficando sujeito às multas contratuais.`;
    const blocks: Block[] = [
      { type: 'title', text: `Auto de recepção de bens${str(v.autoNumero) ? ` n.º ${semPonto(v.autoNumero)}` : ''}`, subtitle: str(v.contratoRef) ? semPonto(v.contratoRef) : undefined },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.hora, 'pelas')}, ${str(v.localRecepcao) ? `em ${semPonto(v.localRecepcao).replace(/^(em|no|na)\s+/i, '')}` : 'nas instalações da entidade contratante'}, a comissão de recepção, composta por ${comTxt}, procedeu à recepção dos bens fornecidos por **${str(v.fornecedor) || '____________________'}**${str(v.fornecedorNuit) ? `, NUIT ${str(v.fornecedorNuit)}` : ''}${str(v.contratoRef) ? `, ao abrigo do ${semPonto(v.contratoRef).replace(/^(o|ao abrigo do)\s+/i, '')}` : ''}${str(v.guia) ? `, acompanhados da ${semPonto(v.guia).replace(/^(a|da)\s+/i, '')}` : ''}${str(v.fornecedorRep) ? `, na presença de ${str(v.fornecedorRep)}, em representação do fornecedor` : ''}.`,
        en: 'The acceptance committee received the goods supplied under the contract, in the supplier’s presence.',
      },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.4, align: 'right' },
          { label: 'Descrição', width: 2.6 },
          { label: 'Un.', width: 0.6, align: 'center' },
          { label: 'Contratada', width: 0.9, align: 'right' },
          { label: 'Entregue', width: 0.9, align: 'right' },
          { label: 'Aceite', width: 0.8, align: 'right' },
          { label: 'Observações', width: 1.6 },
        ],
        rows: (its.length ? its : [{}, {}, {}]).map((r, i) => [String(i + 1), str(r.descricao), str(r.unidade), qtd(num(r.contratada)), qtd(num(r.entregue)), qtd(num(r.aceite)), str(r.observacao)]),
        grid: !its.length,
      },
      { type: 'paragraph', id: 'resultado', text: resultado, en: 'Result of the inspection.' },
      {
        type: 'paragraph',
        id: 'encerramento',
        text: 'E, para constar, se lavrou o presente auto, em duplicado, que, depois de lido e achado conforme, vai ser assinado pelos membros da comissão e pelo representante do fornecedor.',
        keepWithNext: true,
        en: 'This record was drawn up in two copies and signed by the committee and the supplier’s representative.',
      },
    ];
    const cols: SignatureColumn[] = (com.length ? com : [{ nome: '', cargo: '' }]).map((r) => ({ role: str(r.cargo) ? str(r.cargo).charAt(0).toUpperCase() + str(r.cargo).slice(1) : 'Membro da comissão', name: str(r.nome) || undefined }));
    cols.push({ role: 'Pelo fornecedor', name: str(v.fornecedorRep) || undefined, detail: str(v.fornecedor) || undefined });
    for (let i = 0; i < cols.length; i += 3) blocks.push({ type: 'signatures', columns: cols.slice(i, i + 3), keepWithNext: i + 3 < cols.length });
    return blocks;
  },
});
