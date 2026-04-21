import React from 'react';
import { LayeringControls } from './ElementControls';
import { useEditor } from './EditorContext';
import { DEFAULTS } from './constants';
import CanvasSizePopup from './CanvasSizePopup';

// ─── Add Element Panel (narrow left sidebar) ─────────────────────────────────
export default function Sidebar() {
  const { state, dispatch, ActionTypes } = useEditor();

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
    if (type === 'rect') elH = DEFAULTS.RECT_HEIGHT;
    else if (type === 'ellipse') elH = DEFAULTS.ELLIPSE_RADIUS;
    else if (type === 'text') elH = DEFAULTS.TEXT_HEIGHT;
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
    if (type === 'rect') {
      base.props.height = DEFAULTS.RECT_HEIGHT;
      base.style = { background: DEFAULTS.BACKGROUND_RECT, borderRadius: DEFAULTS.BORDER_RADIUS };
    } else if (type === 'ellipse') {
      base.props.height = DEFAULTS.ELLIPSE_RADIUS;
      // borderRadius is stored as a percentage (0–100 → 0%–100%) for ellipse elements
      base.style = { background: DEFAULTS.BACKGROUND_RECT, borderRadius: DEFAULTS.ELLIPSE_BORDER_RADIUS_PCT };
    } else if (type === 'text') {
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

  const elementTypes = [
    { type: 'rect',    icon: 'bi-square',   label: 'Rect'    },
    { type: 'ellipse', icon: 'bi-circle',   label: 'Ellipse' },
    { type: 'line',    icon: 'bi-dash-lg',  label: 'Line'    },
    { type: 'text',    icon: 'bi-fonts',    label: 'Text'    },
    { type: 'image',   icon: 'bi-image',    label: 'Image'   },
  ];

  return (
    <div className="editor-add-panel">
      <span className="add-panel-heading">Add</span>
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
      {/* Hidden file input used exclusively by the "Add Image" button.
          The dialog opens before any element is created; the element is added
          only after the user confirms file selection in handleImageFileSelected. */}
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

  // Render property fields for the selected element
  function renderFields() {
    if (!selectedElement) return null;
    const { type, style = {}, props = {}, content } = selectedElement;
    // Border fields (shared by most types)
    const borderFields = (
      <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label htmlFor="el-border-color" className={DEFAULTS.FORM_LABEL}>Border Color</label>
          <input id="el-border-color" type="color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onChange={e => handleStyleChange('borderColor', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          {/* For ellipse: value is 0–100 interpreted as %, giving 50% = perfect oval/circle */}
          <label htmlFor="el-border-radius" className={DEFAULTS.FORM_LABEL}>Border Radius: {style.borderRadius ?? DEFAULTS.BORDER_RADIUS}{type === 'ellipse' ? '%' : 'px'}</label>
          <input id="el-border-radius" type="range" min={0} max={100} value={style.borderRadius ?? DEFAULTS.BORDER_RADIUS} onChange={e => handleStyleChange('borderRadius', parseInt(e.target.value))} />
        </div>
      </>
    );
    // Rectangle & Ellipse
    if (type === 'rect' || type === 'ellipse') {
      const isTransparent = style.background === DEFAULTS.BACKGROUND;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Background</label>
          <input type="color" value={isTransparent ? DEFAULTS.BACKGROUND_RECT : (style.background || DEFAULTS.BACKGROUND_RECT)} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} disabled={isTransparent} />
          <div className="form-check mt-1">
            <input type="checkbox" className={DEFAULTS.FORM_CHECK_INPUT} id={`bgtransp-${type}`} checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? DEFAULTS.BACKGROUND : DEFAULTS.BACKGROUND_RECT)} />
            <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor={`bgtransp-${type}`}>Transparent</label>
          </div>

        </div>
        {borderFields}
      </>;
    }
    // Line element: show width/height range fields, no resize handles
    if (type === 'line') {
      const canvasWidth = state.pages[state.currentPage].canvasWidth || DEFAULTS.CANVAS_MAX_W;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Line Color</label>
          <input type="color" value={style.background || '#222222'} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Width: {props.width || DEFAULTS.LINE_HEIGHT_PX}</label>
          <input type="range" min={20} max={canvasWidth} value={props.width || 20} onChange={e => handlePropChange('width', parseInt(e.target.value) || 20)} />
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Height: {props.height || DEFAULTS.LINE_HEIGHT_PX}</label>
          <input type="range" min={1} max={15} value={props.height || DEFAULTS.LINE_HEIGHT_PX} onChange={e => handlePropChange('height', parseInt(e.target.value) || DEFAULTS.LINE_HEIGHT_PX)} />
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
            <input type="color" value={style.color || DEFAULTS.TEXT_COLOR} onChange={e => handleStyleChange('color', e.target.value)} className="form-control w-25" />
          </div>
        </div>
        <div className="form-group my-2">
          <label className="form-label">Background</label>
          <input type="color" value={isTransparent ? '#ffffff' : (style.background || '#ffffff')} onChange={e => handleStyleChange('background', e.target.value)} className="form-control w-25" disabled={isTransparent} />
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
          <input id="img-bg-color" type="color" value={isTransparent ? DEFAULTS.BACKGROUND_IMAGE : (style.background || DEFAULTS.BACKGROUND_IMAGE)} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} disabled={isTransparent} />
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
          <input id="img-border-color" type="color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onChange={e => handleStyleChange('borderColor', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
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
    ? selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
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
            selectedElement.type === 'rect' ? 'square' :
            selectedElement.type === 'ellipse' ? 'circle' :
            selectedElement.type === 'line' ? 'dash-lg' :
            selectedElement.type === 'text' ? 'fonts' : 'image'
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
              {renderTextStyleControls()}
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
                <input
                  id="canvas-bg-color"
                  type="color"
                  value={state.pages[state.currentPage].background === 'transparent' ? '#ffffff' : (state.pages[state.currentPage].background || '#ffffff')}
                  onChange={e => dispatch({ type: 'UPDATE_PAGE_BACKGROUND', payload: { pageIndex: state.currentPage, background: e.target.value } })}
                  className="form-control form-control-color"
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
                <input
                  id="canvas-border-color"
                  type="color"
                  value={state.pages[state.currentPage].borderColor || DEFAULTS.BORDER_COLOR}
                  onChange={e => dispatch({ type: 'UPDATE_PAGE_BORDER', payload: { pageIndex: state.currentPage, borderColor: e.target.value } })}
                  className="form-control form-control-color"
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
