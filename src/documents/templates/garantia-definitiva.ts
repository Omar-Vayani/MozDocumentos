// Garantia bancária definitiva (minuta): the text the bidder asks the bank to issue,
// on the bank's letterhead, in favour of the contracting body.

import { defineTemplate } from '../model';
import { l } from './_shared';
import { garantiaBlocks, garantiaFields, garantiaWarnings } from './_contratacao';

export default defineTemplate({
  id: 'garantia-definitiva',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Emissão', 'Issue') },
    { id: 'banco', title: l('Banco garante', 'Guarantor bank') },
    { id: 'concorrente', title: l('Ordenante (concorrente / contratado)', 'Applicant (bidder / contractor)'), personRole: 'outro' },
    { id: 'beneficiario', title: l('Beneficiário e procedimento', 'Beneficiary and procedure') },
    { id: 'garantia', title: l('Valor e validade', 'Amount and validity') },
  ],
  fields: garantiaFields('definitiva'),
  warnings: (v, ctx) => garantiaWarnings(v, 'definitiva', ctx),
  personName: (v) => v.beneficiario,
  documentDate: (v) => v.data,
  blocks: (ctx) => garantiaBlocks(ctx, 'definitiva'),
});
