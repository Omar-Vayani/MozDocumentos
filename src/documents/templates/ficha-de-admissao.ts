import { formatDateShort, formatMoney } from '@/lib/format';
import { defineTemplate, type Block, type FieldDef, type Warning } from '../model';
import {
  dateField, dateLong, DOC_TIPO_OPTIONS, employerSignature, ESTADO_CIVIL_OPTIONS, g, GENERO_OPTIONS, l, lineItems, localField,
  money, placeDate, refField, workerFields, workerSignature,
} from './_shared';

/** Short line to fill in by hand when a value is missing (the form is often printed blank). */
const FILL = '________________';
const val = (x: unknown) => {
  const s = String(x ?? '').trim();
  return s || FILL;
};
const dateVal = (x: unknown) => (typeof x === 'string' && x ? dateLong(x) : FILL);
const optLabel = (opts: { value: string; label: { pt: string } }[], x: unknown) => opts.find((o) => o.value === x)?.label.pt ?? '';

const TIPO_CONTRATO = [
  { value: 'indeterminado', label: l('Por tempo indeterminado', 'Permanent') },
  { value: 'prazo-certo', label: l('A prazo certo', 'Fixed term') },
  { value: 'prazo-incerto', label: l('A prazo incerto', 'Uncertain term') },
];

const HABILITACOES = [
  { value: 'Ensino primário', label: l('Ensino primário', 'Primary school') },
  { value: 'Ensino secundário geral (1.º ciclo)', label: l('Ensino secundário geral — 1.º ciclo', 'Lower secondary') },
  { value: 'Ensino secundário geral (2.º ciclo)', label: l('Ensino secundário geral — 2.º ciclo', 'Upper secondary') },
  { value: 'Ensino técnico-profissional', label: l('Ensino técnico-profissional', 'Technical/vocational') },
  { value: 'Bacharelato', label: l('Bacharelato', 'Bachelor (3-year)') },
  { value: 'Licenciatura', label: l('Licenciatura', 'Bachelor’s degree') },
  { value: 'Mestrado', label: l('Mestrado', 'Master’s degree') },
  { value: 'Doutoramento', label: l('Doutoramento', 'Doctorate') },
];

const textField = (name: string, section: string, label: [string, string], extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  type: 'text',
  section,
  width: 'half',
  label: l(label[0], label[1]),
  ...extra,
});

