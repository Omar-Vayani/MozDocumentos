import { describe, expect, it } from 'vitest';
import { makeLegalSnapshot } from '@/documents/context';
import { IRPS_REFERENCE_TABLE } from '@/legal/mz-legal';
import { compensation, leaveEntitlement, netSalary, nonRenewalNotice, resignationNotice } from './calc';

const legal = makeLegalSnapshot();

describe('net salary', () => {
  it('applies INSS and leaves IRPS empty when the table is off', () => {
    const r = netSalary(legal, { base: 30000, allowances: 2000 });
    expect(r.gross).toBe(32000);
    expect(r.inssWorker).toBe(960);
    expect(r.irps).toBeNull();
    expect(r.net).toBe(31040);
    expect(r.inssEmployer).toBe(1280);
    expect(r.employerCost).toBe(33280);
  });
  it('uses the IRPS table when it is active', () => {
    const r = netSalary(makeLegalSnapshot({ irpsTable: IRPS_REFERENCE_TABLE }), { base: 30000, dependants: 0 });
    // band from 22 250: 200 + 15% × (30 000 − 22 250) = 1 362,50
    expect(r.irps).toBe(1362.5);
    expect(r.net).toBe(30000 - 900 - 1362.5);
  });
  it('honours an IRPS override', () => {
    expect(netSalary(legal, { base: 10000, irpsOverride: 100 }).net).toBe(10000 - 300 - 100);
  });
});

describe('leave', () => {
  it('gives the first-year and later-year entitlement', () => {
    expect(leaveEntitlement(legal, '2026-03-01', '2026-10-12').days).toBe(12);
    expect(leaveEntitlement(legal, '2024-03-01', '2026-10-12').days).toBe(30);
    expect(leaveEntitlement(legal, '2026-04-12', '2026-10-12', true).days).toBe(6);
  });
});

describe('resignation notice', () => {
  it('depends on seniority and contract type', () => {
    expect(resignationNotice(legal, '2026-06-01', '2026-10-12', false).days).toBeNull();
    expect(resignationNotice(legal, '2025-01-01', '2026-10-12', false).days).toBe(15);
    expect(resignationNotice(legal, '2020-01-01', '2026-10-12', false)).toMatchObject({ days: 30, lastDay: '2026-11-11' });
    expect(resignationNotice(legal, '2026-06-01', '2026-10-12', true).days).toBe(30);
  });
});

describe('non-renewal', () => {
  it('gives 15 days up to a year and 30 above', () => {
    expect(nonRenewalNotice(legal, '2026-01-01', '2026-12-31')).toMatchObject({ days: 15, notifyBy: '2026-12-16' });
    expect(nonRenewalNotice(legal, '2025-01-01', '2026-06-30').days).toBe(30);
    expect(nonRenewalNotice(legal, '2026-10-01', '2026-11-30').days).toBeNull();
  });
});

describe('compensation', () => {
  it('computes 45 days per year for unlawful dismissal, pro rata', () => {
    const r = compensation(legal, { kind: 'ilicito', monthlyBase: 30000, admission: '2020-10-12', end: '2026-10-12' });
    expect(r.daysPerYear).toBe(45);
    expect(r.dailyPay).toBe(1000);
    expect(Math.round(r.amount)).toBe(Math.round(1000 * 45 * (2191 / 365.25)));
  });
  it('scales days per year by minimum wages on economic grounds', () => {
    const base = { kind: 'economico' as const, admission: '2020-01-01', end: '2021-01-01', minimumWage: 10000 };
    expect(compensation(legal, { ...base, monthlyBase: 50000 }).daysPerYear).toBe(30);
    expect(compensation(legal, { ...base, monthlyBase: 150000 }).daysPerYear).toBe(15);
    expect(compensation(legal, { ...base, monthlyBase: 250000 }).daysPerYear).toBe(5);
  });
});
