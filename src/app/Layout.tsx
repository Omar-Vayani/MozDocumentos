import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useActiveProfile, useProfiles } from '@/lib/storage/hooks';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { Icon } from '@/ui/Icon';
import { Sheet, Toaster } from '@/ui/misc';
import { OWNER, copyrightLine } from './owner';
import { usePrefs } from './store';

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--primary)" />
      <path d="M19 12h19l9 9v31H19z" fill="#ffffff" />
      <path d="M38 12v9h9z" fill="var(--sun)" />
      <path d="M24 31h17M24 37h17M24 43h11" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex items-center gap-2 no-underline text-text font-bold text-[1.05rem] sm:text-[1.15rem] min-h-12 shrink-0">
      <BrandMark size={32} />
      <span className="tracking-tight">
        {t('app.name')}
      </span>
    </Link>
  );
}

const NAV = [
  { to: '/documentos', key: 'nav.documents' },
  { to: '/assistente', key: 'nav.guide' },
  { to: '/meus-documentos', key: 'nav.history' },
  { to: '/perfis', key: 'nav.profiles' },
  { to: '/ferramentas', key: 'nav.tools' },
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
  // Any navigation (including from the profile picker inside the menu) closes the menu.
  useEffect(() => {
    setMenu(false);
  }, [loc.pathname, loc.search]);
  const inEditor = /^\/documentos\/[^/]+/.test(loc.pathname);

  return (
    <div className="min-h-dvh flex flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-3 focus:bg-focus focus:text-black"
      >
        {t('app.skip')}
      </a>
      <header className="bg-bg">
        <div className="container-page flex items-center gap-2 sm:gap-3 py-2">
          <Brand />
          <nav aria-label="Principal" className="hidden xl:flex items-stretch gap-0.5 ml-4 whitespace-nowrap">
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
              className="xl:hidden min-h-12 px-2 sm:px-3 inline-flex items-center gap-1.5 font-semibold hover:bg-surface rounded-[var(--radius)] cursor-pointer"
              onClick={() => setMenu(true)}
              aria-haspopup="dialog"
            >
              <Icon name="menu" size={22} />
              <span>{t('nav.menu')}</span>
            </button>
          </div>
        </div>
        <div className="moz-band" aria-hidden />
      </header>

      <Sheet open={menu} onOpenChange={setMenu} title={t('nav.menu')}>
        <div className="sm:hidden mb-4">
          <ProfileSwitcher />
        </div>
        <nav aria-label="Menu" className="grid">
          {[{ to: '/', key: 'nav.home' }, ...NAV, { to: '/pessoas', key: 'nav.people' }, { to: '/definicoes', key: 'nav.settings' }, { to: '/sobre', key: 'nav.about' }, { to: '/termos', key: 'nav.terms' }].map(
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
        <footer className="bg-deep text-deep-text mt-20">
          <div className="moz-band" aria-hidden />
          <div className="container-page py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5 font-bold text-[1.1rem]">
                <BrandMark size={28} />
                {t('app.name')}
              </div>
              <p className="mt-3 max-w-md opacity-90">{t('app.disclaimer')}</p>
              <p className="mt-1 max-w-md opacity-75 text-[0.95rem]">{t('app.privacy')}</p>
            </div>
            <nav aria-label={t('nav.footerApp')} className="grid gap-2 content-start">
              <p className="font-semibold opacity-70 text-[0.85rem] uppercase tracking-wider">{t('nav.footerApp')}</p>
              <Link className="text-deep-text" to="/documentos">{t('nav.documents')}</Link>
              <Link className="text-deep-text" to="/ferramentas">{t('nav.tools')}</Link>
              <Link className="text-deep-text" to="/pessoas">{t('nav.people')}</Link>
              <Link className="text-deep-text" to="/definicoes">{t('nav.settings')}</Link>
            </nav>
            <nav aria-label={t('nav.footerLegal')} className="grid gap-2 content-start">
              <p className="font-semibold opacity-70 text-[0.85rem] uppercase tracking-wider">{t('nav.footerLegal')}</p>
              <Link className="text-deep-text" to="/sobre">{t('nav.about')}</Link>
              <Link className="text-deep-text" to="/termos">{t('nav.terms')}</Link>
              <Link className="text-deep-text" to="/privacidade">{t('nav.privacy')}</Link>
            </nav>
          </div>
          <div className="border-t border-white/15">
            <div className="container-page py-4 flex flex-wrap gap-x-6 gap-y-1 text-[0.9rem] opacity-80">
              <span>
                {copyrightLine()}. {t('app.rights')}
              </span>
              <span>{t('app.builtBy', { name: OWNER.name })}</span>
              <span>{t('app.version', { v: OWNER.version })}</span>
            </div>
          </div>
        </footer>
      ) : (
        <p className="sr-only">{t('app.disclaimer')}</p>
      )}
      <Toaster />
    </div>
  );
}
