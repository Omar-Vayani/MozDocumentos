// Catalogue entries for the "educacao" documents (merged into CATALOG):
// schools, colleges, universities, training centres, tutors and driving schools.
import type { TemplateMeta } from '../catalog';

const R = '2026-10-13';

export const CATALOG_EDUCACAO: TemplateMeta[] = [
  {
    id: 'declaracao-de-frequencia',
    category: 'educacao',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Declarar que um aluno está matriculado', en: 'Proof of enrolment / attendance' },
    formalTitle: 'Declaração de Matrícula e Frequência',
    summary: {
      pt: 'Declaração da escola, universidade ou centro de formação de que o aluno está matriculado ou frequenta uma classe ou curso — para o emprego, a migração, a embaixada ou o tribunal.',
      en: 'School, university or training-centre letter certifying that a student is enrolled or attends a class or course — for employers, migration, embassies or courts.',
    },
    tags: ['declaração de frequência', 'declaracao de matricula', 'comprovativo de matrícula', 'aluno matriculado', 'estudante', 'escola', 'universidade', 'proof of enrolment', 'attendance letter', 'student letter'],
    legalRefs: ['eduTrabalhadorEstudante', 'eduCertificadoHabilitacoes', 'eduEnsinoPrivadoLicenca'],
    related: ['declaracao-de-aproveitamento'],
    lastReviewed: R,
    popularity: 8,
  },
  {
    id: 'declaracao-de-aproveitamento',
    category: 'educacao',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Declarar as notas de um aluno', en: 'Statement of grades' },
    formalTitle: 'Declaração de Aproveitamento',
    summary: {
      pt: 'Declaração com as classificações por disciplina de um ano, trimestre ou semestre — para bolsas, trabalhadores-estudantes ou transferências. Não substitui o certificado oficial.',
      en: 'Statement of grades per subject for a year, term or semester — for scholarships, worker-students or transfers. Does not replace the official certificate.',
    },
    tags: ['declaração de notas', 'declaracao com notas', 'aproveitamento escolar', 'pauta', 'notas', 'classificações', 'transcript', 'grades', 'academic record'],
    legalRefs: ['eduCertificadoHabilitacoes', 'eduEscalaClassificacao', 'eduTrabalhadorEstudante'],
    related: ['declaracao-de-frequencia', 'termo-bolsa-de-estudo'],
    lastReviewed: R,
    popularity: 6,
  },
  {
    id: 'certificado-de-formacao',
    category: 'educacao',
    sectors: ['educacao', 'empresa', 'associacoes'],
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Certificado de curso ou formação', en: 'Training course certificate' },
    formalTitle: 'Certificado de Formação',
    summary: {
      pt: 'Certificado de participação, frequência ou conclusão de um curso livre, acção de formação ou curso de línguas, em A4 horizontal — um por participante.',
      en: 'Certificate of participation, attendance or completion of a short course, training or language course, A4 landscape — one per participant.',
    },
    tags: ['certificado de curso', 'certificado de formação', 'diploma de curso livre', 'centro de formação', 'formação interna', 'curso de línguas', 'training certificate', 'course certificate', 'diploma'],
    legalRefs: ['eduHabilitacoesProfissionais', 'eduEducacaoProfissional', 'eduFormacaoTrabalhadores', 'eduEnsinoPrivadoLicenca'],
    related: ['certificado-de-participacao'],
    lastReviewed: R,
    popularity: 6,
  },
  {
    id: 'contrato-servicos-educativos',
    category: 'educacao',
    audience: 'empresa',
    phase: 'A',
    title: { pt: 'Contrato da escola com o encarregado', en: 'School enrolment contract' },
    formalTitle: 'Contrato de Prestação de Serviços Educativos',
    summary: {
      pt: 'Contrato entre a escola, creche, centro de formação ou explicador e o encarregado de educação: matrícula, propinas, atrasos, desistência, saúde e imagem do aluno.',
      en: 'Contract between a school, nursery, training centre or tutor and the parent: enrolment, fees, late payment, withdrawal, health and image of the pupil.',
    },
    tags: ['contrato escolar', 'contrato de matrícula', 'propinas', 'escola privada', 'colégio', 'creche', 'explicações', 'explicador', 'school contract', 'tuition agreement', 'enrolment contract'],
    legalRefs: ['eduConsumidorEnsino', 'eduPropinasEnsinoPrivado', 'eduEnsinoPrivadoLicenca', 'eduIvaPropinas', 'eduDireitoEducacaoDividas', 'codigoCivilMora'],
    related: ['ficha-de-inscricao', 'tabela-de-propinas', 'aviso-propinas-em-atraso'],
    lastReviewed: R,
    popularity: 7,
  },
];
