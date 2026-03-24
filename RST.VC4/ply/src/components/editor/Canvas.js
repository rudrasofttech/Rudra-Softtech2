import React, { useEffect, useRef, useState } from 'react';
import { useEditor } from './EditorContext';
import ElementControls from './ElementControls';
import { DEFAULTS } from './constants';

// SnapGuideLines: renders the active alignment guide lines over the canvas.
// Lines are absolutely positioned within the editor-canvas div (which has
// overflow:hidden so they never bleed outside). They are pointer-events:none
// so they never interfere with mouse events on elements.
// guides: { axis: 'x'|'y', position: <canvas-px> }[]
//   'x' → vertical magenta line at position from canvas left
//   'y' → horizontal blue line at position from canvas top
function SnapGuideLines({ guides, canvasWidth, canvasHeight }) {
  if (!guides || guides.length === 0) return null;
  return (
    <>
      {guides.map((g, i) => (
        <div
          key={i}
          className={DEFAULTS.SNAP_GUIDE_CLASS}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 1000,
            // X-axis guide → vertical line spanning full canvas height
            // Y-axis guide → horizontal line spanning full canvas width
            ...(g.axis === 'x'
              ? {
                  left: g.position,
                  top: 0,
                  width: DEFAULTS.SNAP_GUIDE_THICKNESS,
                  height: canvasHeight,
                  background: DEFAULTS.SNAP_GUIDE_COLOR_X,
                  transform: 'translateX(-50%)', // centre the 1px line on the guide position
                }
              : {
                  top: g.position,
                  left: 0,
                  height: DEFAULTS.SNAP_GUIDE_THICKNESS,
                  width: canvasWidth,
                  background: DEFAULTS.SNAP_GUIDE_COLOR_Y,
                  transform: 'translateY(-50%)',
                }
            ),
          }}
        />
      ))}
    </>
  );
}

