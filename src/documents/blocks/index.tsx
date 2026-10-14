// react-pdf renderers for every block type. Each block declares its page-break
// behaviour: rows, signatures and acknowledgements never split; headings stay
// with the text that follows; header rows repeat on every page of a table.

import { Image, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { Fragment, type ReactNode } from 'react';
import { formatMoney, numeroPorExtenso, MAX_EXTENSO } from '@/lib/format';
import type { Block, ClauseItem } from '../model';
import { ORDINAIS_F } from '../model';
import type { RenderAsset } from '../render/types';
import type { Theme } from '../render/theme';

export type BlockEnv = {
  theme: Theme;
  bilingual: boolean;
  /** Undefined when the profile has none or the user hid it for this document. */
  signature?: RenderAsset;
  stamp?: RenderAsset;
  /** The issuing profile's logo, for the `logo` block. */
  logo?: RenderAsset;
  /** Designed, centred pages (certificates, invitations): signatures are centred and narrower. */
  centred?: boolean;
  /** Public bodies and community authorities: a single signature is centred. */
  publicBody?: boolean;
};


const DISPLAY_PT = { xxxl: 44, xxl: 30, xl: 22, lg: 16, md: 13, sm: 10.5, xs: 8.5 } as const;

/** Renders `**bold**` inline markup (single line; see RichText for line breaks). */
export function rich(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <Text key={i} style={{ fontWeight: 700 }}>
        {p.slice(2, -2)}
      </Text>
    ) : (
      p
    ),
  );
}

/**
 * Text with `**bold**` markup and line breaks. Each line is its own Text node:
 * a literal "\n" inside a Text makes react-pdf reference an unembedded font.
 */
function RichText({ text, style }: { text: string; style: Style }) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 1) {
    return (
      <Text style={style} orphans={2} widows={2}>
        {rich(text)}
      </Text>
    );
  }
  return (
    <View>
      {lines.map((ln, i) => (
        <Text key={i} style={style} orphans={2} widows={2}>
          {ln.trim() ? rich(ln) : ' '}
        </Text>
      ))}
    </View>
  );
}

/** Collapses line breaks for single-line contexts (cells, labels). */
const oneLine = (s: string | undefined) => (s ?? '').replace(/\s*\r?\n\s*/g, ' ');

function Translation({ text, env }: { text?: string; env: BlockEnv }) {
  if (!env.bilingual || !text) return null;
  const style = { fontStyle: 'italic', fontSize: env.theme.bodySize - 1.5, color: env.theme.muted, textAlign: 'left' } as const;
  // One Text per line: a literal "\n" inside a Text makes react-pdf reference an unembedded font.
  const lines = text.split(/\r?\n/).filter((ln) => ln.trim());
  return (
    <View style={{ marginTop: 2 }}>
      {lines.map((ln, i) => (
        <Text key={i} style={style}>
          {ln}
        </Text>
      ))}
    </View>
  );
}

function para(env: BlockEnv, align?: string): Style {
  return {
    fontSize: env.theme.bodySize,
    lineHeight: env.theme.lineHeight,
    textAlign: (align ?? env.theme.align) as 'justify' | 'left' | 'center' | 'right',
  };
}

function clauseHeading(style: 'clausula' | 'numeric' | 'artigo', i: number, item: ClauseItem): string {
  if (style === 'clausula') return `Cláusula ${ORDINAIS_F[i] ?? i + 1}`;
  if (style === 'artigo') return `Artigo ${i + 1}.º`;
  return `${i + 1}.${item.heading ? ` ${item.heading}` : ''}`;
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const MM_PT = 2.8346457;

/** Estimated rendered lines of text in a column of `width` (fraction of the content width). */
function textLines(theme: Theme, t: string | undefined, width = 1, size = theme.bodySize): number {
  const perLine = Math.max(8, Math.floor((theme.contentWidth * width) / (size * 0.5)));
  return (t ?? '').split('\n').reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / perLine)), 0);
}

/**
 * Whether a piece may be kept unbreakable. react-pdf overlaps content when an
 * unbreakable element cannot fit on a page, so only short pieces qualify.
 */
function canKeep(theme: Theme, heightPt: number): boolean {
  return heightPt < 250 && theme.contentWidth > 0;
}

type SignatureColumn = Extract<Block, { type: 'signatures' }>['columns'][number];

/** Space above the signature line; grows with the chosen sizes so a larger signature never covers the role caption. */
function signatureArea(col: SignatureColumn, env: BlockEnv): number {
  const { theme } = env;
  const showSig = (col.image === 'signature' || col.image === 'both') && env.signature;
  const showStamp = (col.image === 'stamp' || col.image === 'both') && env.stamp;
  // About 13 mm to sign by hand; more when a scanned signature or stamp is printed.
  return Math.max(38, showSig ? 40 * theme.signatureScale + 6 : 0, showStamp ? 58 * theme.stampScale * 0.75 : 0);
}

