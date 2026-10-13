import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useL10n, usePrefs, useSectors } from '@/app/store';
import { PROCESSES } from '@/features/guide/processes';
import { useActiveProfile, useDocuments } from '@/lib/storage/hooks';
import { ButtonLink } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { SectionTitle } from '@/ui/misc';
import { CATALOG, getMeta, popularDocuments } from './catalog';
import { CATEGORIES } from './categories';
import { SectorPicker } from './SectorPicker';
import { isForSectors, sectorById } from './sectors';

/** A small paper sheet drawn in CSS: the subject of the app, not decoration. */
function PaperIllustration() {
  return (
    <div aria-hidden className="relative hidden lg:block w-[300px] shrink-0">
      <div className="absolute -right-3 top-6 w-[260px] h-[340px] rounded-[6px] bg-white/10 rotate-[4deg]" />
      <div className="relative w-[260px] h-[340px] rounded-[6px] bg-white text-[#0c1410] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-6 rotate-[-2deg]">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-[5px] bg-[var(--primary)]" />
          <div className="h-2.5 w-28 rounded bg-[#0c1410]/80" />
        </div>
        <div className="mt-2 h-px bg-[var(--primary)]" />
        <div className="mt-5 mx-auto h-2.5 w-36 rounded bg-[#0c1410]" />
        <div className="mt-1.5 mx-auto h-[2px] w-8 bg-[var(--primary)]" />
        <div className="mt-5 space-y-2">
          {[100, 94, 98, 70, 96, 88, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-[#0c1410]/20" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-4 rounded bg-[#e3f0e8] border-l-[3px] border-[var(--primary)] px-2 py-2">
          <div className="h-1.5 w-20 rounded bg-[#0c1410]/30" />
          <div className="mt-1.5 ml-auto h-2.5 w-24 rounded bg-[#0b5a40]" />
        </div>
        <div className="absolute left-6 right-6 bottom-8 flex justify-between items-end">
          <div className="w-24">
            <svg viewBox="0 0 100 30" className="w-full text-[#1d3f6e]">
              <path d="M2 22c10-14 18-14 20-4s8 6 14-6 12 10 20 4 14-8 22-2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <div className="h-px bg-[#0c1410]/60" />
          </div>
          <div className="size-14 rounded-full border-[2.5px] border-[#2f4fa0]/70 grid place-items-center rotate-[-12deg]">
            <div className="size-9 rounded-full border border-[#2f4fa0]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

const QUICK = ['recibo-de-salario', 'contrato-indeterminado', 'declaracao-de-trabalho', 'procuracao', 'contrato-trabalho-domestico'];

export function HomePage() {
  const { t } = useTranslation();
  const L = useL10n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const profile = useActiveProfile();
  const docs = useDocuments();
  const recent = (docs ?? []).slice(0, 3);
  const sectors = useSectors(profile?.sector);
  const asked = usePrefs((s) => s.sectorsAsked);
  const setAsked = usePrefs((s) => s.setSectorsAsked);
  const inMine = (catId: string) => sectors.some((id) => sectorById(id)?.categories.includes(catId as never));
  const myCats = sectors.length ? CATEGORIES.filter((c) => inMine(c.id)) : CATEGORIES;
  const otherCats = sectors.length ? CATEGORIES.filter((c) => !inMine(c.id)) : [];
  const mine = (m: (typeof CATALOG)[number]) => isForSectors(m, sectors);
  const quick = sectors.length ? popularDocuments(200).filter(mine).slice(0, 5).map((m) => m.id) : QUICK;
  const popular = popularDocuments(200).filter(mine).slice(0, 6);
  const showProcesses = !sectors.length || sectors.some((id) => sectorById(id)?.categories.includes('disciplina'));
  const firstArea = sectors[0] ? sectorById(sectors[0]) : undefined;

  return (
    <div>
      <section className="bg-deep text-deep-text relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 hero-pattern opacity-60 pointer-events-none" aria-hidden />
        <div className="container-page relative py-10 sm:py-14 flex gap-12 items-center">
          <div className="flex-1 min-w-0 max-w-2xl">
            <p className="text-[0.85rem] font-semibold tracking-[0.08em] uppercase text-sun">{t('home.eyebrow')}</p>
            <h1 className="mt-3 text-[2.05rem] sm:text-[2.9rem] leading-[1.06]">{t('home.title')}</h1>
            <p className="mt-4 text-[1.1rem] sm:text-[1.15rem] opacity-90 leading-relaxed">{t('home.intro')}</p>

            <form
              role="search"
              className="mt-7"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/documentos?q=${encodeURIComponent(q)}`);
              }}
            >
              <label htmlFor="home-search" className="block text-[1.05rem] font-semibold mb-2">
                {t('home.searchLabel')}
              </label>
              <div className="flex rounded-[var(--radius-md)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] focus-within:outline-3 focus-within:outline-focus">
                <Icon name="search" size={22} className="self-center ml-4 text-[#4a5650] shrink-0" />
                <input
                  id="home-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="flex-1 min-w-0 min-h-14 px-3 text-[1.08rem] bg-transparent text-[#0c1410] placeholder:text-[#5d6a62] outline-none"
                  autoComplete="off"
                />
                <button type="submit" className="m-1.5 px-4 sm:px-5 rounded-[var(--radius)] bg-primary text-primary-text font-semibold cursor-pointer hover:bg-primary-hover">
                  {t('common.search')}
                </button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2" aria-label={t('home.quickLinks')}>
              {quick.map((id) => {
                const m = getMeta(id);
                return m ? (
                  <Link
                    key={id}
                    to={`/documentos/${id}`}
                    className="no-underline text-deep-text text-[0.92rem] px-3 py-1.5 min-h-10 inline-flex items-center rounded-full border border-white/30 hover:bg-white/10"
                  >
                    {m.formalTitle}
                  </Link>
                ) : null;
              })}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/assistente"
                className="no-underline inline-flex items-center gap-2 min-h-12 px-5 rounded-[var(--radius)] bg-sun text-[#1b1400] font-bold hover:brightness-95"
              >
                {t('home.notSure')}
                <Icon name="arrowRight" />
              </Link>
              <span className="opacity-85">{t('home.notSureText')}</span>
            </div>
          </div>
          <PaperIllustration />
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        {!sectors.length && !asked ? (
          <section className="card p-5 sm:p-6 mb-12" aria-labelledby="areas">
            <h2 id="areas" className="text-[1.3rem] font-bold">
              {t('home.areasTitle')}
            </h2>
            <p className="mt-1 mb-4 text-muted max-w-2xl">{t('home.areasText')}</p>
            <SectorPicker />
            <button type="button" className="mt-4 underline text-link cursor-pointer min-h-11" onClick={() => setAsked(true)}>
              {t('home.areasSkip')}
            </button>
          </section>
        ) : sectors.length ? (
          <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.95rem]">
            <span className="text-muted">{t('home.yourAreas')}</span>
            {sectors.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary font-semibold">
                <Icon name={sectorById(id)?.icon ?? 'file'} size={15} />
                {L(sectorById(id)?.title)}
              </span>
            ))}
            <Link to="/definicoes#areas">{t('home.changeAreas')}</Link>
          </p>
        ) : null}

        {profile === null ? (
          <section className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center mb-12 bg-primary-soft border-primary/30">
            <div className="size-12 rounded-full bg-primary text-primary-text grid place-items-center shrink-0">
              <Icon name="building" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-[1.25rem] font-bold">{t('home.setupTitle')}</h2>
              <p className="mt-1 max-w-2xl">{t('home.setupText')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {firstArea ? (
                <ButtonLink to={`/perfis/novo?area=${firstArea.id}`} icon={firstArea.icon}>
                  {t('home.createAreaProfile', { area: L(firstArea.title) })}
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/perfis/novo?tipo=empresa" icon="building">
                    {t('profile.createCompany')}
                  </ButtonLink>
                  <ButtonLink to="/perfis/novo?tipo=pessoa" variant="secondary" icon="user">
                    {t('profile.createPerson')}
                  </ButtonLink>
                </>
              )}
            </div>
          </section>
        ) : null}

        {recent.length ? (
          <section className="mb-12" aria-labelledby="recent">
            <SectionTitle id="recent">{t('home.recent')}</SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-3">
              {recent.map((d) => (
                <li key={d.id}>
                  <Link to={`/documentos/${d.templateId}?doc=${d.id}`} className="card card-link block p-4 no-underline text-text h-full">
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon name="file" size={18} className="text-primary shrink-0" />
                      {d.title}
                    </span>
                    <span className="block text-muted text-[0.95rem] mt-1">{[d.personName, d.ref].filter(Boolean).join(' · ') || '—'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="cats">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-4">
            <SectionTitle id="cats" className="mb-0">
              {sectors.length ? t('home.yourDocuments') : t('home.categories')}
            </SectionTitle>
            <Link to="/documentos" className="shrink-0 max-w-full">
              {t('home.seeAll')}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {myCats.map((c) => (
              <li key={c.id}>
                <Link to={`/documentos?cat=${c.id}`} className="card card-link flex gap-3 p-4 no-underline text-text h-full">
                  <span className="size-10 rounded-[var(--radius)] bg-primary-soft text-primary grid place-items-center shrink-0">
                    <Icon name={c.icon} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-[1.05rem]">{L(c.title)}</span>
                    <span className="block text-muted text-[0.93rem] leading-snug mt-0.5">{L(c.description)}</span>
                    <span className="block text-[0.85rem] text-primary font-semibold mt-1.5">
                      {t('catalog.results', { count: CATALOG.filter((m) => m.category === c.id).length })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/ferramentas" className="card card-link flex gap-3 p-4 no-underline text-text h-full border-dashed">
                <span className="size-10 rounded-[var(--radius)] bg-warning-bg text-warning grid place-items-center shrink-0">
                  <Icon name="calculator" size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[1.05rem]">{t('nav.tools')}</span>
                  <span className="block text-muted text-[0.93rem] leading-snug mt-0.5">{t('home.toolsText')}</span>
                </span>
              </Link>
            </li>
          </ul>
          {otherCats.length ? (
            <div className="mt-8">
              <h3 className="font-bold text-[1.05rem]">{t('home.otherAreas')}</h3>
              <p className="text-muted text-[0.95rem] mb-3">{t('home.otherAreasText')}</p>
              <ul className="flex flex-wrap gap-2">
                {otherCats.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/documentos?cat=${c.id}`}
                      className="no-underline text-text inline-flex items-center gap-2 min-h-10 px-3.5 rounded-full border border-border hover:border-primary hover:text-primary text-[0.93rem]"
                    >
                      <Icon name={c.icon} size={16} className="text-muted" />
                      {L(c.title)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className={`mt-14 grid gap-12 ${showProcesses ? 'lg:grid-cols-2' : ''}`}>
          <section aria-labelledby="popular">
            <SectionTitle id="popular">{t('home.popular')}</SectionTitle>
            <ul className="card divide-y divide-border overflow-hidden">
              {popular.map((m) => (
                <li key={m.id}>
                  <Link to={`/documentos/${m.id}`} className="flex items-center gap-3 px-4 py-3.5 no-underline text-text hover:bg-surface">
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold">{L(m.title)}</span>
                      <span className="block text-muted text-[0.92rem]">{m.formalTitle}</span>
                    </span>
                    <Icon name="chevronRight" className="text-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {showProcesses ? (
          <section aria-labelledby="procs">
            <SectionTitle id="procs">{t('home.processes')}</SectionTitle>
            <p className="text-muted mb-3">{t('home.processesText')}</p>
            <ul className="grid gap-3">
              {PROCESSES.map((p) => (
                <li key={p.id}>
                  <Link to={`/processos/${p.id}`} className="card card-link block p-4 no-underline text-text">
                    <span className="flex items-center gap-2 font-bold text-[1.05rem]">
                      <Icon name="layers" size={18} className="text-primary" />
                      {L(p.title)}
                    </span>
                    <span className="block mt-1 leading-snug text-[0.97rem]">{L(p.summary)}</span>
                    <span className="block text-[0.85rem] text-muted mt-2">
                      {p.steps
                        .map((s) => (s.templateId ? getMeta(s.templateId)?.formalTitle : null))
                        .filter(Boolean)
                        .join(' → ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
