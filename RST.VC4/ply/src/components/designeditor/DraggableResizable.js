// DraggableResizable.js
// Modular wrapper for drag, resize, and rotate logic for editor elements
import React, { useRef, useState } from 'react';
import { DEFAULTS, RESIZE_MODE } from './constants';
import { computeSnap } from './snapGuides';

// ─── Pure module-level helpers ────────────────────────────────────────────────
// Kept outside the component so they are stable references that never re-create
// on render.  Each function has a single, testable responsibility.

/**
 * Derives the resize mode for a given element type.
 * Centralising this logic means supporting a new type requires editing here only.
 */
function getResizeMode(type, onlyWidthResize) {
  if (type === 'line') return RESIZE_MODE.LINE;
  if (onlyWidthResize)  return RESIZE_MODE.WIDTH_ONLY;
  return RESIZE_MODE.FULL;
}

/**
 * Returns the resize handle config array for a given resize mode.
 * Each entry: { dir, handleType, style }
 *   dir        — forwarded to onResizeDown for 'resize' handles; ignored for 'move'
 *   handleType — 'resize' (filled dot, triggers length change)
 *              | 'move'   (hollow dot, bubbles to parent drag — no onResizeDown)
 *   style      — positions the dot within the visible-region frame
 */
function buildResizeHandles(resizeMode) {
  if (resizeMode === RESIZE_MODE.LINE) {
    // Three handles along the line's horizontal axis:
    //   left  → drag to shorten/lengthen from the left endpoint
    //   right → drag to shorten/lengthen from the right endpoint
    //   center → hollow dot; click bubbles to parent draggable-resizable for a move gesture
    return [
      { dir: 'w',      handleType: 'resize', style: { left: -6,      top: '50%', marginTop: -6, cursor: 'ew-resize' } },
      { dir: 'center', handleType: 'move',   style: { left: '50%', marginLeft: -6, top: '50%', marginTop: -6, cursor: 'move' } },
      { dir: 'e',      handleType: 'resize', style: { right: -6,     top: '50%', marginTop: -6, cursor: 'ew-resize' } },
    ];
  }
  if (resizeMode === RESIZE_MODE.WIDTH_ONLY) {
    return [
      { dir: 'w', handleType: 'resize', style: { left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
      { dir: 'e', handleType: 'resize', style: { right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
    ];
  }
  if (resizeMode === RESIZE_MODE.FULL) {
    return [
      // Corner handles — resize both axes (round dot, z-index 10)
      { dir: 'nw', handleType: 'resize', style: { left: -6,  top: -6,    cursor: 'nwse-resize' } },
      { dir: 'ne', handleType: 'resize', style: { right: -6, top: -6,    cursor: 'nesw-resize' } },
      { dir: 'sw', handleType: 'resize', style: { left: -6,  bottom: -6, cursor: 'nesw-resize' } },
      { dir: 'se', handleType: 'resize', style: { right: -6, bottom: -6, cursor: 'nwse-resize' } },
      // Side handles — single-axis resize only. Square dot + elevated z-index so they
      // sit above crop-handle pills (z-index 12) which share the same midpoint positions.
      { dir: 'n', handleType: 'resize', isSide: true, style: { left: '50%', marginLeft: -5, top: -5,    cursor: 'ns-resize' } },
      { dir: 's', handleType: 'resize', isSide: true, style: { left: '50%', marginLeft: -5, bottom: -5, cursor: 'ns-resize' } },
      { dir: 'e', handleType: 'resize', isSide: true, style: { right: -5, top: '50%', marginTop: -5,   cursor: 'ew-resize' } },
      { dir: 'w', handleType: 'resize', isSide: true, style: { left:  -5, top: '50%', marginTop: -5,   cursor: 'ew-resize' } },
    ];
  }
  return []; // RESIZE_MODE.NONE
}

/**
 * Computes the new bounding-box after a resize-drag delta, fully rotation-aware.
 *
 * The key insight: CSS rotates around the element's centre. When a handle is dragged
 * we must (a) project the screen-space delta onto the element's LOCAL axes so the
 * resize feels correct regardless of angle, and (b) keep the opposing anchor point
 * fixed in canvas space so the element doesn't jump.
 *
 * @param {object} params
 *   resizeMode  - RESIZE_MODE constant driving which directions are active
 *   dir         - active handle direction ('e'|'w'|'ne'|'nw'|'se'|'sw')
 *   origin      - snapshot at drag-start: { width, height, boxX, boxY }
 *   dx / dy     - canvas-coordinate delta (already divided by zoom before call)
 *   minWidth / minHeight - minimum allowed dimensions
 *   rotation    - current element rotation in degrees (default 0)
 * @returns {{ newX, newY, newWidth, newHeight }}
 */
function applyResizeDelta({ resizeMode, dir, origin, dx, dy, minWidth, minHeight, rotation = 0 }) {
  const rad  = (rotation * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Project screen delta onto element-local axes.
  // dl_x: delta along the element's width  axis (left ↔ right in element space)
  // dl_y: delta along the element's height axis (top  ↔ bottom in element space)
  const dl_x =  dx * cosA + dy * sinA;
  const dl_y = -dx * sinA + dy * cosA;

  // Element centre in canvas space at drag-start
  const cx0 = origin.boxX + origin.width  / 2;
  const cy0 = origin.boxY + origin.height / 2;

  // Convert a point in element-local frame (offset from centre) → canvas coords
  const toCanvas = (lx, ly) => ({
    x: cx0 + lx * cosA - ly * sinA,
    y: cy0 + lx * sinA + ly * cosA,
  });

  // Given a fixed anchor in canvas coords and the anchor's LOCAL offset from the
  // NEW centre, compute the new element top-left.
  const posFromAnchor = (anchor, ax, ay, w, h) => ({
    newX: anchor.x - (ax * cosA - ay * sinA) - w / 2,
    newY: anchor.y - (ax * sinA + ay * cosA) - h / 2,
  });

  let newWidth  = origin.width;
  let newHeight = origin.height;
  let newX = origin.boxX;
  let newY = origin.boxY;

  if (resizeMode === RESIZE_MODE.LINE || resizeMode === RESIZE_MODE.WIDTH_ONLY) {
    // Only width changes; height is fixed.
    // 'e' handle → anchor = west midpoint of element (local: -w/2, 0)
    // 'w' handle → anchor = east midpoint of element (local: +w/2, 0)
    // The LINE center handle ('center') carries handleType='move' — onResizeDown is
    // never called for it so this function is never invoked with dir==='center'.
    if (dir === 'e') {
      newWidth = Math.max(minWidth, origin.width + dl_x);
      const anchor = toCanvas(-origin.width / 2, 0);
      const pos    = posFromAnchor(anchor, -newWidth / 2, 0, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'w') {
      newWidth = Math.max(minWidth, origin.width - dl_x);
      const anchor = toCanvas(origin.width / 2, 0);
      const pos    = posFromAnchor(anchor, newWidth / 2, 0, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    }
  } else if (resizeMode === RESIZE_MODE.FULL) {
    const w = origin.width, h = origin.height;
    // Each handle keeps its OPPOSING corner fixed as the anchor.
    if (dir === 'se') {
      newWidth  = Math.max(minWidth,  w + dl_x);
      newHeight = Math.max(minHeight, h + dl_y);
      const anchor = toCanvas(-w / 2, -h / 2); // NW corner stays fixed
      const pos = posFromAnchor(anchor, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'sw') {
      newWidth  = Math.max(minWidth,  w - dl_x);
      newHeight = Math.max(minHeight, h + dl_y);
      const anchor = toCanvas(w / 2, -h / 2); // NE corner stays fixed
      const pos = posFromAnchor(anchor, newWidth / 2, -newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'ne') {
      newWidth  = Math.max(minWidth,  w + dl_x);
      newHeight = Math.max(minHeight, h - dl_y);
      const anchor = toCanvas(-w / 2, h / 2); // SW corner stays fixed
      const pos = posFromAnchor(anchor, -newWidth / 2, newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'nw') {
      newWidth  = Math.max(minWidth,  w - dl_x);
      newHeight = Math.max(minHeight, h - dl_y);
      const anchor = toCanvas(w / 2, h / 2); // SE corner stays fixed
      const pos = posFromAnchor(anchor, newWidth / 2, newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    // Side handles — single axis, opposing edge midpoint stays fixed
    } else if (dir === 'e') {
      newWidth = Math.max(minWidth, w + dl_x);
      const anchor = toCanvas(-w / 2, 0); // west midpoint stays fixed
      const pos = posFromAnchor(anchor, -newWidth / 2, 0, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'w') {
      newWidth = Math.max(minWidth, w - dl_x);
      const anchor = toCanvas(w / 2, 0); // east midpoint stays fixed
      const pos = posFromAnchor(anchor, newWidth / 2, 0, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 's') {
      newHeight = Math.max(minHeight, h + dl_y);
      const anchor = toCanvas(0, -h / 2); // north midpoint stays fixed
      const pos = posFromAnchor(anchor, 0, -newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    } else if (dir === 'n') {
      newHeight = Math.max(minHeight, h - dl_y);
      const anchor = toCanvas(0, h / 2); // south midpoint stays fixed
      const pos = posFromAnchor(anchor, 0, newHeight / 2, newWidth, newHeight);
      newX = pos.newX; newY = pos.newY;
    }
  }
  return { newX, newY, newWidth, newHeight };
}

/**
 * Snaps a rotation angle to the nearest entry in SNAP_ANGLES if within threshold.
 * Returns { snappedAngle, snapAngle|null }.
 *   snappedAngle  — the angle to apply (snapped or raw)
 *   snapAngle     — the angle snapped to, or null if no snap fired
 */
function snapRotation(raw) {
  const { ROTATE_SNAP_ANGLES, ROTATE_SNAP_THRESHOLD } = DEFAULTS;
  for (const snap of ROTATE_SNAP_ANGLES) {
    if (Math.abs(raw - snap) <= ROTATE_SNAP_THRESHOLD) {
      return { snappedAngle: snap, snapAngle: snap };
    }
  }
  // Also test 360 (same as 0) for wrap-around
  if (Math.abs(raw - 360) <= ROTATE_SNAP_THRESHOLD) {
    return { snappedAngle: 0, snapAngle: 0 };
  }
  return { snappedAngle: raw, snapAngle: null };
}

/**
 * Props:
 * - x, y, width, height, rotation
 * - minWidth, minHeight
 * - onChange({x, y, width, height, rotation})
 * - children (rendered inside the bounding box)
 * - selected (boolean)
 */
// onSelect: function to select this element (from ElementControls)
// elementId: id of the element (for future extensibility)
export default function DraggableResizable({
  x, y, width, height, rotation = 0,
  minWidth = 20, minHeight = 20,
  onChange,
  children,
  selected,
  onSelect,
  elementId,
  onlyWidthResize = false,
  type,
  // Crop handle props — opt-in per element type (rect and image only)
  enableCropHandles = false,
  onCropChange,
  crop,
  // zoom: current editor zoom level from EditorContext state.
  // All screen-pixel deltas are divided by zoom so that element movement
  // matches the mouse exactly regardless of zoom level.
  zoom = 1,
  // Snap / alignment guide props — provided by Canvas via ElementControls.
  // otherElements: all page elements except the selected one, used to derive snap candidates.
  // canvasWidth / canvasHeight: canvas natural dimensions in canvas-px.
  // onGuideChange: callback({ guides }) called each RAF tick; empty array clears all guides.
  otherElements = [],
  canvasWidth = DEFAULTS.CANVAS_MAX_W,
  canvasHeight = DEFAULTS.CANVAS_MAX_H,
  onGuideChange,
  // Opacity: CSS opacity applied to the whole element (0–1)
  opacity = 1,
  // Locked: prevents all drag/resize/rotate/crop interactions
  locked = false,
}) {
  const boxRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  // null when idle; 'n' | 's' | 'e' | 'w' identifies the active crop edge
  const [cropping, setCropping] = useState(null);
  const [rotating, setRotating] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0, width, height, boxX: 0, boxY: 0 });
  // Stores mouse start and starting crop values for a crop-drag operation (avoids stale closures)
  const cropOriginRef = useRef({ mouseX: 0, mouseY: 0, crop: { top: 0, right: 0, bottom: 0, left: 0 } });
  // Stores center + start angle for a rotate-drag operation
  const rotateOriginRef = useRef({ centerX: 0, centerY: 0, startAngle: 0, startRotation: 0 });

  // Mouse down on main box (drag)
  const onMouseDown = (e) => {
    // Guard: resize and crop handles manage their own mouse-down; stop here if they fired.
    if (e.target.classList.contains('resize-handle') || e.target.classList.contains('crop-handle') || e.target.closest('.rotate-handle')) return;
    // Always allow selection so a locked element can be clicked to unlock it.
    if (onSelect) onSelect(e);
    // Locked elements: selection only — no drag gesture starts.
    if (locked) { e.stopPropagation(); return; }
    setDragging(true);
    setOrigin({
      x: e.clientX,
      y: e.clientY,
      boxX: x,
      boxY: y,
      width,
      height
    });
    e.stopPropagation();
  };

  // Mouse down on resize handle
  const onResizeDown = (e, direction) => {
    if (locked) return;
    setResizing(direction);
    setOrigin({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
      boxX: x,
      boxY: y
    });
    e.stopPropagation();
  };

  // Mouse down on a crop handle — snapshots current crop state and activates cropping for one edge
  const onCropHandleDown = (e, edge) => {
    if (locked) return;
    e.stopPropagation();
    // Read current crop (or default) so the delta can be applied during mousemove
    const startCrop = crop || DEFAULTS.CROP_EMPTY;
    cropOriginRef.current = { mouseX: e.clientX, mouseY: e.clientY, crop: { ...startCrop } };
    setCropping(edge);
  };

  // Mouse down on the rotate handle — records element center and initial angle
  const onRotateHandleDown = (e) => {
    if (locked) return;
    e.stopPropagation();
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateOriginRef.current = { centerX, centerY, startAngle, startRotation: rotation };
    setRotating(true);
  };

  // Mouse move with requestAnimationFrame for performance
  const animationFrameRef = useRef();
  const lastEventRef = useRef();
  const onMouseMove = (e) => {
    lastEventRef.current = e;
    if (!animationFrameRef.current) {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        const event = lastEventRef.current;
        if (!event) return;
        if (dragging) {
          // Divide screen-pixel delta by zoom to convert to canvas coordinates.
          // Without this, elements lag behind the mouse when zoom < 1.
          const dx = (event.clientX - origin.x) / zoom;
          const dy = (event.clientY - origin.y) / zoom;
          const rawX = origin.boxX + dx;
          const rawY = origin.boxY + dy;
          // Snap to adjacent elements and canvas edges/centres.
          // computeSnap returns corrected position and the set of active guide lines.
          const { snappedX, snappedY, guides } = computeSnap({
            x: rawX, y: rawY, width, height,
            otherElements, canvasWidth, canvasHeight,
          });
          if (onGuideChange) onGuideChange(guides);
          onChange({
            x: snappedX,
            y: snappedY,
            width,
            height,
            rotation
          });
        } else if (resizing) {
          // Resize deltas need zoom compensation (convert screen-px → canvas-px).
          const dx = (event.clientX - origin.x) / zoom;
          const dy = (event.clientY - origin.y) / zoom;
          const { newX, newY, newWidth, newHeight } = applyResizeDelta({
            resizeMode, dir: resizing, origin, dx, dy, minWidth, minHeight, rotation,
          });
          // Snap the resized bounding box; guides reflect edge/centre alignment.
          const { snappedX: rSnapX, snappedY: rSnapY, guides: rGuides } = computeSnap({
            x: newX, y: newY, width: newWidth, height: newHeight,
            otherElements, canvasWidth, canvasHeight,
          });
          if (onGuideChange) onGuideChange(rGuides);
          // When a side handle shrinks the element on one axis, clamp any existing
          // crop insets on that axis so the visible region never exceeds the new size.
          // This prevents shapes/images from becoming fully invisible after a resize.
          let updatedCrop = crop ? { ...crop } : null;
          if (updatedCrop && enableCropHandles) {
            const minVis = DEFAULTS.CROP_MIN_VISIBLE;
            if (resizing === 'e' || resizing === 'w') {
              // Width axis changed — clamp left + right insets
              const maxInset = Math.max(0, newWidth - minVis);
              updatedCrop.left  = Math.min(updatedCrop.left  || 0, maxInset);
              updatedCrop.right = Math.min(updatedCrop.right || 0, maxInset - (updatedCrop.left || 0));
            } else if (resizing === 'n' || resizing === 's') {
              // Height axis changed — clamp top + bottom insets
              const maxInset = Math.max(0, newHeight - minVis);
              updatedCrop.top    = Math.min(updatedCrop.top    || 0, maxInset);
              updatedCrop.bottom = Math.min(updatedCrop.bottom || 0, maxInset - (updatedCrop.top || 0));
            }
          }
          onChange({ x: rSnapX, y: rSnapY, width: newWidth, height: newHeight, rotation, ...(updatedCrop ? { crop: updatedCrop } : {}) });
        } else if (cropping) {
          // Crop drag: compute the new inset for the active edge, clamped within safe bounds.
          // Deltas are divided by zoom for the same reason as drag/resize.
          const { mouseX, mouseY, crop: startCrop } = cropOriginRef.current;
          const dx = (event.clientX - mouseX) / zoom;
          const dy = (event.clientY - mouseY) / zoom;
          const minVis = DEFAULTS.CROP_MIN_VISIBLE;
          const newCrop = { ...startCrop };
          if (cropping === 'n') {
            // Drag south → top inset grows (hides more of the top edge)
            newCrop.top = Math.max(0, Math.min(startCrop.top + dy, height - minVis - startCrop.bottom));
          } else if (cropping === 's') {
            // Drag north → bottom inset grows (hides more of the bottom edge)
            newCrop.bottom = Math.max(0, Math.min(startCrop.bottom - dy, height - minVis - startCrop.top));
          } else if (cropping === 'e') {
            // Drag west → right inset grows (hides more of the right edge)
            newCrop.right = Math.max(0, Math.min(startCrop.right - dx, width - minVis - startCrop.left));
          } else if (cropping === 'w') {
            // Drag east → left inset grows (hides more of the left edge)
            newCrop.left = Math.max(0, Math.min(startCrop.left + dx, width - minVis - startCrop.right));
          }
          // After applying the crop inset, compute the visible bounding box and snap it.
          // The visible box has the same x/y origin but reduced effective width/height.
          const cropVisX = x + newCrop.left;
          const cropVisY = y + newCrop.top;
          const cropVisW = width  - newCrop.left - newCrop.right;
          const cropVisH = height - newCrop.top  - newCrop.bottom;
          const { guides: cGuides } = computeSnap({
            x: cropVisX, y: cropVisY, width: cropVisW, height: cropVisH,
            otherElements, canvasWidth, canvasHeight,
          });
          if (onGuideChange) onGuideChange(cGuides);
          if (onCropChange) onCropChange(newCrop);
        } else if (rotating) {
          // Angle from element center to current mouse position → rotation delta
          const { centerX, centerY, startAngle, startRotation } = rotateOriginRef.current;
          const currentAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
          const delta = currentAngle - startAngle;
          let rawRot = (startRotation + delta) % 360;
          if (rawRot < 0) rawRot += 360;
          // Snap to multiples of 90° for line elements; emit an angle guide when snapped.
          const { snappedAngle, snapAngle } = snapRotation(rawRot);
          if (onGuideChange) {
            if (snapAngle !== null) {
              // Compute element centre in canvas-px so the guide renderer can draw
              // through it at the snapped angle.
              onGuideChange([{ axis: 'angle', angle: snapAngle, cx: x + width / 2, cy: y + height / 2 }]);
            } else {
              onGuideChange([]);
            }
          }
          onChange({ x, y, width, height, rotation: snappedAngle });
        }
        animationFrameRef.current = null;
      });
    }
  };

  // Mouse up — clear all active guide lines immediately
  const onMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setCropping(null);
    setRotating(false);
    if (onGuideChange) onGuideChange([]);
  };

  // Width-only resize for text (onlyWidthResize prop) and line types;
  // full 4-corner resize for all other elements.
  const isTextOnlyWidth = !!(typeof onlyWidthResize !== 'undefined' && onlyWidthResize);
  const resizeMode = getResizeMode(type, onlyWidthResize);
  const handles = selected ? buildResizeHandles(resizeMode) : [];

  // Pill-shaped crop handles at the midpoint of each edge.
  // Enabled only when selected AND the parent passes enableCropHandles=true (rect and image).
  let cropHandles = [];
  if (selected && enableCropHandles) {
    const hl = DEFAULTS.CROP_HANDLE_LONG;   // long axis  (horizontal pill width / vertical pill height)
    const hs = DEFAULTS.CROP_HANDLE_SHORT;  // short axis (horizontal pill height / vertical pill width)
    cropHandles = [
      { edge: 'n', style: { left: '50%', top:    -(hs / 2), marginLeft: -(hl / 2), width: hl, height: hs, cursor: 'ns-resize' } },
      { edge: 's', style: { left: '50%', bottom: -(hs / 2), marginLeft: -(hl / 2), width: hl, height: hs, cursor: 'ns-resize' } },
      { edge: 'e', style: { right: -(hs / 2), top: '50%', marginTop: -(hl / 2), width: hs, height: hl, cursor: 'ew-resize' } },
      { edge: 'w', style: { left:  -(hs / 2), top: '50%', marginTop: -(hl / 2), width: hs, height: hl, cursor: 'ew-resize' } },
    ];
  }

  // Visible-region insets: how far each edge of the bounding box is hidden by crop.
  // Falls back to 0 so elements without crop data (or non-crop element types) are unaffected.
  const cropLeft   = (enableCropHandles && crop?.left)   || 0;
  const cropTop    = (enableCropHandles && crop?.top)     || 0;
  const cropRight  = (enableCropHandles && crop?.right)   || 0;
  const cropBottom = (enableCropHandles && crop?.bottom)  || 0;

  // Patch onMouseMove to ignore height changes for text-only-width
  const patchedOnMouseMove = (e) => {
    if (dragging) {
      // Zoom compensation: convert screen pixels → canvas coordinates
      const dx = (e.clientX - origin.x) / zoom;
      const dy = (e.clientY - origin.y) / zoom;
      onChange({
        x: origin.boxX + dx,
        y: origin.boxY + dy,
        width,
        height,
        rotation
      });
    } else if (resizing) {
      // Resize deltas need zoom compensation (canvas coords).
      const dx = (e.clientX - origin.x) / zoom;
      const dy = (e.clientY - origin.y) / zoom;
      const { newX, newY, newWidth, newHeight } = applyResizeDelta({
        resizeMode, dir: resizing, origin, dx, dy, minWidth, minHeight, rotation,
      });
      onChange({ x: newX, y: newY, width: newWidth, height: newHeight, rotation });
    } else if (rotating) {
      const { centerX, centerY, startAngle, startRotation } = rotateOriginRef.current;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const delta = currentAngle - startAngle;
      let rawRot = (startRotation + delta) % 360;
      if (rawRot < 0) rawRot += 360;
      const { snappedAngle, snapAngle } = snapRotation(rawRot);
      if (onGuideChange) {
        if (snapAngle !== null) {
          onGuideChange([{ axis: 'angle', angle: snapAngle, cx: x + width / 2, cy: y + height / 2 }]);
        } else {
          onGuideChange([]);
        }
      }
      onChange({ x, y, width, height, rotation: snappedAngle });
    }
  };

  // Use patchedOnMouseMove if onlyWidthResize, else original
  React.useEffect(() => {
    if (dragging || resizing || cropping || rotating) {
      window.addEventListener('mousemove', isTextOnlyWidth ? patchedOnMouseMove : onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', isTextOnlyWidth ? patchedOnMouseMove : onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  });

  return (
    <div
      ref={boxRef}
      className={`draggable-resizable${selected ? ' selected' : ''}${rotating ? ' rotating' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        opacity,
      }}
      onMouseDown={onMouseDown}
    >
      {children}
      {/* Visible-region frame: overlays the full bounding-box at an inset that
           matches the non-cropped (visible) area. At zero crop it coincides
           exactly with the outer div so the on-screen result is unchanged.
           • pointer-events:none makes the frame transparent to clicks; only
             the individual handles (which set pointer-events:auto) receive events.
           • Selection outline lives here so it always surrounds just the visible area.
           • Resize handles and crop handles are children of this frame so their
             corner/midpoint anchoring (`left:-6`, `top:-6` …) resolves relative
             to the visible region rather than the full bounding box. */}
      {selected && (
        <div
          className={DEFAULTS.VISIBLE_REGION_CLASS}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: cropLeft,
            top: cropTop,
            right: cropRight,
            bottom: cropBottom,
            outline: `2px solid ${DEFAULTS.SELECTION_OUTLINE_COLOR}`,
            zIndex: DEFAULTS.CROP_HANDLE_Z_INDEX + 1,
          }}
        >
          {/* Resize / move handles — appearance and behaviour differ by handleType:
               'resize' → filled dot, triggers onResizeDown to change element dimensions
               'move'   → hollow dot (line center), no onResizeDown; click bubbles to the
                          parent draggable-resizable div which starts a normal drag gesture */}
          {handles.map(h =>
            h.handleType === 'move' ? (
              <div
                key={h.dir}
                className="line-move-handle"
                title="Drag to move"
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  background: DEFAULTS.LINE_MOVE_HANDLE_BG,
                  border: DEFAULTS.LINE_MOVE_HANDLE_BORDER,
                  borderRadius: 6,
                  zIndex: 10,
                  boxSizing: 'border-box',
                  pointerEvents: 'auto',
                  ...h.style,
                }}
              />
            ) : (
              <div
                key={h.dir}
                className={h.isSide ? 'resize-handle resize-handle-side' : 'resize-handle'}
                style={{
                  position: 'absolute',
                  width: h.isSide ? 10 : 12,
                  height: h.isSide ? 10 : 12,
                  background: DEFAULTS.SELECTION_OUTLINE_COLOR,
                  // Side handles: square (no borderRadius) so they're visually distinct
                  // from crop handles (which are teal pills) at the same midpoints.
                  borderRadius: h.isSide ? 2 : 6,
                  // Side handles must sit above crop-handle pills (z-index CROP_HANDLE_Z_INDEX=12)
                  zIndex: h.isSide ? DEFAULTS.SIDE_RESIZE_HANDLE_Z_INDEX : 10,
                  pointerEvents: 'auto',
                  ...h.style
                }}
                onMouseDown={e => onResizeDown(e, h.dir)}
              />
            )
          )}
          {/* Crop handles: teal pill at each edge midpoint — rect, ellipse, and image only.
               Anchored to the visible-region frame so they track the crop boundary as it
               moves. Visual styles come from DEFAULTS; h.style adds per-edge position/size. */}
          {cropHandles.map(h => (
            <div
              key={`crop-${h.edge}`}
              className="crop-handle"
              style={{
                position: 'absolute',
                background: DEFAULTS.CROP_HANDLE_BG,
                borderRadius: DEFAULTS.CROP_HANDLE_BORDER_RADIUS,
                zIndex: DEFAULTS.CROP_HANDLE_Z_INDEX,
                // Override parent's pointer-events:none so handles remain clickable
                pointerEvents: 'auto',
                ...h.style,
              }}
              onMouseDown={e => onCropHandleDown(e, h.edge)}
            />
          ))}
          {/* Rotation handle — hidden when element is locked */}
          {!locked && (
          <div
            style={{
              position: 'absolute',
              top: -38,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: DEFAULTS.CROP_HANDLE_Z_INDEX + 2,
            }}
          >
            <div
              className="rotate-handle"
              style={{ cursor: rotating ? 'grabbing' : 'grab', pointerEvents: 'auto' }}
              onMouseDown={onRotateHandleDown}
              title="Rotate"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 2,6.5 A 4.5,4.5 0 1 1 6.5,11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <polyline points="1.5,3.5 2,6.5 5,6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="rotate-handle-stem" />
          </div>
          )}
          {/* Lock badge — shown when element is locked and selected */}
          {locked && (
            <div
              title="Element is locked"
              style={{
                position: 'absolute',
                top: -28,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ff9800',
                color: '#fff',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 11,
                fontWeight: 700,
                pointerEvents: 'none',
                zIndex: DEFAULTS.CROP_HANDLE_Z_INDEX + 2,
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              🔒 Locked
            </div>
          )}
        </div>
      )}
    </div>
  );
}
