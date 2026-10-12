// Stress fixtures for templates: profiles, images and generated field values.

import { deflateSync } from 'node:zlib';
import type { DocumentTemplate, FieldDef, Values } from '@/documents/model';
import type { RenderAsset } from '@/documents/render/types';
import { newProfile, type LetterheadLayout, type Profile } from '@/lib/storage/types';

function crc32(buf: Buffer): number {
  let c: number;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Solid-colour PNG with a darker diagonal, as a data URL. */
export function makePng(width: number, height: number, rgb: [number, number, number] = [31, 78, 61]): RenderAsset {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const on = Math.abs(x / width - y / height) < 0.08;
      raw[row + 1 + x * 3] = on ? 255 : rgb[0];
      raw[row + 2 + x * 3] = on ? 255 : rgb[1];
      raw[row + 3 + x * 3] = on ? 255 : rgb[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { dataUrl: `data:image/png;base64,${png.toString('base64')}`, width, height };
}

export type ProfileFixture = { name: string; profile: Profile; assets: Record<string, RenderAsset> };

export function companyProfile(layout: LetterheadLayout, variant: 'plain' | 'hugeLogo' | 'longName' | 'full'): ProfileFixture {
  const p = newProfile('empresa', `fx-${layout}-${variant}`);
  p.firma = 'Construções e Serviços Lda';
  p.nuit = '400123456';
  p.nuel = '100234567';
  p.inss = '123456789';
  p.capitalSocial = '150000';
  p.morada = { rua: 'Avenida Julius Nyerere', numero: '1234', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' };
  p.telefones = '+258 84 000 0000';
  p.email = 'geral@exemplo.co.mz';
  p.representanteNome = 'Ana Maria Machava';
  p.representanteCargo = 'Directora-Geral';
  p.branding.layout = layout;
  const assets: Record<string, RenderAsset> = {};
  if (variant === 'longName' || variant === 'full') {
    p.firma =
      'Sociedade Moçambicana de Construções, Engenharia, Comércio Geral, Importação e Exportação, Serviços e Representações, Limitada';
    p.nomeComercial = 'SOMOCEC';
    p.morada = {
      rua: 'Avenida Vladimir Lenine, Edifício Torres Vermelhas, Bloco B, 7.º andar, Flat 23, entrada pelas traseiras',
      numero: '2345',
      bairro: 'Bairro Central',
      cidade: 'Maputo',
      provincia: 'Maputo Cidade',
    };
    p.caixaPostal = '1234';
    p.website = 'www.somocec-construcoes-e-servicos.co.mz';
    p.telefones = '+258 21 300 000 / +258 84 300 0000 / +258 86 300 0000';
    p.alvara = 'Alvará de 5.ª classe n.º 1234/ALV/2019';
  }
  if (variant === 'hugeLogo' || variant === 'full') {
    assets.logo = makePng(4000, 400);
    p.branding.logoAssetId = 'logo';
  }
  if (variant === 'full') {
    assets.header = makePng(2480, 400, [20, 60, 110]);
    assets.footer = makePng(2480, 200, [90, 90, 90]);
    assets.wm = makePng(800, 800, [200, 30, 30]);
    assets.sig = makePng(600, 200, [10, 10, 10]);
    assets.stamp = makePng(400, 400, [30, 30, 160]);
    p.branding.headerAssetId = 'header';
    p.branding.footerAssetId = 'footer';
    p.branding.watermarkAssetId = 'wm';
    p.branding.signatureAssetId = 'sig';
    p.branding.stampAssetId = 'stamp';
    p.branding.font = 'moderno';
    p.branding.margins = 'estreito';
    p.branding.tagline = 'Construção civil, obras públicas e manutenção de edifícios em todo o país';
    p.branding.footerNote = 'Matriculada na Conservatória do Registo das Entidades Legais de Maputo sob o n.º 100234567';
    p.branding.logoScale = 1.8;
    p.branding.signatureScale = 2;
    p.branding.stampScale = 1.6;
    p.branding.textSize = 'grande';
    p.branding.lineSpacing = 'amplo';
    p.branding.pageBorder = true;
  }
  if (variant === 'hugeLogo') {
    // tall logo too
    assets.logo = makePng(300, 3000);
    p.branding.font = 'institucional';
  }
  return { name: `${layout}-${variant}`, profile: p, assets };
}

export function personProfile(): ProfileFixture {
  const p = newProfile('pessoa', 'fx-pessoa');
  p.nome = 'Joaquim Alberto Mussa Nhantumbo';
  p.docTipo = 'BI';
  p.docNumero = '110100123456A';
  p.docEmissao = '2020-05-14';
  p.docLocal = 'Maputo';
  p.nuit = '100200300';
  p.estadoCivil = 'casado';
  p.nacionalidade = 'moçambicana';
  p.morada = { rua: 'Rua da Resistência', numero: '45', bairro: 'Malhangalene', cidade: 'Maputo' };
  return { name: 'pessoa', profile: p, assets: {} };
}

const LONG_NAME = 'Maria da Conceição Fernandes Alberto Muianga Cossa Macuácua Nhantumbo';
const LONG_TEXT =
  'O trabalhador ausentou-se do posto de trabalho sem autorização prévia da chefia directa, tendo deixado o armazém aberto e sem vigilância durante o período compreendido entre as 13:00 e as 16:30 horas, o que permitiu a entrada de pessoas estranhas ao serviço.';

function valueFor(f: FieldDef, mode: 'long' | 'minimal'): unknown {
  if (mode === 'minimal') return undefined;
  switch (f.type) {
    case 'text':
      if (/nome/i.test(f.name)) return LONG_NAME;
      if (/nib|conta/i.test(f.name)) return '000100000012345678901';
      if (/email/i.test(f.name)) return 'contacto.muito.longo.para.teste@empresa-exemplo.co.mz';
      return `${f.label.pt} — valor de teste bastante longo para verificar a quebra de linha`;
    case 'textarea':
      return Array.from({ length: 6 }, (_, i) => `${i + 1}. ${LONG_TEXT}`).join('\n');
    case 'email':
      return 'contacto.muito.longo.para.teste@empresa-exemplo.co.mz';
    case 'tel':
      return '+258 84 123 4567';
    case 'date':
      return '2026-10-12';
    case 'month':
      return '2026-10';
    case 'money':
      return '987654321.99';
    case 'number':
      return Math.min(f.max ?? 12, 12);
    case 'select':
    case 'radio':
      return f.options?.[f.options.length - 1]?.value;
    case 'toggle':
      return true;
    case 'lines':
      return Array.from({ length: 14 }, (_, i) =>
        Object.fromEntries(
          (f.columns ?? []).map((c) => [c.name, c.type === 'money' ? String(1000 * (i + 1)) : c.type === 'number' ? 2 : `${c.label.pt} ${i + 1} — descrição detalhada do item`]),
        ),
      );
    default:
      return undefined;
  }
}

export function fixtureValues(t: DocumentTemplate, base: Values, mode: 'long' | 'minimal'): Values {
  const out: Values = { ...base };
  for (const f of t.fields) {
    const v = valueFor(f, mode);
    if (v !== undefined) out[f.name] = v;
  }
  return out;
}
