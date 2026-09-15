import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function renderPdfFirstPage(url: string, canvas: HTMLCanvasElement, targetWidth: number) {
  const pdf = await getDocument(url).promise;
  const page = await pdf.getPage(1);

  const unscaled = page.getViewport({ scale: 1 });
  const scale = targetWidth / unscaled.width;
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
}
