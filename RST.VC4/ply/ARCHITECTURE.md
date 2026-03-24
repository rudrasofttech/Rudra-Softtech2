## Pages Drop-up Panel (March 2026)

- **Problem**: The page-navigation bar at the bottom of the editor (previously a compact strip, then a full-sized strip before that) occupied permanent vertical space even when the user was not navigating between pages. On small screens this reduced the available canvas area unnecessarily.
- **Solution**: The strip is removed entirely from the layout. Instead, a **"Pages" button** is added to the left of the bottom toolbar (`Toolbar.js`). Clicking it opens a **drop-up panel** that floats above the toolbar. The panel contains:
  - A **vertically scrollable list** of live-preview thumbnails (120×68 px, full 16:9) capped at `PAGE_DROPUP_MAX_H` (400 px) — beyond that the list scrolls.
  - Each row shows the thumbnail, a page-number overlay badge, and an **× remove button** (only when >1 pages exist). Clicking a row selects that page and closes the panel.
  - A **"+ Add Page" button** pinned below the scrollable list and always visible.
  - The panel closes automatically on any outside click (`mousedown` event listener, cleaned up when the panel is closed).

### Architecture changes

| File | Change |
|---|---|
| `PageManager.js` | `import` updated to include `useState`, `useRef`, `useEffect`. `PageManager` default export rewritten as a self-contained drop-up widget (owns `open` state + click-outside logic). `ThumbnailElement` and `PageCanvasThumbnail` helpers unchanged. |
| `Toolbar.js` | Imports `PageManager`; renders `<PageManager />` as the first item inside `<footer>`. |
| `Editor.js` | Removed `import PageManager` and `<PageManager />` from `EditorLayout` (was rendered below the canvas inside the canvas container). |
| `constants.js` | Added `PAGE_DROPUP_MAX_H`, `PAGE_THUMB_DROPUP_W`, `PAGE_THUMB_DROPUP_H`, `PAGE_DROPUP_WRAPPER`, `PAGE_DROPUP_BTN_CLASS`, `PAGE_DROPUP_CLASS`, `PAGE_DROPUP_LIST_CLASS`, `PAGE_DROPUP_ITEM_CLASS`, `PAGE_DROPUP_REMOVE`, `PAGE_DROPUP_ADD_CLASS`. Kept all old `PAGE_THUMB_*` and `PAGE_MANAGER` constants for backward compatibility (only `PAGE_THUMB_LABEL` and `PAGE_THUMB_CANVAS` are still actively used by `PageCanvasThumbnail`). |
| `editor.css` | Replaced the strip CSS block with drop-up panel styles (`.page-manager-dropup-wrapper`, `.page-manager-dropup`, `.page-manager-dropup-list`, `.page-dropup-item`, `.page-dropup-remove`, `.page-dropup-add`). `.page-thumb-label` and `.page-thumb-canvas` retained (still used by `PageCanvasThumbnail`). |

- **Drop-up positioning**: `.page-manager-dropup-wrapper` is `position: relative; display: inline-block` — the drop-up panel (`position: absolute; bottom: calc(100% + 6px); left: 0`) floats above it regardless of the toolbar's own position.
- **Scroll**: When the page list exceeds `PAGE_DROPUP_MAX_H` (400 px) the list div scrolls via `overflow-y: auto`; the "+ Add Page" button stays pinned outside the scroll area.
- **Thumbnail size**: Uses `PAGE_THUMB_DROPUP_W: 120` × `PAGE_THUMB_DROPUP_H: 68` (full-size, same as original THUMBNAIL_WIDTH/HEIGHT) — larger and easier to recognise than the old mini-strip thumbnails.
- **Undo/Redo & JSON**: No changes to `EditorContext`, reducer, `ActionTypes`, or the JSON design schema. All page operations (`ADD_PAGE`, `REMOVE_PAGE`, `SET_CURRENT_PAGE`) were already in the reducer and remain untouched.
- **Backward Compatibility**: `THUMBNAIL_WIDTH`, `THUMBNAIL_HEIGHT`, `PAGE_THUMB_MINI_W`, `PAGE_THUMB_MINI_H`, and all old strip class-name constants are retained in `constants.js`. `PageCanvasThumbnail` still accepts `thumbWidth`/`thumbHeight` props (defaulting to the old dimensions) so any external caller is unaffected.

## Properties Panel Title Always Visible (March 2026)

- **Bug fixed**: The element title in the floating Properties Panel was hidden when the panel was collapsed. Clicking the collapse toggle left the narrow 40 px strip with no label, giving no visual cue about which element was selected.
- **Fix — `Sidebar.js`**: Removed the `{!collapsed && (...)}` guard that wrapped the `<span className="properties-panel-title">` element. The title span is now rendered unconditionally in the panel header, in both expanded and collapsed states.
- **Layout in collapsed state — `editor.css`**:
  - `.properties-panel--collapsed .properties-panel-header` — overrides the default `flex-direction: row` / `justify-content: space-between` layout with `flex-direction: column; align-items: center; justify-content: flex-start` so the toggle button sits at the top and the title flows below it within the 40 px width.
  - `.properties-panel--collapsed .properties-panel-title` — applies `writing-mode: vertical-rl` and `transform: rotate(180deg)` so the text reads bottom-to-top (the standard convention for vertical sidebar labels). `max-height: 160px` caps very long names; `overflow: hidden` with `text-overflow: clip` prevents spillover.
- **Expanded state unchanged**: The added CSS rules are scoped to `.properties-panel--collapsed *`, so the expanded panel layout (horizontal flexbox, horizontal title) is completely unaffected.
- **No constants needed**: All new CSS values are layout/typography sizes that belong in the stylesheet rather than in `constants.js`; no design-state or behavioural values are involved.
- **Undo/Redo & JSON**: Pure UI — no dispatch calls, no changes to element props, page schema, or EditorContext. Fully backward compatible.
- **Files changed**: `Sidebar.js` (`!collapsed &&` guard removed from the title span; inline comment updated), `editor.css` (two new rule blocks scoped to `.properties-panel--collapsed`).

## Smart Alignment Snap Guides (March 2026)

- **Feature**: While dragging, resizing, or cropping any selected element, coloured guide lines appear on the canvas whenever the moving element's edge or centre aligns (within a threshold) with any other element's edge/centre or the canvas boundary/centre. The element simultaneously snaps to that position. Lines disappear the instant the gesture ends.
- **Snap axes and reference points**:
  - **X-axis** (vertical magenta lines): element left edge, right edge, horizontal centre — compared against the same three values of every other element and against the canvas left edge, right edge, and horizontal centre.
  - **Y-axis** (horizontal blue lines): element top edge, bottom edge, vertical centre — compared against the same three values of every other element and against the canvas top edge, bottom edge, and vertical centre.
- **Threshold**: `DEFAULTS.SNAP_THRESHOLD` (6 canvas-px). Within this distance the element snaps; outside it moves freely.
- **Gesture coverage**:
  - **Drag** — snap applied to the moved top-left `(x, y)` position.
  - **Resize** — snap applied to the resized bounding box `(newX, newY, newWidth, newHeight)`.
  - **Crop** — snap applied to the **visible bounding box** (element origin + crop insets), so the visible edge snaps to adjacent elements and canvas references.
- **Architecture** (zero changes to EditorContext, reducer, ActionTypes, or JSON schema):

### `snapGuides.js` (new file)
  Pure module — no React, no side-effects. Exports `computeSnap({ x, y, width, height, otherElements, canvasWidth, canvasHeight })`.
  - `collectCandidates(axis, otherElements, canvasSize)` — builds the set of reference values (3 per element + 3 canvas values) for one axis.
  - `snapAxis(keyValues, candidates, threshold)` — finds the closest snap within threshold; returns `{ delta, guidePos }`.
  - `computeSnap` — calls both axes, returns `{ snappedX, snappedY, guides }`.
  - `guides` format: `{ axis: 'x'|'y', position: <canvas-px> }[]`. `'x'` → vertical line; `'y'` → horizontal line.

### `DraggableResizable.js`
  - Imports `computeSnap` from `./snapGuides`.
  - New props (all with backward-compatible defaults): `otherElements = []`, `canvasWidth = DEFAULTS.CANVAS_MAX_W`, `canvasHeight = DEFAULTS.CANVAS_MAX_H`, `onGuideChange` (callback).
  - **Drag branch** (RAF `onMouseMove`): computes raw position, calls `computeSnap`, reports guides via `onGuideChange`, calls `onChange` with snapped position.
  - **Resize branch**: calls `computeSnap` on the post-resize bounding box; snap corrects `newX`/`newY` (width and height are kept at their computed values so the resize direction is preserved).
  - **Crop branch**: constructs the visible bounding box from the new crop insets and the element's bounding box, calls `computeSnap` for guides only (crop insets are not modified by snap so the element doesn't jump), emits guides, then calls `onCropChange`.
  - **`onMouseUp`**: calls `onGuideChange([])` to clear all guide lines immediately.

