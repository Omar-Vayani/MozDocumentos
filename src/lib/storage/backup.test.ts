import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBackup, restoreBackup } from './backup';
import { db } from './db';
import { formatRef, saveAsset, saveProfile, clearAllData } from './repo';
import { newProfile } from './types';

// jsdom-free: provide FileReader/fetch(data:) equivalents used by blob helpers.
class NodeFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  error: unknown = null;
  readAsDataURL(blob: Blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buf).toString('base64')}`;
      this.onload?.();
    });
  }
}
(globalThis as unknown as { FileReader: unknown }).FileReader = NodeFileReader;

describe('backup', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('round-trips a full profile with images', async () => {
    const p = newProfile('empresa', 'p1');
    p.firma = 'Exemplo Lda';
    const png = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/png' });
    p.branding.logoAssetId = await saveAsset({ kind: 'logo', blob: png, type: 'image/png', width: 10, height: 5 });
    p.branding.stampAssetId = await saveAsset({ kind: 'stamp', blob: png, type: 'image/png', width: 4, height: 4 });
    await saveProfile(p);

    const backup = JSON.parse(JSON.stringify(await createBackup()));
    await clearAllData();
    expect(await db.profiles.count()).toBe(0);

    await restoreBackup(backup, 'replace');
    const restored = await db.profiles.get('p1');
    expect(restored?.firma).toBe('Exemplo Lda');
    const logo = await db.assets.get(restored!.branding.logoAssetId!);
    expect(logo?.width).toBe(10);
    expect(new Uint8Array(await logo!.blob.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
  });

  it('merge keeps newer local records', async () => {
    const p = newProfile('empresa', 'p1');
    p.firma = 'Antiga';
    await saveProfile(p);
    const backup = JSON.parse(JSON.stringify(await createBackup()));
    await saveProfile({ ...p, firma: 'Nova' });
    await restoreBackup(backup, 'merge');
    expect((await db.profiles.get('p1'))?.firma).toBe('Nova');
  });

  it('rejects files that are not backups', async () => {
    await expect(restoreBackup({ hello: 1 }, 'merge')).rejects.toThrow('invalid-format');
  });
});

describe('reference numbering', () => {
  it('formats prefix/year/counter', () => {
    const p = newProfile('empresa', 'x');
    p.numbering = { prefix: 'RH', year: new Date().getFullYear(), counter: 13, digits: 3 };
    expect(formatRef(p)).toBe(`RH/${new Date().getFullYear()}/014`);
    p.numbering.year = 2000;
    expect(formatRef(p)).toBe(`RH/${new Date().getFullYear()}/001`);
  });
});
