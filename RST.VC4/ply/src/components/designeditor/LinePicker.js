import React, { useState, useEffect, useRef } from 'react';
import { LINE_CATALOG, LINE_CATEGORIES, renderLineSvgContent } from './lines';

/**
 * LinePicker — popup panel listing all line types grouped by category.
 *
 * Props:
 *   onSelect(lineId)  — called when user clicks a line type
 *   onClose()         — called when user dismisses the popup
 *   anchorRef         — ref to the trigger button (used for outside-click detection)
 */
export default function LinePicker({ onSelect, onClose, anchorRef }) {
  const [search, setSearch]             = useState('');
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

  const categories = ['All', ...LINE_CATEGORIES];

  const filtered = LINE_CATALOG.filter(l => {
    const matchCat    = activeCategory === 'All' || l.category === activeCategory;
    const matchSearch = !search ||
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category for display
  const grouped = {};
  filtered.forEach(l => {
    if (!grouped[l.category]) grouped[l.category] = [];
    grouped[l.category].push(l);
  });

  return (
    <div className="shape-picker-popup" ref={popupRef}>
      {/* Header */}
      <div className="shape-picker-header">
        <span className="shape-picker-title">Lines</span>
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
          placeholder="Search lines…"
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

      {/* Line grid — grouped by category */}
      <div className="shape-picker-body">
        {Object.keys(grouped).length === 0 && (
          <div className="shape-picker-empty">No lines found</div>
        )}
        {Object.entries(grouped).map(([cat, lines]) => (
          <div key={cat} className="shape-picker-group">
            {activeCategory === 'All' && (
              <div className="shape-picker-group-label">{cat}</div>
            )}
            <div className="line-picker-grid">
              {lines.map(line => (
                <LineThumb key={line.id} line={line} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Individual line thumbnail cell — wide preview to show line pattern */
function LineThumb({ line, onSelect }) {
  const W = 88, H = 22;

  return (
    <button
      className="line-thumb-btn"
      title={line.label}
      onClick={() => onSelect(line.id)}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {renderLineSvgContent(line, W, H, '#4a7cdc', 2, '#4a7cdc')}
      </svg>
      <span className="shape-thumb-label">{line.label}</span>
    </button>
  );
}
