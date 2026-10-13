// Types shared by the legal configuration files (core and per-category).
import type { L10n } from '@/documents/model';

export type Confidence = 'verified' | 'confirm';

export type LawInfo = { short: string; cite: string; title: string; url?: string };

/**
 * A legal value: rate, deadline, article reference. `law` is a key of `LAWS`
 * (checked by the legal config test). Never invent an article: leave it out
 * and set `confidence: 'confirm'` when unsure.
 */
export type LegalEntryDef = {
  title: L10n;
  summary: L10n;
  law: string;
  article?: string;
  value?: unknown;
  sourceUrl?: string;
  lastVerified: string;
  confidence: Confidence;
  note?: L10n;
};
