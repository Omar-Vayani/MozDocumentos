// Catalogue entries for the "saude" documents (merged into CATALOG): what
// doctors, dentists, nurses, clinics and laboratories issue to patients and
// employers.
import type { TemplateMeta } from '../catalog';

const REVIEWED = '2026-10-13';

export const CATALOG_SAUDE: TemplateMeta[] = [
  {
    id: 'atestado-medico-doenca',
    category: 'saude',
    audience: 'ambos',
    phase: 'A',
    title: { pt: 'Atestado médico de doença', en: 'Sick note (medical certificate)' },
    formalTitle: 'Atestado Médico',
    summary: {
      pt: 'Para o médico atestar que o doente não pode trabalhar ou ir às aulas durante um período, sem revelar a doença.',
      en: 'For a doctor to certify that a patient cannot work or attend classes for a period, without revealing the illness.',
    },
    tags: ['atestado', 'atestado medico', 'baixa', 'baixa medica', 'doenca', 'faltas', 'justificar faltas', 'sick note', 'medical certificate', 'sick leave', 'incapacidade'],
    legalRefs: ['faltasPorDoenca', 'juntaDeSaude', 'doencaNasFerias', 'examesMedicosTrabalho', 'inscricaoOrdemMedicos', 'atestadoFalso'],
    related: ['declaracao-de-comparencia', 'justificacao-de-falta', 'relatorio-medico'],
    lastReviewed: REVIEWED,
    popularity: 9,
  },
];
