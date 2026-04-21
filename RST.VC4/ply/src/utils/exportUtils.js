import html2canvas from 'html2canvas';


/**
 * Renders a DOM element to a canvas via html2canvas and downloads as JPEG.
 * @param {HTMLElement} domNode   - The element to capture (e.g. the canvas div).
 * @param {number}      quality   - JPEG quality 0–1 (default 0.92).
 * @param {string}      filename  - Download filename.
 */
export async function exportCanvasToJpeg(domNode, quality = 0.92, filename = 'canvas.jpg') {
  if (!domNode) return;
  const rendered = await html2canvas(domNode, { useCORS: true, scale: 2 });
  const dataUrl = rendered.toDataURL('image/jpeg', quality);
  triggerDownload(dataUrl, filename);
}

/**
 * Renders a DOM element to a canvas via html2canvas and downloads as PNG.
 * @param {HTMLElement} domNode   - The element to capture.
 * @param {string}      filename  - Download filename.
 */
export async function exportCanvasToPng(domNode, filename = 'canvas.png') {
  if (!domNode) return;
  const rendered = await html2canvas(domNode, { useCORS: true, scale: 2 });
  const dataUrl = rendered.toDataURL('image/png');
  triggerDownload(dataUrl, filename);
}



/** Creates a temporary anchor and triggers a file download. */
function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

