import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePrefs } from '@/app/store';
import { useActiveProfile, useProfiles } from '@/lib/storage/hooks';
import { deleteProfile, formatRef } from '@/lib/storage/repo';
import { profileDisplayName } from '@/lib/storage/types';
import { Button, ButtonLink } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { PageHeader, Tag } from '@/ui/misc';

export function ProfilesPage() {
  const { t } = useTranslation();
  const profiles = useProfiles();
  const active = useActiveProfile();
  const setActive = usePrefs((s) => s.setActiveProfile);

  return (
    <div className="container-page py-8 sm:py-10 max-w-4xl">
      <PageHeader title={t('profiles.title')} intro={t('profiles.intro')} />
      <div className="flex flex-wrap gap-3 mb-8">
        <ButtonLink to="/perfis/novo?tipo=empresa" icon="building">
          {t('profile.createCompany')}
        </ButtonLink>
        <ButtonLink to="/perfis/novo?tipo=pessoa" icon="user" variant="secondary">
          {t('profile.createPerson')}
        </ButtonLink>
        <ButtonLink to="/perfis/novo?tipo=publica" icon="landmark" variant="secondary">
          {t('profile.createPublic')}
        </ButtonLink>
      </div>
      {profiles && profiles.length === 0 ? <p className="text-muted">{t('profile.noneYet')}</p> : null}
      <ul className="border-t border-border">
        {(profiles ?? []).map((p) => (
          <li key={p.id} className="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Icon name={p.kind === 'empresa' ? 'building' : 'user'} size={28} className="text-muted shrink-0 hidden sm:block" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[1.1rem]">
                <Link to={`/perfis/${p.id}`}>
                  {profileDisplayName(p) || (p.kind === 'empresa' ? t('profile.untitledCompany') : t('profile.untitledPerson'))}
                </Link>{' '}
                {active?.id === p.id ? <Tag tone="green">{t('profiles.isActive')}</Tag> : null}
              </p>
              <p className="text-muted text-[0.95rem]">
                {p.tipoEntidade === 'publica' ? t('profile.publica') : p.kind === 'empresa' ? t('profile.empresa') : t('profile.pessoa')}
                {p.nuit ? ` · NUIT ${p.nuit}` : ''} · {t('profiles.nextNumber', { ref: formatRef(p) })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {active?.id !== p.id ? (
                <Button variant="secondary" onClick={() => setActive(p.id)}>
                  {t('profiles.setActive')}
                </Button>
              ) : null}
              <Button
                variant="quiet"
                className="text-error"
                onClick={async () => {
                  if (!confirm(t('profiles.deleteConfirm'))) return;
                  await deleteProfile(p.id);
                  if (active?.id === p.id) setActive(null);
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link to="/pessoas">{t('nav.people')}</Link>
      </p>
    </div>
  );
}
