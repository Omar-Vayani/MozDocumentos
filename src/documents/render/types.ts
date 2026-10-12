import type { LegalOverrides } from '@/legal/mz-legal';
import type { Profile } from '@/lib/storage/types';
import type { Values } from '../model';

export type RenderAsset = { dataUrl: string; width: number; height: number };

/** Everything needed to render a document. Must be structured-cloneable (sent to the worker). */
export type RenderInput = {
  templateId: string;
  values: Values;
  overrides: Record<string, string>;
  profile: Profile | null;
  /** Images referenced by the profile's branding, keyed by asset id. */
  assets: Record<string, RenderAsset>;
  legalOverrides: LegalOverrides;
  bilingual: boolean;
  today: string;
  /** Base URL (browser) or directory (node) where the PDF fonts live. */
  fontBase: string;
};

export type RenderResult = { pdf: ArrayBuffer; title: string };
