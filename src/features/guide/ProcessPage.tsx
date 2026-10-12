import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useL10n, usePrefs } from '@/app/store';
import { makeLegalSnapshot } from '@/documents/context';
import { getMeta } from '@/features/catalog/catalog';
import { legalEntry } from '@/legal/mz-legal';
import { formatDateLong, todayISO, uid } from '@/lib/format';
import { db } from '@/lib/storage/db';
import { useLegalOverrides } from '@/lib/storage/hooks';
import { saveCase } from '@/lib/storage/repo';
import type { Case } from '@/lib/storage/types';
import { Button, ButtonLink } from '@/ui/Button';
import { FieldWrap, TextInput } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Notice, Tag } from '@/ui/misc';
import { processById } from './processes';

export function ProcessPage() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const { t } = useTranslation();
  const L = useL10n();
  const navigate = useNavigate();
  const process = processById(id);
  const caseId = sp.get('processo');
  const caseObj = useLiveQuery(async () => (caseId ? ((await db.cases.get(caseId)) ?? null) : null), [caseId]);
  const overrides = useLegalOverrides();
  const legal = useMemo(() => makeLegalSnapshot(overrides ?? {}), [overrides]);
  const activeProfileId = usePrefs((s) => s.activeProfileId);
  const [start, setStart] = useState(todayISO());
  const [title, setTitle] = useState('');

  if (!process) {
    return (
      <div className="container-page py-10">
        <h1 className="text-3xl font-bold">{t('app.notFound')}</h1>
        <Link to="/">{t('app.backHome')}</Link>
      </div>
    );
  }

  const startDate = caseObj?.startDate ?? start;

  const createCase = async () => {
    const c: Case = {
      id: uid(),
      processId: process.id,
      title: title.trim() || L(process.title),
      startDate: start,
      shared: {},
      docs: {},
      profileId: activeProfileId ?? undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveCase(c);
    setSp({ processo: c.id }, { replace: true });
  };

  const updateStart = async (d: string) => {
    if (caseObj) await saveCase({ ...caseObj, startDate: d });
    else setStart(d);
  };

  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl">
      <p className="text-muted font-semibold">{t('process.title')}</p>
      <h1 className="text-[1.9rem] sm:text-[2.4rem] font-bold mt-1">{caseObj?.title || L(process.title)}</h1>
      <p className="mt-3 text-[1.1rem]">{L(process.summary)}</p>

      <div className="mt-6 p-4 bg-surface border border-border rounded-[var(--radius)] grid gap-4">
        {!caseObj ? (
          <FieldWrap label={t('process.caseTitle')} hint={t('common.optional')}>
            {({ id: fid, describedBy }) => (
              <TextInput id={fid} aria-describedby={describedBy} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L(process.title)} />
            )}
          </FieldWrap>
        ) : null}
        <FieldWrap label={L(process.startLabel)} hint={t('process.startDateHelp')}>
          {({ id: fid, describedBy }) => (
            <TextInput id={fid} aria-describedby={describedBy} type="date" value={startDate} onChange={(e) => void updateStart(e.target.value)} className="max-w-[14rem]" />
          )}
        </FieldWrap>
        {!caseObj ? (
          <div>
            <Button onClick={createCase} iconRight="arrowRight">
              {t('process.startProcess')}
            </Button>
          </div>
        ) : (
          <p className="text-[0.95rem] text-muted">{t('process.shared')}</p>
        )}
      </div>

      <h2 className="text-[1.4rem] font-bold mt-10 mb-3">{t('process.steps')}</h2>
      <ol className="border-l-4 border-primary ml-3">
        {process.steps.map((s, i) => {
          const d = s.date?.(startDate, legal);
          const meta = s.templateId ? getMeta(s.templateId) : undefined;
          const docId = caseObj?.docs?.[s.id];
          const href = s.templateId
            ? `/documentos/${s.templateId}?${new URLSearchParams({
                ...(caseObj ? { processo: caseObj.id, passo: s.id } : {}),
                ...(docId ? { doc: docId } : {}),
              }).toString()}`
            : null;
          return (
            <li key={s.id} className="relative pl-8 pb-8 last:pb-2">
              <span
                className={`absolute -left-[1.15rem] top-0 size-8 rounded-full inline-flex items-center justify-center font-bold border-4 border-bg ${
                  docId ? 'bg-primary text-primary-text' : 'bg-surface-2 text-text'
                }`}
                aria-hidden
              >
                {docId ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <h3 className="text-[1.15rem] font-bold leading-snug">
                {L(s.title)} {s.optional ? <span className="font-normal text-muted">{t('common.optional')}</span> : null}
              </h3>
              {d ? (
                <p className="mt-1 font-semibold inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={18} />
                  {d.kind === 'on' ? formatDateLong(d.date) : d.kind === 'by' ? t('process.by', { date: formatDateLong(d.date) }) : t('process.from', { date: formatDateLong(d.date) })}
                </p>
              ) : null}
              <p className="mt-1">{L(s.description)}</p>
              {s.legalRef ? (
                <p className="text-[0.9rem] text-muted mt-1">
                  {legalEntry(s.legalRef).article ?? ''} {legalEntry(s.legalRef).confidence === 'confirm' ? <Tag tone="amber">{t('editor.confirmValue')}</Tag> : null}
                </p>
              ) : null}
              {href && meta ? (
                <div className="mt-3">
                  <ButtonLink to={href} variant={docId ? 'secondary' : 'primary'} iconRight="arrowRight">
                    {docId ? t('process.edit') : t('process.create')}: {meta.formalTitle}
                  </ButtonLink>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <Notice kind="info" className="mt-6">
        {t('process.estimate')}
      </Notice>

      {caseObj ? (
        <div className="mt-10">
          <Button
            variant="quiet"
            onClick={async () => {
              if (!confirm(t('history.deleteConfirm'))) return;
              await db.cases.delete(caseObj.id);
              navigate('/meus-documentos?tab=cases');
            }}
          >
            {t('process.delete')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
