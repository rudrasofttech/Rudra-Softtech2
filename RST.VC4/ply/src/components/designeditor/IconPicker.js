import React, { useState, useEffect, useRef } from 'react';
import { ICON_CATALOG, ICON_CATEGORIES } from './icons';
import { renderShapeSvgContent } from './shapes';

/**
 * IconPicker — popup panel for browsing and selecting Bootstrap Icons.
 *
 * Props:
 *   onSelect(iconId)  — called when user clicks an icon
 *   onClose()         — called when user dismisses the popup
 *   anchorRef         — ref to the trigger button (for positioning)
 */
export default function IconPicker({ onSelect, onClose, anchorRef }) {
  const [search, setSearch]         = useState('');
  const [activeSubCat, setActiveSubCat] = useState('All');
  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = ICON_CATALOG.filter(icon => {
    const matchSubCat = activeSubCat === 'All' || icon.iconCategory === activeSubCat;
    const matchSearch =
      !search ||
      icon.label.toLowerCase().includes(search.toLowerCase()) ||
      (icon.iconCategory && icon.iconCategory.toLowerCase().includes(search.toLowerCase()));
    return matchSubCat && matchSearch;
  });

  // Cap display to avoid rendering thousands of SVG thumbnails at once.
  const DISPLAY_LIMIT = 300;
  const visible     = filtered.length > DISPLAY_LIMIT ? filtered.slice(0, DISPLAY_LIMIT) : filtered;
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="shape-picker-popup" ref={popupRef}>
      {/* Header */}
      <div className="shape-picker-header">
        <span className="shape-picker-title">Icons</span>
        <button className="shape-picker-close" onClick={onClose} title="Close">
          <i className="bi bi-x" />
        </button>
      </div>

      {/* Search */}
      <div className="shape-picker-search-row">
        <i className="bi bi-search shape-picker-search-icon" />
        <input
          className="shape-picker-search"
          type="text"
          placeholder="Search icons…"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveSubCat('All'); }}
          autoFocus
        />
        {search && (
          <button className="shape-picker-search-clear" onClick={() => setSearch('')} title="Clear">
            <i className="bi bi-x-circle-fill" />
          </button>
        )}
      </div>

      {/* Sub-category tabs */}
      <div className="shape-picker-tabs shape-picker-subtabs">
        {['All', ...ICON_CATEGORIES].map(sub => (
          <button
            key={sub}
            className={`shape-picker-tab shape-picker-subtab${activeSubCat === sub ? ' active' : ''}`}
            onClick={() => { setActiveSubCat(sub); setSearch(''); }}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="shape-picker-body">
        {visible.length === 0 && (
          <div className="shape-picker-empty">No icons found</div>
        )}
        <div className="shape-picker-grid">
          {visible.map(icon => (
            <IconThumb key={icon.id} icon={icon} onSelect={onSelect} />
          ))}
        </div>
        {hiddenCount > 0 && (
          <div className="shape-picker-overflow-hint">
            Showing first {DISPLAY_LIMIT} of {filtered.length} icons.
            Use sub-category tabs or search to narrow results.
          </div>
        )}
      </div>
    </div>
  );
}

/** Individual icon thumbnail cell */
function IconThumb({ icon, onSelect }) {
  const W = 44, H = 36;
  const pad = 5;
  const w = W - pad * 2, h = H - pad * 2;
  return (
    <button
      className="shape-thumb-btn"
      title={icon.label}
      onClick={() => onSelect(icon.id)}
    >
      <svg
        width={W}
        height={H}
        viewBox={`${-pad} ${-pad} ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {renderShapeSvgContent(icon, w, h, '#4a7cdc', 'none', 0, {})}
      </svg>
      <span className="shape-thumb-label">{icon.label}</span>
    </button>
  );
}
