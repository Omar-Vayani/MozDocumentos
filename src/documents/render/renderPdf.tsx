// Entry point of the PDF engine. Runs in the PDF web worker (and in tests).

import { Document, pdf } from '@react-pdf/renderer';
import { buildBlocks, buildContext } from '../context';
import { loadTemplate } from '../registry';
import { DocumentPdf, pdfMetadata } from './DocumentPdf';
import { registerFontGeneration } from './fonts';
import { FORMATS } from './theme';
import { pageOf } from '../model';
import type { RenderInput, RenderResult } from './types';

/**
 * Characters the embedded fonts cannot draw (control characters, zero-width
 * marks, typographic spaces) are cleaned from everything the user typed or
 * pasted, and from the built text: some crash the PDF engine.
 */
const cleanString = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\r\u200B-\u200D\u2060\uFEFF]/g, '').replace(/[\u2000-\u200A\u202F\u205F]/g, (c) => (c === '\u202F' ? '\u00A0' : ' '));

export function cleanText<T>(v: T): T {
  if (typeof v === 'string') return cleanString(v) as T;
  if (Array.isArray(v)) return v.map(cleanText) as T;
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanText(x)])) as T;
  }
  return v;
}

/** Values and profile with unprintable characters removed (assets are left as they are). */
function cleanInput(input: RenderInput): RenderInput {
  return { ...input, values: cleanText(input.values), profile: input.profile ? cleanText(input.profile) : input.profile, overrides: cleanText(input.overrides) };
}

export async function renderPdf(raw: RenderInput): Promise<RenderResult> {
  const input = cleanInput(raw);
  const families = registerFontGeneration(input.fontBase);
  const template = await loadTemplate(input.templateId);
  const ctx = buildContext(template, input.values, input.profile, input.legalOverrides, input.today);
  const blocks = cleanText(buildBlocks(template, ctx, input.overrides));
  const ref = typeof input.values.ref === 'string' ? input.values.ref : undefined;
  // One page per item (e.g. a certificate for each participant).
  const variants = template.repeat?.(input.values);
  if (variants && variants.length > 1) {
    const variantBlocks = variants.map((vals) => {
      const vctx = buildContext(template, { ...input.values, ...cleanText(vals) }, input.profile, input.legalOverrides, input.today);
      return cleanText(buildBlocks(template, vctx, input.overrides));
    });
    // Small formats printed on A4 sheets: each item takes one cell.
    const format = pageOf(template, input.values);
    const pres = (input.values.__presentation ?? {}) as { imposed?: boolean };
    if (FORMATS[format].sheet && (pres.imposed ?? (format === 'A6' || format === 'cartao'))) {
      const doc = <DocumentPdf input={input} template={template} blocks={blocks} refNumber={ref} families={families} variants={variantBlocks} />;
      return { pdf: await (await pdf(doc).toBlob()).arrayBuffer(), title: template.formalTitle };
    }
    const pages = variants.map((vals, i) => {
      const vin = { ...input, values: { ...input.values, ...vals } };
      return <DocumentPdf key={i} input={vin} template={template} blocks={variantBlocks[i]} refNumber={ref} families={families} pageOnly />;
    });
    const many = <Document {...pdfMetadata(template.formalTitle, input.profile?.firma || input.profile?.nome, ref, undefined, template.category)}>{pages}</Document>;
    const blob = await pdf(many).toBlob();
    return { pdf: await blob.arrayBuffer(), title: template.formalTitle };
  }
  const once = async (inp: RenderInput) => {
    const doc = <DocumentPdf input={inp} template={template} blocks={blocks} refNumber={ref} families={families} />;
    return (await pdf(doc).toBlob()).arrayBuffer();
  };
  const first = await once(input);
  // Fit to one page: a short document that just spills onto a second page is
  // re-rendered with slightly tighter spacing, kept only if it then fits.
  const pres = (input.values.__presentation ?? {}) as { fit?: number };
  const fittable = template.family !== 'contrato' && template.family !== 'peca' && !template.repeat && pres.fit == null;
  if (fittable && countPages(first) === 2) {
    for (const fit of [1, 2]) {
      const tight = await once({ ...input, values: { ...input.values, __presentation: { ...pres, fit } } });
      if (countPages(tight) === 1) return { pdf: tight, title: template.formalTitle };
    }
  }
  return { pdf: first, title: template.formalTitle };
}

/** Number of pages in a PDF produced by react-pdf (counts page objects). */
export function countPages(pdfBytes: ArrayBuffer): number {
  const text = new TextDecoder('latin1').decode(new Uint8Array(pdfBytes));
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

/** Several documents (e.g. a month of payslips) in one PDF, each starting on a new page. */
export async function renderBatchPdf(inputs: RenderInput[], title: string): Promise<RenderResult> {
  if (!inputs.length) throw new Error('empty batch');
  const families = registerFontGeneration(inputs[0].fontBase);
  const pages = [];
  for (const [i, raw] of inputs.entries()) {
    const input = cleanInput(raw);
    const template = await loadTemplate(input.templateId);
    const ctx = buildContext(template, input.values, input.profile, input.legalOverrides, input.today);
    const blocks = cleanText(buildBlocks(template, ctx, input.overrides));
    const ref = typeof input.values.ref === 'string' ? input.values.ref : undefined;
    pages.push(<DocumentPdf key={i} input={input} template={template} blocks={blocks} refNumber={ref} families={families} pageOnly />);
  }
  const doc = (
    <Document {...pdfMetadata(title, inputs[0].profile?.firma || inputs[0].profile?.nome, undefined, undefined)}>
      {pages}
    </Document>
  );
  const blob = await pdf(doc).toBlob();
  return { pdf: await blob.arrayBuffer(), title };
}