function SignatureColumnView({
  col,
  env,
  width,
  area,
  roleHeight,
}: {
  col: SignatureColumn;
  env: BlockEnv;
  width: string | number;
  /** Shared by all columns so the signature lines line up. */
  area: number;
  roleHeight: number;
}) {
  const { theme } = env;
  const showSig = (col.image === 'signature' || col.image === 'both') && env.signature;
  const showStamp = (col.image === 'stamp' || col.image === 'both') && env.stamp;
  const sigH = 40 * theme.signatureScale;
  const stampH = 58 * theme.stampScale;
  return (
    <View style={{ width, paddingHorizontal: 8, alignItems: 'center' }}>
      <View style={{ minHeight: roleHeight, marginBottom: 4, width: '100%', justifyContent: 'flex-end' }}>
        {col.role.split(/\r?\n/).map((r, i) => (
          <Text key={i} style={{ fontSize: theme.bodySize - 0.5, textAlign: 'center' }}>
            {r}
          </Text>
        ))}
      </View>
      <View style={{ height: area, width: '100%', position: 'relative' }}>
        {showStamp && env.stamp ? (
          <Image
            src={env.stamp.dataUrl}
            style={{
              position: 'absolute',
              right: 0,
              // Overlaps the signature line a little, never the printed name below it.
              bottom: -Math.min(stampH * 0.2, 4),
              height: stampH,
              width: (stampH * env.stamp.width) / Math.max(1, env.stamp.height),
              maxWidth: '75%',
              objectFit: 'contain',
              opacity: 0.92,
            }}
          />
        ) : null}
        {showSig && env.signature ? (
          // Centred over the line, as a hand signature would be; a stamp overlaps it on the right.
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: -2, alignItems: 'center' }}>
            <Image
              src={env.signature.dataUrl}
              style={{
                height: sigH,
                width: (sigH * env.signature.width) / Math.max(1, env.signature.height),
                maxWidth: '85%',
                objectFit: 'contain',
              }}
            />
          </View>
        ) : null}
      </View>
      <View style={{ borderTopWidth: 0.75, borderTopColor: theme.text, width: '100%', marginBottom: 3 }} />
      {col.name ? (
        <Text style={{ fontSize: theme.bodySize - 0.5, fontWeight: 700, textAlign: 'center' }}>
          {col.name}
        </Text>
      ) : null}
      {col.detail
        ? col.detail.split(/\r?\n/).map((d, i) => (
            <Text key={i} style={{ fontSize: theme.bodySize - 1.5, color: theme.muted, textAlign: 'center' }}>
              {d}
            </Text>
          ))
        : null}
    </View>
  );
}

