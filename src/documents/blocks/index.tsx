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
  signature?: RenderAsset;
  stamp?: RenderAsset;
};

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
  return (
    <Text
      style={{
        fontStyle: 'italic',
        fontSize: env.theme.bodySize - 1.5,
        color: env.theme.muted,
        marginTop: 2,
        textAlign: 'left',
      }}
    >
      {text}
    </Text>
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
  if (style === 'artigo') return `Artigo ${i + 1}`;
  return `${i + 1}.${item.heading ? ` ${item.heading}` : ''}`;
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

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

function SignatureColumnView({
  col,
  env,
  width,
}: {
  col: Extract<Block, { type: 'signatures' }>['columns'][number];
  env: BlockEnv;
  width: string;
}) {
  const { theme } = env;
  const showSig = (col.image === 'signature' || col.image === 'both') && env.signature;
  const showStamp = (col.image === 'stamp' || col.image === 'both') && env.stamp;
  const area = 46; // pt reserved above the signature line
  return (
    <View style={{ width, paddingHorizontal: 8, alignItems: 'center' }}>
      <Text style={{ fontSize: theme.bodySize - 0.5, marginBottom: 4, textAlign: 'center' }}>{col.role}</Text>
      <View style={{ height: area, width: '100%', position: 'relative' }}>
        {showStamp && env.stamp ? (
          <Image
            src={env.stamp.dataUrl}
            style={{
              position: 'absolute',
              right: 4,
              top: -6,
              height: 58,
              width: (58 * env.stamp.width) / Math.max(1, env.stamp.height),
              maxWidth: '60%',
              objectFit: 'contain',
              opacity: 0.92,
            }}
          />
        ) : null}
        {showSig && env.signature ? (
          <Image
            src={env.signature.dataUrl}
            style={{
              position: 'absolute',
              left: '20%',
              bottom: 0,
              height: area - 4,
              width: ((area - 4) * env.signature.width) / Math.max(1, env.signature.height),
              maxWidth: '60%',
              objectFit: 'contain',
            }}
          />
        ) : null}
      </View>
      <View style={{ borderTopWidth: 0.75, borderTopColor: theme.text, width: '100%', marginBottom: 3 }} />
      {col.name ? (
        <Text style={{ fontSize: theme.bodySize - 0.5, fontWeight: 700, textAlign: 'center' }}>{col.name}</Text>
      ) : null}
      {col.detail ? (
        <Text style={{ fontSize: theme.bodySize - 1.5, color: theme.muted, textAlign: 'center' }}>{col.detail}</Text>
      ) : null}
    </View>
  );
}

export function renderBlock(block: Block, key: number | string, env: BlockEnv): ReactNode {
  const { theme } = env;
  switch (block.type) {
    case 'title':
      return (
        <View key={key} style={{ marginTop: 4, marginBottom: theme.gap + 4 }} minPresenceAhead={60}>
          <Text
            style={{
              fontSize: theme.bodySize + 2.5,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.25,
            }}
          >
            {/* Uppercased before layout: react-pdf measures lines before textTransform/letterSpacing. */}
            {block.text.toLocaleUpperCase('pt')}
          </Text>
          {block.subtitle ? (
            <Text style={{ fontSize: theme.bodySize - 0.5, textAlign: 'center', color: theme.muted, marginTop: 3 }}>
              {block.subtitle}
            </Text>
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
              <Text style={{ color: theme.muted }}>N/Ref.ª </Text>
              {block.ref}
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
              {oneLine(l)}
            </Text>
          ))}
        </View>
      );

    case 'subject':
      return (
        <View key={key} style={{ marginBottom: theme.gap + 2 }} minPresenceAhead={40}>
          <Text style={{ fontSize: theme.bodySize, fontWeight: 700, lineHeight: 1.3 }}>
            {`${block.label ?? 'Assunto'}: `}
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
              textIndent: block.indent ? 24 : 0,
            }}
          />
          <Translation text={block.en} env={env} />
        </View>
      );

    case 'heading':
      return (
        <Text
          key={key}
          style={{ fontSize: theme.bodySize, fontWeight: 700, marginTop: 6, marginBottom: 4, color: theme.text }}
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
            // Keep the heading with the first paragraph of its clause so it is
            // never left alone at the foot of a page.
            const lines = (item.text ?? '').split(/\r?\n/);
            const first = lines[0] ?? '';
            const rest = lines.slice(1).join('\n');
            const groupFirst = first.length > 0 && canKeep(theme, textLines(theme, first) * theme.bodySize * theme.lineHeight + 40);
            const heading =
              block.style === 'numeric' ? (
                <Text style={{ ...para(env), fontWeight: 700, marginBottom: 2 }}>{clauseHeading('numeric', i, item)}</Text>
              ) : (
                <View style={{ marginBottom: 3 }}>
                  <Text style={{ fontSize: theme.bodySize, fontWeight: 700, textAlign: 'center' }}>{clauseHeading(block.style, i, item)}</Text>
                  {item.heading ? <Text style={{ fontSize: theme.bodySize, textAlign: 'center' }}>({item.heading})</Text> : null}
                </View>
              );
            const last = i === block.items.length - 1;
            return (
              <Fragment key={item.id}>
                <View wrap={false}>
                  {heading}
                  {groupFirst ? <RichText text={first} style={para(env)} /> : null}
                </View>
                {groupFirst ? (rest ? <RichText text={rest} style={para(env)} /> : null) : item.text ? <RichText text={item.text} style={para(env)} /> : null}
                {item.items?.map((sub, j) => (
                  <View key={j} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 12 }}>
                    <Text style={{ width: 16, fontSize: theme.bodySize }}>{ALPHA[j]})</Text>
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
            color: header ? theme.accent : theme.text,
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
          {block.rows.map((r, ri) => (
            <View
              key={ri}
              wrap={!canKeep(theme, Math.max(...r.map((c, ci) => textLines(theme, c, widths[ci] / total, theme.bodySize - 1))) * (theme.bodySize - 1) * 1.4 + 8)}
              style={{ flexDirection: 'row', borderBottomWidth: 0.4, borderBottomColor: '#d0d4d8' }}
            >
              {r.map((c, i) => cell(c, i))}
            </View>
          ))}
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
        <View key={`r${i}`} wrap={!canKeep(theme, rowHeight(r))} style={{ flexDirection: 'row' }}>
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
                  color: theme.accent,
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
            borderWidth: 0.75,
            borderColor: theme.accent,
            paddingVertical: 6,
            paddingHorizontal: 8,
            marginBottom: theme.gap + 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: theme.bodySize, color: theme.muted }}>{block.label}</Text>
            <Text style={{ fontSize: theme.bodySize + 1, fontWeight: 700 }}>{formatMoney(block.value)}</Text>
          </View>
          {ext ? <Text style={{ fontSize: theme.bodySize - 1, fontStyle: 'italic', marginTop: 2 }}>{ext}</Text> : null}
        </View>
      );
    }

    case 'signatures': {
      const n = block.columns.length;
      const width = n === 1 ? '50%' : n === 2 ? '50%' : '33.33%';
      return (
        <View key={key} wrap={false} style={{ marginTop: 10, marginBottom: theme.gap + 4 }}>
          {block.placeDate ? (
            <Text style={{ fontSize: theme.bodySize, marginBottom: 14 }}>{block.placeDate}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: n === 1 ? 'flex-start' : 'space-between' }}>
            {block.columns.map((c, i) => (
              <SignatureColumnView key={i} col={c} env={env} width={width} />
            ))}
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
            borderTopWidth: 0.6,
            borderTopColor: theme.rule,
            borderStyle: 'dashed',
            paddingTop: 8,
          }}
        >
          <Text style={{ fontSize: theme.bodySize - 1 }}>{block.text ?? 'Recebi o original em ___/___/______'}</Text>
          <Text style={{ fontSize: theme.bodySize - 1, marginTop: 14 }}>
            {`${block.signer ?? 'O Trabalhador'}: ________________________________________`}
          </Text>
        </View>
      );

    case 'annexList':
      if (!block.items.length) return null;
      return (
        <View key={key} wrap={false} style={{ marginTop: 6, marginBottom: theme.gap }}>
          <Text style={{ fontSize: theme.bodySize - 1, fontWeight: 700, marginBottom: 2 }}>{block.title ?? 'Anexos:'}</Text>
          {block.items.map((it, i) => (
            <Text key={i} style={{ fontSize: theme.bodySize - 1, lineHeight: 1.35 }}>
              {`${i + 1}. ${oneLine(it)}`}
            </Text>
          ))}
        </View>
      );

    case 'list':
      return (
        <View key={key} style={{ marginBottom: theme.gap }}>
          {block.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }} wrap={!canKeep(theme, textLines(theme, it, 0.92) * theme.bodySize * theme.lineHeight)}>
              <Text style={{ width: 18, fontSize: theme.bodySize }}>
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
        <View key={key} style={{ marginBottom: theme.gap }}>
          {block.items.map((it, i) => (
            <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
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
                {it.checked ? <Text style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}>X</Text> : null}
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
      return b.items.length * 16;
    case 'numberedClauses':
      return b.items.reduce((h, it) => h + 32 + lines(it.text) * lineH + (it.items ?? []).reduce((x, sub) => x + lines(sub, 0.9) * lineH, 0), 0);
    case 'amount':
      return 50;
    case 'signatures':
      return 130;
    case 'acknowledgement':
      return 60;
    case 'spacer':
      return 20;
    default:
      return 20;
  }
}

/**
 * Renders blocks, grouping each run of `keepWithNext` blocks with the block
 * that follows into an unbreakable unit (e.g. closing paragraph + signatures).
 * A group is only made unbreakable when it comfortably fits on a page:
 * react-pdf overlaps lines when an unbreakable unit is taller than the page.
 */
export function renderBlocks(blocks: Block[], env: BlockEnv): ReactNode[] {
  const out: ReactNode[] = [];
  let group: Block[] = [];
  const pageBody = 297 * 2.8346 - env.theme.margin.top - env.theme.margin.bottom - 60;
  blocks.forEach((b, i) => {
    group.push(b);
    const next = blocks[i + 1];
    const autoKeep = b.type === 'heading' || b.type === 'subject';
    if ((b.keepWithNext || autoKeep) && next) return;
    if (group.length === 1) {
      out.push(renderBlock(b, i, env));
    } else {
      const height = group.reduce((h, g) => h + estimateHeight(g, env.theme), 0);
      if (height <= pageBody * 0.6) {
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
