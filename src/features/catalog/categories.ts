import type { L10n } from '@/documents/model';
import type { IconName } from '@/ui/Icon';

export type CategoryId =
  | 'contratar'
  | 'salario'
  | 'ferias'
  | 'disciplina'
  | 'fim'
  | 'pessoal'
  | 'empresa'
  | 'contratos'
  | 'comercio'
  | 'advocacia'
  | 'estado'
  | 'comunidade'
  | 'saude'
  | 'educacao'
  | 'associacoes'
  | 'construcao'
  | 'eventos'
  | 'financas'
  | 'digital'
  | 'turismo'
  | 'cidadao'
  | 'contratacao';

export type Category = { id: CategoryId; title: L10n; description: L10n; icon: IconName };

export const CATEGORIES: Category[] = [
  {
    id: 'contratar',
    icon: 'briefcase',
    title: { pt: 'Contratar', en: 'Hiring' },
    description: { pt: 'Propostas, contratos e registo de trabalhadores.', en: 'Offers, contracts and employee records.' },
  },
  {
    id: 'salario',
    icon: 'coins',
    title: { pt: 'Salário e pagamentos', en: 'Pay' },
    description: { pt: 'Recibos de salário, declarações e recibos de pagamento.', en: 'Payslips, income statements and receipts.' },
  },
  {
    id: 'ferias',
    icon: 'sun',
    title: { pt: 'Férias e faltas', en: 'Leave' },
    description: { pt: 'Pedidos de férias, faltas e licenças.', en: 'Leave requests, absences and parental leave.' },
  },
  {
    id: 'disciplina',
    icon: 'scale',
    title: { pt: 'Disciplina', en: 'Discipline' },
    description: { pt: 'Advertências e processo disciplinar.', en: 'Warnings and disciplinary procedure.' },
  },
  {
    id: 'fim',
    icon: 'logout',
    title: { pt: 'Fim do contrato', en: 'Ending employment' },
    description: { pt: 'Rescisão, acordo, não renovação e certificado.', en: 'Resignation, mutual agreement, non-renewal and certificate.' },
  },
  {
    id: 'pessoal',
    icon: 'user',
    title: { pt: 'Pessoal', en: 'For individuals' },
    description: { pt: 'Procurações, arrendamento, requerimentos e declarações.', en: 'Powers of attorney, rentals, applications and declarations.' },
  },
  {
    id: 'empresa',
    icon: 'building',
    title: { pt: 'Empresa', en: 'Business admin' },
    description: { pt: 'Sociedades, actas, credenciais, cartas e orçamentos.', en: 'Companies, minutes, authorisations, letters and quotes.' },
  },
  {
    id: 'contratos',
    icon: 'handshake',
    title: { pt: 'Contratos', en: 'Contracts' },
    description: { pt: 'Compra e venda, empréstimo, empreitada, fornecimento e parcerias.', en: 'Sales, loans, construction, supply and partnerships.' },
  },
  {
    id: 'advocacia',
    icon: 'gavel',
    title: { pt: 'Advocacia e tribunais', en: 'Lawyers and courts' },
    description: { pt: 'Procurações forenses, petições, requerimentos, queixas e honorários.', en: 'Court powers of attorney, claims, applications, complaints and fees.' },
  },
  {
    id: 'estado',
    icon: 'landmark',
    title: { pt: 'Administração pública', en: 'Public administration' },
    description: { pt: 'Ofícios, informações, despachos, circulares e guias de marcha.', en: 'Official letters, briefings, orders, circulars and travel orders.' },
  },
  {
    id: 'comercio',
    icon: 'coins',
    title: { pt: 'Comércio e operações', en: 'Trade and operations' },
    description: { pt: 'Encomendas, propostas, condições de venda, garantias e contas-correntes.', en: 'Orders, proposals, terms of sale, warranties and statements.' },
  },
  {
    id: 'comunidade',
    icon: 'landmark',
    title: { pt: 'Autoridades comunitárias', en: 'Community authorities' },
    description: { pt: 'Declarações do bairro, actas comunitárias e encaminhamentos.', en: 'Neighbourhood declarations, community minutes and referrals.' },
  },
  {
    id: 'saude',
    icon: 'heart',
    title: { pt: 'Saúde', en: 'Health' },
    description: { pt: 'Atestados, receitas, relatórios, referências e consentimentos.', en: 'Medical certificates, prescriptions, reports, referrals and consent.' },
  },
  {
    id: 'educacao',
    icon: 'graduation',
    title: { pt: 'Educação e formação', en: 'Education and training' },
    description: { pt: 'Declarações de matrícula, certificados, contratos de ensino e comunicados.', en: 'Enrolment letters, certificates, education contracts and notices.' },
  },
  {
    id: 'associacoes',
    icon: 'family',
    title: { pt: 'Associações, ONG e igrejas', en: 'Associations, NGOs and churches' },
    description: { pt: 'Estatutos, actas, membros, quotas, doações e certificados.', en: 'Statutes, minutes, members, dues, donations and certificates.' },
  },
  {
    id: 'construcao',
    icon: 'hardhat',
    title: { pt: 'Construção e imobiliário', en: 'Construction and real estate' },
    description: { pt: 'Autos de obra, orçamentos, mediação imobiliária e condomínios.', en: 'Site records, estimates, property brokerage and condominiums.' },
  },
  {
    id: 'eventos',
    icon: 'sparkle',
    title: { pt: 'Eventos e pessoal', en: 'Events and personal' },
    description: { pt: 'Convites, certificados, currículos, cartões de visita e cartas pessoais.', en: 'Invitations, certificates, CVs, business cards and personal letters.' },
  },
  {
    id: 'financas',
    icon: 'briefcase',
    title: { pt: 'Banca, seguros e impostos', en: 'Banking, insurance and tax' },
    description: { pt: 'Cartas ao banco, garantias, sinistros, reclamações fiscais e acordos de pagamento.', en: 'Bank letters, guarantees, insurance claims, tax objections and payment plans.' },
  },
  {
    id: 'digital',
    icon: 'globe',
    title: { pt: 'Tecnologia, media e propriedade intelectual', en: 'Technology, media and intellectual property' },
    description: { pt: 'Termos de uso, privacidade, software, licenças, imagem e direitos de autor.', en: 'Terms of use, privacy, software, licences, image and copyright.' },
  },
  {
    id: 'turismo',
    icon: 'sun',
    title: { pt: 'Turismo, transportes e agricultura', en: 'Tourism, transport and agriculture' },
    description: { pt: 'Reservas, alojamento, aluguer de viaturas, transporte, terra e produção agrícola.', en: 'Bookings, lodging, car hire, transport, land and farming.' },
  },
  {
    id: 'cidadao',
    icon: 'user',
    title: { pt: 'Cidadão e consumidor', en: 'Citizen and consumer' },
    description: { pt: 'Pedidos e reclamações a serviços públicos, município, água, energia e operadoras.', en: 'Requests and complaints to public services, the municipality, utilities and operators.' },
  },
  {
    id: 'contratacao',
    icon: 'layers',
    title: { pt: 'Concursos e contratação pública', en: 'Public procurement' },
    description: { pt: 'Propostas, declarações de concorrentes, cadernos de encargos, actas de abertura e adjudicação.', en: 'Bids, bidder declarations, specifications, bid-opening minutes and awards.' },
  },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
