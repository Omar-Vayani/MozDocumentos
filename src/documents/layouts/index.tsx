// The four letterhead presets plus the shared footer and running header.
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

/** Logo box: fits within maxW × maxH keeping aspect ratio. */
function Logo({ asset, maxW, maxH }: { asset: RenderAsset; maxW: number; maxH: number }) {
  const ratio = asset.width / Math.max(1, asset.height);
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) {
    w = maxW;
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
        fontSize: size ?? (long ? 12 : 14),
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

function Details({ p, theme, align }: { p: Profile; theme: Theme; align: 'left' | 'center' | 'right' }) {
  const lines = [
    p.nomeComercial && p.nomeComercial !== p.firma ? p.nomeComercial : '',
    addressLine(p),
    contactsLine(p),
    p.nuit ? `NUIT ${p.nuit}` : '',
  ].filter(Boolean);
  return (
    <>
      {lines.map((l, i) => (
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
          <Logo asset={logo} maxW={40 * MM} maxH={16 * MM} />
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
  switch (layout) {
    case 'lateral':
      return (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '40%' }}>
              {logo ? <Logo asset={logo} maxW={60 * MM} maxH={22 * MM} /> : <Name p={profile} theme={theme} align="left" />}
            </View>
            <View style={{ width: '58%' }}>
              {logo ? <Name p={profile} theme={theme} align="right" size={12} /> : null}
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
          <Name p={profile} theme={theme} align="left" size={13} />
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: theme.rule, marginTop: 6, width: 40 * MM }} />
        </View>
      );
    case 'classico':
    default:
      return (
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          {logo ? (
            <View style={{ marginBottom: 6 }}>
              <Logo asset={logo} maxW={70 * MM} maxH={20 * MM} />
            </View>
          ) : null}
          <Name p={profile} theme={theme} align="center" />
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
  ].filter(Boolean);
}

/** Estimated number of rendered lines for footer text at 7.5pt (avg glyph ≈ 0.5em). */
export function estimateLines(text: string, width: number, size = 7.5): number {
  const perLine = Math.max(10, Math.floor(width / (size * 0.52)));
  return Math.max(1, Math.ceil(text.length / perLine));
}