### `Canvas.js`
  - Imports `useState`.
  - `activeGuides` state (`useState([])`): updated by `setActiveGuides` passed as `onGuideChange` to each `ElementControls`.
  - Each `<ElementControls>` now receives: `otherElements={page.elements.filter(e => e.id !== el.id)}`, `canvasWidth={width}`, `canvasHeight={height}`, `onGuideChange={setActiveGuides}`.
  - New `SnapGuideLines({ guides, canvasWidth, canvasHeight })` component (defined in `Canvas.js`): renders one `<div className="snap-guide-line">` per active guide with inline styles for position, colour, thickness, and a `translateX(-50%)` / `translateY(-50%)` centring transform. `pointer-events: none`, `z-index: 1000`. Returns `null` when `guides` is empty — zero DOM overhead at rest.
  - `<SnapGuideLines>` is rendered as a sibling of the element divs inside `.editor-canvas`.

### `ElementControls.js`
  - Accepts four new props (all backward-compatible defaults): `otherElements = []`, `canvasWidth = DEFAULTS.CANVAS_MAX_W`, `canvasHeight = DEFAULTS.CANVAS_MAX_H`, `onGuideChange`.
  - Forwards all four directly to `<DraggableResizable>`.

### `editor.css`
  - New `.snap-guide-line` rule: `position: absolute; pointer-events: none; z-index: 1000`. All dynamic styles (colour, thickness, axis-specific dimension/position, centring transform) are applied inline so guide appearance is fully driven by `DEFAULTS` constants.

- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `SNAP_THRESHOLD` | `6` | Canvas-px within which snap fires |
  | `SNAP_GUIDE_COLOR_X` | `'#e91e63'` | Magenta — vertical guide lines (X alignments) |
  | `SNAP_GUIDE_COLOR_Y` | `'#1976d2'` | Blue — horizontal guide lines (Y alignments) |
  | `SNAP_GUIDE_THICKNESS` | `1` | px — guide line stroke width |
  | `SNAP_GUIDE_CLASS` | `'snap-guide-line'` | CSS class name for guide line divs |

- **Undo/Redo & JSON**: Snap corrects the in-flight position before calling `onChange`; `onChange` dispatches `UPDATE_ELEMENT` exactly as without snap. The undo stack entry is identical to a non-snapped move — snapping is transparent to the history. No schema changes.
- **Backward Compatibility**: All new props on `DraggableResizable` and `ElementControls` have defaults (`otherElements = []`, canvas dims = `DEFAULTS.CANVAS_MAX_W/H`, `onGuideChange` absent → no callback). With empty `otherElements`, only canvas-boundary snap candidates exist. Existing call sites that omit the new props are completely unaffected.
- **Files changed**: `constants.js` (5 new constants), `snapGuides.js` (new pure module), `DraggableResizable.js` (import + 4 new props + snap in drag/resize/crop + clear guides on mouseup), `Canvas.js` (import `useState`; `SnapGuideLines` component; `activeGuides` state; new props on `<ElementControls>`; `<SnapGuideLines>` in render), `ElementControls.js` (4 new props; forwarded to `<DraggableResizable>`), `editor.css` (`.snap-guide-line` rule).

## Crop Selection Outline and Handle Tracking (March 2026)

- **Bug fixed**: After cropping an element, the blue selection outline and all resize/crop handles remained anchored to the element's **full bounding box** instead of shrinking to match the visible (non-cropped) area. The handles were therefore partially or fully hidden inside the cropped-away region.
- **Root cause**: The selection outline was applied via CSS (`.draggable-resizable.selected { outline: … }` and `.editor-element.selected { outline: … }`) directly on the full-sized outer divs. Resize and crop handles were direct children of the outer `draggable-resizable` div and used corner/midpoint anchoring relative to that full box.
- **Fix — visible-region frame** (`DraggableResizable.js`):
  - Four **crop inset variables** (`cropLeft`, `cropTop`, `cropRight`, `cropBottom`) are derived from the `crop` prop (defaulting to `0` when crop is absent or `enableCropHandles` is false — fully backward compatible).
  - A new inner `<div className="visible-region-frame">` is rendered **inside** the outer `draggable-resizable` div whenever the element is selected. Its CSS `left / top / right / bottom` are set to `cropLeft / cropTop / cropRight / cropBottom` respectively, so its edges coincide exactly with the visible (non-cropped) boundaries.
    - At **zero crop** the overlay fills the entire outer div → identical visual to before the fix.
    - At **non-zero crop** the overlay shrinks inward by exactly the crop insets → outline and handles track the visible region live as crop is dragged.
  - `pointer-events: none` on the frame makes it transparent to drag clicks; individual handles inside it set `pointer-events: auto` to remain independently clickable.
  - The `2px solid` selection **outline** is on this frame (inline style via `DEFAULTS.SELECTION_OUTLINE_COLOR`), replacing the CSS outlines on `.draggable-resizable.selected` and `.editor-element.selected`.
  - All **resize handles** (corner circles) are now children of the frame. Their `left/top/right/bottom: -6px` anchoring resolves relative to the frame's (= visible region's) corners — correct at any crop depth.
  - All **crop handles** (teal pills) are also children of the frame. Their midpoint anchoring (`top: -(hs/2)`, `bottom: -(hs/2)`, etc.) resolves relative to the frame's edges, so each pill sits precisely on the corresponding visible-region boundary and slides with it as crop grows.
- **`onMouseDown` guard** (`DraggableResizable.js`): added `|| e.target.classList.contains('crop-handle')` so that crop-handle clicks can never accidentally start a drag even in edge cases where `e.stopPropagation()` in `onCropHandleDown` is not reached first.
- **`editor.css`**:
  - `.draggable-resizable.selected`: outline removed (comment explains the new location).
  - `.editor-element.selected`: outline removed; `z-index: 2` kept so selected elements still paint above siblings.
  - New `.visible-region-frame` rule: `box-sizing: border-box` only — all dynamic styles applied inline to react instantly to crop state changes.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `SELECTION_OUTLINE_COLOR` | `'#1976d2'` | Shared selection-blue colour for the frame outline and resize-handle fill |
  | `VISIBLE_REGION_CLASS` | `'visible-region-frame'` | CSS class name for the overlay div |
- **Crop math unchanged**: `onCropHandleDown` / `onMouseMove` crop branch / `onCropChange` are unmodified. Crop insets continue to be stored in `element.props.crop` and dispatched via `UPDATE_ELEMENT` — fully undo-aware.
- **Undo/Redo & JSON**: No changes to `EditorContext`, reducer, `ActionTypes`, or the JSON design schema. The fix is entirely within the render of `DraggableResizable` and the CSS.
- **Backward Compatibility**: At zero crop the visible-region frame is flush with the outer div → identical visual. Elements without `props.crop` default to zero insets. `ElementControls` (`clipPath` crop clipping) is unchanged. `enableCropHandles = false` (default) sets all insets to 0, so non-crop element types (text, line) are completely unaffected.
- **Files changed**: `constants.js` (2 new constants), `DraggableResizable.js` (crop-handle `onMouseDown` guard; `cropLeft/Top/Right/Bottom` inset variables; visible-region frame with handles inside), `editor.css` (outlines removed from `.draggable-resizable.selected` and `.editor-element.selected`; `.visible-region-frame` rule added).

## Mid-Edge Crop Handles for Selected Elements (March 2026)

- **Feature**: When a `rect`, `ellipse`, or `image` element is selected, four teal pill-shaped handles appear at the midpoint of each edge (N / S / E / W). Dragging a handle inward crops — hides — the corresponding edge of the element. The crop can be un-done via the normal undo/redo stack.
- **Supported element types**: `rect`, `ellipse`, `image`. Line and text elements are excluded (text editing and width-only resize take priority). The guard lives in `ElementControls.js` as `const CROP_SUPPORTED = element.type === 'rect' || element.type === 'ellipse' || element.type === 'image'`.
- **Crop data structure**: `element.props.crop` — `{ top, right, bottom, left }` in canvas-space pixels. Absent on pre-existing elements; `DEFAULTS.CROP_EMPTY` (`{ top:0, right:0, bottom:0, left:0 }`) is used as the backward-compatible fallback wherever the field is missing.
- **Drag interaction** (`DraggableResizable.js` — pre-existing logic, now connected):
  - `onCropHandleDown(e, edge)` — snapshots the current crop insets and mouse position in `cropOriginRef`. `e.stopPropagation()` prevents the main-box `onMouseDown` from also firing (drag conflict avoided).
  - RAF `onMouseMove` — when `cropping` is not null, computes `dx / zoom` and `dy / zoom` (same zoom compensation as drag/resize) and applies them to the snapshotted inset for the active edge, clamped so that at least `DEFAULTS.CROP_MIN_VISIBLE` px remain visible on both opposing axes.
  - `onMouseUp` — sets `cropping` back to `null`.
  - Drag direction semantics: N handle dragged **south** → `crop.top` grows. S handle dragged **north** → `crop.bottom` grows. E handle dragged **west** → `crop.right` grows. W handle dragged **east** → `crop.left` grows.
- **Visual crop** (`ElementControls.js`):
  - `cropClipPath = inset(top bottom right left)` — a CSS `clip-path` string built from the active crop insets (non-null only when at least one inset > 0).
  - Applied to a thin **inner wrapper div** placed directly around `{content}` inside `editor-element`. Keeping the clip on the inner wrapper ensures the selection outline on `editor-element.selected` and the selection outline on `draggable-resizable.selected` both remain at the full bounding-box size and are not visually clipped.
  - When all insets are zero the inner wrapper is omitted (content is rendered directly) — no unnecessary DOM node or style property.
