import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useL10n } from '@/app/store';
import { isTemplateAvailable } from '@/documents/registry';
import { Icon } from '@/ui/Icon';
import { Tag } from '@/ui/misc';
import type { TemplateMeta } from './catalog';

export function DocListItem({ m, headingLevel = 3 }: { m: TemplateMeta; headingLevel?: 2 | 3 }) {
  const L = useL10n();
  const { t } = useTranslation();
  const available = isTemplateAvailable(m.id);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <li className="relative border-b border-border last:border-b-0 hover:bg-surface transition-colors">
      <div className="py-4 px-4 flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <H className="text-[1.12rem] font-bold leading-snug">
            {available ? (
              <Link to={`/documentos/${m.id}`} className="no-underline text-text hover:underline after:absolute after:inset-0">
                {L(m.title)}
              </Link>
            ) : (
              <span className="text-muted">{L(m.title)}</span>
            )}
          </H>
          {m.formalTitle !== L(m.title) ? <p className="text-muted text-[0.95rem]">{m.formalTitle}</p> : null}
          <p className="mt-1 leading-snug">{L(m.summary)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag>{m.audience === 'empresa' ? t('catalog.forCompany') : m.audience === 'pessoa' ? t('catalog.forPerson') : t('catalog.forBoth')}</Tag>
            {!available ? <Tag tone="amber">{t('catalog.soon')}</Tag> : null}
          </div>
        </div>
        {available ? <Icon name="chevronRight" className="mt-1 shrink-0 text-muted" /> : null}
      </div>
    </li>
  );
}
