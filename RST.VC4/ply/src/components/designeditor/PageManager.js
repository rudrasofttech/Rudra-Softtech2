import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { DEFAULTS } from './constants';

// Helper: parse aspect ratio string (e.g. '16:9') into a numeric ratio.
// Mirrors the identical helper in Canvas.js for consistent dimension resolution.
function parseAspectRatio(ratio) {
  if (!ratio) return 16 / 9;
  const [w, h] = ratio.split(':').map(Number);
  return w && h ? w / h : 16 / 9;
}

// ThumbnailElement: lightweight, non-interactive CSS replica of a single design element.
// Mirrors the rendering logic from ElementControls.js without drag/resize/edit wiring.
// All style fallbacks use DEFAULTS from constants.js for consistency.
function ThumbnailElement({ element }) {
  const props = element.props || {};
  const style = element.style || {};
  // Absolute positioning matches the real canvas layout
  const base = {
    position: 'absolute',
    left: props.x,
    top: props.y,
    width: props.width,
    height: props.height,
    transform: props.rotation ? `rotate(${props.rotation}deg)` : undefined,
    zIndex: element.z ?? DEFAULTS.Z_INDEX_DEFAULT,
    pointerEvents: 'none', // thumbnails are purely visual — no interaction
    boxSizing: 'border-box',
  };
  const bw = style.borderWidth || DEFAULTS.BORDER_WIDTH;
  const bc = style.borderColor || DEFAULTS.BORDER_COLOR;
  const border = `${bw}px ${bw > 0 ? DEFAULTS.BORDER_STYLE_SOLID : DEFAULTS.BORDER_STYLE_NONE} ${bc}`;

  switch (element.type) {
    case 'rect': {
      const br = style.borderRadius || DEFAULTS.BORDER_RADIUS;
      return <div style={{ ...base, background: style.background || DEFAULTS.BACKGROUND_RECT, border, borderRadius: br }} />;
    }
    case 'ellipse': {
      // borderRadius for ellipse is a percentage (matches ElementControls.js behaviour)
      const br = `${style.borderRadius ?? DEFAULTS.ELLIPSE_BORDER_RADIUS_PCT}%`;
      return <div style={{ ...base, background: style.background || DEFAULTS.BACKGROUND_RECT, border, borderRadius: br }} />;
    }
    case 'line':
      return <div style={{ ...base, background: style.background || '#222222', borderRadius: 2 }} />;
    case 'image':
      return (
        <img
          src={props.src || DEFAULTS.PLACEHOLDER_IMAGE}
          alt=""
          style={{ ...base, objectFit: 'cover' }}
          draggable={false}
        />
      );
    case 'text': {
      // Compose text-decoration and text-shadow from style flags (mirrors ElementControls.js)
      const td = [
        style.underline ? 'underline' : '',
        style.wave ? DEFAULTS.WAVE_DECORATION : '',
      ].filter(Boolean).join(' ');
      const ts = [
        style.shadow ? DEFAULTS.SHADOW : '',
        style.glow ? DEFAULTS.GLOW : '',
      ].filter(Boolean).join(', ');
      return (
        <div style={{
          ...base,
          fontSize: (style.fontSize || DEFAULTS.FONT_SIZE) + 'px',
          fontFamily: style.fontFamily || '',
          color: style.color || DEFAULTS.TEXT_COLOR,
          background: style.background || DEFAULTS.BACKGROUND,
          fontWeight: style.bold ? 'bold' : 'normal',
          fontStyle: style.italic ? 'italic' : 'normal',
          textDecoration: td || 'none',
          textShadow: ts || 'none',
          border,
          borderRadius: style.borderRadius || DEFAULTS.BORDER_RADIUS,
          padding: (style.padding || 0) + 'px',
          textAlign: style.textAlign || DEFAULTS.TEXT_ALIGN,
          whiteSpace: 'pre-wrap',
          lineHeight: DEFAULTS.LINE_HEIGHT,
          overflow: 'hidden',
        }}>
          {element.content || ''}
        </div>
      );
    }
    default:
      return null;
  }
}

