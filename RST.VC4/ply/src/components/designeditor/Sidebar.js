import React from 'react';
import { LayeringControls } from './ElementControls';
import { useEditor } from './EditorContext';
import { DEFAULTS } from './constants';
import CanvasSizePopup from './CanvasSizePopup';
import ShapePicker from './ShapePicker';
import { SHAPE_BY_ID, SHAPE_CATALOG } from './shapes';
import LinePicker from './LinePicker';
import { LINE_BY_ID, LINE_CATALOG } from './lines';

// ─── Shared color input: native picker + editable hex text field ──────────────
// onColorChange(colorString) — called with the new CSS color string
function ColorWithHex({ id, value, onColorChange, className, disabled }) {
  const [draft, setDraft] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  const safeValue = value || '#000000';
  const displayValue = focused ? draft : safeValue;

  function applyHex(raw) {
    let v = raw.trim();
    if (v && !v.startsWith('#')) v = '#' + v;
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(v)) {
      onColorChange(v);
    }
  }

  // The native color picker requires exactly a 6-digit hex; fall back gracefully
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(safeValue) ? safeValue : '#000000';

  return (
    <div className="d-flex align-items-center gap-1">
      <input
        id={id}
        type="color"
        value={pickerValue}
        onChange={e => { onColorChange(e.target.value); if (focused) setDraft(e.target.value); }}
        className={className || 'form-control form-control-color'}
        disabled={disabled}
        style={{ width: 34, height: 30, padding: 2, flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <input
        type="text"
        value={displayValue}
        onFocus={() => { setDraft(safeValue); setFocused(true); }}
        onBlur={() => { setFocused(false); applyHex(draft); }}
        onChange={e => { setDraft(e.target.value); applyHex(e.target.value); }}
        disabled={disabled}
        placeholder="#000000"
        className="form-control form-control-sm"
        style={{ width: 84, fontFamily: 'monospace', fontSize: 12 }}
        maxLength={9}
        spellCheck={false}
        aria-label="Hex color code"
      />
    </div>
  );
}

// ─── Add Element Panel (narrow left sidebar) ─────────────────────────────────
export default function Sidebar() {
  const { state, dispatch, ActionTypes } = useEditor();
  const [showShapePicker, setShowShapePicker] = React.useState(false);
  const [showLinePicker,  setShowLinePicker]  = React.useState(false);
  const shapesBtnRef = React.useRef();
  const linesBtnRef  = React.useRef();

  // Hidden file-input ref: triggered by "Add Image" before any element is created
  const imageFileInputRef = React.useRef();

  // Reads the selected image file, measures its natural dimensions, then dispatches
  // ADD_ELEMENT with the real data-URL src and clamped dimensions.
  // Called only after the user confirms a file in the dialog (no placeholder ever added).
  function handleImageFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    // Reset input so the same file can be re-selected later
    e.target.value = '';
    if (!file) return;

    // Compute canvas center using the same fallback logic as handleAdd / Canvas.js
    const page = state.pages[state.currentPage];
    const parseAR = r => { if (!r) return 16 / 9; const [w, h] = r.split(':').map(Number); return (w && h) ? w / h : 16 / 9; };
    const ar = parseAR(state.aspectRatio);
    let cW = page.canvasWidth, cH = page.canvasHeight;
    if (typeof cW === 'number' && typeof cH === 'number') { /* both explicitly set */ }
    else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
    else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
    else {
      cW = DEFAULTS.CANVAS_MAX_W;
      cH = Math.round(cW / ar);
      if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        // Constrain to IMAGE_MAX, preserving original aspect ratio
        if (width > DEFAULTS.IMAGE_MAX || height > DEFAULTS.IMAGE_MAX) {
          const ratio = Math.min(DEFAULTS.IMAGE_MAX / width, DEFAULTS.IMAGE_MAX / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }
        // Center the image on the canvas using its actual (clamped) dimensions
        const centerX = Math.max(0, Math.round((cW - width)  / 2));
        const centerY = Math.max(0, Math.round((cH - height) / 2));
        dispatch({
          type: ActionTypes.ADD_ELEMENT,
          payload: {
            id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'image',
            props: { x: centerX, y: centerY, width, height, rotation: DEFAULTS.ROTATION, src: ev.target.result },
            style: { background: DEFAULTS.BACKGROUND_IMAGE, borderRadius: DEFAULTS.BORDER_RADIUS },
          },
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Handler for adding new elements (ensures required props for each type)
  const handleAdd = type => {
    // Compute effective canvas dimensions for center placement (mirrors Canvas.js dimension logic)
    const page = state.pages[state.currentPage];
    const parseAR = r => { if (!r) return 16 / 9; const [w, h] = r.split(':').map(Number); return (w && h) ? w / h : 16 / 9; };
    const ar = parseAR(state.aspectRatio);
    let cW = page.canvasWidth, cH = page.canvasHeight;
    if (typeof cW === 'number' && typeof cH === 'number') { /* both explicitly set */ }
    else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
    else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
    else {
      cW = DEFAULTS.CANVAS_MAX_W;
      cH = Math.round(cW / ar);
      if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
    }
    // Determine element height by type to calculate vertical center offset
    let elH = DEFAULTS.LINE_HEIGHT_PX;
    if (type === 'text') elH = DEFAULTS.TEXT_HEIGHT;
    else if (type === 'image') elH = DEFAULTS.IMAGE_HEIGHT;
    // Place new element near center of canvas using DEFAULTS element width
    const centerX = Math.max(0, Math.round((cW - DEFAULTS.IMAGE_WIDTH) / 2));
    const centerY = Math.max(0, Math.round((cH - elH) / 2));

    // Default props for new elements
    const base = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      props: { x: centerX, y: centerY, width: DEFAULTS.IMAGE_WIDTH, height: DEFAULTS.LINE_HEIGHT_PX, rotation: DEFAULTS.ROTATION },
      style: {},
    };
    if (type === 'text') {
      base.props.height = DEFAULTS.TEXT_HEIGHT;
      base.content = 'Text';
      base.style = { fontSize: DEFAULTS.FONT_SIZE, color: DEFAULTS.TEXT_COLOR, background: DEFAULTS.BACKGROUND_TEXT, borderRadius: DEFAULTS.BORDER_RADIUS };
    } else if (type === 'image') {
      // Open file dialog immediately; element is created inside handleImageFileSelected
      // once the user confirms a selection. No placeholder is added to the canvas.
      imageFileInputRef.current.click();
      return;
    } else if (type === 'line') {
      base.props.height = DEFAULTS.LINE_HEIGHT_PX;
      base.style = { background: '#222222' };
    }
    dispatch({ type: ActionTypes.ADD_ELEMENT, payload: base });
  };

  // Handler for adding a shape element from the ShapePicker
  const handleAddShape = (shapeId) => {
    setShowShapePicker(false);
    const shapeDef = SHAPE_BY_ID[shapeId];
    if (!shapeDef) return;
    const page = state.pages[state.currentPage];
    const parseAR = r => { if (!r) return 16 / 9; const [w, h] = r.split(':').map(Number); return (w && h) ? w / h : 16 / 9; };
    const ar = parseAR(state.aspectRatio);
    let cW = page.canvasWidth, cH = page.canvasHeight;
    if (typeof cW === 'number' && typeof cH === 'number') { /* both set */ }
    else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
    else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
    else {
      cW = DEFAULTS.CANVAS_MAX_W;
      cH = Math.round(cW / ar);
      if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
    }
    const w = shapeDef.defaultW;
    const h = shapeDef.defaultH;
    const centerX = Math.max(0, Math.round((cW - w) / 2));
    const centerY = Math.max(0, Math.round((cH - h) / 2));
    dispatch({
      type: ActionTypes.ADD_ELEMENT,
      payload: {
        id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'shape',
        shapeId,
        props: { x: centerX, y: centerY, width: w, height: h, rotation: DEFAULTS.ROTATION },
        style: { fill: DEFAULTS.BACKGROUND_RECT, stroke: 'none', strokeWidth: 0, cornerRadius: 0 },
      },
    });
  };

  // Handler for adding a line element from the LinePicker
  const handleAddLine = (lineId) => {
    setShowLinePicker(false);
    const lineDef = LINE_BY_ID[lineId];
    if (!lineDef) return;
    const page = state.pages[state.currentPage];
    const parseAR = r => { if (!r) return 16 / 9; const [w, h] = r.split(':').map(Number); return (w && h) ? w / h : 16 / 9; };
    const ar = parseAR(state.aspectRatio);
    let cW = page.canvasWidth, cH = page.canvasHeight;
    if (typeof cW === 'number' && typeof cH === 'number') { /* both set */ }
    else if (typeof cW === 'number') { cH = Math.round(cW / ar); }
    else if (typeof cH === 'number') { cW = Math.round(cH * ar); }
    else {
      cW = DEFAULTS.CANVAS_MAX_W;
      cH = Math.round(cW / ar);
      if (cH > DEFAULTS.CANVAS_MAX_H) { cH = DEFAULTS.CANVAS_MAX_H; cW = Math.round(cH * ar); }
    }
    const w = lineDef.defaultW;
    const h = lineDef.defaultH;
    const centerX = Math.max(0, Math.round((cW - w) / 2));
    const centerY = Math.max(0, Math.round((cH - h) / 2));
    dispatch({
      type: ActionTypes.ADD_ELEMENT,
      payload: {
        id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'line',
        lineId,
        props: { x: centerX, y: centerY, width: w, height: h, rotation: DEFAULTS.ROTATION },
        style: { stroke: '#222222', strokeWidth: 2, fill: '#222222' },
      },
    });
  };

  const elementTypes = [
    { type: 'text',  icon: 'bi-fonts',  label: 'Text'  },
    { type: 'image', icon: 'bi-image',  label: 'Image' },
  ];

  return (
    <div className="editor-add-panel">
      <span className="add-panel-heading">Add</span>

      {/* Shapes button — opens ShapePicker popup */}
      <div className="add-element-btn-wrapper" style={{ position: 'relative' }}>
        <button
          ref={shapesBtnRef}
          className={`add-element-btn${showShapePicker ? ' active' : ''}`}
          onClick={() => { setShowLinePicker(false); setShowShapePicker(v => !v); }}
          title="Add Shape"
        >
          <i className="bi bi-pentagon add-element-icon" />
          <span className="add-element-label">Shapes</span>
        </button>
        {showShapePicker && (
          <ShapePicker
            onSelect={handleAddShape}
            onClose={() => setShowShapePicker(false)}
            anchorRef={shapesBtnRef}
          />
        )}
      </div>

      {/* Lines button — opens LinePicker popup */}
      <div className="add-element-btn-wrapper" style={{ position: 'relative' }}>
        <button
          ref={linesBtnRef}
          className={`add-element-btn${showLinePicker ? ' active' : ''}`}
          onClick={() => { setShowShapePicker(false); setShowLinePicker(v => !v); }}
          title="Add Line"
        >
          <i className="bi bi-hr add-element-icon" />
          <span className="add-element-label">Lines</span>
        </button>
        {showLinePicker && (
          <LinePicker
            onSelect={handleAddLine}
            onClose={() => setShowLinePicker(false)}
            anchorRef={linesBtnRef}
          />
        )}
      </div>

      {elementTypes.map(el => (
        <button
          key={el.type}
          className="add-element-btn"
          onClick={() => handleAdd(el.type)}
          title={`Add ${el.label}`}
        >
          <i className={`bi ${el.icon} add-element-icon`} />
          <span className="add-element-label">{el.label}</span>
        </button>
      ))}
      {/* Hidden file input used exclusively by the "Add Image" button. */}
      <input
        type="file"
        accept={DEFAULTS.IMAGE_ACCEPT}
        ref={imageFileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageFileSelected}
      />
    </div>
  );
}

// ─── Floating Properties Panel (right side, frosted glass over canvas) ────────
export function PropertiesPanel() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showCanvasPopup, setShowCanvasPopup] = React.useState(false);
  const { state, dispatch, ActionTypes } = useEditor();

  // ── Draggable panel ────────────────────────────────────────────────────────
  // null = default CSS position (top-right corner); {x, y} = user-dragged position
  const [panelPos, setPanelPos] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const panelRef = React.useRef(null);
  // dragRef holds mutable drag data to avoid stale closures inside event listeners
  const dragRef = React.useRef({ active: false, startMouseX: 0, startMouseY: 0, startPanelX: 0, startPanelY: 0 });

  // Starts a drag when the user presses the header (but not the toggle button)
  function onHeaderMouseDown(e) {
    if (e.target.closest('.properties-panel-toggle')) return;
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel || !panel.offsetParent) return;
    const panelRect = panel.getBoundingClientRect();
    const contRect  = panel.offsetParent.getBoundingClientRect();
    // Record mouse start and panel origin (coords relative to the container)
    dragRef.current = {
      active: true,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPanelX: panelRect.left - contRect.left,
      startPanelY: panelRect.top  - contRect.top,
    };
    setIsDragging(true);
  }

  // Global mousemove/mouseup listeners — registered once (panelRef and dragRef are stable)
  React.useEffect(() => {
    function onMouseMove(e) {
      if (!dragRef.current.active) return;
      const panel = panelRef.current;
      if (!panel || !panel.offsetParent) return;
      const container = panel.offsetParent;
      const { startMouseX, startMouseY, startPanelX, startPanelY } = dragRef.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      // Clamp within the canvas container bounds — panel cannot leave the editing area
      const maxX = Math.max(0, container.offsetWidth  - panel.offsetWidth);
      const maxY = Math.max(0, container.offsetHeight - panel.offsetHeight);
      setPanelPos({
        x: Math.max(0, Math.min(startPanelX + dx, maxX)),
        y: Math.max(0, Math.min(startPanelY + dy, maxY)),
      });
    }
    function onMouseUp() {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setIsDragging(false);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []); // panelRef and dragRef are stable refs — empty dep array is intentional
  // ──────────────────────────────────────────────────────────────────────────

  const selectedElement = state.selectedElementId
    ? state.pages[state.currentPage].elements.find(el => el.id === state.selectedElementId)
    : null;

  // Handler for canvas size
  const handleApplyCanvasSize = (width, height, aspectRatio) => {
    dispatch({ type: 'SET_CANVAS_SIZE', payload: { pageIndex: state.currentPage, width, height, aspectRatio } });
  };

  // Handler for style change (border, color, etc)
  function handleStyleChange(field, value) {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: { ...selectedElement, style: { ...selectedElement.style, [field]: value } }
    });
  }

  // Handler for property change
  function handlePropChange(field, value) {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: { ...selectedElement, props: { ...selectedElement.props, [field]: value } }
    });
  }

  // Handler for top-level field change (content, etc)
  function handleFieldChange(field, value) {
    if (!selectedElement) return;
    dispatch({ type: ActionTypes.UPDATE_ELEMENT, payload: { ...selectedElement, [field]: value } });
  }

  // Common controls rendered for every selected element type:
  // opacity, flip H/V, lock/unlock, and box shadow (not for line).
  function renderCommonControls() {
    if (!selectedElement) return null;
    const { type, style = {}, props = {} } = selectedElement;
    return (
      <div className="mb-2" style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>
        {/* Opacity */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Opacity: {Math.round((style.opacity ?? 1) * 100)}%</label>
          <input
            type="range" min={0} max={100}
            value={Math.round((style.opacity ?? 1) * 100)}
            onChange={e => handleStyleChange('opacity', parseFloat(e.target.value) / 100)}
            className="form-range"
          />
        </div>
        {/* Flip */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Flip</label>
          <div className="btn-group w-100">
            <button
              type="button"
              className={`btn btn-sm btn-outline-secondary${props.flipX ? ' active' : ''}`}
              title="Flip Horizontal"
              onClick={() => dispatch({
                type: ActionTypes.UPDATE_ELEMENT,
                payload: { ...selectedElement, props: { ...props, flipX: !props.flipX } },
              })}
            >⇔ Flip H</button>
            <button
              type="button"
              className={`btn btn-sm btn-outline-secondary${props.flipY ? ' active' : ''}`}
              title="Flip Vertical"
              onClick={() => dispatch({
                type: ActionTypes.UPDATE_ELEMENT,
                payload: { ...selectedElement, props: { ...props, flipY: !props.flipY } },
              })}
            >⇕ Flip V</button>
          </div>
        </div>
        {/* Lock */}
        <div className={DEFAULTS.FORM_GROUP}>
          <button
            type="button"
            className={`btn btn-sm w-100 ${selectedElement.locked ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => dispatch({
              type: ActionTypes.UPDATE_ELEMENT,
              payload: { ...selectedElement, locked: !selectedElement.locked },
            })}
            title={selectedElement.locked ? 'Unlock element' : 'Lock element (prevent drag/resize)'}
          >
            <i className={`bi bi-${selectedElement.locked ? 'lock-fill' : 'unlock'} me-1`} />
            {selectedElement.locked ? 'Locked' : 'Lock Element'}
          </button>
        </div>
        {/* Box Shadow (not for lines) */}
        {type !== 'line' && (
          <div className={DEFAULTS.FORM_GROUP}>
            <div className="form-check mb-1">
              <input
                type="checkbox"
                className={DEFAULTS.FORM_CHECK_INPUT}
                id="box-shadow-enabled"
                checked={!!style.boxShadowEnabled}
                onChange={e => handleStyleChange('boxShadowEnabled', e.target.checked)}
              />
              <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor="box-shadow-enabled">Box Shadow</label>
            </div>
            {style.boxShadowEnabled && (
              <div style={{ paddingLeft: 4 }}>
                <div className="d-flex gap-1 mb-1" style={{ fontSize: 11 }}>
                  <div style={{ flex: 1 }}>
                    <label className={DEFAULTS.FORM_LABEL} style={{ fontSize: 10 }}>X: {style.boxShadowX ?? 2}</label>
                    <input type="range" min={-30} max={30} value={style.boxShadowX ?? 2}
                      onChange={e => handleStyleChange('boxShadowX', parseInt(e.target.value))}
                      className="form-range" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={DEFAULTS.FORM_LABEL} style={{ fontSize: 10 }}>Y: {style.boxShadowY ?? 4}</label>
                    <input type="range" min={-30} max={30} value={style.boxShadowY ?? 4}
                      onChange={e => handleStyleChange('boxShadowY', parseInt(e.target.value))}
                      className="form-range" />
                  </div>
                </div>
                <div className="d-flex gap-1 mb-1" style={{ fontSize: 11 }}>
                  <div style={{ flex: 1 }}>
                    <label className={DEFAULTS.FORM_LABEL} style={{ fontSize: 10 }}>Blur: {style.boxShadowBlur ?? 8}</label>
                    <input type="range" min={0} max={60} value={style.boxShadowBlur ?? 8}
                      onChange={e => handleStyleChange('boxShadowBlur', parseInt(e.target.value))}
                      className="form-range" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={DEFAULTS.FORM_LABEL} style={{ fontSize: 10 }}>Color</label>
                    <ColorWithHex
                      value={style.boxShadowColor ?? '#000000'}
                      onColorChange={v => handleStyleChange('boxShadowColor', v)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handler for deleting selected element
  function handleDelete() {
    if (!selectedElement) return;
    dispatch({ type: ActionTypes.DELETE_ELEMENT, payload: selectedElement.id });
  }

  // Text style toggle buttons
  function renderTextStyleControls() {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    const style = selectedElement.style || {};
    return (
      <div className="mb-3">
        <label className="prop-section-label">Text Style</label>
        <div className="btn-group w-100" role="group">
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.bold ? ' active' : ''}`} title="Bold" onClick={() => handleStyleChange('bold', !style.bold)}><b>B</b></button>
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.italic ? ' active' : ''}`} title="Italic" onClick={() => handleStyleChange('italic', !style.italic)}><i>I</i></button>
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.underline ? ' active' : ''}`} title="Underline" onClick={() => handleStyleChange('underline', !style.underline)}><u>U</u></button>
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.shadow ? ' active' : ''}`} title="Shadow" onClick={() => handleStyleChange('shadow', !style.shadow)}>S</button>
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.glow ? ' active' : ''}`} title="Glow" onClick={() => handleStyleChange('glow', !style.glow)}>G</button>
          <button type="button" className={`btn btn-sm btn-outline-secondary${style.wave ? ' active' : ''}`} title="Wave" onClick={() => handleStyleChange('wave', !style.wave)}>W</button>
        </div>
      </div>
    );
  }

  // Text element shortcuts and style controls
  function renderTextShortcuts() {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    const style = selectedElement.style || {};
    // Helper to apply preset while preserving fontFamily
    function applyPreset(preset) {
      dispatch({
        type: ActionTypes.UPDATE_ELEMENT,
        payload: {
          ...selectedElement,
          style: {
            ...style,
            ...preset,
            fontFamily: style.fontFamily || '',
          },
        },
      });
    }
    return (
      <div className="mb-2">
        <label className="prop-section-label">Text Presets</label>
        <div className="btn-group w-100 mb-2" role="group">
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applyPreset({ fontSize: 32, fontWeight: 'bold', letterSpacing: 0.5 })}>Heading</button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applyPreset({ fontSize: 24, fontWeight: 600, letterSpacing: 0.2 })}>Sub Heading</button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applyPreset({ fontSize: 16, fontWeight: 'normal', letterSpacing: 0 })}>Body Text</button>
        </div>
      </div>
    );
  }

  // Render property fields for the selected element
  function renderFields() {
    if (!selectedElement) return null;
    const { type, style = {}, props = {}, content } = selectedElement;
    // Border fields (shared by most types)
    const borderFields = (
      <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="el-border-color" className={DEFAULTS.FORM_LABEL}>Border Color</label>
          <ColorWithHex id="el-border-color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onColorChange={v => handleStyleChange('borderColor', v)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          {/* For ellipse: value is 0–100 interpreted as %, giving 50% = perfect oval/circle */}
          <label htmlFor="el-border-radius" className={DEFAULTS.FORM_LABEL}>Border Radius: {style.borderRadius ?? DEFAULTS.BORDER_RADIUS}{type === 'ellipse' ? '%' : 'px'}</label>
          <input id="el-border-radius" type="range" min={0} max={100} value={style.borderRadius ?? DEFAULTS.BORDER_RADIUS} onChange={e => handleStyleChange('borderRadius', parseInt(e.target.value))} />
        </div>
      </>
    );
    // Shape (SVG-based)
    if (type === 'shape') {
      const shapeDef = SHAPE_BY_ID[selectedElement.shapeId];
      const isFillTransparent = style.fill === 'transparent' || style.fill === 'none';
      const hasCornerRadius   = shapeDef && (shapeDef.id === 'rectangle' || shapeDef.id === 'rounded-rect');
      return <>
        {/* Shape switcher */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Shape</label>
          <select
            className="form-select form-select-sm"
            value={selectedElement.shapeId || ''}
            onChange={e => dispatch({
              type: ActionTypes.UPDATE_ELEMENT,
              payload: { ...selectedElement, shapeId: e.target.value },
            })}
          >
            {SHAPE_CATALOG.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        {/* Fill */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Fill Color</label>
          <ColorWithHex
            value={isFillTransparent ? '#eeeeee' : (style.fill || '#eeeeee')}
            onColorChange={v => handleStyleChange('fill', v)}
            disabled={isFillTransparent}
          />
          <div className="form-check mt-1">
            <input
              type="checkbox"
              className={DEFAULTS.FORM_CHECK_INPUT}
              id="fill-transp-shape"
              checked={isFillTransparent}
              onChange={e => handleStyleChange('fill', e.target.checked ? 'transparent' : '#eeeeee')}
            />
            <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor="fill-transp-shape">Transparent</label>
          </div>
        </div>
        {/* Stroke */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Stroke Color</label>
          <ColorWithHex
            value={style.stroke === 'none' || !style.stroke ? '#000000' : style.stroke}
            onColorChange={v => handleStyleChange('stroke', v)}
            disabled={style.stroke === 'none' || !style.stroke}
          />
          <div className="form-check mt-1">
            <input
              type="checkbox"
              className={DEFAULTS.FORM_CHECK_INPUT}
              id="stroke-none-shape"
              checked={!style.stroke || style.stroke === 'none'}
              onChange={e => handleStyleChange('stroke', e.target.checked ? 'none' : '#000000')}
            />
            <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor="stroke-none-shape">No Stroke</label>
          </div>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Stroke Width: {style.strokeWidth ?? 0}</label>
          <input
            type="range"
            min={0} max={20}
            value={style.strokeWidth ?? 0}
            onChange={e => handleStyleChange('strokeWidth', parseInt(e.target.value) || 0)}
            className="form-range"
            disabled={style.stroke === 'none' || !style.stroke}
          />
        </div>
        {/* Corner radius — only shown for rectangle shapes */}
        {hasCornerRadius && (
          <div className={DEFAULTS.FORM_GROUP}>
            <label className={DEFAULTS.FORM_LABEL}>Corner Radius: {style.cornerRadius ?? 0}</label>
            <input
              type="range"
              min={0} max={60}
              value={style.cornerRadius ?? 0}
              onChange={e => handleStyleChange('cornerRadius', parseInt(e.target.value) || 0)}
              className="form-range"
            />
          </div>
        )}
      </>;
    }
    // Rectangle & Ellipse
    if (type === 'rect' || type === 'ellipse') {
      const isTransparent = style.background === DEFAULTS.BACKGROUND;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Background</label>
          <ColorWithHex value={isTransparent ? DEFAULTS.BACKGROUND_RECT : (style.background || DEFAULTS.BACKGROUND_RECT)} onColorChange={v => handleStyleChange('background', v)} disabled={isTransparent} />
          <div className="form-check mt-1">
            <input type="checkbox" className={DEFAULTS.FORM_CHECK_INPUT} id={`bgtransp-${type}`} checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? DEFAULTS.BACKGROUND : DEFAULTS.BACKGROUND_RECT)} />
            <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor={`bgtransp-${type}`}>Transparent</label>
          </div>

        </div>
        {borderFields}
        {/* Letter Spacing & Line Height — text only */}
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Letter Spacing: {style.letterSpacing ?? 0}px</label>
          <input type="range" className="form-range" min={-5} max={20} step={0.5}
            value={style.letterSpacing ?? 0}
            onChange={e => handleStyleChange('letterSpacing', parseFloat(e.target.value))}
          />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Line Height: {style.lineHeight ?? 1.4}</label>
          <input type="range" className="form-range" min={0.8} max={4} step={0.1}
            value={style.lineHeight ?? 1.4}
            onChange={e => handleStyleChange('lineHeight', parseFloat(e.target.value))}
          />
        </div>
      </>;
    }
    // Line element
    if (type === 'line') {
      // ── New SVG line (has lineId) ─────────────────────────────────────────
      if (selectedElement.lineId) {
        const lineDef = LINE_BY_ID[selectedElement.lineId];
        const isSymbolLine = lineDef && ['Card Suits', 'Symbols'].includes(lineDef.category);
        return <>
          {/* Line type switcher */}
          <div className={DEFAULTS.FORM_GROUP}>
            <label className={DEFAULTS.FORM_LABEL}>Line Type</label>
            <select
              className="form-select form-select-sm"
              value={selectedElement.lineId || ''}
              onChange={e => dispatch({
                type: ActionTypes.UPDATE_ELEMENT,
                payload: { ...selectedElement, lineId: e.target.value },
              })}
            >
              {LINE_CATALOG.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          {/* Color */}
          <div className={DEFAULTS.FORM_GROUP}>
            <label className={DEFAULTS.FORM_LABEL}>Color</label>
            <ColorWithHex
              value={style.stroke || '#222222'}
              onColorChange={v => handleStyleChange('stroke', v)}
            />
          </div>
          {/* Stroke width — controls both visual thickness and bounding-box height */}
          {!isSymbolLine && (
            <div className={DEFAULTS.FORM_GROUP}>
              <label className={DEFAULTS.FORM_LABEL}>Stroke Width: {style.strokeWidth ?? 2}</label>
              <input
                type="range" min={1} max={24}
                value={style.strokeWidth ?? 2}
                onChange={e => {
                  const sw = parseInt(e.target.value) || 2;
                  // Update both style.strokeWidth and the bounding-box height together so
                  // the element's visual size always matches what is stored in props.
                  const newH = sw + DEFAULTS.LINE_STROKE_HEIGHT_PADDING * 2;
                  dispatch({
                    type: ActionTypes.UPDATE_ELEMENT,
                    payload: {
                      ...selectedElement,
                      style: { ...(selectedElement.style || {}), strokeWidth: sw },
                      props: { ...(selectedElement.props || {}), height: newH },
                    },
                  });
                }}
                className="form-range"
              />
            </div>
          )}
          {/* Symbol fill color — shown for card suit / symbol lines */}
          {isSymbolLine && (
            <div className={DEFAULTS.FORM_GROUP}>
              <label className={DEFAULTS.FORM_LABEL}>Symbol Color</label>
              <ColorWithHex
                value={style.fill || style.stroke || '#222222'}
                onColorChange={v => handleStyleChange('fill', v)}
              />
            </div>
          )}
        </>;
      }
      // ── Legacy line (no lineId — backward compat) ─────────────────────────
      const canvasWidth = state.pages[state.currentPage].canvasWidth || DEFAULTS.CANVAS_MAX_W;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Line Color</label>
          <ColorWithHex value={style.background || '#222222'} onColorChange={v => handleStyleChange('background', v)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Length: {props.width || 20}</label>
          <input type="range" min={20} max={canvasWidth} value={props.width || 20} onChange={e => handlePropChange('width', parseInt(e.target.value) || 20)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Stroke Width: {style.strokeWidth ?? DEFAULTS.LINE_HEIGHT_PX}</label>
          <input
            type="range" min={1} max={24}
            value={style.strokeWidth ?? DEFAULTS.LINE_HEIGHT_PX}
            onChange={e => {
              const sw = parseInt(e.target.value) || DEFAULTS.LINE_HEIGHT_PX;
              const newH = sw + DEFAULTS.LINE_STROKE_HEIGHT_PADDING * 2;
              dispatch({
                type: ActionTypes.UPDATE_ELEMENT,
                payload: {
                  ...selectedElement,
                  style: { ...(selectedElement.style || {}), strokeWidth: sw },
                  props: { ...(selectedElement.props || {}), height: newH },
                },
              });
            }}
          />
        </div>
      </>;
    }
    // Text
    if (type === 'text') {
      const isTransparent = style.background === DEFAULTS.BACKGROUND;
      return <>
        <div className="form-group mb-2">
          <label className="form-label">Text</label>
          <input type="text" value={content || ''} onChange={e => handleFieldChange('content', e.target.value)} className="form-control" />
        </div>
        <div className="form-group mb-2">
          <div className='mb-2'>
            <label className="form-label">Font Family</label>
            <select value={style.fontFamily || ''} onChange={e => handleStyleChange('fontFamily', e.target.value)} className="form-select">
              <option value="">Default</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Verdana, Geneva, sans-serif">Verdana</option>
              <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
              <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
              <option value="'Courier New', Courier, monospace">Courier New</option>
              <option value="Impact, Charcoal, sans-serif">Impact</option>
              <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans MS</option>
              <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
              <option value="'Lucida Sans Unicode', 'Lucida Grande', sans-serif">Lucida Sans</option>
              <option value="Garamond, serif">Garamond</option>
              <option value="Palatino, 'Palatino Linotype', serif">Palatino</option>
              <option value="'Arial Black', Gadget, sans-serif">Arial Black</option>
              <option value="'Brush Script MT', cursive">Brush Script MT</option>
            </select>
          </div>
          <div className='mb-2'>
            <label className="form-label">Font Size: {style.fontSize || DEFAULTS.FONT_SIZE}</label>
            <input className='form-range' type="range" min={8} max={100} value={style.fontSize || DEFAULTS.FONT_SIZE} onChange={e => handleStyleChange('fontSize', parseInt(e.target.value) || DEFAULTS.FONT_SIZE)} />
          </div>
          <div className='mb-2'>
            <label className="form-label">Font Color</label>
            <ColorWithHex value={style.color || DEFAULTS.TEXT_COLOR} onColorChange={v => handleStyleChange('color', v)} />
          </div>
        </div>
        <div className="form-group my-2">
          <label className="form-label">Background</label>
          <ColorWithHex value={isTransparent ? '#ffffff' : (style.background || '#ffffff')} onColorChange={v => handleStyleChange('background', v)} disabled={isTransparent} />
          <div className="form-check mt-1">
            <input type="checkbox" className="form-check-input" id="bgtransp-text" checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? 'transparent' : '#ffffff')} />
            <label className="form-check-label" htmlFor="bgtransp-text">Transparent</label>
          </div>

        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <div className='mb-2'>
            <label className={DEFAULTS.FORM_LABEL}>Padding: {style.padding || 0}</label>
            <input type="range" className='form-range' min={0} max={100} value={style.padding || 0} onChange={e => handleStyleChange('padding', parseInt(e.target.value) || 0)} />
          </div>
          <div className='mb-2'>
            <label className={DEFAULTS.FORM_LABEL}>Text Align</label>
            <select value={style.textAlign || 'left'} onChange={e => handleStyleChange('textAlign', e.target.value)} className="form-select">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
        {borderFields}
      </>;
    }
    // Image
    if (type === 'image') {
      const isTransparent = style.background === 'transparent';
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <button type="button" className={DEFAULTS.BUTTON_OUTLINE} onClick={() => {
            // Trigger file dialog via ElementControls (image file input)
            const fileInput = document.querySelector(`.${DEFAULTS.EDITOR_IMAGE_SELECTABLE} ~ input[type="file"]`);
            if (fileInput) fileInput.click();
          }}>Select Image File</button>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="img-bg-color" className={DEFAULTS.FORM_LABEL}>Background</label>
          <ColorWithHex id="img-bg-color" value={isTransparent ? DEFAULTS.BACKGROUND_IMAGE : (style.background || DEFAULTS.BACKGROUND_IMAGE)} onColorChange={v => handleStyleChange('background', v)} disabled={isTransparent} />
          <div className="form-check mt-1">
            <input type="checkbox" className={DEFAULTS.FORM_CHECK_INPUT} id="bgtransp-image" checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? DEFAULTS.BACKGROUND : DEFAULTS.BACKGROUND_IMAGE)} />
            <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor="bgtransp-image">Transparent</label>
          </div>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="img-padding" className={DEFAULTS.FORM_LABEL}>Padding: {style.padding || 0}</label>
          <input id="img-padding" type="range" className='form-range' min={0} max={100} value={style.padding || 0} onChange={e => handleStyleChange('padding', parseInt(e.target.value) || 0)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="img-border-width" className={DEFAULTS.FORM_LABEL}>Border Width: {style.borderWidth || DEFAULTS.BORDER_WIDTH}</label>
          <input id="img-border-width" type="range" className='form-range' min={0} max={100} value={style.borderWidth || DEFAULTS.BORDER_WIDTH} onChange={e => handleStyleChange('borderWidth', parseInt(e.target.value) || DEFAULTS.BORDER_WIDTH)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="img-border-color" className={DEFAULTS.FORM_LABEL}>Border Color</label>
          <ColorWithHex id="img-border-color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onColorChange={v => handleStyleChange('borderColor', v)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="img-border-radius" className={DEFAULTS.FORM_LABEL}>Border Radius: {style.borderRadius || DEFAULTS.BORDER_RADIUS}</label>
          <input id="img-border-radius" type="range" className='form-range' min={0} max={100} value={style.borderRadius || DEFAULTS.BORDER_RADIUS} onChange={e => handleStyleChange('borderRadius', parseInt(e.target.value) || DEFAULTS.BORDER_RADIUS)} />
        </div>
      </>;
    }
    return null;
  }

  // Determine panel title based on selection
  const panelTitle = selectedElement
    ? selectedElement.type === 'shape'
      ? (SHAPE_BY_ID[selectedElement.shapeId]?.label ?? 'Shape')
      : selectedElement.type === 'line' && selectedElement.lineId
        ? (LINE_BY_ID[selectedElement.lineId]?.label ?? 'Line')
        : selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
    : 'Canvas';

  // Inline position style: switches from CSS right/top to explicit left/top once dragged
  const posStyle = panelPos
    ? { top: panelPos.y, left: panelPos.x, right: 'auto' }
    : undefined;

  return (
    <div
      ref={panelRef}
      className={`properties-panel${collapsed ? ' properties-panel--collapsed' : ''}${isDragging ? ' properties-panel--dragging' : ''}`}
      style={posStyle}
    >
      {/* Panel header — drag handle (click-and-drag moves the panel) */}
      <div className="properties-panel-header" onMouseDown={onHeaderMouseDown}>
        {/* Title is always rendered — even in collapsed state.
             In collapsed state CSS rotates it to vertical text so it remains
             readable inside the narrow 40px panel (see editor.css). */}
        <span className="properties-panel-title">
          {selectedElement && <i className={`bi bi-${
            selectedElement.type === 'shape'   ? 'pentagon' :
            selectedElement.type === 'rect'    ? 'square' :
            selectedElement.type === 'ellipse' ? 'circle' :
            selectedElement.type === 'line'    ? 'dash-lg' :
            selectedElement.type === 'text'    ? 'fonts' : 'image'
          } me-1`} />}
          {panelTitle}
        </span>
        <button
          className="properties-panel-toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Show Properties' : 'Collapse Properties'}
        >
          <i className={`bi bi-chevron-${collapsed ? 'left' : 'right'}`} />
        </button>
      </div>

      {/* Scrollable body — hidden when collapsed */}
      {!collapsed && (
        <div className="properties-panel-body">
          {selectedElement ? (
            <>
              <LayeringControls
                element={selectedElement}
                elements={state.pages[state.currentPage].elements}
                dispatch={dispatch}
                ActionTypes={ActionTypes}
              />
              <div className="prop-row mb-2">
                <label htmlFor="el-z-index" className="prop-section-label">Z-Index</label>
                <input
                  id="el-z-index"
                  type="number"
                  className="form-control form-control-sm"
                  value={selectedElement.z ?? ''}
                  readOnly
                  style={{ width: 72 }}
                />
              </div>
              {renderTextShortcuts()}
              {renderTextStyleControls()}
              {renderCommonControls()}
              {renderFields()}
              <button
                className="btn btn-danger btn-sm mt-3 w-100"
                onClick={handleDelete}
                title="Delete Element"
              >
                <i className="bi bi-trash me-1" /> Delete Element
              </button>
            </>
          ) : (
            /* Canvas properties when nothing is selected */
            <form>
              <div className="form-group mb-2">
                <label htmlFor="canvas-bg-color" className="prop-section-label">Background</label>
                <ColorWithHex
                  id="canvas-bg-color"
                  value={state.pages[state.currentPage].background === 'transparent' ? '#ffffff' : (state.pages[state.currentPage].background || '#ffffff')}
                  onColorChange={v => dispatch({ type: 'UPDATE_PAGE_BACKGROUND', payload: { pageIndex: state.currentPage, background: v } })}
                  disabled={state.pages[state.currentPage].background === 'transparent'}
                />
                <div className="form-check mt-1">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="bgtransp-canvas"
                    checked={state.pages[state.currentPage].background === 'transparent'}
                    onChange={e => dispatch({ type: 'UPDATE_PAGE_BACKGROUND', payload: { pageIndex: state.currentPage, background: e.target.checked ? 'transparent' : '#ffffff' } })}
                  />
                  <label className="form-check-label" htmlFor="bgtransp-canvas">Transparent</label>
                </div>
              </div>
              <div className="form-group mb-2">
                <label htmlFor="canvas-border-color" className="prop-section-label">Border Color</label>
                <ColorWithHex
                  id="canvas-border-color"
                  value={state.pages[state.currentPage].borderColor || DEFAULTS.BORDER_COLOR}
                  onColorChange={v => dispatch({ type: 'UPDATE_PAGE_BORDER', payload: { pageIndex: state.currentPage, borderColor: v } })}
                />
              </div>
              <div className="form-group mb-2">
                <label className="prop-section-label">Border Width</label>
                <input
                  type="range"
                  min={0}
                  value={state.pages[state.currentPage].borderWidth || DEFAULTS.BORDER_WIDTH}
                  onChange={e => dispatch({ type: 'UPDATE_PAGE_BORDER', payload: { pageIndex: state.currentPage, borderWidth: parseInt(e.target.value) || DEFAULTS.BORDER_WIDTH } })}
                  className="form-range"
                />
              </div>
              <div className="form-group mb-2">
                <label className="prop-section-label">Border Radius: {state.pages[state.currentPage].borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={state.pages[state.currentPage].borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS}
                  onChange={e => dispatch({ type: 'UPDATE_PAGE_BORDER', payload: { pageIndex: state.currentPage, borderRadius: parseInt(e.target.value) ?? DEFAULTS.CANVAS_BORDER_RADIUS } })}
                  className="form-range"
                />
              </div>
              <div className="form-group mb-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => setShowCanvasPopup(true)}
                >
                  <i className="bi bi-aspect-ratio me-1" /> Resize Canvas
                </button>
              </div>
              {showCanvasPopup && (
                <CanvasSizePopup
                  aspectRatio={state.aspectRatio}
                  initialWidth={state.pages[state.currentPage].canvasWidth}
                  initialHeight={state.pages[state.currentPage].canvasHeight}
                  onApply={handleApplyCanvasSize}
                  onClose={() => setShowCanvasPopup(false)}
                />
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
