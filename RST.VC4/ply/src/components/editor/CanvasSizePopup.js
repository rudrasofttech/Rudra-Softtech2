import React, { useState } from 'react';
import { DEFAULTS } from './constants';

// Modular popup for canvas size reset
export default function CanvasSizePopup({ aspectRatio, initialWidth, initialHeight, onApply, onClose }) {
  // Calculate aspect ratio
  function parseAspectRatio(ratio) {
    if (!ratio) return 16 / 9;
    const [w, h] = ratio.split(':').map(Number);
    return w && h ? w / h : 16 / 9;
  }
  const aspectOptions = [
    DEFAULTS.ASPECT_RATIO_16_9,
    DEFAULTS.ASPECT_RATIO_4_3,
    '1:1',
    '9:16',
  ];
  const [localAspectRatio, setLocalAspectRatio] = useState(aspectRatio || DEFAULTS.ASPECT_RATIO);
  const [aspect, setAspect] = useState(parseAspectRatio(localAspectRatio));
  const [width, setWidth] = useState(initialWidth || DEFAULTS.CANVAS_MAX_W);
  const [height, setHeight] = useState(initialHeight || Math.round(width / aspect));

  // When width changes, update height
  const handleWidthChange = (e) => {
    const w = parseInt(e.target.value) || DEFAULTS.CANVAS_MAX_W;
    setWidth(w);
    setHeight(Math.round(w / aspect));
  };

  // When height changes, update width
  const handleHeightChange = (e) => {
    const h = parseInt(e.target.value) || DEFAULTS.CANVAS_MAX_H;
    setHeight(h);
    setWidth(Math.round(h * aspect));
  };

  // When aspect ratio changes, update aspect, recalculate height
  const handleAspectRatioChange = (e) => {
    const newRatio = e.target.value;
    setLocalAspectRatio(newRatio);
    const newAspect = parseAspectRatio(newRatio);
    setAspect(newAspect);
    setHeight(Math.round(width / newAspect));
  };

  // Apply changes
  const handleApply = () => {
    onApply(width, height, localAspectRatio);
    onClose();
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reset Canvas Size</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Aspect Ratio</label>
              <select className="form-select" value={localAspectRatio} onChange={handleAspectRatioChange}>
                {aspectOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Width (px)</label>
              <input type="number" className="form-control" min={DEFAULTS.CANVAS_MIN_W} max={DEFAULTS.CANVAS_MAX_W} value={width} onChange={handleWidthChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Height (px)</label>
              <input type="number" className="form-control" min={DEFAULTS.CANVAS_MIN_H} max={DEFAULTS.CANVAS_MAX_H} value={height} onChange={handleHeightChange} />
            </div>
            <div className="text-muted">Aspect Ratio: {localAspectRatio} ({aspect.toFixed(2)})</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleApply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
