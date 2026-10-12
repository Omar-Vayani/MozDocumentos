import { useCallback, useEffect, useRef, useState } from 'react';
import type { RenderInput } from '@/documents/render/types';
import { renderDocument } from './pdfClient';

/**
 * Debounced, latest-wins PDF rendering. While a render is running, only the
 * most recent input is queued, so typing never piles up work.
 */
export function usePdfRender(input: RenderInput | null, key: string, delay = 300) {
  const [pdf, setPdf] = useState<ArrayBuffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queued = useRef<{ input: RenderInput; key: string } | null>(null);
  const running = useRef(false);
  const lastKey = useRef<string | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    while (queued.current) {
      const job = queued.current;
      queued.current = null;
      try {
        const buf = await renderDocument(job.input);
        setPdf(buf);
        lastKey.current = job.key;
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    running.current = false;
    setBusy(false);
  }, []);

  const hasInput = input !== null;
  useEffect(() => {
    if (!inputRef.current) return;
    const timer = setTimeout(() => {
      if (!inputRef.current) return;
      queued.current = { input: inputRef.current, key };
      void pump();
    }, lastKey.current == null ? 0 : delay);
    return () => clearTimeout(timer);
  }, [key, delay, pump, hasInput]);

  /** Returns a PDF for exactly the current input (re-rendering if the preview is stale). */
  const current = useCallback(async (): Promise<ArrayBuffer | null> => {
    const inp = inputRef.current;
    if (!inp) return null;
    if (pdf && lastKey.current === key && !running.current) return pdf;
    const buf = await renderDocument(inp);
    return buf;
  }, [pdf, key]);

  return { pdf, busy, error, current };
}
