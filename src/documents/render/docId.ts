// A short, stable identifier for a generated document: the same content gives
// the same ID, so a printed copy can be matched to the file it came from. It is
// printed in the brand line and stored in the PDF metadata.

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O, 1/I

function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function encode(n: number, len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[n % 32];
    n = Math.floor(n / 32);
  }
  return out;
}

/** JSON with object keys sorted at every level, so key order never changes the ID. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

/** e.g. "DMZ-7K3Q-M9TX" */
export function documentId(templateId: string, values: Record<string, unknown>, profileId?: string): string {
  const { __presentation: _p, ...rest } = values;
  const key = `${templateId}|${profileId ?? ''}|${stable(rest)}`;
  const a = encode(fnv1a(key, 0x811c9dc5), 4);
  const b = encode(fnv1a(key, 0x9e3779b9), 4);
  return `DMZ-${a}-${b}`;
}
