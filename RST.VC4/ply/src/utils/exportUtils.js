// Utility to export a DOM node (canvas) as JPEG with quality
// Uses HTMLCanvasElement.toDataURL and triggers download
export function exportCanvasToJpeg(canvasNode, quality = 0.92, filename = 'canvas.jpg') {
  if (!canvasNode) return;
  // Default quality: 0.92 (like browser default)
  const dataUrl = canvasNode.toDataURL('image/jpeg', quality);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
