import { describe, expect, it } from 'vitest';
import { getMeta } from '@/features/catalog/catalog';
import { makeLegalSnapshot } from '@/documents/context';
import { GUIDE, GUIDE_START, walk, type GuideNode } from './tree';
import { PROCESSES, processById } from './processes';

function allPaths(node: GuideNode, prefix: string[] = []): { path: string[]; doc: string; process?: string }[] {
  const out: { path: string[]; doc: string; process?: string }[] = [];
  for (const o of node.options) {
    const p = [...prefix, o.id];
    if (o.result) out.push({ path: p, doc: o.result.doc, process: o.result.process });
    else if (o.next) out.push(...allPaths(GUIDE[o.next], p));
  }
  return out;
}

describe('guided assistant', () => {
  const paths = allPaths(GUIDE[GUIDE_START]);

  it('reaches a document in at most 4 taps on every branch', () => {
    expect(paths.length).toBeGreaterThan(20);
    for (const p of paths) expect(p.path.length, p.path.join('/')).toBeLessThanOrEqual(4);
  });

  it('only recommends documents and processes that exist', () => {
    for (const p of paths) {
      expect(getMeta(p.doc), p.doc).toBeTruthy();
      if (p.process) expect(processById(p.process), p.process).toBeTruthy();
    }
  });

  it('walk() follows a path to its result', () => {
    const r = walk(['empresa', 'disciplinar', 'grave']);
    expect(r.result?.doc).toBe('nota-de-culpa');
    expect(r.result?.process).toBe('despedimento-justa-causa');
    expect(walk(['nope']).valid).toBe(false);
  });
});

describe('processes', () => {
  const legal = makeLegalSnapshot();
  it('reference real templates and produce ordered dates', () => {
    for (const p of PROCESSES) {
      for (const s of p.steps) if (s.templateId) expect(getMeta(s.templateId), s.templateId).toBeTruthy();
    }
    const d = processById('despedimento-justa-causa')!;
    const dates = d.steps.map((s) => s.date?.('2026-10-12', legal)?.date).filter(Boolean) as string[];
    expect(dates[0]).toBe('2026-10-12');
    expect(dates).toEqual([...dates].sort());
    // reply deadline = 15 days (from mz-legal)
    expect(d.steps.find((s) => s.id === 'resposta')!.date!('2026-10-12', legal)!.date).toBe('2026-10-27');
  });
});
