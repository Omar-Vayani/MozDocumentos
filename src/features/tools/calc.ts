// Labour calculators. Every legal number comes from src/legal/mz-legal.ts
// through a LegalSnapshot, so user overrides (INSS rates, IRPS table) apply.

import type { LegalSnapshot } from '@/documents/model';
import { irpsWithholding, type IrpsBand } from '@/legal/mz-legal';
import { addDays, addMonths, diffDays, roundMoney, yearsBetween } from '@/lib/format';

// ---------------------------------------------------------------- Net salary

export type NetSalary = {
  gross: number;
  inssWorker: number;
  irps: number | null; // null when the IRPS table is not active and no value was given
  otherDeductions: number;
  net: number;
  inssEmployer: number;
  employerCost: number;
  rateWorker: number;
  rateEmployer: number;
};

export function netSalary(
  legal: LegalSnapshot,
  input: { base: number; allowances?: number; dependants?: number; irpsOverride?: number | null; otherDeductions?: number },
): NetSalary {
  const gross = roundMoney(Math.max(0, input.base) + Math.max(0, input.allowances ?? 0));
  const rateWorker = legal.value<number>('inssTaxaTrabalhador');
  const rateEmployer = legal.value<number>('inssTaxaEmpregador');
  const inssWorker = roundMoney(gross * rateWorker);
  const fromTable = irpsWithholding(legal.table('irpsRetencao') as IrpsBand[], gross, input.dependants ?? 0);
  const irps = input.irpsOverride != null ? input.irpsOverride : fromTable;
  const other = Math.max(0, input.otherDeductions ?? 0);
  const net = roundMoney(gross - inssWorker - (irps ?? 0) - other);
  const inssEmployer = roundMoney(gross * rateEmployer);
  return { gross, inssWorker, irps, otherDeductions: other, net, inssEmployer, employerCost: roundMoney(gross + inssEmployer), rateWorker, rateEmployer };
}

// ---------------------------------------------------------------- Annual leave

export type LeaveEntitlement = { days: number; basis: 'primeiroAno' | 'anosSeguintes' | 'prazoCurto'; serviceMonths: number };

/** Annual leave days for the year that contains `onDate`. */
export function leaveEntitlement(legal: LegalSnapshot, admission: string, onDate: string, shortFixedTerm = false): LeaveEntitlement {
  const f = legal.value<{ primeiroAno: number; anosSeguintes: number; porMesPrazoCurto: number }>('feriasDireito');
  const months = Math.max(0, Math.floor(diffDays(admission, onDate) / 30.4375));
  if (shortFixedTerm) return { days: Math.min(12, months) * f.porMesPrazoCurto, basis: 'prazoCurto', serviceMonths: months };
  const years = yearsBetween(admission, onDate);
  return years < 1
    ? { days: f.primeiroAno, basis: 'primeiroAno', serviceMonths: months }
    : { days: f.anosSeguintes, basis: 'anosSeguintes', serviceMonths: months };
}

// ---------------------------------------------------------------- Resignation notice

export type ResignationNotice = {
  days: number | null; // null when no notice is set by law (e.g. ≤ 6 months on a permanent contract)
  lastDay: string | null;
  serviceMonths: number;
};

export function resignationNotice(legal: LegalSnapshot, admission: string, letterDate: string, fixedTerm: boolean): ResignationNotice {
  const a = legal.value<{ ate3Anos: number; mais3Anos: number; prazo: number; limiarMeses: number; minimoMeses: number }>('avisoPrevioTrabalhador');
  const months = Math.max(0, Math.floor(diffDays(admission, letterDate) / 30.4375));
  let days: number | null;
  if (fixedTerm) days = a.prazo;
  else if (diffDays(addMonths(admission, a.minimoMeses), letterDate) <= 0) days = null;
  else days = diffDays(addMonths(admission, a.limiarMeses), letterDate) > 0 ? a.mais3Anos : a.ate3Anos;
  return { days, lastDay: days != null ? addDays(letterDate, days) : null, serviceMonths: months };
}

// ---------------------------------------------------------------- Non-renewal notice

export type NonRenewal = { days: number | null; notifyBy: string | null; contractMonths: number };

export function nonRenewalNotice(legal: LegalSnapshot, start: string, end: string): NonRenewal {
  const a = legal.value<{ ate1Ano: number; mais1Ano: number; limiarMeses: number; minimoMeses: number }>('naoRenovacaoAviso');
  const months = Math.max(0, Math.round(diffDays(start, end) / 30.4375));
  if (diffDays(addMonths(start, a.minimoMeses), end) < -1) return { days: null, notifyBy: null, contractMonths: months };
  const days = diffDays(addMonths(start, a.limiarMeses), end) > 0 ? a.mais1Ano : a.ate1Ano;
  return { days, notifyBy: addDays(end, -days), contractMonths: months };
}

// ---------------------------------------------------------------- Compensation

export type CompensationKind = 'ilicito' | 'justaCausaTrabalhador' | 'economico';

export type Compensation = {
  daysPerYear: number;
  years: number; // with fraction for part-years
  dailyPay: number;
  amount: number;
};

/**
 * Compensation per year of service, pro rata for part-years. Daily pay = monthly base / 30.
 * For dismissal on economic grounds the days per year depend on how many sector
 * minimum wages the base salary represents.
 */
export function compensation(
  legal: LegalSnapshot,
  input: { kind: CompensationKind; monthlyBase: number; admission: string; end: string; minimumWage?: number | null },
): Compensation {
  let daysPerYear: number;
  if (input.kind === 'ilicito') daysPerYear = legal.value<{ diasPorAno: number }>('indemnizacaoDespedimentoIlicito').diasPorAno;
  else if (input.kind === 'justaCausaTrabalhador') daysPerYear = legal.value<{ indemnizacaoDiasPorAno: number }>('rescisaoJustaCausaTrabalhador').indemnizacaoDiasPorAno;
  else {
    const e = legal.value<{ ate7SM: number; ate18SM: number; mais18SM: number; limite1: number; limite2: number }>('indemnizacaoMotivosEconomicos');
    const ratio = input.minimumWage ? input.monthlyBase / input.minimumWage : 1;
    daysPerYear = ratio <= e.limite1 ? e.ate7SM : ratio <= e.limite2 ? e.ate18SM : e.mais18SM;
  }
  const years = Math.max(0, diffDays(input.admission, input.end) / 365.25);
  const dailyPay = Math.max(0, input.monthlyBase) / 30;
  return { daysPerYear, years, dailyPay: roundMoney(dailyPay), amount: roundMoney(dailyPay * daysPerYear * years) };
}
