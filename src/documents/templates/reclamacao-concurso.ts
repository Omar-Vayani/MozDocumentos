// Reclamação em procedimento de contratação pública: the bidder asks the
// contracting body (the authority that issued the act) to revoke it.

import { defineTemplate } from '../model';
import { l } from './_shared';
import { destinatarioBlock, destinatarioFields, vocativo } from './_estado';
import { impugnacaoBlocks, impugnacaoFields, impugnacaoWarnings } from './_contratacao';

export default defineTemplate({
  id: 'reclamacao-concurso',
  family: 'carta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'destinatario', title: l('Destinatário (autoridade que praticou o acto)', 'Addressee (authority that issued the act)') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Reclamante', 'Bidder'), personRole: 'outro' },
    { id: 'acto', title: l('Acto impugnado', 'Act challenged') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'pedido', title: l('Pedido e documentos', 'Request and documents') },
  ],
  fields: impugnacaoFields('reclamacao', destinatarioFields()),
  warnings: (v, ctx) => impugnacaoWarnings(v, ctx, 'reclamacao'),
  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,
  blocks: (ctx) => impugnacaoBlocks(ctx, 'reclamacao', { recipient: destinatarioBlock(ctx.values), vocativo: vocativo(ctx.values) }),
});
