import React, { useState, useEffect, useRef } from 'react';
import { SHAPE_CATALOG, SHAPE_CATEGORIES, renderShapeSvgContent } from './shapes';

/**
 * ShapePicker — popup panel listing all shapes grouped by category.
 *
 * Props:
 *   onSelect(shapeId)  — called when user clicks a shape
 *   onClose()          — called when user dismisses the popup
 *   anchorRef          — ref to the trigger button (for positioning)
 */
export default function ShapePicker({ onSelect, onClose, anchorRef }) {
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
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

  const categories = ['All', ...SHAPE_CATEGORIES];

  const filtered = SHAPE_CATALOG.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch = !search || s.label.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group filtered shapes by category for display
  const grouped = {};
  filtered.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <div className="shape-picker-popup" ref={popupRef}>
      {/* Header */}
      <div className="shape-picker-header">
        <span className="shape-picker-title">Shapes</span>
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
          placeholder="Search shapes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {search && (
          <button className="shape-picker-search-clear" onClick={() => setSearch('')} title="Clear">
            <i className="bi bi-x-circle-fill" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="shape-picker-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`shape-picker-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shape grid — grouped by category */}
      <div className="shape-picker-body">
        {Object.keys(grouped).length === 0 && (
          <div className="shape-picker-empty">No shapes found</div>
        )}
        {Object.entries(grouped).map(([cat, shapes]) => (
          <div key={cat} className="shape-picker-group">
            {(activeCategory === 'All') && (
              <div className="shape-picker-group-label">{cat}</div>
            )}
            <div className="shape-picker-grid">
              {shapes.map(shape => (
                <ShapeThumb key={shape.id} shape={shape} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Individual shape thumbnail cell */
function ShapeThumb({ shape, onSelect }) {
  const W = 44, H = 36;
  const pad = 5;
  const w = W - pad * 2, h = H - pad * 2;
  return (
    <button
      className="shape-thumb-btn"
      title={shape.label}
      onClick={() => onSelect(shape.id)}
    >
      <svg
        width={W}
        height={H}
        viewBox={`${-pad} ${-pad} ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {renderShapeSvgContent(shape, w, h, '#4a7cdc', 'none', 0, {})}
      </svg>
      <span className="shape-thumb-label">{shape.label}</span>
    </button>
  );
}
