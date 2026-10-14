// Contrato de prestação de serviços ao Estado: the written contract between a contracting body and the
// successful bidder, with the clauses the procurement regulation requires
// (object, price, budget line, time, performance security, payment,
// acceptance, penalties, termination, disputes and the Administrative Court's
// clearance).

import { defineTemplate } from '../model';
import { l } from './_shared';
import { contratoBlocks, contratoComputed, contratoFields, contratoWarnings } from './_contratacao';

export default defineTemplate({
  id: 'contrato-servicos-estado',
  family: 'contrato',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Contrato n.º, local e data', 'Contract no., place and date') },
    { id: 'entidade', title: l('Entidade contratante', 'Contracting body') },
    { id: 'contratado', title: l('Contratado', 'Contractor'), personRole: 'outro' },
    { id: 'procedimento', title: l('Procedimento e adjudicação', 'Procedure and award') },
    { id: 'objecto', title: l('Serviços e preço', 'Services and price') },
    { id: 'prazo', title: l('Prazo, local e acompanhamento', 'Time, place and supervision') },
    { id: 'pagamento', title: l('Pagamento e dotação orçamental', 'Payment and budget line') },
    { id: 'garantias', title: l('Garantia, multas, litígios e visto', 'Security, penalties, disputes and clearance') },
  ],
  fields: contratoFields('servicos'),
  computed: (v, ctx) => contratoComputed(v, ctx),
  warnings: (v, ctx) => contratoWarnings(v, ctx, 'servicos'),
  personName: (v) => (v.contratadoTipo === 'empresa' ? v.contratadoEmpresaNome : v.contratadoNome),
  documentDate: (v) => v.data,
  blocks: (ctx) => contratoBlocks(ctx, 'servicos'),
});
