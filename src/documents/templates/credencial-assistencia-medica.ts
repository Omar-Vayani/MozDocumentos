// Credencial (termo de responsabilidade) para assistência médica: the employer
// sends a worker, or a dependant, to a clinic or pharmacy and undertakes to pay
// the care listed, up to a limit and until a date. The clinic attaches it to its
// invoice. The employer never receives the diagnosis.

import { defineTemplate, type Block, type Warning } from '../model';
import { dateLong, employerName, formatMoney, GENERO_OPTIONS, isF, l, localField, money, placeDate, refField } from './_shared';
import { countText } from './_saude';
import { juntar, or, str } from './_saude-educacao';

const SERVICOS = [
  { name: 'svConsulta', pt: 'Consulta médica', en: 'Medical consultation', def: true },
  { name: 'svExames', pt: 'Análises clínicas e exames complementares', en: 'Laboratory and imaging tests', def: true },
  { name: 'svMedicamentos', pt: 'Medicamentos prescritos', en: 'Prescribed medicines', def: true },
  { name: 'svInternamento', pt: 'Internamento', en: 'Admission', def: false },
  { name: 'svCirurgia', pt: 'Cirurgia', en: 'Surgery', def: false },
  { name: 'svEstomatologia', pt: 'Estomatologia (dentista)', en: 'Dentistry', def: false },
  { name: 'svOftalmologia', pt: 'Oftalmologia', en: 'Ophthalmology', def: false },
];

const PARENTESCO = [
  { value: 'conjuge', label: l('Cônjuge', 'Spouse') },
  { value: 'companheiro', label: l('Companheiro(a) em união de facto', 'Partner') },
  { value: 'filho', label: l('Filho(a)', 'Child') },
  { value: 'outro', label: l('Outro dependente', 'Other dependant') },
];
const PARENTESCO_TXT: Record<string, [string, string]> = {
  conjuge: ['cônjuge', 'cônjuge'],
  companheiro: ['companheiro', 'companheira'],
  filho: ['filho', 'filha'],
  outro: ['dependente', 'dependente'],
};

