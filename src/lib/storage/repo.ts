// Data access helpers on top of Dexie.

import type { LegalOverrides } from '@/legal/mz-legal';
import { uid } from '@/lib/format';
import { db } from './db';
import type { Asset, Case, Person, Profile, SavedDocument } from './types';

// ---------------------------------------------------------------- Settings

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export const getLegalOverrides = () => getSetting<LegalOverrides>('legalOverrides', {});
export const setLegalOverrides = (o: LegalOverrides) => setSetting('legalOverrides', o);

// ---------------------------------------------------------------- Profiles

export async function saveProfile(p: Profile): Promise<void> {
  await db.profiles.put({ ...p, updatedAt: Date.now() });
}

export async function deleteProfile(id: string): Promise<void> {
  const p = await db.profiles.get(id);
  await db.transaction('rw', db.profiles, db.assets, async () => {
    if (p) {
      const b = p.branding;
      const ids = [b.logoAssetId, b.headerAssetId, b.footerAssetId, b.watermarkAssetId, b.signatureAssetId, b.stampAssetId];
      await db.assets.bulkDelete(ids.filter((x): x is string => Boolean(x)));
    }
    await db.profiles.delete(id);
  });
}

/** Next reference number for a profile, e.g. "RH/2026/015" (not reserved until commitRef). */
export function formatRef(p: Profile, counter = p.numbering.counter + 1): string {
  const year = new Date().getFullYear();
  const c = p.numbering.year === year ? counter : 1;
  const n = String(c).padStart(p.numbering.digits || 3, '0');
  return [p.numbering.prefix, year, n].filter((x) => x !== '' && x != null).join('/');
}

/** Marks the next number as used (called when a document is finalised). */
export async function commitRef(profileId: string, ref: string): Promise<void> {
  const p = await db.profiles.get(profileId);
  if (!p) return;
  const year = new Date().getFullYear();
  if (formatRef(p) !== ref) return; // user typed their own number
  const counter = p.numbering.year === year ? p.numbering.counter + 1 : 1;
  await db.profiles.put({ ...p, numbering: { ...p.numbering, year, counter }, updatedAt: Date.now() });
}

// ---------------------------------------------------------------- People

export function newPerson(role: Person['role'] = 'trabalhador'): Person {
  const now = Date.now();
  return { id: uid(), role, nome: '', genero: 'M', nacionalidade: 'moçambicana', createdAt: now, updatedAt: now };
}

export async function savePerson(p: Person): Promise<void> {
  await db.people.put({ ...p, updatedAt: Date.now() });
}

// ---------------------------------------------------------------- Documents

export async function saveDocument(d: SavedDocument): Promise<void> {
  await db.documents.put({ ...d, updatedAt: Date.now() });
}

export async function saveCase(c: Case): Promise<void> {
  await db.cases.put({ ...c, updatedAt: Date.now() });
}

// ---------------------------------------------------------------- Assets

export async function saveAsset(a: Omit<Asset, 'id' | 'createdAt'>, replaceId?: string): Promise<string> {
  if (replaceId) await db.assets.delete(replaceId);
  const id = uid();
  await db.assets.put({ ...a, id, createdAt: Date.now() });
  return id;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

const dataUrlCache = new Map<string, { dataUrl: string; width: number; height: number }>();

/** Data URLs for the profile's branding images (cached per asset id). */
export async function brandingAssets(p: Profile | null): Promise<Record<string, { dataUrl: string; width: number; height: number }>> {
  if (!p) return {};
  const b = p.branding;
  const ids = [b.logoAssetId, b.headerAssetId, b.footerAssetId, b.watermarkAssetId, b.signatureAssetId, b.stampAssetId].filter(
    (x): x is string => Boolean(x),
  );
  const out: Record<string, { dataUrl: string; width: number; height: number }> = {};
  for (const id of ids) {
    let hit = dataUrlCache.get(id);
    if (!hit) {
      const a = await db.assets.get(id);
      if (!a) continue;
      hit = { dataUrl: await blobToDataUrl(a.blob), width: a.width, height: a.height };
      dataUrlCache.set(id, hit);
    }
    out[id] = hit;
  }
  return out;
}

// ---------------------------------------------------------------- Storage

export async function storageEstimate(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
  return { usage: e.usage ?? 0, quota: e.quota ?? 0, persisted };
}

export async function requestPersistence(): Promise<boolean> {
  try {
    return navigator.storage?.persist ? await navigator.storage.persist() : false;
  } catch {
    return false;
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.profiles, db.people, db.documents, db.cases, db.assets, db.settings], async () => {
    await Promise.all([db.profiles.clear(), db.people.clear(), db.documents.clear(), db.cases.clear(), db.assets.clear(), db.settings.clear()]);
  });
  dataUrlCache.clear();
}
