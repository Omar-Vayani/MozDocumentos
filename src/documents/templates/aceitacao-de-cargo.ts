// Declaração de aceitação de cargo: the person appointed to a company office
// accepts it and confirms there is no incapacity or incompatibility.
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, isF, l, localField } from './_shared';
import { identificacao, pessoaFields, quantos, comReconhecimento, semPonto, sociedadeFields, sociedadeIdent, sociedadeNome, str } from './_sociedades';

const CARGOS: Record<string, [string, string]> = {
  gerente: ['gerente', 'gerente'],
  administrador: ['administrador', 'administradora'],
  administradorDelegado: ['administrador-delegado', 'administradora-delegada'],
  pca: ['presidente do conselho de administração', 'presidente do conselho de administração'],
  conselhoFiscal: ['membro do conselho fiscal', 'membro do conselho fiscal'],
  fiscalUnico: ['fiscal único', 'fiscal única'],
  secretario: ['secretário da sociedade', 'secretária da sociedade'],
  presidenteMesa: ['presidente da mesa da assembleia geral', 'presidente da mesa da assembleia geral'],
};

const cargoDe = (v: Values) => g(v.pessoaGenero, ...(CARGOS[v.cargo] ?? CARGOS.gerente));

export default defineTemplate({
  id: 'aceitacao-de-cargo',
  family: 'declaracao',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'pessoa', title: l('Pessoa nomeada', 'Person appointed'), personRole: 'representante' },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'cargo', title: l('Cargo', 'Office') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField(),
    ...pessoaFields('pessoa', 'pessoa', true),
    ...sociedadeFields('sociedade', { tipo: true, capital: false }),
    {
      name: 'cargo',
      type: 'select',
      section: 'cargo',
      width: 'half',
      label: l('Cargo', 'Office'),
      options: [
        { value: 'gerente', label: l('Gerente', 'Manager') },
        { value: 'administrador', label: l('Administrador', 'Director') },
        { value: 'administradorDelegado', label: l('Administrador-delegado', 'Managing director') },
        { value: 'pca', label: l('Presidente do conselho de administração', 'Chair of the board') },
        { value: 'conselhoFiscal', label: l('Membro do conselho fiscal', 'Audit board member') },
        { value: 'fiscalUnico', label: l('Fiscal único', 'Statutory auditor') },
        { value: 'secretario', label: l('Secretário da sociedade', 'Company secretary') },
        { value: 'presidenteMesa', label: l('Presidente da mesa da assembleia geral', 'Chair of the general meeting') },
      ],
      default: 'gerente',
    },
    {
      name: 'designacao',
      type: 'radio',
      section: 'cargo',
      label: l('Designado(a)', 'Appointed'),
      options: [
        { value: 'deliberacao', label: l('Por deliberação dos sócios', 'By members’ resolution') },
        { value: 'contrato', label: l('No contrato de sociedade', 'In the articles') },
      ],
      default: 'deliberacao',
    },
    { name: 'dataDesignacao', type: 'date', section: 'cargo', width: 'half', label: l('Data da deliberação', 'Date of the resolution'), showIf: (v) => v.designacao !== 'contrato' },
    {
      name: 'mandato',
      type: 'select',
      section: 'cargo',
      width: 'half',
      label: l('Mandato', 'Term'),
      options: [
        { value: 'indeterminado', label: l('Tempo indeterminado', 'Indefinite') },
        { value: 'anos', label: l('Número de anos', 'Number of years') },
        { value: 'omitir', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'indeterminado',
    },
    { name: 'mandatoAnos', type: 'number', section: 'cargo', width: 'half', min: 1, max: 10, label: l('Anos', 'Years'), showIf: (v) => v.mandato === 'anos' },
    { name: 'contactos', type: 'toggle', section: 'opcoes', label: l('Indicar contactos para o exercício do cargo', 'Give contact details for the office') },
    { name: 'email', type: 'email', section: 'opcoes', width: 'half', label: l('Email', 'Email'), showIf: (v) => Boolean(v.contactos) },
    { name: 'telemovel', type: 'tel', section: 'opcoes', width: 'half', label: l('Telemóvel', 'Mobile'), showIf: (v) => Boolean(v.contactos) },
    { name: 'reconhecimento', type: 'toggle', section: 'opcoes', label: l('Espaço para reconhecimento notarial', 'Space for notarial recognition') },
  ],

  personName: (v) => str(v.pessoaNome) || undefined,
  documentDate: (v) => v.data,

  warnings: (_v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Junte esta declaração à deliberação de nomeação. A nomeação de gerentes e administradores está sujeita a registo na Conservatória do Registo das Entidades Legais no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')}.`,
          `Attach this declaration to the appointing resolution. Appointments of managers and directors must be registered within ${ctx.legal.value<number>('registoEntidadesPrazo')} days.`,
        ),
      },
    ];
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.pessoaGenero);
    const cargo = cargoDe(v);
    const designacao = v.designacao === 'contrato' ? 'no contrato de sociedade' : `por deliberação dos sócios${v.dataDesignacao ? ` de ${dateLong(v.dataDesignacao)}` : ''}`;
    const mandato =
      v.mandato === 'anos' ? `, para um mandato de ${quantos(Number(v.mandatoAnos) || null, 'ano', 'anos')}` : v.mandato === 'omitir' ? '' : ', por tempo indeterminado';

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Aceitação de Cargo', subtitle: sociedadeNome(v) },
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: `${identificacao(v, 'pessoa')}, declara, para os devidos efeitos, que aceita o cargo de ${cargo} da sociedade ${sociedadeIdent(v, { capital: false })}, para o qual foi ${f ? 'designada' : 'designado'} ${designacao}${mandato}.`,
        en: `The person named above accepts the office of ${v.cargo || 'manager'} of the company, to which they were appointed as stated.`,
      },
      {
        type: 'paragraph',
        id: 'incompatibilidades',
        text: `Declara ainda que não se encontra ${f ? 'abrangida' : 'abrangido'} por qualquer incapacidade, inibição ou incompatibilidade legal para o exercício do cargo, e que se obriga a exercê-lo com a diligência de um gestor criterioso e ordenado.`,
        en: 'They also declare no legal incapacity, disqualification or incompatibility, and undertake to act with due diligence.',
      },
    ];
    if (v.contactos) {
      blocks.push({
        type: 'paragraph',
        id: 'contactos',
        text: `Para efeitos do exercício do cargo, indica os seguintes contactos: correio electrónico ${str(v.email) || BLANK}; telemóvel ${str(v.telemovel) || BLANK}.`,
        en: 'Contact details for the office.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Por ser verdade, assina a presente declaração.', en: 'In witness whereof, this declaration is signed.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: f ? 'A Declarante' : 'O Declarante', name: str(v.pessoaNome) || undefined, detail: semPonto(cargo).replace(/^./, (c) => c.toLocaleUpperCase('pt')) }],
      },
    );
    if (v.reconhecimento) comReconhecimento(blocks, 'Reconhecimento notarial da assinatura');
    return blocks;
  },
});
