import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePrefs } from '@/app/store';
import { makeLegalSnapshot } from '@/documents/context';
import { cite } from '@/documents/templates/_shared';
import { MINIMUM_WAGES_2026, type LegalRefId, type MinimumWage } from '@/legal/mz-legal';
import { formatDateLong, formatMoney, formatPercent, parseMoney, todayISO } from '@/lib/format';
import { useLegalOverrides } from '@/lib/storage/hooks';
import { ButtonLink } from '@/ui/Button';
import { FieldWrap, RadioGroup, Select, TextInput } from '@/ui/Field';
import { Icon, type IconName } from '@/ui/Icon';
import { PageHeader } from '@/ui/misc';
import { compensation, leaveEntitlement, netSalary, nonRenewalNotice, resignationNotice, type CompensationKind } from './calc';

function Tool({ id, icon, title, intro, legalRef, children }: { id: string; icon: IconName; title: string; intro: string; legalRef?: LegalRefId; children: ReactNode }) {
  return (
    <section id={id} className="card p-5 sm:p-6 scroll-mt-6" aria-labelledby={`${id}-h`}>
      <div className="flex items-start gap-3">
        <span className="size-10 rounded-[var(--radius)] bg-primary-soft text-primary grid place-items-center shrink-0">
          <Icon name={icon} size={22} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-h`} className="text-[1.3rem] font-bold">
            {title}
          </h2>
          <p className="text-muted mt-0.5">{intro}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
      {legalRef ? <p className="mt-4 text-[0.85rem] text-muted">{cite(legalRef)}</p> : null}
    </section>
  );
}

function Result({ rows, highlight }: { rows: { label: string; value: string; strong?: boolean }[]; highlight?: { label: string; value: string } }) {
  return (
    <div className="mt-5 rounded-[var(--radius-md)] bg-surface border border-border overflow-hidden" aria-live="polite">
      {highlight ? (
        <div className="px-4 py-3 bg-primary-soft border-b border-border flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold">{highlight.label}</span>
          <span className="text-[1.5rem] font-extrabold text-primary tabular-nums">{highlight.value}</span>
        </div>
      ) : null}
      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="px-4 py-2 flex justify-between gap-4">
            <dt className="text-muted">{r.label}</dt>
            <dd className={`tabular-nums text-right ${r.strong ? 'font-bold' : ''}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MoneyInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <FieldWrap label={label} hint={hint}>
      {({ id, describedBy }) => (
        <div className="flex items-stretch">
          <TextInput id={id} aria-describedby={describedBy} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="rounded-r-none" />
          <span className="inline-flex items-center px-3 border-2 border-l-0 border-border-strong bg-surface font-semibold rounded-r-[var(--radius-sm)]">MT</span>
        </div>
      )}
    </FieldWrap>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrap label={label}>
      {({ id }) => <TextInput id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />}
    </FieldWrap>
  );
}

