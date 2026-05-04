// exportPages.js — Multi-page JPEG / PNG export for the design editor.
//
// Uses a direct Canvas 2D renderer for pixel-perfect output of every element type.
// SVG-based elements (shapes and lines) are serialized to SVG strings via
// renderToStaticMarkup, loaded as Blob-URL images, then drawn with ctx.drawImage.
// This avoids html2canvas, which silently drops SVG content.
//
// • All element types supported: rect, ellipse, text, image, shape, line.
// • Rotation handled for every type via ctx.translate + ctx.rotate.
// • 2× pixel ratio for sharp output on HiDPI displays.
// • Each page is processed sequentially to avoid download races.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULTS } from './constants';
import { SHAPE_BY_ID, renderShapeSvgContent } from './shapes';
import { LINE_BY_ID, renderLineSvgContent } from './lines';

const PIXEL_RATIO = 2; // render at 2× for HiDPI sharpness

// ─── Canvas dimension resolution (mirrors Canvas.js exactly) ─────────────────

function parseAR(r) {
  if (!r) return 16 / 9;
  const [w, h] = r.split(':').map(Number);
  return w && h ? w / h : 16 / 9;
}

function resolveCanvasDims(page, aspectRatio) {
  const aspect = parseAR(aspectRatio);
  let width  = page.canvasWidth;
  let height = page.canvasHeight;
  if (typeof width === 'number' && typeof height === 'number') {
    // both explicit — use as-is
  } else if (typeof width === 'number') {
    height = Math.round(width / aspect);
  } else if (typeof height === 'number') {
    width = Math.round(height * aspect);
  } else {
    width  = DEFAULTS.CANVAS_MAX_W;
    height = Math.round(width / aspect);
    if (height > DEFAULTS.CANVAS_MAX_H) {
      height = DEFAULTS.CANVAS_MAX_H;
      width  = Math.round(height * aspect);
    }
  }
  return { width, height };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function degToRad(deg) { return (deg * Math.PI) / 180; }

/**
 * Apply rotation + flip transform around element centre, run fn, then restore.
 * CSS applies transforms inner-to-outer, so flip is applied in element-local space
 * (after rotation). We replicate: translate→rotate→flip→translate-back.
 */
function withTransform(ctx, cx, cy, rotation, flipX, flipY, fn) {
  const needTransform = rotation || flipX || flipY;
  if (!needTransform) { fn(); return; }
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation) ctx.rotate(degToRad(rotation));
  if (flipX)    ctx.scale(-1,  1);
  if (flipY)    ctx.scale( 1, -1);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

/** Apply box-shadow as canvas shadow state. Returns a reset function. */
function applyBoxShadow(ctx, style) {
  if (!style.boxShadowEnabled) return;
  ctx.shadowOffsetX = style.boxShadowX   ?? 2;
  ctx.shadowOffsetY = style.boxShadowY   ?? 4;
  ctx.shadowBlur    = style.boxShadowBlur ?? 8;
  ctx.shadowColor   = style.boxShadowColor ?? 'rgba(0,0,0,0.25)';
}

function resetBoxShadow(ctx) {
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur    = 0;
  ctx.shadowColor   = 'transparent';
}

/**
 * Polyfill for ctx.roundRect. Draws a rounded-rectangle path.
 * Uses the native method when available, falls back to arcTo.
 */
function roundRectPath(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rad = Math.min(Number(r) || 0, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x,     y + h, rad);
  ctx.arcTo(x,     y + h, x,     y,     rad);
  ctx.arcTo(x,     y,     x + w, y,     rad);
}

/** Load an <img> from a URL, resolving when onload fires. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => {
      // If CORS fails, retry without the crossOrigin attribute (loses taint check)
      const img2 = new Image();
      img2.onload  = () => resolve(img2);
      img2.onerror = reject;
      img2.src = src;
    };
    img.src = src;
  });
}

/**
 * Serialize a React SVG element to an HTMLImageElement via Blob URL.
 * This is the reliable path for drawing SVG into Canvas 2D — html2canvas
 * silently drops SVG content, whereas drawImage(blobImg) always works.
 */
function svgReactToImage(svgReactElement) {
  const markup = renderToStaticMarkup(svgReactElement);
  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// ─── Per-element draw ─────────────────────────────────────────────────────────

async function drawElement(ctx, element) {
  const props = element.props || {};
  const style = element.style || {};
  const { x = 0, y = 0, width: w = 0, height: h = 0, rotation = 0, flipX = false, flipY = false } = props;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const bw = typeof style.borderWidth === 'number' ? style.borderWidth : DEFAULTS.BORDER_WIDTH;
  const bc = style.borderColor || DEFAULTS.BORDER_COLOR;

  // Apply element-level opacity for the duration of this draw call
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * (style.opacity ?? 1);

  try {
    switch (element.type) {

      case 'rect': {
        const bg = style.background || DEFAULTS.BACKGROUND_RECT;
        const br = Number(style.borderRadius) || DEFAULTS.BORDER_RADIUS;
        withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
          ctx.save();
          applyBoxShadow(ctx, style);
          ctx.beginPath();
          if (br) roundRectPath(ctx, x, y, w, h, br); else ctx.rect(x, y, w, h);
          ctx.closePath();
          ctx.fillStyle = bg;
          ctx.fill();
          resetBoxShadow(ctx);
          if (bw > 0) { ctx.lineWidth = bw; ctx.strokeStyle = bc; ctx.stroke(); }
          ctx.restore();
        });
        break;
      }

      case 'ellipse': {
        const bg = style.background || DEFAULTS.BACKGROUND_RECT;
        withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
          ctx.save();
          applyBoxShadow(ctx, style);
          ctx.beginPath();
          ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
          ctx.fillStyle = bg;
          ctx.fill();
          resetBoxShadow(ctx);
          if (bw > 0) { ctx.lineWidth = bw; ctx.strokeStyle = bc; ctx.stroke(); }
          ctx.restore();
        });
        break;
      }

      case 'line': {
        if (element.lineId) {
          const lineDef = LINE_BY_ID[element.lineId];
          if (!lineDef) break;
          const sw    = style.strokeWidth ?? 2;
          const lineH = sw + DEFAULTS.LINE_STROKE_HEIGHT_PADDING * 2;
          const svgEl = React.createElement(
            'svg',
            {
              xmlns: 'http://www.w3.org/2000/svg',
              width: w,
              height: lineH,
              viewBox: `0 0 ${w} ${lineH}`,
              preserveAspectRatio: 'none',
            },
            renderLineSvgContent(
              lineDef, w, lineH,
              style.stroke ?? '#222222',
              sw,
              style.fill ?? style.stroke ?? '#222222',
            )
          );
          const img = await svgReactToImage(svgEl);
          withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
            ctx.drawImage(img, x, y, w, lineH);
          });
        } else {
          withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
            ctx.save();
            ctx.fillStyle = style.background || '#222222';
            ctx.beginPath();
            roundRectPath(ctx, x, y, w, h, 2);
            ctx.fill();
            ctx.restore();
          });
        }
        break;
      }

      case 'shape': {
        const shapeDef = SHAPE_BY_ID[element.shapeId];
        if (!shapeDef) break;
        const sw   = style.strokeWidth ?? 0;
        const pad  = sw;
        const svgW = w + pad * 2;
        const svgH = h + pad * 2;
        const svgEl = React.createElement(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: svgW,
            height: svgH,
            viewBox: `${-pad} ${-pad} ${svgW} ${svgH}`,
            preserveAspectRatio: 'none',
          },
          renderShapeSvgContent(
            shapeDef, w, h,
            style.fill ?? DEFAULTS.BACKGROUND_RECT,
            style.stroke ?? 'none',
            sw,
            style,
          )
        );
        const img = await svgReactToImage(svgEl);
        withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
          ctx.save();
          applyBoxShadow(ctx, style);
          ctx.drawImage(img, x - pad, y - pad, svgW, svgH);
          resetBoxShadow(ctx);
          ctx.restore();
        });
        break;
      }

      case 'image': {
        const src = props.src || DEFAULTS.PLACEHOLDER_IMAGE;
        try {
          const img = await loadImage(src);
          withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
            ctx.save();
            applyBoxShadow(ctx, style);
            const br = Number(style.borderRadius) || DEFAULTS.BORDER_RADIUS;
            if (br) {
              ctx.beginPath();
              roundRectPath(ctx, x, y, w, h, br);
              ctx.clip();
            }
            ctx.drawImage(img, x, y, w, h);
            resetBoxShadow(ctx);
            if (bw > 0) {
              ctx.lineWidth = bw;
              ctx.strokeStyle = bc;
              if (br) { ctx.beginPath(); roundRectPath(ctx, x, y, w, h, br); ctx.stroke(); }
              else ctx.strokeRect(x, y, w, h);
            }
            ctx.restore();
          });
        } catch (e) {
          withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(x, y, w, h);
          });
        }
        break;
      }

      case 'text': {
        const fontSize      = style.fontSize || DEFAULTS.FONT_SIZE;
        const fontFamily    = style.fontFamily || 'sans-serif';
        const color         = style.color || DEFAULTS.TEXT_COLOR;
        const bg            = style.background || DEFAULTS.BACKGROUND;
        const bold          = style.bold   ? 'bold'   : 'normal';
        const italic        = style.italic ? 'italic' : 'normal';
        const padding       = style.padding || 0;
        const textAlign     = style.textAlign || DEFAULTS.TEXT_ALIGN;
        const br            = Number(style.borderRadius) || DEFAULTS.BORDER_RADIUS;
        const lineHeightMul = style.lineHeight ?? 1.4;
        const lineHeight    = fontSize * lineHeightMul;

        withTransform(ctx, cx, cy, rotation, flipX, flipY, () => {
          ctx.save();

          // Background + box-shadow
          if (bg && bg !== 'transparent') {
            applyBoxShadow(ctx, style);
            ctx.fillStyle = bg;
            ctx.beginPath();
            if (br) roundRectPath(ctx, x, y, w, h, br); else ctx.rect(x, y, w, h);
            ctx.fill();
            resetBoxShadow(ctx);
          }
          // Border
          if (bw > 0) {
            ctx.lineWidth = bw; ctx.strokeStyle = bc;
            ctx.beginPath();
            if (br) roundRectPath(ctx, x, y, w, h, br); else ctx.rect(x, y, w, h);
            ctx.stroke();
          }

          // Clip text to element bounds
          ctx.beginPath();
          ctx.rect(x + padding, y + padding, w - padding * 2, h - padding * 2);
          ctx.clip();

          // Shadow / glow
          if (style.shadow) { ctx.shadowBlur = 4;  ctx.shadowColor = 'rgba(0,0,0,0.5)'; }
          if (style.glow)   { ctx.shadowBlur = 10; ctx.shadowColor = color; }

          // Text
          ctx.font         = `${italic} ${bold} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle    = color;
          ctx.textBaseline = 'top';
          ctx.textAlign    = textAlign || 'left';
          // Letter spacing (Canvas 2D Level 5 — supported in Chromium 99+)
          if ('letterSpacing' in ctx) ctx.letterSpacing = (style.letterSpacing ?? 0) + 'px';

          const textX =
            textAlign === 'center' ? x + w / 2 :
            textAlign === 'right'  ? x + w - padding :
            x + padding;

          const lines = (element.content || '').split('\n');
          lines.forEach((line, i) => {
            ctx.fillText(line, textX, y + padding + i * lineHeight, w - padding * 2);
            if (style.underline) {
              const metrics = ctx.measureText(line);
              const lx = textAlign === 'center' ? textX - metrics.width / 2
                       : textAlign === 'right'  ? textX - metrics.width
                       : textX;
              const ly = y + padding + i * lineHeight + fontSize + 2;
              ctx.save();
              ctx.strokeStyle = color; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + metrics.width, ly); ctx.stroke();
              ctx.restore();
            }
          });

          ctx.restore();
        });
        break;
      }

      default:
        break;
    }
  } finally {
    ctx.globalAlpha = prevAlpha; // always restore alpha
  }
}

// ─── Core page renderer ───────────────────────────────────────────────────────

async function renderPageToCanvas(page, aspectRatio) {
  const { width, height } = resolveCanvasDims(page, aspectRatio);

  const canvas  = document.createElement('canvas');
  canvas.width  = width  * PIXEL_RATIO;
  canvas.height = height * PIXEL_RATIO;
  const ctx = canvas.getContext('2d');
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

  // Page background
  ctx.fillStyle = page.background || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Sort by z — lowest first (mirrors Canvas.js)
  const sorted = [...(page.elements || [])].sort((a, b) => {
    if (a.z === undefined && b.z === undefined) return 0;
    if (a.z === undefined) return -1;
    if (b.z === undefined) return 1;
    return a.z - b.z;
  });

  for (const el of sorted) {
    try {
      await drawElement(ctx, el);
    } catch (err) {
      console.warn(`[exportPages] Failed to render element ${el.id} (${el.type}):`, err);
    }
  }

  return canvas;
}

// ─── Download helper ──────────────────────────────────────────────────────────

function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href     = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function pageFilename(projectName, pageIndex, pageCount, ext) {
  const base   = projectName || 'canvas';
  const suffix = pageCount > 1 ? `-page${pageIndex + 1}` : '';
  return `${base}${suffix}.${ext}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exports every page as a separate JPEG file.
 * @param {object[]} pages        — state.pages array
 * @param {string}   aspectRatio  — state.aspectRatio (e.g. '16:9')
 * @param {string}   projectName  — used as the base filename
 * @param {number}   quality      — JPEG quality 0–1 (default 0.92)
 */
export async function exportAllPagesToJpeg(pages, aspectRatio, projectName, quality = 0.92) {
  for (let i = 0; i < pages.length; i++) {
    const canvas  = await renderPageToCanvas(pages[i], aspectRatio);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    triggerDownload(dataUrl, pageFilename(projectName, i, pages.length, 'jpg'));
  }
}

/**
 * Exports every page as a separate PNG file.
 * @param {object[]} pages        — state.pages array
 * @param {string}   aspectRatio  — state.aspectRatio (e.g. '16:9')
 * @param {string}   projectName  — used as the base filename
 */
export async function exportAllPagesToPng(pages, aspectRatio, projectName) {
  for (let i = 0; i < pages.length; i++) {
    const canvas  = await renderPageToCanvas(pages[i], aspectRatio);
    const dataUrl = canvas.toDataURL('image/png');
    triggerDownload(dataUrl, pageFilename(projectName, i, pages.length, 'png'));
  }
}

