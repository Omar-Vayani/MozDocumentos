import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useActiveProfile, useProfiles } from '@/lib/storage/hooks';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { Icon } from '@/ui/Icon';
import { Sheet, Toaster } from '@/ui/misc';
import { usePrefs } from './store';

function Brand() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex items-center gap-2 no-underline text-text font-bold text-[1.05rem] sm:text-[1.15rem] min-h-12 shrink-0">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="5" fill="var(--primary)" />
        <path d="M20 14h17l9 9v27H20z" fill="var(--bg)" />
        <path d="M25 32h16M25 38h16M25 44h10" stroke="var(--primary)" strokeWidth="3" />
      </svg>
      <span>{t('app.name')}</span>
    </Link>
  );
}

const NAV = [
  { to: '/documentos', key: 'nav.documents' },
  { to: '/assistente', key: 'nav.guide' },
  { to: '/meus-documentos', key: 'nav.history' },
  { to: '/perfis', key: 'nav.profiles' },
] as const;

function profileLabel(p: Profile, t: (k: string) => string) {
  return profileDisplayName(p) || (p.kind === 'empresa' ? t('profile.untitledCompany') : t('profile.untitledPerson'));
}

function ProfileSwitcher() {
  const { t } = useTranslation();
  const profiles = useProfiles();
  const active = useActiveProfile();
  const setActive = usePrefs((s) => s.setActiveProfile);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 min-h-12 px-3 border border-border rounded-[var(--radius)] hover:bg-surface max-w-[13rem] cursor-pointer"
        aria-label={`${t('profile.active')}: ${active ? profileLabel(active, t) : t('profile.none')}`}
      >
        <Icon name={active?.kind === 'pessoa' ? 'user' : 'building'} size={18} />
        <span className="truncate text-[0.95rem]">{active ? profileLabel(active, t) : t('profile.none')}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={t('profile.choose')}>
        <ul className="space-y-0.5">
          {(profiles ?? []).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full text-left flex items-center gap-2 min-h-12 px-2 rounded hover:bg-surface cursor-pointer"
                onClick={() => {
                  setActive(p.id);
                  setOpen(false);
                }}
                aria-current={active?.id === p.id ? 'true' : undefined}
              >
                <Icon name={p.kind === 'pessoa' ? 'user' : 'building'} size={18} />
                <span className="flex-1 truncate">{profileLabel(p, t)}</span>
                {active?.id === p.id ? <Icon name="check" size={18} className="text-primary" /> : null}
              </button>
            </li>
          ))}
        </ul>
        {profiles && profiles.length === 0 ? <p className="py-2 text-muted">{t('profile.noneYet')}</p> : null}
        <div className="border-t border-border mt-3 pt-3 grid gap-1">
          <button type="button" className="text-left min-h-12 px-2 rounded hover:bg-surface flex items-center gap-2 cursor-pointer" onClick={() => go('/perfis/novo?tipo=empresa')}>
            <Icon name="plus" size={18} /> {t('profile.createCompany')}
          </button>
          <button type="button" className="text-left min-h-12 px-2 rounded hover:bg-surface flex items-center gap-2 cursor-pointer" onClick={() => go('/perfis/novo?tipo=pessoa')}>
            <Icon name="plus" size={18} /> {t('profile.createPerson')}
          </button>
          <Link to="/perfis" onClick={() => setOpen(false)} className="min-h-12 px-2 flex items-center">
            {t('profile.manage')}
          </Link>
        </div>
      </Sheet>
    </>
  );
}

function LangSwitch({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
      className={`min-h-12 px-3 inline-flex items-center gap-1.5 hover:bg-surface rounded-[var(--radius)] cursor-pointer ${className}`}
      aria-label={t('nav.switchToLabel')}
      lang={lang === 'pt' ? 'en' : 'pt'}
    >
      <Icon name="globe" size={18} />
      <span className="font-semibold">{t('nav.switchTo')}</span>
    </button>
  );
}

function NavItem({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `no-underline text-text min-h-12 inline-flex items-center px-3 border-b-4 ${
          isActive ? 'border-primary font-semibold' : 'border-transparent hover:border-border'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const inEditor = /^\/documentos\/[^/]+/.test(loc.pathname);

  return (
    <div className="min-h-dvh flex flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-3 focus:bg-focus focus:text-black"
      >
        {t('app.skip')}
      </a>
      <header className="border-b-[6px] border-primary bg-bg">
        <div className="container-page flex items-center gap-2 sm:gap-3 py-2">
          <Brand />
          <nav aria-label="Principal" className="hidden lg:flex items-stretch gap-1 ml-4">
            {NAV.map((n) => (
              <NavItem key={n.to} to={n.to}>
                {t(n.key)}
              </NavItem>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden sm:block">
              <ProfileSwitcher />
            </div>
            <div className="hidden md:block">
              <LangSwitch />
            </div>
            <button
              type="button"
              className="lg:hidden min-h-12 px-2 sm:px-3 inline-flex items-center gap-1.5 font-semibold hover:bg-surface rounded-[var(--radius)] cursor-pointer"
              onClick={() => setMenu(true)}
              aria-haspopup="dialog"
            >
              <Icon name="menu" size={22} />
              <span>{t('nav.menu')}</span>
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menu} onOpenChange={setMenu} title={t('nav.menu')}>
        <div className="sm:hidden mb-4">
          <ProfileSwitcher />
        </div>
        <nav aria-label="Menu" className="grid">
          {[{ to: '/', key: 'nav.home' }, ...NAV, { to: '/pessoas', key: 'nav.people' }, { to: '/definicoes', key: 'nav.settings' }, { to: '/sobre', key: 'nav.about' }].map(
            (n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setMenu(false)}
                className={({ isActive }) =>
                  `min-h-14 flex items-center px-3 border-l-4 text-[1.1rem] no-underline text-text ${
                    isActive ? 'border-primary font-semibold bg-surface' : 'border-transparent'
                  }`
                }
              >
                {t(n.key)}
              </NavLink>
            ),
          )}
        </nav>
        <div className="mt-4 border-t border-border pt-3">
          <LangSwitch />
        </div>
      </Sheet>

      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      {!inEditor ? (
        <footer className="border-t-2 border-primary bg-surface mt-16">
          <div className="container-page py-8 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="font-semibold">{t('app.disclaimer')}</p>
              <p className="text-muted mt-1">{t('app.privacy')}</p>
            </div>
            <nav aria-label="Rodapé" className="flex flex-wrap gap-x-5 gap-y-2 items-start">
              <Link to="/sobre">{t('nav.about')}</Link>
              <Link to="/pessoas">{t('nav.people')}</Link>
              <Link to="/definicoes">{t('nav.settings')}</Link>
            </nav>
          </div>
        </footer>
      ) : (
        <p className="sr-only">{t('app.disclaimer')}</p>
      )}
      <Toaster />
    </div>
  );
}
