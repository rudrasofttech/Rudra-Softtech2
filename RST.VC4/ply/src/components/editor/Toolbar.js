import React, { useRef, useState } from 'react';
import { useEditor } from './EditorContext';
import ExportJpegPopup from './ExportJpegPopup';
import { exportCanvasToJpeg } from '../../utils/exportUtils';

// Toolbar for zoom, undo/redo, export
export default function Toolbar() {
  const { state, dispatch, ActionTypes } = useEditor();
  const history = Array.isArray(state.history) ? state.history : [];
  const future = Array.isArray(state.future) ? state.future : [];
  const [showJpegPopup, setShowJpegPopup] = useState(false);
  // Ref to the canvas DOM node
  const canvasRef = useRef();

  // Find the canvas DOM node by class name
  function getCanvasNode() {
    return document.querySelector('.editor-canvas');
  }

  // Zoom handlers
  const zoomIn = () => dispatch({ type: ActionTypes.SET_ZOOM, payload: Math.min(state.zoom + 0.1, 2) });
  const zoomOut = () => dispatch({ type: ActionTypes.SET_ZOOM, payload: Math.max(state.zoom - 0.1, 0.2) });
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
    } else {
      alert(`Export as ${format} not implemented yet.`);
    }
  };

  // Handle export JPEG from popup
  const handleExportJpeg = (quality) => {
    setShowJpegPopup(false);
    // Deselect any selected element before export for a clean image
    if (state.selectedElementId) {
      dispatch({ type: ActionTypes.DESELECT_ELEMENT });
      // Wait for the UI to update before exporting
      setTimeout(() => doExport(quality), 50);
    } else {
      doExport(quality);
    }
  };

  // Actual export logic
  function doExport(quality) {
    const canvasNode = getCanvasNode();
    if (!canvasNode) {
      alert('Canvas not found.');
      return;
    }
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(canvasNode, { backgroundColor: null }).then(canvas => {
        exportCanvasToJpeg(canvas, quality, `${state.projectName || 'canvas'}.jpg`);
      });
    });
  }

  return (
    <footer className="editor-toolbar">
      <button onClick={zoomOut}>-</button>
      <input
        type="range"
        min={0.2}
        max={2}
        step={0.01}
        value={state.zoom}
        onChange={handleZoomSlider}
        style={{ width: 120, verticalAlign: 'middle' }}
        aria-label="Zoom slider"
      />
      <span style={{ minWidth: 60, display: 'inline-block', textAlign: 'center' }}>Zoom: {(state.zoom * 100).toFixed(0)}%</span>
      <button onClick={zoomIn}>+</button>
      <button onClick={undo} disabled={history.length === 0}>Undo</button>
      <button onClick={redo} disabled={future.length === 0}>Redo</button>
      <button onClick={() => exportAs('PDF')}>Export PDF</button>
      <button onClick={() => exportAs('Word')}>Export Word</button>
      <button onClick={() => exportAs('JPEG')}>Export JPEG</button>
      <button onClick={() => exportAs('PNG')}>Export PNG</button>
      {/* Export JPEG Popup */}
      <ExportJpegPopup
        open={showJpegPopup}
        onClose={() => setShowJpegPopup(false)}
        onExport={handleExportJpeg}
      />
    </footer>
  );
}
