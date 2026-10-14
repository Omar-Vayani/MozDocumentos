import { Document, Image, Link, Page, Text, View } from '@react-pdf/renderer';
import { OWNER } from '@/app/owner';
import { isPublicBody, professionalRegistration, profileDisplayName, type Presentation } from '@/lib/storage/types';
import { renderBlocks, type BlockEnv } from '../blocks';
import { estimateLines, FaixaBand, footerLines, Letterhead, ProfessionalHeader, RepublicaHeader, type LetterheadEnv } from '../layouts';
import type { Block } from '../model';
import type { FullTemplate } from '../registry';
import type { FontFamilies } from './fonts';
import { documentId } from './docId';
import { FORMATS, isSmallFormat, MM, makeTheme } from './theme';
import type { RenderInput } from './types';

type Props = {
  input: RenderInput;
  template: FullTemplate;
  blocks: Block[];
  refNumber?: string;
  families?: FontFamilies;
  /** Return only the <Page> (for combining several documents in one PDF). */
  pageOnly?: boolean;
};

export function DocumentPdf({ input, template, blocks, refNumber, families, pageOnly }: Props) {
  const { profile, assets } = input;
  const branding = profile?.branding;
  const presentation = (input.values.__presentation ?? {}) as Presentation;
  const publicBody = isPublicBody(profile);
  // Filed with a court, registry, notary or public body: no third-party marks, no decoration.
  const officialUse = typeof template.official === 'function' ? template.official(input.values) : template.official;
  const official = Boolean(officialUse);
  const family = template.family ?? 'carta';
  const format = template.page ?? 'A4';
  const fmt = FORMATS[format];
  const small = isSmallFormat(format);
  // Small formats print several per A4 sheet with cutting marks unless the user asks for their own size.
  const imposed = !pageOnly && Boolean(fmt.sheet) && (presentation.imposed ?? (format === 'A6' || format === 'cartao'));
  const tStyle = typeof template.style === 'function' ? template.style(input.values) : template.style;
  const frame = typeof template.frame === 'function' ? template.frame(input.values) : template.frame;
  const styledBranding = branding && tStyle?.font ? { ...branding, font: tStyle.font } : branding;
  const baseTheme = makeTheme(styledBranding, families, presentation, { family, plain: official || publicBody, format });
  // Black-and-grey documents (funeral notices) ignore the profile colour.
  const theme = tStyle?.mono ? { ...baseTheme, accent: '#222222', accentTint: '#ececec', heading: '#111111', wash: '#f3f3f3' } : baseTheme;
  const PW = theme.page.width;
  const PH = theme.page.height;
  const isCompany = profile?.kind === 'empresa';
  // An individual registered with a professional order (doctor, lawyer…) gets a compact professional header.
  const professional = profile?.kind === 'pessoa' && Boolean(professionalRegistration(profile));
  const showLetterhead = (isCompany || professional) && template.letterhead !== false;
  // A5 and smaller use the compact letterhead (logo and name; details move to the footer).
  const layout = format === 'A5' || format === 'A5-paisagem' ? 'minimo' : (branding?.layout ?? 'classico');
  // The small Documents MZ line is left off official documents and anything a public body issues.
  const brandLine = !official && !publicBody && !template.noBrand && !small;
  const docId = documentId(template.id, input.values, profile?.id);
  const rubricas = !small && (presentation.rubricas ?? template.rubricas ?? family === 'contrato');
  const asset = (id?: string) => (id ? assets[id] : undefined);

  const lhEnv: LetterheadEnv | null =
    showLetterhead && profile
      ? { theme, profile, logo: asset(branding?.logoAssetId), header: asset(branding?.headerAssetId) }
      : null;

  const blockEnv: BlockEnv = {
    theme,
    bilingual: input.bilingual,
    signature: presentation.showSignature === false ? undefined : asset(branding?.signatureAssetId),
    stamp: presentation.showStamp === false ? undefined : asset(branding?.stampAssetId),
    logo: asset(branding?.logoAssetId),
  };

  // Footer: fixed on every page; its height is reserved in the bottom padding.
  const fLines = showLetterhead && !small && !professional ? footerLines(profile, layout) : [];
  const footerImg = showLetterhead && !official && !small ? asset(branding?.footerAssetId) : undefined;
  const footerImgH = footerImg ? Math.min((PW * footerImg.height) / Math.max(1, footerImg.width), 30 * MM) : 0;
  // Certificates and other framed or centred single pages carry no page numbers.
  const pageNumbers = !pageOnly && !small && !imposed && !frame && template.verticalAlign !== 'center' && (branding?.pageNumbers ?? true);
  const lineCount = fLines.reduce((n, l) => n + Math.min(2, estimateLines(l, theme.contentWidth - (pageNumbers ? 95 : 5))), 0);
  const footerTextH = lineCount * 10 + (pageNumbers || lineCount ? 10 : 0);
  const footerBottom = footerImgH + (small ? 3 : 8) * MM;
  const rubricasH = rubricas ? 16 : 0;
  const paddingBottom = small ? theme.margin.bottom : Math.max(theme.margin.bottom, footerBottom + footerTextH + rubricasH + 5 * MM);

  const watermark = showLetterhead && !official && !small ? asset(branding?.watermarkAssetId) : undefined;
  const wmBox = { w: PW - 50 * MM, h: PH - 80 * MM };
  let wmW = wmBox.w;
  let wmH = watermark ? (wmW * watermark.height) / Math.max(1, watermark.width) : 0;
  if (wmH > wmBox.h) {
    wmH = wmBox.h;
    wmW = watermark ? (wmH * watermark.width) / Math.max(1, watermark.height) : 0;
  }

  // Diagonal text such as CÓPIA or CONFIDENCIAL, sized to fit across the page.
  const wmText = (presentation.watermarkText ?? '').trim().toLocaleUpperCase('pt').slice(0, 24);
  const wmTextSize = wmText ? Math.min(96, (PW * 0.78) / (wmText.length * 0.62)) : 0;

  const runningLeft = [refNumber ? `N/Ref.ª ${refNumber}` : '', showLetterhead ? profileDisplayName(profile) : '']
    .filter(Boolean)
    .join(' · ');

  const page = (
      <Page
        size={[PW, PH]}
        style={{
          fontFamily: theme.font,
          fontSize: theme.bodySize,
          color: theme.text,
          lineHeight: theme.lineHeight,
          paddingTop: theme.margin.top,
          paddingLeft: theme.margin.left,
          paddingRight: theme.margin.right,
          paddingBottom,
        }}
      >
        {watermark ? (
          <View
            fixed
            style={{ position: 'absolute', top: 0, left: 0, width: PW, height: PH }}
            render={({ pageNumber }) =>
              branding?.watermarkFirstPageOnly && pageNumber > 1 ? null : (
                <View style={{ width: PW, height: PH, alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    src={watermark.dataUrl}
                    style={{ width: wmW, height: wmH, opacity: branding?.watermarkOpacity ?? 0.06 }}
                  />
                </View>
              )
            }
          />
        ) : null}

        {wmText ? (
          <View
            fixed
            style={{ position: 'absolute', top: 0, left: 0, width: PW, height: PH, alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >
            <Text
              style={{
                fontSize: wmTextSize,
                fontWeight: 700,
                color: theme.accent,
                opacity: 0.09,
                transform: 'rotate(-32deg)',
              }}
            >
              {wmText}
            </Text>
          </View>
        ) : null}

        {frame ? <Frame kind={frame} w={PW} h={PH} inset={Math.max(4, fmt.margin * 0.45) * MM} accent={theme.plain ? theme.text : theme.accent} /> : null}

        {branding?.pageBorder && !official && !frame ? (
          <View
            fixed
            style={{
              position: 'absolute',
              top: 6 * MM,
              left: 6 * MM,
              width: PW - 12 * MM,
              height: PH - 12 * MM,
              borderWidth: 0.6,
              borderColor: theme.accent,
            }}
          />
        ) : null}

        {lhEnv && layout === 'faixa' && !publicBody ? (
          <View
            fixed
            style={{ position: 'absolute', top: 0, left: 0, width: PW }}
            render={({ pageNumber }) => (pageNumber === 1 ? <FaixaBand env={lhEnv} /> : null)}
          />
        ) : null}

        {/* Running header on pages 2+ (sits inside the top margin). */}
        <View
          fixed
          style={{
            position: 'absolute',
            lineHeight: 1.2,
            top: Math.max(8 * MM, theme.margin.top - 12 * MM),
            left: theme.margin.left,
            right: theme.margin.right,
          }}
          render={({ pageNumber }) =>
            // Not on repeated single-page documents (certificates) or designed pages.
            pageNumber > 1 && !small && !pageOnly && !frame && template.verticalAlign !== 'center' ? (
              <View
                style={{
                  // Fixed elements must not inherit the page line height: react-pdf
                  // compounds it on every page until the box size overflows.
                  lineHeight: 1.2,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderBottomWidth: 0.5,
                  borderBottomColor: theme.rule,
                  paddingBottom: 2,
                }}
              >
                <Text style={{ fontSize: 7.5, color: theme.muted, width: '60%', maxLines: 1, textOverflow: 'ellipsis' }}>
                  {runningLeft}
                </Text>
                <Text style={{ fontSize: 7.5, color: theme.muted, width: '38%', textAlign: 'right', maxLines: 1, textOverflow: 'ellipsis' }}>
                  {template.formalTitle}
                </Text>
              </View>
            ) : null
          }
        />

        {lhEnv ? publicBody ? <RepublicaHeader env={lhEnv} /> : professional ? <ProfessionalHeader env={lhEnv} /> : <Letterhead env={lhEnv} layout={layout} /> : null}

        {template.verticalAlign === 'center' ? (
          <View style={{ flexGrow: 1, justifyContent: 'center' }}>{renderBlocks(blocks, blockEnv)}</View>
        ) : (
          renderBlocks(blocks, blockEnv)
        )}

        {input.bilingual ? (
          <Text style={{ fontSize: 7.5, color: theme.muted, marginTop: 8, fontStyle: 'italic' }}>
            Tradução para referência; prevalece a versão em português. / Translation for reference only; the
            Portuguese version prevails.
          </Text>
        ) : null}

        {/* Footer */}
        <View
          fixed
          style={{
            // Positioned from the top: react-pdf misplaces bottom-anchored fixed
            // elements on later pages of long documents.
            position: 'absolute',
            top: PH - footerBottom - footerTextH,
            height: footerTextH,
            lineHeight: 1.35,
            left: theme.margin.left,
            right: theme.margin.right,
            borderTopWidth: fLines.length ? 0.5 : 0,
            borderTopColor: theme.rule,
            paddingTop: fLines.length ? 3 : 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View style={{ flex: 1, paddingRight: pageNumbers ? 90 : 0 }}>
            {fLines.map((l, i) => (
              <Text key={i} style={{ fontSize: 7, color: theme.muted, lineHeight: 1.35, maxLines: 2, textOverflow: 'ellipsis' }}>
                {l}
              </Text>
            ))}
          </View>
        </View>

        {pageNumbers ? (
          <Text
            fixed
            style={{
              position: 'absolute',
              top: PH - footerBottom - 10,
              right: theme.margin.right,
              width: 80,
              lineHeight: 1.2,
              fontSize: 7.5,
              color: theme.muted,
              textAlign: 'right',
            }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        ) : null}

        {/* Initials line on every page but the last, where the parties sign in full. */}
        {rubricas ? (
          <Text
            fixed
            style={{
              position: 'absolute',
              top: PH - footerBottom - footerTextH - rubricasH,
              right: theme.margin.right,
              lineHeight: 1.2,
              fontSize: 7.5,
              color: theme.muted,
              textAlign: 'right',
            }}
            render={({ pageNumber, totalPages }) => (pageNumber < totalPages ? 'Rubricas: ____________   ____________' : '')}
          />
        ) : null}

        {brandLine ? (
          <View
            fixed
            style={{
              position: 'absolute',
              top: PH - footerImgH - 5.6 * MM,
              lineHeight: 1.2,
              left: theme.margin.left,
              right: theme.margin.right,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* The app's tricolour mark: a long green rule, then yellow and red. */}
              <View style={{ width: 14, height: 1.3, backgroundColor: '#0b5a40' }} />
              <View style={{ width: 4, height: 1.3, backgroundColor: '#f2b81c', marginLeft: 1.5 }} />
              <View style={{ width: 4, height: 1.3, backgroundColor: '#c8102e' }} />
              {OWNER.website ? (
                <Link src={`https://${OWNER.website}`} style={{ fontSize: 5.6, color: '#8a9089', marginLeft: 4, textDecoration: 'none' }}>
                  {`${OWNER.product} · ${OWNER.website}`}
                </Link>
              ) : (
                <Text style={{ fontSize: 5.6, color: '#8a9089', marginLeft: 4 }}>{OWNER.product}</Text>
              )}
            </View>
            <Text style={{ fontSize: 5.6, color: '#8a9089' }}>{docId}</Text>
          </View>
        ) : null}

        {footerImg ? (
          <Image
            fixed
            src={footerImg.dataUrl}
            style={{ position: 'absolute', top: PH - footerImgH, left: 0, width: PW, height: footerImgH, objectFit: 'cover' }}
          />
        ) : null}
      </Page>
  );
  if (imposed && fmt.sheet) {
    // Several copies on one A4 sheet, with cutting marks (or cut lines where there is no margin).
    const { cols, rows, landscape } = fmt.sheet;
    const SW = (landscape ? 297 : 210) * MM;
    const SH = (landscape ? 210 : 297) * MM;
    const ox = (SW - cols * PW) / 2;
    const oy = (SH - rows * PH) / 2;
    const cell = (i: number) => (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: ox + (i % cols) * PW,
          top: oy + Math.floor(i / cols) * PH,
          width: PW,
          height: PH,
          paddingTop: theme.margin.top,
          paddingBottom: theme.margin.bottom,
          paddingLeft: theme.margin.left,
          paddingRight: theme.margin.right,
          overflow: 'hidden',
          justifyContent: template.verticalAlign === 'center' ? 'center' : 'flex-start',
        }}
      >
        {frame ? <Frame kind={frame} w={PW} h={PH} inset={Math.max(3, fmt.margin * 0.45) * MM} accent={theme.plain ? theme.text : theme.accent} /> : null}
        {lhEnv ? publicBody ? <RepublicaHeader env={lhEnv} /> : professional ? <ProfessionalHeader env={lhEnv} /> : <Letterhead env={lhEnv} layout={layout === 'faixa' ? 'minimo' : layout} /> : null}
        {renderBlocks(blocks, blockEnv)}
      </View>
    );
    const marks: { x: number; y: number; w: number; h: number }[] = [];
    const m = 2 * MM; // gap between the cut and the mark
    const len = 4 * MM;
    const roomX = ox >= m + len;
    const roomY = oy >= m + len;
    for (let c = 0; c <= cols; c++) {
      const x = ox + c * PW;
      if (roomY) marks.push({ x, y: oy - m - len, w: 0.3, h: len }, { x, y: oy + rows * PH + m, w: 0.3, h: len });
      else if (c > 0 && c < cols) marks.push({ x, y: oy, w: 0.25, h: rows * PH });
    }
    for (let r = 0; r <= rows; r++) {
      const y = oy + r * PH;
      if (roomX) marks.push({ x: ox - m - len, y, w: len, h: 0.3 }, { x: ox + cols * PW + m, y, w: len, h: 0.3 });
      else if (r > 0 && r < rows) marks.push({ x: ox, y, w: cols * PW, h: 0.25 });
    }
    const sheet = (
      <Page size={[SW, SH]} style={{ fontFamily: theme.font, fontSize: theme.bodySize, color: theme.text, lineHeight: theme.lineHeight }}>
        {Array.from({ length: cols * rows }, (_, i) => cell(i))}
        {marks.map((k, i) => (
          <View key={`m${i}`} style={{ position: 'absolute', left: k.x, top: k.y, width: k.w, height: k.h, backgroundColor: '#9aa0a6' }} />
        ))}
        {!official && !publicBody && !template.noBrand && oy > 7 * MM ? (
          <Text style={{ position: 'absolute', left: ox, top: SH - oy / 2 - 3, fontSize: 5.6, color: '#8a9089', lineHeight: 1.2 }}>
            {`${OWNER.product}${OWNER.website ? ` · ${OWNER.website}` : ''} · ${docId}`}
          </Text>
        ) : null}
      </Page>
    );
    return <Document {...pdfMetadata(template.formalTitle, profileDisplayName(profile), refNumber, docId, template.category)}>{sheet}</Document>;
  }

  if (pageOnly) return page;
  return (
    <Document {...pdfMetadata(template.formalTitle, profileDisplayName(profile), refNumber, docId, template.category)}>
      {page}
    </Document>
  );
}

/** PDF document properties: who made it, with what, and its document ID. */
export function pdfMetadata(title: string, author: string | undefined, ref: string | undefined, docId: string | undefined, category?: string) {
  const site = OWNER.website ? ` (${OWNER.website})` : '';
  return {
    title,
    author: author || undefined,
    subject: [title, ref ? `Ref. ${ref}` : '', docId].filter(Boolean).join(' — '),
    keywords: ['Documentos MZ', 'Moçambique', category, docId].filter(Boolean).join(', '),
    creator: `${OWNER.product}${site} — © ${OWNER.name}`,
    producer: `${OWNER.product} ${OWNER.version}`,
    language: 'pt-MZ',
  };
}

/** Decorative page frame for certificates and invitations. */
function Frame({ kind, w, h, inset, accent }: { kind: 'simple' | 'double' | 'tricolour'; w: number; h: number; inset: number; accent: string }) {
  const box = (d: number, width: number, color: string) => (
    <View style={{ position: 'absolute', top: inset + d, left: inset + d, width: w - 2 * (inset + d), height: h - 2 * (inset + d), borderWidth: width, borderColor: color }} />
  );
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      {box(0, kind === 'double' ? 1.4 : 0.8, accent)}
      {kind === 'double' ? box(3.2, 0.5, accent) : null}
      {kind === 'tricolour' ? (
        <View style={{ position: 'absolute', left: w / 2 - 22, top: h - inset - 1.2, flexDirection: 'row' }}>
          <View style={{ width: 28, height: 2.4, backgroundColor: '#0b5a40' }} />
          <View style={{ width: 8, height: 2.4, backgroundColor: '#f2b81c', marginLeft: 2 }} />
          <View style={{ width: 8, height: 2.4, backgroundColor: '#c8102e' }} />
        </View>
      ) : null}
    </View>
  );
}
