import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefs } from '@/app/store';
import { normalizeText } from '@/lib/format';
import { db } from '@/lib/storage/db';
import { usePeople } from '@/lib/storage/hooks';
import { newPerson, savePerson } from '@/lib/storage/repo';
import type { Person, PersonRole } from '@/lib/storage/types';
import { Button } from '@/ui/Button';
import { FieldWrap, Select, TextArea, TextInput } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { PageHeader, Sheet, Tag, toast } from '@/ui/misc';

const ROLES: PersonRole[] = ['trabalhador', 'cliente', 'inquilino', 'senhorio', 'representante', 'outro'];

function PersonForm({ person, onDone }: { person: Person; onDone: () => void }) {
  const { t } = useTranslation();
  const lang = usePrefs((s) => s.lang);
  const tx = (pt: string, en: string) => (lang === 'en' ? en : pt);
  const [p, setP] = useState<Person>(person);
  const set = (patch: Partial<Person>) => setP((x) => ({ ...x, ...patch }));
  const [err, setErr] = useState(false);

  const field = (key: keyof Person, label: string, opts: { type?: string; inputMode?: 'numeric' | 'decimal' | 'tel' | 'email'; full?: boolean } = {}) => (
    <FieldWrap label={label} className={opts.full ? 'sm:col-span-2' : ''} error={key === 'nome' && err ? tx('Preencha o nome', 'Enter the name') : undefined}>
      {({ id, describedBy }) => (
        <TextInput
          id={id}
          aria-describedby={describedBy}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          value={(p[key] as string) ?? ''}
          onChange={(e) => set({ [key]: e.target.value } as Partial<Person>)}
          aria-invalid={key === 'nome' && err ? true : undefined}
        />
      )}
    </FieldWrap>
  );

  const h = (title: string) => <h3 className="sm:col-span-2 font-bold text-[1.1rem] border-t border-border pt-3 mt-2">{title}</h3>;

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!p.nome.trim()) {
          setErr(true);
          return;
        }
        await savePerson(p);
        toast(t('people.saved'));
        onDone();
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <FieldWrap label={t('people.role')}>
        {({ id }) => (
          <Select id={id} value={p.role} onChange={(e) => set({ role: e.target.value as PersonRole })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`people.roles.${r}`)}
              </option>
            ))}
          </Select>
        )}
      </FieldWrap>
      <FieldWrap label={tx('Tratamento', 'Form of address')}>
        {({ id }) => (
          <Select id={id} value={p.genero ?? ''} onChange={(e) => set({ genero: e.target.value as Person['genero'] })}>
            <option value="M">{tx('Senhor', 'Mr')}</option>
            <option value="F">{tx('Senhora', 'Ms')}</option>
          </Select>
        )}
      </FieldWrap>
      {field('nome', tx('Nome completo', 'Full name'), { full: true })}
      {h(t('people.sections.identity'))}
      <FieldWrap label={tx('Documento', 'ID document')}>
        {({ id }) => (
          <Select id={id} value={p.docTipo ?? 'BI'} onChange={(e) => set({ docTipo: e.target.value as Person['docTipo'] })}>
            <option value="BI">BI</option>
            <option value="DIRE">DIRE</option>
            <option value="Passaporte">Passaporte</option>
          </Select>
        )}
      </FieldWrap>
      {field('docNumero', tx('Número do documento', 'Document number'))}
      {field('docEmissao', tx('Data de emissão', 'Issue date'), { type: 'date' })}
      {field('docLocal', tx('Local de emissão', 'Place of issue'))}
      {field('nuit', 'NUIT', { inputMode: 'numeric' })}
      {field('inss', tx('N.º INSS', 'INSS number'))}
      {field('estadoCivil', tx('Estado civil', 'Marital status'))}
      {field('nacionalidade', tx('Nacionalidade', 'Nationality'))}
      {field('naturalidade', tx('Naturalidade', 'Place of birth'))}
      {h(t('people.sections.work'))}
      {field('cargo', tx('Cargo', 'Position'))}
      {field('categoria', tx('Categoria', 'Grade'))}
      {field('departamento', tx('Departamento', 'Department'))}
      {field('dataAdmissao', tx('Data de admissão', 'Start date'), { type: 'date' })}
      {field('salarioBase', tx('Salário base (MT)', 'Base salary (MT)'), { inputMode: 'decimal' })}
      {h(t('people.sections.contacts'))}
      {field('morada', tx('Morada', 'Address'), { full: true })}
      {field('telefone', tx('Telefone', 'Phone'), { type: 'tel', inputMode: 'tel' })}
      {field('email', 'Email', { type: 'email', inputMode: 'email' })}
      {h(t('people.sections.bank'))}
      {field('banco', tx('Banco', 'Bank'))}
      {field('nib', 'NIB', { inputMode: 'numeric' })}
      <FieldWrap label={tx('Notas', 'Notes')} className="sm:col-span-2">
        {({ id }) => <TextArea id={id} rows={3} value={p.notas ?? ''} onChange={(e) => set({ notas: e.target.value })} />}
      </FieldWrap>
      <div className="sm:col-span-2 flex gap-3 sticky bottom-0 bg-bg py-3 border-t border-border">
        <Button type="submit" icon="save">
          {t('common.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

export function PeoplePage() {
  const { t } = useTranslation();
  const people = usePeople();
  const [editing, setEditing] = useState<Person | null>(null);
  const [q, setQ] = useState('');
  const list = (people ?? []).filter((p) => !q || normalizeText(`${p.nome} ${p.cargo ?? ''}`).includes(normalizeText(q)));

  return (
    <div className="container-page py-8 sm:py-10 max-w-4xl">
      <PageHeader title={t('people.title')} intro={t('people.intro')} />
      <div className="flex flex-wrap gap-3 items-end mb-6">
        <Button icon="plus" onClick={() => setEditing(newPerson())}>
          {t('people.add')}
        </Button>
        <div className="flex-1 min-w-[12rem] max-w-sm">
          <label htmlFor="people-q" className="sr-only">
            {t('people.search')}
          </label>
          <TextInput id="people-q" type="search" placeholder={t('people.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {people && people.length === 0 ? <p className="text-muted">{t('people.empty')}</p> : null}
      <ul className="border-t border-border">
        {list.map((p) => (
          <li key={p.id} className="border-b border-border py-3 flex items-center gap-3">
            <Icon name="user" className="text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <button type="button" className="font-bold text-link underline text-left cursor-pointer min-h-10" onClick={() => setEditing(p)}>
                {p.nome || '—'}
              </button>
              <p className="text-muted text-[0.95rem]">{[p.cargo, p.nuit ? `NUIT ${p.nuit}` : ''].filter(Boolean).join(' · ')}</p>
            </div>
            <Tag>{t(`people.roles.${p.role}`)}</Tag>
            <button
              type="button"
              className="text-error underline min-h-10 px-2 cursor-pointer"
              onClick={async () => {
                if (confirm(t('people.deleteConfirm'))) await db.people.delete(p.id);
              }}
            >
              {t('common.delete')}
            </button>
          </li>
        ))}
      </ul>
      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} title={editing?.nome ? t('people.edit') : t('people.add')} wide>
        {editing ? <PersonForm person={editing} onDone={() => setEditing(null)} /> : null}
      </Sheet>
    </div>
  );
}