export default defineTemplate({
  id: 'ficha-de-admissao',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Dados pessoais', 'Personal details'), personRole: 'trabalhador' },
    { id: 'contactos', title: l('Contactos e morada', 'Contacts and address') },
    { id: 'bancarios', title: l('Dados bancários', 'Bank details') },
    { id: 'contratuais', title: l('Dados contratuais', 'Employment details') },
    { id: 'habilitacoes', title: l('Habilitações', 'Education') },
    { id: 'emergencia', title: l('Contacto de emergência', 'Emergency contact') },
    { id: 'agregado', title: l('Agregado familiar', 'Household') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de preenchimento', 'Date completed')),
    ...workerFields(['nome', 'genero', 'naturalidade', 'nacionalidade', 'estadoCivil']).map((f) =>
      f.name === 'trabalhadorGenero' ? { ...f, label: l('Género', 'Gender') } : f,
    ),
    { name: 'trabalhadorDataNascimento', type: 'date', section: 'trabalhador', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    textField('trabalhadorFiliacao', 'trabalhador', ['Filiação (pai e mãe)', 'Parents’ names'], { width: 'full' }),
    ...workerFields(['docTipo', 'docNumero', 'docEmissao', 'docLocal']),
    { name: 'trabalhadorDocValidade', type: 'date', section: 'trabalhador', width: 'half', label: l('Válido até', 'Valid until') },
    ...workerFields(['nuit', 'inss']).map((f) =>
      f.name === 'trabalhadorNuit'
        ? { ...f, legal: l('Necessário para a retenção do IRPS.', 'Needed for IRPS withholding.') }
        : { ...f, legal: l('O trabalhador deve ser inscrito na segurança social obrigatória.', 'The employee must be registered with social security.') },
    ),
    ...workerFields(['telefone'], 'contactos'),
    textField('trabalhadorTelefone2', 'contactos', ['Telefone alternativo', 'Alternative phone'], { type: 'tel' }),
    { name: 'trabalhadorEmail', type: 'email', section: 'contactos', width: 'half', personKey: 'email', label: l('Email', 'Email') },
    ...workerFields(['morada'], 'contactos').map((f) => ({ ...f, label: l('Morada (rua, n.º, bairro)', 'Address (street, no., neighbourhood)') })),
    textField('trabalhadorCidade', 'contactos', ['Cidade / distrito', 'City / district']),
    textField('trabalhadorProvincia', 'contactos', ['Província', 'Province']),
    { ...textField('trabalhadorBanco', 'bancarios', ['Banco', 'Bank']), personKey: 'banco' },
    { ...textField('trabalhadorNib', 'bancarios', ['NIB / n.º de conta', 'Bank account (NIB)']), personKey: 'nib' },
    textField('trabalhadorTitularConta', 'bancarios', ['Titular da conta (se diferente)', 'Account holder (if different)']),
    textField('trabalhadorCarteiraMovel', 'bancarios', ['Carteira móvel (M-Pesa, e-Mola…)', 'Mobile wallet'], { type: 'tel' }),
    ...workerFields(['cargo', 'categoria', 'departamento', 'dataAdmissao', 'salario'], 'contratuais'),
    {
      name: 'tipoContrato',
      type: 'select',
      section: 'contratuais',
      width: 'half',
      label: l('Tipo de contrato', 'Contract type'),
      options: TIPO_CONTRATO,
      default: 'indeterminado',
    },
    textField('superiorHierarquico', 'contratuais', ['Superior hierárquico', 'Line manager']),
    textField('localTrabalho', 'contratuais', ['Local de trabalho', 'Workplace']),
    {
      name: 'incluirHabilitacoes',
      type: 'toggle',
      section: 'habilitacoes',
      default: true,
      label: l('Incluir habilitações na ficha', 'Include education on the form'),
    },
    {
      name: 'habilitacoesNivel',
      type: 'select',
      section: 'habilitacoes',
      width: 'half',
      label: l('Nível académico', 'Education level'),
      options: [{ value: '', label: l('Não indicado', 'Not stated') }, ...HABILITACOES],
      default: '',
      showIf: (v) => Boolean(v.incluirHabilitacoes),
    },
    textField('habilitacoesCurso', 'habilitacoes', ['Curso / área de formação', 'Course / field'], { showIf: (v) => Boolean(v.incluirHabilitacoes) }),
    textField('habilitacoesInstituicao', 'habilitacoes', ['Instituição de ensino', 'School / university'], { showIf: (v) => Boolean(v.incluirHabilitacoes) }),
    textField('habilitacoesAno', 'habilitacoes', ['Ano de conclusão', 'Year completed'], { showIf: (v) => Boolean(v.incluirHabilitacoes) }),
    textField('emergenciaNome', 'emergencia', ['Nome', 'Name'], { width: 'full' }),
    textField('emergenciaParentesco', 'emergencia', ['Parentesco', 'Relationship']),
    textField('emergenciaTelefone', 'emergencia', ['Telefone', 'Phone'], { type: 'tel' }),
    {
      name: 'agregado',
      type: 'lines',
      section: 'agregado',
      label: l('Agregado familiar e dependentes', 'Household members and dependants'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      help: l('Se ficar vazio, a ficha imprime linhas em branco para preencher à mão.', 'If empty, the form prints blank lines to fill in by hand.'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'text', label: l('Parentesco', 'Relationship') },
        { name: 'dataNascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'dependente', type: 'select', label: l('Dependente (IRPS)', 'Dependant (IRPS)'), options: [{ value: 'Sim', label: l('Sim', 'Yes') }, { value: 'Não', label: l('Não', 'No') }] },
      ],
      default: [],
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.trabalhadorNuit) {
      w.push({ level: 'warning', field: 'trabalhadorNuit', message: l('Falta o NUIT. É necessário para a retenção do IRPS.', 'The NUIT is missing. It is needed for IRPS withholding.') });
    }
    if (!v.trabalhadorInss) {
      w.push({
        level: 'warning',
        field: 'trabalhadorInss',
        message: l(
          'Falta o número de beneficiário do INSS. Se o trabalhador ainda não estiver inscrito, a empresa deve proceder à inscrição.',
          'The INSS number is missing. If the employee is not yet registered, the company must register them.',
        ),
      });
    }
    if (!v.trabalhadorDocNumero) {
      w.push({ level: 'info', field: 'trabalhadorDocNumero', message: l('Falta o número do documento de identificação.', 'The ID document number is missing.') });
    }
    if (v.trabalhadorDocValidade && v.data && v.trabalhadorDocValidade < v.data) {
      w.push({ level: 'warning', field: 'trabalhadorDocValidade', message: l('O documento de identificação está caducado.', 'The ID document has expired.') });
    }
    if (!v.emergenciaNome || !v.emergenciaTelefone) {
      w.push({ level: 'info', field: 'emergenciaNome', message: l('Falta o contacto de emergência.', 'The emergency contact is missing.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const doc = optLabel(DOC_TIPO_OPTIONS, v.trabalhadorDocTipo).replace(/\s*\(.*\)$/, '') || 'Documento';
    const estadoCivil = optLabel(ESTADO_CIVIL_OPTIONS, v.trabalhadorEstadoCivil).replace(/o\(a\)$/, g(ge, 'o', 'a'));
    const nacionalidade = String(v.trabalhadorNacionalidade ?? '').trim();
    const salario = money(v.trabalhadorSalario);

    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de admissão', subtitle: g(ge, 'Registo de dados do trabalhador', 'Registo de dados da trabalhadora') },
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'keyValue',
        title: 'Dados pessoais',
        columns: 2,
        items: [
          { label: 'Nome completo', value: val(v.trabalhadorNome) },
          { label: 'Género', value: v.trabalhadorGenero ? optLabel(GENERO_OPTIONS, v.trabalhadorGenero) : FILL },
          { label: 'Data de nascimento', value: dateVal(v.trabalhadorDataNascimento) },
          { label: 'Naturalidade', value: val(v.trabalhadorNaturalidade) },
          { label: 'Nacionalidade', value: nacionalidade ? nacionalidade.charAt(0).toUpperCase() + nacionalidade.slice(1) : FILL },
          { label: 'Estado civil', value: estadoCivil || FILL },
          { label: 'Filiação', value: val(v.trabalhadorFiliacao) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Documento de identificação',
        columns: 2,
        items: [
          { label: 'Tipo', value: doc },
          { label: 'Número', value: val(v.trabalhadorDocNumero) },
          { label: 'Data de emissão', value: dateVal(v.trabalhadorDocEmissao) },
          { label: 'Local de emissão', value: val(v.trabalhadorDocLocal) },
          { label: 'Válido até', value: dateVal(v.trabalhadorDocValidade) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Dados fiscais e de segurança social',
        columns: 2,
        items: [
          { label: 'NUIT', value: val(v.trabalhadorNuit) },
          { label: 'N.º de beneficiário do INSS', value: val(v.trabalhadorInss) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Contactos e morada',
        columns: 2,
        items: [
          { label: 'Telefone', value: val(v.trabalhadorTelefone) },
          { label: 'Telefone alternativo', value: val(v.trabalhadorTelefone2) },
          { label: 'Email', value: val(v.trabalhadorEmail) },
          { label: 'Morada', value: val(v.trabalhadorMorada) },
          { label: 'Cidade / distrito', value: val(v.trabalhadorCidade) },
          { label: 'Província', value: val(v.trabalhadorProvincia) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Dados bancários',
        columns: 2,
        items: [
          { label: 'Banco', value: val(v.trabalhadorBanco) },
          { label: 'NIB / n.º de conta', value: val(v.trabalhadorNib) },
          { label: 'Titular da conta', value: String(v.trabalhadorTitularConta ?? '').trim() || (v.trabalhadorNome ? String(v.trabalhadorNome).trim() : FILL) },
          { label: 'Carteira móvel', value: val(v.trabalhadorCarteiraMovel) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Dados contratuais',
        columns: 2,
        items: [
          { label: 'Cargo / função', value: val(v.trabalhadorCargo) },
          { label: 'Categoria profissional', value: val(v.trabalhadorCategoria) },
          { label: 'Departamento', value: val(v.trabalhadorDepartamento) },
          { label: 'Superior hierárquico', value: val(v.superiorHierarquico) },
          { label: 'Data de admissão', value: dateVal(v.trabalhadorDataAdmissao) },
          { label: 'Tipo de contrato', value: optLabel(TIPO_CONTRATO, v.tipoContrato) || FILL },
          { label: 'Salário base mensal', value: salario != null ? formatMoney(salario) : FILL },
          { label: 'Local de trabalho', value: val(v.localTrabalho) },
        ],
      },
    ];

    if (v.incluirHabilitacoes) {
      blocks.push({
        type: 'keyValue',
        title: 'Habilitações',
        columns: 2,
        items: [
          { label: 'Nível académico', value: val(v.habilitacoesNivel) },
          { label: 'Curso / área', value: val(v.habilitacoesCurso) },
          { label: 'Instituição', value: val(v.habilitacoesInstituicao) },
          { label: 'Ano de conclusão', value: val(v.habilitacoesAno) },
        ],
      });
    }

    blocks.push({
      type: 'keyValue',
      title: 'Contacto de emergência',
      columns: 2,
      items: [
        { label: 'Nome', value: val(v.emergenciaNome) },
        { label: 'Parentesco', value: val(v.emergenciaParentesco) },
        { label: 'Telefone', value: val(v.emergenciaTelefone) },
      ],
    });

    const agregado = lineItems(v.agregado).filter((r) => r.nome || r.parentesco);
    const rows = agregado.length
      ? agregado.map((r) => [String(r.nome ?? '').trim(), String(r.parentesco ?? '').trim(), formatDateShort(r.dataNascimento, ''), String(r.dependente ?? '')])
      : Array.from({ length: 4 }, () => [' ', ' ', ' ', ' ']);
    blocks.push({
      type: 'table',
      caption: 'Agregado familiar e dependentes',
      columns: [
        { label: 'Nome', width: 3.2 },
        { label: 'Parentesco', width: 1.4 },
        { label: 'Data de nascimento', width: 1.5 },
        { label: 'Dependente', width: 1, align: 'center' },
      ],
      rows,
    });

    blocks.push(
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declaro, sob compromisso de honra, que os dados constantes da presente ficha são verdadeiros e completos, e comprometo-me a comunicar à Entidade Empregadora, por escrito, qualquer alteração dos mesmos. Autorizo a Entidade Empregadora a tratar estes dados para efeitos de gestão da relação de trabalho, processamento de salários e cumprimento das obrigações legais perante a Autoridade Tributária e o Instituto Nacional de Segurança Social.`,
        en: 'I declare on my honour that the information on this form is true and complete, and I undertake to inform the Employer in writing of any change. I authorise the Employer to process this data to manage the employment relationship, run payroll and meet legal obligations towards the Tax Authority and the National Social Security Institute.',
        size: 'small',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [workerSignature(v), employerSignature(ctx, 'Pela Entidade Empregadora')],
      },
    );
    return blocks;
  },
});
