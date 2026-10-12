import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { profileDisplayName, type Presentation } from '@/lib/storage/types';
import { renderBlocks, type BlockEnv } from '../blocks';
import { estimateLines, FaixaBand, footerLines, Letterhead, type LetterheadEnv } from '../layouts';
import type { Block } from '../model';
import type { FullTemplate } from '../registry';
import type { FontFamilies } from './fonts';
import { A4, MM, makeTheme } from './theme';
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
  const theme = makeTheme(branding, families, presentation);
  const isCompany = profile?.kind === 'empresa';
  const showLetterhead = isCompany && template.letterhead !== false;
  const layout = branding?.layout ?? 'classico';
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
  };

  // Footer: fixed on every page; its height is reserved in the bottom padding.
  const fLines = showLetterhead ? footerLines(profile, layout) : [];
  const footerImg = showLetterhead ? asset(branding?.footerAssetId) : undefined;
  const footerImgH = footerImg ? Math.min((A4.width * footerImg.height) / Math.max(1, footerImg.width), 30 * MM) : 0;
  const pageNumbers = !pageOnly && (branding?.pageNumbers ?? true);
  const lineCount = fLines.reduce((n, l) => n + Math.min(2, estimateLines(l, theme.contentWidth - (pageNumbers ? 95 : 5))), 0);
  const footerTextH = lineCount * 10 + (pageNumbers || lineCount ? 10 : 0);
  const footerBottom = footerImgH + 8 * MM;
  const paddingBottom = Math.max(theme.margin.bottom, footerBottom + footerTextH + 5 * MM);

  const watermark = showLetterhead ? asset(branding?.watermarkAssetId) : undefined;
  const wmBox = { w: A4.width - 50 * MM, h: A4.height - 80 * MM };
  let wmW = wmBox.w;
  let wmH = watermark ? (wmW * watermark.height) / Math.max(1, watermark.width) : 0;
  if (wmH > wmBox.h) {
    wmH = wmBox.h;
    wmW = watermark ? (wmH * watermark.width) / Math.max(1, watermark.height) : 0;
  }

  // Diagonal text such as CÓPIA or CONFIDENCIAL, sized to fit across the page.
  const wmText = (presentation.watermarkText ?? '').trim().toLocaleUpperCase('pt').slice(0, 24);
  const wmTextSize = wmText ? Math.min(96, (A4.width * 0.78) / (wmText.length * 0.62)) : 0;

  const runningLeft = [refNumber ? `N/Ref.ª ${refNumber}` : '', showLetterhead ? profileDisplayName(profile) : '']
    .filter(Boolean)
    .join(' · ');

  const page = (
      <Page
        size="A4"
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
            style={{ position: 'absolute', top: 0, left: 0, width: A4.width, height: A4.height }}
            render={({ pageNumber }) =>
              branding?.watermarkFirstPageOnly && pageNumber > 1 ? null : (
                <View style={{ width: A4.width, height: A4.height, alignItems: 'center', justifyContent: 'center' }}>
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
            style={{ position: 'absolute', top: 0, left: 0, width: A4.width, height: A4.height, alignItems: 'center', justifyContent: 'center' }}
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

        {branding?.pageBorder ? (
          <View
            fixed
            style={{
              position: 'absolute',
              top: 6 * MM,
              left: 6 * MM,
              width: A4.width - 12 * MM,
              height: A4.height - 12 * MM,
              borderWidth: 0.6,
              borderColor: theme.accent,
            }}
          />
        ) : null}

        {lhEnv && layout === 'faixa' ? (
          <View
            fixed
            style={{ position: 'absolute', top: 0, left: 0, width: A4.width }}
            render={({ pageNumber }) => (pageNumber === 1 ? <FaixaBand env={lhEnv} /> : null)}
          />
        ) : null}

        {/* Running header on pages 2+ (sits inside the top margin). */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: Math.max(8 * MM, theme.margin.top - 12 * MM),
            left: theme.margin.left,
            right: theme.margin.right,
          }}
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderBottomWidth: 0.5,
                  borderBottomColor: theme.rule,
                  paddingBottom: 2,
                }}
              >
                <Text style={{ fontSize: 7.5, color: theme.muted, maxWidth: '62%', maxLines: 1, textOverflow: 'ellipsis' }}>
                  {runningLeft}
                </Text>
                <Text style={{ fontSize: 7.5, color: theme.muted, maxWidth: '36%', textAlign: 'right', maxLines: 1, textOverflow: 'ellipsis' }}>
                  {template.formalTitle}
                </Text>
              </View>
            ) : null
          }
        />

        {lhEnv ? <Letterhead env={lhEnv} layout={layout} /> : null}

        {renderBlocks(blocks, blockEnv)}

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
            top: A4.height - footerBottom - footerTextH,
            height: footerTextH,
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
              top: A4.height - footerBottom - 10,
              right: theme.margin.right,
              width: 80,
              fontSize: 7.5,
              color: theme.muted,
              textAlign: 'right',
            }}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        ) : null}

        {footerImg ? (
          <Image
            fixed
            src={footerImg.dataUrl}
            style={{ position: 'absolute', top: A4.height - footerImgH, left: 0, width: A4.width, height: footerImgH, objectFit: 'cover' }}
          />
        ) : null}
      </Page>
  );
  if (pageOnly) return page;
  return (
    <Document
      title={template.formalTitle}
      author={profileDisplayName(profile) || undefined}
      creator="Documentos MZ — Omar Vayani"
      producer="Documentos MZ"
      language="pt-MZ"
    >
      {page}
    </Document>
  );
}
