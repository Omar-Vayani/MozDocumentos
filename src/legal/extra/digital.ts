// Legal values for the "digital" documents. Keys must be unique across all legal files.
import type { LawInfo, LegalEntryDef } from '../types';

export const LAWS_DIGITAL = {} satisfies Record<string, LawInfo>;

export const LEGAL_DIGITAL = {} satisfies Record<string, LegalEntryDef>;
