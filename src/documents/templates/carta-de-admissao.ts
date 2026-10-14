// Carta de admissão: a university, college or school tells a candidate that
// they were admitted to a course, with start date, enrolment deadline,
// documents and fees. Foreign students present it to the consulate for the
// study visa, so it can confirm admission for that purpose.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, exmo, formatMoney, GENERO_OPTIONS, isF, l, localField, money, refField } from './_shared';
import { inst, designacaoField, licenceWarning, schoolSignatures, signatoryFields } from './_educacao';
import { juntar, lines, or, semPonto, str } from './_saude-educacao';

const REGIME_OPTIONS = [
  { value: 'laboral (diurno)', label: l('Laboral (diurno)', 'Day') },
  { value: 'pós-laboral', label: l('Pós-laboral', 'Evening') },
  { value: 'semi-presencial', label: l('Semi-presencial', 'Blended') },
];

export default defineTemplate({
  id: 'carta-de-admissao',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'candidato', title: l('Candidato', 'Candidate'), personRole: 'outro' },
    { id: 'curso', title: l('Curso', 'Course') },
    { id: 'matricula', title: l('Matrícula e propinas', 'Enrolment and fees') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    refField(),
    localField(),
    dateField(),
    designacaoField('documento'),
    { name: 'candidatoNome', type: 'text', section: 'candidato', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'candidatoGenero', type: 'radio', section: 'candidato', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'candidatoNacionalidade', type: 'text', section: 'candidato', width: 'half', label: l('Nacionalidade', 'Nationality'), default: 'moçambicana', personKey: 'nacionalidade' },
    { name: 'candidatoDoc', type: 'text', section: 'candidato', width: 'half', label: l('Documento (BI / passaporte n.º)', 'ID / passport no.'), personKey: 'docNumero' },
    { name: 'candidatoNascimento', type: 'date', section: 'candidato', width: 'half', label: l('Data de nascimento (opcional)', 'Date of birth (optional)') },
    { name: 'candidatoMorada', type: 'text', section: 'candidato', label: l('Endereço (opcional)', 'Address (optional)'), personKey: 'morada' },
    { name: 'candidatoNumero', type: 'text', section: 'candidato', width: 'half', label: l('N.º de candidatura (opcional)', 'Application no. (optional)') },
    { name: 'curso', type: 'text', section: 'curso', required: true, label: l('Curso', 'Programme'), placeholder: l('Ex.: Licenciatura em Engenharia Informática', 'E.g. BSc in Computer Engineering') },
    { name: 'faculdade', type: 'text', section: 'curso', width: 'half', label: l('Faculdade / departamento (opcional)', 'Faculty (optional)') },
    { name: 'regime', type: 'select', section: 'curso', width: 'half', label: l('Regime', 'Mode'), options: REGIME_OPTIONS, default: 'laboral (diurno)' },
    { name: 'anoAcademico', type: 'text', section: 'curso', width: 'half', required: true, label: l('Ano académico', 'Academic year'), default: (c) => String(Number((c.today || '').slice(0, 4)) + 1) },
    { name: 'duracao', type: 'text', section: 'curso', width: 'half', label: l('Duração do curso', 'Duration'), placeholder: l('Ex.: quatro anos (oito semestres)', 'E.g. four years') },
    { name: 'inicioAulas', type: 'date', section: 'curso', width: 'half', label: l('Início das aulas', 'Classes start') },
    { name: 'condicional', type: 'toggle', section: 'curso', label: l('Admissão condicional', 'Conditional admission') },
    { name: 'condicao', type: 'text', section: 'curso', label: l('Condição', 'Condition'), placeholder: l('Ex.: apresentação do certificado da 12.ª classe homologado', 'E.g. presenting the validated school certificate'), showIf: (v) => Boolean(v.condicional) },
    { name: 'matriculaAte', type: 'date', section: 'matricula', width: 'half', required: true, label: l('Matrícula até', 'Enrol by') },
    { name: 'matriculaLocal', type: 'text', section: 'matricula', width: 'half', label: l('Onde se matricula', 'Where to enrol'), default: 'Direcção de Registo Académico' },
    {
      name: 'documentos',
      type: 'textarea',
      section: 'matricula',
      rows: 4,
      label: l('Documentos para a matrícula', 'Documents for enrolment'),
      default: 'Bilhete de Identidade ou passaporte (cópia)\nCertificado de habilitações da 12.ª classe ou equivalente, homologado\nDuas fotografias tipo passe\nComprovativo de pagamento da taxa de matrícula',
    },
    { name: 'taxaMatricula', type: 'money', section: 'matricula', width: 'half', label: l('Taxa de matrícula (opcional)', 'Enrolment fee (optional)') },
    { name: 'propina', type: 'money', section: 'matricula', width: 'half', label: l('Propina (opcional)', 'Tuition (optional)') },
    {
      name: 'propinaPeriodo',
      type: 'select',
      section: 'matricula',
      width: 'half',
      label: l('Propina por', 'Tuition per'),
      options: [
        { value: 'mês', label: l('Mês', 'Month') },
        { value: 'semestre', label: l('Semestre', 'Semester') },
        { value: 'ano', label: l('Ano', 'Year') },
      ],
      default: 'mês',
    },
    { name: 'paraVisto', type: 'toggle', section: 'matricula', label: l('Incluir parágrafo para o visto de estudo (estrangeiro)', 'Include study-visa paragraph (foreign student)'), default: false },
    { name: 'contacto', type: 'text', section: 'assinatura', label: l('Contacto para dúvidas (opcional)', 'Contact for questions (optional)'), default: (c) => c.profile?.email ?? '' },
    ...signatoryFields('assinatura', { segundo: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    if (!str(v.candidatoNome)) w.push({ level: 'error', field: 'candidatoNome', message: l('Indique o nome do candidato.', 'Enter the candidate’s name.') });
    if (!str(v.matriculaAte)) w.push({ level: 'warning', field: 'matriculaAte', message: l('Indique até quando o candidato se deve matricular.', 'Enter the enrolment deadline.') });
    if (v.paraVisto) w.push({ level: 'info', field: 'paraVisto', message: l(`Para o visto de estudo o consulado pede a carta de admissão original, assinada e carimbada (${cite('seVistoEstudo')}).`, 'For the study visa the consulate asks for the signed and stamped original.') });
    return w;
  },

  personName: (v) => v.candidatoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.candidatoGenero);
    const i = inst(v);
    const docs = lines(v.documentos);
    const tm = money(v.taxaMatricula);
    const pr = money(v.propina);
    const id = [
      str(v.candidatoNacionalidade) ? `de nacionalidade ${str(v.candidatoNacionalidade)}` : '',
      str(v.candidatoDoc) ? `${f ? 'portadora' : 'portador'} do documento n.º ${str(v.candidatoDoc)}` : '',
      str(v.candidatoNascimento) ? `${f ? 'nascida' : 'nascido'} em ${dateLong(v.candidatoNascimento)}` : '',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', lines: [`${exmo(v.candidatoGenero)}`, or(v.candidatoNome), ...(str(v.candidatoMorada) ? [str(v.candidatoMorada)] : [])] },
      { type: 'subject', text: `Carta de admissão${str(v.candidatoNumero) ? ` — candidatura n.º ${str(v.candidatoNumero)}` : ''}` },
      { type: 'salutation', text: `${exmo(v.candidatoGenero)},` },
      {
        type: 'paragraph',
        id: 'admissao',
        text: `Comunicamos a V. Ex.ª que foi ${f ? 'admitida' : 'admitido'}${v.condicional ? ', condicionalmente,' : ''} ao curso de **${or(v.curso)}**${str(v.faculdade) ? `, da ${str(v.faculdade)}` : ''}, em regime ${str(v.regime) || 'laboral (diurno)'}, para o ano académico de **${or(v.anoAcademico)}**${str(v.duracao) ? `. O curso tem a duração de ${semPonto(v.duracao)}` : ''}${str(v.inicioAulas) ? ` e as aulas têm início em ${dateLong(v.inicioAulas)}` : ''}.`,
        en: `We are pleased to inform you that you have been admitted${v.condicional ? ' conditionally' : ''} to the ${str(v.curso) || '___'} programme for the ${str(v.anoAcademico) || '___'} academic year${str(v.inicioAulas) ? `; classes start on ${v.inicioAulas}` : ''}.`,
      },
    ];
    if (v.condicional) {
      blocks.push({ type: 'paragraph', id: 'condicao', text: `A admissão fica condicionada a ${semPonto(v.condicao).replace(/^(a|à)\s+/i, '') || '____________________'}, sem o que a matrícula não se torna definitiva.`, en: `Admission is conditional on: ${str(v.condicao) || '___'}.` });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'matricula',
        text: `Para confirmar a vaga, V. Ex.ª deve efectuar a matrícula até **${dateLong(v.matriculaAte)}**, na ${semPonto(v.matriculaLocal) || 'secretaria'}, apresentando os seguintes documentos:`,
        en: `To secure the place, enrol by ${v.matriculaAte || '___'} at the ${str(v.matriculaLocal) || 'registry'}, bringing the documents below:`,
        keepWithNext: true,
      },
      { type: 'list', items: docs.length ? docs.map((d, k) => `${d.replace(/[.;]+$/, '')}${k === docs.length - 1 ? '.' : ';'}`) : ['____________________'] },
    );
    if (tm != null || pr != null) {
      const partes = [tm != null ? `a taxa de matrícula é de ${formatMoney(tm)}` : '', pr != null ? `a propina é de ${formatMoney(pr)} por ${str(v.propinaPeriodo) || 'mês'}` : ''].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'propinas', text: `Para o ano académico indicado, ${juntar(partes)}, nos termos da tabela de propinas em vigor ${i.desta}.`, en: `For this academic year: ${tm != null ? `enrolment fee ${formatMoney(tm)}` : ''}${tm != null && pr != null ? '; ' : ''}${pr != null ? `tuition ${formatMoney(pr)} per ${str(v.propinaPeriodo) === 'semestre' ? 'semester' : str(v.propinaPeriodo) === 'ano' ? 'year' : 'month'}` : ''}.` });
    }
    blocks.push({ type: 'paragraph', id: 'vaga', text: 'A falta de matrícula no prazo indicado implica a perda da vaga.', en: 'Failure to enrol by the deadline means losing the place.' });
    if (v.paraVisto) {
      blocks.push({
        type: 'paragraph',
        id: 'visto',
        text: `A presente carta é emitida também para instruir o pedido de visto de estudo junto das autoridades consulares e migratórias. ${i.A} confirma a admissão ${f ? 'da candidata' : 'do candidato'} **${or(v.candidatoNome)}**${id.length ? `, ${id.join(', ')},` : ''} e informa que a frequência do curso é presencial, competindo ${f ? 'à interessada' : 'ao interessado'} obter o visto e a autorização de residência para estudante antes do início das aulas.`,
        en: `This letter is also issued to support the study-visa application. The institution confirms the admission; the course is taught in person, and the student must obtain the visa and student residence permit before classes start.`,
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: `${str(v.contacto) ? `Para qualquer esclarecimento, contacte ${str(v.contacto)}. ` : ''}Felicitamos V. Ex.ª e desejamos-lhe os maiores sucessos.\nCom os melhores cumprimentos,`, en: `${str(v.contacto) ? `For questions, contact ${str(v.contacto)}. ` : ''}Congratulations and best wishes. Yours sincerely,`, keepWithNext: true },
      { type: 'signatures', columns: schoolSignatures(v) },
    );
    return blocks;
  },
});
