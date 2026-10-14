import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useL10n, useSectors } from '@/app/store';
import { useActiveProfile } from '@/lib/storage/hooks';
import { ButtonLink } from '@/ui/Button';
import { TextInput } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { PageHeader, SectionTitle } from '@/ui/misc';
import { CATALOG, OUT_OF_SCOPE } from './catalog';
import { CATEGORIES, type CategoryId } from './categories';
import { DocListItem } from './DocCard';
import { popularDocuments, searchCatalog } from './search';
import { isForSectors, orderedCategories } from './sectors';

export function CatalogPage() {
  const { t } = useTranslation();
  const L = useL10n();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const cat = (sp.get('cat') as CategoryId | null) ?? null;
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search field on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const profile = useActiveProfile();
  const sectors = useSectors(profile?.sector);
  const order = orderedCategories(sectors);
  const myCats = sectors.length ? order.map((id) => CATEGORIES.find((c) => c.id === id)!).filter(Boolean) : CATEGORIES;
  const otherCats = sectors.length ? CATEGORIES.filter((c) => !order.includes(c.id)) : [];

  const results = useMemo(() => {
    const base = q.trim() ? searchCatalog(q) : CATALOG;
    return cat ? base.filter((m) => m.category === cat) : base;
  }, [q, cat]);
  // With areas chosen, search results from other areas are listed separately.
  const mineResults = sectors.length && !cat ? results.filter((m) => isForSectors(m, sectors)) : results;
  const otherResults = sectors.length && !cat ? results.filter((m) => !isForSectors(m, sectors)) : [];

  const update = (next: { q?: string; cat?: string | null }) => {
    const p = new URLSearchParams(sp);
    if (next.q !== undefined) (next.q ? p.set('q', next.q) : p.delete('q'));
    if (next.cat !== undefined) (next.cat ? p.set('cat', next.cat) : p.delete('cat'));
    setSp(p, { replace: true });
  };

  const grouped = !q.trim() && !cat;
  // While searching, the category chips show only categories with results, and how many.
  const searchCounts = useMemo(() => {
    if (!q.trim()) return null;
    const counts = new Map<CategoryId, number>();
    for (const m of searchCatalog(q)) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    return counts;
  }, [q]);

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader title={t('catalog.title')} intro={t('catalog.intro')} />

      <div role="search" className="max-w-2xl">
        <label htmlFor="catalog-search" className="block font-bold text-[1.1rem] mb-1">
          {t('catalog.search')}
        </label>
        <p id="catalog-search-hint" className="text-muted mb-2">
          {t('catalog.searchHint')} <kbd className="hidden md:inline-block px-1.5 border border-border rounded text-[0.85rem]">/</kbd>
        </p>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            ref={inputRef}
            id="catalog-search"
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder={t('home.searchPlaceholder')}
            aria-describedby="catalog-search-hint"
            aria-controls="catalog-results"
            className="pl-10 min-h-14 text-[1.05rem]"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('catalog.category')}>
        {[
          { id: null as CategoryId | null, label: t('catalog.all') },
          ...[...myCats, ...otherCats]
            .filter((c) => !searchCounts || searchCounts.has(c.id) || cat === c.id)
            .map((c) => ({ id: c.id as CategoryId | null, label: searchCounts ? `${L(c.title)} (${searchCounts.get(c.id) ?? 0})` : L(c.title) })),
        ].map((c) => {
          const on = cat === c.id;
          return (
            <button
              key={c.id ?? 'all'}
              type="button"
              aria-pressed={on}
              onClick={() => update({ cat: c.id })}
              className={`min-h-11 px-4 rounded-full border font-semibold text-[0.95rem] cursor-pointer transition-colors ${
                on ? 'bg-primary text-primary-text border-primary' : 'bg-bg border-border hover:border-primary hover:text-primary'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div id="catalog-results" className="mt-6" aria-live="polite">
        <p className="text-muted mb-2">{t('catalog.results', { count: results.length })}</p>
        {results.length === 0 ? (
          <div className="py-6 max-w-2xl">
            <p className="text-[1.15rem] font-semibold">{t('catalog.empty', { q })}</p>
            <p className="mt-1">{t('catalog.emptyHelp')}</p>
            <ButtonLink to="/assistente" className="mt-4" iconRight="arrowRight">
              {t('catalog.useGuide')}
            </ButtonLink>
            <SectionTitle className="mt-10">{t('home.popular')}</SectionTitle>
            <ul className="card overflow-hidden">
              {popularDocuments(6).map((m) => (
                <DocListItem key={m.id} m={m} />
              ))}
            </ul>
          </div>
        ) : grouped ? (
          <>
          {myCats.map((c) => (
            <section key={c.id} className="mt-8" aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`} className="text-[1.35rem] font-bold flex items-center gap-2.5">
                <span className="size-9 rounded-[var(--radius)] bg-primary-soft text-primary grid place-items-center">
                  <Icon name={c.icon} size={20} />
                </span>
                {L(c.title)}
              </h2>
              <ul className="card overflow-hidden mt-3 max-w-3xl">
                {results
                  .filter((m) => m.category === c.id)
                  .map((m) => (
                    <DocListItem key={m.id} m={m} />
                  ))}
              </ul>
            </section>
          ))}
          {otherCats.length ? (
            <section className="mt-12 max-w-3xl" aria-labelledby="other-areas">
              <h2 id="other-areas" className="text-[1.35rem] font-bold">
                {t('home.otherAreas')}
              </h2>
              <p className="text-muted mb-3">{t('home.otherAreasText')}</p>
              {otherCats.map((c) => (
                <details key={c.id} className="card mb-2 group">
                  <summary className="cursor-pointer list-none min-h-12 px-4 flex items-center gap-2.5 font-semibold">
                    <Icon name={c.icon} size={18} className="text-muted" />
                    {L(c.title)}
                    <span className="text-muted font-normal text-[0.9rem]">({results.filter((m) => m.category === c.id).length})</span>
                    <Icon name="chevronDown" size={18} className="ml-auto group-open:rotate-180 transition-transform" />
                  </summary>
                  <ul className="border-t border-border">
                    {results
                      .filter((m) => m.category === c.id)
                      .map((m) => (
                        <DocListItem key={m.id} m={m} />
                      ))}
                  </ul>
                </details>
              ))}
            </section>
          ) : null}
          </>
        ) : (
          <>
            {mineResults.length ? (
              <ul className="card overflow-hidden max-w-3xl">
                {mineResults.map((m) => (
                  <DocListItem key={m.id} m={m} />
                ))}
              </ul>
            ) : null}
            {otherResults.length ? (
              <section className="mt-8 max-w-3xl" aria-labelledby="other-results">
                <h2 id="other-results" className="text-[1.2rem] font-bold flex items-center gap-2">
                  <Icon name="layers" size={18} className="text-muted" />
                  {t('catalog.otherResults')}
                </h2>
                <p className="text-muted mb-2 text-[0.95rem]">{t('catalog.otherResultsText')}</p>
                <ul className="card overflow-hidden opacity-95">
                  {otherResults.map((m) => (
                    <DocListItem key={m.id} m={m} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>

      <section className="mt-14 max-w-3xl" aria-labelledby="oos">
        <SectionTitle id="oos">{t('catalog.outOfScope')}</SectionTitle>
        <p className="text-muted mb-3">{t('catalog.outOfScopeText')}</p>
        <ul className="card overflow-hidden divide-y divide-border">
          {OUT_OF_SCOPE.map((o) => (
            <li key={o.title.pt} className="px-4 py-3">
              <p className="font-semibold">{L(o.title)}</p>
              <p className="text-muted">
                {t('catalog.issuer')}:{' '}
                {o.url ? (
                  <a href={o.url} target="_blank" rel="noreferrer">
                    {L(o.issuer)}
                  </a>
                ) : (
                  L(o.issuer)
                )}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link to="/assistente">{t('catalog.useGuide')}</Link>
        </p>
      </section>
    </div>
  );
}
