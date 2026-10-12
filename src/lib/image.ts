// Image intake for branding: decode PNG/JPG/SVG/WebP, scale down (never up,
// never distorted) and re-encode. Logos, signatures and stamps become PNG.

export type ProcessedImage = { blob: Blob; width: number; height: number; type: string };

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

export async function processImage(file: File, opts: { maxDim: number; format: 'png' | 'auto' }): Promise<ProcessedImage> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('too-big');
  const img = await loadImage(file);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (!w || !h) {
    // SVG without intrinsic size
    w = 1200;
    h = 400;
  }
  const scale = Math.min(1, opts.maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, outW, outH);
  const jpeg = opts.format === 'auto' && /jpe?g/i.test(file.type);
  const type = jpeg ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), type, jpeg ? 0.88 : undefined),
  );
  return { blob, width: outW, height: outH, type };
}