// Canvas renders all elements for the current page and handles drag/resize/rotate
// fitScale (default 1): display-only scale factor from EditorLayout that caps the canvas
// to ZOOM_100_MAX_SCREEN_RATIO (90 %) of the container at 100 % zoom. Forwarded to
// each ElementControls so DraggableResizable can maintain accurate drag tracking.
export default function Canvas({ fitScale = 1 }) {
  const { state, dispatch, ActionTypes } = useEditor();
  const page = state.pages[state.currentPage];

  // ── Snap guide state ─────────────────────────────────────────────────────
  // Holds the currently active guide lines while the user is dragging/resizing/cropping.
  // Using useState so React re-renders SnapGuideLines on every RAF tick that changes guides.
  const [activeGuides, setActiveGuides] = useState([]);

  // ── Stale-closure fix: stateRef always mirrors latest state ──────────────
  // Lets the single-registration keyboard listeners below read fresh state
  // without needing to be re-bound on every render.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Tracks the in-flight arrow-key hold sequence between keydown and keyup
  // { key, holdStart, startPages, elId, accX, accY }
  const keyMoveRef = useRef(null);

  // ── Keyboard handler (registered once) ───────────────────────────────────
  // Arrow keys        → Nudge 1px; hold >500ms → auto-accelerates to 5px/tick
  // Shift+Arrow       → Large step (10px), no acceleration
  // Ctrl+Shift+]      → Bring to Front  |  Ctrl+]  → Bring Forward
  // Ctrl+Shift+[      → Send to Back    |  Ctrl+[  → Send Backward
  // Undo batching: UPDATE_ELEMENT_NO_HISTORY on each tick (smooth feedback,
  // no history entries), then COMMIT_ELEMENT_MOVE on keyup (one undo entry).
  useEffect(() => {
    const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    // Mirror of Canvas dimension-resolution logic — kept in sync with render
    function parseAR(r) {
      if (!r) return 16 / 9;
      const [w, h] = r.split(':').map(Number);
      return w && h ? w / h : 16 / 9;
    }
    function getCanvasDims(s) {
      const pg = s.pages[s.currentPage];
      const ar = parseAR(s.aspectRatio);
      let cW = pg.canvasWidth, cH = pg.canvasHeight;
      if (typeof cW === 'number' && typeof cH === 'number') { /* both set */ }
      else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
      else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
      else {
        cW = DEFAULTS.CANVAS_MAX_W;
        cH = Math.round(cW / ar);
        if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
      }
      return { cW, cH };
    }

    // Commit the accumulated move as a single undo-stack entry
    function commitMove(s) {
      if (!keyMoveRef.current) return;
      const { startPages, elId, accX, accY } = keyMoveRef.current;
      const el = s.pages[s.currentPage].elements.find(el => el.id === elId);
      if (el) {
        dispatch({
          type: ActionTypes.COMMIT_ELEMENT_MOVE,
          payload: {
            element: { ...el, props: { ...el.props, x: accX, y: accY } },
            startPages, // reducer pushes this as the undo snapshot
          },
        });
      }
      keyMoveRef.current = null;
    }

    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (!s.selectedElementId) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // ── Arrow key nudge ────────────────────────────────────────────────────
      if (!ctrl && ARROW_KEYS.includes(e.key)) {
        e.preventDefault(); // suppress browser page-scroll
        const pg = s.pages[s.currentPage];
        const el = pg.elements.find(el => el.id === s.selectedElementId);
        if (!el) return;

        // On the first keydown of a sequence (or key change), snapshot starting state
        if (!keyMoveRef.current || keyMoveRef.current.key !== e.key) {
          if (keyMoveRef.current) commitMove(s); // commit any prior in-flight sequence
          keyMoveRef.current = {
            key: e.key,
            holdStart: Date.now(),
            startPages: JSON.parse(JSON.stringify(s.pages)), // deep-copy for undo snapshot
            elId: s.selectedElementId,
            accX: el.props.x || 0,
            accY: el.props.y || 0,
          };
        }

        // Step size: Shift → fixed large step; long hold → auto-accelerate
        const held = Date.now() - keyMoveRef.current.holdStart;
        const step = shift
          ? DEFAULTS.ARROW_MOVE_STEP_LARGE
          : held > DEFAULTS.ARROW_HOLD_ACCEL_DELAY
            ? DEFAULTS.ARROW_MOVE_STEP_ACCEL
            : DEFAULTS.ARROW_MOVE_STEP;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;

        // Clamp to canvas bounds so the element stays fully inside
        const { cW, cH } = getCanvasDims(s);
        const newX = Math.max(0, Math.min(cW - (el.props.width  || DEFAULTS.IMAGE_WIDTH),  (el.props.x || 0) + dx));
        const newY = Math.max(0, Math.min(cH - (el.props.height || DEFAULTS.SIZE.height), (el.props.y || 0) + dy));

        keyMoveRef.current.accX = newX;
        keyMoveRef.current.accY = newY;

        // Visual feedback — does NOT push to undo stack
        dispatch({
          type: ActionTypes.UPDATE_ELEMENT_NO_HISTORY,
          payload: { ...el, props: { ...el.props, x: newX, y: newY } },
        });
        return;
      }

      // ── Layering shortcuts (Ctrl+[ / Ctrl+]) ──────────────────────────────
      if (!ctrl) return;
      if (e.key === ']') {
        e.preventDefault();
        dispatch({
          type: shift ? ActionTypes.BRING_ELEMENT_TO_FRONT : ActionTypes.BRING_ELEMENT_FORWARD,
          payload: s.selectedElementId,
        });
      } else if (e.key === '[') {
        e.preventDefault();
        dispatch({
          type: shift ? ActionTypes.SEND_ELEMENT_TO_BACK : ActionTypes.SEND_ELEMENT_BACKWARD,
          payload: s.selectedElementId,
        });
      }
    };

    // keyup: commit accumulated move as a single undo entry
    const handleKeyUp = (e) => {
      if (!ARROW_KEYS.includes(e.key)) return;
      if (!keyMoveRef.current || keyMoveRef.current.key !== e.key) return;
      commitMove(stateRef.current);
    };

    // Commit any in-flight move if focus leaves the window (key-up won't fire)
    const handleBlur = () => {
      if (keyMoveRef.current) commitMove(stateRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
    // dispatch and ActionTypes are stable; all state is read via stateRef (no re-bind needed)
  }, [dispatch, ActionTypes]);

  // Deselect element when clicking on empty canvas
  const handleCanvasClick = (e) => {
    if (e.target.classList.contains('editor-canvas')) {
      dispatch({ type: ActionTypes.DESELECT_ELEMENT });
    }
  };

  // Parse aspect ratio string (e.g. '16:9' or '4:3')
  function parseAspectRatio(ratio) {
    if (!ratio) return 16 / 9;
    const [w, h] = ratio.split(':').map(Number);
    return w && h ? w / h : 16 / 9;
  }
  const aspect = parseAspectRatio(state.aspectRatio);
  const maxW = DEFAULTS.CANVAS_MAX_W, maxH = DEFAULTS.CANVAS_MAX_H;
  let width = page.canvasWidth;
  let height = page.canvasHeight;
  // If both width and height are set, use them directly
  if (typeof width === 'number' && typeof height === 'number') {
    // nothing to do
  } else if (typeof width === 'number') {
    // Only width set, calculate height from aspect
    height = Math.round(width / aspect);
  } else if (typeof height === 'number') {
    // Only height set, calculate width from aspect
    width = Math.round(height * aspect);
  } else {
    // Neither set, use defaults
    width = maxW;
    height = Math.round(width / aspect);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height * aspect);
    }
  }
  const canvasStyle = {
    background: page.background || '#fff',
    border: `${page.borderWidth || 0}px solid ${page.borderColor || '#888888'}`,
    borderRadius: (page.borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS),
    width: `${width}px`,
    height: `${height}px`,
    aspectRatio: `${aspect}`,
    position: 'relative',
    overflow: 'hidden',
    margin: '1rem auto',
    boxSizing: 'border-box',
    transition: 'width 0.2s, height 0.2s',
    display: 'block',
  };
  // Sort elements by z-index (z), fallback to array order for backward compatibility
  // Do NOT bring selected element to front on selection; only explicit layering actions change z-index/order
  const sortedElements = [...page.elements].sort((a, b) => {
    if (a.z === undefined && b.z === undefined) return 0;
    if (a.z === undefined) return -1;
    if (b.z === undefined) return 1;
    return a.z - b.z;
  });
  return (
    <div
      style={{
        width: width,
        height: height,
        // effectiveZoom = state.zoom × fitScale.
        // fitScale ≤ 1 ensures the canvas never exceeds ZOOM_100_MAX_SCREEN_RATIO
        // (90 %) of the container at 100 % zoom (fitScale is 1 when not needed).
        transform: `scale(${state.zoom * fitScale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s',
        margin: '1rem auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="editor-canvas" style={canvasStyle} onMouseDown={handleCanvasClick}>
        {/* Render all elements on the current page, sorted by z-index. Selection does NOT affect order. */}
        {sortedElements.map((el) => (
          <ElementControls
            key={el.id}
            element={el}
            selected={state.selectedElementId === el.id}
            fitScale={fitScale}
            // Snap guide props: supply sibling elements and canvas dimensions so
            // DraggableResizable can compute alignment snaps during gestures.
            otherElements={page.elements.filter(e => e.id !== el.id)}
            canvasWidth={width}
            canvasHeight={height}
            onGuideChange={setActiveGuides}
          />
        ))}
        {/* Snap guide lines — rendered above all elements, cleared on mouse-up */}
        <SnapGuideLines guides={activeGuides} canvasWidth={width} canvasHeight={height} />
      </div>
    </div>
  );
}
