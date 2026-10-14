// Recurso hierárquico em procedimento de contratação pública: after the
// complaint is rejected, the bidder appeals to the superior of the competent
// authority, paying the deposit set in the tender document.

import { defineTemplate } from '../model';
import { l } from './_shared';
import { destinatarioBlock, destinatarioFields, vocativo } from './_estado';
import { impugnacaoBlocks, impugnacaoFields, impugnacaoWarnings } from './_contratacao';

export default defineTemplate({
  id: 'recurso-hierarquico-concurso',
  family: 'carta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'destinatario', title: l('Destinatário (superior hierárquico)', 'Addressee (superior authority)') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'concorrente', title: l('Recorrente', 'Appellant'), personRole: 'outro' },
    { id: 'acto', title: l('Acto impugnado', 'Act challenged') },
    { id: 'fundamentos', title: l('Fundamentos', 'Grounds') },
    { id: 'pedido', title: l('Pedido e documentos', 'Request and documents') },
  ],
  fields: impugnacaoFields('recurso', destinatarioFields()),
  warnings: (v, ctx) => impugnacaoWarnings(v, ctx, 'recurso'),
  personName: (v) => v.entidadeNome,
  documentDate: (v) => v.data,
  blocks: (ctx) => impugnacaoBlocks(ctx, 'recurso', { recipient: destinatarioBlock(ctx.values), vocativo: vocativo(ctx.values) }),
});
