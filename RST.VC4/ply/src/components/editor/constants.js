// Centralized constants for editor components
// Use these for all magic numbers and strings in the editor

export const DEFAULTS = {
  POSITION: { x: 0, y: 0 },
  SIZE: { width: 100, height: 100 },
  ROTATION: 0,
  FONT_SIZE: 16,
  BORDER_WIDTH: 0,
  BORDER_COLOR: '#888888',
  BORDER_RADIUS: 0,
  CANVAS_BORDER_RADIUS: 12,
  BORDER_STYLE_SOLID: 'solid',
  BORDER_STYLE_NONE: 'none',
  BACKGROUND: 'transparent',
  BACKGROUND_RECT: '#eeeeee',
  BACKGROUND_IMAGE: '#ffffff',
  BACKGROUND_TEXT: '#ffffff',
  TEXT_COLOR: '#000000',
  PLACEHOLDER_IMAGE: 'https://via.placeholder.com/120x80',
  IMAGE_MAX: 400,
  LINE_HEIGHT: 'normal',
  TEXT_ALIGN: 'left',
  CANVAS_MAX_W: 1000,
  CANVAS_MAX_H: 700,
  CANVAS_MIN_W: 300,
  CANVAS_MIN_H: 200,
  CANVAS_MAX_WIDTH: '100%',
  CANVAS_MAX_HEIGHT: '70vh',
  CANVAS_MARGIN: '1rem auto',
  CANVAS_BOX_SIZING: 'border-box',
  CANVAS_TRANSITION: 'width 0.2s, height 0.2s',
  CANVAS_DISPLAY: 'block',
  CANVAS_OVERFLOW: 'hidden',
  CANVAS_POSITION: 'relative',
  CANVAS_BG: '#fff',
  CANVAS_BORDER: '0px solid #888888',
  Z_INDEX_DEFAULT: 0,
  Z_INDEX_STEP: 1,
  ELLIPSE_RADIUS: 60,
  RECT_HEIGHT: 60,
  LINE_HEIGHT_PX: 4,
  IMAGE_HEIGHT: 80,
  IMAGE_WIDTH: 120,
  TEXT_HEIGHT: 40,
  PROJECT_NAME: 'Untitled Project',
  ASPECT_RATIO: '16:9',
  ASPECT_RATIO_16_9: '16:9',
  ASPECT_RATIO_4_3: '4:3',
  WAVE_DECORATION: 'underline wavy',
  SHADOW: '2px 2px 4px #000',
  GLOW: '0 0 8px #00f, 0 0 16px #00f',
  BUTTON_CLASS: 'btn btn-light btn-sm',
  BUTTON_OUTLINE: 'btn btn-sm btn-outline-secondary',
  BUTTON_ACTIVE: ' active',
  FORM_LABEL: 'form-label',
  FORM_GROUP: 'form-group mb-2',
  FORM_CONTROL_COLOR: 'form-control w-50',
  FORM_CONTROL_SM: 'form-control form-control-sm',
  FORM_CHECK_INPUT: 'form-check-input',
  FORM_CHECK_LABEL: 'form-check-label',
  LAYERING_CONTROLS: 'layering-controls d-flex gap-1 mb-2',
  EDITOR_ELEMENT: 'editor-element',
  EDITOR_ELEMENT_SELECTED: ' selected',
  EDITOR_IMAGE_SELECTABLE: 'editor-image-selectable',
  EDITOR_CANVAS: 'editor-canvas',
  EDITOR_CANVAS_CONTAINER: 'editor-canvas-container bg-light',
  EDITOR_CANVAS_ZOOM_WRAPPER: 'editor-canvas-zoom-wrapper',
  EDITOR_ROOT: 'editor-root',
  EDITOR_MAIN: 'editor-main',
  PROJECT_NAME_INPUT: 'project-name-input',
  // Default border-radius for ellipse: 50% = true oval/circle shape
  ELLIPSE_BORDER_RADIUS_PCT: 50,
  // Arrow key nudge steps
  ARROW_MOVE_STEP: 1,            // px per tick (plain arrow)
  ARROW_MOVE_STEP_LARGE: 10,    // px per tick (Shift+arrow, overrides acceleration)
  ARROW_MOVE_STEP_ACCEL: 5,     // px per tick after hold threshold
  ARROW_HOLD_ACCEL_DELAY: 500,  // ms of continuous hold before step size increases
  // Zoom level constraints and wheel step (used by Toolbar.js and Editor.js)
  ZOOM_MIN: 0.2,                 // minimum zoom level (20%)
  ZOOM_MAX: 2,                   // maximum zoom level (200%)
  ZOOM_WHEEL_STEP: 0.05,         // zoom delta per wheel notch (Ctrl+scroll)
  // At 100% zoom the canvas must not occupy more than this fraction of the
  // editor-canvas-container. Editor.js measures the container via ResizeObserver
  // and computes fitScale = min(1, ratio*containerW/cnvW, ratio*cnvH/cnvH).
  // Canvas.js multiplies state.zoom by fitScale for the transform; ElementControls.js
  // forwards the same multiplied value to DraggableResizable for correct drag accuracy.
  ZOOM_100_MAX_SCREEN_RATIO: 0.9,
  // Floating Properties Panel geometry
  PROPS_PANEL_WIDTH: 272,        // px — panel width (matches .properties-panel CSS)
  PROPS_PANEL_OFFSET: 12,        // px — default margin from container edges
  // Image file input filter
  IMAGE_ACCEPT: 'image/*',       // accepted MIME types for image file dialogs
  // Crop handle geometry and behaviour (rect, ellipse, and image element types)
  CROP_MIN_VISIBLE: 20,          // px — minimum visible content in either axis after cropping
  CROP_HANDLE_LONG: 28,          // px — long dimension of the pill-shaped crop handle
  CROP_HANDLE_SHORT: 10,         // px — short dimension of the pill-shaped crop handle
  CROP_HANDLE_BG: '#00897b',     // teal fill for crop handle pills
  CROP_HANDLE_BORDER_RADIUS: 999, // fully rounded short axis → pill shape
  CROP_HANDLE_Z_INDEX: 12,       // above corner resize handles (z-index 10)
  CROP_EMPTY: { top: 0, right: 0, bottom: 0, left: 0 }, // default no-crop inset — backward-compat fallback
  // Snap / alignment guides — active during drag, resize, and crop gestures.
  // Guides appear as coloured lines spanning the full canvas when the moving
  // element's edge or centre comes within SNAP_THRESHOLD canvas-px of any
  // reference edge/centre on another element or the canvas boundary.
  SNAP_THRESHOLD: 6,              // canvas-px — within this distance, snap fires
  SNAP_GUIDE_COLOR_X: '#e91e63', // magenta — vertical guide lines (X-axis alignment)
  SNAP_GUIDE_COLOR_Y: '#1976d2', // blue    — horizontal guide lines (Y-axis alignment)
  SNAP_GUIDE_THICKNESS: 1,        // px — rendered guide line stroke width
  // CSS class applied to each rendered guide line div (used for cleanup/styling)
  SNAP_GUIDE_CLASS: 'snap-guide-line',
  // Selection outline colour — shared by the visible-region frame border and resize-handle fill.
  // Centralised here so changing the theme colour only requires one edit.
  SELECTION_OUTLINE_COLOR: '#1976d2',
  // CSS class name for the visible-region frame overlay rendered by DraggableResizable.
  VISIBLE_REGION_CLASS: 'visible-region-frame',
  // Page thumbnail dimensions and CSS class names (used by PageManager.js)
  THUMBNAIL_WIDTH: 120,           // px — full-size thumbnail (kept for backward compat)
  THUMBNAIL_HEIGHT: 68,           // px — full-size thumbnail (kept for backward compat)
  PAGE_THUMB_MINI_W: 64,          // px — kept for backward compat (no longer rendered in strip)
  PAGE_THUMB_MINI_H: 36,          // px — kept for backward compat (no longer rendered in strip)
  // Pages drop-up panel — "Pages" toolbar button opens a panel above the toolbar
  // with a vertical scrollable list (max PAGE_DROPUP_MAX_H) and "+ Add Page" pinned below.
  PAGE_DROPUP_MAX_H: 400,          // px — max height of the scrollable thumbnail list
  PAGE_THUMB_DROPUP_W: 120,        // px — thumbnail width inside the drop-up panel
  PAGE_THUMB_DROPUP_H: 68,         // px — thumbnail height inside the drop-up panel
  PAGE_DROPUP_WRAPPER: 'page-manager-dropup-wrapper', // positioning context div
  PAGE_DROPUP_BTN_CLASS: 'pages-toolbar-btn',          // "Pages" button in toolbar
  PAGE_DROPUP_CLASS: 'page-manager-dropup',            // floating panel div
  PAGE_DROPUP_LIST_CLASS: 'page-manager-dropup-list',  // inner scrollable list
  PAGE_DROPUP_ITEM_CLASS: 'page-dropup-item',          // one row per page
  PAGE_DROPUP_REMOVE: 'btn btn-sm btn-outline-danger',            // × remove button on each row
  PAGE_DROPUP_ADD_CLASS: 'page-dropup-add',            // "+ Add Page" button
  // Legacy class names — kept for backward compat; PAGE_THUMB_LABEL / PAGE_THUMB_CANVAS
  // are still used by PageCanvasThumbnail for the overlay badge and clip container.
  PAGE_MANAGER: 'editor-page-manager',
  PAGE_THUMB_BTN: 'page-thumb-btn',
  PAGE_THUMB_LABEL: 'page-thumb-label',
  PAGE_THUMB_ADD: 'page-thumb-add',
  PAGE_THUMB_REMOVE: 'page-thumb-remove',
  PAGE_THUMB_CANVAS: 'page-thumb-canvas',
};

