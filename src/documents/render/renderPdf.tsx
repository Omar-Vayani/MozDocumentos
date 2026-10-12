// Entry point of the PDF engine. Runs in the PDF web worker (and in tests).

import { pdf } from '@react-pdf/renderer';
import { buildBlocks, buildContext } from '../context';
import { loadTemplate } from '../registry';
import { DocumentPdf } from './DocumentPdf';
import { registerFontGeneration } from './fonts';
import type { RenderInput, RenderResult } from './types';

export async function renderPdf(input: RenderInput): Promise<RenderResult> {
  const families = registerFontGeneration(input.fontBase);
  const template = await loadTemplate(input.templateId);
  const ctx = buildContext(template, input.values, input.profile, input.legalOverrides, input.today);
  const blocks = buildBlocks(template, ctx, input.overrides);
  const ref = typeof input.values.ref === 'string' ? input.values.ref : undefined;
  const doc = <DocumentPdf input={input} template={template} blocks={blocks} refNumber={ref} families={families} />;
  const blob = await pdf(doc).toBlob();
  return { pdf: await blob.arrayBuffer(), title: template.formalTitle };
}
