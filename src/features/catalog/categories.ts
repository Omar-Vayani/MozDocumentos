import type { L10n } from '@/documents/model';
import type { IconName } from '@/ui/Icon';

export type CategoryId = 'contratar' | 'salario' | 'ferias' | 'disciplina' | 'fim' | 'pessoal' | 'empresa';

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
    description: { pt: 'Credenciais, actas, cartas e orçamentos.', en: 'Authorisations, minutes, letters and quotes.' },
  },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
