// DraggableResizable.js
// Modular wrapper for drag, resize, and rotate logic for editor elements
import React, { useRef, useState } from 'react';
import { DEFAULTS } from './constants';
import { computeSnap } from './snapGuides';

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
}) {
  const boxRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  // null when idle; 'n' | 's' | 'e' | 'w' identifies the active crop edge
  const [cropping, setCropping] = useState(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0, width, height, boxX: 0, boxY: 0 });
  // Stores mouse start and starting crop values for a crop-drag operation (avoids stale closures)
  const cropOriginRef = useRef({ mouseX: 0, mouseY: 0, crop: { top: 0, right: 0, bottom: 0, left: 0 } });

  // Mouse down on main box (drag)
  const onMouseDown = (e) => {
    // Guard: resize and crop handles manage their own mouse-down; stop here if they fired.
    if (e.target.classList.contains('resize-handle') || e.target.classList.contains('crop-handle')) return;
    // Always select this element before dragging
    if (onSelect) onSelect(e);
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
    e.stopPropagation();
    // Read current crop (or default) so the delta can be applied during mousemove
    const startCrop = crop || DEFAULTS.CROP_EMPTY;
    cropOriginRef.current = { mouseX: e.clientX, mouseY: e.clientY, crop: { ...startCrop } };
    setCropping(edge);
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
          let newWidth = origin.width;
          let newHeight = origin.height;
          let newX = origin.boxX;
          let newY = origin.boxY;
          // Resize deltas also need zoom compensation
          const dx = (event.clientX - origin.x) / zoom;
          const dy = (event.clientY - origin.y) / zoom;
          if (resizing === 'se') {
            newWidth = Math.max(minWidth, origin.width + dx);
            newHeight = Math.max(minHeight, origin.height + dy);
          } else if (resizing === 'sw') {
            newWidth = Math.max(minWidth, origin.width - dx);
            newHeight = Math.max(minHeight, origin.height + dy);
            newX = origin.boxX + dx;
          } else if (resizing === 'ne') {
            newWidth = Math.max(minWidth, origin.width + dx);
            newHeight = Math.max(minHeight, origin.height - dy);
            newY = origin.boxY + dy;
          } else if (resizing === 'nw') {
            newWidth = Math.max(minWidth, origin.width - dx);
            newHeight = Math.max(minHeight, origin.height - dy);
            newX = origin.boxX + dx;
            newY = origin.boxY + dy;
          }
          // Snap the resized bounding box; guides reflect edge/centre alignment.
          const { snappedX: rSnapX, snappedY: rSnapY, guides: rGuides } = computeSnap({
            x: newX, y: newY, width: newWidth, height: newHeight,
            otherElements, canvasWidth, canvasHeight,
          });
          if (onGuideChange) onGuideChange(rGuides);
          onChange({
            x: rSnapX,
            y: rSnapY,
            width: newWidth,
            height: newHeight,
            rotation
          });
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
    if (onGuideChange) onGuideChange([]);
  };

  // Only allow width resize for text elements (east/west handles only)
  const isTextOnlyWidth = !!(typeof onlyWidthResize !== 'undefined' && onlyWidthResize);
  // Disable resize handles for line elements
  let handles = [];
  if (selected) {
    if (type === 'line') {
      handles = [];
    } else if (isTextOnlyWidth) {
      handles = [
        { dir: 'w', style: { left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
        { dir: 'e', style: { right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
      ];
    } else {
      handles = [
        { dir: 'nw', style: { left: -6, top: -6, cursor: 'nwse-resize' } },
        { dir: 'ne', style: { right: -6, top: -6, cursor: 'nesw-resize' } },
        { dir: 'sw', style: { left: -6, bottom: -6, cursor: 'nesw-resize' } },
        { dir: 'se', style: { right: -6, bottom: -6, cursor: 'nwse-resize' } },
      ];
    }
  }

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
      let newWidth = origin.width;
      let newHeight = origin.height;
      let newX = origin.boxX;
      let newY = origin.boxY;
      // Resize deltas also need zoom compensation
      const dx = (e.clientX - origin.x) / zoom;
      const dy = (e.clientY - origin.y) / zoom;
      if (isTextOnlyWidth) {
        // Only allow width resize, ignore height
        if (resizing === 'e') {
          newWidth = Math.max(minWidth, origin.width + dx);
        } else if (resizing === 'w') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newX = origin.boxX + dx;
        }
        onChange({
          x: newX,
          y: newY,
          width: newWidth,
          height: origin.height,
          rotation
        });
      } else {
        // ...existing code for all handles...
        if (resizing === 'se') {
          newWidth = Math.max(minWidth, origin.width + dx);
          newHeight = Math.max(minHeight, origin.height + dy);
        } else if (resizing === 'sw') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newHeight = Math.max(minHeight, origin.height + dy);
          newX = origin.boxX + dx;
        } else if (resizing === 'ne') {
          newWidth = Math.max(minWidth, origin.width + dx);
          newHeight = Math.max(minHeight, origin.height - dy);
          newY = origin.boxY + dy;
        } else if (resizing === 'nw') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newHeight = Math.max(minHeight, origin.height - dy);
          newX = origin.boxX + dx;
          newY = origin.boxY + dy;
        }
        onChange({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          rotation
        });
      }
    }
  };

  // Use patchedOnMouseMove if onlyWidthResize, else original
  React.useEffect(() => {
    if (dragging || resizing || cropping) {
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
      className={`draggable-resizable${selected ? ' selected' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation}deg)`
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
          {/* Corner resize handles — positioned at corners of the visible region */}
          {handles.map(h => (
            <div
              key={h.dir}
              className="resize-handle"
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                background: DEFAULTS.SELECTION_OUTLINE_COLOR,
                borderRadius: 6,
                zIndex: 10,
                // Override parent's pointer-events:none so handles remain clickable
                pointerEvents: 'auto',
                ...h.style
              }}
              onMouseDown={e => onResizeDown(e, h.dir)}
            />
          ))}
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
        </div>
      )}
    </div>
  );
}
