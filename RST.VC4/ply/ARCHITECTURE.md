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
