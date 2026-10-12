import { describe, expect, it } from 'vitest';
import { searchCatalog } from './search';

const top3 = (q: string) => searchCatalog(q).slice(0, 3).map((m) => m.id);

describe('catalogue search', () => {
  it('finds dismissal documents for "despedir"', () => {
    const ids = top3('despedir');
    expect(ids.some((id) => ['nota-de-culpa', 'decisao-disciplinar'].includes(id))).toBe(true);
  });

  it('is accent- and case-insensitive', () => {
    expect(top3('rescisao')).toContain('rescisao-pelo-trabalhador');
    expect(top3('rescisão')).toContain('rescisao-pelo-trabalhador');
    expect(top3('RESCISAO')).toContain('rescisao-pelo-trabalhador');
  });

  it('understands English terms', () => {
    expect(top3('payslip')[0]).toBe('recibo-de-salario');
    expect(top3('power of attorney')).toContain('procuracao');
  });

  it('matches common speech and prefixes', () => {
    expect(top3('talão')).toContain('recibo-de-salario');
    expect(top3('mandar embora').some((id) => ['nota-de-culpa', 'decisao-disciplinar'].includes(id))).toBe(true);
    expect(top3('procur')).toContain('procuracao');
  });

  it('tolerates small typos', () => {
    expect(top3('procuraçao')).toContain('procuracao');
    expect(top3('arrendamneto')).toContain('contrato-de-arrendamento');
  });
});