export function renderBlock(block: Block, key: number | string, env: BlockEnv): ReactNode {
  const { theme } = env;
  switch (block.type) {
    case 'title':
      return (
        <View key={key} style={{ marginTop: 4, marginBottom: theme.gap + 6, alignItems: 'center' }} minPresenceAhead={60}>
          <Text
            style={{
              fontSize: theme.bodySize + 3,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.25,
              color: theme.heading,
            }}
          >
            {/* Uppercased before layout: react-pdf measures lines before textTransform/letterSpacing. */}
            {block.text.toLocaleUpperCase('pt')}
          </Text>
          {theme.plain || theme.family === 'peca' || theme.family === 'oficio' ? null : (
            <View style={{ width: 34, height: 1.6, backgroundColor: theme.accent, marginTop: 5 }} />
          )}
          {block.subtitle ? (
            <View style={{ marginTop: 5 }}>
              {block.subtitle.split(/\r?\n/).map((st, i) => (
                <Text key={i} style={{ fontSize: theme.bodySize - 0.5, textAlign: 'center', color: theme.muted }}>
                  {st}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      );

    case 'reference': {
      const right = [block.place && block.date ? `${block.place}, ${block.date}` : block.date ?? block.place]
        .filter(Boolean)
        .join('');
      return (
        <View
          key={key}
          style={{
            flexDirection: 'row',
            justifyContent: block.ref ? 'space-between' : block.align === 'left' ? 'flex-start' : 'flex-end',
            flexWrap: 'wrap',
            marginBottom: theme.gap + 4,
          }}
          wrap={false}
        >
          {block.ref ? (
            <Text style={{ fontSize: theme.bodySize - 0.5, marginRight: 12 }}>
              {/* "Ofício n.º 12/…" already names itself: no "N/Ref.ª" label. */}
              {/\bn\.º/.test(block.ref) ? null : <Text style={{ color: theme.muted }}>N/Ref.ª </Text>}
              <Text style={{ fontWeight: 700 }}>{block.ref}</Text>
            </Text>
          ) : null}
          {right ? <Text style={{ fontSize: theme.bodySize - 0.5 }}>{right}</Text> : null}
        </View>
      );
    }

    case 'recipient':
      return (
        <View key={key} style={{ marginLeft: '48%', marginBottom: theme.gap + 6 }} wrap={false}>
          {block.label ? (
            <Text style={{ fontSize: theme.smallSize + 0.5, color: theme.muted, marginBottom: 2 }}>{block.label}</Text>
          ) : null}
          {block.salutation ? <Text style={{ fontSize: theme.bodySize }}>{block.salutation}</Text> : null}
          {block.lines.filter(Boolean).map((l, i) => (
            <Text key={i} style={{ fontSize: theme.bodySize, lineHeight: 1.3, fontWeight: i === 0 ? 700 : 400 }}>
              {rich(oneLine(l))}
            </Text>
          ))}
        </View>
      );

    case 'subject':
      return (
        <View key={key} style={{ marginBottom: theme.gap + 2 }} minPresenceAhead={40}>
          <Text style={{ fontSize: theme.bodySize, fontWeight: 700, lineHeight: 1.3 }}>
            <Text style={{ color: theme.heading }}>{`${block.label ?? 'Assunto'}: `}</Text>
            {oneLine(block.text)}
          </Text>
        </View>
      );

    case 'salutation':
      return (
        <Text key={key} style={{ ...para(env, 'left'), marginBottom: theme.gap }} minPresenceAhead={30}>
          {oneLine(block.text)}
        </Text>
      );

    case 'paragraph':
      return (
        <View key={key} style={{ marginBottom: theme.gap }}>
          <RichText
            text={block.text}
            style={{
              ...para(env, block.align),
              fontSize: block.size === 'small' ? theme.bodySize - 1.5 : theme.bodySize,
              textIndent: block.indent ? 24 : !block.align || block.align === 'justify' ? theme.indent : 0,
            }}
          />
          <Translation text={block.en} env={env} />
        </View>
      );

    case 'heading':
      return (
        <Text
          key={key}
          style={{ fontSize: theme.bodySize, fontWeight: 700, marginTop: 6, marginBottom: 4, color: theme.heading, textAlign: block.align ?? 'left' }}
          minPresenceAhead={50}
        >
          {block.text}
        </Text>
      );

    case 'numberedClauses':
      // Returned as a flat fragment: react-pdf only moves an unbreakable View to
      // the next page when it is at most one level below the page, so every
      // keep-together piece here must be a direct child of the page.
      return (
        <Fragment key={key}>
          {block.items.map((item, i) => {
            // The heading needs room below it for the start of its text: with orphan
            // and widow control a paragraph of up to three lines cannot break, so it
            // needs all of them; a longer one needs two. Never more, or whole
            // clauses move and leave gaps.
            const first = (item.text ?? item.items?.[0] ?? '').split('\n')[0];
            const n = textLines(theme, first, 1);
            const ahead = theme.bodySize * theme.lineHeight * (n <= 3 ? n : 2) + 2;
            const heading =
              block.style === 'numeric' ? (
                <Text style={{ ...para(env), fontWeight: 700, marginBottom: 2, color: theme.heading }}>{clauseHeading('numeric', i + (block.start ?? 1) - 1, item)}</Text>
              ) : (
                <View style={{ marginBottom: 3 }}>
                  <Text style={{ fontSize: theme.bodySize, fontWeight: 700, textAlign: 'center', color: theme.heading }}>{clauseHeading(block.style, i + (block.start ?? 1) - 1, item)}</Text>
                  {item.heading ? <Text style={{ fontSize: theme.bodySize, textAlign: 'center' }}>({item.heading})</Text> : null}
                </View>
              );
            const last = i === block.items.length - 1;
            // The last clause goes to the next page with the closing and signatures
            // when they would not fit after it: a page never holds signatures alone.
            const tail = last ? ((block as ClausesWithTail).tail ?? 0) : 0;
            const lastAhead = tail
              ? Math.min(textLines(theme, item.text, 1) * theme.bodySize * theme.lineHeight + tail, (theme.page.height - theme.margin.top - theme.margin.bottom) * 0.55)
              : ahead;
            return (
              <Fragment key={item.id}>
                <View wrap={false} minPresenceAhead={lastAhead}>
                  {heading}
                </View>
                {item.text ? <RichText text={item.text} style={para(env)} /> : null}
                {item.items?.map((sub, j) => (
                  <View
                    key={j}
                    style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 12 }}
                    wrap={!canKeep(theme, textLines(theme, sub, 0.92) * theme.bodySize * theme.lineHeight)}
                  >
                    {/* minPresenceAhead keeps the label on the same page as its text. */}
                    <Text style={{ width: 16, fontSize: theme.bodySize }} minPresenceAhead={theme.bodySize * theme.lineHeight * 2}>
                      {ALPHA[j]})
                    </Text>
                    <View style={{ flex: 1 }}>
                      <RichText text={sub} style={para(env)} />
                    </View>
                  </View>
                ))}
                <Translation text={item.en} env={env} />
                <View style={{ height: theme.gap + 1 + (last ? theme.gap : 0) }} />
              </Fragment>
            );
          })}
        </Fragment>
      );

    case 'table': {
      const widths = block.columns.map((c) => c.width ?? 1);
      const total = widths.reduce((a, b) => a + b, 0);
      const cell = (txt: string, i: number, bold = false, header = false) => (
        <Text
          key={i}
          style={{
            width: `${(widths[i] / total) * 100}%`,
            paddingVertical: 3.5,
            paddingHorizontal: 5,
            fontSize: header ? theme.smallSize + 1 : theme.bodySize - 1,
            fontWeight: bold || header ? 700 : 400,
            textAlign: block.columns[i]?.align ?? 'left',
            color: header ? theme.heading : theme.text,
            ...(block.grid && i < block.columns.length - 1 ? { borderRightWidth: 0.6, borderRightColor: '#9aa0a6' } : {}),
          }}
        >
          {oneLine(txt)}
        </Text>
      );
      return (
        <View key={key} style={{ marginBottom: theme.gap + 2 }}>
          {block.caption ? (
            <Text style={{ fontSize: theme.bodySize, fontWeight: 700, marginBottom: 4 }} minPresenceAhead={60}>
              {block.caption}
            </Text>
          ) : null}
          <View
            fixed
            style={{
              flexDirection: 'row',
              backgroundColor: theme.accentTint,
              borderBottomWidth: 0.75,
              borderBottomColor: theme.accent,
            }}
          >
            {block.columns.map((c, i) => cell(c.label, i, true, true))}
          </View>
          {block.rows.map((r, ri) =>
            // "§ Chapter" → section row across the table; "= Subtotal" → bold row with a rule.
            r[0]?.startsWith('§ ') ? (
              <View key={ri} wrap={false} minPresenceAhead={30} style={{ backgroundColor: theme.accentTint, paddingVertical: 3, paddingHorizontal: 5, marginTop: ri ? 4 : 0 }}>
                <Text style={{ fontSize: theme.bodySize - 1, fontWeight: 700, color: theme.heading }}>{oneLine(r[0].slice(2))}</Text>
              </View>
            ) : r[0]?.startsWith('= ') ? (
              <View key={ri} wrap={false} style={{ flexDirection: 'row', borderTopWidth: 0.6, borderTopColor: theme.text }}>
                {r.map((c, i) => cell(i === 0 ? c.slice(2) : c, i, true))}
              </View>
            ) : (
            <View
              key={ri}
              wrap={!canKeep(theme, Math.max(...r.map((c, ci) => textLines(theme, c, widths[ci] / total, theme.bodySize - 1))) * (theme.bodySize - 1) * 1.4 + 8)}
              // The last row goes with the totals: a totals row never starts a page alone.
              minPresenceAhead={ri === block.rows.length - 1 && block.totals?.length ? block.totals.length * (theme.bodySize + 9) : undefined}
              // Rows left blank to be filled in by hand keep a writable height.
              style={{ flexDirection: 'row', minHeight: (theme.bodySize - 1) * 1.4 + 9, borderBottomWidth: 0.4, borderBottomColor: '#d6dad7', backgroundColor: ri % 2 === 1 ? theme.wash : undefined }}
            >
              {r.map((c, i) => cell(c, i))}
            </View>
            ),
          )}
          {block.totals?.map((r, ri) => (
            <View
              key={`t${ri}`}
              wrap={false}
              style={{
                flexDirection: 'row',
                borderTopWidth: ri === 0 ? 0.75 : 0,
                borderTopColor: theme.text,
                backgroundColor: ri === (block.totals?.length ?? 0) - 1 ? theme.accentTint : undefined,
              }}
            >
              {r.map((c, i) => cell(c, i, true))}
            </View>
          ))}
          {block.note ? (
            <Text style={{ fontSize: theme.smallSize, color: theme.muted, marginTop: 3 }}>{block.note}</Text>
          ) : null}
        </View>
      );
    }

    case 'keyValue': {
      const cols = block.columns ?? 1;
      const cell = (it: { label: string; value: string }, i: number) => (
        <View
          key={i}
          style={{
            width: cols === 2 ? '50%' : '100%',
            flexDirection: 'row',
            paddingVertical: 2,
            paddingRight: cols === 2 ? 8 : 0,
            borderBottomWidth: 0.3,
            borderBottomColor: '#e1e4e8',
          }}
        >
          <Text style={{ width: cols === 2 ? '45%' : '35%', fontSize: theme.bodySize - 1.5, color: theme.muted, paddingRight: 6 }}>{it.label}</Text>
          <Text style={{ flex: 1, fontSize: theme.bodySize - 1 }}>{oneLine(it.value) || '—'}</Text>
        </View>
      );
      const rows: { label: string; value: string }[][] = [];
      for (let i = 0; i < block.items.length; i += cols) rows.push(block.items.slice(i, i + cols));
      const rowHeight = (r: { label: string; value: string }[]) =>
        Math.max(...r.map((it) => textLines(theme, oneLine(it.value), cols === 2 ? 0.27 : 0.6, theme.bodySize - 1))) * (theme.bodySize - 1) * 1.4 + 6;
      const row = (r: { label: string; value: string }[], i: number) => (
        <View
          key={`r${i}`}
          wrap={!canKeep(theme, rowHeight(r))}
          // The last row never starts a page alone: it takes the one before with it.
          minPresenceAhead={i === rows.length - 2 && rows.length > 2 ? rowHeight(rows[rows.length - 1]) : undefined}
          style={{ flexDirection: 'row' }}
        >
          {r.map((it, j) => cell(it, i * cols + j))}
        </View>
      );
      // Flat fragment (see numberedClauses). The title travels with the first rows.
      const headRows = rows.slice(0, 2);
      const keepHead = canKeep(theme, 20 + headRows.reduce((h, r) => h + rowHeight(r), 0));
      return (
        <Fragment key={key}>
          <View wrap={!keepHead}>
            {block.title ? (
              <Text
                style={{
                  fontSize: theme.smallSize + 1,
                  fontWeight: 700,
                  color: theme.heading,
                  borderBottomWidth: 0.75,
                  borderBottomColor: theme.accent,
                  paddingBottom: 2,
                  marginBottom: 3,
                }}
              >
                {block.title.toLocaleUpperCase('pt')}
              </Text>
            ) : null}
            {headRows.map((r, i) => row(r, i))}
          </View>
          {rows.slice(2).map((r, i) => row(r, i + 2))}
          <View style={{ height: theme.gap + 2 }} />
        </Fragment>
      );
    }

    case 'amount': {
      const ext =
        block.extenso !== false && block.value != null && block.value >= 0 && block.value <= MAX_EXTENSO
          ? `(${numeroPorExtenso(block.value)})`
          : null;
      return (
        <View
          key={key}
          wrap={false}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: theme.accent,
            backgroundColor: theme.wash,
            paddingVertical: 7,
            paddingHorizontal: 10,
            marginBottom: theme.gap + 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: theme.bodySize, color: theme.muted }}>{block.label}</Text>
            <Text style={{ fontSize: theme.bodySize + 1.5, fontWeight: 700, color: theme.heading }}>{formatMoney(block.value)}</Text>
          </View>
          {ext ? <Text style={{ fontSize: theme.bodySize - 1, fontStyle: 'italic', marginTop: 2 }}>{ext}</Text> : null}
        </View>
      );
    }

    case 'signatures': {
      const n = block.columns.length;
      const aside = (block as SignaturesWithAside).aside;
      // One signature: wider, so long positions fit on fewer lines. On designed pages
      // each line is at most about 75 mm and the columns are centred.
      const frac = n === 1 ? (aside ? 0.47 : 0.6) : n === 2 ? 0.47 : 0.31;
      const width: string | number = env.centred
        ? Math.min(theme.contentWidth * (n === 1 ? 0.5 : frac + 0.03), 75 * 2.835 + 16)
        : n === 1 ? (aside ? '50%' : '62%') : n === 2 ? '50%' : '33.33%';
      const area = Math.max(...block.columns.map((c) => signatureArea(c, env)));
      const justify = env.centred
        ? 'space-around'
        : n === 1 ? (theme.family === 'oficio' || (env.publicBody && !aside) ? 'center' : 'flex-start') : 'space-between';
      const roleHeight =
        Math.max(...block.columns.map((c) => textLines(theme, c.role, frac, theme.bodySize - 0.5))) * (theme.bodySize - 0.5) * 1.3;
      return (
        <View key={key} wrap={false} style={{ marginTop: theme.compact ? 4 : 10, marginBottom: theme.gap }}>
          {block.placeDate ? (
            <Text style={{ fontSize: theme.bodySize, marginBottom: 14 }}>{block.placeDate}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: justify }}>
            {block.columns.map((c, i) => (
              <SignatureColumnView key={i} col={c} env={env} width={width} area={area} roleHeight={roleHeight} />
            ))}
            {/* A receipt box beside a single signature uses the empty right half (see renderBlocks). */}
            {aside ? <View style={{ width: '46%', marginLeft: '4%', justifyContent: 'flex-end' }}>{renderBlock({ ...aside, after: 0 } as Block, `${key}-aside`, env)}</View> : null}
          </View>
        </View>
      );
    }

    case 'acknowledgement':
      return (
        <View
          key={key}
          wrap={false}
          style={{
            marginTop: 12,
            borderWidth: 0.6,
            borderColor: theme.rule,
            borderStyle: 'dashed',
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <Text style={{ fontSize: theme.smallSize, color: theme.muted, marginBottom: 3, letterSpacing: 0.3 }}>RECEPÇÃO</Text>
          <Text style={{ fontSize: theme.bodySize - 1 }}>
            {block.text ?? 'Recebi o original em ___/___/______'}
          </Text>
          {/* A drawn line (underscores wrap and hyphenate in a narrow box). */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 }}>
            <Text style={{ fontSize: theme.bodySize - 1 }}>{`${block.signer ?? 'O Trabalhador'}:`}</Text>
            <View style={{ flex: 1, marginLeft: 4, marginBottom: 2, borderBottomWidth: 0.6, borderColor: theme.text }} />
          </View>
        </View>
      );

    case 'annexList':
      if (!block.items.length) return null;
      return (
        <View key={key} wrap={false} style={{ marginTop: 6, marginBottom: theme.gap }}>
          <Text style={{ fontSize: theme.bodySize - 1, fontWeight: 700, marginBottom: 2 }}>{block.title ?? 'Anexos:'}</Text>
          {block.items.map((it, i) => (
            <Text key={i} style={{ fontSize: theme.bodySize - 1, lineHeight: 1.35 }}>
              {/* Items that already name themselves ("Anexo I — …", "Documento n.º 1 — …") are not numbered again. */}
              {/^(anexo|documento|doc\.)\s/i.test(it) ? oneLine(it) : `${i + 1}. ${oneLine(it)}`}
            </Text>
          ))}
        </View>
      );

    case 'courtHeader':
      return (
        <View key={key} wrap={false} style={{ marginBottom: theme.gap }}>
          {block.processo ? (
            <Text style={{ fontSize: theme.bodySize - 0.5, marginBottom: 12 }}>
              <Text style={{ fontWeight: 700 }}>Processo n.º </Text>
              {oneLine(block.processo)}
              {block.extra ? ` — ${oneLine(block.extra)}` : ''}
            </Text>
          ) : null}
          <Text style={{ fontSize: theme.bodySize, fontWeight: 700, lineHeight: 1.35, width: '78%' }}>{oneLine(block.addressee)}</Text>
          {/* Space left blank at the top of a filing for the judge's order. */}
          <View style={{ height: 16 * MM_PT }} />
        </View>
      );

    case 'articulado': {
      let n = (block.start ?? 1) - 1;
      return (
        <Fragment key={key}>
          {block.sections.map((sec, si) => (
            <Fragment key={si}>
              {sec.heading ? (
                <Text
                  style={{ fontSize: theme.bodySize, fontWeight: 700, textAlign: 'center', marginTop: 6, marginBottom: theme.gap + 2 }}
                  minPresenceAhead={60}
                >
                  {oneLine(sec.heading).toLocaleUpperCase('pt')}
                </Text>
              ) : null}
              {sec.items.map((it, ii) => {
                n += 1;
                return (
                  <View
                    key={ii}
                    style={{ flexDirection: 'row', marginBottom: theme.gap }}
                    wrap={!canKeep(theme, textLines(theme, it, 0.88) * theme.bodySize * theme.lineHeight)}
                  >
                    <Text style={{ width: 30, fontSize: theme.bodySize, fontWeight: 700 }} minPresenceAhead={theme.bodySize * theme.lineHeight * 2}>
                      {`${n}.º`}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <RichText text={it} style={para(env)} />
                    </View>
                  </View>
                );
              })}
            </Fragment>
          ))}
        </Fragment>
      );
    }

    case 'box': {
      const lines = Math.max(0, Math.min(12, block.lines ?? 0));
      const boxView = (
        <View
          key={key}
          wrap={false}
          style={{
            width: block.width === 'half' ? '48%' : '100%',
            alignSelf: block.align === 'right' ? 'flex-end' : 'flex-start',
            borderWidth: 0.6,
            borderStyle: block.dashed ? 'dashed' : 'solid',
            borderColor: theme.rule,
            paddingVertical: 6,
            paddingHorizontal: 8,
            marginBottom: theme.gap + 2,
          }}
        >
          <Text style={{ fontSize: theme.smallSize, fontWeight: 700, color: theme.muted }}>{oneLine(block.label).toLocaleUpperCase('pt')}</Text>
          {block.text ? <RichText text={block.text} style={{ fontSize: theme.bodySize - 1, lineHeight: 1.35, marginTop: 3 }} /> : null}
          {block.space ? <View style={{ height: Math.min(180, block.space) * MM_PT }} /> : null}
          {Array.from({ length: lines }, (_, i) => (
            <Fragment key={i}>
              <View style={{ height: 15 }} />
              <View style={{ height: 0.4, backgroundColor: theme.rule }} />
            </Fragment>
          ))}
        </View>
      );
      if (!block.cut) return boxView;
      // Tear-off slip: dashed cut line with a label, then the box.
      return (
        <View key={key} wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 }}>
            <View style={{ flex: 1, borderTopWidth: 0.6, borderTopColor: theme.rule, borderStyle: 'dashed' }} />
            <Text style={{ fontSize: theme.smallSize, color: theme.muted, marginHorizontal: 6 }}>recortar e devolver</Text>
            <View style={{ flex: 1, borderTopWidth: 0.6, borderTopColor: theme.rule, borderStyle: 'dashed' }} />
          </View>
          {boxView}
        </View>
      );
    }

    case 'display': {
      // Never below 6.5 pt: the smallest size that stays legible in print.
      let size = Math.max(6.5, DISPLAY_PT[block.size ?? 'md'] * theme.scale);
      if (block.fit) {
        // Shrink so the longest line fits the width (average glyph ≈ 0.55 em; capitals wider).
        const longest = Math.max(...block.text.split(/\r?\n/).map((x) => x.replace(/\*\*/g, '').length), 1);
        const em = (block.uppercase ? 0.68 : 0.55) + (block.weight === 'bold' ? 0.05 : 0);
        size = Math.max(6.5, Math.min(size, theme.contentWidth / (longest * em)));
      }
      const color = block.tone === 'accent' ? (theme.plain ? theme.text : theme.accent) : block.tone === 'muted' ? theme.muted : theme.text;
      const lines = block.text.split(/\r?\n/);
      return (
        <View
          key={key}
          // Long centred text reads better on a narrower measure.
          style={{ marginBottom: block.after ?? size * 0.45, ...(block.align !== 'left' && block.align !== 'right' && block.text.length > 90 ? { width: '86%', alignSelf: 'center' } : {}) }}
          wrap={false}
        >
          {lines.map((ln, i) => {
            const style = {
              fontSize: size,
              lineHeight: 1.22,
              textAlign: block.align ?? 'center',
              color,
              fontWeight: block.weight === 'bold' ? 700 : 400,
              fontStyle: block.italic ? 'italic' : 'normal',
            } as const;
            // Uppercased before layout (react-pdf measures before textTransform).
            // Times keep a lower-case "h" ("11h00", not "11H00").
            const txt = block.uppercase ? ln.toLocaleUpperCase('pt').replace(/\b(\d{1,2})H(\d{2})?\b/g, (_, h, m = '') => `${h}h${m}`) : ln;
            // "• " or "- " lines: a bullet with a hanging indent.
            const bullet = /^\s*[•-]\s+/.exec(txt);
            if (bullet) {
              return (
                <View key={i} style={{ flexDirection: 'row' }}>
                  <Text style={{ ...style, width: size * 1.1, textAlign: 'left' }}>•</Text>
                  <Text style={{ ...style, flex: 1, textAlign: 'left' }}>{rich(txt.slice(bullet[0].length))}</Text>
                </View>
              );
            }
            return (
              <Text key={i} style={style}>
                {txt ? rich(txt) : ' '}
              </Text>
            );
          })}
        </View>
      );
    }

    case 'ornament': {
      const w = block.width === 'full' ? '100%' : block.width === 'medium' ? '40%' : 34 * theme.scale;
      const self = {
        alignSelf: (block.align === 'left' ? 'flex-start' : block.align === 'right' ? 'flex-end' : 'center') as 'flex-start' | 'flex-end' | 'center',
        marginVertical: 6 * theme.scale,
      };
      if (block.style === 'tricolour') {
        // The app's mark: green, a gap, yellow and red — muted for print.
        return (
          <View key={key} style={{ ...self, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 26 * theme.scale, height: 1.6, backgroundColor: theme.plain ? theme.text : '#0b5a40' }} />
            <View style={{ width: 7 * theme.scale, height: 1.6, backgroundColor: theme.plain ? theme.text : '#f2b81c', marginLeft: 2 }} />
            <View style={{ width: 7 * theme.scale, height: 1.6, backgroundColor: theme.plain ? theme.text : '#c8102e' }} />
          </View>
        );
      }
      if (block.style === 'cross') {
        // A thin Latin cross, drawn (fonts may lack the glyph).
        const h = 16 * theme.scale;
        return (
          <View key={key} style={{ ...self, width: h * 0.62, height: h }}>
            <View style={{ position: 'absolute', left: h * 0.31 - 0.6, top: 0, width: 1.2, height: h, backgroundColor: theme.text }} />
            <View style={{ position: 'absolute', left: 0, top: h * 0.28, width: h * 0.62, height: 1.2, backgroundColor: theme.text }} />
          </View>
        );
      }
      if (block.style === 'dots') {
        return (
          <Text key={key} style={{ ...self, fontSize: 9 * theme.scale, color: theme.accent, letterSpacing: 0 }}>
            •  •  •
          </Text>
        );
      }
      if (block.style === 'double') {
        return (
          <View key={key} style={{ ...self, width: w }}>
            <View style={{ height: 1, backgroundColor: theme.accent }} />
            <View style={{ height: 0.5, backgroundColor: theme.accent, marginTop: 1.6 }} />
          </View>
        );
      }
      return <View key={key} style={{ ...self, width: w, height: 1, backgroundColor: theme.accent }} />;
    }

    case 'logo': {
      // Black-and-grey documents (funeral notices) carry no colour logo.
      if (!env.logo || theme.mono) return null;
      const h = (block.size === 'lg' ? 22 : block.size === 'sm' ? 9 : 14) * 2.8346 * theme.scale;
      const ratio = env.logo.width / Math.max(1, env.logo.height);
      const w = Math.min(h * ratio, theme.contentWidth * 0.7);
      return (
        <View key={key} style={{ alignItems: block.align === 'left' ? 'flex-start' : block.align === 'right' ? 'flex-end' : 'center', marginBottom: 6 * theme.scale }}>
          <Image src={env.logo.dataUrl} style={{ width: w, height: w / ratio, objectFit: 'contain' }} />
        </View>
      );
    }

    case 'envelope': {
      // DL envelope: sender top left, addressee in the window position (lower right).
      const lineStyle = { fontSize: theme.bodySize, lineHeight: 1.35 };
      return (
        <View key={key} style={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View style={{ width: '45%' }}>
            {block.sender.filter(Boolean).map((ln, i) => (
              <Text key={i} style={{ ...lineStyle, fontSize: theme.bodySize - 1.5, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? theme.text : theme.muted }}>
                {oneLine(ln)}
              </Text>
            ))}
          </View>
          <View style={{ alignSelf: 'flex-end', width: '52%', marginBottom: 6 }}>
            {block.note ? <Text style={{ fontSize: theme.smallSize, fontWeight: 700, marginBottom: 4 }}>{oneLine(block.note).toLocaleUpperCase('pt')}</Text> : null}
            {block.recipient.filter(Boolean).map((ln, i) => (
              <Text key={i} style={{ ...lineStyle, fontWeight: i === 0 ? 700 : 400 }}>
                {rich(oneLine(ln))}
              </Text>
            ))}
          </View>
        </View>
      );
    }

    case 'tags':
      if (!block.items.length) return null;
      return (
        <View key={key} wrap={false} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: theme.gap }}>
          {block.items.map((t, i) => (
            <View key={i} style={{ borderWidth: 0.8, borderColor: theme.text, paddingHorizontal: 5, paddingVertical: 1.5, marginLeft: 6 }}>
              <Text style={{ fontSize: theme.smallSize + 0.5, fontWeight: 700 }}>{oneLine(t).toLocaleUpperCase('pt')}</Text>
            </View>
          ))}
        </View>
      );

    case 'list':
      return (
        <View key={key} style={{ marginBottom: theme.gap }}>
          {block.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }} wrap={!canKeep(theme, textLines(theme, it, 0.92) * theme.bodySize * theme.lineHeight)}>
              <Text style={{ width: 18, fontSize: theme.bodySize }} minPresenceAhead={theme.bodySize * theme.lineHeight * 2}>
                {block.style === 'alpha' ? `${ALPHA[i]})` : block.style === 'numeric' ? `${i + 1}.` : '•'}
              </Text>
              <View style={{ flex: 1 }}>
                <RichText text={it} style={para(env)} />
              </View>
            </View>
          ))}
        </View>
      );

    case 'checklist':
      return (
        // Wrap only in two-column mode: a wrapping column continues beside itself at a page break.
        <View key={key} style={{ marginBottom: theme.gap, ...(block.columns === 2 ? { flexDirection: 'row', flexWrap: 'wrap' } : { flexDirection: 'column' }) }}>
          {block.items.map((it, i) => (
            <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3, width: block.columns === 2 ? '50%' : '100%', paddingRight: block.columns === 2 ? 8 : 0 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderWidth: 0.75,
                  borderColor: theme.text,
                  marginRight: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Drawn mark (a glyph inside a tiny box can be dropped by the layout). */}
                {it.checked ? <View style={{ width: 5, height: 5, backgroundColor: theme.text }} /> : null}
              </View>
              <Text style={{ fontSize: theme.bodySize - 0.5, flex: 1 }}>{it.label}</Text>
            </View>
          ))}
        </View>
      );

    case 'note':
      return (
        <View key={key} style={{ marginBottom: theme.gap }}>
          <RichText text={block.text} style={{ fontSize: theme.smallSize + 0.5, color: theme.muted, lineHeight: 1.35 }} />
          <Translation text={block.en} env={env} />
        </View>
      );

    case 'spacer':
      return <View key={key} style={{ height: block.size === 'large' ? 28 : block.size === 'small' ? 6 : 14 }} />;

    case 'pageBreakHint':
      return <View key={key} break />;

    default:
      return null;
  }
}

