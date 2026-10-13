// Lets the user pick their areas (multi-select). Used on the home page and in Settings.
import { useL10n, usePrefs } from '@/app/store';
import { Icon } from '@/ui/Icon';
import { SECTORS, type SectorId } from './sectors';

export function SectorPicker({ compact = false }: { compact?: boolean }) {
  const L = useL10n();
  const sectors = usePrefs((s) => s.sectors);
  const setSectors = usePrefs((s) => s.setSectors);
  const toggle = (id: SectorId) => setSectors(sectors.includes(id) ? sectors.filter((s) => s !== id) : [...sectors, id]);
  return (
    <ul className={`grid gap-2.5 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {SECTORS.map((s) => {
        const on = sectors.includes(s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.id)}
              className={`w-full h-full text-left flex gap-3 items-start p-3.5 rounded-[var(--radius-md)] border-2 cursor-pointer transition-colors ${
                on ? 'border-primary bg-primary-soft' : 'border-border bg-bg hover:border-primary/60'
              }`}
            >
              <span className={`size-9 rounded-[var(--radius)] grid place-items-center shrink-0 ${on ? 'bg-primary text-primary-text' : 'bg-surface text-primary'}`}>
                <Icon name={on ? 'check' : s.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold leading-snug">{L(s.title)}</span>
                <span className="block text-muted text-[0.9rem] leading-snug mt-0.5">{L(s.hint)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