- **Crop handle visuals** (`DraggableResizable.js` + `editor.css`):
  - Inline styles use `DEFAULTS.CROP_HANDLE_BG` (`#00897b` — teal), `DEFAULTS.CROP_HANDLE_BORDER_RADIUS` (`999` — full pill), `DEFAULTS.CROP_HANDLE_Z_INDEX` (`12` — above the corner resize handles at z-index 10).
  - Edge-specific dimensions and positions come from the per-handle `h.style` spread (long axis `DEFAULTS.CROP_HANDLE_LONG` = 28 px, short axis `DEFAULTS.CROP_HANDLE_SHORT` = 10 px).
  - `.crop-handle` CSS class adds `box-sizing: border-box` and a `2px solid #fff` border (mirroring the resize-handle treatment).
- **Props wired in `ElementControls.js`**: `enableCropHandles={CROP_SUPPORTED}`, `onCropChange={onCropChange}`, `crop={crop}` passed to `<DraggableResizable>`. `onCropChange` dispatches `UPDATE_ELEMENT` with the new `props.crop` — fully undo-aware (one stack entry per mouse movement, same as resize).
- **Zoom / fitScale accuracy**: Crop mouse deltas are divided by the same `zoom` prop passed to `DraggableResizable` (`state.zoom × fitScale`). Crop accuracy is therefore preserved at all zoom levels, including when the 90 % screen cap is active.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `CROP_HANDLE_BG` | `'#00897b'` | Teal fill colour for crop handle pills |
  | `CROP_HANDLE_BORDER_RADIUS` | `999` | Fully rounded short axis → pill shape |
  | `CROP_HANDLE_Z_INDEX` | `12` | Above corner resize handles (z-index 10) |
- **Undo/Redo & JSON**: `element.props.crop` is stored in the design JSON exactly like any other prop. `UPDATE_ELEMENT` is dispatched through the existing reducer, so undo/redo works out of the box. Existing saved designs without a `crop` field load correctly (fallback to `DEFAULTS.CROP_EMPTY`). No reducer changes.
- **Backward Compatibility**: `enableCropHandles` defaults to `false` in `DraggableResizable` — any call site that omits it renders no crop handles, identical to the previous behaviour. `element.props.crop` is optional; elements without it display without clipping.
- **Files changed**: `constants.js` (3 new constants; comment updated to mention ellipse), `DraggableResizable.js` (crop handle div gains inline visual styles from DEFAULTS), `ElementControls.js` (`CROP_SUPPORTED` guard + `crop` read + `onCropChange` handler + `cropClipPath` computation + props wired to `DraggableResizable` + inner clip wrapper around `{content}`), `editor.css` (new `.crop-handle` rule).

## 100 % Zoom 90 % Screen Cap (March 2026)

- **Feature**: At 100 % zoom (`state.zoom = 1`), the canvas now never occupies more than 90 % of the `editor-canvas-container` in either dimension. On smaller screens or when the design canvas is large, the canvas is automatically scaled down to fit within 90 % of the available area. On large screens the cap does not apply and the canvas renders at its natural pixel dimensions.
- **`fitScale` — the cap factor**:
  - A display-only scalar (`fitScale ≤ 1`) computed each render in `EditorLayout` (`Editor.js`).
  - Formula: `fitScale = min(1, containerW × 0.9 / canvasW, containerH × 0.9 / canvasH)`.
  - 1 when the container is large enough (no cap); < 1 when the container is smaller than the natural canvas size × (1 / 0.9).
  - `fitScale` is **not** stored in `EditorContext`, the undo stack, or the design JSON — it is pure display-time UI state.
- **Container measurement** (`Editor.js`):
  - `containerSize` (`useState`) stores the live `{ width, height }` of `editor-canvas-container`.
  - A `ResizeObserver` registered once (empty `useEffect` deps) updates `containerSize` whenever the container is resized (window resize, sidebar open/close, etc.). The initial size is snapshot synchronously in the same effect via `el.offsetWidth/offsetHeight` so `fitScale` is accurate on first paint.
  - Canvas natural dimensions are resolved by the new `resolveCanvasDims(state)` helper (module-level pure function), which mirrors the identical fallback logic in `Canvas.js` and `Canvas.js::getCanvasDims()`.
- **Transform application** (`Canvas.js`):
  - Canvas.js accepts a new `fitScale = 1` prop (backward-compatible default).
  - The outer wrapper's transform changes from `scale(state.zoom)` to `scale(state.zoom × fitScale)`, so the rendered canvas visual size is always `state.zoom × fitScale` of the natural canvas dimensions.
  - Each `<ElementControls>` now receives `fitScale={fitScale}` as a prop so the drag correction stays accurate.
- **Drag accuracy** (`ElementControls.js`):
  - `ElementControls` accepts a new `fitScale = 1` prop (backward-compatible default).
  - The `zoom` prop forwarded to `DraggableResizable` changes from `state.zoom` to `state.zoom × fitScale`.
  - `DraggableResizable` divides mouse deltas by `zoom`; with the updated value it divides by `state.zoom × fitScale`, which correctly maps screen pixels to canvas pixels at the actual rendered scale.
- **Canvas dimension resolution — `resolveCanvasDims(state)`** (`Editor.js`):
  - New module-level helper that replicates Canvas.js's page-level fallback chain: explicit `canvasWidth`/`canvasHeight` → one side + aspect ratio → `DEFAULTS.CANVAS_MAX_W/H` with aspect clamping.
  - Used only for fitScale computation; does not affect the canvas render itself.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `ZOOM_100_MAX_SCREEN_RATIO` | `0.9` | Maximum fraction of the container the canvas may occupy at 100 % zoom |
- **Undo/Redo & JSON**: `fitScale` is never serialised. Design JSON, undo stack, and all action types are unchanged. Existing saved designs load and render identically (fitScale = 1 on large screens; auto-scaled on small ones).
- **Backward Compatibility**: `fitScale` defaults to `1` in both `Canvas` and `ElementControls`, so any external call that omits it behaves exactly as before. `DraggableResizable` is unchanged.
- **Files changed**: `constants.js` (1 new constant), `Editor.js` (`useState` import; `resolveCanvasDims` helper; `containerSize` state + ResizeObserver effect + `fitScale` computation in `EditorLayout`; `fitScale` prop on `<Canvas>`), `Canvas.js` (`fitScale` prop; `scale(state.zoom × fitScale)` transform; `fitScale` forwarded to `<ElementControls>`), `ElementControls.js` (`fitScale` prop; `zoom={(state.zoom || 1) × fitScale}` on `<DraggableResizable>`).

## Ctrl+Wheel Zoom (March 2026)

- **Feature**: Holding `Ctrl` (or `Cmd` on Mac) and scrolling the mouse wheel over the canvas area now zooms in and out. Plain scroll (no modifier) passes through unchanged and scrolls the canvas container normally.
- **Why a ref-based listener**: React's synthetic `onWheel` cannot call `e.preventDefault()` reliably because browsers mark wheel event listeners as **passive** by default to improve scroll performance. A passive listener ignores `preventDefault`, so the browser's native pinch-to-zoom would still trigger when `Ctrl` is held. The fix uses `containerRef` + `useEffect` to attach a **non-passive** native listener (`{ passive: false }`) to the `editor-canvas-container` div.
- **Stale-closure fix**: The handler reads the current zoom via `stateRef.current` (a `useRef` kept in sync by a separate `useEffect`), following the same pattern already used in `Canvas.js` for arrow-key nudge. This lets the `useEffect` dependency array be `[dispatch, ActionTypes]` — both stable — so the listener is registered **once** for the component's lifetime.
- **Zoom formula**: `next = clamp(current + direction × ZOOM_WHEEL_STEP, ZOOM_MIN, ZOOM_MAX)`. `toFixed(2)` prevents floating-point drift (e.g. `0.30000000000000004`). `direction` = `+1` for scroll-up (zoom in), `−1` for scroll-down (zoom out).
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `ZOOM_MIN` | `0.2` | Minimum zoom level (20%) — was hardcoded `0.2` in Toolbar |
  | `ZOOM_MAX` | `2` | Maximum zoom level (200%) — was hardcoded `2` in Toolbar |
  | `ZOOM_WHEEL_STEP` | `0.05` | Zoom delta per wheel notch — finer than the +/− button step of 0.1 |
- **`Toolbar.js`**: `zoomIn`/`zoomOut` handlers and the range slider `min`/`max` now use `DEFAULTS.ZOOM_MIN` / `DEFAULTS.ZOOM_MAX` instead of magic numbers, keeping all zoom bounds in one place.
- **Undo/Redo & JSON**: Zoom is dispatched via the existing `SET_ZOOM` action, which is already handled by the reducer. Zoom is session-level UI state stored in `EditorContext` (not serialised to the design JSON), so undo/redo and saved designs are unaffected.
- **Backward Compatibility**: No changes to element props, page schema, or any other reducer actions. All existing zoom interactions (slider, +/− buttons) continue to work identically.
- **Files changed**: `constants.js` (3 new constants), `Editor.js` (`useRef`/`useEffect` imports; `containerRef` + `stateRef` + non-passive wheel listener in `EditorLayout`; `ref={containerRef}` on canvas container div), `Toolbar.js` (import `DEFAULTS`; use `DEFAULTS.ZOOM_MIN`/`ZOOM_MAX` in handlers and slider).

