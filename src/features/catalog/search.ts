import MiniSearch from 'minisearch';
import { normalizeText } from '@/lib/format';
import { CATALOG, type TemplateMeta } from './catalog';

type Doc = {
  id: string;
  title: string;
  formal: string;
  summary: string;
  tags: string;
};

// Words too common to help ranking.
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'um', 'uma', 'para', 'por', 'com', 'em', 'the', 'of', 'to', 'an', 'for', 'and', 'my', 'meu', 'minha']);

function processTerm(term: string): string | null {
  const t = normalizeText(term);
  if (t.length < 2 || STOP.has(t)) return null;
  return t;
}

let index: MiniSearch<Doc> | null = null;

function getIndex(): MiniSearch<Doc> {
  if (index) return index;
  index = new MiniSearch<Doc>({
    fields: ['title', 'formal', 'summary', 'tags'],
    storeFields: ['id'],
    processTerm,
    searchOptions: {
      boost: { title: 3, formal: 2.5, tags: 2, summary: 0.6 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
      processTerm,
    },
  });
  index.addAll(
    CATALOG.map((m) => ({
      id: m.id,
      title: `${m.title.pt} ${m.title.en}`,
      formal: m.formalTitle,
      summary: `${m.summary.pt} ${m.summary.en}`,
      tags: m.tags.join(' '),
    })),
  );
  return index;
}

export function searchCatalog(query: string): TemplateMeta[] {
  const q = query.trim();
  if (!q) return [];
  const res = getIndex().search(q);
  const byId = new Map(CATALOG.map((m) => [m.id, m]));
  return res.map((r) => byId.get(r.id as string)!).filter(Boolean);
}

export { popularDocuments } from './catalog';