/** Rough height (pt) of a block, used to decide whether a group can be kept unbreakable. */
export function estimateHeight(b: Block, theme: Theme): number {
  const lineH = theme.bodySize * theme.lineHeight;
  const perLine = Math.max(30, Math.floor(theme.contentWidth / (theme.bodySize * 0.5)));
  const lines = (t: string | undefined, width = 1) =>
    (t ?? '').split('\n').reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / (perLine * width))), 0);
  switch (b.type) {
    case 'paragraph':
    case 'note':
      return lines(b.text) * lineH + theme.gap;
    case 'heading':
    case 'salutation':
    case 'subject':
      return 2 * lineH;
    case 'title':
      return 45;
    case 'reference':
      return 25;
    case 'recipient':
      return (b.lines.length + 2) * lineH;
    case 'table': {
      const n = b.columns.length || 1;
      const rowH = (r: string[]) => Math.max(1, ...r.map((c) => lines(c, 1 / n))) * (theme.bodySize - 1) * 1.4 + 8;
      return [...b.rows, ...(b.totals ?? [])].reduce((h, r) => h + rowH(r), 30);
    }
    case 'keyValue': {
      const cols = b.columns ?? 1;
      const width = cols === 2 ? 0.3 : 0.6;
      let h = 20;
      for (let i = 0; i < b.items.length; i += cols) {
        const row = b.items.slice(i, i + cols);
        h += Math.max(...row.map((it) => lines(it.value, width))) * (theme.bodySize - 1) * 1.4 + 4;
      }
      return h;
    }
    case 'list':
    case 'annexList':
      return b.items.reduce((h, it) => h + lines(it, 0.9) * lineH, 0) + theme.gap;
    case 'checklist':
      return Math.ceil(b.items.length / (b.columns ?? 1)) * 16;
    case 'numberedClauses':
      return b.items.reduce((h, it) => h + 32 + lines(it.text) * lineH + (it.items ?? []).reduce((x, sub) => x + lines(sub, 0.9) * lineH, 0), 0);
    case 'amount':
      return 50;
    case 'signatures':
      // Worst case: images present at the chosen sizes, plus extra lines in names and details.
      return (
        (b.columns.some((c) => c.image) ? Math.max(130, 84 + Math.max(46, 40 * theme.signatureScale + 6, 58 * theme.stampScale * 0.75)) : 120) +
        // Extra wrapped lines in roles, names and details at the column width.
        Math.max(
          0,
          ...b.columns.map((c) => {
            const w = b.columns.length === 3 ? 0.29 : 0.44;
            return lines(c.role, w) - 1 + (c.name ? lines(c.name, w) - 1 : 0) + (c.detail ? lines(c.detail, w * 1.1) - 1 : 0);
          }),
        ) * 12
      );
    case 'acknowledgement':
      return 60;
    case 'courtHeader':
      return 3 * lineH + 16 * MM_PT + (b.processo ? 20 : 0);
    case 'articulado':
      return b.sections.reduce((h, sec) => h + (sec.heading ? 24 : 0) + sec.items.reduce((x, it) => x + lines(it, 0.88) * lineH + theme.gap, 0), 0);
    case 'box':
      return 24 + lines(b.text, b.width === 'half' ? 0.45 : 0.95) * lineH + (b.lines ?? 0) * 15.4 + (b.space ?? 0) * MM_PT + (b.cut ? 24 : 0);
    case 'tags':
      return 20;
    case 'display':
      return b.text.split('\n').length * DISPLAY_PT[b.size ?? 'md'] * theme.scale * 1.7;
    case 'ornament':
      return 14;
    case 'envelope':
      return theme.page.height;
    case 'logo':
      return 70 * theme.scale;
    case 'spacer':
      return 20;
    default:
      return 20;
  }
}

