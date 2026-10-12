// Lazily loads template content. Metadata (titles, tags…) lives in the catalogue.

import { getMeta, type TemplateMeta } from '@/features/catalog/catalog';
import type { DocumentTemplate } from './model';

const modules = import.meta.glob<{ default: DocumentTemplate }>(['./templates/*.ts', '!./templates/*.test.ts', '!./templates/_*.ts']);

export type FullTemplate = TemplateMeta & DocumentTemplate;

const idFromPath = (p: string) => p.replace('./templates/', '').replace(/\.ts$/, '');

export const AVAILABLE_TEMPLATE_IDS: string[] = Object.keys(modules).map(idFromPath);

export function isTemplateAvailable(id: string): boolean {
  return AVAILABLE_TEMPLATE_IDS.includes(id);
}

const cache = new Map<string, FullTemplate>();

export async function loadTemplate(id: string): Promise<FullTemplate> {
  const hit = cache.get(id);
  if (hit) return hit;
  const meta = getMeta(id);
  const loader = modules[`./templates/${id}.ts`];
  if (!meta || !loader) throw new Error(`Template not found: ${id}`);
  const mod = await loader();
  if (mod.default.id !== id) throw new Error(`Template id mismatch: ${id} vs ${mod.default.id}`);
  const full: FullTemplate = { ...meta, ...mod.default };
  cache.set(id, full);
  return full;
}
