import * as RTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

export function Tabs({
  tabs,
  value,
  onValueChange,
  label,
  sticky,
}: {
  tabs: { value: string; label: ReactNode; content: ReactNode }[];
  value: string;
  onValueChange: (v: string) => void;
  label: string;
  sticky?: boolean;
}) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange}>
      <RTabs.List
        aria-label={label}
        className={`flex border-b-2 border-border overflow-x-auto ${sticky ? 'sticky top-0 bg-bg z-20' : ''}`}
      >
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.value}
            value={t.value}
            className="min-h-12 px-4 font-semibold whitespace-nowrap -mb-[2px] border-b-4 border-transparent text-muted
              data-[state=active]:border-primary data-[state=active]:text-text hover:text-text cursor-pointer"
          >
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {tabs.map((t) => (
        <RTabs.Content key={t.value} value={t.value} className="pt-5 focus-visible:outline-none">
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}

