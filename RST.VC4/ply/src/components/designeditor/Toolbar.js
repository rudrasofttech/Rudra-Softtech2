import React, { useRef, useState } from 'react';
import { useEditor } from './EditorContext';
import ExportJpegPopup from './ExportJpegPopup';
import { exportAllPagesToJpeg, exportAllPagesToPng } from './exportPages';
import { DEFAULTS } from './constants';
import PageManager from './PageManager';

// Toolbar for zoom, undo/redo, export
export default function Toolbar() {
  const { state, dispatch, ActionTypes } = useEditor();
  const history = Array.isArray(state.history) ? state.history : [];
  const future = Array.isArray(state.future) ? state.future : [];
  const [showJpegPopup, setShowJpegPopup] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Ref to the canvas DOM node
  const canvasRef = useRef();

  // Find the canvas DOM node by class name
  function getCanvasNode() {
    return document.querySelector('.editor-canvas');
  }

  // Zoom handlers — clamp to DEFAULTS.ZOOM_MIN / DEFAULTS.ZOOM_MAX for consistency
  // with the Ctrl+wheel handler in Editor.js
  const zoomIn  = () => dispatch({ type: ActionTypes.SET_ZOOM, payload: Math.min(state.zoom + 0.1, DEFAULTS.ZOOM_MAX) });
  const zoomOut = () => dispatch({ type: ActionTypes.SET_ZOOM, payload: Math.max(state.zoom - 0.1, DEFAULTS.ZOOM_MIN) });
  const handleZoomSlider = (e) => {
    const value = parseFloat(e.target.value);
    dispatch({ type: ActionTypes.SET_ZOOM, payload: value });
  };

  // Undo/redo handlers
  const undo = () => dispatch({ type: ActionTypes.UNDO });
  const redo = () => dispatch({ type: ActionTypes.REDO });

  // Export handlers
  const exportAs = (format) => {
    if (format === 'JPEG') {
      setShowJpegPopup(true);
    } else if (format === 'PNG') {
      handleExportPng();
    } else {
      alert(`Export as ${format} not implemented yet.`);
    }
  };

  // Deselect element then run an async export action
  async function runExport(action) {
    if (exporting) return;
    setExporting(true);
    try {
      if (state.selectedElementId) {
        dispatch({ type: ActionTypes.DESELECT_ELEMENT });
        // Allow React one paint cycle to remove selection UI before capturing
        await new Promise(r => setTimeout(r, 60));
      }
      await action();
    } finally {
      setExporting(false);
    }
  }

  // Handle export JPEG from popup — exports all pages
  const handleExportJpeg = (quality) => {
    setShowJpegPopup(false);
    runExport(() =>
      exportAllPagesToJpeg(
        state.pages,
        state.aspectRatio,
        state.projectName,
        quality,
      )
    );
  };

  // Handle PNG export — exports all pages directly (no quality setting needed)
  const handleExportPng = () => {
    runExport(() =>
      exportAllPagesToPng(
        state.pages,
        state.aspectRatio,
        state.projectName,
      )
    );
  };

  return (
    <footer className="editor-toolbar">
      {/* Pages drop-up — manage multi-page navigation from the bottom toolbar */}
      <PageManager />
      <button type='button' className='btn btn-light btn-sm' onClick={zoomOut}>-</button>
      <input className="form-range"
        type="range"
        min={DEFAULTS.ZOOM_MIN}
        max={DEFAULTS.ZOOM_MAX}
        step={0.01}
        value={state.zoom}
        onChange={handleZoomSlider}
        style={{ width: 120, verticalAlign: 'middle' }}
        aria-label="Zoom slider"
      />
      <span style={{ minWidth: 60, display: 'inline-block', textAlign: 'center' }}>Zoom: {(state.zoom * 100).toFixed(0)}%</span>
      <button type='button' className='btn btn-light btn-sm' onClick={zoomIn}>+</button>
      <button type='button' className='btn btn-light btn-sm' onClick={undo} disabled={history.length === 0}>Undo</button>
      <button type='button' className='btn btn-light btn-sm' onClick={redo} disabled={future.length === 0}>Redo</button>
      <button type='button' className='btn btn-light btn-sm' onClick={() => exportAs('PDF')}>Export PDF</button>
      <button type='button' className='btn btn-light btn-sm' onClick={() => exportAs('Word')}>Export Word</button>
      <button type='button' className='btn btn-light btn-sm' onClick={() => exportAs('JPEG')} disabled={exporting}>
        {exporting ? 'Exporting…' : 'Export JPEG'}
      </button>
      <button type='button' className='btn btn-light btn-sm' onClick={() => exportAs('PNG')} disabled={exporting}>
        {exporting ? 'Exporting…' : 'Export PNG'}
      </button>
      {/* Export JPEG Popup */}
      <ExportJpegPopup
        open={showJpegPopup}
        onClose={() => setShowJpegPopup(false)}
        onExport={handleExportJpeg}
      />
    </footer>
  );
}