export function ToolsPage() {
  const { t } = useTranslation();
  const pt = usePrefs((s) => s.lang) === 'pt';
  const tx = (a: string, b: string) => (pt ? a : b);
  const overrides = useLegalOverrides();
  const legal = useMemo(() => makeLegalSnapshot(overrides ?? {}), [overrides]);
  const today = todayISO();

  // Net salary
  const [base, setBase] = useState('25000');
  const [allow, setAllow] = useState('');
  const [deps, setDeps] = useState('0');
  const [irps, setIrps] = useState('');
  const ns = netSalary(legal, {
    base: parseMoney(base) ?? 0,
    allowances: parseMoney(allow) ?? 0,
    dependants: Number(deps) || 0,
    irpsOverride: irps.trim() ? parseMoney(irps) : null,
  });

  // Leave
  const [admL, setAdmL] = useState('2025-03-01');
  const [refL, setRefL] = useState(today);
  const [shortL, setShortL] = useState('nao');
  const le = leaveEntitlement(legal, admL, refL, shortL === 'sim');

  // Resignation
  const [admR, setAdmR] = useState('2022-06-01');
  const [letterR, setLetterR] = useState(today);
  const [typeR, setTypeR] = useState('indeterminado');
  const rn = resignationNotice(legal, admR, letterR, typeR === 'prazo');

  // Non-renewal
  const [startN, setStartN] = useState('2026-01-01');
  const [endN, setEndN] = useState('2026-12-31');
  const nr = nonRenewalNotice(legal, startN, endN);

  // Compensation
  const [kindC, setKindC] = useState<CompensationKind>('ilicito');
  const [baseC, setBaseC] = useState('25000');
  const [admC, setAdmC] = useState('2020-01-01');
  const [endC, setEndC] = useState(today);
  const wages = (legal.table('salarioMinimo') as MinimumWage[]) ?? MINIMUM_WAGES_2026;
  const [sectorC, setSectorC] = useState(wages[0]?.sector ?? '');
  const minWage = wages.find((w) => w.sector === sectorC)?.value ?? null;
  const co = compensation(legal, { kind: kindC, monthlyBase: parseMoney(baseC) ?? 0, admission: admC, end: endC, minimumWage: minWage });

  const days = (n: number) => tx(`${n} dias`, `${n} days`);

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader title={t('tools.title')} intro={t('tools.intro')} />
      <nav aria-label={t('tools.title')} className="mb-8 flex flex-wrap gap-2">
        {[
          ['salario', t('tools.net')],
          ['ferias', t('tools.leave')],
          ['aviso', t('tools.notice')],
          ['renovacao', t('tools.nonRenewal')],
          ['indemnizacao', t('tools.compensation')],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="no-underline text-text px-3.5 min-h-10 inline-flex items-center rounded-full border border-border hover:border-primary hover:text-primary">
            {label}
          </a>
        ))}
      </nav>

      <div className="card p-5 sm:p-6 mb-6 bg-primary-soft border-primary/30 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="size-11 rounded-full bg-primary text-primary-text grid place-items-center shrink-0">
          <Icon name="layers" size={22} />
        </span>
        <div className="flex-1">
          <h2 className="text-[1.2rem] font-bold">{t('tools.batchTitle')}</h2>
          <p className="mt-0.5">{t('tools.batchText')}</p>
        </div>
        <ButtonLink to="/ferramentas/recibos-em-lote" iconRight="arrowRight">
          {t('tools.batchOpen')}
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tool id="salario" icon="coins" title={t('tools.net')} intro={t('tools.netIntro')} legalRef="inssTaxaTrabalhador">
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput label={tx('Salário base mensal', 'Monthly base salary')} value={base} onChange={setBase} />
            <MoneyInput label={tx('Subsídios', 'Allowances')} value={allow} onChange={setAllow} />
            <FieldWrap label={tx('Dependentes (IRPS)', 'Dependants (IRPS)')}>
              {({ id }) => <TextInput id={id} type="number" min={0} max={20} value={deps} onChange={(e) => setDeps(e.target.value)} />}
            </FieldWrap>
            <MoneyInput label={tx('IRPS (se souber)', 'IRPS (if known)')} value={irps} onChange={setIrps} />
          </div>
          <Result
            highlight={{ label: tx('Salário líquido', 'Net pay'), value: formatMoney(ns.net) }}
            rows={[
              { label: tx('Salário bruto', 'Gross pay'), value: formatMoney(ns.gross) },
              { label: `INSS ${tx('trabalhador', 'employee')} (${formatPercent(ns.rateWorker)})`, value: `− ${formatMoney(ns.inssWorker)}` },
              { label: 'IRPS', value: ns.irps == null ? tx('Tabela desactivada', 'Table disabled') : `− ${formatMoney(ns.irps)}` },
              { label: `INSS ${tx('empresa', 'employer')} (${formatPercent(ns.rateEmployer)})`, value: formatMoney(ns.inssEmployer) },
              { label: tx('Custo total para a empresa', 'Total cost to employer'), value: formatMoney(ns.employerCost), strong: true },
            ]}
          />
          {ns.irps == null ? (
            <p className="mt-3 text-[0.92rem] text-muted">
              {t('tools.irpsOff')} <Link to="/definicoes">{t('nav.settings')}</Link>
            </p>
          ) : null}
        </Tool>

        <Tool id="ferias" icon="sun" title={t('tools.leave')} intro={t('tools.leaveIntro')} legalRef="feriasDireito">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput label={tx('Data de admissão', 'Start date')} value={admL} onChange={setAdmL} />
            <DateInput label={tx('Calcular para a data', 'As of date')} value={refL} onChange={setRefL} />
          </div>
          <div className="mt-4">
            <RadioGroup
              legend={tx('Contrato a prazo de menos de um ano?', 'Fixed term under one year?')}
              name="shortL"
              inline
              value={shortL}
              onChange={setShortL}
              options={[
                { value: 'nao', label: tx('Não', 'No') },
                { value: 'sim', label: tx('Sim', 'Yes') },
              ]}
            />
          </div>
          <Result
            highlight={{ label: tx('Dias de férias por ano', 'Leave days per year'), value: days(le.days) }}
            rows={[{ label: tx('Meses de serviço', 'Months of service'), value: String(le.serviceMonths) }]}
          />
        </Tool>

        <Tool id="aviso" icon="logout" title={t('tools.notice')} intro={t('tools.noticeIntro')} legalRef="avisoPrevioTrabalhador">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput label={tx('Data de admissão', 'Start date')} value={admR} onChange={setAdmR} />
            <DateInput label={tx('Data da carta', 'Letter date')} value={letterR} onChange={setLetterR} />
            <FieldWrap label={tx('Tipo de contrato', 'Contract type')} className="sm:col-span-2">
              {({ id }) => (
                <Select id={id} value={typeR} onChange={(e) => setTypeR(e.target.value)}>
                  <option value="indeterminado">{tx('Sem data de fim', 'Permanent')}</option>
                  <option value="prazo">{tx('Com data de fim (a prazo)', 'Fixed term')}</option>
                </Select>
              )}
            </FieldWrap>
          </div>
          <Result
            highlight={{
              label: tx('Aviso prévio mínimo', 'Minimum notice'),
              value: rn.days == null ? tx('Sem prazo legal', 'None set by law') : days(rn.days),
            }}
            rows={[
              { label: tx('Último dia de trabalho', 'Last working day'), value: rn.lastDay ? formatDateLong(rn.lastDay) : '—' },
              { label: tx('Meses de serviço', 'Months of service'), value: String(rn.serviceMonths) },
            ]}
          />
          <p className="mt-3">
            <Link to="/documentos/rescisao-pelo-trabalhador">{tx('Criar a carta de rescisão', 'Create the resignation letter')}</Link>
          </p>
        </Tool>

        <Tool id="renovacao" icon="calendar" title={t('tools.nonRenewal')} intro={t('tools.nonRenewalIntro')} legalRef="naoRenovacaoAviso">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput label={tx('Início do contrato', 'Contract start')} value={startN} onChange={setStartN} />
            <DateInput label={tx('Fim do contrato', 'Contract end')} value={endN} onChange={setEndN} />
          </div>
          <Result
            highlight={{
              label: tx('Avisar até', 'Notify by'),
              value: nr.notifyBy ? formatDateLong(nr.notifyBy) : tx('Sem aviso legal', 'No legal notice'),
            }}
            rows={[
              { label: tx('Antecedência', 'Notice'), value: nr.days == null ? '—' : days(nr.days) },
              { label: tx('Duração do contrato (meses)', 'Contract length (months)'), value: String(nr.contractMonths) },
            ]}
          />
          <p className="mt-3">
            <Link to="/documentos/nao-renovacao">{tx('Criar a comunicação de não renovação', 'Create the non-renewal notice')}</Link>
          </p>
        </Tool>

        <div className="lg:col-span-2">
          <Tool id="indemnizacao" icon="scale" title={t('tools.compensation')} intro={t('tools.compensationIntro')} legalRef={kindC === 'economico' ? 'indemnizacaoMotivosEconomicos' : kindC === 'ilicito' ? 'indemnizacaoDespedimentoIlicito' : 'rescisaoJustaCausaTrabalhador'}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FieldWrap label={tx('Situação', 'Situation')} className="sm:col-span-2">
                {({ id }) => (
                  <Select id={id} value={kindC} onChange={(e) => setKindC(e.target.value as CompensationKind)}>
                    <option value="ilicito">{tx('Despedimento ilícito (em vez de reintegração)', 'Unlawful dismissal (instead of reinstatement)')}</option>
                    <option value="justaCausaTrabalhador">{tx('Rescisão com justa causa pelo trabalhador', 'Resignation with just cause')}</option>
                    <option value="economico">{tx('Motivos estruturais, tecnológicos ou de mercado', 'Structural, technological or market reasons')}</option>
                  </Select>
                )}
              </FieldWrap>
              <MoneyInput label={tx('Salário base mensal', 'Monthly base salary')} value={baseC} onChange={setBaseC} />
              {kindC === 'economico' ? (
                <FieldWrap label={tx('Sector (salário mínimo)', 'Sector (minimum wage)')}>
                  {({ id }) => (
                    <Select id={id} value={sectorC} onChange={(e) => setSectorC(e.target.value)}>
                      {wages.map((w) => (
                        <option key={w.sector} value={w.sector}>
                          {w.sector}
                        </option>
                      ))}
                    </Select>
                  )}
                </FieldWrap>
              ) : (
                <div />
              )}
              <DateInput label={tx('Data de admissão', 'Start date')} value={admC} onChange={setAdmC} />
              <DateInput label={tx('Data de cessação', 'End date')} value={endC} onChange={setEndC} />
            </div>
            <Result
              highlight={{ label: tx('Indemnização estimada', 'Estimated compensation'), value: formatMoney(co.amount) }}
              rows={[
                { label: tx('Dias por ano de serviço', 'Days per year of service'), value: String(co.daysPerYear) },
                { label: tx('Anos de serviço', 'Years of service'), value: co.years.toFixed(2).replace('.', ',') },
                { label: tx('Salário diário (base ÷ 30)', 'Daily pay (base ÷ 30)'), value: formatMoney(co.dailyPay) },
              ]}
            />
          </Tool>
        </div>
      </div>
      <p className="mt-8 text-muted text-[0.95rem] max-w-3xl">{t('tools.disclaimer')}</p>
    </div>
  );
}
