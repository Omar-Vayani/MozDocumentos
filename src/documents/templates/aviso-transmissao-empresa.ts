// Aviso de transmissão da empresa ou estabelecimento: the transferor and the
// acquirer inform the employees of the transfer (date, reasons, consequences)
// and may give them a period to claim what they are owed, after which the
// claim lapses. Contracts, seniority and rights pass to the acquirer.

import { addDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerSignature, l, localField, refField } from './_shared';
import { qty } from './_contrato-trabalho';
import { linhas, nosTermos, ponto, str } from './_rh-politicas';

export default defineTemplate({
  id: 'aviso-transmissao-empresa',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'transmissao', title: l('Transmissão', 'Transfer') },
    { id: 'creditos', title: l('Reclamação de créditos', 'Claims') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de afixação', 'Date posted')),
    { name: 'estabelecimento', type: 'text', section: 'transmissao', required: true, label: l('Empresa ou estabelecimento transmitido', 'Business or establishment transferred'), placeholder: l('Ex.: a fábrica de blocos da Machava', 'E.g. the block factory in Machava') },
    { name: 'modalidade', type: 'select', section: 'transmissao', width: 'half', label: l('Forma', 'Form'), default: 'trespasse', options: [
      { value: 'trespasse', label: l('Venda (trespasse)', 'Sale (business transfer)') },
      { value: 'cessao', label: l('Cessão de exploração / arrendamento', 'Lease of the business') },
      { value: 'fusao', label: l('Fusão ou cisão', 'Merger or demerger') },
      { value: 'outra', label: l('Outra mudança de titular', 'Other change of owner') },
    ] },
    { name: 'dataTransmissao', type: 'date', section: 'transmissao', width: 'half', required: true, label: l('Data da transmissão', 'Transfer date') },
    { name: 'adquirenteNome', type: 'text', section: 'transmissao', required: true, label: l('Adquirente (novo empregador)', 'Acquirer (new employer)') },
    { name: 'adquirenteNuit', type: 'text', section: 'transmissao', width: 'half', label: l('NUIT do adquirente', 'Acquirer’s NUIT') },
    { name: 'adquirenteSede', type: 'text', section: 'transmissao', width: 'half', label: l('Sede do adquirente', 'Acquirer’s registered office') },
    { name: 'adquirenteRepresentante', type: 'text', section: 'transmissao', width: 'half', label: l('Representante do adquirente', 'Acquirer’s representative') },
    { name: 'motivos', type: 'textarea', section: 'transmissao', rows: 2, label: l('Motivos', 'Reasons') },
    { name: 'consequencias', type: 'textarea', section: 'transmissao', rows: 3, label: l('Consequências previstas para os trabalhadores (uma por linha)', 'Expected consequences for employees (one per line)'), placeholder: l('Ex.: mantém-se o local de trabalho e o horário', 'E.g. workplace and hours stay the same') },
    { name: 'reclamarCreditos', type: 'toggle', section: 'creditos', default: true, label: l('Dar prazo para reclamar créditos', 'Set a period to claim amounts owed') },
    { name: 'localReclamacao', type: 'text', section: 'creditos', label: l('Onde apresentar a reclamação', 'Where to submit claims'), placeholder: l('Ex.: Departamento de Recursos Humanos, na sede', 'E.g. HR department, head office'), showIf: (v) => v.reclamarCreditos !== false },
  ],

  computed: (v, { legal }) => {
    const dias = legal.value<{ reclamarCreditosDias: number }>('rhpTransmissaoEmpresa').reclamarCreditosDias;
    return { dias, limite: v.data ? addDays(v.data, dias) : '' };
  },

  warnings: () => {
    const w: Warning[] = [];
    w.push({ level: 'warning', message: l(`Antes da transmissão, transmitente e adquirente informam e consultam o órgão sindical (ou a comissão de trabalhadores) sobre a data, os motivos e as consequências (${cite('rhpTransmissaoEmpresa')}). Use "Pedido de parecer ao órgão sindical".`, 'Before the transfer, both parties must inform and consult the union body.') });
    w.push({ level: 'info', message: l('Afixe o aviso em todos os locais de trabalho e guarde prova da data de afixação: o prazo para reclamar créditos conta a partir dela.', 'Post the notice at every workplace and keep proof of the date.') });
    return w;
  },
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed as { dias: number; limite: string };
    const transmitente = employerName(ctx);
    const motivos = linhas(v.motivos).join('; ');
    const cons = linhas(v.consequencias);
    const FORMA: Record<string, string> = { trespasse: 'por trespasse', cessao: 'por cessão de exploração', fusao: 'por fusão ou cisão', outra: 'por mudança de titular' };
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'title', text: 'Aviso aos Trabalhadores', subtitle: 'Transmissão da empresa ou estabelecimento' },
      {
        type: 'paragraph',
        id: 'aviso',
        text: `${nosTermos('rhpTransmissaoEmpresa').replace(/^n/, 'N')}, **${transmitente}** e **${str(v.adquirenteNome) || BLANK}**${str(v.adquirenteNuit) ? `, NUIT ${str(v.adquirenteNuit)}` : ''}${str(v.adquirenteSede) ? `, com sede em ${str(v.adquirenteSede)}` : ''}, informam os trabalhadores de que ${str(v.estabelecimento) || BLANK} é transmitid${/^(a|as)\s/i.test(str(v.estabelecimento)) ? 'a' : 'o'} ${FORMA[v.modalidade as string] ?? FORMA.outra} para ${str(v.adquirenteNome) || 'o adquirente'}, com efeitos a partir de **${dateLong(v.dataTransmissao)}**${motivos ? `, ${ponto(`em virtude de ${motivos.charAt(0).toLowerCase() + motivos.slice(1)}`).replace(/\.$/, '')}` : ''}.`,
        en: 'The transferor and acquirer inform employees of the transfer of the business on the stated date.',
      },
      {
        type: 'paragraph',
        id: 'efeitos',
        text: `Os contratos de trabalho dos trabalhadores afectos ${str(v.estabelecimento) ? 'ao estabelecimento' : 'à empresa'} transitam para o novo empregador, que assume todos os direitos e obrigações deles emergentes, incluindo a antiguidade de cada trabalhador e as condições previstas nos instrumentos de regulamentação colectiva aplicáveis. O novo titular responde solidariamente pelas obrigações vencidas no último ano de actividade anterior à transmissão.`,
        en: 'Employment contracts, seniority and collective terms pass to the new employer, jointly liable for obligations due in the last year.',
      },
    ];
    if (cons.length) blocks.push({ type: 'paragraph', id: 'consequencias', text: 'Consequências previstas para os trabalhadores:', en: 'Expected consequences:', keepWithNext: true }, { type: 'list', items: cons.map((x) => ponto(x)) });
    if (v.reclamarCreditos !== false) {
      blocks.push({
        type: 'paragraph',
        id: 'creditos',
        text: `Os trabalhadores que tenham créditos a reclamar (salários, subsídios, férias ou outros valores em dívida) devem apresentá-los por escrito${str(v.localReclamacao) ? ` ${/^(no|na|ao|à|junto)\b/i.test(str(v.localReclamacao)) ? '' : 'em '}${str(v.localReclamacao)}` : ''} no prazo de ${qty(c.dias, 'dia', 'dias')} a contar da afixação do presente aviso${c.limite ? `, isto é, até **${dateLong(c.limite)}**` : ''}, sob pena de caducidade do direito de os exigir.`,
        en: `Employees owed money must claim it in writing within ${c.dias} days of this notice, or lose the right.`,
      });
    }
    blocks.push({ type: 'paragraph', id: 'esclarecimentos', text: 'Os Recursos Humanos prestam os esclarecimentos que forem pedidos.', en: 'HR will answer any questions.', keepWithNext: true });
    blocks.push({
      type: 'signatures',
      columns: [employerSignature(ctx, 'O Transmitente'), { role: 'O Adquirente', name: str(v.adquirenteRepresentante) || undefined, detail: str(v.adquirenteNome) || undefined }],
    });
    return blocks;
  },
});
