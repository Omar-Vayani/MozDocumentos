// Ficha de entrega de equipamento de protecção individual (EPI): the record of
// protective equipment handed to an employee, free of charge, with the
// employee's undertaking to use and look after it. Blank rows record later
// replacements.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerSignature, isF, l, lineItems, localField, refField, workerFields, workerSignature } from './_shared';
import { refCite, str } from './_rh-politicas';

const MOTIVO: Record<string, string> = { primeira: '1.ª entrega', substituicao: 'Substituição', perda: 'Perda / dano' };
const fmt = (iso: unknown) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : '');

export default defineTemplate({
  id: 'termo-entrega-epi',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'equipamentos', title: l('Equipamentos entregues', 'Equipment handed over') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da primeira entrega', 'Date of first handover')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'docNumero']),
    { name: 'localTrabalho', type: 'text', section: 'trabalhador', width: 'half', label: l('Local / obra', 'Workplace / site'), placeholder: l('Ex.: Estaleiro da Matola', 'E.g. Matola site') },
    {
      name: 'itens',
      type: 'lines',
      section: 'equipamentos',
      label: l('Equipamentos', 'Equipment'),
      addLabel: l('Adicionar equipamento', 'Add item'),
      columns: [
        { name: 'equipamento', type: 'text', label: l('Equipamento', 'Item'), placeholder: l('Ex.: Capacete de protecção', 'E.g. Safety helmet') },
        { name: 'referencia', type: 'text', label: l('Tamanho / referência', 'Size / reference') },
        { name: 'quantidade', type: 'number', label: l('Qtd.', 'Qty') },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'motivo', type: 'select', label: l('Motivo', 'Reason'), options: [
          { value: 'primeira', label: l('1.ª entrega', 'First issue') },
          { value: 'substituicao', label: l('Substituição', 'Replacement') },
          { value: 'perda', label: l('Perda / dano', 'Loss / damage') },
        ], default: 'primeira' },
      ],
      default: [
        { equipamento: 'Capacete de protecção', referencia: '', quantidade: 1, data: '', motivo: 'primeira' },
        { equipamento: 'Botas de segurança', referencia: '', quantidade: 1, data: '', motivo: 'primeira' },
        { equipamento: 'Colete reflector', referencia: '', quantidade: 1, data: '', motivo: 'primeira' },
        { equipamento: 'Luvas de protecção', referencia: '', quantidade: 2, data: '', motivo: 'primeira' },
      ],
    },
    { name: 'linhasBranco', type: 'number', section: 'equipamentos', width: 'half', min: 0, max: 15, default: 6, label: l('Linhas em branco para próximas entregas', 'Blank rows for later handovers') },
    { name: 'formacao', type: 'toggle', section: 'equipamentos', default: true, label: l('O trabalhador recebeu instrução sobre o uso', 'The employee was trained in its use') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!lineItems(v.itens).some((r) => str(r.equipamento))) w.push({ level: 'warning', field: 'itens', message: l('Indique os equipamentos entregues.', 'List the equipment handed over.') });
    w.push({ level: 'info', message: l(`Os equipamentos de protecção são fornecidos gratuitamente pelo empregador (${cite('rhpHigieneSeguranca')}). Não desconte o seu valor no salário, salvo perda culposa autorizada por escrito pelo trabalhador.`, 'Protective equipment is free. Do not deduct its cost from pay, except for culpable loss authorised in writing by the employee.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const itens = lineItems(v.itens).filter((r) => str(r.equipamento));
    const branco = Math.max(0, Math.min(15, Number(v.linhasBranco ?? 6) || 0));
    const rows = [
      ...itens.map((r) => [str(r.equipamento), str(r.referencia) || '—', r.quantidade != null && r.quantidade !== '' ? String(r.quantidade) : '1', fmt(r.data) || fmt(v.data) || '___/___/____', MOTIVO[r.motivo as string] ?? MOTIVO.primeira, '']),
      ...Array.from({ length: branco }, () => ['', '', '', '___/___/______', '', '']),
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de Entrega de Equipamento de Protecção Individual', subtitle: str(v.ref) ? `N.º ${str(v.ref)}` : undefined },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Trabalhador', value: str(v.trabalhadorNome) || BLANK },
          { label: 'BI n.º', value: str(v.trabalhadorDocNumero) || BLANK },
          { label: 'Função', value: str(v.trabalhadorCargo) || BLANK },
          { label: 'Departamento', value: str(v.trabalhadorDepartamento) || BLANK },
          { label: 'Local / obra', value: str(v.localTrabalho) || BLANK },
          { label: 'Data', value: dateLong(v.data) },
        ],
      },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'Equipamento', width: 0.3 },
          { label: 'Tamanho / ref.', width: 0.14 },
          { label: 'Qtd.', width: 0.06, align: 'center' },
          { label: 'Data', width: 0.13, align: 'center' },
          { label: 'Motivo', width: 0.15 },
          { label: 'Assinatura do trabalhador', width: 0.22 },
        ],
        rows,
      },
      {
        type: 'paragraph',
        id: 'declaracao',
        size: 'small',
        text: `Declaro que recebi gratuitamente os equipamentos de protecção individual acima indicados, em bom estado${v.formacao !== false ? `, e que fui ${isF(v.trabalhadorGenero) ? 'instruída' : 'instruído'} sobre o seu uso correcto e os riscos de que me protegem` : ''}. Comprometo-me a usá-los sempre que a tarefa o exija, a conservá-los, a não os ceder a terceiros e a comunicar de imediato qualquer dano, perda ou desgaste, devolvendo os equipamentos substituídos. Tomei conhecimento de que o não uso dos equipamentos de protecção constitui infracção disciplinar ${refCite('rhpHigieneSeguranca')}.`,
        en: 'I received the protective equipment above free of charge and in good condition, was trained in its use, and undertake to wear it whenever required, look after it, not lend it and report any damage or loss, returning replaced items. Not wearing it is a disciplinary offence.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [workerSignature(v), employerSignature(ctx, 'Pela Entidade Empregadora')] },
    ];
    return blocks;
  },
});
