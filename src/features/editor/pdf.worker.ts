/// <reference lib="webworker" />
// Renders documents off the main thread so typing stays smooth on low-end phones.

import './worker-shim';
import type { RenderInput } from '@/documents/render/types';

type Req = { id: number; input: RenderInput };

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, input } = e.data;
  try {
    // Loaded after the shim so dev-time React Refresh code finds `window`.
    const { renderPdf } = await import('@/documents/render/renderPdf');
    const res = await renderPdf(input);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, pdf: res.pdf, title: res.title }, [res.pdf]);
  } catch (err) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
