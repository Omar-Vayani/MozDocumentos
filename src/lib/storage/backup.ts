// Backup and restore: a single JSON file with images embedded as data URLs.

import { db } from './db';
import { blobToDataUrl, dataUrlToBlob } from './repo';
import type { Asset, Case, Person, Profile, SavedDocument, SettingRow } from './types';

export const BACKUP_FORMAT = 'documentos-mz-backup';
export const BACKUP_VERSION = 1;

type SerializedAsset = Omit<Asset, 'blob'> & { dataUrl: string };

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  profiles: Profile[];
  people: Person[];
  documents: SavedDocument[];
  cases: Case[];
  assets: SerializedAsset[];
  settings: SettingRow[];
};

export async function createBackup(): Promise<Backup> {
  const [profiles, people, documents, cases, assets, settings] = await Promise.all([
    db.profiles.toArray(),
    db.people.toArray(),
    db.documents.toArray(),
    db.cases.toArray(),
    db.assets.toArray(),
    db.settings.toArray(),
  ]);
  const serialized: SerializedAsset[] = [];
  for (const a of assets) {
    const { blob, ...rest } = a;
    serialized.push({ ...rest, dataUrl: await blobToDataUrl(blob) });
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profiles,
    people,
    documents,
    cases,
    assets: serialized,
    settings,
  };
}

export function validateBackup(data: unknown): asserts data is Backup {
  const b = data as Partial<Backup>;
  if (!b || b.format !== BACKUP_FORMAT) throw new Error('invalid-format');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) throw new Error('unsupported-version');
  for (const k of ['profiles', 'people', 'documents', 'cases', 'assets', 'settings'] as const) {
    if (!Array.isArray(b[k])) throw new Error(`invalid-${k}`);
  }
}

/**
 * Restores a backup. "replace" wipes the device first; "merge" keeps existing
 * records and overwrites those with the same id when the backup copy is newer.
 */
export async function restoreBackup(data: unknown, mode: 'merge' | 'replace'): Promise<{ counts: Record<string, number> }> {
  validateBackup(data);
  const assets: Asset[] = [];
  for (const a of data.assets) {
    const { dataUrl, ...rest } = a;
    assets.push({ ...rest, blob: await dataUrlToBlob(dataUrl) });
  }
  const tables = [db.profiles, db.people, db.documents, db.cases, db.assets, db.settings];
  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') await Promise.all(tables.map((t) => t.clear()));
    const newer = async <T extends { id: string; updatedAt: number }>(table: typeof db.profiles | typeof db.people | typeof db.documents | typeof db.cases, rows: T[]) => {
      if (mode === 'replace') return rows;
      const out: T[] = [];
      for (const r of rows) {
        const cur = (await table.get(r.id)) as { updatedAt: number } | undefined;
        if (!cur || cur.updatedAt <= r.updatedAt) out.push(r);
      }
      return out;
    };
    await db.profiles.bulkPut(await newer(db.profiles, data.profiles));
    await db.people.bulkPut(await newer(db.people, data.people));
    await db.documents.bulkPut(await newer(db.documents, data.documents));
    await db.cases.bulkPut(await newer(db.cases, data.cases));
    await db.assets.bulkPut(assets);
    if (mode === 'replace') await db.settings.bulkPut(data.settings);
    else {
      for (const s of data.settings) if (!(await db.settings.get(s.key))) await db.settings.put(s);
    }
  });
  return {
    counts: {
      profiles: data.profiles.length,
      people: data.people.length,
      documents: data.documents.length,
      assets: data.assets.length,
    },
  };
}
