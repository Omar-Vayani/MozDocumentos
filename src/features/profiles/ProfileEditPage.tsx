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
import { SECTORS, sectorById, type SectorId } from '@/features/catalog/sectors';
import { newProfile, ORDENS_PROFISSIONAIS, type Asset, type Branding, type Profile } from '@/lib/storage/types';
import { Button } from '@/ui/Button';
import { Checkbox, FieldWrap, RadioGroup, Select, TextArea, TextInput } from '@/ui/Field';
import { SizeSlider } from '@/ui/Slider';
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
  error,
  inputId,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  className?: string;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text' | 'decimal' | 'url';
  error?: string;
  inputId?: string;
}) {
  return (
    <FieldWrap label={label} hint={hint} className={className} error={error} id={inputId}>
      {({ id, describedBy }) => (
        <TextInput
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          type={type}
          inputMode={inputMode}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      )}
    </FieldWrap>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-8 border-t border-border pt-5 first:border-t-0 first:pt-2">
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
  // Show sample text while the profile is still empty, so the layout can be judged.
  const previewProfile: Draft =
    draft.kind === 'empresa'
      ? { ...draft, firma: draft.firma?.trim() || 'Nome da Empresa, Lda', nuit: draft.nuit || '400 000 000', telefones: draft.telefones || '+258 84 000 0000' }
      : { ...draft, nome: draft.nome?.trim() || 'Nome Completo' };
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
      ? { templateId: tplId, values: { ...values, ref: formatRef(draft) }, overrides: {}, profile: previewProfile, assets, legalOverrides: legal, bilingual: false, today, fontBase: fontBase() }
      : null;
  const key = JSON.stringify(previewProfile) + Object.keys(assets ?? {}).join();
  const { pdf, busy, error } = usePdfRender(input, key, 500);
  return <PdfPreview pdf={pdf} busy={busy} error={error} />;
}

export function ProfileEditPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const isNew = !id || id === 'novo';
  const tipo = sp.get('tipo');
  const kind = tipo === 'pessoa' ? 'pessoa' : 'empresa';
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
  const area = sectorById(sp.get('area') as SectorId);
  const fresh = () => {
    const pk = area?.profile ?? (tipo === 'publica' ? 'publica' : kind);
    const p = newProfile(pk === 'pessoa' ? 'pessoa' : 'empresa', uid());
    if (area) p.sector = area.id;
    // A public body (or community authority) is a company-type profile with the República header.
    if (pk !== 'publica') return p;
    // Community authorities are not State bodies: no emblem by default.
    return area?.id === 'comunidade'
      ? { ...p, tipoEntidade: 'comunitaria' as const, emblema: false, numbering: { ...p.numbering, prefix: 'DEC' } }
      : { ...p, tipoEntidade: 'publica' as const, emblema: true, numbering: { ...p.numbering, prefix: 'OF' } };
  };
  return <ProfileForm key={id ?? `novo-${area?.id ?? tipo ?? kind}`} initial={stored ?? fresh()} isNew={isNew} />;
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

  const [nameError, setNameError] = useState(false);
  const save = async () => {
    const name = (d.kind === 'empresa' ? d.firma : d.nome)?.trim();
    if (!name) {
      setNameError(true);
      setTab('data');
      requestAnimationFrame(() => document.getElementById('profile-name')?.focus());
      return;
    }
    setNameError(false);
    await saveProfile(d);
    setDirty(false);
    toast(t('profiles.saved'));
    if (isNew) {
      setActive(d.id);
      navigate(`/perfis/${d.id}`, { replace: true });
    }
  };

  const company = d.kind === 'empresa';
  const community = company && d.tipoEntidade === 'comunitaria';
  const publicBody = company && (d.tipoEntidade === 'publica' || community);
  const b = d.branding;
  const adjusted = ensurePrintContrast(b.accent);

  // Area and professional registration: shared by company and personal profiles.
  const knownOrdem = !d.ordemProfissional || ORDENS_PROFISSIONAIS.includes(d.ordemProfissional);
  const areaGroup = (
    <Group title={tx('Área de actividade', 'Area of work')}>
      <FieldWrap
        className="sm:col-span-2"
        label={tx('Em que área trabalha com este perfil?', 'Which area do you work in with this profile?')}
        hint={tx('Os documentos desta área aparecem primeiro. Todos continuam disponíveis na pesquisa.', 'Documents for this area are shown first. Everything stays searchable.')}
      >
        {({ id, describedBy }) => (
          <Select id={id} aria-describedby={describedBy} value={d.sector ?? ''} onChange={(e) => set({ sector: (e.target.value || undefined) as SectorId | undefined })}>
            <option value="">{tx('Geral', 'General')}</option>
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'en' ? s.title.en : s.title.pt}
              </option>
            ))}
          </Select>
        )}
      </FieldWrap>
      {!publicBody ? (
        <>
          <FieldWrap label={tx('Ordem profissional (opcional)', 'Professional order (optional)')} hint={tx('Aparece por baixo da assinatura, com o número.', 'Printed under the signature, with the number.')}>
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={knownOrdem ? (d.ordemProfissional ?? '') : '__outra'}
                onChange={(e) => set({ ordemProfissional: e.target.value === '__outra' ? ' ' : e.target.value || undefined })}
              >
                <option value="">—</option>
                {ORDENS_PROFISSIONAIS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                <option value="__outra">{tx('Outra', 'Other')}</option>
              </Select>
            )}
          </FieldWrap>
          {!knownOrdem ? (
            <Text label={tx('Nome da ordem ou associação profissional', 'Name of the professional body')} value={d.ordemProfissional?.trim()} onChange={(v) => set({ ordemProfissional: v || ' ' })} />
          ) : null}
          <Text label={tx('N.º de inscrição / carteira profissional', 'Registration / card number')} value={d.ordemNumero ?? d.oamCarteira} onChange={(v) => set({ ordemNumero: v })} />
          {company ? (
            <Text
              label={tx('Licença ou alvará do estabelecimento (opcional)', 'Establishment licence (optional)')}
              value={d.licenca}
              onChange={(v) => set({ licenca: v })}
              hint={tx('Ex.: licença da clínica, alvará de empreiteiro, autorização da escola.', 'E.g. clinic licence, contractor permit, school authorisation.')}
            />
          ) : (
            <>
              <Text label={tx('Título (opcional)', 'Title (optional)')} value={d.tituloProfissional} onChange={(v) => set({ tituloProfissional: v })} hint={tx('Ex.: Dr., Dra., Eng.º, Arq.º', 'E.g. Dr., Eng.')} />
              <Text label={tx('Especialidade (opcional)', 'Specialty (optional)')} value={d.especialidade} onChange={(v) => set({ especialidade: v })} hint={tx('Ex.: Medicina Interna, Direito Laboral', 'E.g. Internal Medicine, Labour Law')} />
            </>
          )}
        </>
      ) : null}
    </Group>
  );

  const dataTab = company ? (
    <>
      {areaGroup}
      {publicBody ? (
        <Group title={community ? tx('Identificação da autoridade comunitária', 'Community authority details') : tx('Identificação da entidade pública', 'Public body details')}>
          <Text
            className="sm:col-span-2"
            label={community ? tx('Unidade (bairro, quarteirão ou povoação)', 'Unit (neighbourhood, block or village)') : tx('Nome da entidade', 'Name of the body')}
            value={d.firma}
            onChange={(v) => set({ firma: v })}
            inputId="profile-name"
            error={nameError && !d.firma?.trim() ? tx('Indique o nome da entidade', 'Enter the name of the body') : undefined}
            hint={community ? tx('Ex.: Secretaria do Bairro da Malhangalene', 'E.g. Secretaria do Bairro da Malhangalene') : tx('Ex.: Direcção Provincial de Saúde de Nampula', 'E.g. Direcção Provincial de Saúde de Nampula')}
          />
          {community ? (
            <Text
              className="sm:col-span-2"
              label={tx('Acto de nomeação ou reconhecimento (opcional)', 'Appointment or recognition (optional)')}
              value={d.licenca}
              onChange={(v) => set({ licenca: v })}
              hint={tx('Ex.: Despacho do Presidente do Conselho Municipal n.º 12/2024', 'E.g. appointment order number')}
            />
          ) : null}
          <FieldWrap className="sm:col-span-2" label={tx('Linhas do cabeçalho', 'Header lines')} hint={tx('Uma por linha, por baixo de «REPÚBLICA DE MOÇAMBIQUE». Ex.: MINISTÉRIO DA SAÚDE / DIRECÇÃO NACIONAL DE RECURSOS HUMANOS', 'One per line, below "REPÚBLICA DE MOÇAMBIQUE". E.g. MINISTÉRIO DA SAÚDE / DIRECÇÃO NACIONAL DE RECURSOS HUMANOS')}>
            {({ id, describedBy }) => (
              <TextArea id={id} aria-describedby={describedBy} rows={3} value={d.hierarquia ?? ''} onChange={(e) => set({ hierarquia: e.target.value })} />
            )}
          </FieldWrap>
          <Text label={tx('Sigla para referências', 'Acronym for references')} value={d.sigla} onChange={(v) => set({ sigla: v.toUpperCase() })} hint={tx('Ex.: DRH/MISAU — aparece em «Ofício n.º 12/DRH/MISAU/2026».', 'E.g. DRH/MISAU — used in reference numbers.')} />
          <Text label="NUIT" value={d.nuit} onChange={(v) => set({ nuit: v })} inputMode="numeric" />
          <p className="sm:col-span-2 text-muted text-[0.94rem]">
            {community
              ? tx(
                  'As declarações das autoridades comunitárias servem de meio de prova e não substituem documentos oficiais (atestados, certidões, DUAT, registo criminal). O emblema da República fica desligado por defeito.',
                  'Community authority declarations are evidence only and do not replace official documents. The national emblem is off by default.',
                )
              : tx(
                  'O emblema da República identifica órgãos e instituições do Estado. Use este perfil apenas para documentos emitidos em nome de uma entidade pública.',
                  'The national emblem identifies State bodies. Use this profile only for documents issued on behalf of a public body.',
                )}
          </p>
        </Group>
      ) : (
      <Group title={t('profiles.companySection')}>
        <Text className="sm:col-span-2" label={tx('Firma (nome legal)', 'Registered name')} value={d.firma} onChange={(v) => set({ firma: v })} inputId="profile-name" error={nameError && !d.firma?.trim() ? tx('Indique o nome da empresa', 'Enter the company name') : undefined} hint={tx('Ex.: Construções Machava, Lda', 'E.g. Construções Machava, Lda')} />
        <Text label={tx('Nome comercial', 'Trading name')} value={d.nomeComercial} onChange={(v) => set({ nomeComercial: v })} />
        <Text label="NUIT" value={d.nuit} onChange={(v) => set({ nuit: v })} inputMode="numeric" />
        <Text label="NUEL" value={d.nuel} onChange={(v) => set({ nuel: v })} inputMode="numeric" />
        <Text label={tx('N.º de inscrição no INSS', 'INSS registration number')} value={d.inss} onChange={(v) => set({ inss: v })} />
        <Text label={tx('Alvará / licença (opcional)', 'Licence (optional)')} value={d.alvara} onChange={(v) => set({ alvara: v })} />
        <Text label={tx('Capital social (opcional)', 'Share capital (optional)')} value={d.capitalSocial} onChange={(v) => set({ capitalSocial: v })} inputMode="decimal" />
      </Group>
      )}
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
      {areaGroup}
      <Group title={t('profiles.personSection')}>
        <Text className="sm:col-span-2" label={tx('Nome completo', 'Full name')} value={d.nome} onChange={(v) => set({ nome: v })} inputId="profile-name" error={nameError && !d.nome?.trim() ? tx('Indique o seu nome completo', 'Enter your full name') : undefined} />
        <FieldWrap label={tx('Tratamento', 'Form of address')} hint={tx('Para a concordância do texto (portador / portadora).', 'For grammatical agreement in documents.')}>
          {({ id, describedBy }) => (
            <Select id={id} aria-describedby={describedBy} value={d.genero ?? ''} onChange={(e) => set({ genero: (e.target.value || undefined) as Profile['genero'] })}>
              <option value="">—</option>
              <option value="M">{tx('Senhor', 'Mr')}</option>
              <option value="F">{tx('Senhora', 'Ms')}</option>
            </Select>
          )}
        </FieldWrap>
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
        <Text label={tx('Profissão (opcional)', 'Occupation (optional)')} value={d.profissao} onChange={(v) => set({ profissao: v })} hint={tx('Ex.: Advogado, Contabilista', 'E.g. Lawyer, Accountant')} />

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
      {publicBody ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Checkbox
              label={tx('Imprimir o emblema da República no cabeçalho', 'Print the national emblem in the header')}
              hint={tx('Desligue se a instituição usa o seu próprio logótipo (ex.: institutos, universidades).', 'Turn off if the institution uses its own logo.')}
              checked={d.emblema !== false}
              onChange={(v) => set({ emblema: v })}
            />
          </div>
          {d.emblema === false ? <ImageField kind="logo" label={t('profiles.logo')} hint={t('profiles.logoHelp')} branding={b} onChange={setB} /> : null}
        </div>
      ) : company ? (
        <>
          <RadioGroup
            legend={t('profiles.layout')}
            name="layout"
            value={b.layout}
            onChange={(v) => setB({ layout: v as Branding['layout'] })}
            options={(['classico', 'lateral', 'moderno', 'elegante', 'faixa', 'minimo'] as const).map((k) => ({
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

      <fieldset className="mt-8 border border-border rounded-[var(--radius-md)] p-4 sm:p-5">
        <legend className="font-bold text-[1.1rem] px-1">{t('profiles.sizes')}</legend>
        <p className="text-muted mb-4">{t('profiles.sizesHelp')}</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {company ? (
            <SizeSlider label={t('profiles.logoSize')} value={b.logoScale ?? 1} min={0.5} max={2.5} onChange={(v) => setB({ logoScale: v })} resetLabel={t('profiles.resetSize')} />
          ) : null}
          <SizeSlider label={t('profiles.signatureSize')} value={b.signatureScale ?? 1} min={0.5} max={3} onChange={(v) => setB({ signatureScale: v })} resetLabel={t('profiles.resetSize')} />
          {company ? (
            <SizeSlider label={t('profiles.stampSize')} value={b.stampScale ?? 1} min={0.5} max={2.5} onChange={(v) => setB({ stampScale: v })} resetLabel={t('profiles.resetSize')} />
          ) : null}
        </div>
      </fieldset>

      {company ? (
        <div className="grid gap-5 sm:grid-cols-2 mt-8">
          <FieldWrap label={t('profiles.tagline')} hint={t('profiles.taglineHelp')} className="sm:col-span-2">
            {({ id, describedBy }) => (
              <TextInput id={id} aria-describedby={describedBy} maxLength={120} value={b.tagline ?? ''} onChange={(e) => setB({ tagline: e.target.value })} />
            )}
          </FieldWrap>
          <FieldWrap label={t('profiles.footerNote')} hint={t('profiles.footerNoteHelp')} className="sm:col-span-2">
            {({ id, describedBy }) => (
              <TextInput id={id} aria-describedby={describedBy} maxLength={200} value={b.footerNote ?? ''} onChange={(e) => setB({ footerNote: e.target.value })} />
            )}
          </FieldWrap>
        </div>
      ) : null}

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
        <RadioGroup
          legend={t('profiles.textSize')}
          name="textSize"
          value={b.textSize ?? 'normal'}
          onChange={(v) => setB({ textSize: v as Branding['textSize'] })}
          options={(['pequeno', 'normal', 'grande'] as const).map((k) => ({ value: k, label: t(`profiles.textSizes.${k}`) }))}
        />
        <RadioGroup
          legend={t('profiles.lineSpacing')}
          name="lineSpacing"
          value={b.lineSpacing ?? 'normal'}
          onChange={(v) => setB({ lineSpacing: v as Branding['lineSpacing'] })}
          options={(['compacto', 'normal', 'amplo'] as const).map((k) => ({ value: k, label: t(`profiles.lineSpacings.${k}`) }))}
        />
        <div className="sm:col-span-2">
          <Checkbox label={t('profiles.pageNumbers')} checked={b.pageNumbers} onChange={(v) => setB({ pageNumbers: v })} />
          <Checkbox label={t('profiles.accentHeadings')} checked={b.accentHeadings !== false} onChange={(v) => setB({ accentHeadings: v })} />
          <Checkbox label={t('profiles.pageBorder')} checked={Boolean(b.pageBorder)} onChange={(v) => setB({ pageBorder: v })} />
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
        <h1 className="text-[1.9rem] sm:text-[2.3rem] font-bold">{isNew ? (publicBody ? t('profile.createPublic') : company ? t('profile.createCompany') : t('profile.createPerson')) : t('profiles.edit')}</h1>
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
