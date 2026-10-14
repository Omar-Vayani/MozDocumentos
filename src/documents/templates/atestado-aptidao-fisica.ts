import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, DOC_TIPO_OPTIONS, g, isF, l, localField, placeDate } from './_shared';
import {
  clinicianDesc, clinicianFields, clinicianSignature, clinicianWarnings, hivWarning, mentionsHiv, patientFields, senhor,
} from './_saude';

const FINALIDADE_OPTIONS = [
  { value: 'emprego', label: l('Emprego (admissão numa empresa)', 'Employment (joining a company)') },
  { value: 'concurso', label: l('Concurso ou ingresso na função pública', 'Public service recruitment') },
  { value: 'escola', label: l('Matrícula em escola ou universidade', 'School or university enrolment') },
  { value: 'desporto', label: l('Prática desportiva', 'Sport') },
  { value: 'conducao', label: l('Carta de condução', 'Driving licence') },
  { value: 'imigracao', label: l('Visto, residência ou emigração', 'Visa, residence or emigration') },
  { value: 'arma', label: l('Licença de uso e porte de arma', 'Firearm licence') },
  { value: 'outro', label: l('Outro fim', 'Other purpose') },
];

const CONCLUSAO_OPTIONS = [
  { value: 'apto', label: l('Apto(a)', 'Fit') },
  { value: 'restricoes', label: l('Apto(a) com restrições', 'Fit with restrictions') },
  { value: 'inapto', label: l('Não apto(a)', 'Unfit') },
];

const OFICIAL = ['concurso', 'conducao', 'imigracao', 'arma'];
const FORM_PROPRIO = ['conducao', 'imigracao', 'arma'];
const LABOR = (v: Values) => v.finalidade === 'emprego' || v.finalidade === 'concurso';

function fim(v: Values): { pt: string; en: string } {
  const d = String(v.finalidadeDetalhe ?? '').trim();
  switch (v.finalidade) {
    case 'emprego':
      return { pt: d ? `o exercício da função de ${d}` : 'o exercício de actividade profissional', en: d ? `working as ${d}` : 'working' };
    case 'concurso':
      return { pt: d ? `o ingresso na função pública, na carreira de ${d}` : 'o ingresso na função pública', en: 'joining the public service' };
    case 'escola':
      return { pt: d ? `a frequência ${/^(d[oa]s?|n[oa]s?)\b/i.test(d) ? d : `de ${d}`}` : 'a frequência escolar, incluindo a educação física', en: 'school attendance' };
    case 'desporto':
      return { pt: d ? `a prática de ${d}` : 'a prática desportiva', en: d ? `practising ${d}` : 'sport' };
    case 'conducao':
      return { pt: `a condução de veículos automóveis${d ? ` da categoria ${d}` : ''}`, en: `driving${d ? ` (category ${d})` : ''}` };
    case 'imigracao':
      return { pt: d ? `efeitos de ${d}` : 'efeitos de pedido de visto ou de autorização de residência', en: 'visa or residence purposes' };
    case 'arma':
      return { pt: 'o uso e porte de arma', en: 'holding and carrying a firearm' };
    default:
      return { pt: d || 'o fim a que se destina', en: d || 'the stated purpose' };
  }
}

