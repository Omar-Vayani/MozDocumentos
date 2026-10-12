// Copies the PDF fonts (latin subset, WOFF) from @fontsource into public/fonts.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/fonts';
mkdirSync(out, { recursive: true });
const fonts = {
  'source-serif-4': ['400-normal', '400-italic', '700-normal', '700-italic'],
  arimo: ['400-normal', '400-italic', '700-normal', '700-italic'],
  'ibm-plex-sans': ['400-normal', '400-italic', '700-normal', '700-italic'],
};
for (const [family, variants] of Object.entries(fonts)) {
  for (const v of variants) {
    const file = `${family}-latin-${v}.woff`;
    copyFileSync(join('node_modules/@fontsource', family, 'files', file), join(out, file));
  }
}
console.log('fonts copied');
