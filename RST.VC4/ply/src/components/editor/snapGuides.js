// snapGuides.js
// Pure helper — computes snap corrections and active alignment guide lines.
// Called from DraggableResizable during drag, resize, and crop gestures.
// Has no React state or side-effects; safe to run inside a RAF callback.
//
// SNAP MODEL
// ──────────
// The "active element" exposes up to 3 X-axis key-values (left, right, centerX)
// and up to 3 Y-axis key-values (top, bottom, centerY).  Each key-value is
// compared against every reference key-value (same axes) gathered from:
//   • all OTHER elements on the page (their own left/right/centerX, top/bottom/centerY)
//   • the canvas boundaries and centre
//
// When |active_val − ref_val| <= SNAP_THRESHOLD the value is snapped to ref_val and
// a guide line is emitted at that canvas coordinate.
//
// GUIDE LINE FORMAT (returned array items)
// ─────────────────
// Each item: { axis: 'x'|'y', position: <canvas-px> }
//   'x' → vertical line (appears at a fixed left-offset across the full canvas height)
//   'y' → horizontal line (appears at a fixed top-offset across the full canvas width)
//
// RETURN VALUE of computeSnap()
// ──────────────────────────────
// { snappedX, snappedY, guides }
//   snappedX / snappedY — corrected x / y position for the active element's
//                          top-left corner (in canvas-space px)
//   guides              — array of { axis, position } to render

import { DEFAULTS } from './constants';

/**
 * Collect all candidate snap values for one axis from elements other than the
 * selected one, and from the canvas boundary.
 *
 * @param {'x'|'y'} axis
 * @param {object[]} otherElements  — page.elements excluding the selected element
 * @param {number}   canvasSize     — canvasWidth (axis='x') or canvasHeight (axis='y')
 * @returns {number[]} sorted unique candidate values in canvas-px
 */
function collectCandidates(axis, otherElements, canvasSize) {
  const candidates = new Set();

  // Canvas boundary and centre
  candidates.add(0);
  candidates.add(canvasSize);
  candidates.add(canvasSize / 2);

  otherElements.forEach(el => {
    const p = el.props || {};
    const elX = p.x || 0;
    const elY = p.y || 0;
    const elW = p.width  || DEFAULTS.SIZE.width;
    const elH = p.height || DEFAULTS.SIZE.height;
    if (axis === 'x') {
      candidates.add(elX);                   // left edge
      candidates.add(elX + elW);             // right edge
      candidates.add(elX + elW / 2);         // horizontal centre
    } else {
      candidates.add(elY);                   // top edge
      candidates.add(elY + elH);             // bottom edge
      candidates.add(elY + elH / 2);         // vertical centre
    }
  });

  return [...candidates];
}

/**
 * Try to snap a set of key-values to the nearest candidate within the threshold.
 * Returns { delta, guide } where delta is the correction to apply and guide is
 * the snapped position (or null if no snap fired).
 *
 * Only the closest snap within the threshold is applied per axis.
 *
 * @param {number[]} keyValues   — left/right/centerX (or top/bottom/centerY) of the active elem
 * @param {number[]} candidates  — all reference values for this axis
 * @param {number}   threshold   — SNAP_THRESHOLD in canvas-px
 * @returns {{ delta: number, guidePos: number|null }}
 */
function snapAxis(keyValues, candidates, threshold) {
  let bestDelta = Infinity;
  let bestGuide = null;

  for (const kv of keyValues) {
    for (const cv of candidates) {
      const diff = cv - kv; // positive → kv must move right/down to reach cv
      if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(bestDelta)) {
        bestDelta = diff;
        bestGuide = cv;
      }
    }
  }

  if (bestGuide === null) return { delta: 0, guidePos: null };
  return { delta: bestDelta, guidePos: bestGuide };
}

/**
 * Main entry point.  Called from DraggableResizable on every RAF tick.
 *
 * @param {object} params
 * @param {number} params.x           — proposed top-left X in canvas-px (before snap)
 * @param {number} params.y           — proposed top-left Y in canvas-px (before snap)
 * @param {number} params.width       — element width
 * @param {number} params.height      — element height
 * @param {object[]} params.otherElements — all page elements except the selected one
 * @param {number} params.canvasWidth
 * @param {number} params.canvasHeight
 * @returns {{ snappedX: number, snappedY: number, guides: {axis:'x'|'y', position:number}[] }}
 */
export function computeSnap({ x, y, width, height, otherElements, canvasWidth, canvasHeight }) {
  const threshold = DEFAULTS.SNAP_THRESHOLD;

  // Key-values for the active element (before snap)
  const keyX = [x, x + width, x + width / 2];       // left, right, centerX
  const keyY = [y, y + height, y + height / 2];      // top,  bottom, centerY

  const candidatesX = collectCandidates('x', otherElements, canvasWidth);
  const candidatesY = collectCandidates('y', otherElements, canvasHeight);

  const { delta: deltaX, guidePos: guideX } = snapAxis(keyX, candidatesX, threshold);
  const { delta: deltaY, guidePos: guideY } = snapAxis(keyY, candidatesY, threshold);

  const guides = [];
  if (guideX !== null) guides.push({ axis: 'x', position: guideX });
  if (guideY !== null) guides.push({ axis: 'y', position: guideY });

  return {
    snappedX: x + deltaX,
    snappedY: y + deltaY,
    guides,
  };
}
