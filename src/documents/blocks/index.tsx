// react-pdf renderers for every block type. Each block declares its page-break
// behaviour: rows, signatures and acknowledgements never split; headings stay
// with the text that follows; header rows repeat on every page of a table.

import { Image, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { ReactNode } from 'react';
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
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              lineHeight: 1.25,
            }}
          >
            {block.text}
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
      return (
        <View key={key} style={{ marginBottom: theme.gap }}>
          {block.items.map((item, i) => (
            <View key={item.id} style={{ marginBottom: theme.gap + 1 }}>
              {block.style === 'numeric' ? (
                <View minPresenceAhead={36}>
                  <Text style={{ ...para(env), fontWeight: 700, marginBottom: 2 }}>{clauseHeading('numeric', i, item)}</Text>
                </View>
              ) : (
                <View minPresenceAhead={40} style={{ marginBottom: 3 }}>
                  <Text style={{ fontSize: theme.bodySize, fontWeight: 700, textAlign: 'center' }}>
                    {clauseHeading(block.style, i, item)}
                  </Text>
                  {item.heading ? (
                    <Text style={{ fontSize: theme.bodySize, textAlign: 'center' }}>({item.heading})</Text>
                  ) : null}
                </View>
              )}
              {item.text ? <RichText text={item.text} style={para(env)} /> : null}
              {item.items?.map((sub, j) => (
                <View key={j} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 12 }}>
                  <Text style={{ width: 16, fontSize: theme.bodySize }}>{ALPHA[j]})</Text>
                  <View style={{ flex: 1 }}>
                    <RichText text={sub} style={para(env)} />
                  </View>
                </View>
              ))}
              <Translation text={item.en} env={env} />
            </View>
          ))}
        </View>
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
              wrap={false}
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
      return (
        <View key={key} style={{ marginBottom: theme.gap + 2 }}>
          {block.title ? (
            <Text
              style={{
                fontSize: theme.smallSize + 1,
                fontWeight: 700,
                color: theme.accent,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottomWidth: 0.75,
                borderBottomColor: theme.accent,
                paddingBottom: 2,
                marginBottom: 3,
              }}
              minPresenceAhead={40}
            >
              {block.title}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {block.items.map((it, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  width: cols === 2 ? '50%' : '100%',
                  flexDirection: 'row',
                  paddingVertical: 2,
                  paddingRight: cols === 2 ? 8 : 0,
                  borderBottomWidth: 0.3,
                  borderBottomColor: '#e1e4e8',
                }}
              >
                <Text style={{ width: cols === 2 ? '45%' : '35%', fontSize: theme.bodySize - 1.5, color: theme.muted, paddingRight: 6 }}>
                  {it.label}
                </Text>
                <Text style={{ flex: 1, fontSize: theme.bodySize - 1 }}>{oneLine(it.value) || '—'}</Text>
              </View>
            ))}
          </View>
        </View>
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
            <View key={i} style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 8 }} wrap={false}>
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

/**
 * Renders blocks, grouping each run of `keepWithNext` blocks with the block
 * that follows into an unbreakable unit (e.g. closing paragraph + signatures).
 */
export function renderBlocks(blocks: Block[], env: BlockEnv): ReactNode[] {
  const out: ReactNode[] = [];
  let group: Block[] = [];
  blocks.forEach((b, i) => {
    group.push(b);
    if (b.keepWithNext && i < blocks.length - 1) return;
    if (group.length === 1) {
      out.push(renderBlock(b, i, env));
    } else {
      out.push(
        <View key={`g${i}`} wrap={false}>
          {group.map((g, j) => renderBlock(g, `${i}-${j}`, env))}
        </View>,
      );
    }
    group = [];
  });
  return out;
}
