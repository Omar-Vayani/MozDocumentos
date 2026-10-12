import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefs, type ThemePref } from '@/app/store';
import { IRPS_REFERENCE_SOURCE, IRPS_REFERENCE_TABLE, MINIMUM_WAGES_2026, type LegalOverrides, type MinimumWage } from '@/legal/mz-legal';
import { formatMoney, todayISO } from '@/lib/format';
import { createBackup, restoreBackup } from '@/lib/storage/backup';
import { useLegalOverrides } from '@/lib/storage/hooks';
import { clearAllData, requestPersistence, setLegalOverrides, storageEstimate } from '@/lib/storage/repo';
import { Button } from '@/ui/Button';
import { FieldWrap, RadioGroup, TextInput } from '@/ui/Field';
import { Notice, PageHeader, SectionTitle, formatBytes, toast } from '@/ui/misc';

function LegalValues() {
  const { t } = useTranslation();
  const stored = useLegalOverrides();
  const [o, setO] = useState<LegalOverrides | null>(null);
  useEffect(() => {
    if (stored && !o) setO(stored);
  }, [stored, o]);
  if (!o) return null;

  const worker = o.inssTaxaTrabalhador ?? 0.03;
  const employer = o.inssTaxaEmpregador ?? 0.04;
  const wages = o.minimumWages ?? MINIMUM_WAGES_2026;
  const save = async (next: LegalOverrides) => {
    setO(next);
    await setLegalOverrides(next);
  };
  const setWage = (i: number, patch: Partial<MinimumWage>) => {
    const list = wages.map((w, j) => (j === i ? { ...w, ...patch } : w));
    void save({ ...o, minimumWages: list });
  };

  return (
    <section className="mt-12" aria-labelledby="legal">
      <SectionTitle id="legal">{t('settings.legal')}</SectionTitle>
      <p className="text-muted mb-4 max-w-prose">{t('settings.legalIntro')}</p>
      <div className="grid gap-5 sm:grid-cols-2 max-w-xl">
        <FieldWrap label={t('settings.inssWorker')}>
          {({ id }) => (
            <TextInput
              id={id}
              inputMode="decimal"
              defaultValue={String(+(worker * 100).toFixed(2))}
              onBlur={(e) => {
                const n = Number(e.target.value.replace(',', '.'));
                if (Number.isFinite(n) && n >= 0 && n < 100) void save({ ...o, inssTaxaTrabalhador: n / 100 });
              }}
            />
          )}
        </FieldWrap>
        <FieldWrap label={t('settings.inssEmployer')}>
          {({ id }) => (
            <TextInput
              id={id}
              inputMode="decimal"
              defaultValue={String(+(employer * 100).toFixed(2))}
              onBlur={(e) => {
                const n = Number(e.target.value.replace(',', '.'));
                if (Number.isFinite(n) && n >= 0 && n < 100) void save({ ...o, inssTaxaEmpregador: n / 100 });
              }}
            />
          )}
        </FieldWrap>
      </div>

      <h3 className="text-[1.2rem] font-bold mt-8">{t('settings.irps')}</h3>
      <p className="mt-1">{o.irpsTable?.length ? t('settings.irpsOn', { count: o.irpsTable.length }) : t('settings.irpsOff')}</p>
      {o.irpsTable?.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="text-[0.92rem] border-collapse min-w-[32rem]">
            <thead>
              <tr className="text-left border-b-2 border-border-strong">
                <th className="py-2 pr-4">{t('settings.irpsFrom')}</th>
                <th className="py-2 pr-4">{t('settings.irpsDependants')}</th>
                <th className="py-2">{t('settings.irpsRate')}</th>
              </tr>
            </thead>
            <tbody>
              {o.irpsTable.map((b) => (
                <tr key={b.from} className="border-b border-border">
                  <td className="py-1.5 pr-4 tabular-nums">{formatMoney(b.from, false)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{b.fixed.map((f) => (f == null ? '—' : formatMoney(f, false))).join(' / ')}</td>
                  <td className="py-1.5 tabular-nums">{b.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {!o.irpsTable?.length ? (
          <Button variant="secondary" onClick={() => void save({ ...o, irpsTable: IRPS_REFERENCE_TABLE })}>
            {t('settings.irpsLoad')}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void save({ ...o, irpsTable: [] })}>
            {t('settings.irpsClear')}
          </Button>
        )}
      </div>
      <p className="text-muted text-[0.9rem] mt-2 max-w-prose">
        {t('settings.irpsLoadHelp')} ({IRPS_REFERENCE_SOURCE.title})
      </p>

      <h3 className="text-[1.2rem] font-bold mt-8">{t('settings.minWages')}</h3>
      <p className="text-muted mt-1 mb-3">{t('settings.minWagesHelp')}</p>
      <div className="overflow-x-auto">
        <table className="text-[0.95rem] border-collapse w-full min-w-[34rem]">
          <thead>
            <tr className="text-left border-b-2 border-border-strong">
              <th className="py-2 pr-3">{t('settings.sector')}</th>
              <th className="py-2 pr-3 w-36">{t('settings.value')}</th>
              <th className="py-2 w-40">{t('settings.since')}</th>
            </tr>
          </thead>
          <tbody>
            {wages.map((w, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-1 pr-3">
                  <input aria-label={t('settings.sector')} className="w-full min-h-11 px-2 bg-bg border border-border" value={w.sector} onChange={(e) => setWage(i, { sector: e.target.value })} />
                </td>
                <td className="py-1 pr-3">
                  <input
                    aria-label={t('settings.value')}
                    inputMode="decimal"
                    className="w-full min-h-11 px-2 bg-bg border border-border tabular-nums"
                    defaultValue={String(w.value)}
                    onBlur={(e) => {
                      const n = Number(e.target.value.replace(/\s/g, '').replace(',', '.'));
                      if (Number.isFinite(n)) setWage(i, { value: n });
                    }}
                  />
                </td>
                <td className="py-1">
                  <input aria-label={t('settings.since')} type="date" className="w-full min-h-11 px-2 bg-bg border border-border" value={w.since} onChange={(e) => setWage(i, { since: e.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="secondary" icon="plus" onClick={() => void save({ ...o, minimumWages: [...wages, { sector: '', value: 0, since: todayISO() }] })}>
          {t('settings.addRow')}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            void save({});
            toast(t('settings.saved'));
          }}
        >
          {t('settings.resetDefaults')}
        </Button>
      </div>
    </section>
  );
}

function Backup() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [est, setEst] = useState<Awaited<ReturnType<typeof storageEstimate>>>(null);

  const refresh = () => void storageEstimate().then(setEst);
  useEffect(refresh, []);

  const doExport = async () => {
    const data = await createBackup();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentos-mz-copia-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const { counts } = await restoreBackup(data, mode);
      setMsg({ kind: 'success', text: t('settings.importDone', counts) });
      refresh();
    } catch {
      setMsg({ kind: 'error', text: t('settings.importError') });
    }
  };

  const ratio = est && est.quota ? est.usage / est.quota : 0;

  return (
    <section className="mt-12" aria-labelledby="backup">
      <SectionTitle id="backup">{t('settings.backup')}</SectionTitle>
      <p className="text-muted mb-4 max-w-prose">{t('settings.backupIntro')}</p>
      <Button icon="download" onClick={doExport}>
        {t('settings.export')}
      </Button>
      <div className="mt-6 max-w-xl">
        <RadioGroup
          legend={t('settings.importMode')}
          name="import-mode"
          value={mode}
          onChange={(v) => setMode(v as 'merge' | 'replace')}
          options={[
            { value: 'merge', label: t('settings.merge') },
            { value: 'replace', label: t('settings.replace') },
          ]}
        />
        <label className="mt-3 inline-flex items-center gap-2 min-h-12 px-4 font-semibold border border-border bg-surface rounded-[var(--radius)] cursor-pointer hover:bg-surface-2 focus-within:outline-3 focus-within:outline-focus">
          {t('settings.import')}
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void doImport(e.target.files?.[0])} />
        </label>
        {msg ? <Notice kind={msg.kind} className="mt-4">{msg.text}</Notice> : null}
      </div>

      <h3 className="text-[1.2rem] font-bold mt-8">{t('settings.storage')}</h3>
      {est ? (
        <>
          <p className="mt-1">{t('settings.storageUsed', { used: formatBytes(est.usage), quota: formatBytes(est.quota) })}</p>
          <div className="mt-2 h-3 bg-surface-2 max-w-md" aria-hidden>
            <div className={`h-3 ${ratio > 0.8 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(100, Math.max(1, ratio * 100))}%` }} />
          </div>
          {ratio > 0.8 ? <Notice kind="warning" className="mt-3">{t('settings.storageWarn')}</Notice> : null}
          <p className="mt-3">{est.persisted ? t('settings.persisted') : t('settings.notPersisted')}</p>
          {!est.persisted ? (
            <Button variant="secondary" className="mt-2" onClick={() => void requestPersistence().then(refresh)}>
              {t('settings.persist')}
            </Button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Danger() {
  const { t } = useTranslation();
  const [word, setWord] = useState('');
  const setActive = usePrefs((s) => s.setActiveProfile);
  return (
    <section className="mt-12 border-2 border-error p-5 max-w-2xl" aria-labelledby="danger">
      <h2 id="danger" className="text-[1.3rem] font-bold">
        {t('settings.danger')}
      </h2>
      <p className="mt-1">{t('settings.dangerText')}</p>
      <FieldWrap label={t('settings.dangerConfirm')} className="mt-4 max-w-xs">
        {({ id }) => <TextInput id={id} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />}
      </FieldWrap>
      <Button
        variant="danger"
        className="mt-3"
        disabled={word.trim().toUpperCase() !== t('settings.dangerWord')}
        onClick={async () => {
          await clearAllData();
          setActive(null);
          setWord('');
          toast(t('settings.deleted'));
        }}
      >
        {t('settings.danger')}
      </Button>
    </section>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  return (
    <div className="container-page py-8 sm:py-10 max-w-4xl">
      <PageHeader title={t('settings.title')} />
      <div className="grid gap-8 sm:grid-cols-2">
        <RadioGroup
          legend={t('settings.language')}
          hint={t('settings.languageHelp')}
          name="lang"
          value={lang}
          onChange={(v) => setLang(v as 'pt' | 'en')}
          options={[
            { value: 'pt', label: 'Português' },
            { value: 'en', label: 'English' },
          ]}
        />
        <RadioGroup
          legend={t('settings.theme')}
          name="theme"
          value={theme}
          onChange={(v) => setTheme(v as ThemePref)}
          options={(['system', 'light', 'dark'] as const).map((k) => ({ value: k, label: t(`settings.themes.${k}`) }))}
        />
      </div>
      <LegalValues />
      <Backup />
      <Danger />
    </div>
  );
}
