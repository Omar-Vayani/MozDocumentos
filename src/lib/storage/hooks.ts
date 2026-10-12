import { useLiveQuery } from 'dexie-react-hooks';
import { usePrefs } from '@/app/store';
import type { LegalOverrides } from '@/legal/mz-legal';
import { db } from './db';
import type { Profile } from './types';

export function useProfiles(): Profile[] | undefined {
  return useLiveQuery(() => db.profiles.orderBy('updatedAt').reverse().toArray(), []);
}

/** Active profile, falling back to the most recently updated one. `undefined` while loading. */
export function useActiveProfile(): Profile | null | undefined {
  const id = usePrefs((s) => s.activeProfileId);
  return useLiveQuery(async () => {
    if (id) {
      const p = await db.profiles.get(id);
      if (p) return p;
    }
    const first = await db.profiles.orderBy('updatedAt').reverse().first();
    return first ?? null;
  }, [id]);
}

export function usePeople() {
  return useLiveQuery(() => db.people.orderBy('nome').toArray(), []);
}

export function useDocuments() {
  return useLiveQuery(() => db.documents.orderBy('updatedAt').reverse().toArray(), []);
}

export function useCases() {
  return useLiveQuery(() => db.cases.orderBy('updatedAt').reverse().toArray(), []);
}

export function useLegalOverrides(): LegalOverrides | undefined {
  return useLiveQuery(async () => ((await db.settings.get('legalOverrides'))?.value as LegalOverrides) ?? {}, []);
}
