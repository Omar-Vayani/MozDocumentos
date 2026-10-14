import { describe, expect, it } from 'vitest';
import { normalizeText } from '@/lib/format';
import { CATALOG } from './catalog';
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

describe('every document is easy to find', () => {
  it('has enough search tags', () => {
    const few = CATALOG.filter((m) => m.tags.length < 8).map((m) => `${m.id} (${m.tags.length})`);
    expect(few, 'documents with fewer than 8 tags').toEqual([]);
  });

  it('comes first for its formal name (among documents that share it)', () => {
    const norm = (s: string) => normalizeText(s).trim();
    const missed = CATALOG.filter((m) => {
      const same = CATALOG.filter((x) => norm(x.formalTitle) === norm(m.formalTitle)).length;
      return !searchCatalog(m.formalTitle).slice(0, same).some((r) => r.id === m.id);
    }).map((m) => `${m.id} ← "${m.formalTitle}" → ${searchCatalog(m.formalTitle)[0]?.id}`);
    expect(missed).toEqual([]);
  });

  it('is in the top 3 for its plain title (PT and EN)', () => {
    const missed = CATALOG.flatMap((m) =>
      [m.title.pt, m.title.en].filter((t) => !top3(t).includes(m.id)).map((t) => `${m.id} ← "${t}"`),
    );
    expect(missed).toEqual([]);
  });

  it('finds documents lawyers search by name', () => {
    expect(top3('participação criminal')[0]).toBe('participacao-criminal');
    expect(top3('participacao criminal')[0]).toBe('participacao-criminal');
    expect(top3('queixa crime')).toContain('queixa-crime');
    expect(top3('PI')).toContain('peticao-inicial');
  });
});