## Zoom-Aware Drag and Resize (March 2026)

- **Bug Fixed**: Dragging or resizing a selected element when the canvas was zoomed out (zoom < 1) caused the element to lag behind the mouse. The faster the zoom-out, the larger the gap. The same problem affected resize handles and crop handles.
- **Root Cause**: `DraggableResizable.js` computed all mouse deltas (`dx`, `dy`) in raw screen pixels: `dx = event.clientX − origin.x`. But the canvas is rendered inside a `transform: scale(zoom)` wrapper, so 1 screen pixel corresponds to `1/zoom` canvas pixels. At zoom = 0.5, every 10px of mouse movement only moved the element 10px in canvas space instead of the correct 20px, making it feel sluggish.
- **Fix**: Divide each delta by the current `zoom` before applying it: `dx = (event.clientX − origin.x) / zoom`. This converts screen-space pixels to canvas-space coordinates, so element position always tracks the mouse exactly regardless of zoom level.
- **Scope**: Applied to all three delta sites in `DraggableResizable.js`:
  1. `onMouseMove` RAF path — drag branch.
  2. `onMouseMove` RAF path — resize branch.
  3. `onMouseMove` RAF path — crop-handle branch.
  4. `patchedOnMouseMove` (text/line width-only resize path) — drag branch.
  5. `patchedOnMouseMove` — resize branch.
- **New prop**: `zoom` (number, default `1`) added to `DraggableResizable`. The default ensures full backward compatibility — any call site that omits `zoom` behaves identically to before.
- **`ElementControls.js`**: Reads `state` (previously only `dispatch` and `ActionTypes`) from `useEditor()` and passes `zoom={state.zoom || 1}` to `<DraggableResizable>`. The `|| 1` guard protects against a `null`/`undefined` zoom in edge cases.
- **Constants**: No new constants needed. `state.zoom` is the existing zoom scalar already stored in `EditorContext`.
- **Undo/Redo & JSON**: No changes to `EditorContext`, reducer, `ActionTypes`, or the JSON design state schema. The fix is entirely within the mouse-event math in `DraggableResizable`.
- **Backward Compatibility**: `zoom` defaults to `1`. Existing saved designs, undo stacks, and all other components are unaffected. Arrow-key nudge (handled separately in `Canvas.js`) is not affected.
- **Files changed**: `DraggableResizable.js` (5 delta sites updated, `zoom` prop added), `ElementControls.js` (reads `state` from `useEditor()`, passes `zoom` to `DraggableResizable`).

## Live Canvas Thumbnails for Page Navigation (March 2026)

- **Feature**: The page navigation strip at the bottom of the editor now shows a live scaled-down preview of each page's canvas instead of plain "Page 1", "Page 2", … text buttons. Thumbnails update automatically on every design state change.
- **Approach**: Pure CSS/React — no external libraries (e.g. `html2canvas`). Each thumbnail is a full-resolution replica of the page canvas that is CSS-scaled down using `transform: scale(scaleFactor)` inside a fixed-size clipping container. React re-renders the thumbnails automatically because they read from the shared `EditorContext` state.
- **Dimension resolution**: `PageCanvasThumbnail` resolves canvas width/height with the exact same fallback logic as `Canvas.js` (reads `page.canvasWidth`/`page.canvasHeight`, falls back to `DEFAULTS.CANVAS_MAX_W`/`CANVAS_MAX_H` with aspect-ratio math). This guarantees the thumbnail perspective always matches the main canvas view.
- **Scale factor**: `scale = Math.min(THUMBNAIL_WIDTH / width, THUMBNAIL_HEIGHT / height)` — object-fit:contain behaviour; the full canvas fits inside the thumbnail slot. The replica is centred within the slot using `offsetX = (THUMB_W − width*scale) / 2`, `offsetY = (THUMB_H − height*scale) / 2`.
- **Element rendering** (`ThumbnailElement`): Each element type (rect, ellipse, line, image, text) is rendered as a lightweight, non-interactive DOM replica. Styling mirrors `ElementControls.js` exactly — same border, borderRadius, background, text styles, z-index paint order — but with `pointerEvents: none` and no drag/resize/edit wiring.
- **Components added** (`PageManager.js`):
  - `parseAspectRatio(ratio)` — local helper (mirrors Canvas.js) for dimension resolution.
  - `ThumbnailElement({ element })` — lightweight replica of one design element for thumbnail rendering.
  - `PageCanvasThumbnail({ page, aspectRatio })` — CSS-scaled live canvas clone; contains the fixed-size clipping box + full-res scaled div + sorted element replicas.
  - `PageManager` (default export, refactored) — renders the strip of thumbnail buttons + add/remove controls. CSS class names from `DEFAULTS` constants.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `THUMBNAIL_WIDTH` | 120 | px — thumbnail button preview width |
  | `THUMBNAIL_HEIGHT` | 68 | px — thumbnail preview height (≈ 16:9 default) |
  | `PAGE_MANAGER` | `'editor-page-manager'` | CSS class for the strip container |
  | `PAGE_THUMB_BTN` | `'page-thumb-btn'` | CSS class for each thumbnail button |
  | `PAGE_THUMB_LABEL` | `'page-thumb-label'` | CSS class for the page number label |
  | `PAGE_THUMB_ADD` | `'page-thumb-add'` | CSS class for the add-page button |
  | `PAGE_THUMB_REMOVE` | `'page-thumb-remove'` | CSS class for the remove-page button |
  | `PAGE_THUMB_CANVAS` | `'page-thumb-canvas'` | CSS class for the clipping container div |
- **CSS additions** (`editor.css`):
  - `.editor-page-manager` — updated to `flex`, `align-items: flex-end`, `padding`, and `background: #f0f1f5`.
  - `.page-thumb-btn` — column flex, border, border-radius, box-shadow, hover/active highlight ring (`#1976d2`).
  - `.page-thumb-label` — small page-number label below each thumbnail.
  - `.page-thumb-add` / `.page-thumb-remove` — circular action buttons, hover colour `#1976d2`.
  - `.page-thumb-canvas` — clipping container block with `overflow: hidden` and `border-radius: 3px`.
- **Undo/Redo & JSON**: No changes to `EditorContext`, reducer, `ActionTypes`, or the JSON design state schema. Thumbnails are pure UI derived from existing state — zero impact on undo/redo stack or serialisation.
- **Backward Compatibility**: Existing saved designs load unchanged. New pages added with `ADD_PAGE` instantly appear as thumbnails. Designs with no explicit `canvasWidth`/`canvasHeight` fall back to `DEFAULTS` — same as the main canvas.
- **Files changed**: `constants.js` (8 new constants), `PageManager.js` (full rewrite with `ThumbnailElement`, `PageCanvasThumbnail`, updated `PageManager`), `editor.css` (updated `.editor-page-manager` + 5 new rule blocks).

## Add Image: File-First Flow (March 2026)

- **Change**: Clicking "Add Image" in the Add Element panel now opens the OS file dialog **before** anything is added to the canvas. The element (with real src and real dimensions) is dispatched to the canvas only after the user confirms a file selection. If the user cancels the dialog, nothing is added.
- **Previously**: The old flow added a placeholder element immediately, then used `setTimeout` + `document.querySelector` to find and click the file input that existed inside the already-rendered `ElementControls` wrapper. This was fragile (required the element to already exist in the DOM) and left a placeholder on the canvas if the selector failed.
- **Implementation** (`Sidebar.js`, `Sidebar` component):
  - `imageFileInputRef` — `React.useRef()` attached to a hidden `<input type="file">` rendered at the bottom of the Add Element panel.
  - `handleImageFileSelected(e)` — reads the selected file via `FileReader`, loads it into a temporary `Image` to measure natural dimensions, clamps to `DEFAULTS.IMAGE_MAX` (preserving aspect ratio), centres the result on the canvas using the same dimension-fallback logic already present in `handleAdd`, then dispatches `ADD_ELEMENT` with `{ src, width, height, x, y }` — **no placeholder is ever created**.
  - `handleAdd` for `type === 'image'` — triggers `imageFileInputRef.current.click()` and returns immediately (no `base` object is built, no `ADD_ELEMENT` is dispatched at this point).
  - The hidden `<input>` uses `DEFAULTS.IMAGE_ACCEPT` (`'image/*'`) as the `accept` filter.