export default defineTemplate({
  id: 'credencial-assistencia-medica',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Credencial', 'Authorisation') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'beneficiario', title: l('Quem vai ser atendido', 'Who will be treated') },
    { id: 'cobertura', title: l('Cuidados cobertos e limites', 'Care covered and limits') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    refField(),
    localField(),
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data de emissão', 'Issue date'), default: (c) => c.today },
    { name: 'unidade', type: 'text', section: 'documento', width: 'half', required: true, label: l('Unidade sanitária ou farmácia', 'Clinic or pharmacy'), placeholder: l('Ex.: Clínica Sorriso Saudável, Lda', 'E.g. the clinic’s name') },
    { name: 'convencao', type: 'text', section: 'documento', label: l('Convenção ou acordo (opcional)', 'Agreement (optional)'), placeholder: l('Ex.: Convenção de assistência médica de 2 de Janeiro de 2026', 'E.g. medical-care agreement of 2 January 2026') },
    { name: 'trabalhadorNome', type: 'text', section: 'trabalhador', required: true, label: l('Nome do trabalhador', 'Employee’s name'), personKey: 'nome' },
    { name: 'trabalhadorGenero', type: 'radio', section: 'trabalhador', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'trabalhadorNumero', type: 'text', section: 'trabalhador', width: 'half', label: l('N.º de trabalhador', 'Employee number') },
    { name: 'trabalhadorDocNumero', type: 'text', section: 'trabalhador', width: 'half', label: l('BI n.º', 'ID number'), personKey: 'docNumero' },
    {
      name: 'beneficiario',
      type: 'radio',
      section: 'beneficiario',
      label: l('Beneficiário', 'Beneficiary'),
      options: [
        { value: 'trabalhador', label: l('O próprio trabalhador', 'The employee') },
        { value: 'dependente', label: l('Um dependente', 'A dependant') },
      ],
      default: 'trabalhador',
    },
    { name: 'dependenteNome', type: 'text', section: 'beneficiario', width: 'half', label: l('Nome do dependente', 'Dependant’s name'), showIf: (v) => v.beneficiario === 'dependente' },
    { name: 'dependenteGenero', type: 'radio', section: 'beneficiario', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.beneficiario === 'dependente' },
    { name: 'dependenteParentesco', type: 'select', section: 'beneficiario', width: 'half', label: l('Parentesco', 'Relationship'), options: PARENTESCO, default: 'filho', showIf: (v) => v.beneficiario === 'dependente' },
    { name: 'dependenteIdade', type: 'number', section: 'beneficiario', width: 'half', min: 0, max: 120, label: l('Idade (anos)', 'Age (years)'), showIf: (v) => v.beneficiario === 'dependente' },
    ...SERVICOS.map((s) => ({ name: s.name, type: 'toggle' as const, section: 'cobertura', label: l(s.pt, s.en), default: s.def })),
    { name: 'outrosServicos', type: 'text', section: 'cobertura', label: l('Outros (opcional)', 'Other (optional)'), placeholder: l('Ex.: fisioterapia (5 sessões)', 'E.g. physiotherapy') },
    { name: 'limite', type: 'money', section: 'cobertura', width: 'half', label: l('Valor máximo (opcional)', 'Maximum amount (optional)') },
    { name: 'validade', type: 'date', section: 'cobertura', width: 'half', required: true, label: l('Válida até', 'Valid until') },
    { name: 'comparticipacao', type: 'number', section: 'cobertura', width: 'half', min: 0, max: 100, label: l('Parte paga pelo trabalhador (%) (opcional)', 'Share paid by the employee (%) (optional)') },
    { name: 'excluidos', type: 'text', section: 'cobertura', label: l('Excluído (opcional)', 'Excluded (optional)'), placeholder: l('Ex.: medicamentos não prescritos, cosméticos, óculos', 'E.g. non-prescribed medicines') },
    { name: 'assinanteNome', type: 'text', section: 'assinatura', width: 'half', label: l('Quem assina', 'Signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinanteCargo', type: 'text', section: 'assinatura', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || 'Director de Recursos Humanos' },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.validade)) w.push({ level: 'warning', field: 'validade', message: l('Indique até quando a credencial é válida.', 'Enter the expiry date.') });
    if (!SERVICOS.some((s) => v[s.name]) && !str(v.outrosServicos)) w.push({ level: 'error', field: 'svConsulta', message: l('Escolha pelo menos um cuidado coberto.', 'Choose at least one covered service.') });
    w.push({
      level: 'info',
      message: l(
        'A unidade sanitária só comunica à empresa os actos prestados e o valor, nunca o diagnóstico. Não peça relatórios clínicos do trabalhador.',
        'The clinic tells the company only the services and the amount, never the diagnosis. Do not ask for the worker’s clinical reports.',
      ),
    });
    return w;
  },

  personName: (v) => (v.beneficiario === 'dependente' ? v.dependenteNome : v.trabalhadorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.trabalhadorGenero);
    const emp = employerName(ctx);
    const trab = `**${or(v.trabalhadorNome)}**${str(v.trabalhadorNumero) ? `, trabalhador n.º ${str(v.trabalhadorNumero)}` : ''}${str(v.trabalhadorDocNumero) ? `, ${f ? 'portadora' : 'portador'} do BI n.º ${str(v.trabalhadorDocNumero)}` : ''}`;
    const idade = Number(v.dependenteIdade);
    const benef =
      v.beneficiario === 'dependente'
        ? `**${or(v.dependenteNome)}**${str(v.dependenteIdade) && Number.isFinite(idade) ? `, de ${idade} ${idade === 1 ? 'ano' : 'anos'} de idade` : ''}, ${(PARENTESCO_TXT[str(v.dependenteParentesco)] ?? PARENTESCO_TXT.outro)[isF(v.dependenteGenero) ? 1 : 0]} ${f ? 'da nossa trabalhadora' : 'do nosso trabalhador'} ${trab}`
        : `${f ? 'a nossa trabalhadora' : 'o nosso trabalhador'} ${trab}`;
    const lim = money(v.limite);
    const pct = Number(v.comparticipacao);
    const servicos = SERVICOS.filter((s) => v[s.name]).map((s) => s.pt.toLowerCase());
    if (str(v.outrosServicos)) servicos.push(str(v.outrosServicos));
    const blocks: Block[] = [
      { type: 'title', text: 'Credencial para Assistência Médica', subtitle: `N.º ${or(v.ref, '______')}` },
      { type: 'recipient', lines: ['Exmos. Senhores', or(v.unidade)] },
      {
        type: 'paragraph',
        id: 'corpo',
        text: `${emp} solicita a V. Ex.as que prestem assistência a ${benef}, responsabilizando-se pelo pagamento das despesas com os cuidados abaixo indicados${lim != null ? `, até ao valor máximo de **${formatMoney(lim)}**` : ''}${str(v.convencao) ? `, nos termos da ${str(v.convencao).replace(/^./, (c) => c.toLowerCase())}` : ''}.`,
        en: `${emp} asks you to treat the beneficiary named and will pay for the care listed${lim != null ? ` up to ${formatMoney(lim)}` : ''}.`,
      },
      { type: 'checklist', columns: 2, items: SERVICOS.map((s) => ({ label: s.pt, checked: Boolean(v[s.name]) })).concat(str(v.outrosServicos) ? [{ label: str(v.outrosServicos), checked: true }] : []) },
    ];
    const cond: string[] = [`A presente credencial é válida até **${dateLong(v.validade)}** e apenas para ${servicos.length ? juntar(servicos) : 'os cuidados assinalados'}.`];
    if (str(v.comparticipacao) && Number.isFinite(pct) && pct > 0) cond.push(`O beneficiário paga directamente ${countText(pct)} por cento do valor de cada acto.`);
    if (str(v.excluidos)) cond.push(`Não estão cobertos: ${str(v.excluidos).replace(/[.;]+$/, '')}.`);
    cond.push('A factura, emitida em nome da empresa, deve acompanhar o original desta credencial assinado pelo beneficiário e discriminar os actos e medicamentos, sem indicação do diagnóstico.');
    blocks.push(
      { type: 'paragraph', id: 'condicoes', text: cond.join(' '), en: 'Validity, coverage, co-payment, exclusions; the invoice comes with this original and lists services without diagnosis.', size: 'small', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: 'Pela Empresa', name: str(v.assinanteNome) || undefined, detail: str(v.assinanteCargo) || undefined, image: 'both' }],
      },
      { type: 'box', label: 'A preencher pela unidade sanitária', text: 'Data do atendimento: ____/____/______      Valor: ______________ MT\nAssinatura do beneficiário: ______________________________', dashed: true },
    );
    return blocks;
  },
});
