// Shared, renderer-independent logic: builds the template context, applies
// defaults and wording overrides. Used by the editor and by the PDF worker.

import { LEGAL, resolveLegalValue, type LegalOverrides, type LegalRefId, type LegalTable } from '@/legal/mz-legal';
import type { Profile } from '@/lib/storage/types';
import type { Block, DefaultsContext, DocumentTemplate, FieldDef, LegalSnapshot, TemplateContext, Values } from './model';

export function makeLegalSnapshot(overrides: LegalOverrides = {}): LegalSnapshot {
  return {
    value: <T = number>(id: LegalRefId) => {
      if (!(id in LEGAL)) throw new Error(`Unknown legal value: ${id}`);
      return resolveLegalValue(id, overrides) as T;
    },
    table: (id: LegalRefId) => resolveLegalValue(id, overrides) as LegalTable,
  };
}

export function placeFor(values: Values, profile: Profile | null): string {
  const v = typeof values.local === 'string' ? values.local.trim() : '';
  return v || profile?.localPadrao || profile?.morada?.cidade || 'Maputo';
}

export function buildContext(
  template: DocumentTemplate,
  values: Values,
  profile: Profile | null,
  legalOverrides: LegalOverrides,
  today: string,
): TemplateContext {
  const legal = makeLegalSnapshot(legalOverrides);
  const base = { values, profile, legal, today, place: placeFor(values, profile) };
  let computed: Record<string, any> = {};
  if (template.computed) {
    try {
      computed = template.computed(values, base) ?? {};
    } catch (err) {
      console.error('computed() failed', err);
    }
  }
  return { ...base, computed };
}

/** Walks all fields including 'lines' columns. */
export function allFields(t: DocumentTemplate): FieldDef[] {
  return t.fields;
}

export function defaultValues(t: DocumentTemplate, ctx: DefaultsContext): Values {
  const out: Values = {};
  for (const f of t.fields) {
    const d = typeof f.default === 'function' ? (f.default as (c: DefaultsContext) => unknown)(ctx) : f.default;
    if (d !== undefined) out[f.name] = d;
    else if (f.type === 'toggle') out[f.name] = false;
    else if (f.type === 'lines') out[f.name] = [];
    else out[f.name] = '';
  }
  return out;
}

/** Applies paragraph/clause wording overrides from "Editar texto". */
export function applyOverrides(blocks: Block[], overrides: Record<string, string> = {}): Block[] {
  if (!overrides || Object.keys(overrides).length === 0) return blocks;
  return blocks.map((b) => {
    if (b.type === 'paragraph' && overrides[b.id] != null) return { ...b, text: overrides[b.id] };
    if (b.type === 'numberedClauses') {
      return {
        ...b,
        items: b.items.map((it) => (overrides[it.id] != null ? { ...it, text: overrides[it.id] } : it)),
      };
    }
    return b;
  });
}

export function buildBlocks(t: DocumentTemplate, ctx: TemplateContext, overrides?: Record<string, string>): Block[] {
  return applyOverrides(t.blocks(ctx), overrides);
}

export type EditableText = { id: string; text: string; en?: string; label?: string };

/** Paragraphs and clauses the user may reword in the editor. */
export function editableTexts(blocks: Block[]): EditableText[] {
  const out: EditableText[] = [];
  for (const b of blocks) {
    if (b.type === 'paragraph' && b.editable !== false) out.push({ id: b.id, text: b.text, en: b.en });
    if (b.type === 'numberedClauses') {
      for (const it of b.items) out.push({ id: it.id, text: it.text, en: it.en, label: it.heading });
    }
  }
  return out;
}

/** True if the field should be shown for these values. */
export function isFieldVisible(f: FieldDef, v: Values): boolean {
  try {
    return f.showIf ? f.showIf(v) : true;
  } catch {
    return true;
  }
}
