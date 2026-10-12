import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { usePrefs, useL10n } from '@/app/store';
import { buildBlocks, buildContext, defaultValues, editableTexts } from '@/documents/context';
import type { Values, Warning } from '@/documents/model';
import { isTemplateAvailable, loadTemplate, type FullTemplate } from '@/documents/registry';
import type { RenderInput } from '@/documents/render/types';
import { getMeta, type TemplateMeta } from '@/features/catalog/catalog';
import { processById, isSharedKey } from '@/features/guide/processes';
import { LAWS, legalEntry, type LegalOverrides } from '@/legal/mz-legal';
import { formatDateLong, todayISO, uid } from '@/lib/format';
import { db } from '@/lib/storage/db';
import { useActiveProfile, useLegalOverrides, useProfiles } from '@/lib/storage/hooks';
import { brandingAssets, commitRef, formatRef, saveCase, saveDocument } from '@/lib/storage/repo';
import { profileDisplayName, type Case, type Profile, type SavedDocument } from '@/lib/storage/types';
import { Button } from '@/ui/Button';
import { Checkbox, Select, TextArea } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Notice, Spinner, Tag, toast, useMediaQuery } from '@/ui/misc';
import { Tabs } from '@/ui/Tabs';
import { SectionFields, fieldDomId } from './FormFields';
import { PdfPreview } from './PdfPreview';
import { canShareFiles, downloadPdf, fontBase, pdfFileName, printPdf, sharePdf } from './pdfClient';
import { buildSchema } from './schema';
import { usePdfRender } from './useRender';

// ---------------------------------------------------------------------------
// Route wrapper: loads the template, the saved document and the case.
// ---------------------------------------------------------------------------

export function EditorPage() {
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const { t } = useTranslation();
  const L = useL10n();
  const meta = getMeta(id);
  const docId = sp.get('doc');
  const caseId = sp.get('processo');
  const stepId = sp.get('passo');
  const [template, setTemplate] = useState<FullTemplate | null>(null);
  const [loadError, setLoadError] = useState(false);
  const activeProfile = useActiveProfile();
  const legal = useLegalOverrides();
  const saved = useLiveQuery(async () => (docId ? ((await db.documents.get(docId)) ?? null) : null), [docId]);
  const caseObj = useLiveQuery(async () => (caseId ? ((await db.cases.get(caseId)) ?? null) : null), [caseId]);
  const savedProfile = useLiveQuery(async () => (saved?.profileId ? ((await db.profiles.get(saved.profileId)) ?? null) : null), [saved?.profileId]);

  useEffect(() => {
    if (!meta || !isTemplateAvailable(id)) return;
    let ok = true;
    loadTemplate(id)
      .then((tpl) => ok && setTemplate(tpl))
      .catch(() => ok && setLoadError(true));
    return () => {
      ok = false;
    };
  }, [id, meta]);

  useEffect(() => {
    if (meta) document.title = `${L(meta.title)} — ${t('app.name')}`;
  }, [meta, L, t]);

  if (!meta) {
    return (
      <div className="container-page py-10">
        <h1 className="text-3xl font-bold">{t('app.notFound')}</h1>
        <p className="mt-3">
          <Link to="/documentos">{t('editor.back')}</Link>
        </p>
      </div>
    );
  }
  if (!isTemplateAvailable(id) || loadError) {
    return (
      <div className="container-page py-10 max-w-3xl">
        <p className="text-muted">{meta.formalTitle}</p>
        <h1 className="text-3xl font-bold mt-1">{L(meta.title)}</h1>
        <Notice kind="info" className="mt-6" title={t('editor.notAvailable')} />
        <p className="mt-6">
          <Link to="/documentos">{t('editor.back')}</Link>
        </p>
      </div>
    );
  }

  const ready =
    template && activeProfile !== undefined && legal !== undefined && saved !== undefined && caseObj !== undefined && (saved?.profileId ? savedProfile !== undefined : true);
  if (!ready) {
    return (
      <div className="container-page py-16 flex justify-center">
        <Spinner label={t('app.loading')} />
      </div>
    );
  }

  const issuer = (saved?.profileId ? savedProfile : null) ?? activeProfile ?? null;
  return (
    <EditorForm
      key={`${id}-${docId ?? 'new'}-${caseId ?? ''}-${stepId ?? ''}`}
      template={template!}
      initialProfile={issuer}
      saved={saved ?? null}
      caseObj={caseObj ?? null}
      stepId={stepId}
      legal={legal!}
    />
  );
}

