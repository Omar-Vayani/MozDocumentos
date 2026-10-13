// User areas ("sectors"): who the user is decides which documents are shown
// first. Everything stays searchable; documents from other areas are listed
// separately as "Noutras áreas".

import type { L10n } from '@/documents/model';
import type { IconName } from '@/ui/Icon';
import type { TemplateMeta } from './catalog';
import type { CategoryId } from './categories';

export type SectorId =
  | 'empresa'
  | 'particular'
  | 'advocacia'
  | 'saude'
  | 'estado'
  | 'comunidade'
  | 'educacao'
  | 'associacoes'
  | 'construcao';

export type Sector = {
  id: SectorId;
  icon: IconName;
  title: L10n;
  hint: L10n;
  /** Categories whose documents belong to this area. */
  categories: CategoryId[];
  /** Profile type suggested when creating a profile for this area. */
  profile: 'empresa' | 'pessoa' | 'publica';
};

const HR: CategoryId[] = ['contratar', 'salario', 'ferias', 'disciplina', 'fim'];

export const SECTORS: Sector[] = [
  {
    id: 'empresa',
    icon: 'building',
    title: { pt: 'Empresa ou negócio', en: 'Business' },
    hint: { pt: 'Trabalhadores, clientes, fornecedores, sociedade.', en: 'Employees, clients, suppliers, company.' },
    categories: [...HR, 'empresa', 'contratos', 'comercio'],
    profile: 'empresa',
  },
  {
    id: 'particular',
    icon: 'user',
    title: { pt: 'Particular ou trabalhador', en: 'Individual or employee' },
    hint: { pt: 'Família, casa, dinheiro, emprego, eventos.', en: 'Family, home, money, job, events.' },
    categories: ['pessoal', 'contratos', 'eventos'],
    profile: 'pessoa',
  },
  {
    id: 'advocacia',
    icon: 'gavel',
    title: { pt: 'Advogado ou jurista', en: 'Lawyer' },
    hint: { pt: 'Peças processuais, contratos, sociedades.', en: 'Court filings, contracts, companies.' },
    categories: ['advocacia', 'contratos', 'empresa', 'pessoal'],
    profile: 'pessoa',
  },
  {
    id: 'saude',
    icon: 'heart',
    title: { pt: 'Saúde', en: 'Health' },
    hint: { pt: 'Médicos, clínicas, farmácias, laboratórios.', en: 'Doctors, clinics, pharmacies, laboratories.' },
    categories: ['saude', ...HR],
    profile: 'pessoa',
  },
  {
    id: 'estado',
    icon: 'landmark',
    title: { pt: 'Entidade pública', en: 'Public body' },
    hint: { pt: 'Ministérios, governos provinciais, municípios, institutos.', en: 'Ministries, provincial governments, municipalities, institutes.' },
    categories: ['estado'],
    profile: 'publica',
  },
  {
    id: 'comunidade',
    icon: 'family',
    title: { pt: 'Autoridade comunitária', en: 'Community authority' },
    hint: { pt: 'Secretários de bairro, chefes de quarteirão, líderes comunitários.', en: 'Neighbourhood secretaries, block chiefs, community leaders.' },
    categories: ['comunidade'],
    profile: 'publica',
  },
  {
    id: 'educacao',
    icon: 'graduation',
    title: { pt: 'Educação e formação', en: 'Education' },
    hint: { pt: 'Escolas, universidades, centros de formação.', en: 'Schools, universities, training centres.' },
    categories: ['educacao', 'eventos', ...HR],
    profile: 'empresa',
  },
  {
    id: 'associacoes',
    icon: 'handshake',
    title: { pt: 'Associação, ONG ou igreja', en: 'Association, NGO or church' },
    hint: { pt: 'Membros, quotas, assembleias, doações.', en: 'Members, dues, meetings, donations.' },
    categories: ['associacoes', 'eventos', 'contratos'],
    profile: 'empresa',
  },
  {
    id: 'construcao',
    icon: 'hardhat',
    title: { pt: 'Construção e imobiliário', en: 'Construction and real estate' },
    hint: { pt: 'Engenheiros, empreiteiros, mediadores, condomínios.', en: 'Engineers, contractors, estate agents, condominiums.' },
    categories: ['construcao', 'contratos', ...HR],
    profile: 'empresa',
  },
];

export const sectorById = (id: SectorId) => SECTORS.find((s) => s.id === id);

/** True when a document belongs to one of the user's areas (no areas chosen → everything). */
export function isForSectors(m: TemplateMeta, sectors: SectorId[]): boolean {
  if (!sectors.length) return true;
  if (m.sectors?.some((s) => sectors.includes(s))) return true;
  return sectors.some((id) => {
    const s = sectorById(id);
    if (!s) return false;
    if (s.categories.includes(m.category)) return true;
    // Workers' own documents (resignation, leave request…) also belong to individuals.
    return id === 'particular' && m.audience === 'pessoa';
  });
}
