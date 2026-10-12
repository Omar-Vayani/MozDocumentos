import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useL10n } from '@/app/store';
import { getMeta } from '@/features/catalog/catalog';
import { processById } from '@/features/guide/processes';
import { normalizeText, uid } from '@/lib/format';
import { db } from '@/lib/storage/db';
import { useCases, useDocuments } from '@/lib/storage/hooks';
import { saveDocument } from '@/lib/storage/repo';
import type { SavedDocument } from '@/lib/storage/types';
import { ButtonLink } from '@/ui/Button';
import { TextInput } from '@/ui/Field';
import { PageHeader, Tag, toast } from '@/ui/misc';
import { Tabs } from '@/ui/Tabs';

function fmt(ts: number, lang: string) {
  return new Date(ts).toLocaleString(lang === 'en' ? 'en-GB' : 'pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DocRow({ d }: { d: SavedDocument }) {
  const { t, i18n } = useTranslation();
  const meta = getMeta(d.templateId);
  const duplicate = async () => {
    const copy: SavedDocument = { ...d, id: uid(), status: 'draft', ref: undefined, values: { ...d.values, ref: '' }, createdAt: Date.now(), updatedAt: Date.now() };
    await saveDocument(copy);
    toast(t('common.saved'));
  };
  const remove = async () => {
    if (!confirm(t('history.deleteConfirm'))) return;
    await db.documents.delete(d.id);
  };
  return (
    <li className="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[1.08rem]">
          <Link to={`/documentos/${d.templateId}?doc=${d.id}${d.caseId ? `&processo=${d.caseId}` : ''}`}>{d.title}</Link>
        </p>
        <p className="text-muted text-[0.95rem]">
          {[meta?.formalTitle, d.personName, d.ref].filter(Boolean).join(' · ')}
        </p>
        <p className="text-muted text-[0.85rem]">{t('history.updated', { date: fmt(d.updatedAt, i18n.language) })}</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        <Tag tone={d.status === 'final' ? 'green' : 'neutral'}>{d.status === 'final' ? t('editor.final') : t('editor.draft')}</Tag>
        <button type="button" onClick={duplicate} className="underline text-link min-h-10 px-2 cursor-pointer">
          {t('history.duplicate')}
        </button>
        <button type="button" onClick={remove} className="underline text-error min-h-10 px-2 cursor-pointer">
          {t('history.delete')}
        </button>
      </div>
    </li>
  );
}

export function HistoryPage() {
  const { t } = useTranslation();
  const L = useL10n();
  const [sp, setSp] = useSearchParams();
  const docs = useDocuments();
  const cases = useCases();
  const [q, setQ] = useState('');
  const tab = sp.get('tab') ?? 'drafts';

  const filter = (list: SavedDocument[]) => {
    const n = normalizeText(q.trim());
    if (!n) return list;
    return list.filter((d) => normalizeText([d.title, d.personName, d.ref, getMeta(d.templateId)?.formalTitle].filter(Boolean).join(' ')).includes(n));
  };
  const drafts = filter((docs ?? []).filter((d) => d.status === 'draft'));
  const finals = filter((docs ?? []).filter((d) => d.status === 'final'));

  const list = (items: SavedDocument[]) =>
    items.length ? (
      <ul className="border-t border-border">
        {items.map((d) => (
          <DocRow key={d.id} d={d} />
        ))}
      </ul>
    ) : (
      <div className="py-6">
        <p className="text-muted">{t('history.empty')}</p>
        <ButtonLink to="/documentos" className="mt-4" variant="secondary">
          {t('home.seeAll')}
        </ButtonLink>
      </div>
    );

  return (
    <div className="container-page py-8 sm:py-10 max-w-4xl">
      <PageHeader title={t('history.title')} intro={t('history.intro')} />
      <div className="max-w-md mb-4">
        <label htmlFor="hist-q" className="sr-only">
          {t('history.search')}
        </label>
        <TextInput id="hist-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('history.search')} />
      </div>
      <Tabs
        label={t('history.title')}
        value={tab}
        onValueChange={(v) => setSp({ tab: v }, { replace: true })}
        tabs={[
          { value: 'drafts', label: `${t('history.drafts')} (${drafts.length})`, content: list(drafts) },
          { value: 'finals', label: `${t('history.finals')} (${finals.length})`, content: list(finals) },
          {
            value: 'cases',
            label: `${t('history.cases')} (${cases?.length ?? 0})`,
            content: cases?.length ? (
              <ul className="border-t border-border">
                {cases.map((c) => {
                  const p = processById(c.processId);
                  return (
                    <li key={c.id} className="border-b border-border py-4">
                      <p className="font-bold">
                        <Link to={`/processos/${c.processId}?processo=${c.id}`}>{c.title}</Link>
                      </p>
                      <p className="text-muted text-[0.95rem]">
                        {p ? L(p.title) : ''} · {Object.keys(c.docs ?? {}).length}/{p?.steps.filter((s) => s.templateId).length ?? 0}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted py-6">{t('history.empty')}</p>
            ),
          },
        ]}
      />
    </div>
  );
}
