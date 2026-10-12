// Builds the zod validation schema for a template's fields (respecting showIf).

import { z } from 'zod';
import { isFieldVisible } from '@/documents/context';
import type { FieldDef, L10n, Values } from '@/documents/model';
import { parseISODate, parseMoney } from '@/lib/format';

type Lang = 'pt' | 'en';

const msg = {
  required: { pt: (l: string) => `Preencha «${l}»`, en: (l: string) => `Enter “${l}”` },
  date: { pt: (l: string) => `«${l}» deve ser uma data válida`, en: (l: string) => `“${l}” must be a real date` },
  money: { pt: (l: string) => `«${l}» deve ser um valor, por exemplo 15.000,00`, en: (l: string) => `“${l}” must be an amount, like 15,000.00` },
  number: { pt: (l: string) => `«${l}» deve ser um número`, en: (l: string) => `“${l}” must be a number` },
  min: { pt: (l: string, n: number) => `«${l}» deve ser ${n} ou mais`, en: (l: string, n: number) => `“${l}” must be ${n} or more` },
  max: { pt: (l: string, n: number) => `«${l}» deve ser ${n} ou menos`, en: (l: string, n: number) => `“${l}” must be ${n} or less` },
  email: { pt: (l: string) => `«${l}» deve ser um endereço de email válido`, en: (l: string) => `“${l}” must be a valid email address` },
};

const isEmpty = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

function checkField(f: FieldDef, v: unknown, lang: Lang, label: (x: L10n) => string): string | null {
  const name = label(f.label);
  if (isEmpty(v)) return f.required ? msg.required[lang](name) : null;
  switch (f.type) {
    case 'date':
      return parseISODate(String(v)) ? null : msg.date[lang](name);
    case 'month':
      return /^\d{4}-\d{2}$/.test(String(v)) ? null : msg.date[lang](name);
    case 'money': {
      const n = parseMoney(v);
      if (n == null || n < 0) return msg.money[lang](name);
      return null;
    }
    case 'number': {
      const n = Number(v);
      if (!Number.isFinite(n)) return msg.number[lang](name);
      if (f.min != null && n < f.min) return msg.min[lang](name, f.min);
      if (f.max != null && n > f.max) return msg.max[lang](name, f.max);
      return null;
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? null : msg.email[lang](name);
    default:
      return null;
  }
}

export function buildSchema(fields: FieldDef[], lang: Lang) {
  const label = (x: L10n) => x[lang] ?? x.pt;
  return z
    .record(z.string(), z.any())
    .superRefine((values: Values, ctx) => {
      for (const f of fields) {
        if (!isFieldVisible(f, values)) continue;
        const v = values[f.name];
        const err = checkField(f, v, lang, label);
        if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f.name], message: err });
        if (f.type === 'lines' && Array.isArray(v)) {
          v.forEach((row: Values, i: number) => {
            for (const c of f.columns ?? []) {
              const e = checkField({ ...c, required: false }, row?.[c.name], lang, label);
              if (e) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f.name, i, c.name], message: e });
            }
          });
        }
      }
    });
}