export const ACTIONS = {
  SET_PROJECT_NAME: 'SET_PROJECT_NAME',
  SET_ASPECT_RATIO: 'SET_ASPECT_RATIO',
  UPDATE_PAGE_BACKGROUND: 'UPDATE_PAGE_BACKGROUND',
  UPDATE_PAGE_BORDER: 'UPDATE_PAGE_BORDER',
  ADD_ELEMENT: 'ADD_ELEMENT',
  UPDATE_ELEMENT: 'UPDATE_ELEMENT',
  DELETE_ELEMENT: 'DELETE_ELEMENT',
  SET_ELEMENTS: 'SET_ELEMENTS',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  ADD_PAGE: 'ADD_PAGE',
  REMOVE_PAGE: 'REMOVE_PAGE',
  SET_ZOOM: 'SET_ZOOM',
  UNDO: 'UNDO',
  REDO: 'REDO',
  LOAD_STATE: 'LOAD_STATE',
  SELECT_ELEMENT: 'SELECT_ELEMENT',
  DESELECT_ELEMENT: 'DESELECT_ELEMENT',
  BRING_ELEMENT_TO_FRONT: 'BRING_ELEMENT_TO_FRONT',
  SEND_ELEMENT_TO_BACK: 'SEND_ELEMENT_TO_BACK',
  BRING_ELEMENT_FORWARD: 'BRING_ELEMENT_FORWARD',
  SEND_ELEMENT_BACKWARD: 'SEND_ELEMENT_BACKWARD',
};