- **`ElementControls.js` unchanged** — the file input inside image elements (used by the "Select Image File" button in the Properties Panel to replace an existing element's src) is a separate, orthogonal mechanism and is not affected.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `IMAGE_ACCEPT` | `'image/*'` | `accept` attribute for image file inputs |
- **Undo/Redo & JSON**: `ADD_ELEMENT` is dispatched once with the complete, final element payload. The undo stack captures a single entry (the element as added). Cancelling the dialog produces zero undo entries. Fully backward compatible — existing saved designs with image elements (which carry `props.src`) are unaffected.
- **Backward Compatibility**: `DEFAULTS.PLACEHOLDER_IMAGE` is retained in `constants.js` (still used by `ElementControls.js` as a fallback `src` when an image element's `props.src` is absent).
- **Files changed**: `constants.js` (1 new constant), `Sidebar.js` (`handleAdd` image branch + new ref + new handler + hidden input in render).

## Draggable Properties Panel (March 2026)

- **Feature**: The floating frosted-glass Properties Panel (right side, over the canvas) is now draggable. Users can click-and-drag its header to reposition it anywhere within the editor canvas container while continuing to work.
- **Boundary Clamping**: The panel is clamped strictly within the `editor-canvas-container` bounds — it cannot be dragged outside the editing area or off-screen. Clamping uses live `container.offsetWidth`/`offsetHeight` minus measured `panel.offsetWidth`/`offsetHeight`, so it adapts correctly if the window is resized.
- **Implementation** (all changes isolated to `PropertiesPanel` in `Sidebar.js`):
  - `panelPos` state (`null | {x, y}`) — `null` means CSS-positioned (default top-right corner via `right: 12px, top: 12px`). Once the user drags, it switches to explicit `left`/`top` inline style (`right: auto`).
  - `isDragging` state — controls the `.properties-panel--dragging` CSS class (grabbing cursor, text-selection suppressed).
  - `panelRef` — `React.useRef` attached to the panel `<div>` for reading live geometry (`getBoundingClientRect`, `offsetWidth`, etc.).
  - `dragRef` — `React.useRef` for mutable drag data (`active`, start mouse/panel coords). Avoids stale closures inside the `window` event handlers, following the same pattern as the arrow-key nudge implementation.
  - `onHeaderMouseDown` — reads the panel's current screen position on drag start (`getBoundingClientRect` relative to `offsetParent`), records it in `dragRef`, and sets `isDragging = true`. Bails out if the event target is the collapse toggle button.
  - `useEffect` (empty deps, runs once) — binds `mousemove`/`mouseup` on `window`. `mousemove` computes the new clamped position and calls `setPanelPos`; `mouseup` resets `dragRef.current.active` and clears `isDragging`. Cleanup removes both listeners. Empty dependency array is intentional — both `panelRef` and `dragRef` are stable refs.
- **CSS additions** (`editor.css`):
  - `.properties-panel-header` gets `cursor: grab` and `user-select: none`.
  - `.properties-panel--dragging .properties-panel-header` sets `cursor: grabbing`.
  - `.properties-panel--dragging` adds `user-select: none` to prevent text selection across the whole panel during drag.
- **Constants added** (`constants.js`):
  | Constant | Value | Purpose |
  |---|---|---|
  | `PROPS_PANEL_WIDTH` | 272 | px — panel width (mirrors `.properties-panel` CSS) |
  | `PROPS_PANEL_OFFSET` | 12 | px — default margin from container edges |
- **Undo/Redo & JSON**: Panel position is purely UI state (`React.useState`) — it is never serialised into the design JSON or the undo/redo stack. This is intentional: panel position is ephemeral session state, not part of the design document.
- **Backward Compatibility**: No changes to `EditorContext`, reducer, `ActionTypes`, or design JSON schema. All existing element behaviours and canvas dispatch calls are unaffected.
- **Files changed**: `constants.js` (2 new constants), `Sidebar.js` (`PropertiesPanel` drag logic), `editor.css` (3 new/updated rules).

## Ellipse Border-Radius as Percentage (March 2026)

- **Bug Fixed**: The ellipse element's "Border Radius" slider in the Sidebar had no visible effect on the shape. The `case 'ellipse'` in `ElementControls.js` hardcoded `borderRadius: '50%'` first, then spread `...style` which overwrote it with the raw pixel number stored in `style.borderRadius`, ignoring the percentage.
- **Fix**: For ellipse elements, `style.borderRadius` is now treated as a **percentage** (0–100 → 0%–100%). In `ElementControls.js`, the final applied CSS is computed as `` `${style.borderRadius ?? DEFAULTS.ELLIPSE_BORDER_RADIUS_PCT}%` `` and placed **after** the `...style` spread so the `%` string always takes precedence over the raw number.
- **Default**: New constant `DEFAULTS.ELLIPSE_BORDER_RADIUS_PCT = 50` (50% = true oval/circle). Newly added ellipses start with this value. Old ellipses that stored `ELLIPSE_RADIUS` (60) as their borderRadius now render with `60%` — visually still an ellipse, fully backward compatible.
- **Sidebar**: The Border Radius slider label now shows `%` as the unit for ellipse elements and `px` for rect elements, so users understand what they're controlling. The slider range (0–100) is unchanged.
- **`borderRadius: 0`**: Slider at 0 gives 0% → sharp rectangle corners. At 50% → true oval/circle (equal dimensions = circle). The shape morphs smoothly across the full range.
- **Undo/Redo & JSON**: `style.borderRadius` is stored as a plain number in the JSON design state. No schema changes — existing undo/redo and save/load paths are unaffected.
- **Files changed**: `constants.js` (new `ELLIPSE_BORDER_RADIUS_PCT`), `ElementControls.js` (`case 'ellipse'` render), `Sidebar.js` (initial style + label unit).

## Arrow Key Nudge for Selected Elements (March 2026, improved)

Four improvements were made over the initial implementation:

### 1. Undo-Stack Batching
Holding an arrow key previously created one undo entry per browser key-repeat event (~30–40 per second). A single Ctrl+Z would undo only 1 px. Now:
- `keydown` dispatches `UPDATE_ELEMENT_NO_HISTORY` (moves element visually, **no** history push) on every repeat tick.
- `keyup` dispatches `COMMIT_ELEMENT_MOVE` once (one undo entry for the entire hold sequence).
- Two new reducer cases added to `EditorContext.js`:
  - `UPDATE_ELEMENT_NO_HISTORY` — updates pages, returns early (bypasses the history-push at the bottom of the reducer).
  - `COMMIT_ELEMENT_MOVE` — payload carries `{ element, startPages }`. Applies the final position and manually pushes `startPages` (the deep snapshot taken at the first keydown) as the undo entry, so Ctrl+Z always restores the position from before the key was first pressed.
- `window.blur` handler added: commits any in-flight move if the user tabs away while holding a key (prevents losing the undo entry when keyup never fires).

### 2. Stale-Closure Fix (no unnecessary re-binds)
Previously `state.pages` was in the `useEffect` dependency array, causing the listener to be torn down and re-registered on every `UPDATE_ELEMENT` dispatch (dozens of times per second during a hold). Now:
- A `stateRef = useRef(state)` is kept in sync via a separate `useEffect(() => { stateRef.current = state; }, [state])`.
- The keyboard `useEffect` dependency array is `[dispatch, ActionTypes]` only — both are stable references. The listener is registered **once** for the lifetime of the component.
- All handlers read `stateRef.current` for fresh data.

### 3. Canvas-Bounds Clamping
Arrow keys no longer push elements outside the canvas. New position is clamped:
- `x` ∈ `[0, canvasWidth  − element.props.width]`
- `y` ∈ `[0, canvasHeight − element.props.height]`
Canvas dimensions are resolved with the same fallback logic used in the Canvas render function (reads `page.canvasWidth`/`canvasHeight`, falls back to `DEFAULTS.CANVAS_MAX_W`/`CANVAS_MAX_H` with aspect-ratio math).

### 4. Key-Hold Acceleration
Step size ramps automatically when a key is held:
- Plain arrow: 1 px/tick for the first `DEFAULTS.ARROW_HOLD_ACCEL_DELAY` ms (500 ms), then `DEFAULTS.ARROW_MOVE_STEP_ACCEL` px/tick (5 px) until keyup.
- Shift+Arrow: always `DEFAULTS.ARROW_MOVE_STEP_LARGE` (10 px), overrides acceleration.

### Constants added (`constants.js`)
| Constant | Value | Purpose |
|---|---|---|
| `ARROW_MOVE_STEP` | 1 | px, plain arrow (unchanged) |
| `ARROW_MOVE_STEP_LARGE` | 10 | px, Shift+arrow (unchanged) |
| `ARROW_MOVE_STEP_ACCEL` | 5 | px, after acceleration threshold |
| `ARROW_HOLD_ACCEL_DELAY` | 500 | ms before acceleration activates |

### Backward Compatibility
- `UPDATE_ELEMENT_NO_HISTORY` and `COMMIT_ELEMENT_MOVE` are additive — existing actions and JSON state schema are unchanged.
- Elements already at position 0,0 in saved designs are unaffected.
- Layering shortcuts (Ctrl+`[`/`]`) continue to work exactly as before.

### Files changed
- `Canvas.js` — keyboard useEffect rewritten with stateRef, keyMoveRef, commitMove, blur handler.
- `EditorContext.js` — two new ActionTypes + two new reducer cases.
- `constants.js` — two new DEFAULTS constants.

## Center Placement for New Elements (March 2026)

- **Behaviour**: Every element added via the Sidebar ("Add Rectangle", "Add Ellipse", "Add Text", "Add Image", "Add Line") is placed at the visual center of the current canvas instead of the top-left corner (0, 0).
- **Implementation**: `Sidebar.js` `handleAdd` computes effective canvas dimensions before creating the element. The logic mirrors `Canvas.js` exactly: it reads `page.canvasWidth` / `page.canvasHeight` from state and falls back to `DEFAULTS.CANVAS_MAX_W` / `DEFAULTS.CANVAS_MAX_H` with aspect-ratio calculation when dimensions are absent. Per-type element height is looked up from `DEFAULTS` (`RECT_HEIGHT`, `ELLIPSE_RADIUS`, `TEXT_HEIGHT`, `IMAGE_HEIGHT`, `LINE_HEIGHT_PX`) and element width from `DEFAULTS.IMAGE_WIDTH`. The center offset is `x = max(0, round((cW - elW) / 2))`, `y = max(0, round((cH - elH) / 2))`.
- **Constants**: All magic values come from `constants.js` (`DEFAULTS`). No new constants were added.
- **Undo/Redo & JSON**: Position is stored in `element.props.x` / `element.props.y`, which are already part of the JSON design state schema. The change is fully compatible with the undo/redo stack and saved designs.
- **Backward Compatibility**: Existing saved elements with `x: 0, y: 0` are unaffected; only newly added elements start at centre. No schema changes.
- **Modularity**: Change is isolated to the `handleAdd` function in `Sidebar.js`. `Canvas.js`, `EditorContext.js`, and all other components are unchanged.

## Text Element Rendering Fix (March 2026)

- **Bug Fixed**: Text elements were not rendering any visible content on the canvas. The `switch` statement in `ElementControls.js` was missing a `case 'text'` branch, causing all text elements to fall through to `default: content = null`.
- **Fix**: Added a complete `case 'text'` branch that renders a read-only styled `<div>` when not selected, and an inline `<textarea>` for live editing when the element is selected.
- **Style Mapping**: All text styles (`bold`, `italic`, `underline`, `wave`, `shadow`, `glow`, `fontSize`, `fontFamily`, `color`, `background`, `textAlign`, `padding`, `borderWidth`, `borderColor`, `borderRadius`) are applied from `element.style` using `DEFAULTS` values from `constants.js` as fallbacks.
- **Editing**: When selected, a `textarea` is rendered with matching styles, dispatching `UPDATE_ELEMENT` on change. Mouse events on the textarea are stopped from bubbling so dragging does not interfere with text input.
- **Undo/Redo & JSON**: Text content updates go through `UPDATE_ELEMENT`, which is fully compatible with the undo stack and JSON design state. No schema changes.
- **Modularity**: Change is isolated to the `case 'text'` block in `ElementControls.js`. No other components are affected.

## Layering Improvements (March 2026)

- **Z-value normalization (A)**: All four layering actions (`BRING_ELEMENT_TO_FRONT`, `SEND_ELEMENT_TO_BACK`, `BRING_ELEMENT_FORWARD`, `SEND_ELEMENT_BACKWARD`) now reassign z-values as `0, 1, 2, …` after every operation, preventing unbounded z-index drift and keeping the JSON state compact. Backward compatible: existing elements without a `z` field are treated as if sorted by array index.
- **True step-past-neighbor (B)**: `BRING_ELEMENT_FORWARD` and `SEND_ELEMENT_BACKWARD` now swap the element with its immediate neighbor in the sorted z-order instead of blindly adding/subtracting 1. This ensures a single click reliably steps past the adjacent element regardless of z-value gaps.
- **Bounds-aware button states (C)**: `LayeringControls` in `ElementControls.js` computes the element's position in the sorted z-order and disables "Bring to Front" / "Bring Forward" when already topmost, and "Send to Back" / "Send Backward" when already bottommost.
- **Layer position badge (D)**: `LayeringControls` shows a `"N / Total"` badge next to the layer buttons, giving users immediate visual feedback on the element's layer position (1-based from bottom).
- **Keyboard shortcuts (E)**: `Canvas.js` binds a `keydown` listener (via `useEffect`) to `window` for the selected element: `Ctrl+]` = Bring Forward, `Ctrl+Shift+]` = Bring to Front, `Ctrl+[` = Send Backward, `Ctrl+Shift+[` = Send to Back. The listener is re-bound when the selected element or page changes.
- **Sidebar integration**: `Sidebar.js` passes `state.pages[state.currentPage].elements` to `LayeringControls` so the badge and disabled states reflect the live layer order.
- **Undo/Redo & JSON**: All layering actions push to the undo stack via the existing Command Pattern in `EditorContext.js`. Normalized z-values are stored in the JSON design state and are backward compatible.



+- **Resize Disabled for Line Elements**: Line elements can only be dragged on the canvas; resize handles are not shown for lines.
+- **Sidebar Controls**: When a line element is selected, Sidebar presents width, height, and color properties. Height is restricted to a maximum of 15px, width can be set up to the current canvas width, and color is set via a color picker (default from constants.js).
+- **Undo/Redo & JSON**: All changes to line width, height, and color are compatible with the undo/redo stack and JSON design state.
+- **Modularity**: The restriction and controls are implemented in a modular way, preserving integration with the ReactJS app and backward compatibility.
- **Further Drag Smoothness**: Dragging now uses a persistent animation frame and event ref, ensuring element position updates match mouse speed and movement for a truly smooth experience.
- **Optimized Drag Performance**: Dragging and resizing elements on the canvas now uses requestAnimationFrame for mousemove updates, reducing lag and keeping elements in sync with the cursor.
- **No Scrollbars for Canvas Resize**: The canvas now resizes strictly to the specified width, height, and aspect ratio. Scrollbars will only appear if the content exceeds the canvas dimensions, not due to canvas resizing itself.
## Canvas Size Popup Feature (March 2026)
- **Immediate Canvas Update**: The canvas always reflects the current aspect ratio, width, and height from the JSON design state. Any change made in the popup (aspect ratio, width, or height) is immediately visible in the canvas.

- **Canvas Size Popup**: Reset Canvas Size now opens a popup with input boxes for width and height, and an aspect ratio dropdown. The aspect ratio dropdown is only available in the popup, not in the Sidebar. Changing width, height, or aspect ratio updates the other values as needed to maintain the selected aspect ratio.
- **Component**: The popup is implemented as a modular `CanvasSizePopup.js` component, with aspect ratio selection and logic.
- **Sidebar Integration**: The Sidebar triggers the popup instead of directly resetting the canvas size.
- **Reducer Action**: The popup applies changes via a new `SET_CANVAS_SIZE` action, updating `canvasWidth`, `canvasHeight`, and (if changed) the global `aspectRatio` for the current page.
- **JSON Design State**: Canvas size is stored per page as `canvasWidth` and `canvasHeight`. If absent, defaults and aspect ratio logic are used for backward compatibility.
- **Undo/Redo**: All canvas size changes are pushed to the undo stack and are compatible with the Command Pattern and JSON state persistence.
- **Modularity**: All changes are modular, maintain integration with the ReactJS app, and preserve compatibility with existing JSON design state and undo/redo stack.
# UI Controls: Range Sliders for Properties

All numeric style properties for elements (border width, border radius, padding, and font size) in the Sidebar are now controlled using range sliders (input type="range") with a maximum value of 100 (font size min 8, max 100). The current value is displayed next to each slider for user feedback. All default values are sourced from the centralized DEFAULTS object in constants.js. This improves usability and maintainability, and is fully backward compatible with the JSON design state and undo/redo stack.

# Canvas Border Radius Property

The canvas (page background) now supports a border radius property, editable via a range slider in the Sidebar. The value is stored per-page in the JSON design state as `borderRadius` and is applied to the canvas using the `border-radius` CSS property. The default value is sourced from `DEFAULTS.CANVAS_BORDER_RADIUS` in `constants.js`. This is fully backward compatible with the JSON design state and undo/redo stack, and does not affect element border radii.

**Implementation:**
- Sidebar: Adds a "Canvas Border Radius" range slider to the main canvas properties form.
- Canvas.js: Applies the `borderRadius` from the current page state to the canvas style.
- constants.js: Adds `CANVAS_BORDER_RADIUS` to `DEFAULTS`.
- JSON/Undo/Redo: The property is stored per-page and is compatible with existing state and undo/redo logic.
- Modular: No impact on element border radii or other features.
# Export JPEG Feature

## Overview
The editor supports exporting the current canvas as a JPEG image. This is accessible via the "Export JPEG" button in the Toolbar. When clicked, a popup appears allowing the user to set the JPEG quality (0.1–1.0) before downloading the image.

## Implementation
- The export logic is modular and uses `html2canvas` to render the `.editor-canvas` DOM node to a canvas, then exports as JPEG using a utility in `src/utils/exportUtils.js`.
- The popup UI is implemented in `ExportJpegPopup.js` and is only mounted when needed.
- The Toolbar manages the popup state and triggers the export.
- The export is non-destructive and does not affect the undo/redo stack or JSON design state.
- All code is integrated in a modular way, preserving backward compatibility and ReactJS app integration.

## Files
- `src/components/editor/Toolbar.js` — Integrates export button and popup logic.
- `src/components/editor/ExportJpegPopup.js` — Popup/modal for quality selection and download.
- `src/utils/exportUtils.js` — Utility for exporting a canvas as JPEG.
- `html2canvas` (npm package) — Used for DOM-to-canvas rendering.

## Usage
1. User clicks "Export JPEG" in the Toolbar.
2. Popup appears to set quality (default 0.92).
3. On download, any selected element is automatically unselected before export to ensure a clean image. The current canvas is then exported as a JPEG and downloaded.

## Modularity & Compatibility
- No changes to JSON state or undo/redo logic.
- Popup and export logic are fully encapsulated.
- No impact on other export formats or editor features.
# Centralized Constants for Editor Components

## Constants File

All magic numbers and strings used in editor components (such as default sizes, colors, class names, and action types) are now extracted into a single file:

- `src/components/editor/constants.js`

This file exports a `DEFAULTS` object for UI and style constants, and an `ACTIONS` object for action type strings. All editor-related components (e.g., `Sidebar.js`, `ElementControls.js`) import and use these constants instead of hardcoding values.

### Example Usage

```js
import { DEFAULTS } from './constants';
const borderColor = style.borderColor || DEFAULTS.BORDER_COLOR;
```

### Benefits

- **Maintainability**: All key values are in one place for easy updates.
- **Consistency**: UI and logic remain consistent across components.
- **Modularity**: No cross-component dependencies on hardcoded values.
- **Backward Compatibility**: The JSON design state and undo/redo stack remain compatible, as only the code references have changed, not the data structure.

### Migration

All previous magic numbers and strings in `Sidebar.js` and `ElementControls.js` have been replaced with imports from `constants.js`. New features or changes should add to or update this file as needed.
# 21. Image Properties: Padding, Border Width, No Circular/Source

- **Image Properties**: The Sidebar for image elements now allows editing padding and border width, in addition to border color, border radius, and background.
- **No Circular Option**: The circular toggle for images has been removed.
- **No Image Source Field**: The image source (URL/Data URI) is no longer shown or editable in the Sidebar. Images are only changed via file dialog.
- **Undo/Redo & JSON**: All changes remain compatible with the undo/redo stack and JSON design state.
- **Integration**: Modular, backward compatible, and does not affect other element types or editor features.
# 20. Image File Dialog Only from Sidebar/Add, Size Constraint

- **File Dialog Trigger**: The image file dialog now only opens from the Add Image button or the "Select Image File" button in the Sidebar, never from clicking the image itself.
- **Size Constraint**: When an image is added or changed, its dimensions are constrained to a maximum of 400x400 pixels, maintaining aspect ratio. This applies to both file uploads and URL/Data URI changes.
- **Undo/Redo & JSON**: All changes remain compatible with the undo/redo stack and JSON design state.
- **Integration**: Modular, backward compatible, and does not affect other element types or editor features.
# 19. Image Element: File Dialog, Borders, Circular, Properties

- **Image File Dialog**: Image elements now support selecting a file from the file dialog. When an image is selected or the "Select Image File" button is clicked in the Sidebar, a file dialog opens. The selected image is added to the canvas and stored as a Data URL in the element's `props.src`.
- **Change Image from Properties**: The Sidebar allows changing the image by URL/Data URI or by file dialog. The image can be updated at any time.
- **Borders & Circular**: Image elements support border color, border width, and border radius. A "Circular" toggle sets borderRadius to 50% for a perfect circle.
- **Draggable/Resizable**: Images are fully draggable and resizable using the same controls as other elements.
- **Undo/Redo & JSON**: All image changes are compatible with the undo/redo stack and JSON design state. No breaking changes to the JSON schema.
- **Integration**: This feature is modular and does not affect other element types or editor features.
# 18. Advanced Text Styling & Multiline

- **Multiline Text**: Text elements now support new lines (multi-line editing) using a textarea and render with preserved line breaks.
- **Text Style Properties**: Sidebar provides controls for bold, italic, underline, shadow, glow, and wave (wavy underline) for text elements. These are stored in the element's style and rendered accordingly.
- **Undo/Redo**: All text style and content changes are compatible with the undo/redo stack and JSON design state.
- **Integration**: This feature is modular and does not affect other element types or editor features.
# 17. Text Resizing Scales Font Size

- **Text Resize Behavior**: When resizing a text element, its font size now scales proportionally with the element's height. Enlarging the text box increases the font size; shrinking it decreases the font size.
- **Implementation**: Font size is computed as a ratio of the current height to the default height (40px), with a minimum font size enforced for readability.
- **Undo/Redo**: All text resizing and font size changes are compatible with the undo/redo stack and JSON design state.
- **Integration**: This feature is modular and does not affect other element types or editor features.
# 16. Keyboard Delete for Selected Element

- **Delete Key Support**: Pressing the Delete or Backspace key will delete the currently selected element (if any) from the canvas.
- **Implementation**: A global keyboard event listener is registered in the editor layout. When Delete or Backspace is pressed and an element is selected, it dispatches the delete action.
- **Undo/Redo**: Deletions via keyboard are fully compatible with the undo/redo stack and JSON design state.
- **Integration**: This feature is modular and does not interfere with other keyboard shortcuts or app state.
# 15. Canvas-Only Zoom (March 2026)

- **Zoom Behavior**: Zooming in/out now applies only to the canvas and its elements, not the outer container. The container remains fixed, and the canvas grows (zooms in) or shrinks (zooms out) so that at minimum zoom, the entire design is visible but smaller.
- **Implementation**: The CSS `transform: scale(...)` is now applied to a wrapper around the canvas, not the container. This ensures all elements scale together, but the scroll/viewport remains stable.
- **Backward Compatibility**: No changes to the JSON design state or undo/redo logic. All zoom actions remain compatible with the existing architecture.
# 14. Canvas Container Zoom

- **Zoom Behavior**: Zooming in/out now applies to the entire canvas container (including all overlays and controls), not just the canvas itself. This ensures consistent scaling of all UI elements and interactions.
- **Implementation**: The CSS `transform: scale(...)` is now applied to `.editor-canvas-container` instead of the inner canvas wrapper.
- **Backward Compatibility**: No changes to the JSON design state or undo/redo logic. All zoom actions remain compatible with the existing architecture.

- **Line Element**: You can now add a draggable, resizable horizontal line to the canvas. The line supports color and height properties, and can be moved and resized like other elements. This is fully compatible with the JSON design state, undo/redo, and modular architecture.
+- **Line Element**: You can now add a draggable, resizable horizontal line to the canvas. The line supports color and height properties, which can be changed via the Sidebar properties. The line can be moved and resized like other elements. This is fully compatible with the JSON design state, undo/redo, and modular architecture.
---

## 12. Line Element Support



# 13. Z-Index (Layering) Support

- **Z-Index/Layering**: Each element now supports a `z` (z-index) property in the JSON design state. Elements are rendered in order of their z-index, with higher values on top. If `z` is missing, array order is used for backward compatibility.
- **Layering Controls**: The Sidebar property panel for a selected element now includes buttons for "Bring to Front", "Send to Back", "Bring Forward", and "Send Backward". These update the element's z-index and are fully undo/redo compatible.
- **UI**: The current z-index is displayed (read-only) in the Sidebar for the selected element.
- **Selection Does Not Affect Order**: Selecting an element does NOT bring it to the front or change its z-index. The order is only changed when a layering button is clicked.
- **Undo/Redo**: All layering actions are pushed to the undo stack and are compatible with the Command Pattern and JSON state persistence.
- **Backward Compatibility**: Designs without a `z` property continue to work, using array order for rendering.
- **Integration**: All changes maintain modularity, JSON design state compatibility, undo/redo support, and integration with the parent ReactJS app.

---


- **Transparent Background**: All element and canvas background color pickers now support a "Transparent" checkbox. When checked, the background is set to 'transparent' and the color picker is disabled. This is reflected in the JSON design state and is fully compatible with undo/redo and integration requirements.
---

## 10. Font Family Dropdown

- **Font Family**: The Sidebar now provides a dropdown for the Font Family property (for text elements), listing common web-safe fonts. This improves usability and ensures consistent font selection. The change is backward compatible with the JSON design state and undo/redo stack.
# Canva-like Editor Module Architecture

## Overview
This document describes the architecture, design patterns, and integration details for the modular Canva-like graphics editor implemented as a feature module in a ReactJS app.

---

## 1. Purpose of Each Component/File

- **components/editor/EditorContext.js**: Centralized context and reducer for editor state, implements Command Pattern for undo/redo, persists state as JSON.
- **components/editor/Editor.js**: Main layout and composition of the editor UI, wraps children in `EditorProvider`.
- **components/editor/TopBar.js**: Project name editing and aspect ratio selection.
- **components/editor/Sidebar.js**: Controls for adding new elements (shapes, text, images).
- **components/editor/Toolbar.js**: Bottom toolbar for zoom, undo/redo, and export options.
- **components/editor/PageManager.js**: Multi-page navigation and add/remove page controls.
- **components/editor/Canvas.js**: Renders the current page's elements, central drawing area.
- **components/editor/ElementControls.js**: Draggable, resizable, rotatable wrapper for each element; handles selection and deletion.
- **components/editor/DraggableResizable.js**: Modular wrapper for drag, resize, and (future) rotate logic. Used by `ElementControls` to provide interactive manipulation for all element types.
- **components/editor/editor.css**: Styles for all editor components.
- **components/editor/index.js**: Entry point for the editor module.
- **pages/editor.js**: Route integration for the editor as a standalone page.

---

## 2. Overall Architecture & Design Patterns

- **Functional Components & Hooks**: All UI is built with React functional components and hooks for state and context.
- **Command Pattern**: Undo/redo is implemented by storing state history and future stacks in context, with reducer actions representing commands.
- **Observer Pattern**: React context and hooks notify components of state changes.
- **JSON Design State**: The entire design (project name, pages, elements, etc.) is stored as a JSON schema for portability and cross-platform rendering.
- **Extensibility**: New element types can be added by extending the reducer and `ElementControls`.

---

## 2.1. Drag, Resize, and Text Editing

- **DraggableResizable**: All elements (text, image, shapes) are now wrapped in this component, enabling drag and resize via mouse. Handles are shown when selected.
- **ElementControls**: For text elements, direct editing is enabled when selected. For images and shapes, resizing and dragging are supported. All changes are persisted in the JSON design state and are undo/redo compatible.

---

## 3. Integration Instructions

- Import the editor module in your app:
  ```js
  import Editor from './components/editor';
  ```
- Mount the editor as a route or component:
  ```js
  <Route path="/editor" element={<Editor />} />
  ```
- The editor is self-contained and does not interfere with global app state or routing.

---

## 4. Example JSON Schema for Design State

```
{
  "projectName": "My Project",
  "aspectRatio": "16:9",
  "pages": [
    {
      "id": "page-1",
      "canvasWidth": 1000, // Optional, custom canvas width
      "canvasHeight": 700, // Optional, custom canvas height
      "elements": [
        {
          "id": "el-123",
          "type": "rect",
          "props": { "x": 100, "y": 100, "width": 200, "height": 100, "rotation": 0 },
          "style": { "background": "#eee", "borderRadius": 0 }
        },
        {
          "id": "el-124",
          "type": "text",
          "props": { "x": 150, "y": 200, "width": 120, "height": 40, "rotation": 0 },
          "content": "Hello World",
          "style": { "borderRadius": 0 }
        }
      ]
    }
  ],
  "currentPage": 0,
  "zoom": 1
}
```

---

## Canvas Size Reset Feature (March 2026)

- **Reset Canvas Size**: The Sidebar now includes a "Reset Canvas Size" button in the main canvas properties form (when no element is selected). Clicking this button restores the canvas width and height to defaults from `DEFAULTS` in `constants.js` for the current page.
- **JSON Design State**: Each page may now include optional `canvasWidth` and `canvasHeight` fields. If absent, the canvas falls back to default sizing and aspect ratio logic for backward compatibility.
- **Reducer Action**: A new action type `RESET_CANVAS_SIZE` is supported in the editor reducer. This action clears custom canvas size for the current page, restoring defaults.
- **Undo/Redo**: All canvas size changes (including reset) are pushed to the undo stack and are fully compatible with the Command Pattern and JSON state persistence.
- **UI**: The Sidebar form for canvas properties includes the reset button. No impact on element properties or other features.
- **Modularity**: All changes are modular, maintain integration with the ReactJS app, and preserve compatibility with existing JSON design state and undo/redo stack.

---

## 5. Usage & Developer Notes

- **Undo/Redo**: All state-changing actions are pushed to the history stack for undo/redo.
- **Persistence**: State is saved to localStorage for session persistence.
- **Extending Functionality**:
  - To add a new element type, update the reducer and `ElementControls`.
  - To add new export formats, extend the export logic in `Toolbar.js`.
  - To support more advanced manipulation (drag/resize/rotate), integrate a library or expand the handlers in `ElementControls.js`.
- **Styling**: All editor styles are scoped in `editor.css`.

---

## 6. Mandatory Future Prompt Rule

For any future changes, the following **mandatory prefix prompt** must be used along with the new request:

```
IMPORTANT: Maintain existing modular architecture, inline comments, and update ARCHITECTURE.md to reflect changes. Ensure backward compatibility with JSON design state and undo/redo stack. Preserve integration compatibility with the existing ReactJS app.
```

This ensures consistency, maintainability, and documentation integrity across iterations.

---

## 7. Selection Logic

- **Selection Logic**: Only one element can be selected at a time. The selected element is tracked in context (`selectedElementId`). Clicking on the canvas background deselects all elements. Clicking an element selects it and deselects others. Selection state is passed from Canvas to ElementControls.

---

## 8. Sidebar Editing

- **Sidebar Editing**: When an element is selected, the sidebar displays a contextual form for editing its properties (e.g., text, font, border, background, image URL). The delete button is also shown here. Fields are grouped by type (e.g., all border fields together). No property editing or delete button appears unless an element is selected. This keeps the UI clean and modular.

---

## 9. Sidebar & Canvas Properties (March 11, 2026)

- When no element is selected, the Sidebar displays and allows editing of main canvas properties: background color, border color, border width, and aspect ratio. Changes are reflected live in the canvas and JSON design state.
- When an element is selected, the Sidebar shows the contextual properties form and delete button as before.
- The Canvas component now applies background, border, and aspect ratio styles from the current page's properties, and enforces max width/height. Aspect ratio is parsed and enforced visually.
- Zoom now magnifies the entire design (canvas and all elements) using a CSS transform on the canvas container, not just the canvas itself. The transform origin is set to the center, so zoom always happens from the center in all directions. A slider in the toolbar allows precise zoom control (20% to 200%).
- The canvas container uses a light grey background for better contrast.
- The canvas never exceeds the available space and always maintains the correct aspect ratio.
- All changes maintain modularity, JSON design state compatibility, undo/redo support, and integration with the parent ReactJS app.
- Inline comments in Sidebar.js and Canvas.js document the new logic for main canvas property editing, aspect ratio, and zoom.

---

# 19. Auto-Resizing Text Element Boundaries on New Line

- **Auto-Resize on New Line**: When editing a text element, entering a new line (pressing Enter) in the textarea automatically increases the element's height to fit the new content. The textarea's scrollHeight is measured and the element's height is updated in real time.
- **Implementation**: The textarea in ElementControls uses a ref to measure its scrollHeight on every change. The element's `props.height` is updated via the undo/redo-compatible dispatch, ensuring the visual boundary always fits the text.
- **Undo/Redo & JSON Compatibility**: All auto-resize actions are fully compatible with the undo/redo stack and the persisted JSON design state. No breaking changes to the data model.
- **Integration**: This feature is modular, does not affect other element types, and preserves all previous text styling, resizing, and editing features.
- **Backward Compatibility**: Existing designs and JSON state remain valid. The auto-resize logic only applies when editing text elements.

---

# 20. Fixed-Size, Non-Draggable Text Elements (March 2026)

- **No Drag/Resize for Text**: Text elements can no longer be dragged or resized. Their position and size are fixed once placed. Only the content (including new lines) and style can be edited.
- **Font Size is Fixed**: The font size for text elements is now determined solely by the style property and does not scale with the element's height. Resizing logic is removed for text.
- **Multiline/New Line Support**: Text elements still support multiline editing and auto-resize their height to fit content as the user types or adds new lines.
- **Implementation**: The ElementControls component conditionally disables DraggableResizable for text elements and renders them as absolutely positioned, non-draggable, non-resizable blocks. All other element types retain full drag/resize/rotate support.
- **Undo/Redo & JSON Compatibility**: All changes are fully compatible with the undo/redo stack and the persisted JSON design state. No breaking changes to the data model.
- **Integration**: This feature is modular and does not affect other element types or editor features.
- **Backward Compatibility**: Existing designs and JSON state remain valid. Only text element interaction is changed.

---

# 21. Text Element: Only Width Resizable (March 2026)

- **Width-Only Resize**: Text elements can now only have their width changed by dragging. Height is fixed and cannot be resized by the user. Only east/west (side) handles are shown for text elements.
- **Implementation**: The DraggableResizable component detects text elements and restricts resize handles and logic to only allow width changes. Height is ignored during resize.
- **Font Size and Multiline**: Font size remains fixed (set in style). Multiline/new line support is preserved.
- **Undo/Redo & JSON Compatibility**: All width changes are fully compatible with the undo/redo stack and the persisted JSON design state. No breaking changes to the data model.
- **Integration**: This feature is modular and does not affect other element types or editor features.
- **Backward Compatibility**: Existing designs and JSON state remain valid. Only text element interaction is changed.

---

# 22. Keyboard Delete Excludes Text Elements (March 2026)

- **Delete Key Restriction**: The Delete and Backspace keys will no longer delete text elements. Keyboard deletion is now only applicable to non-text elements (rect, ellipse, line, image, etc.).
- **Implementation**: The Editor's keyboard handler checks the selected element's type and only dispatches a delete action if it is not a text element.
- **Undo/Redo & JSON Compatibility**: All delete actions remain fully compatible with the undo/redo stack and the persisted JSON design state. No breaking changes to the data model.
- **Integration**: This feature is modular and does not affect other element types or editor features.
- **Backward Compatibility**: Existing designs and JSON state remain valid. Only text element interaction is changed.

---

# 23. Text Element Height Auto-Reset on Unselect or Property Change (March 2026)

- **Auto Height Reset**: After any property change (font size, bold, italic, etc.) or content change (including adding/removing text), the height of a text element is automatically recalculated and updated when the element is unselected.
- **Implementation**: When a text element is unselected, a hidden DOM node is used to measure the rendered height of the text with the current width and style. The element's height is then updated in the design state to fit the content.
- **Undo/Redo & JSON Compatibility**: All height adjustments are fully compatible with the undo/redo stack and the persisted JSON design state. No breaking changes to the data model.
- **Integration**: This feature is modular and does not affect other element types or editor features.
- **Backward Compatibility**: Existing designs and JSON state remain valid. Only text element interaction is changed.
