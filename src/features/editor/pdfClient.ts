// Main-thread client for the PDF engine. Uses a web worker; falls back to
// rendering on the main thread (lazy-loaded) if workers are unavailable.

import type { RenderInput } from '@/documents/render/types';

type Pending = { resolve: (b: ArrayBuffer) => void; reject: (e: Error) => void };

let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; pdf?: ArrayBuffer; error?: string }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok && e.data.pdf) p.resolve(e.data.pdf);
      else p.reject(new Error(e.data.error || 'render failed'));
    };
    worker.onerror = (e) => {
      console.error('PDF worker error', e);
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const [, p] of pending) p.reject(new Error('worker-crashed'));
      pending.clear();
    };
    return worker;
  } catch (err) {
    console.warn('PDF worker unavailable, rendering on main thread', err);
    workerBroken = true;
    return null;
  }
}

export function fontBase(): string {
  return new URL(`${import.meta.env.BASE_URL}fonts/`, window.location.href).href;
}

async function renderOnMainThread(input: RenderInput): Promise<ArrayBuffer> {
  const { renderPdf } = await import('@/documents/render/renderPdf');
  return (await renderPdf(input)).pdf;
}

export async function renderDocument(input: RenderInput): Promise<ArrayBuffer> {
  const w = getWorker();
  if (!w) return renderOnMainThread(input);
  const id = ++seq;
  try {
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage({ id, input });
    });
  } catch (err) {
    if ((err as Error).message === 'worker-crashed') return renderOnMainThread(input);
    throw err;
  }
}

// ---------------------------------------------------------------- Output actions

export function pdfFileName(kind: string, person: string | undefined, dateIso: string | undefined): string {
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateIso ?? '') ? dateIso! : new Date().toISOString().slice(0, 10);
  return [slug(kind), person ? slug(person) : '', date].filter(Boolean).join('-') + '.pdf';
}

export function downloadPdf(pdf: ArrayBuffer, fileName: string): void {
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

/** Prints the exact PDF. Desktop: hidden iframe. Mobile: open the PDF so the native viewer's print/share is used. */
export function printPdf(pdf: ArrayBuffer): void {
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  if (isMobileDevice()) {
    const w = window.open(url, '_blank');
    if (!w) window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 120_000);
  };
  document.body.appendChild(iframe);
}

export function canShareFiles(): boolean {
  try {
    const f = new File([new Uint8Array(1)], 'x.pdf', { type: 'application/pdf' });
    return Boolean(navigator.canShare?.({ files: [f] }));
  } catch {
    return false;
  }
}

export async function sharePdf(pdf: ArrayBuffer, fileName: string, title: string): Promise<boolean> {
  const file = new File([pdf], fileName, { type: 'application/pdf' });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch {
    return false;
  }
}
