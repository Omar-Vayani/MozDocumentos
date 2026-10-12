// Payslips for every saved employee in one go: one PDF with one payslip per
// page, and (optionally) each payslip saved in "Os meus documentos".

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePrefs } from '@/app/store';
import { defaultValues, makeLegalSnapshot } from '@/documents/context';
import { loadTemplate } from '@/documents/registry';
import type { RenderInput } from '@/documents/render/types';
import { FORMA_PAGAMENTO_OPTIONS } from '@/documents/templates/_shared';
import { downloadPdf, fontBase, renderBatch } from '@/features/editor/pdfClient';
import { formatMoney, formatMonthYear, parseMoney, todayISO, uid } from '@/lib/format';
import { db } from '@/lib/storage/db';
import { useActiveProfile, useLegalOverrides, usePeople } from '@/lib/storage/hooks';
import { brandingAssets, formatRef, saveDocument } from '@/lib/storage/repo';
import { profileDisplayName, type Person } from '@/lib/storage/types';
import { Button, ButtonLink } from '@/ui/Button';
import { Checkbox, FieldWrap, Select, TextInput } from '@/ui/Field';
import { Notice, PageHeader, Spinner, toast } from '@/ui/misc';
import { netSalary } from './calc';

type Row = { include: boolean; base: string; allowances: string; dependants: string; irps: string; other: string };

function rowFor(p: Person): Row {
  return { include: Boolean(p.salarioBase), base: p.salarioBase ?? '', allowances: '', dependants: '0', irps: '', other: '' };
}

