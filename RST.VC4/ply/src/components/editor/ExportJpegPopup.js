import React, { useState } from 'react';
import PropTypes from 'prop-types';

// ExportJpegPopup: Modal for setting JPEG quality and downloading
export default function ExportJpegPopup({ open, onClose, onExport }) {
  const [quality, setQuality] = useState(0.92);

  if (!open) return null;

  return (
    <div className="export-jpeg-modal-overlay">
      <div className="export-jpeg-modal">
        <h5>Export as JPEG</h5>
        <label>
          Quality: {quality}
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            style={{ width: 200 }}
          />
        </label>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-primary btn-sm" onClick={() => onExport(quality)}>Download</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
      <style>{`
        .export-jpeg-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .export-jpeg-modal {
          background: #fff; border-radius: 8px; padding: 2rem; min-width: 320px; box-shadow: 0 2px 16px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}

ExportJpegPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
};