// ---------------------------------------------------------------------------

type FormProps = {
  template: FullTemplate;
  initialProfile: Profile | null;
  saved: SavedDocument | null;
  caseObj: Case | null;
  stepId: string | null;
  legal: LegalOverrides;
};

function collectErrors(errors: FieldErrors, prefix = ''): { name: string; message: string }[] {
  const out: { name: string; message: string }[] = [];
  for (const [k, v] of Object.entries(errors)) {
    if (!v) continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if (typeof (v as { message?: unknown }).message === 'string') out.push({ name, message: (v as { message: string }).message });
    else if (typeof v === 'object') out.push(...collectErrors(v as FieldErrors, name));
  }
  return out;
}

function EditorForm({ template, initialProfile, saved, caseObj, stepId, legal }: FormProps) {
  const { t } = useTranslation();
  const L = useL10n();
  const lang = usePrefs((s) => s.lang);
  const readingAid = usePrefs((s) => s.readingAid);
  const setReadingAid = usePrefs((s) => s.setReadingAid);
  const profiles = useProfiles();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const today = useMemo(() => todayISO(), []);

  const [profileId, setProfileId] = useState<string | null>(saved?.profileId ?? initialProfile?.id ?? null);
  const liveProfile = useLiveQuery(async () => (profileId ? ((await db.profiles.get(profileId)) ?? null) : null), [profileId]);
  const profile: Profile | null = liveProfile === undefined ? initialProfile : liveProfile;

  const process = caseObj ? processById(caseObj.processId) : undefined;
  const step = process?.steps.find((s) => s.id === stepId);

  // Initial values: template defaults ⊕ case data ⊕ step prefill ⊕ saved document.
  const initialValues = useMemo<Values>(() => {
    const defaults = defaultValues(template, {
      profile: initialProfile,
      today,
      nextRef: initialProfile ? formatRef(initialProfile) : '',
    });
    if (saved) return { ...defaults, ...saved.values };
    const fromCase = caseObj ? Object.fromEntries(Object.entries(caseObj.shared).filter(([k]) => k in defaults)) : {};
    const prefill = step?.prefill && caseObj ? step.prefill(caseObj.startDate) : {};
    const filtered = Object.fromEntries(Object.entries(prefill).filter(([k]) => k in defaults));
    return { ...defaults, ...fromCase, ...filtered };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schema = useMemo(() => buildSchema(template.fields, lang), [template, lang]);
  const methods = useForm<Values>({ defaultValues: initialValues, resolver: zodResolver(schema), mode: 'onTouched' });
  const values = useWatch({ control: methods.control }) as Values;
  const valuesKey = JSON.stringify(values);

  const [overrides, setOverrides] = useState<Record<string, string>>(saved?.overrides ?? {});
  const [bilingual, setBilingual] = useState<boolean>(Boolean(saved?.values?.__bilingual));
  const [status, setStatus] = useState<SavedDocument['status']>(saved?.status ?? 'draft');
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved'>(saved ? 'saved' : 'idle');
  const [errorList, setErrorList] = useState<{ name: string; message: string }[]>([]);
  const [tab, setTab] = useState('fill');
  const docIdRef = useRef(saved?.id ?? uid());
  const createdAt = useRef(saved?.createdAt ?? Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);

  // Template context (computed values, warnings, editable paragraphs).
  const ctx = useMemo(
    () => buildContext(template, values, profile, legal, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template, valuesKey, profile, legal, today],
  );
  const warnings: Warning[] = useMemo(() => {
    try {
      return template.warnings?.(values, ctx) ?? [];
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);
  const blocks = useMemo(() => {
    try {
      return buildBlocks(template, ctx);
    } catch {
      return [];
    }
  }, [template, ctx]);
  const texts = useMemo(() => editableTexts(blocks), [blocks]);

  // Images for the profile's branding.
  const [assets, setAssets] = useState<RenderInput['assets'] | null>(null);
  const brandingKey = JSON.stringify(profile?.branding ?? null);
  useEffect(() => {
    let ok = true;
    brandingAssets(profile).then((a) => ok && setAssets(a));
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandingKey, profile?.id]);

  const renderInput: RenderInput | null = useMemo(
    () =>
      assets
        ? {
            templateId: template.id,
            values,
            overrides,
            profile,
            assets,
            legalOverrides: legal,
            bilingual: Boolean(template.bilingual && bilingual),
            today,
            fontBase: fontBase(),
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, valuesKey, overrides, profile, legal, bilingual, today, template],
  );
  const renderKey = `${valuesKey}|${JSON.stringify(overrides)}|${JSON.stringify(profile)}|${Object.keys(assets ?? {}).join(',')}|${bilingual}|${JSON.stringify(legal)}`;
  const { pdf, busy, error, current } = usePdfRender(renderInput, renderKey);

  // ------------------------------------------------------------------ Save
  const persist = async (nextStatus = status) => {
    const v: Values = { ...(methods.getValues() as Values), __bilingual: bilingual };
    const doc: SavedDocument = {
      id: docIdRef.current,
      templateId: template.id,
      profileId: profile?.id,
      caseId: caseObj?.id,
      status: nextStatus,
      ref: typeof v.ref === 'string' ? v.ref : undefined,
      title: L(template.title),
      personName: template.personName?.(v) || undefined,
      values: v,
      overrides,
      createdAt: createdAt.current,
      updatedAt: Date.now(),
    };
    await saveDocument(doc);
    if (caseObj) {
      const shared = { ...caseObj.shared };
      for (const [k, val] of Object.entries(v)) if (isSharedKey(k) && val !== '' && val != null) shared[k] = val;
      await saveCase({ ...caseObj, shared, docs: { ...(caseObj.docs ?? {}), ...(stepId ? { [stepId]: doc.id } : {}) } });
    }
    return doc;
  };

  // Autosave drafts a few seconds after the last change (never just for opening the page).
  const changeKey = `${valuesKey}|${JSON.stringify(overrides)}|${bilingual}|${profileId}`;
  const initialChangeKey = useRef(changeKey);
  useEffect(() => {
    if (changeKey === initialChangeKey.current) return;
    setSaveState('dirty');
    const timer = setTimeout(async () => {
      setSaveState('saving');
      await persist();
      setSaveState('saved');
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeKey]);

  // Keep the URL pointing at the saved document so reloads restore it.
  useEffect(() => {
    if (saveState === 'saved' && !saved) {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('doc') !== docIdRef.current) {
        sp.set('doc', docIdRef.current);
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?${sp.toString()}`);
      }
    }
  }, [saveState, saved]);

  // ------------------------------------------------------------------ Actions
  const validate = async (): Promise<boolean> => {
    const ok = await methods.trigger();
    const list = collectErrors(methods.formState.errors);
    setErrorList(ok ? [] : list);
    if (!ok) {
      setTab('fill');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
    return ok;
  };

  const fileName = () => {
    const v = methods.getValues();
    return pdfFileName(template.formalTitle, template.personName?.(v), template.documentDate?.(v) ?? (v.data as string));
  };

  const finalise = async () => {
    const doc = await persist('final');
    setStatus('final');
    setSaveState('saved');
    if (profile && doc.ref) await commitRef(profile.id, doc.ref);
  };

  const onDownload = async () => {
    if (!(await validate())) return;
    const buf = await current();
    if (!buf) return;
    downloadPdf(buf, fileName());
    await finalise();
    toast(t('editor.downloadReady'));
  };
  const onPrint = async () => {
    if (!(await validate())) return;
    const buf = await current();
    if (!buf) return;
    printPdf(buf);
    await finalise();
  };
  const onShare = async () => {
    if (!(await validate())) return;
    const buf = await current();
    if (!buf) return;
    const ok = await sharePdf(buf, fileName(), L(template.title));
    if (ok) await finalise();
  };
  const onSave = async () => {
    setSaveState('saving');
    await persist();
    setSaveState('saved');
    toast(t('editor.saved'));
  };

  const shareable = useMemo(() => canShareFiles(), []);

  // ------------------------------------------------------------------ UI pieces
  const sectionsWithFields = template.sections.map((s) => ({ s, fields: template.fields.filter((f) => f.section === s.id) }));
  const generalWarnings = warnings.filter((w) => !w.field || !template.fields.some((f) => f.name === w.field));

  const header = (
    <div className="mb-6">
      <nav aria-label="Navegação estrutural" className="mb-3">
        <Link to={`/documentos?cat=${template.category}`} className="inline-flex items-center gap-1 min-h-10">
          <Icon name="arrowLeft" size={18} />
          {t('editor.back')}
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <Tag tone={status === 'final' ? 'green' : 'neutral'}>{status === 'final' ? t('editor.final') : t('editor.draft')}</Tag>
        <span className="text-muted text-[0.9rem]">{t('editor.reviewed', {
            date:
              lang === 'en'
                ? new Date(`${template.lastReviewed}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : formatDateLong(template.lastReviewed),
          })}</span>
      </div>
      <h1 className="text-[1.8rem] sm:text-[2.1rem] font-bold leading-tight">{L(template.title)}</h1>
      <p className="text-[1.1rem] text-muted mt-1">{template.formalTitle}</p>
      <p className="mt-3 max-w-prose">{L(template.summary)}</p>
      {process ? (
        <Notice kind="info" className="mt-4" title={`${t('process.title')}: ${L(process.title)}`}>
          <Link to={`/processos/${process.id}?processo=${caseObj!.id}`}>{t('process.steps')}</Link>
        </Notice>
      ) : null}
    </div>
  );

  const issuerBox = (
    <div className="mb-6 p-4 bg-surface border border-border rounded-[var(--radius)]">
      <label htmlFor="issuer" className="font-semibold block mb-1">
        {t('editor.issuer')}
      </label>
      <Select
        id="issuer"
        value={profileId ?? ''}
        onChange={(e) => {
          const id = e.target.value || null;
          setProfileId(id);
        }}
      >
        <option value="">{t('profile.none')}</option>
        {(profiles ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {profileDisplayName(p) || (p.kind === 'empresa' ? t('profile.untitledCompany') : t('profile.untitledPerson'))}
          </option>
        ))}
      </Select>
      {!profile ? <p className="text-muted mt-2 text-[0.95rem]">{t('editor.noProfile')}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-4">
        <Link to={profile ? `/perfis/${profile.id}` : '/perfis/novo?tipo=empresa'}>{profile ? t('profiles.edit') : t('profile.create')}</Link>
      </div>
    </div>
  );

  const errorSummary =
    errorList.length > 0 ? (
      <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-6 border-[5px] border-error p-4 focus:outline-3 focus:outline-focus">
        <h2 className="text-[1.3rem] font-bold">{t('editor.errorsTitle', { count: errorList.length })}</h2>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          {errorList.map((e) => (
            <li key={e.name}>
              <a
                href={`#${fieldDomId(e.name)}-input`}
                className="text-error font-semibold"
                onClick={(ev) => {
                  ev.preventDefault();
                  const el = document.getElementById(`${fieldDomId(e.name)}-input`) ?? document.getElementById(fieldDomId(e.name));
                  el?.scrollIntoView({ block: 'center' });
                  (el as HTMLElement | null)?.focus?.();
                }}
              >
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const legalPanel = (
    <details className="mb-6 border border-border rounded-[var(--radius)] group">
      <summary className="cursor-pointer min-h-12 px-4 flex items-center gap-2 font-semibold list-none">
        <Icon name="book" size={18} />
        {t('editor.legalBasis')}
        <Icon name="chevronDown" size={18} className="ml-auto group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {template.legalRefs.length === 0 ? <p className="text-muted">—</p> : null}
        {template.legalRefs.map((r) => {
          const e = legalEntry(r);
          return (
            <div key={r} className="border-l-4 border-border pl-3">
              <p className="font-semibold">
                {L(e.title)}{' '}
                {e.confidence === 'confirm' ? (
                  <span className="inline-block ml-1 align-middle">
                    <Tag tone="amber">{t('editor.confirmValue')}</Tag>
                  </span>
                ) : null}
              </p>
              <p className="text-[0.95rem]">{L(e.summary)}</p>
              {e.note ? <p className="text-[0.9rem] text-muted mt-1">{L(e.note)}</p> : null}
              <p className="text-[0.85rem] text-muted mt-1">
                {e.article ? `${e.article} — ` : ''}
                {e.sourceUrl ?? LAWS[e.law].url ? (
                  <a href={e.sourceUrl ?? LAWS[e.law].url} target="_blank" rel="noreferrer">
                    {LAWS[e.law].title}
                  </a>
                ) : (
                  LAWS[e.law].title
                )}
              </p>
            </div>
          );
        })}
        <p className="text-[0.9rem] text-muted">{t('editor.lawNote')}</p>
      </div>
    </details>
  );

  const wordingPanel =
    texts.length > 0 ? (
      <details className="mb-8 border border-border rounded-[var(--radius)] group">
        <summary className="cursor-pointer min-h-12 px-4 flex items-center gap-2 font-semibold list-none">
          <Icon name="edit" size={18} />
          {t('editor.editText')}
          {Object.keys(overrides).length ? <Tag>{Object.keys(overrides).length}</Tag> : null}
          <Icon name="chevronDown" size={18} className="ml-auto group-open:rotate-180 transition-transform" />
        </summary>
        <div className="px-4 pb-4">
          <p className="text-muted mb-3">{t('editor.editTextIntro')}</p>
          <div className="mb-4">
            <Checkbox label={t('editor.readingAid')} hint={t('editor.readingAidHelp')} checked={readingAid} onChange={setReadingAid} />
          </div>
          <ol className="space-y-5">
            {texts.map((p, i) => {
              const edited = overrides[p.id] != null;
              return (
                <li key={p.id} className={readingAid && p.en ? 'grid gap-3 md:grid-cols-2' : ''}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label htmlFor={`txt-${p.id}`} className="font-semibold text-[0.95rem]">
                        {p.label ? p.label : `§ ${i + 1}`}
                      </label>
                      {edited ? <Tag tone="amber">{t('editor.edited')}</Tag> : null}
                    </div>
                    <TextArea
                      id={`txt-${p.id}`}
                      rows={Math.min(10, Math.max(3, Math.ceil(p.text.length / 70)))}
                      value={p.text}
                      onChange={(e) => setOverrides((o) => ({ ...o, [p.id]: e.target.value }))}
                    />
                    {edited ? (
                      <Button
                        variant="quiet"
                        onClick={() =>
                          setOverrides((o) => {
                            const n = { ...o };
                            delete n[p.id];
                            return n;
                          })
                        }
                      >
                        {t('editor.resetText')}
                      </Button>
                    ) : null}
                  </div>
                  {readingAid && p.en ? (
                    <div lang="en" className="bg-info-bg p-3 text-[0.95rem] rounded-[var(--radius)] self-start" aria-label="English reading aid">
                      {p.en}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </details>
    ) : null;

  const nextDocs = (template.related ?? []).map((r) => getMeta(r)).filter((m): m is TemplateMeta => Boolean(m));

  const formColumn = (
    <div>
      {errorSummary}
      {generalWarnings.length > 0 ? (
        <div className="mb-6 space-y-2">
          {generalWarnings.map((w, i) => (
            <Notice key={i} kind={w.level === 'error' ? 'error' : w.level === 'warning' ? 'warning' : 'info'}>
              {L(w.message)}
            </Notice>
          ))}
        </div>
      ) : null}
      {issuerBox}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void onDownload();
        }}
      >
        {sectionsWithFields.map(({ s, fields }) => (
          <SectionFields key={s.id} section={s} fields={fields} computed={ctx.computed} warnings={warnings} />
        ))}
      </form>
      {template.bilingual ? (
        <div className="mb-6 p-4 border border-border rounded-[var(--radius)]">
          <Checkbox label={t('editor.bilingual')} hint={t('editor.bilingualHelp')} checked={bilingual} onChange={setBilingual} />
        </div>
      ) : null}
      {wordingPanel}
      {legalPanel}
      {nextDocs.length ? (
        <div className="mb-10">
          <h2 className="text-[1.2rem] font-bold mb-2">{t('editor.nextDocs')}</h2>
          <ul className="space-y-1">
            {nextDocs.map((m) => (
              <li key={m.id}>
                <Link to={`/documentos/${m.id}`}>{L(m.title)}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-muted text-[0.9rem] mb-24 lg:mb-8">{t('app.disclaimer')}</p>
    </div>
  );

  const saveIndicator = (
    <span className="text-[0.9rem] text-muted inline-flex items-center gap-1.5" aria-live="polite">
      {saveState === 'saving' ? (
        <Spinner label={t('editor.saving')} />
      ) : saveState === 'saved' ? (
        <>
          <Icon name="check" size={16} className="text-primary" />
          {t('editor.saved')}
        </>
      ) : saveState === 'dirty' ? (
        t('editor.unsaved')
      ) : null}
    </span>
  );

  const actions = (compact: boolean) => (
    <div className={`flex items-center gap-2 ${compact ? 'justify-between' : 'flex-wrap'}`}>
      <Button variant="secondary" icon="save" onClick={onSave} className={compact ? 'flex-1 px-2' : ''}>
        {t('editor.save')}
      </Button>
      <Button variant="primary" icon="download" onClick={onDownload} className={compact ? 'flex-1 px-2' : ''}>
        {compact ? t('editor.downloadShort') : t('editor.download')}
      </Button>
      <Button variant="secondary" icon="print" onClick={onPrint} className={compact ? 'flex-1 px-2' : ''}>
        {t('editor.print')}
      </Button>
      {shareable && !compact ? (
        <Button variant="secondary" icon="share" onClick={onShare}>
          {t('editor.share')}
        </Button>
      ) : null}
      {shareable && compact ? (
        <button type="button" onClick={onShare} aria-label={t('editor.share')} className="min-h-12 min-w-12 inline-flex items-center justify-center border border-border rounded-[var(--radius)] bg-surface cursor-pointer">
          <Icon name="share" />
        </button>
      ) : null}
    </div>
  );

  const preview = <PdfPreview pdf={pdf} busy={busy} error={error} />;

  return (
    <FormProvider {...methods}>
      {isDesktop ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-0 max-w-[1500px] mx-auto">
          <div className="px-6 xl:px-10 py-6 min-w-0">
            {header}
            {formColumn}
          </div>
          <aside className="sticky top-0 h-dvh flex flex-col border-l border-border bg-surface" aria-label={t('editor.preview')}>
            <div className="p-3 border-b border-border bg-bg flex items-center justify-between gap-3 flex-wrap">
              {actions(false)}
              {saveIndicator}
            </div>
            <div className="flex-1 min-h-0">{preview}</div>
          </aside>
        </div>
      ) : (
        <div className="container-page pt-5">
          {header}
          <Tabs
            label={t('editor.sections')}
            value={tab}
            onValueChange={setTab}
            sticky
            tabs={[
              { value: 'fill', label: t('editor.fill'), content: formColumn },
              {
                value: 'preview',
                label: t('editor.preview'),
                content: <div className="h-[calc(100dvh-11rem)] -mx-4 sm:-mx-6 border-y border-border">{preview}</div>,
              },
            ]}
          />
          <div className="fixed inset-x-0 bottom-0 z-30 bg-bg border-t-2 border-border-strong px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="flex justify-center mb-1">{saveIndicator}</div>
            {actions(true)}
          </div>
        </div>
      )}
    </FormProvider>
  );
}