export function BatchPayslipsPage() {
  const { t } = useTranslation();
  const pt = usePrefs((s) => s.lang) === 'pt';
  const tx = (a: string, b: string) => (pt ? a : b);
  const profile = useActiveProfile();
  const people = usePeople();
  const overrides = useLegalOverrides();
  const legal = useMemo(() => makeLegalSnapshot(overrides ?? {}), [overrides]);
  const workers = useMemo(() => (people ?? []).filter((p) => p.role === 'trabalhador'), [people]);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [payDate, setPayDate] = useState(todayISO());
  const [method, setMethod] = useState('transferência bancária');
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows((r) => {
      const next = { ...r };
      for (const w of workers) if (!next[w.id]) next[w.id] = rowFor(w);
      return next;
    });
  }, [workers]);

  const setRow = (id: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const selected = workers.filter((w) => rows[w.id]?.include && (parseMoney(rows[w.id]?.base) ?? 0) > 0);

  const totals = selected.reduce(
    (acc, w) => {
      const r = rows[w.id];
      const n = netSalary(legal, {
        base: parseMoney(r.base) ?? 0,
        allowances: parseMoney(r.allowances) ?? 0,
        dependants: Number(r.dependants) || 0,
        irpsOverride: r.irps.trim() ? parseMoney(r.irps) : null,
        otherDeductions: parseMoney(r.other) ?? 0,
      });
      return { gross: acc.gross + n.gross, net: acc.net + n.net, inss: acc.inss + n.inssWorker + n.inssEmployer };
    },
    { gross: 0, net: 0, inss: 0 },
  );

  const generate = async () => {
    if (!selected.length || !profile) return;
    setBusy(true);
    try {
      const tpl = await loadTemplate('recibo-de-salario');
      const assets = await brandingAssets(profile);
      const today = todayISO();
      let counter = profile.numbering.counter;
      const inputs: RenderInput[] = [];
      const docs = [];
      for (const w of selected) {
        const r = rows[w.id];
        counter += 1;
        const ref = formatRef(profile, counter);
        const values = {
          ...defaultValues(tpl, { profile, today, nextRef: ref }),
          ref,
          periodo: month,
          data: payDate,
          formaPagamento: method,
          trabalhadorNome: w.nome,
          trabalhadorGenero: w.genero || 'M',
          trabalhadorCargo: w.cargo ?? '',
          trabalhadorCategoria: w.categoria ?? '',
          trabalhadorNuit: w.nuit ?? '',
          trabalhadorInss: w.inss ?? '',
          trabalhadorDataAdmissao: w.dataAdmissao ?? '',
          salarioBase: r.base,
          dependentes: r.dependants,
          subsidios: parseMoney(r.allowances) ? [{ descricao: 'Subsídios', valor: r.allowances }] : [],
          irps: r.irps,
          outrosDescontos: parseMoney(r.other) ? [{ descricao: 'Outros descontos', valor: r.other }] : [],
        };
        inputs.push({ templateId: tpl.id, values, overrides: {}, profile, assets, legalOverrides: overrides ?? {}, bilingual: false, today, fontBase: fontBase() });
        docs.push({ id: uid(), templateId: tpl.id, profileId: profile.id, status: 'final' as const, ref, title: tx('Recibo de salário', 'Payslip'), personName: w.nome, values, overrides: {}, createdAt: Date.now(), updatedAt: Date.now() });
      }
      const pdf = await renderBatch(inputs, `Recibos de vencimento — ${formatMonthYear(month)}`);
      downloadPdf(pdf, `recibos-de-vencimento-${month}.pdf`);
      if (save) {
        for (const d of docs) await saveDocument(d);
        const year = new Date().getFullYear();
        await db.profiles.update(profile.id, { numbering: { ...profile.numbering, year, counter }, updatedAt: Date.now() });
      }
      toast(t('batch.done', { count: inputs.length }));
    } catch (e) {
      console.error(e);
      toast(t('editor.renderError'));
    } finally {
      setBusy(false);
    }
  };

  const cell = 'px-2 py-1.5';
  const input = 'w-full min-h-11 px-2 bg-bg border border-border rounded-[var(--radius-sm)] tabular-nums';

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="mb-3">
        <Link to="/ferramentas">{t('tools.title')}</Link>
      </p>
      <PageHeader title={t('tools.batchTitle')} intro={t('batch.intro')} />

      {profile === null ? (
        <Notice kind="warning" title={t('batch.noProfile')}>
          <Link to="/perfis/novo?tipo=empresa">{t('profile.createCompany')}</Link>
        </Notice>
      ) : null}

      <div className="card p-5 grid gap-4 sm:grid-cols-3 mb-6">
        <FieldWrap label={tx('Mês', 'Month')}>
          {({ id }) => <TextInput id={id} type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
        </FieldWrap>
        <FieldWrap label={tx('Data de pagamento', 'Payment date')}>
          {({ id }) => <TextInput id={id} type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />}
        </FieldWrap>
        <FieldWrap label={tx('Forma de pagamento', 'Payment method')}>
          {({ id }) => (
            <Select id={id} value={method} onChange={(e) => setMethod(e.target.value)}>
              {FORMA_PAGAMENTO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {pt ? o.label.pt : o.label.en}
                </option>
              ))}
            </Select>
          )}
        </FieldWrap>
        {profile ? (
          <p className="sm:col-span-3 text-muted text-[0.95rem]">
            {t('editor.issuer')}: <strong className="text-text">{profileDisplayName(profile)}</strong> · {t('batch.firstRef', { ref: formatRef(profile) })}
          </p>
        ) : null}
      </div>

      {people === undefined ? (
        <Spinner />
      ) : workers.length === 0 ? (
        <div className="card p-6">
          <p className="font-semibold">{t('batch.noWorkers')}</p>
          <p className="text-muted mt-1">{t('batch.noWorkersHelp')}</p>
          <ButtonLink to="/pessoas" className="mt-4" icon="plus">
            {t('people.add')}
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[56rem] text-[0.95rem] border-collapse">
              <thead className="bg-surface text-left">
                <tr>
                  <th className={cell} scope="col">
                    <span className="sr-only">{tx('Incluir', 'Include')}</span>
                  </th>
                  <th className={cell} scope="col">{tx('Trabalhador', 'Employee')}</th>
                  <th className={cell} scope="col">{tx('Salário base', 'Base salary')}</th>
                  <th className={cell} scope="col">{tx('Subsídios', 'Allowances')}</th>
                  <th className={cell} scope="col">{tx('Dependentes', 'Dependants')}</th>
                  <th className={cell} scope="col">IRPS</th>
                  <th className={cell} scope="col">{tx('Outros descontos', 'Other deductions')}</th>
                  <th className={`${cell} text-right`} scope="col">{tx('Líquido', 'Net')}</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const r = rows[w.id] ?? rowFor(w);
                  const n = netSalary(legal, {
                    base: parseMoney(r.base) ?? 0,
                    allowances: parseMoney(r.allowances) ?? 0,
                    dependants: Number(r.dependants) || 0,
                    irpsOverride: r.irps.trim() ? parseMoney(r.irps) : null,
                    otherDeductions: parseMoney(r.other) ?? 0,
                  });
                  const name = w.nome || '—';
                  return (
                    <tr key={w.id} className={`border-t border-border ${r.include ? '' : 'opacity-60'}`}>
                      <td className={cell}>
                        <input
                          type="checkbox"
                          checked={r.include}
                          onChange={(e) => setRow(w.id, { include: e.target.checked })}
                          aria-label={`${tx('Incluir', 'Include')} ${name}`}
                          className="size-6 accent-[var(--primary)] cursor-pointer"
                        />
                      </td>
                      <td className={cell}>
                        <span className="font-semibold block">{name}</span>
                        <span className="text-muted text-[0.85rem]">{w.cargo}</span>
                      </td>
                      <td className={cell}>
                        <input className={input} inputMode="decimal" aria-label={`${tx('Salário base', 'Base salary')} ${name}`} value={r.base} onChange={(e) => setRow(w.id, { base: e.target.value })} />
                      </td>
                      <td className={cell}>
                        <input className={input} inputMode="decimal" aria-label={`${tx('Subsídios', 'Allowances')} ${name}`} value={r.allowances} onChange={(e) => setRow(w.id, { allowances: e.target.value })} />
                      </td>
                      <td className={cell}>
                        <input className={`${input} max-w-20`} type="number" min={0} max={20} aria-label={`${tx('Dependentes', 'Dependants')} ${name}`} value={r.dependants} onChange={(e) => setRow(w.id, { dependants: e.target.value })} />
                      </td>
                      <td className={cell}>
                        <input
                          className={input}
                          inputMode="decimal"
                          aria-label={`IRPS ${name}`}
                          placeholder={n.irps == null ? '—' : formatMoney(n.irps, false)}
                          value={r.irps}
                          onChange={(e) => setRow(w.id, { irps: e.target.value })}
                        />
                      </td>
                      <td className={cell}>
                        <input className={input} inputMode="decimal" aria-label={`${tx('Outros descontos', 'Other deductions')} ${name}`} value={r.other} onChange={(e) => setRow(w.id, { other: e.target.value })} />
                      </td>
                      <td className={`${cell} text-right tabular-nums font-semibold whitespace-nowrap`}>{formatMoney(n.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <dl className="grid grid-cols-3 gap-3 max-w-2xl">
              <div className="card p-3">
                <dt className="text-muted text-[0.85rem]">{tx('Total bruto', 'Total gross')}</dt>
                <dd className="font-bold tabular-nums">{formatMoney(totals.gross)}</dd>
              </div>
              <div className="card p-3">
                <dt className="text-muted text-[0.85rem]">{tx('Total líquido', 'Total net')}</dt>
                <dd className="font-bold tabular-nums">{formatMoney(totals.net)}</dd>
              </div>
              <div className="card p-3">
                <dt className="text-muted text-[0.85rem]">{tx('INSS a entregar', 'INSS to pay')}</dt>
                <dd className="font-bold tabular-nums">{formatMoney(totals.inss)}</dd>
              </div>
            </dl>
            <div className="grid gap-2 justify-items-start md:justify-items-end">
              <Checkbox label={t('batch.save')} checked={save} onChange={setSave} />
              <Button icon="download" onClick={generate} disabled={busy || !selected.length || !profile}>
                {busy ? t('editor.rendering') : t('batch.generate', { count: selected.length })}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-muted text-[0.92rem]">{t('batch.hint')}</p>
        </>
      )}
    </div>
  );
}
