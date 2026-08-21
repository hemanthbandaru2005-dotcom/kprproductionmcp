import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Loads a PDF from a URL and renders each page to a data URL image.
 * @param {string} pdfUrl — path to the PDF file (e.g. '/albums/demo.pdf')
 * @param {number} scale — render resolution scale (default 2 for high-res)
 * @returns {Promise<string[]>} — array of data URL strings for each page
 */
export async function loadPdfPages(pdfUrl, scale = 2) {
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const pageImages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    pageImages.push(canvas.toDataURL('image/jpeg', 0.85));

    // Clean up canvas memory
    canvas.width = 0;
    canvas.height = 0;
  }

  return pageImages;
}
