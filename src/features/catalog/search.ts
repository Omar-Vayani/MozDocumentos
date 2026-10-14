import MiniSearch from 'minisearch';
import { normalizeText } from '@/lib/format';
import { CATALOG, type TemplateMeta } from './catalog';
import { categoryById } from './categories';

type Doc = {
  id: string;
  title: string;
  formal: string;
  summary: string;
  tags: string;
  /** Words of the id and the category name: more ways to reach the document. */
  extra: string;
};

// Words too common to help ranking.
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'um', 'uma', 'para', 'por', 'com', 'em', 'no', 'na', 'the', 'of', 'to', 'an', 'for', 'and', 'my', 'meu', 'minha']);

/**
 * Abbreviations people type, expanded before searching (the abbreviation is
 * kept too, so documents tagged with it still match).
 */
const ABBREVIATIONS: Record<string, string> = {
  pi: 'peticao inicial',
  mp: 'ministerio publico',
  prm: 'policia queixa participacao',
  sernic: 'participacao criminal queixa',
  nda: 'acordo de confidencialidade',
  cv: 'curriculum vitae',
  rh: 'recursos humanos trabalhador',
  sla: 'niveis de servico',
  iva: 'imposto valor acrescentado',
  irps: 'imposto rendimento',
  at: 'autoridade tributaria',
  inss: 'seguranca social',
  duat: 'direito de uso e aproveitamento da terra',
  ugea: 'contratacao publica concurso',
  edm: 'energia electricidade',
  fipag: 'agua',
  ipaj: 'patrocinio assistencia juridica',
  oam: 'ordem dos advogados',
  ong: 'organizacao nao governamental associacao',
};

function processTerm(term: string): string | null {
  const t = normalizeText(term);
  if (t.length < 2 || STOP.has(t)) return null;
  return t;
}

let index: MiniSearch<Doc> | null = null;
let normalised: Map<string, { formal: string; title: string; titleEn: string; tags: string[]; all: string }> | null = null;

function getIndex(): MiniSearch<Doc> {
  if (index) return index;
  index = new MiniSearch<Doc>({
    fields: ['title', 'formal', 'summary', 'tags', 'extra'],
    storeFields: ['id'],
    processTerm,
    searchOptions: {
      boost: { title: 3, formal: 3, tags: 2, extra: 1, summary: 0.6 },
      // Typo tolerance only on longer words: short ones ("pi", "iva") would match noise.
      fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
      prefix: (term) => term.length >= 3,
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
      extra: `${m.id.replace(/-/g, ' ')} ${categoryById(m.category)?.title.pt ?? ''}`,
    })),
  );
  normalised = new Map(
    CATALOG.map((m) => {
      const tags = m.tags.map((t) => normalizeText(t).trim());
      const formal = normalizeText(m.formalTitle);
      const title = normalizeText(m.title.pt);
      const titleEn = normalizeText(m.title.en);
      return [m.id, { formal, title, titleEn, tags, all: [formal, title, titleEn, ...tags].join(' | ') }];
    }),
  );
  return index;
}

/** The query with known abbreviations expanded. */
function expand(q: string): string {
  const words = normalizeText(q).split(/\s+/).filter(Boolean);
  const extra = words.map((w) => ABBREVIATIONS[w]).filter(Boolean);
  return [q, ...extra].join(' ');
}

export function searchCatalog(query: string): TemplateMeta[] {
  const q = query.trim();
  if (!q) return [];
  const idx = getIndex();
  const res = idx.search(expand(q));
  if (!res.length) return [];
  const nq = normalizeText(q).replace(/\s+/g, ' ');
  const terms = nq.split(' ').filter((t) => t.length >= 2 && !STOP.has(t));
  const top = res[0].score;
  const slug = nq.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ids = res.slice(0, 30).map((r) => r.id as string);
  const heads = new Set(ids.filter((id) => ids.some((other) => other.startsWith(`${id}-`))));
  // Re-rank: a document whose formal name or a tag IS the query comes first,
  // then those that contain the whole phrase, then those matching every word.
  const ranked = res.map((r) => {
    const n = normalised!.get(r.id as string)!;
    let bonus = 0;
    if (n.formal === nq) bonus = 3.6;
    else if (n.title === nq || n.titleEn === nq) bonus = 3.3;
    else if (n.tags.includes(nq)) bonus = 3;
    else if (n.formal.startsWith(nq) || n.tags.some((t) => t.startsWith(nq))) bonus = 2;
    else if (nq.length >= 4 && n.all.includes(nq)) bonus = 1.2;
    else if (terms.length > 1 && terms.every((t) => n.all.includes(t))) bonus = 0.6;
    // Among documents sharing a name ("Procuração", "Acta"), the general one — whose id is that name — first.
    if (r.id === slug) bonus += 0.5;
    // The head of a family ("procuracao" for "procuracao-forense", "-sociedade"…) is the general document.
    else if (heads.has(r.id as string)) bonus += 0.35;
    return { id: r.id as string, score: r.score + bonus * top };
  });
  ranked.sort((a, b) => b.score - a.score);
  // Drop the long tail of weak matches (one common word in a summary): with
  // hundreds of documents it buries the useful results.
  const floor = ranked[0].score * 0.12;
  const byId = new Map(CATALOG.map((m) => [m.id, m]));
  return ranked
    .filter((r) => r.score >= floor)
    .slice(0, 80)
    .map((r) => byId.get(r.id)!)
    .filter(Boolean);
}

export { popularDocuments } from './catalog';
