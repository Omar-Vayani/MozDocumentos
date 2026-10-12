import { describe, expect, it } from 'vitest';
import {
  addDays, addMonths, addWorkingDays, formatDateLong, formatDateShort, formatMoney,
  normalizeText, parseMoney, yearsBetween,
} from './index';

describe('money', () => {
  it('formats meticais in Mozambican style', () => {
    expect(formatMoney(15000)).toBe('15.000,00 MT');
    expect(formatMoney(1234567.891)).toBe('1.234.567,89 MT');
    expect(formatMoney(0.5)).toBe('0,50 MT');
    expect(formatMoney(null)).toBe('________ MT');
  });
  it('parses common inputs', () => {
    expect(parseMoney('15.000,50')).toBe(15000.5);
    expect(parseMoney('15000.5')).toBe(15000.5);
    expect(parseMoney('15.000')).toBe(15000);
    expect(parseMoney('15 000 MT')).toBe(15000);
    expect(parseMoney('15,000.25')).toBe(15000.25);
    expect(parseMoney('1.234.567')).toBe(1234567);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });
});

describe('dates', () => {
  it('formats dates with capitalised months', () => {
    expect(formatDateLong('2026-10-12')).toBe('12 de Outubro de 2026');
    expect(formatDateShort('2026-03-05')).toBe('05/03/2026');
    expect(formatDateLong('')).toContain('___');
  });
  it('does date arithmetic', () => {
    expect(addDays('2026-10-12', 15)).toBe('2026-10-27');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addWorkingDays('2026-10-09', 1)).toBe('2026-10-12'); // Friday → Monday
    expect(yearsBetween('2020-10-13', '2026-10-12')).toBe(5);
    expect(yearsBetween('2020-10-12', '2026-10-12')).toBe(6);
  });
});

describe('normalizeText', () => {
  it('strips accents and case', () => {
    expect(normalizeText('RESCISÃO')).toBe('rescisao');
    expect(normalizeText('Infracção')).toBe('infraccao');
  });
});