type ClausesWithTail = Extract<Block, { type: 'numberedClauses' }> & { tail?: number };

/** Marks clauses followed by a closing that ends in signatures with that closing's height. */
function withClosingTails(blocks: Block[], theme: Theme): Block[] {
  return blocks.map((b, i) => {
    if (b.type !== 'numberedClauses') return b;
    let h = 0;
    for (let j = i + 1; j < blocks.length; j++) {
      const n = blocks[j];
      h += estimateHeight(n, theme);
      // Generous: an overestimate is harmless (react-pdf only moves the clause
      // when the closing really does not fit after it).
      if (n.type === 'signatures') return { ...b, tail: Math.min(h + 40, 260) } as ClausesWithTail;
      if (!n.keepWithNext) break;
    }
    return b;
  });
}

type SignaturesWithAside = Extract<Block, { type: 'signatures' }> & { aside?: Extract<Block, { type: 'acknowledgement' }> };

/**
 * A receipt ("RECEPÇÃO") box that follows a single signature is drawn in the
 * empty right half beside it rather than below, which keeps short letters
 * (warnings, notices) on one page.
 */
function withAsideReceipts(blocks: Block[], theme: Theme): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    if (b.type === 'signatures' && b.columns.length === 1 && next?.type === 'acknowledgement' && theme.family !== 'oficio' && !theme.compact) {
      out.push({ ...b, keepWithNext: next.keepWithNext, aside: next } as SignaturesWithAside);
      i++;
    } else out.push(b);
  }
  return out;
}

