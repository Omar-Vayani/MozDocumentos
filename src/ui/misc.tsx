import * as RDialog from '@radix-ui/react-dialog';
import { useEffect, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { Icon, type IconName } from './Icon';

// ---------------------------------------------------------------- Notice

const noticeStyles = {
  info: { box: 'bg-info-bg border-link', icon: 'info' as IconName },
  warning: { box: 'bg-warning-bg border-warning', icon: 'alert' as IconName },
  error: { box: 'bg-bg border-error', icon: 'alert' as IconName },
  success: { box: 'bg-success-bg border-primary', icon: 'check' as IconName },
};

export function Notice({
  kind = 'info',
  title,
  children,
  className = '',
}: {
  kind?: keyof typeof noticeStyles;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const s = noticeStyles[kind];
  return (
    <div className={`border-l-[5px] ${s.box} px-4 py-3 ${className}`} role={kind === 'error' ? 'alert' : undefined}>
      <div className="flex gap-2.5">
        <Icon name={s.icon} size={20} className="shrink-0 mt-0.5" />
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className="leading-snug">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Tag

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' }) {
  const tones = {
    neutral: 'bg-surface-2 text-text',
    green: 'bg-success-bg text-text border border-primary/40',
    amber: 'bg-warning-bg text-text border border-warning/40',
  };
  return <span className={`inline-block px-2 py-0.5 text-[0.8rem] font-semibold rounded-[var(--radius-sm)] ${tones[tone]}`}>{children}</span>;
}

// ---------------------------------------------------------------- Spinner

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted" role="status">
      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
      {label ? <span>{label}</span> : <span className="sr-only">…</span>}
    </span>
  );
}

// ---------------------------------------------------------------- Dialog / bottom sheet

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <RDialog.Content
          className={`fixed z-50 bg-bg text-text shadow-xl border-border-strong
            inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[6px] border-t-4 border-t-primary
            sm:inset-auto sm:left-1/2 sm:top-[8vh] sm:-translate-x-1/2 sm:rounded-[var(--radius-md)] sm:border
            sm:max-h-[84vh] ${wide ? 'sm:w-[min(760px,92vw)]' : 'sm:w-[min(520px,92vw)]'}`}
        >
          <div className="sticky top-0 bg-bg flex items-start justify-between gap-4 px-5 pt-4 pb-2 border-b border-border z-10">
            <div>
              <RDialog.Title className="text-xl font-bold">{title}</RDialog.Title>
              {description ? <RDialog.Description className="text-muted mt-1">{description}</RDialog.Description> : null}
            </div>
            <RDialog.Close className="min-h-12 min-w-12 -mr-3 -mt-2 inline-flex items-center justify-center hover:bg-surface rounded cursor-pointer" aria-label="Fechar">
              <Icon name="close" size={22} />
            </RDialog.Close>
          </div>
          <div className="px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

// ---------------------------------------------------------------- Toasts (polite live region)

type Toast = { id: number; text: string };
const useToasts = create<{ list: Toast[]; push: (t: string) => void; remove: (id: number) => void }>((set) => ({
  list: [],
  push: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list, { id, text }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
}));

export const toast = (text: string) => useToasts.getState().push(text);

export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div aria-live="polite" className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-md">
      {list.map((t) => (
        <div key={t.id} className="bg-text text-bg px-4 py-3 rounded-[var(--radius)] shadow-lg font-semibold pointer-events-auto flex gap-2 items-center">
          <Icon name="check" size={18} />
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Misc

export function PageHeader({ title, intro, children }: { title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-[1.9rem] sm:text-[2.4rem] font-bold tracking-tight">{title}</h1>
      {intro ? <p className="mt-3 text-[1.1rem] text-muted max-w-[42rem] leading-relaxed">{intro}</p> : null}
      {children}
    </div>
  );
}

export function SectionTitle({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2 id={id} className={`text-[1.35rem] sm:text-[1.5rem] font-bold mb-3 ${className}`}>
      {children}
    </h2>
  );
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
