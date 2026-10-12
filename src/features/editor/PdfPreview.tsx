// Renders the generated PDF with pdf.js onto canvases: the preview is the
// same file that is downloaded and printed.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/ui/Button';
import { Spinner } from '@/ui/misc';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).href;
      return lib;
    })();
  }
  return pdfjsPromise;
}

export function PdfPreview({ pdf, busy, error }: { pdf: ArrayBuffer | null; busy: boolean; error?: string | null }) {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !pagesRef.current || width === 0) return;
    let cancelled = false;
    const container = pagesRef.current;
    (async () => {
      const lib = await loadPdfJs();
      const doc = await lib.getDocument({ data: new Uint8Array(pdf.slice(0)) }).promise;
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const target = Math.max(240, width - 24) * zoom;
      const canvases: HTMLCanvasElement[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = target / base.width;
        const vp = page.getViewport({ scale: scale * dpr });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
        canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
        canvas.className = 'block mx-auto bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', t('editor.page', { n: i, total: doc.numPages }));
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
        if (cancelled) return;
        canvases.push(canvas);
      }
      if (cancelled) return;
      // Swap all pages at once to avoid flicker while typing.
      container.replaceChildren(
        ...canvases.map((c, idx) => {
          const fig = document.createElement('div');
          fig.className = 'mb-4';
          fig.appendChild(c);
          const cap = document.createElement('p');
          cap.className = 'text-center text-[0.8rem] text-muted mt-1';
          cap.textContent = t('editor.page', { n: idx + 1, total: canvases.length });
          fig.appendChild(cap);
          return fig;
        }),
      );
      setNumPages(doc.numPages);
      void doc.destroy();
    })().catch((err) => console.error('preview failed', err));
    return () => {
      cancelled = true;
    };
  }, [pdf, width, zoom, t]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 justify-between px-2 py-1 border-b border-border bg-surface">
        <div className="text-[0.9rem] text-muted min-h-10 flex items-center gap-2 px-1" aria-live="polite">
          {busy ? <Spinner label={t('editor.rendering')} /> : numPages ? t('editor.pages', { count: numPages }) : null}
        </div>
        <div className="flex items-center">
          <IconButton icon="zoomOut" label={t('editor.zoomOut')} onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} />
          <button type="button" className="min-h-12 px-2 text-[0.9rem] hover:bg-surface-2 rounded cursor-pointer" onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <IconButton icon="zoomIn" label={t('editor.zoomIn')} onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} />
        </div>
      </div>
      <div
        ref={wrapRef}
        tabIndex={0}
        role="region"
        aria-label={t('editor.preview')}
        className="flex-1 overflow-auto bg-surface-2 p-3"
        style={{ colorScheme: 'light' }}
      >
        {error ? <p className="text-error font-semibold p-4">{t('editor.renderError')}</p> : null}
        <div ref={pagesRef} className={busy && numPages ? 'opacity-80 transition-opacity' : ''} />
        {!pdf && !error ? (
          <div className="p-8 flex justify-center">
            <Spinner label={t('editor.rendering')} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