// PageCanvasThumbnail: CSS-scaled live replica of one page's canvas content.
// Resolves canvas dimensions with the same fallback logic as Canvas.js so the
// thumbnail always matches what the user sees on the main canvas.
// thumbWidth / thumbHeight: override the clip-box size (defaults to DEFAULTS.THUMBNAIL_WIDTH/HEIGHT
// for backward compat; PageManager passes PAGE_THUMB_MINI_W/H for the compact strip).
function PageCanvasThumbnail({ page, aspectRatio, thumbWidth, thumbHeight }) {
  const aspect = parseAspectRatio(aspectRatio);
  let width = page.canvasWidth;
  let height = page.canvasHeight;
  // Dimension resolution — mirrors Canvas.js exactly for backward compatibility
  if (typeof width === 'number' && typeof height === 'number') {
    // both explicit — use as-is
  } else if (typeof width === 'number') {
    height = Math.round(width / aspect);
  } else if (typeof height === 'number') {
    width = Math.round(height * aspect);
  } else {
    width = DEFAULTS.CANVAS_MAX_W;
    height = Math.round(width / aspect);
    if (height > DEFAULTS.CANVAS_MAX_H) {
      height = DEFAULTS.CANVAS_MAX_H;
      width = Math.round(height * aspect);
    }
  }

  // Fall back to the original full-size thumbnail dimensions if not supplied
  const THUMB_W = thumbWidth  || DEFAULTS.THUMBNAIL_WIDTH;
  const THUMB_H = thumbHeight || DEFAULTS.THUMBNAIL_HEIGHT;
  // Scale to contain the full canvas within the thumbnail slot (object-fit: contain behaviour)
  const scale = Math.min(THUMB_W / width, THUMB_H / height);
  // Center the scaled replica within the thumbnail box
  const offsetX = (THUMB_W - width * scale) / 2;
  const offsetY = (THUMB_H - height * scale) / 2;

  // Sort elements by z for correct paint order — matches Canvas.js sort
  const sorted = [...page.elements].sort((a, b) => {
    if (a.z === undefined && b.z === undefined) return 0;
    if (a.z === undefined) return -1;
    if (b.z === undefined) return 1;
    return a.z - b.z;
  });

  return (
    // Fixed-size clipping container — only the thumbnail area is visible
    <div className={DEFAULTS.PAGE_THUMB_CANVAS} style={{
      width: THUMB_W,
      height: THUMB_H,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Full-resolution canvas replica, CSS-scaled and centered inside the clip box */}
      <div style={{
        position: 'absolute',
        top: offsetY,
        left: offsetX,
        width,
        height,
        background: page.background || DEFAULTS.CANVAS_BG,
        border: `${page.borderWidth || DEFAULTS.BORDER_WIDTH}px ${(page.borderWidth || 0) > 0 ? DEFAULTS.BORDER_STYLE_SOLID : DEFAULTS.BORDER_STYLE_NONE} ${page.borderColor || DEFAULTS.BORDER_COLOR}`,
        borderRadius: page.borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS,
        overflow: 'hidden',
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }}>
        {sorted.map(el => <ThumbnailElement key={el.id} element={el} />)}
      </div>
    </div>
  );
}

// PageManager: a "Pages" button in the bottom toolbar that opens a drop-up panel.
// The panel contains a vertically scrollable list of live-preview thumbnails
// (max height PAGE_DROPUP_MAX_H = 400 px, scrolls beyond) and a "+ Add Page"
// button pinned below the list. Each row shows the page thumbnail, an overlay
// page-number badge, and an × remove button (only when >1 pages exist).
// Clicking outside the panel or selecting a page closes it automatically.
export default function PageManager() {
  const { state, dispatch, ActionTypes } = useEditor();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close the drop-up when the user clicks anywhere outside this component
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const pageCount = state.pages.length;

  return (
    // Positioning context — the drop-up panel is absolute relative to this div
    <div className={DEFAULTS.PAGE_DROPUP_WRAPPER} ref={wrapperRef}>
      {/* "Pages" toolbar button — shows total count badge when > 1 page */}
      <button
        type="button"
        className={`${DEFAULTS.BUTTON_CLASS} ${DEFAULTS.PAGE_DROPUP_BTN_CLASS}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Manage pages"
      >
        Pages{pageCount > 1 ? ` (${pageCount})` : ''}
      </button>

      {/* Drop-up panel — floats above the toolbar button when open */}
      {open && (
        <div className={DEFAULTS.PAGE_DROPUP_CLASS} role="listbox" aria-label="Pages">
          {/* Scrollable vertical thumbnail list — maxHeight applied inline so the
               value always reflects the PAGE_DROPUP_MAX_H constant */}
          <div
            className={DEFAULTS.PAGE_DROPUP_LIST_CLASS}
            style={{ maxHeight: DEFAULTS.PAGE_DROPUP_MAX_H }}
          >
            {state.pages.map((page, idx) => (
              <div
                key={page.id}
                className={`${DEFAULTS.PAGE_DROPUP_ITEM_CLASS}${idx === state.currentPage ? ' active' : ''}`}
                role="option"
                aria-selected={idx === state.currentPage}
                onClick={() => {
                  // Navigate to the clicked page and close the panel
                  dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: idx });
                  setOpen(false);
                }}
              >
                {/* Live-preview thumbnail with page-number overlay badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <PageCanvasThumbnail
                    page={page}
                    aspectRatio={state.aspectRatio}
                    thumbWidth={DEFAULTS.PAGE_THUMB_DROPUP_W}
                    thumbHeight={DEFAULTS.PAGE_THUMB_DROPUP_H}
                  />
                  <span className={DEFAULTS.PAGE_THUMB_LABEL}>{idx + 1}</span>
                </div>
                {/* × remove button — only when > 1 page exists.
                     stopPropagation prevents the row click from navigating. */}
                {pageCount > 1 && (
                  <button
                    type="button"
                    className={DEFAULTS.PAGE_DROPUP_REMOVE}
                    title={`Remove page ${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: ActionTypes.REMOVE_PAGE, payload: idx });
                    }}
                    aria-label={`Remove page ${idx + 1}`}
                  >×</button>
                )}
              </div>
            ))}
          </div>
          {/* "+ Add Page" pinned below the scrollable list — always visible */}
          <button
            type="button"
            className={DEFAULTS.PAGE_DROPUP_ADD_CLASS}
            onClick={() => dispatch({ type: ActionTypes.ADD_PAGE })}
            title="Add a new page"
          >
            + Add Page
          </button>
        </div>
      )}
    </div>
  );
}
