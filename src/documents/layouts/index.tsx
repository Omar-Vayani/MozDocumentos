// The letterhead presets plus the shared footer and running header.
// Logos are always sized by height with their aspect ratio kept (never stretched).

import { Image, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { Profile } from '@/lib/storage/types';
import { profileDisplayName } from '@/lib/storage/types';
import type { RenderAsset } from '../render/types';
import { addressLine, contactsLine, legalLine } from './address';

export { addressLine, contactsLine, legalLine };
import { A4, MM, type Theme } from '../render/theme';

export type LetterheadEnv = {
  theme: Theme;
  profile: Profile;
  logo?: RenderAsset;
  header?: RenderAsset;
};

/** Logo box: fits within maxW × maxH (times the profile's logo size) keeping aspect ratio. */
/**
 * The logo at the chosen size. `capW`/`capH` are hard limits that the size
 * slider cannot exceed, so an enlarged logo never spills out of its column.
 */
function Logo({
  asset,
  maxW,
  maxH,
  scale = 1,
  capW = 120 * MM,
  capH = 60 * MM,
}: {
  asset: RenderAsset;
  maxW: number;
  maxH: number;
  scale?: number;
  capW?: number;
  capH?: number;
}) {
  const ratio = asset.width / Math.max(1, asset.height);
  let h = Math.min(maxH * scale, capH);
  let w = h * ratio;
  const limitW = Math.min(maxW * scale, capW);
  if (w > limitW) {
    w = limitW;
    h = w / ratio;
  }
  return <Image src={asset.dataUrl} style={{ width: w, height: h, objectFit: 'contain' }} />;
}

function Name({ p, theme, align, size }: { p: Profile; theme: Theme; align: 'left' | 'center' | 'right'; size?: number }) {
  const name = profileDisplayName(p);
  const long = name.length > 48;
  return (
    <Text
      style={{
        fontSize: size ?? (long ? 12 : 14.5),
        fontWeight: 700,
        color: theme.accent,
        textAlign: align,
        lineHeight: 1.2,
      }}
    >
      {name}
    </Text>
  );
}

function Tagline({ p, theme, align }: { p: Profile; theme: Theme; align: 'left' | 'center' | 'right' }) {
  const t = p.branding.tagline?.trim();
  if (!t) return null;
  return <Text style={{ fontSize: 8.5, fontStyle: 'italic', color: theme.muted, textAlign: align, marginTop: 1.5, lineHeight: 1.3 }}>{t}</Text>;
}

function detailLines(p: Profile): string[] {
  return [
    p.nomeComercial && p.nomeComercial !== p.firma ? p.nomeComercial : '',
    addressLine(p),
    contactsLine(p),
    p.nuit ? `NUIT ${p.nuit}` : '',
  ].filter(Boolean);
}

function Details({ p, theme, align }: { p: Profile; theme: Theme; align: 'left' | 'center' | 'right' }) {
  return (
    <>
      {detailLines(p).map((l, i) => (
        <Text key={i} style={{ fontSize: 8, color: theme.muted, textAlign: align, lineHeight: 1.35 }}>
          {l}
        </Text>
      ))}
    </>
  );
}

function Rule({ theme, thick = 0.75 }: { theme: Theme; thick?: number }) {
  return <View style={{ borderBottomWidth: thick, borderBottomColor: theme.accent, marginTop: 8 }} />;
}

/** Height (pt) of the full-bleed "faixa" band on the first page. */
export function faixaHeight(env: LetterheadEnv): number {
  if (env.header) {
    const h = (A4.width * env.header.height) / Math.max(1, env.header.width);
    return Math.min(h, 60 * MM);
  }
  return 30 * MM;
}

/** Absolutely positioned band for the "faixa" layout (rendered as a fixed page-1 element). */
export function FaixaBand({ env }: { env: LetterheadEnv }): ReactNode {
  const { theme, profile, header, logo } = env;
  const h = faixaHeight(env);
  if (header) {
    return (
      <Image
        src={header.dataUrl}
        style={{ position: 'absolute', top: 0, left: 0, width: A4.width, height: h, objectFit: 'cover' }}
      />
    );
  }
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: A4.width,
        height: h,
        backgroundColor: theme.accent,
        paddingHorizontal: theme.margin.left,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {logo ? (
        <View style={{ marginRight: 12, backgroundColor: '#ffffff', padding: 4 }}>
          <Logo asset={logo} maxW={40 * MM} maxH={16 * MM} scale={theme.logoScale} capW={theme.contentWidth * 0.4} capH={faixaHeight(env) - 10 * MM} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{profileDisplayName(profile)}</Text>
        <Text style={{ fontSize: 8, color: '#ffffff', marginTop: 2 }}>{[addressLine(profile), contactsLine(profile)].filter(Boolean).join(' · ')}</Text>
      </View>
    </View>
  );
}

/** In-flow letterhead at the top of the first page. */
export function Letterhead({ env, layout }: { env: LetterheadEnv; layout: Profile['branding']['layout'] }): ReactNode {
  const { theme, profile, logo } = env;
  const ls = theme.logoScale;
  switch (layout) {
    case 'lateral':
      return (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '40%' }}>
              {logo ? <Logo asset={logo} maxW={60 * MM} maxH={22 * MM} scale={ls} capW={theme.contentWidth * 0.4} /> : <Name p={profile} theme={theme} align="left" />}
            </View>
            <View style={{ width: '58%' }}>
              {logo ? <Name p={profile} theme={theme} align="right" size={12} /> : null}
              <Tagline p={profile} theme={theme} align="right" />
              <Details p={profile} theme={theme} align="right" />
            </View>
          </View>
          <Rule theme={theme} />
        </View>
      );
    case 'faixa': {
      // Space for the absolutely positioned band, measured from the top margin.
      const h = faixaHeight(env) + 8 * MM - theme.margin.top;
      return <View style={{ height: Math.max(0, h) }} />;
    }
    case 'minimo':
      return (
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {logo ? (
              <View style={{ marginRight: 10 }}>
                <Logo asset={logo} maxW={30 * MM} maxH={11 * MM} scale={ls} capW={theme.contentWidth * 0.35} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Name p={profile} theme={theme} align="left" size={13} />
              <Tagline p={profile} theme={theme} align="left" />
            </View>
          </View>
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: theme.rule, marginTop: 6, width: 40 * MM }} />
        </View>
      );
    case 'moderno':
      // Accent bar beside the name, logo on the right, details on one line below.
      return (
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', flex: 1, paddingRight: 12 }}>
              <View style={{ width: 4, backgroundColor: theme.accent, marginRight: 9 }} />
              <View style={{ flex: 1, paddingVertical: 1 }}>
                <Name p={profile} theme={theme} align="left" />
                <Tagline p={profile} theme={theme} align="left" />
              </View>
            </View>
            {logo ? <Logo asset={logo} maxW={50 * MM} maxH={18 * MM} scale={ls} capW={theme.contentWidth * 0.45} /> : null}
          </View>
          <Text style={{ width: '100%', fontSize: 7.8, color: theme.muted, marginTop: 7, lineHeight: 1.35 }}>{detailLines(profile).join('  ·  ')}</Text>
          <View style={{ width: '100%', height: 0.5, backgroundColor: theme.rule, marginTop: 6 }} />
        </View>
      );
    case 'elegante':
      // Centred, with a double rule: a quiet, formal look for notaries and offices.
      return (
        <View style={{ marginBottom: 18, alignItems: 'center' }}>
          {logo ? (
            <View style={{ marginBottom: 6 }}>
              <Logo asset={logo} maxW={50 * MM} maxH={16 * MM} scale={ls} />
            </View>
          ) : null}
          <Text style={{ fontSize: 13, fontWeight: 700, color: theme.text, textAlign: 'center', lineHeight: 1.2 }}>
            {profileDisplayName(profile).toLocaleUpperCase('pt')}
          </Text>
          <Tagline p={profile} theme={theme} align="center" />
          <View style={{ width: '100%', height: 1.2, backgroundColor: theme.accent, marginTop: 7 }} />
          <View style={{ width: '100%', height: 0.5, backgroundColor: theme.accent, marginTop: 1.6 }} />
          <Text style={{ width: '100%', fontSize: 7.8, color: theme.muted, marginTop: 5, textAlign: 'center', lineHeight: 1.35 }}>
            {detailLines(profile).join('  ·  ')}
          </Text>
        </View>
      );
    case 'classico':
    default:
      return (
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          {logo ? (
            <View style={{ marginBottom: 6 }}>
              <Logo asset={logo} maxW={70 * MM} maxH={20 * MM} scale={ls} />
            </View>
          ) : null}
          <Name p={profile} theme={theme} align="center" />
          <Tagline p={profile} theme={theme} align="center" />
          <Details p={profile} theme={theme} align="center" />
          <View style={{ width: '100%' }}>
            <Rule theme={theme} />
          </View>
        </View>
      );
  }
}

export type FooterLines = string[];

export function footerLines(p: Profile | null, layout: Profile['branding']['layout'] | undefined): FooterLines {
  if (!p || p.kind !== 'empresa') return [];
  const f = p.branding.footer;
  const forceAll = layout === 'minimo';
  return [
    f.legal || forceAll ? legalLine(p) : '',
    f.address || forceAll ? addressLine(p) : '',
    f.contacts || forceAll ? contactsLine(p) : '',
    p.branding.footerNote?.trim() ?? '',
  ].filter(Boolean);
}

/** Estimated number of rendered lines for footer text at 7.5pt (avg glyph ≈ 0.5em). */
export function estimateLines(text: string, width: number, size = 7.5): number {
  const perLine = Math.max(10, Math.floor(width / (size * 0.52)));
  return Math.max(1, Math.ceil(text.length / perLine));
}