const FLOWING = new Set<Block['type']>(['numberedClauses', 'articulado', 'paragraph', 'list', 'table', 'checklist']);

const isHalfBox = (b: Block | undefined): b is Extract<Block, { type: 'box' }> => b?.type === 'box' && b.width === 'half' && !b.keepWithNext;

/**
 * Renders blocks, grouping each run of `keepWithNext` blocks with the block
 * that follows into an unbreakable unit (e.g. closing paragraph + signatures).
 * A group is only made unbreakable when it comfortably fits on a page:
 * react-pdf overlaps lines when an unbreakable unit is taller than the page.
 */
export function renderBlocks(input: Block[], env: BlockEnv): ReactNode[] {
  const blocks = withClosingTails(withAsideReceipts(input, env.theme), env.theme);
  const out: ReactNode[] = [];
  let loneHalfBox = -1; // index in `out` of a half-width box waiting for a partner
  let group: Block[] = [];
  const pageBody = env.theme.page.height - env.theme.margin.top - env.theme.margin.bottom - 60;
  blocks.forEach((b, i) => {
    // Two half-width boxes in a row sit side by side (e.g. Despacho | Parecer).
    if (isHalfBox(b) && group.length === 0) {
      if (loneHalfBox >= 0 && loneHalfBox === out.length - 1) {
        out.pop();
        const prev = blocks[i - 1] as Extract<Block, { type: 'box' }>;
        out.push(
          <View key={`pair${i}`} wrap={false} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {renderBlock({ ...prev, align: 'left' }, i - 1, env)}
            {renderBlock({ ...b, align: 'left' }, i, env)}
          </View>,
        );
        loneHalfBox = -1;
      } else {
        out.push(renderBlock(b, i, env));
        loneHalfBox = out.length - 1;
      }
      return;
    }
    group.push(b);
    const next = blocks[i + 1];
    const autoKeep = b.type === 'heading' || b.type === 'subject';
    if ((b.keepWithNext || autoKeep) && next) return;
    if (group.length === 1) {
      out.push(renderBlock(b, i, env));
    } else {
      const height = group.reduce((h, g) => h + estimateHeight(g, env.theme), 0);
      // Text that can flow across pages (clauses, paragraphs, tables) is only kept
      // whole when short; otherwise moving it leaves a large gap on the page before.
      const flows = FLOWING.has(b.type);
      if (height <= pageBody * (flows ? 0.22 : 0.6)) {
        out.push(
          <View key={`g${i}`} wrap={false}>
            {group.map((g, j) => renderBlock(g, `${i}-${j}`, env))}
          </View>,
        );
      } else {
        // Too tall to keep together: keep the lead-in with at least the start of what follows.
        group.forEach((g, j) =>
          out.push(
            j < group.length - 1 ? (
              <View key={`${i}-${j}`} minPresenceAhead={80}>
                {renderBlock(g, `${i}-${j}-i`, env)}
              </View>
            ) : (
              renderBlock(g, `${i}-${j}`, env)
            ),
          ),
        );
      }
    }
    group = [];
  });
  return out;
}
