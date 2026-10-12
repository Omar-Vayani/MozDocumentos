import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useL10n } from '@/app/store';
import { PROCESSES } from '@/features/guide/processes';
import { useActiveProfile, useDocuments } from '@/lib/storage/hooks';
import { ButtonLink } from '@/ui/Button';
import { TextInput } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { SectionTitle } from '@/ui/misc';
import { CATALOG, getMeta, popularDocuments } from './catalog';
import { CATEGORIES } from './categories';
import { DocListItem } from './DocCard';

export function HomePage() {
  const { t } = useTranslation();
  const L = useL10n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const profile = useActiveProfile();
  const docs = useDocuments();
  const recent = (docs ?? []).slice(0, 3);

  return (
    <div className="container-page py-8 sm:py-12">
      <section className="max-w-3xl">
        <h1 className="text-[2rem] sm:text-[2.8rem] font-bold tracking-tight leading-[1.1]">{t('home.title')}</h1>
        <p className="mt-4 text-[1.15rem] text-muted leading-relaxed">{t('home.intro')}</p>

        <form
          role="search"
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/documentos?q=${encodeURIComponent(q)}`);
          }}
        >
          <label htmlFor="home-search" className="block text-[1.2rem] font-bold mb-2">
            {t('home.searchLabel')}
          </label>
          <div className="flex">
            <TextInput
              id="home-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="rounded-r-none text-[1.1rem] min-h-14"
              autoComplete="off"
            />
            <button type="submit" className="min-h-14 min-w-14 px-4 bg-primary text-primary-text inline-flex items-center justify-center rounded-r-[var(--radius-sm)] cursor-pointer" aria-label={t('common.search')}>
              <Icon name="search" size={24} />
            </button>
          </div>
        </form>

        <div className="mt-6 p-5 border-l-[6px] border-primary bg-surface">
          <h2 className="text-[1.25rem] font-bold">{t('home.notSure')}</h2>
          <p className="mt-1">{t('home.notSureText')}</p>
          <ButtonLink to="/assistente" className="mt-4" iconRight="arrowRight">
            {t('home.notSure')}
          </ButtonLink>
        </div>
      </section>

      {profile === null ? (
        <section className="mt-10 max-w-3xl p-5 border-2 border-border-strong">
          <h2 className="text-[1.25rem] font-bold">{t('home.setupTitle')}</h2>
          <p className="mt-1">{t('home.setupText')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink to="/perfis/novo?tipo=empresa" variant="secondary" icon="building">
              {t('profile.createCompany')}
            </ButtonLink>
            <ButtonLink to="/perfis/novo?tipo=pessoa" variant="secondary" icon="user">
              {t('profile.createPerson')}
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {recent.length ? (
        <section className="mt-12" aria-labelledby="recent">
          <SectionTitle id="recent">{t('home.recent')}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-3">
            {recent.map((d) => (
              <li key={d.id}>
                <Link to={`/documentos/${d.templateId}?doc=${d.id}`} className="block p-4 border border-border hover:border-border-strong no-underline text-text h-full">
                  <span className="font-semibold block text-link underline">{d.title}</span>
                  <span className="text-muted text-[0.95rem]">{[d.personName, d.ref].filter(Boolean).join(' · ')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="cats">
        <SectionTitle id="cats">{t('home.categories')}</SectionTitle>
        <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="border-t border-border py-4">
              <h3 className="text-[1.15rem] font-bold">
                <Link to={`/documentos?cat=${c.id}`}>{L(c.title)}</Link>
              </h3>
              <p className="text-muted mt-1 leading-snug">{L(c.description)}</p>
              <p className="text-[0.9rem] text-muted mt-1">{t('catalog.results', { count: CATALOG.filter((m) => m.category === c.id).length })}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="popular">
          <SectionTitle id="popular">{t('home.popular')}</SectionTitle>
          <ul className="border-t border-border">
            {popularDocuments(6).map((m) => (
              <DocListItem key={m.id} m={m} />
            ))}
          </ul>
          <p className="mt-4">
            <Link to="/documentos">{t('home.seeAll')}</Link>
          </p>
        </section>
        <section aria-labelledby="procs">
          <SectionTitle id="procs">{t('home.processes')}</SectionTitle>
          <p className="text-muted mb-3">{t('home.processesText')}</p>
          <ul className="border-t border-border">
            {PROCESSES.map((p) => (
              <li key={p.id} className="border-b border-border py-4">
                <h3 className="text-[1.12rem] font-bold">
                  <Link to={`/processos/${p.id}`}>{L(p.title)}</Link>
                </h3>
                <p className="mt-1 leading-snug">{L(p.summary)}</p>
                <p className="text-[0.9rem] text-muted mt-1">
                  {p.steps
                    .map((s) => (s.templateId ? getMeta(s.templateId)?.formalTitle : null))
                    .filter(Boolean)
                    .join(' → ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
