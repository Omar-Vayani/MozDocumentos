import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePrefs } from '@/app/store';
import { defaultValues } from '@/documents/context';
import { AVAILABLE_TEMPLATE_IDS, loadTemplate } from '@/documents/registry';
import type { RenderInput } from '@/documents/render/types';
import { PdfPreview } from '@/features/editor/PdfPreview';
import { fontBase } from '@/features/editor/pdfClient';
import { usePdfRender } from '@/features/editor/useRender';
import { ACCENT_PALETTE, ensurePrintContrast } from '@/lib/color';
import { todayISO, uid } from '@/lib/format';
import { processImage } from '@/lib/image';
import { db } from '@/lib/storage/db';
import { useLegalOverrides } from '@/lib/storage/hooks';
import { brandingAssets, formatRef, saveAsset, saveProfile } from '@/lib/storage/repo';
import { newProfile, type Asset, type Branding, type Profile } from '@/lib/storage/types';
import { Button } from '@/ui/Button';
import { Checkbox, FieldWrap, RadioGroup, Select, TextInput } from '@/ui/Field';
import { Notice, Spinner, toast } from '@/ui/misc';
import { Tabs } from '@/ui/Tabs';

type Draft = Profile;

function Text({
  label,
  value,
  onChange,
  hint,
  type = 'text',
  className = '',
  inputMode,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  className?: string;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text' | 'decimal' | 'url';
}) {
  return (
    <FieldWrap label={label} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <TextInput id={id} aria-describedby={describedBy} type={type} inputMode={inputMode} value={value ?? ''} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      )}
    </FieldWrap>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-8 border-t-2 border-border-strong pt-4">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-[1.25rem] font-bold mb-4">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const ASSET_MAX: Record<Asset['kind'], { maxDim: number; format: 'png' | 'auto' }> = {
  logo: { maxDim: 1200, format: 'png' },
  header: { maxDim: 2480, format: 'auto' },
  footer: { maxDim: 2480, format: 'auto' },
  watermark: { maxDim: 1600, format: 'auto' },
  signature: { maxDim: 1000, format: 'png' },
  stamp: { maxDim: 1000, format: 'png' },
};

const ASSET_KEY: Record<Asset['kind'], keyof Branding> = {
  logo: 'logoAssetId',
  header: 'headerAssetId',
  footer: 'footerAssetId',
  watermark: 'watermarkAssetId',
  signature: 'signatureAssetId',
  stamp: 'stampAssetId',
};

