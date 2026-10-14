// Requisição de medicamentos: a pharmacy or clinic orders medicines and
// medical supplies from a licensed supplier, or a ward requests them from the
// facility's pharmacy. Generic names, pharmaceutical form, strength, pack and
// quantity; minimum remaining shelf life; signed by the technical director.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, refField } from './_shared';
import { mentionsHiv } from './_saude';
import { cell, or, rows, semPonto, str } from './_saude-educacao';

const CONTROLADOS = /\b(morfina|petidina|fentanil|metadona|code[íi]na|tramadol|diazepam|lorazepam|alprazolam|clonazepam|midazolam|fenobarbital|cetamina|ketamina|metilfenidato)\b/i;

export default defineTemplate({
  id: 'requisicao-de-medicamentos',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Requisição', 'Requisition') },
    { id: 'fornecedor', title: l('Fornecedor ou farmácia', 'Supplier or pharmacy') },
    { id: 'itens', title: l('Medicamentos e material', 'Medicines and supplies') },
    { id: 'entrega', title: l('Entrega e condições', 'Delivery and terms') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('Tipo', 'Kind'),
      options: [
        { value: 'externa', label: l('Encomenda a fornecedor', 'Order to a supplier') },
        { value: 'interna', label: l('Requisição interna (serviço → farmácia)', 'Internal requisition (ward → pharmacy)') },
      ],
      default: 'externa',
    },
    refField(),
    localField(),
    dateField(),
    { name: 'urgente', type: 'toggle', section: 'documento', label: l('Urgente', 'Urgent') },
    { name: 'fornecedorNome', type: 'text', section: 'fornecedor', required: true, label: l('Fornecedor / farmácia', 'Supplier / pharmacy'), placeholder: l('Ex.: Distribuidora Farmacêutica X, Lda', 'E.g. the distributor’s name') },
    { name: 'fornecedorNuit', type: 'text', section: 'fornecedor', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), showIf: (v) => v.tipo !== 'interna' },
    { name: 'fornecedorContacto', type: 'text', section: 'fornecedor', width: 'half', label: l('Contacto (opcional)', 'Contact (optional)'), showIf: (v) => v.tipo !== 'interna' },
    { name: 'servico', type: 'text', section: 'fornecedor', width: 'half', label: l('Serviço requisitante', 'Requesting ward'), placeholder: l('Ex.: Enfermaria de Medicina', 'E.g. Medical ward'), showIf: (v) => v.tipo === 'interna' },
    { name: 'cotacao', type: 'text', section: 'fornecedor', width: 'half', label: l('Cotação ou proforma n.º (opcional)', 'Quote / proforma no. (optional)'), showIf: (v) => v.tipo !== 'interna' },
    {
      name: 'itens',
      type: 'lines',
      section: 'itens',
      label: l('Itens', 'Items'),
      addLabel: l('Adicionar item', 'Add item'),
      columns: [
        { name: 'dci', type: 'text', label: l('Medicamento (DCI) / material', 'Medicine (INN) / item') },
        { name: 'forma', type: 'text', label: l('Forma e dosagem', 'Form and strength') },
        { name: 'apresentacao', type: 'text', label: l('Apresentação', 'Pack') },
        { name: 'quantidade', type: 'text', label: l('Quantidade', 'Quantity') },
        { name: 'obs', type: 'text', label: l('Observações', 'Remarks') },
      ],
      default: [],
    },
    { name: 'validadeMinima', type: 'number', section: 'entrega', width: 'half', min: 0, max: 60, default: 12, label: l('Validade mínima restante (meses)', 'Minimum remaining shelf life (months)'), showIf: (v) => v.tipo !== 'interna' },
    { name: 'localEntrega', type: 'text', section: 'entrega', label: l('Local de entrega', 'Delivery address'), default: (c) => [c.profile?.morada?.rua, c.profile?.morada?.numero, c.profile?.morada?.cidade].filter(Boolean).join(', ') },
    { name: 'prazoEntrega', type: 'date', section: 'entrega', width: 'half', label: l('Entregar até', 'Deliver by') },
    { name: 'pagamento', type: 'text', section: 'entrega', width: 'half', label: l('Condições de pagamento (opcional)', 'Payment terms (optional)'), placeholder: l('Ex.: a trinta dias da factura', 'E.g. thirty days after invoice'), showIf: (v) => v.tipo !== 'interna' },
    { name: 'requisitanteNome', type: 'text', section: 'assinaturas', width: 'half', label: l('Requisitado por (nome)', 'Requested by (name)'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'requisitanteCargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position'), default: 'Director(a) Técnico(a)' },
    { name: 'autorizaNome', type: 'text', section: 'assinaturas', width: 'half', label: l('Autorizado por (opcional)', 'Approved by (optional)') },
    { name: 'autorizaCargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo de quem autoriza', 'Approver’s position'), default: 'Director(a) Clínico(a)' },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    const itens = rows(v.itens).filter((r) => str(r.dci));
    if (!itens.length) w.push({ level: 'error', field: 'itens', message: l('Indique os medicamentos ou o material.', 'List the medicines or supplies.') });
    if (itens.some((r) => CONTROLADOS.test(str(r.dci)))) {
      w.push({
        level: 'warning',
        field: 'itens',
        message: l(`Há estupefacientes ou psicotrópicos na lista: a sua aquisição segue impressos e registos próprios (${cite('estupefacientesPrescricao')}). Retire-os desta requisição.`, 'The list includes narcotics or psychotropics, which follow special forms. Remove them from this requisition.'),
      });
    }
    if (itens.some((r) => !str(r.quantidade))) w.push({ level: 'warning', field: 'itens', message: l('Há itens sem quantidade.', 'Some items have no quantity.') });
    if (v.tipo !== 'interna') w.push({ level: 'info', message: l(`Compre apenas medicamentos registados na ANARME a fornecedores licenciados (${cite('seAquisicaoMedicamentos')}).`, 'Buy only ANARME-registered medicines from licensed suppliers.') });
    if (mentionsHiv(...rows(v.itens).map((r) => r.obs))) w.push({ level: 'info', field: 'itens', message: l('Não identifique doentes nas observações.', 'Do not identify patients in the remarks.') });
    return w;
  },

  personName: (v) => (v.tipo === 'interna' ? v.servico : v.fornecedorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const interna = v.tipo === 'interna';
    const itens = rows(v.itens).filter((r) => str(r.dci) || str(r.quantidade));
    const blocks: Block[] = [];
    if (v.urgente) blocks.push({ type: 'tags', items: ['URGENTE'] });
    blocks.push(
      { type: 'title', text: interna ? 'Requisição Interna de Medicamentos' : 'Requisição de Medicamentos', subtitle: `N.º ${or(v.ref, '______')} — ${dateLong(v.data)}` },
      {
        type: 'keyValue',
        columns: interna ? 2 : 1,
        items: interna
          ? [
              { label: 'Serviço requisitante', value: or(v.servico) },
              { label: 'Farmácia', value: or(v.fornecedorNome) },
            ]
          : [
              { label: 'Fornecedor', value: or(v.fornecedorNome) },
              { label: 'NUIT', value: str(v.fornecedorNuit) || '______' },
              ...(str(v.fornecedorContacto) ? [{ label: 'Contacto', value: str(v.fornecedorContacto) }] : []),
              ...(str(v.cotacao) ? [{ label: 'Cotação / proforma', value: str(v.cotacao) }] : []),
            ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: interna ? 'Requisita-se à farmácia o fornecimento dos seguintes medicamentos e material:' : 'Solicitamos o fornecimento dos seguintes medicamentos e material, nas quantidades indicadas:',
        en: interna ? 'The ward requests the following medicines and supplies from the pharmacy:' : 'Please supply the following medicines and supplies in the quantities stated:',
        keepWithNext: true,
      },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'N.º', width: 5, align: 'center' },
          { label: 'Medicamento (DCI) / material', width: 31 },
          { label: 'Forma e dosagem', width: 18 },
          { label: 'Apresentação', width: 15 },
          { label: 'Qtd.', width: 9, align: 'center' },
          { label: 'Observações', width: 22 },
        ],
        rows: (itens.length ? itens : [{}, {}, {}, {}, {}]).map((r, i) => [String(i + 1), cell(r.dci), cell(r.forma), cell(r.apresentacao), cell(r.quantidade), cell(r.obs)]),
      },
    );
    const cond: string[] = [];
    if (!interna) {
      const vm = Number(v.validadeMinima);
      cond.push('Só são aceites medicamentos registados na ANARME, em embalagem de origem, acompanhados de guia de remessa com o número de lote e o prazo de validade de cada produto.');
      if (str(v.validadeMinima) && Number.isFinite(vm) && vm > 0) cond.push(`O prazo de validade restante, à data da entrega, não pode ser inferior a ${vm} ${vm === 1 ? 'mês' : 'meses'}.`);
      cond.push('Os medicamentos termolábeis são entregues em cadeia de frio.');
    }
    if (str(v.localEntrega) || str(v.prazoEntrega)) cond.push(`Entrega${str(v.localEntrega) ? ` em ${semPonto(v.localEntrega)}` : ''}${str(v.prazoEntrega) ? ` até ${dateLong(v.prazoEntrega)}` : ''}.`);
    if (!interna && str(v.pagamento)) cond.push(`Pagamento: ${semPonto(v.pagamento)}.`);
    if (cond.length) blocks.push({ type: 'paragraph', id: 'condicoes', text: cond.join(' '), en: 'Registered medicines only, original packs, batch and expiry on the delivery note; minimum shelf life; cold chain; delivery and payment terms.', size: 'small', keepWithNext: true });
    blocks.push(
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'Requisitado por', name: str(v.requisitanteNome) || undefined, detail: str(v.requisitanteCargo) || undefined, image: interna ? undefined : 'stamp' },
          { role: 'Autorizado por', name: str(v.autorizaNome) || undefined, detail: str(v.autorizaCargo) || undefined },
          { role: interna ? 'Fornecido por (farmácia)' : 'Recebido por', detail: 'Data: ____/____/______' },
        ],
      },
    );
    return blocks;
  },
});
