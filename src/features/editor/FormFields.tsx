import { useState } from 'react';
import { useController, useFieldArray, useFormContext, useWatch, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useL10n } from '@/app/store';
import { isFieldVisible } from '@/documents/context';
import type { FieldDef, SectionDef, Values, Warning } from '@/documents/model';
import { formatMoney } from '@/lib/format';
import { usePeople } from '@/lib/storage/hooks';
import { newPerson, savePerson } from '@/lib/storage/repo';
import type { Person } from '@/lib/storage/types';
import { Button } from '@/ui/Button';
import { Checkbox, FieldWrap, RadioGroup, Select, TextArea, TextInput } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Sheet, toast } from '@/ui/misc';

export const fieldDomId = (name: string) => `f-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

function errorAt(errors: FieldErrors, path: (string | number)[]): string | undefined {
  let cur: unknown = errors;
  for (const p of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  const m = (cur as { message?: unknown } | undefined)?.message;
  return typeof m === 'string' ? m : undefined;
}

function LegalBadge({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[0.82rem] font-semibold px-1.5 py-0.5 border border-primary text-primary rounded-[var(--radius-sm)] cursor-pointer hover:bg-success-bg"
      >
        <Icon name="book" size={14} />
        {t('editor.legalRequired')}
      </button>
      {open ? <span className="text-[0.9rem] text-muted mt-1 max-w-prose">{text}</span> : null}
    </span>
  );
}

function FieldInput({
  f,
  name,
  computedValue,
  warning,
}: {
  f: FieldDef;
  name: string;
  computedValue?: unknown;
  warning?: Warning;
}) {
  const L = useL10n();
  const { t } = useTranslation();
  const { control, formState } = useFormContext();
  const { field } = useController({ name, control });
  const path = name.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  const error = errorAt(formState.errors, path);
  const id = fieldDomId(name);
  const value = field.value ?? '';
  const hasComputed = f.computedKey && computedValue != null && computedValue !== '';
  const hint = (
    <>
      {f.help ? L(f.help) : null}
      {hasComputed ? (
        <span className="block font-semibold text-text">
          {t('editor.computed', { value: f.type === 'money' ? formatMoney(Number(computedValue)) : String(computedValue) })}
        </span>
      ) : null}
    </>
  );
  const showHint = Boolean(f.help || hasComputed);
  const badge = f.legal ? <LegalBadge text={L(f.legal)} /> : f.required ? null : null;
  // Some labels already say "(opcional)"; show the marker once, in the UI language.
  const bare = L(f.label).replace(/\s*\((opcional|optional)\)\s*$/i, '');
  const label = (
    <>
      {bare}
      {!f.required && !f.legal && f.type !== 'toggle' ? <span className="font-normal text-muted"> {t('common.optional')}</span> : null}
    </>
  );
  const warnBox = warning ? (
    <p className={`mt-1.5 text-[0.95rem] flex gap-1.5 ${warning.level === 'error' ? 'text-error font-semibold' : 'text-warning'}`}>
      <Icon name="alert" size={18} className="shrink-0 mt-0.5" />
      <span>{L(warning.message)}</span>
    </p>
  ) : null;

  if (f.type === 'toggle') {
    return (
      <div id={id}>
        <Checkbox label={bare} hint={f.help ? L(f.help) : undefined} checked={Boolean(field.value)} onChange={(v) => field.onChange(v)} id={`${id}-input`} />
        {warnBox}
      </div>
    );
  }

  if (f.type === 'radio') {
    return (
      <div id={id}>
        <RadioGroup
          legend={label}
          hint={showHint ? hint : undefined}
          name={name}
          inline={(f.options?.length ?? 0) <= 3}
          options={(f.options ?? []).map((o) => ({ value: o.value, label: L(o.label) }))}
          value={String(value)}
          onChange={field.onChange}
          error={error}
        />
        {warnBox}
      </div>
    );
  }

  return (
    <FieldWrap id={`${id}-input`} label={label} hint={showHint ? hint : undefined} error={error} badge={badge}>
      {({ id: inputId, describedBy }) => {
        const common = {
          id: inputId,
          name: field.name,
          onBlur: field.onBlur,
          ref: field.ref,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          'aria-required': f.required || undefined,
        };
        let input;
        switch (f.type) {
          case 'textarea':
            input = (
              <TextArea
                {...common}
                rows={f.rows ?? 4}
                value={String(value)}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={f.placeholder ? L(f.placeholder) : undefined}
              />
            );
            break;
          case 'select':
            input = (
              <Select {...common} value={String(value)} onChange={(e) => field.onChange(e.target.value)}>
                {!f.options?.some((o) => o.value === '') ? <option value="">{t('common.choose')}</option> : null}
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {L(o.label)}
                  </option>
                ))}
              </Select>
            );
            break;
          case 'date':
            input = <TextInput {...common} type="date" value={String(value)} onChange={(e) => field.onChange(e.target.value)} className="max-w-[14rem]" />;
            break;
          case 'month':
            input = (
              <TextInput {...common} type="month" placeholder="AAAA-MM" value={String(value)} onChange={(e) => field.onChange(e.target.value)} className="max-w-[14rem]" />
            );
            break;
          case 'money':
            input = (
              <div className="flex items-stretch max-w-[18rem]">
                <TextInput
                  {...common}
                  inputMode="decimal"
                  autoComplete="off"
                  value={String(value)}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={hasComputed ? formatMoney(Number(computedValue), false) : f.placeholder ? L(f.placeholder) : '0,00'}
                  className="rounded-r-none"
                />
                <span className="inline-flex items-center px-3 border-2 border-l-0 border-border-strong bg-surface font-semibold">MT</span>
              </div>
            );
            break;
          case 'number':
            input = (
              <TextInput
                {...common}
                type="number"
                inputMode="numeric"
                min={f.min}
                max={f.max}
                value={String(value)}
                onChange={(e) => field.onChange(e.target.value)}
                className="max-w-[10rem]"
              />
            );
            break;
          default:
            input = (
              <TextInput
                {...common}
                type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                inputMode={f.type === 'tel' ? 'tel' : undefined}
                autoComplete="off"
                value={String(value)}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={f.placeholder ? L(f.placeholder) : undefined}
              />
            );
        }
        return (
          <>
            {input}
            {warnBox}
          </>
        );
      }}
    </FieldWrap>
  );
}

function LinesField({ f }: { f: FieldDef }) {
  const L = useL10n();
  const { t } = useTranslation();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: f.name });
  const cols = f.columns ?? [];
  return (
    <fieldset id={fieldDomId(f.name)} className="border border-border rounded-[var(--radius)] p-3 sm:p-4">
      <legend className="font-semibold px-1">{L(f.label)}</legend>
      {f.help ? <p className="text-muted text-[0.94rem] mb-2">{L(f.help)}</p> : null}
      <ol className="space-y-3">
        {fields.map((row, i) => (
          <li key={row.id} className="border-l-4 border-border pl-3 py-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.85rem] text-muted font-semibold">#{i + 1}</span>
              <button
                type="button"
                className="text-error underline min-h-10 px-2 cursor-pointer"
                onClick={() => remove(i)}
                aria-label={`${t('editor.removeRow')} ${i + 1}`}
              >
                {t('editor.removeRow')}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {cols.map((c) => (
                <div key={c.name} className={c.type === 'textarea' || cols.length === 1 ? 'sm:col-span-2' : ''}>
                  <FieldInput f={c} name={`${f.name}.${i}.${c.name}`} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        icon="plus"
        className="mt-3"
        onClick={() => append(Object.fromEntries(cols.map((c) => [c.name, c.type === 'toggle' ? false : ''])))}
      >
        {f.addLabel ? L(f.addLabel) : t('editor.addRow')}
      </Button>
    </fieldset>
  );
}

function PersonPicker({ section, fields }: { section: SectionDef; fields: FieldDef[] }) {
  const L = useL10n();
  const { t } = useTranslation();
  const people = usePeople();
  const { setValue, getValues } = useFormContext();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const mapped = fields.filter((f) => f.personKey);
  if (!mapped.length) return null;

  const list = (people ?? [])
    .filter((p) => !q || p.nome.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.role === section.personRole) - Number(a.role === section.personRole));

  const pick = (p: Person) => {
    for (const f of mapped) {
      const v = p[f.personKey!];
      if (v != null && v !== '') setValue(f.name, v, { shouldDirty: true });
    }
    setOpen(false);
  };

  const saveCurrent = async () => {
    const v = getValues();
    const person = newPerson(section.personRole ?? 'outro');
    for (const f of mapped) {
      const val = v[f.name];
      if (val != null && val !== '') (person as Record<string, unknown>)[f.personKey!] = String(val);
    }
    if (!person.nome) return;
    await savePerson(person);
    toast(t('editor.personSaved'));
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button variant="secondary" icon="user" onClick={() => setOpen(true)}>
        {t('editor.pickPerson')}
      </Button>
      <Button variant="quiet" onClick={saveCurrent}>
        {t('editor.savePerson')}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title={t('editor.pickPerson')} description={L(section.title)}>
        {people && people.length > 0 ? (
          <>
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('people.search')} aria-label={t('people.search')} className="mb-3" />
            <ul className="divide-y divide-border border-y border-border">
              {list.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => pick(p)} className="w-full text-left min-h-14 py-2 px-2 hover:bg-surface flex items-center gap-3 cursor-pointer">
                    <Icon name="user" />
                    <span className="flex-1">
                      <span className="font-semibold block">{p.nome || '—'}</span>
                      <span className="text-muted text-[0.9rem]">{[p.cargo, t(`people.roles.${p.role}`)].filter(Boolean).join(' · ')}</span>
                    </span>
                    <Icon name="chevronRight" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted">{t('editor.pickPersonNone')}</p>
        )}
      </Sheet>
    </div>
  );
}

export function SectionFields({
  section,
  fields,
  computed,
  warnings,
}: {
  section: SectionDef;
  fields: FieldDef[];
  computed: Record<string, unknown>;
  warnings: Warning[];
}) {
  const L = useL10n();
  const values = useWatch() as Values;
  const visible = fields.filter((f) => isFieldVisible(f, values));
  if (!visible.length) return null;
  const width = (f: FieldDef) =>
    f.width === 'half' ? 'sm:col-span-3' : f.width === 'third' ? 'sm:col-span-2' : 'sm:col-span-6';
  return (
    <fieldset className="mb-8 border-t-2 border-border-strong pt-4" aria-labelledby={`sec-${section.id}`}>
      <legend className="sr-only">{L(section.title)}</legend>
      <h2 id={`sec-${section.id}`} className="text-[1.3rem] font-bold mb-1">
        {L(section.title)}
      </h2>
      {section.description ? <p className="text-muted mb-3">{L(section.description)}</p> : <div className="mb-3" />}
      {section.personRole ? <PersonPicker section={section} fields={fields} /> : null}
      <div className="grid gap-5 sm:grid-cols-6">
        {visible.map((f) => (
          <div key={f.name} className={width(f)}>
            {f.type === 'lines' ? (
              <LinesField f={f} />
            ) : (
              <FieldInput
                f={f}
                name={f.name}
                computedValue={f.computedKey ? computed[f.computedKey] : undefined}
                warning={warnings.find((w) => w.field === f.name)}
              />
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