function ImageField({
  kind,
  label,
  hint,
  branding,
  onChange,
}: {
  kind: Asset['kind'];
  label: string;
  hint?: string;
  branding: Branding;
  onChange: (b: Partial<Branding>) => void;
}) {
  const { t } = useTranslation();
  const key = ASSET_KEY[kind];
  const assetId = branding[key] as string | undefined;
  const asset = useLiveQuery(async () => (assetId ? ((await db.assets.get(assetId)) ?? null) : null), [assetId]);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!asset) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(asset.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [asset]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const img = await processImage(file, ASSET_MAX[kind]);
      const id = await saveAsset({ kind, blob: img.blob, type: img.type, width: img.width, height: img.height }, assetId);
      onChange({ [key]: id } as Partial<Branding>);
    } catch (e) {
      setErr((e as Error).message === 'too-big' ? t('profiles.imageTooBig') : t('profiles.imageError'));
    } finally {
      setBusy(false);
    }
  };

  const inputId = `img-${kind}`;
  return (
    <div className="sm:col-span-2 border border-border rounded-[var(--radius)] p-4">
      <p className="font-semibold">{label}</p>
      {hint ? <p className="text-muted text-[0.94rem] mt-0.5">{hint}</p> : null}
      {err ? <p className="text-error font-semibold mt-1">{err}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="h-20 min-w-28 max-w-60 flex items-center justify-center bg-[repeating-conic-gradient(#e6e6e6_0_25%,#fff_0_50%)] bg-[length:16px_16px] border border-border">
          {busy ? <Spinner /> : url ? <img src={url} alt="" className="max-h-20 max-w-60 object-contain" /> : <span className="text-[0.85rem] text-muted px-2">—</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor={inputId} className="inline-flex items-center gap-2 min-h-12 px-4 font-semibold border border-border bg-surface rounded-[var(--radius)] cursor-pointer hover:bg-surface-2 focus-within:outline-3 focus-within:outline-focus">
            {assetId ? t('profiles.replace') : t('profiles.upload')}
            <input id={inputId} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          {assetId ? (
            <Button
              variant="quiet"
              className="text-error"
              onClick={async () => {
                await db.assets.delete(assetId);
                onChange({ [key]: undefined } as Partial<Branding>);
              }}
            >
              {t('profiles.remove')}
            </Button>
          ) : null}
        </div>
        {asset ? <span className="text-[0.85rem] text-muted">{asset.width} × {asset.height} px</span> : null}
      </div>
    </div>
  );
}

function LetterheadPreview({ draft }: { draft: Draft }) {
  const legal = useLegalOverrides();
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [assets, setAssets] = useState<RenderInput['assets'] | null>(null);
  const tplId = AVAILABLE_TEMPLATE_IDS.includes('carta-oficial') ? 'carta-oficial' : AVAILABLE_TEMPLATE_IDS[0];
  const today = useMemo(() => todayISO(), []);

  useEffect(() => {
    if (!tplId) return;
    loadTemplate(tplId).then((tpl) => setValues(defaultValues(tpl, { profile: draft, today, nextRef: formatRef(draft) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplId]);

  const brandingKey = JSON.stringify(draft.branding);
  useEffect(() => {
    let ok = true;
    brandingAssets(draft).then((a) => ok && setAssets(a));
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandingKey]);

  const input: RenderInput | null =
    values && assets && legal && tplId
      ? { templateId: tplId, values: { ...values, ref: formatRef(draft) }, overrides: {}, profile: draft, assets, legalOverrides: legal, bilingual: false, today, fontBase: fontBase() }
      : null;
  const key = JSON.stringify(draft) + Object.keys(assets ?? {}).join();
  const { pdf, busy, error } = usePdfRender(input, key, 500);
  return <PdfPreview pdf={pdf} busy={busy} error={error} />;
}

export function ProfileEditPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const isNew = !id || id === 'novo';
  const kind = sp.get('tipo') === 'pessoa' ? 'pessoa' : 'empresa';
  const stored = useLiveQuery(async () => (isNew ? null : ((await db.profiles.get(id!)) ?? null)), [id]);
  if (!isNew && stored === undefined) {
    return (
      <div className="container-page py-16 flex justify-center">
        <Spinner />
      </div>
    );
  }
  if (!isNew && stored === null) {
    return (
      <div className="container-page py-10">
        <Notice kind="error" title="404" />
      </div>
    );
  }
  return <ProfileForm key={id ?? 'novo'} initial={stored ?? newProfile(kind, uid())} isNew={isNew} />;
}

function ProfileForm({ initial, isNew }: { initial: Profile; isNew: boolean }) {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const tx = (pt: string, en: string) => (lang === 'en' ? en : pt);
  const navigate = useNavigate();
  const setActive = usePrefs((s) => s.setActiveProfile);
  const [d, setD] = useState<Draft>(initial);
  const [tab, setTab] = useState('data');
  const [dirty, setDirty] = useState(false);

  const set = (patch: Partial<Profile>) => {
    setD((p) => ({ ...p, ...patch }));
    setDirty(true);
  };
  const setAddr = (patch: Partial<Profile['morada']>) => set({ morada: { ...d.morada, ...patch } });
  const setB = (patch: Partial<Branding>) => {
    setD((p) => ({ ...p, branding: { ...p.branding, ...patch } }));
    setDirty(true);
  };

  // Image uploads are stored immediately; persist the reference too so it is never orphaned.
  useEffect(() => {
    if (!isNew && dirty) {
      const timer = setTimeout(() => void saveProfile(d), 800);
      return () => clearTimeout(timer);
    }
  }, [d, dirty, isNew]);

  const save = async () => {
    await saveProfile(d);
    setDirty(false);
    toast(t('profiles.saved'));
    if (isNew) {
      setActive(d.id);
      navigate(`/perfis/${d.id}`, { replace: true });
    }
  };

  const company = d.kind === 'empresa';
  const b = d.branding;
  const adjusted = ensurePrintContrast(b.accent);

  const dataTab = company ? (
    <>
      <Group title={t('profiles.companySection')}>
        <Text className="sm:col-span-2" label={tx('Firma (nome legal)', 'Registered name')} value={d.firma} onChange={(v) => set({ firma: v })} hint={tx('Ex.: Construções Machava, Lda', 'E.g. Construções Machava, Lda')} />
        <Text label={tx('Nome comercial', 'Trading name')} value={d.nomeComercial} onChange={(v) => set({ nomeComercial: v })} />
        <Text label="NUIT" value={d.nuit} onChange={(v) => set({ nuit: v })} inputMode="numeric" />
        <Text label="NUEL" value={d.nuel} onChange={(v) => set({ nuel: v })} inputMode="numeric" />
        <Text label={tx('N.º de inscrição no INSS', 'INSS registration number')} value={d.inss} onChange={(v) => set({ inss: v })} />
        <Text label={tx('Alvará / licença (opcional)', 'Licence (optional)')} value={d.alvara} onChange={(v) => set({ alvara: v })} />
        <Text label={tx('Capital social (opcional)', 'Share capital (optional)')} value={d.capitalSocial} onChange={(v) => set({ capitalSocial: v })} inputMode="decimal" />
      </Group>
      <Group title={t('profiles.addressSection')}>
        <Text className="sm:col-span-2" label={tx('Avenida / rua', 'Avenue / street')} value={d.morada.rua} onChange={(v) => setAddr({ rua: v })} />
        <Text label={tx('Número', 'Number')} value={d.morada.numero} onChange={(v) => setAddr({ numero: v })} />
        <Text label={tx('Bairro', 'Neighbourhood')} value={d.morada.bairro} onChange={(v) => setAddr({ bairro: v })} />
        <Text label={tx('Cidade', 'City')} value={d.morada.cidade} onChange={(v) => setAddr({ cidade: v })} />
        <Text label={tx('Província', 'Province')} value={d.morada.provincia} onChange={(v) => setAddr({ provincia: v })} />
        <Text label={tx('Caixa postal', 'P.O. Box')} value={d.caixaPostal} onChange={(v) => set({ caixaPostal: v })} />
        <Text label={tx('Local por defeito nos documentos', 'Default place on documents')} value={d.localPadrao} onChange={(v) => set({ localPadrao: v })} hint={tx('Ex.: Maputo', 'E.g. Maputo')} />
      </Group>
      <Group title={t('profiles.contactsSection')}>
        <Text label={tx('Telefones', 'Phone numbers')} value={d.telefones} onChange={(v) => set({ telefones: v })} type="tel" inputMode="tel" />
        <Text label="Email" value={d.email} onChange={(v) => set({ email: v })} type="email" inputMode="email" />
        <Text label={tx('Website', 'Website')} value={d.website} onChange={(v) => set({ website: v })} inputMode="url" />
      </Group>
      <Group title={t('profiles.representativeSection')}>
        <Text label={tx('Nome', 'Name')} value={d.representanteNome} onChange={(v) => set({ representanteNome: v })} />
        <Text label={tx('Cargo', 'Position')} value={d.representanteCargo} onChange={(v) => set({ representanteCargo: v })} hint={tx('Ex.: Director-Geral', 'E.g. Managing Director')} />
      </Group>
      <Group title={t('profiles.bankSection')}>
        <Text label={tx('Banco', 'Bank')} value={d.banco} onChange={(v) => set({ banco: v })} />
        <Text label="NIB" value={d.nib} onChange={(v) => set({ nib: v })} inputMode="numeric" />
      </Group>
    </>
  ) : (
    <>
      <Group title={t('profiles.personSection')}>
        <Text className="sm:col-span-2" label={tx('Nome completo', 'Full name')} value={d.nome} onChange={(v) => set({ nome: v })} />
        <FieldWrap label={tx('Documento de identificação', 'ID document')}>
          {({ id }) => (
            <Select id={id} value={d.docTipo ?? 'BI'} onChange={(e) => set({ docTipo: e.target.value as Profile['docTipo'] })}>
              <option value="BI">Bilhete de Identidade (BI)</option>
              <option value="DIRE">DIRE</option>
              <option value="Passaporte">Passaporte</option>
            </Select>
          )}
        </FieldWrap>
        <Text label={tx('Número do documento', 'Document number')} value={d.docNumero} onChange={(v) => set({ docNumero: v })} />
        <Text label={tx('Data de emissão', 'Issue date')} value={d.docEmissao} onChange={(v) => set({ docEmissao: v })} type="date" />
        <Text label={tx('Local de emissão', 'Place of issue')} value={d.docLocal} onChange={(v) => set({ docLocal: v })} />
        <Text label="NUIT" value={d.nuit} onChange={(v) => set({ nuit: v })} inputMode="numeric" />
        <FieldWrap label={tx('Estado civil', 'Marital status')}>
          {({ id }) => (
            <Select id={id} value={d.estadoCivil ?? ''} onChange={(e) => set({ estadoCivil: e.target.value })}>
              <option value="">—</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="união de facto">União de facto</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viúvo">Viúvo(a)</option>
            </Select>
          )}
        </FieldWrap>
        <Text label={tx('Naturalidade', 'Place of birth')} value={d.naturalidade} onChange={(v) => set({ naturalidade: v })} />
        <Text label={tx('Nacionalidade', 'Nationality')} value={d.nacionalidade} onChange={(v) => set({ nacionalidade: v })} hint={tx('Ex.: moçambicana', 'E.g. moçambicana')} />
      </Group>
      <Group title={t('profiles.addressSection')}>
        <Text className="sm:col-span-2" label={tx('Avenida / rua', 'Avenue / street')} value={d.morada.rua} onChange={(v) => setAddr({ rua: v })} />
        <Text label={tx('Número', 'Number')} value={d.morada.numero} onChange={(v) => setAddr({ numero: v })} />
        <Text label={tx('Bairro', 'Neighbourhood')} value={d.morada.bairro} onChange={(v) => setAddr({ bairro: v })} />
        <Text label={tx('Cidade', 'City')} value={d.morada.cidade} onChange={(v) => setAddr({ cidade: v })} />
        <Text label={tx('Local por defeito nos documentos', 'Default place on documents')} value={d.localPadrao} onChange={(v) => set({ localPadrao: v })} />
        <Text label={tx('Telefone', 'Phone')} value={d.telefones} onChange={(v) => set({ telefones: v })} type="tel" />
        <Text label="Email" value={d.email} onChange={(v) => set({ email: v })} type="email" />
      </Group>
    </>
  );

  const brandingTab = (
    <>
      {company ? (
        <>
          <RadioGroup
            legend={t('profiles.layout')}
            name="layout"
            value={b.layout}
            onChange={(v) => setB({ layout: v as Branding['layout'] })}
            options={(['classico', 'lateral', 'faixa', 'minimo'] as const).map((k) => ({
              value: k,
              label: <span className="font-semibold">{t(`profiles.layouts.${k}`)}</span>,
              hint: t(`profiles.layouts.${k}Help`),
            }))}
          />
          <div className="grid gap-5 sm:grid-cols-2 mt-6">
            <ImageField kind="logo" label={t('profiles.logo')} hint={t('profiles.logoHelp')} branding={b} onChange={setB} />
            {b.layout === 'faixa' ? <ImageField kind="header" label={t('profiles.header')} hint={t('profiles.headerHelp')} branding={b} onChange={setB} /> : null}
            <ImageField kind="footer" label={t('profiles.footerImage')} branding={b} onChange={setB} />
            <ImageField kind="watermark" label={t('profiles.watermark')} branding={b} onChange={setB} />
          </div>
          {b.watermarkAssetId ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 items-end">
              <FieldWrap label={`${t('profiles.watermarkOpacity')}: ${Math.round(b.watermarkOpacity * 100)}%`}>
                {({ id }) => (
                  <input id={id} type="range" min={2} max={30} step={1} value={Math.round(b.watermarkOpacity * 100)} onChange={(e) => setB({ watermarkOpacity: Number(e.target.value) / 100 })} className="w-full accent-[var(--primary)] min-h-12" />
                )}
              </FieldWrap>
              <Checkbox label={t('profiles.watermarkFirst')} checked={b.watermarkFirstPageOnly} onChange={(v) => setB({ watermarkFirstPageOnly: v })} />
            </div>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 mt-6">
        <ImageField kind="signature" label={t('profiles.signature')} hint={t('profiles.signatureHelp')} branding={b} onChange={setB} />
        {company ? <ImageField kind="stamp" label={t('profiles.stamp')} branding={b} onChange={setB} /> : null}
      </div>

      <fieldset className="mt-8">
        <legend className="font-semibold mb-2">{t('profiles.accent')}</legend>
        <div className="flex flex-wrap gap-2 items-center">
          {ACCENT_PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setB({ accent: c.value })}
              aria-pressed={b.accent === c.value}
              aria-label={c.name}
              title={c.name}
              className={`size-12 rounded-[var(--radius)] border-4 cursor-pointer ${b.accent === c.value ? 'border-border-strong' : 'border-transparent'}`}
              style={{ background: c.value }}
            />
          ))}
          <label className="inline-flex items-center gap-2 min-h-12 px-2">
            <span>{t('profiles.accentCustom')}</span>
            <input type="color" value={b.accent} onChange={(e) => setB({ accent: e.target.value })} className="size-12 cursor-pointer" />
          </label>
        </div>
        {adjusted.toLowerCase() !== b.accent.toLowerCase() ? <p className="mt-2 text-warning">{t('profiles.accentAdjusted', { color: adjusted })}</p> : null}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2 mt-8">
        <RadioGroup
          legend={t('profiles.font')}
          name="font"
          value={b.font}
          onChange={(v) => setB({ font: v as Branding['font'] })}
          options={(['classico', 'institucional', 'moderno'] as const).map((k) => ({ value: k, label: t(`profiles.fonts.${k}`) }))}
        />
        <RadioGroup
          legend={t('profiles.margins')}
          name="margins"
          value={b.margins}
          onChange={(v) => setB({ margins: v as Branding['margins'] })}
          options={[
            { value: 'normal', label: t('profiles.marginsNormal') },
            { value: 'estreito', label: t('profiles.marginsNarrow') },
          ]}
        />
        <RadioGroup
          legend={t('profiles.textAlign')}
          name="align"
          value={b.textAlign}
          onChange={(v) => setB({ textAlign: v as Branding['textAlign'] })}
          options={[
            { value: 'justify', label: t('profiles.justify') },
            { value: 'left', label: t('profiles.left') },
          ]}
        />
        {company ? (
          <fieldset>
            <legend className="font-semibold mb-1">{t('profiles.footer')}</legend>
            <Checkbox label={t('profiles.footerLegal')} checked={b.footer.legal} onChange={(v) => setB({ footer: { ...b.footer, legal: v } })} />
            <Checkbox label={t('profiles.footerAddress')} checked={b.footer.address} onChange={(v) => setB({ footer: { ...b.footer, address: v } })} />
            <Checkbox label={t('profiles.footerContacts')} checked={b.footer.contacts} onChange={(v) => setB({ footer: { ...b.footer, contacts: v } })} />
          </fieldset>
        ) : null}
        <div className="sm:col-span-2">
          <Checkbox label={t('profiles.pageNumbers')} checked={b.pageNumbers} onChange={(v) => setB({ pageNumbers: v })} />
        </div>
      </div>
    </>
  );

  const numberingTab = (
    <div className="max-w-xl">
      <p className="text-muted mb-4">{t('profiles.numberingHelp')}</p>
      <div className="grid gap-5 sm:grid-cols-3">
        <Text label={t('profiles.prefix')} value={d.numbering.prefix} onChange={(v) => set({ numbering: { ...d.numbering, prefix: v.toUpperCase() } })} />
        <Text
          label={t('profiles.counter')}
          value={String(d.numbering.counter)}
          inputMode="numeric"
          onChange={(v) => set({ numbering: { ...d.numbering, counter: Math.max(0, Number(v.replace(/\D/g, '')) || 0), year: new Date().getFullYear() } })}
        />
        <Text
          label={t('profiles.digits')}
          value={String(d.numbering.digits)}
          inputMode="numeric"
          onChange={(v) => set({ numbering: { ...d.numbering, digits: Math.min(6, Math.max(1, Number(v.replace(/\D/g, '')) || 3)) } })}
        />
      </div>
      <p className="mt-4 text-[1.1rem] font-semibold">{t('profiles.nextNumber', { ref: formatRef(d) })}</p>
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="container-page lg:px-8 py-8 min-w-0">
        <p className="mb-3">
          <Link to="/perfis">{t('profiles.title')}</Link>
        </p>
        <h1 className="text-[1.9rem] sm:text-[2.3rem] font-bold">{isNew ? (company ? t('profile.createCompany') : t('profile.createPerson')) : t('profiles.edit')}</h1>
        <div className="mt-6">
          <Tabs
            label={t('profiles.edit')}
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: 'data', label: t('profiles.tabs.data'), content: dataTab },
              { value: 'branding', label: t('profiles.tabs.branding'), content: brandingTab },
              { value: 'numbering', label: t('profiles.tabs.numbering'), content: numberingTab },
            ]}
          />
        </div>
        <div className="sticky bottom-0 bg-bg border-t-2 border-border-strong mt-8 py-3 flex gap-3 items-center z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button icon="save" onClick={save}>
            {t('common.save')}
          </Button>
          {dirty && isNew ? <span className="text-muted">{t('editor.unsaved')}</span> : null}
        </div>
      </div>
      <aside className="lg:sticky lg:top-0 lg:h-dvh border-t lg:border-t-0 lg:border-l border-border flex flex-col h-[80dvh]" aria-label={t('profiles.preview')}>
        <h2 className="px-4 py-3 font-bold border-b border-border bg-bg">{t('profiles.preview')}</h2>
        <div className="flex-1 min-h-0">
          <LetterheadPreview draft={d} />
        </div>
      </aside>
    </div>
  );
}
