import Dexie, { type EntityTable } from 'dexie';
import type { Asset, Case, Person, Profile, SavedDocument, SettingRow } from './types';

export class AppDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  people!: EntityTable<Person, 'id'>;
  documents!: EntityTable<SavedDocument, 'id'>;
  cases!: EntityTable<Case, 'id'>;
  assets!: EntityTable<Asset, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor(name = 'documentos-mz') {
    super(name);
    this.version(1).stores({
      profiles: 'id, kind, updatedAt',
      people: 'id, role, nome, updatedAt',
      documents: 'id, templateId, profileId, caseId, status, updatedAt',
      cases: 'id, processId, updatedAt',
      assets: 'id, kind',
      settings: 'key',
    });
  }
}

export const db = new AppDB();