export default defineTemplate({
  id: 'atestado-aptidao-fisica',
  family: 'declaracao',
  official: (v) => (OFICIAL.includes(String(v.finalidade)) ? 'estado' : undefined),
  sections: [
    { id: 'clinico', title: l('Médico', 'Doctor') },
    { id: 'examinado', title: l('Pessoa examinada', 'Person examined'), personRole: 'outro' },
    { id: 'exame', title: l('Exame e conclusão', 'Examination and conclusion') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...clinicianFields('clinico'),
    ...patientFields(['nome', 'genero', 'dataNascimento'], 'examinado').map((f) => (f.name === 'doenteDataNascimento' ? { ...f, required: true } : f)),
    { name: 'doentePai', type: 'text', section: 'examinado', width: 'half', label: l('Nome do pai (opcional)', 'Father’s name (optional)') },
    { name: 'doenteMae', type: 'text', section: 'examinado', width: 'half', label: l('Nome da mãe (opcional)', 'Mother’s name (optional)') },
    { name: 'doenteNaturalidade', type: 'text', section: 'examinado', width: 'half', label: l('Naturalidade (opcional)', 'Place of birth (optional)'), personKey: 'naturalidade' },
    { name: 'doenteDocTipo', type: 'select', section: 'examinado', width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'doenteDocNumero', type: 'text', section: 'examinado', width: 'half', required: true, label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
    { name: 'doenteDocEmissao', type: 'date', section: 'examinado', width: 'half', label: l('Data de emissão', 'Issue date'), personKey: 'docEmissao' },
    { name: 'doenteMorada', type: 'text', section: 'examinado', label: l('Residência (opcional)', 'Address (optional)'), personKey: 'morada' },
    { name: 'dataExame', type: 'date', section: 'exame', width: 'half', required: true, label: l('Data do exame', 'Examination date'), default: (c) => c.today },
    { name: 'finalidade', type: 'select', section: 'exame', width: 'half', label: l('Para que serve', 'Purpose'), options: FINALIDADE_OPTIONS, default: 'emprego' },
    {
      name: 'finalidadeDetalhe',
      type: 'text',
      section: 'exame',
      label: l('Pormenor (função, modalidade, categoria…)', 'Detail (job, sport, category…)'),
      placeholder: l('Ex.: motorista de pesados / futebol / categoria B', 'E.g. truck driver / football / category B'),
    },
    { name: 'conclusao', type: 'radio', section: 'exame', label: l('Conclusão', 'Conclusion'), options: CONCLUSAO_OPTIONS, default: 'apto' },
    {
      name: 'restricoes',
      type: 'textarea',
      section: 'exame',
      rows: 2,
      label: l('Restrições', 'Restrictions'),
      placeholder: l('Ex.: deve usar lentes correctoras', 'E.g. must wear corrective lenses'),
      showIf: (v) => v.conclusao === 'restricoes',
    },
    {
      name: 'examesComplementares',
      type: 'text',
      section: 'exame',
      label: l('Exames complementares apresentados (opcional)', 'Supporting tests seen (optional)'),
      placeholder: l('Ex.: hemograma, glicemia, radiografia do tórax', 'E.g. blood count, glucose, chest X-ray'),
    },
    { name: 'acuidadeOD', type: 'text', section: 'exame', width: 'third', label: l('Acuidade visual OD', 'Visual acuity right'), placeholder: l('10/10', '10/10'), showIf: (v) => v.finalidade === 'conducao' },
    { name: 'acuidadeOE', type: 'text', section: 'exame', width: 'third', label: l('Acuidade visual OE', 'Visual acuity left'), placeholder: l('10/10', '10/10'), showIf: (v) => v.finalidade === 'conducao' },
    { name: 'correccaoOptica', type: 'toggle', section: 'exame', label: l('Com correcção óptica', 'With corrective lenses'), showIf: (v) => v.finalidade === 'conducao' },
    { name: 'audicao', type: 'text', section: 'exame', width: 'half', label: l('Audição', 'Hearing'), default: 'normal', showIf: (v) => v.finalidade === 'conducao' },
    {
      name: 'biometria',
      type: 'toggle',
      section: 'exame',
      label: l('Indicar altura, peso e tensão arterial', 'State height, weight and blood pressure'),
      help: l('Não disponível para emprego ou concurso: ao empregador só se comunica a aptidão.', 'Not for employment: the employer is told only about fitness.'),
      showIf: (v) => !LABOR(v),
    },
    { name: 'altura', type: 'text', section: 'exame', width: 'third', label: l('Altura', 'Height'), placeholder: l('1,72 m', '1.72 m'), showIf: (v) => !LABOR(v) && Boolean(v.biometria) },
    { name: 'peso', type: 'text', section: 'exame', width: 'third', label: l('Peso', 'Weight'), placeholder: l('70 kg', '70 kg'), showIf: (v) => !LABOR(v) && Boolean(v.biometria) },
    { name: 'tensao', type: 'text', section: 'exame', width: 'third', label: l('Tensão arterial', 'Blood pressure'), placeholder: l('120/80 mmHg', '120/80 mmHg'), showIf: (v) => !LABOR(v) && Boolean(v.biometria) },
    {
      name: 'validadeMeses',
      type: 'number',
      section: 'exame',
      width: 'half',
      min: 1,
      max: 60,
      label: l('Validade em meses (opcional)', 'Valid for months (optional)'),
      help: l('Só se a entidade a que se destina fixar uma validade.', 'Only if the receiving body sets a validity.'),
    },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (!v.doenteDocNumero) w.push({ level: 'warning', field: 'doenteDocNumero', message: l('Indique o documento de identificação: identifica a pessoa examinada.', 'Enter the ID document number.') });
    if (LABOR(v)) {
      w.push({
        level: 'info',
        message: l(
          `Ao empregador só pode ser comunicada a aptidão ou inaptidão para o trabalho; é proibido testar o HIV de candidatos e trabalhadores (${cite('examesMedicosTrabalho')}).`,
          `The employer may be told only whether the person is fit or unfit; testing candidates or workers for HIV is prohibited (${cite('examesMedicosTrabalho')}).`,
        ),
      });
    }
    if (mentionsHiv(v.restricoes, v.examesComplementares, v.finalidadeDetalhe)) w.push(hivWarning('examesComplementares', LABOR(v) ? 'error' : 'warning'));
    if (FORM_PROPRIO.includes(String(v.finalidade))) {
      w.push({
        level: 'warning',
        field: 'finalidade',
        message: l(
          'Algumas entidades (INATRO, consulados, PRM) exigem impresso próprio. Confirme antes de usar este modelo.',
          'Some bodies (INATRO, consulates, police) require their own form. Check before using this model.',
        ),
      });
    }
    if (v.conclusao === 'restricoes' && !v.restricoes) w.push({ level: 'warning', field: 'restricoes', message: l('Indique as restrições.', 'Enter the restrictions.') });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.doenteGenero);
    const who = clinicianDesc(v);
    const id: string[] = [`**${v.doenteNome || '____________________'}**`];
    if (v.doentePai || v.doenteMae) {
      const pais = [v.doentePai, v.doenteMae].filter(Boolean).join(' e de ');
      id.push(`${f ? 'filha' : 'filho'} de ${pais}`);
    }
    if (v.doenteNaturalidade) id.push(`natural de ${v.doenteNaturalidade}`);
    id.push(`${f ? 'nascida' : 'nascido'} em ${dateLong(v.doenteDataNascimento)}`);
    id.push(
      `${f ? 'portadora' : 'portador'} do ${v.doenteDocTipo || 'BI'} n.º ${v.doenteDocNumero || '________________'}${v.doenteDocEmissao ? `, emitido em ${dateLong(v.doenteDocEmissao)}` : ''}`,
    );
    if (v.doenteMorada) id.push(`residente em ${v.doenteMorada}`);
    const exames = String(v.examesComplementares ?? '').trim().replace(/[.;]+$/, '');
    const a = f ? 'apta' : 'apto';
    const para = fim(v);
    let concl = `se encontra **${a}**, física e mentalmente, para ${para.pt}`;
    let conclEn = `is fit, physically and mentally, for ${para.en}`;
    if (v.conclusao === 'restricoes') {
      concl = `se encontra **${a}**, física e mentalmente, para ${para.pt}, **com as seguintes restrições:** ${String(v.restricoes || '____________________').replace(/[.;]+$/, '')}`;
      conclEn = `is fit for ${para.en}, with restrictions: ${v.restricoes || '___'}`;
    } else if (v.conclusao === 'inapto') {
      concl = `**não se encontra ${a}**, física e mentalmente, para ${para.pt}`;
      conclEn = `is not fit for ${para.en}`;
    }
    const blocks: Block[] = [
      { type: 'title', text: 'Atestado Médico', subtitle: 'de aptidão física e mental' },
      {
        type: 'paragraph',
        id: 'atesta',
        text: `${who.pt}, atesta, sob compromisso de honra profissional, que examinou no dia ${dateLong(v.dataExame)} ${senhor(v)} ${id.join(', ')}, e que, do exame clínico efectuado${exames ? ` e dos exames complementares apresentados (${exames})` : ''}, ${g(v.doenteGenero, 'o mesmo', 'a mesma')} ${concl}.`,
        en: `${who.en} certifies on professional honour that on ${v.dataExame || '___'} ${v.doenteNome || '___'} was examined and ${conclEn}.`,
      },
    ];
    if (v.finalidade === 'conducao') {
      blocks.push({
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Acuidade visual OD', value: v.acuidadeOD || '______' },
          { label: 'Acuidade visual OE', value: v.acuidadeOE || '______' },
          { label: 'Correcção óptica', value: v.correccaoOptica ? 'Sim' : 'Não' },
          { label: 'Audição', value: v.audicao || '______' },
        ],
      });
    }
    if (!LABOR(v) && v.biometria) {
      blocks.push({
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Altura', value: v.altura || '______' },
          { label: 'Peso', value: v.peso || '______' },
          { label: 'Tensão arterial', value: v.tensao || '______' },
        ],
      });
    }
    const n = Number(v.validadeMeses);
    const val = v.validadeMeses && Number.isFinite(n) && n > 0 ? `é válido por ${n} ${n === 1 ? 'mês' : 'meses'} e ` : '';
    blocks.push(
      {
        type: 'paragraph',
        id: 'destino',
        text: `O presente atestado ${val}destina-se exclusivamente ao fim indicado.`,
        en: `This certificate ${val ? `is valid for ${n} months and ` : ''}is for the stated purpose only.`,
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade e me ter sido solicitado, passo o presente atestado, que vai por mim assinado e autenticado com o carimbo em uso.',
        en: 'Issued at the request of the person examined, signed and stamped.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx)] },
    );
    return blocks;
  },
});
