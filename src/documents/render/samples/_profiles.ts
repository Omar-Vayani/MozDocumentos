// Realistic issuing profiles for the design preview (see preview.test.tsx).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newProfile, type Profile } from '@/lib/storage/types';
import type { RenderAsset } from '../types';

const IMG = process.env.PREVIEW_IMG ?? join(process.cwd(), 'src/documents/render/samples');

export type Issuer = { profile: Profile; assets: Record<string, RenderAsset> };

/** A preview sample: template id, issuer and the values typed by the user. */
export type Sample = { id: string; name?: string; who: () => Issuer; values: Record<string, unknown> };

export function img(name: string, w: number, h: number): RenderAsset | undefined {
  const p = join(IMG, name);
  if (!IMG || !existsSync(p)) return undefined;
  return { dataUrl: `data:image/png;base64,${readFileSync(p).toString('base64')}`, width: w, height: h };
}

export function company(): { profile: Profile; assets: Record<string, RenderAsset> } {
  const p = newProfile('empresa', 'pv-company');
  Object.assign(p, {
    firma: 'Machava & Filhos — Construção, Lda',
    nuit: '400123456',
    nuel: '100234567',
    inss: '123456789',
    capitalSocial: '500000',
    morada: { rua: 'Avenida Julius Nyerere', numero: '1234', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 21 300 000 · +258 84 300 0000',
    email: 'geral@machava.co.mz',
    website: 'www.machava.co.mz',
    representanteNome: 'Ana Maria Machava',
    representanteCargo: 'Directora-Geral',
  });
  const assets: Record<string, RenderAsset> = {};
  const logo = img('logo.png', 900, 260);
  const sig = img('signature.png', 600, 220);
  const stamp = img('stamp.png', 400, 400);
  if (logo) (assets.logo = logo), (p.branding.logoAssetId = 'logo');
  if (sig) (assets.sig = sig), (p.branding.signatureAssetId = 'sig');
  if (stamp) (assets.stamp = stamp), (p.branding.stampAssetId = 'stamp');
  p.branding.accent = '#0f523c';
  p.branding.layout = (process.env.PREVIEW_LAYOUT as Profile['branding']['layout']) ?? 'classico';
  return { profile: p, assets };
}

export function publicBody(): { profile: Profile; assets: Record<string, RenderAsset> } {
  const p = newProfile('empresa', 'pv-public');
  Object.assign(p, {
    tipoEntidade: 'publica',
    emblema: true,
    firma: 'Direcção Provincial de Saúde de Nampula',
    hierarquia: 'GOVERNO DA PROVÍNCIA DE NAMPULA\nDIRECÇÃO PROVINCIAL DE SAÚDE',
    sigla: 'DPS-NPL',
    morada: { rua: 'Avenida Eduardo Mondlane', numero: '45', cidade: 'Nampula', provincia: 'Nampula' },
    telefones: '+258 26 212 000',
    email: 'dps@nampula.gov.mz',
    localPadrao: 'Nampula',
    representanteNome: 'Dr. Felisberto Mucavele',
    representanteCargo: 'Director Provincial',
  });
  return { profile: p, assets: {} };
}


/** A lawyer with an OAM card, for court filings. */
export function lawyer(): Issuer {
  const p = newProfile('pessoa', 'pv-lawyer');
  Object.assign(p, {
    nome: 'Helena Mabote Tembe',
    genero: 'F',
    profissao: 'Advogada',
    oamCarteira: '1234',
    docTipo: 'BI',
    docNumero: '110100765432C',
    nuit: '102345678',
    estadoCivil: 'casado',
    nacionalidade: 'moçambicana',
    morada: { rua: 'Avenida 24 de Julho', numero: '1097', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 84 555 0101',
    email: 'helena.tembe@advogados.co.mz',
  });
  return { profile: p, assets: {} };
}

/** A private individual. */
export function person(): Issuer {
  const p = newProfile('pessoa', 'pv-person');
  Object.assign(p, {
    nome: 'Carlos Alberto Nhantumbo',
    genero: 'M',
    docTipo: 'BI',
    docNumero: '110100345678A',
    docEmissao: '2022-02-14',
    docLocal: 'Maputo',
    nuit: '105678901',
    estadoCivil: 'casado',
    nacionalidade: 'moçambicana',
    morada: { rua: 'Rua da Resistência', numero: '512', bairro: 'Malhangalene', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 82 123 4567',
  });
  return { profile: p, assets: {} };
}
