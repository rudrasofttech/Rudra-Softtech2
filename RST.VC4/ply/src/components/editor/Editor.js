
import React, { useRef, useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './EditorContext';
import TopBar from './TopBar';
import Sidebar, { PropertiesPanel } from './Sidebar';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import { DEFAULTS } from './constants';
import './editor.css';

// Main Editor module layout
export default function Editor({ websiteId, navigate }) {
  return (
    <EditorProvider websiteId={websiteId} navigate={navigate}>
      <EditorLayout />
    </EditorProvider>
  );
}

// Resolve canvas natural pixel dimensions from EditorContext state,
// mirroring the same fallback logic used in Canvas.js render and Canvas.js getCanvasDims().
// Returns { cW, cH } in canvas-space pixels.
function resolveCanvasDims(state) {
  const pg = state.pages[state.currentPage];
  const parts = (state.aspectRatio || '16:9').split(':').map(Number);
  const ar = (parts[0] && parts[1]) ? parts[0] / parts[1] : 16 / 9;
  let cW = pg.canvasWidth, cH = pg.canvasHeight;
  if (typeof cW === 'number' && typeof cH === 'number') { /* both set — use as-is */ }
  else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
  else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
  else {
    cW = DEFAULTS.CANVAS_MAX_W;
    cH = Math.round(cW / ar);
    if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
  }
  return { cW, cH };
}

function EditorLayout() {
  // Use context to get zoom for scaling the whole design
  const { state, dispatch, ActionTypes } = useEditor();
  // Ref to the canvas container so we can attach a non-passive wheel listener.
  // React synthetic onWheel events cannot call preventDefault in passive mode
  // (browsers mark wheel listeners passive by default), so we use a ref + useEffect.
  const containerRef = useRef();
  // Mirror latest state into a ref so the wheel handler always reads fresh zoom
  // without needing to be re-registered on every state change (avoids stale closures).
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── 90 % screen-fit cap for 100 % zoom ───────────────────────────────────
  // Track the live pixel dimensions of the editor-canvas-container so we can
  // compute how much the canvas must be scaled down to stay within
  // ZOOM_100_MAX_SCREEN_RATIO (90 %) of the available space at zoom = 1.
  // A ResizeObserver (registered once) keeps containerSize current.
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Snapshot initial size immediately so fitScale is correct on first render.
    setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // containerRef.current is stable after mount — no re-registration needed

  // fitScale: ratio by which the canvas must be scaled so that at 100 % zoom
  // it does not exceed ZOOM_100_MAX_SCREEN_RATIO of the container.
  // If the container is large enough, fitScale stays at 1 (no cap applied).
  const { cW: cnvW, cH: cnvH } = resolveCanvasDims(state);
  const fitScale = (containerSize.width > 0 && containerSize.height > 0)
    ? Math.min(
        1,
        (containerSize.width  * DEFAULTS.ZOOM_100_MAX_SCREEN_RATIO) / cnvW,
        (containerSize.height * DEFAULTS.ZOOM_100_MAX_SCREEN_RATIO) / cnvH
      )
    : 1; // default 1 until first ResizeObserver callback

  // Ctrl+wheel (or Cmd+wheel on Mac) adjusts zoom; plain wheel scrolls normally.
  // Non-passive listener is required so preventDefault() blocks the browser's
  // built-in pinch-to-zoom / page-zoom when Ctrl is held.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return; // let plain scroll pass through
      e.preventDefault();
      // deltaY > 0 → scroll down → zoom out; deltaY < 0 → scroll up → zoom in
      const direction = e.deltaY > 0 ? -1 : 1;
      const current = stateRef.current.zoom;
      const next = Math.min(
        DEFAULTS.ZOOM_MAX,
        Math.max(DEFAULTS.ZOOM_MIN, parseFloat((current + direction * DEFAULTS.ZOOM_WHEEL_STEP).toFixed(2)))
      );
      dispatch({ type: ActionTypes.SET_ZOOM, payload: next });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
    // dispatch and ActionTypes are stable; stateRef is a ref (no re-bind needed)
  }, [dispatch, ActionTypes]);

  // Keyboard handler for Delete key to remove selected element
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        // Find the selected element and check its type
        const page = state.pages[state.currentPage];
        const el = page.elements.find(el => el.id === state.selectedElementId);
        if (el && el.type !== 'text') {
          dispatch({ type: ActionTypes.DELETE_ELEMENT, payload: state.selectedElementId });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElementId, state.pages, state.currentPage, dispatch, ActionTypes]);

  return (
    <div className="editor-root">
      <TopBar />
      <div className="editor-main">
        <Sidebar />
        {/* Canvas container: light grey background, zooms the whole design */}
        <div
          ref={containerRef}
          className="editor-canvas-container bg-light"
          style={{
            position: 'relative',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Floating frosted-glass properties panel — overlays canvas on the right */}
          <PropertiesPanel />
          <div
            className="editor-canvas-zoom-wrapper"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                transform: `scale(${state.zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* fitScale caps the rendered canvas to 90 % of the container at 100 % zoom */}
          <Canvas fitScale={fitScale} />
            </div>
          </div>
        </div>
      </div>
      <Toolbar />
    </div>
  );
}
