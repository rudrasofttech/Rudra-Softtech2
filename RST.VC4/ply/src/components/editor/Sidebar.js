import React from 'react';
import { LayeringControls } from './ElementControls';
import { useEditor } from './EditorContext';
import { DEFAULTS } from './constants';
import CanvasSizePopup from './CanvasSizePopup';

// Sidebar component for Canva-like editor
export default function Sidebar() {
  // Popup state for canvas size reset
  const [showCanvasPopup, setShowCanvasPopup] = React.useState(false);
  // Handler for applying new canvas size
  const handleApplyCanvasSize = (width, height, aspectRatio) => {
    dispatch({ type: 'SET_CANVAS_SIZE', payload: { pageIndex: state.currentPage, width, height, aspectRatio } });
  };
  // Handler for style change (border, color, etc)
  function handleStyleChange(field, value) {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: {
        ...selectedElement,
        style: {
          ...selectedElement.style,
          [field]: value
        }
      }
    });
  }

  // Handler for property change
  function handlePropChange(field, value) {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: {
        ...selectedElement,
        props: {
          ...selectedElement.props,
          [field]: value
        }
      }
    });
  }

  // Handler for style/content change (for text, etc)
  function handleFieldChange(field, value) {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: {
        ...selectedElement,
        [field]: value
      }
    });
  }

  // Handler for deleting selected element
  function handleDelete() {
    if (!selectedElement) return;
    dispatch({
      type: ActionTypes.DELETE_ELEMENT,
      payload: selectedElement.id
    });
  }

  // Render text style controls for text elements
  function renderTextStyleControls() {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    const style = selectedElement.style || {};
    return (
      <div className="mb-2">
        <label className="form-label">Text Style</label>
        <div className="btn-group mb-2 w-100" role="group">
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
  const { state, dispatch, ActionTypes } = useEditor();
  const selectedElement = state.selectedElementId
    ? state.pages[state.currentPage].elements.find(el => el.id === state.selectedElementId)
    : null;

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
      // When adding image, open file dialog and constrain size
      setTimeout(() => {
        const fileInput = document.querySelector(`.${DEFAULTS.EDITOR_IMAGE_SELECTABLE} ~ input[type="file"]`);
        if (fileInput) fileInput.click();
      }, 100);
      // Set placeholder, will update on file select
      base.props.height = DEFAULTS.IMAGE_HEIGHT;
      base.props.src = DEFAULTS.PLACEHOLDER_IMAGE;
      base.style = { background: DEFAULTS.BACKGROUND_IMAGE, borderRadius: DEFAULTS.BORDER_RADIUS };
    } else if (type === 'line') {
      base.props.height = DEFAULTS.LINE_HEIGHT_PX;
      base.style = { background: '#222222' };
    }
    dispatch({ type: ActionTypes.ADD_ELEMENT, payload: base });
  };

  // Render property fields for the selected element
  function renderFields() {
    if (!selectedElement) return null;
    const { type, style = {}, props = {}, content } = selectedElement;
    // Border fields (shared by most types)
    const borderFields = (
      <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Border Color
            <input type="color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onChange={e => handleStyleChange('borderColor', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          {/* For ellipse: value is 0–100 interpreted as %, giving 50% = perfect oval/circle */}
          <label className={DEFAULTS.FORM_LABEL}>Border Radius: {style.borderRadius ?? DEFAULTS.BORDER_RADIUS}{type === 'ellipse' ? '%' : 'px'}
            <input type="range" min={0} max={100} value={style.borderRadius ?? DEFAULTS.BORDER_RADIUS} onChange={e => handleStyleChange('borderRadius', parseInt(e.target.value))} />
          </label>
        </div>
      </>
    );
    // Rectangle & Ellipse
    if (type === 'rect' || type === 'ellipse') {
      const isTransparent = style.background === DEFAULTS.BACKGROUND;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Background
            <input type="color" value={isTransparent ? DEFAULTS.BACKGROUND_RECT : (style.background || DEFAULTS.BACKGROUND_RECT)} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} disabled={isTransparent} />
            <div className="form-check mt-1">
              <input type="checkbox" className={DEFAULTS.FORM_CHECK_INPUT} id={`bgtransp-${type}`} checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? DEFAULTS.BACKGROUND : DEFAULTS.BACKGROUND_RECT)} />
              <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor={`bgtransp-${type}`}>Transparent</label>
            </div>
          </label>
        </div>
        {borderFields}
      </>;
    }
    // Line element: show width/height range fields, no resize handles
    if (type === 'line') {
      const canvasWidth = state.pages[state.currentPage].canvasWidth || DEFAULTS.CANVAS_MAX_W;
      return <>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Line Color
            <input type="color" value={style.background || '#222222'} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Width: {props.width || DEFAULTS.LINE_HEIGHT_PX}
            <input type="range" min={20} max={canvasWidth} value={props.width || 20} onChange={e => handlePropChange('width', parseInt(e.target.value) || 20)} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Height: {props.height || DEFAULTS.LINE_HEIGHT_PX}
            <input type="range" min={1} max={15} value={props.height || DEFAULTS.LINE_HEIGHT_PX} onChange={e => handlePropChange('height', parseInt(e.target.value) || DEFAULTS.LINE_HEIGHT_PX)} />
          </label>
        </div>
      </>;
    }
    // Text
    if (type === 'text') {
      const isTransparent = style.background === DEFAULTS.BACKGROUND;
      return <>
        <div className="form-group mb-2">
          <label className="form-label">Text
            <input type="text" value={content || ''} onChange={e => handleFieldChange('content', e.target.value)} className="form-control" />
          </label>
        </div>
        <div className="form-group mb-2">
          <label className="form-label">Font Family
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
          </label>
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
          <label className={DEFAULTS.FORM_LABEL}>Background
            <input type="color" value={isTransparent ? DEFAULTS.BACKGROUND_IMAGE : (style.background || DEFAULTS.BACKGROUND_IMAGE)} onChange={e => handleStyleChange('background', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} disabled={isTransparent} />
            <div className="form-check mt-1">
              <input type="checkbox" className={DEFAULTS.FORM_CHECK_INPUT} id="bgtransp-image" checked={isTransparent} onChange={e => handleStyleChange('background', e.target.checked ? DEFAULTS.BACKGROUND : DEFAULTS.BACKGROUND_IMAGE)} />
              <label className={DEFAULTS.FORM_CHECK_LABEL} htmlFor="bgtransp-image">Transparent</label>
            </div>
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Padding: {style.padding || 0}
            <input type="range" className='form-range' min={0} max={100} value={style.padding || 0} onChange={e => handleStyleChange('padding', parseInt(e.target.value) || 0)} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Border Width: {style.borderWidth || DEFAULTS.BORDER_WIDTH}
            <input type="range" className='form-range' min={0} max={100} value={style.borderWidth || DEFAULTS.BORDER_WIDTH} onChange={e => handleStyleChange('borderWidth', parseInt(e.target.value) || DEFAULTS.BORDER_WIDTH)} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Border Color
            <input type="color" value={style.borderColor || DEFAULTS.BORDER_COLOR} onChange={e => handleStyleChange('borderColor', e.target.value)} className={DEFAULTS.FORM_CONTROL_COLOR} />
          </label>
        </div>
        <div className={DEFAULTS.FORM_GROUP}>
          <label className={DEFAULTS.FORM_LABEL}>Border Radius: {style.borderRadius || DEFAULTS.BORDER_RADIUS}
            <input type="range" className='form-range' min={0} max={100} value={style.borderRadius || DEFAULTS.BORDER_RADIUS} onChange={e => handleStyleChange('borderRadius', parseInt(e.target.value) || DEFAULTS.BORDER_RADIUS)} />
          </label>
        </div>
      </>;
    }
    return null;
  }

  // --- Sidebar main render ---
  // Sidebar layout: add element section, divider, properties section, and delete button below
  return (
    <div className="editor-sidebar bg-light p-3 border-end" style={{ minWidth: 260, maxWidth: 340, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Add Element section with heading and buttons */}
      <div className="mb-3">
        <h6 className="text-uppercase text-secondary mb-2" style={{ letterSpacing: 1 }}>Add Element</h6>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-light btn-sm d-flex align-items-center" onClick={() => handleAdd('rect')} title="Add Rectangle">
            <i className="bi bi-square me-1" /> Rectangle
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center" onClick={() => handleAdd('ellipse')} title="Add Ellipse">
            <i className="bi bi-circle me-1" /> Ellipse
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center" onClick={() => handleAdd('line')} title="Add Line">
            <i className="bi bi-dash-lg me-1" /> Line
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center" onClick={() => handleAdd('text')} title="Add Text">
            <i className="bi bi-fonts me-1" /> Text
          </button>
          <button className="btn btn-light btn-sm d-flex align-items-center" onClick={() => handleAdd('image')} title="Add Image">
            <i className="bi bi-image me-1" /> Image
          </button>
        </div>
      </div>

      {/* Divider line between Add Element and Properties section */}
      <hr className="my-2" />
      {/* Properties section: scrollable, does not exceed available height, with heading */}
      <h6 className="text-uppercase text-secondary mb-2" style={{ letterSpacing: 1 }}>Properties</h6>
      <div className="sidebar-properties flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
        {selectedElement ? (
          <>
            {/* Layering controls: pass all page elements for layer badge and bounds-checking */}
            <LayeringControls element={selectedElement} elements={state.pages[state.currentPage].elements} dispatch={dispatch} ActionTypes={ActionTypes} />
            <div className="form-group mb-2">
              <label className="form-label">Z-Index
                <input type="number" className="form-control form-control-sm" value={selectedElement.z ?? ''} readOnly style={{ width: 80 }} />
              </label>
            </div>
            {renderTextStyleControls()}
            {renderFields()}
            <button className="btn btn-danger btn-sm mt-3 w-100" onClick={handleDelete} title="Delete Element">
              <i className="bi bi-trash me-1" /> Delete
            </button>
          </>
        ) : (
          // Main canvas properties form
          <form>
            <div className="form-group mb-2">
              <label className="form-label">Canvas Background
                <input type="color" value={state.pages[state.currentPage].background === 'transparent' ? '#ffffff' : (state.pages[state.currentPage].background || '#ffffff')}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_BACKGROUND',
                    payload: { pageIndex: state.currentPage, background: e.target.value }
                  })}
                  className="form-control form-control-color" disabled={state.pages[state.currentPage].background === 'transparent'} />
                <div className="form-check mt-1">
                  <input type="checkbox" className="form-check-input" id="bgtransp-canvas" checked={state.pages[state.currentPage].background === 'transparent'} onChange={e => dispatch({
                    type: 'UPDATE_PAGE_BACKGROUND',
                    payload: { pageIndex: state.currentPage, background: e.target.checked ? 'transparent' : '#ffffff' }
                  })} />
                  <label className="form-check-label" htmlFor="bgtransp-canvas">Transparent</label>
                </div>
              </label>
            </div>
            <div className="form-group mb-2">
              <label className="form-label">Canvas Border Color
                <input type="color" value={state.pages[state.currentPage].borderColor || DEFAULTS.BORDER_COLOR}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_BORDER',
                    payload: { pageIndex: state.currentPage, borderColor: e.target.value }
                  })}
                  className="form-control form-control-color" />
              </label>
            </div>
            <div className="form-group mb-2">
              <label className="form-label">Canvas Border Width
                <input type="range" min={0} value={state.pages[state.currentPage].borderWidth || DEFAULTS.BORDER_WIDTH}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_BORDER',
                    payload: { pageIndex: state.currentPage, borderWidth: parseInt(e.target.value) || DEFAULTS.BORDER_WIDTH }
                  })}
                  className="form-range" />
              </label>
            </div>
            <div className="form-group mb-2">
              <label className="form-label">Canvas Border Radius: {state.pages[state.currentPage].borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS}
                <input type="range" min={0} max={100} value={state.pages[state.currentPage].borderRadius ?? DEFAULTS.CANVAS_BORDER_RADIUS}
                  onChange={e => dispatch({
                    type: 'UPDATE_PAGE_BORDER',
                    payload: { pageIndex: state.currentPage, borderRadius: parseInt(e.target.value) ?? DEFAULTS.CANVAS_BORDER_RADIUS }
                  })}
                  className="form-range" />
              </label>
            </div>
            {/* Aspect Ratio dropdown removed; now only available in CanvasSizePopup */}
            {/* Canvas width/height reset controls */}
            <div className="form-group mb-2">
              <button type="button" className="btn btn-outline-secondary btn-sm w-100" onClick={() => setShowCanvasPopup(true)}>
                Reset Canvas Size
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
    </div>
  );
}
