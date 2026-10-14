// Contrato de fornecimento de bens ao Estado: the written contract between a contracting body and the
// successful bidder, with the clauses the procurement regulation requires
// (object, price, budget line, time, performance security, payment,
// acceptance, penalties, termination, disputes and the Administrative Court's
// clearance).

import { defineTemplate } from '../model';
import { l } from './_shared';
import { contratoBlocks, contratoComputed, contratoFields, contratoWarnings } from './_contratacao';

export default defineTemplate({
  id: 'contrato-fornecimento-estado',
  family: 'contrato',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Contrato n.º, local e data', 'Contract no., place and date') },
    { id: 'entidade', title: l('Entidade contratante', 'Contracting body') },
    { id: 'contratado', title: l('Contratado', 'Contractor'), personRole: 'outro' },
    { id: 'procedimento', title: l('Procedimento e adjudicação', 'Procedure and award') },
    { id: 'objecto', title: l('Bens, quantidades e preços', 'Goods, quantities and prices') },
    { id: 'prazo', title: l('Prazo, local, recepção e garantia técnica', 'Time, place, acceptance and warranty') },
    { id: 'pagamento', title: l('Pagamento e dotação orçamental', 'Payment and budget line') },
    { id: 'garantias', title: l('Garantia, multas, litígios e visto', 'Security, penalties, disputes and clearance') },
  ],
  fields: contratoFields('bens'),
  computed: (v, ctx) => contratoComputed(v, ctx),
  warnings: (v, ctx) => contratoWarnings(v, ctx, 'bens'),
  personName: (v) => (v.contratadoTipo === 'empresa' ? v.contratadoEmpresaNome : v.contratadoNome),
  documentDate: (v) => v.data,
  blocks: (ctx) => contratoBlocks(ctx, 'bens'),
});
