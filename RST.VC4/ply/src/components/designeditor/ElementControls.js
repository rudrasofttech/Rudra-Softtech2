import React, { useRef, useEffect } from 'react';
import { useEditor } from './EditorContext';
import DraggableResizable from './DraggableResizable';
import { DEFAULTS } from './constants';

// ElementControls: Draggable, resizable, rotatable wrapper for elements
// Receives 'selected' prop from Canvas.
// fitScale (default 1): display-only scale factor from EditorLayout (via Canvas).
// Forwarded to DraggableResizable as part of the effective zoom so mouse-delta
// correction stays accurate when the canvas is capped to 90 % of the screen.
// otherElements / canvasWidth / canvasHeight / onGuideChange: forwarded to
// DraggableResizable for snap / alignment guide computation.
export default function ElementControls({ element, selected, fitScale = 1, otherElements = [], canvasWidth = DEFAULTS.CANVAS_MAX_W, canvasHeight = DEFAULTS.CANVAS_MAX_H, onGuideChange }) {
    let content;
    const style = element.style || {};
    // Defensive: fallback for missing props (for backward compatibility)
    const props = element.props || { x: DEFAULTS.POSITION.x, y: DEFAULTS.POSITION.y, width: DEFAULTS.SIZE.width, height: DEFAULTS.SIZE.height, rotation: DEFAULTS.ROTATION };
    // Compose border CSS property from style fields for rect/ellipse
    const borderWidth = style.borderWidth || DEFAULTS.BORDER_WIDTH;
    const borderColor = style.borderColor || DEFAULTS.BORDER_COLOR;
    const borderRadius = style.borderRadius || DEFAULTS.BORDER_RADIUS;
    const borderStyle = borderWidth > 0 ? DEFAULTS.BORDER_STYLE_SOLID : DEFAULTS.BORDER_STYLE_NONE;
    const border = `${borderWidth}px ${borderStyle} ${borderColor}`;
    // Handler for selecting this element (single selection)
    const onSelect = (e) => {
      e.stopPropagation();
      dispatch({ type: ActionTypes.SELECT_ELEMENT, payload: element.id });
    };
  // Helper: measure and set height of text element based on rendered content
  const resetTextHeight = () => {
    if (element.type !== 'text' || selected) return;
    // Create a hidden div to measure rendered height
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = (element.props?.width || DEFAULTS.SIZE.width) + 'px';
    temp.style.fontSize = (element.style?.fontSize || DEFAULTS.FONT_SIZE) + 'px';
    temp.style.fontWeight = element.style?.bold ? 'bold' : 'normal';
    temp.style.fontStyle = element.style?.italic ? 'italic' : 'normal';
    temp.style.textDecoration = [element.style?.underline ? 'underline' : '', element.style?.wave ? 'underline wavy' : ''].filter(Boolean).join(' ');
    temp.style.textShadow = element.style?.shadow ? '2px 2px 4px #000' : '';
    if (element.style?.glow) temp.style.textShadow += (temp.style.textShadow ? ', ' : '') + '0 0 8px #00f, 0 0 16px #00f';
    temp.style.border = (element.style?.borderWidth || DEFAULTS.BORDER_WIDTH) + 'px solid ' + (element.style?.borderColor || DEFAULTS.BORDER_COLOR);
    temp.style.borderRadius = (element.style?.borderRadius || DEFAULTS.BORDER_RADIUS) + 'px';
    temp.style.padding = (element.style?.padding || 0) + 'px';
    temp.style.textAlign = element.style?.textAlign || 'left';
    temp.style.background = element.style?.background || DEFAULTS.BACKGROUND;
    temp.style.whiteSpace = 'pre-wrap';
    temp.style.lineHeight = 'normal';
    temp.innerText = element.content || '';
    document.body.appendChild(temp);
    const measuredHeight = Math.max(20, temp.offsetHeight);
    document.body.removeChild(temp);
    if (element.props?.height !== measuredHeight) {
      dispatch({
        type: ActionTypes.UPDATE_ELEMENT,
        payload: {
          ...element,
          props: {
            ...element.props,
            height: measuredHeight
          }
        }
      });
    }
  };

  // Always call useEffect at the top level to avoid conditional hook call
  useEffect(() => {
    resetTextHeight();
    // eslint-disable-next-line
  }, [selected, element.content, element.style, element.props && element.props.width]);

  // Ref for textarea to measure height
  const textareaRef = useRef();
  const { dispatch, ActionTypes, state } = useEditor();
  const elRef = useRef();
// Ref for file input (for image element)
  const fileInputRef = useRef();
  
  // Handler for updating element position/size/rotation
  const onChange = (props) => {
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: {
        ...element,
        props: {
          ...element.props,
          ...props
        }
      }
    });
  };

  // Crop support: rect, ellipse, and image elements support mid-edge crop handles.
  // Crop insets are stored in element.props.crop { top, right, bottom, left } (px).
  // Backward-compatible: elements without a crop field default to DEFAULTS.CROP_EMPTY (all zeros).
  const CROP_SUPPORTED = element.type === 'rect' || element.type === 'ellipse' || element.type === 'image';
  const crop = element.props?.crop || DEFAULTS.CROP_EMPTY;

  // Dispatches updated crop insets to the undo-aware store on each RAF tick during a crop drag.
  const onCropChange = (newCrop) => {
    dispatch({
      type: ActionTypes.UPDATE_ELEMENT,
      payload: { ...element, props: { ...element.props, crop: newCrop } },
    });
  };

  // Build a CSS clip-path from the active crop insets so the content appears cropped.
  // Applied inside editor-element (not on it) so the selection outline stays at full size.
  // clipPath is omitted when all insets are zero to avoid an unnecessary style property.
  const activeCrop = CROP_SUPPORTED ? crop : DEFAULTS.CROP_EMPTY;
  const cropClipPath =
    activeCrop.top || activeCrop.right || activeCrop.bottom || activeCrop.left
      ? `inset(${activeCrop.top}px ${activeCrop.right}px ${activeCrop.bottom}px ${activeCrop.left}px)`
      : null;
            // ...existing code...
            // For all other types, use DraggableResizable

            switch (element.type) {
              case 'rect':
                content = <div style={{ width: '100%', height: '100%', ...style, border, borderRadius }} />;
                break;
              case 'ellipse': {
                // borderRadius for ellipse is stored as a percentage (0–100).
                // Apply it AFTER spreading style so the % string always wins over the raw number.
                const ellipseRadius = `${style.borderRadius ?? DEFAULTS.ELLIPSE_BORDER_RADIUS_PCT}%`;
                content = <div style={{ width: '100%', height: '100%', ...style, border, borderRadius: ellipseRadius }} />;
                break;
              }
              case 'line':
                content = <div style={{ width: '100%', height: '100%', background: style.background || '#222222', borderRadius: 2 }} />;
                break;
              case 'image':
                // Image element: file dialog only from Sidebar or Add Image, not on image click
                content = (
                  <>
                    <img
                      src={element.props.src || DEFAULTS.PLACEHOLDER_IMAGE}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        border,
                        borderRadius,
                        ...style
                      }}
                      className={selected ? DEFAULTS.EDITOR_IMAGE_SELECTABLE : ''}
                      draggable={false}
                    />
                    {/* Hidden file input for image upload, only triggered by Sidebar or Add Image */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          const img = new window.Image();
                          const reader = new FileReader();
                          reader.onload = ev => {
                            img.onload = () => {
                              let { width, height } = img;
                              if (width > DEFAULTS.IMAGE_MAX || height > DEFAULTS.IMAGE_MAX) {
                                const ratio = Math.min(DEFAULTS.IMAGE_MAX / width, DEFAULTS.IMAGE_MAX / height);
                                width = Math.round(width * ratio);
                                height = Math.round(height * ratio);
                              }
                              dispatch({
                                type: ActionTypes.UPDATE_ELEMENT,
                                payload: {
                                  ...element,
                                  props: {
                                    ...element.props,
                                    src: ev.target.result,
                                    width,
                                    height
                                  }
                                }
                              });
                            };
                            img.src = ev.target.result;
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </>
                );
                break;
              case 'text': {
                // Compose text-decoration from style flags
                const textDecoration = [
                  style.underline ? 'underline' : '',
                  style.wave ? DEFAULTS.WAVE_DECORATION : '',
                ].filter(Boolean).join(' ');
                // Compose text-shadow from style flags
                const textShadowParts = [
                  style.shadow ? DEFAULTS.SHADOW : '',
                  style.glow ? DEFAULTS.GLOW : '',
                ].filter(Boolean);
                const textShadow = textShadowParts.join(', ');
                // Shared style object for both view and edit modes
                const textStyle = {
                  width: '100%',
                  height: '100%',
                  fontSize: (style.fontSize || DEFAULTS.FONT_SIZE) + 'px',
                  fontFamily: style.fontFamily || '',
                  color: style.color || DEFAULTS.TEXT_COLOR,
                  background: style.background || DEFAULTS.BACKGROUND,
                  fontWeight: style.bold ? 'bold' : 'normal',
                  fontStyle: style.italic ? 'italic' : 'normal',
                  textDecoration: textDecoration || 'none',
                  textShadow: textShadow || 'none',
                  border,
                  borderRadius,
                  padding: (style.padding || 0) + 'px',
                  textAlign: style.textAlign || DEFAULTS.TEXT_ALIGN,
                  whiteSpace: 'pre-wrap',
                  lineHeight: DEFAULTS.LINE_HEIGHT,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                };
                if (selected) {
                  // When selected: show a textarea for inline editing
                  content = (
                    <textarea
                      ref={textareaRef}
                      style={{ ...textStyle, resize: 'none', outline: 'none' }}
                      value={element.content || ''}
                      onChange={e => dispatch({
                        type: ActionTypes.UPDATE_ELEMENT,
                        payload: { ...element, content: e.target.value },
                      })}
                      // Stop pointer events from bubbling to drag handler while editing
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => e.stopPropagation()}
                    />
                  );
                } else {
                  // When not selected: render a read-only styled div
                  content = (
                    <div style={textStyle}>
                      {element.content || ''}
                    </div>
                  );
                }
                break;
              }
              default:
                content = null;
            }
// ...existing code...
  

  return (
    <DraggableResizable
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      rotation={props.rotation || 0}
      onChange={onChange}
      selected={selected}
      onSelect={onSelect}
      elementId={element.id}
      zoom={(state.zoom || 1) * fitScale}
      enableCropHandles={CROP_SUPPORTED}
      onCropChange={onCropChange}
      crop={crop}
      otherElements={otherElements}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      onGuideChange={onGuideChange}
    >
      <div
        ref={elRef}
        className={`editor-element${selected ? ' selected' : ''}`}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Crop clip wrapper: clips content to the visible (non-cropped) region.
             Kept inside editor-element so the selection outline on editor-element
             stays at the full bounding-box size and is not clipped. */}
        {cropClipPath
          ? <div style={{ width: '100%', height: '100%', clipPath: cropClipPath }}>{content}</div>
          : content
        }
        {/* Delete button moved to Sidebar */}
      </div>
    </DraggableResizable>
  );
}

// Named export for Sidebar usage
// Receives 'elements' (all page elements) to compute layer position for badge and bounds-checking
export function LayeringControls({ element, elements, dispatch, ActionTypes }) {
  if (!element) return null;
  // Compute sorted layer index (0-based from bottom) and total count
  const allElements = Array.isArray(elements) ? elements : [];
  const sorted = [...allElements].sort((a, b) => {
    const az = a.z !== undefined ? a.z : allElements.indexOf(a);
    const bz = b.z !== undefined ? b.z : allElements.indexOf(b);
    return az - bz;
  });
  const layerIndex = sorted.findIndex(el => el.id === element.id); // 0 = bottom
  const total = sorted.length;
  // Disable front/forward if already at top; disable back/backward if already at bottom
  const isTop = layerIndex === total - 1;
  const isBottom = layerIndex === 0;

  const handleBringToFront = () => {
    dispatch({ type: ActionTypes.BRING_ELEMENT_TO_FRONT, payload: element.id });
  };
  const handleSendToBack = () => {
    dispatch({ type: ActionTypes.SEND_ELEMENT_TO_BACK, payload: element.id });
  };
  const handleBringForward = () => {
    dispatch({ type: ActionTypes.BRING_ELEMENT_FORWARD, payload: element.id });
  };
  const handleSendBackward = () => {
    dispatch({ type: ActionTypes.SEND_ELEMENT_BACKWARD, payload: element.id });
  };
  return (
    <div className={DEFAULTS.LAYERING_CONTROLS}>
      {/* Bring to Front: disabled when already topmost */}
      <button className={DEFAULTS.BUTTON_CLASS} title="Bring to Front" onClick={handleBringToFront} disabled={isTop}><i className="bi bi-layers" /></button>
      {/* Send to Back: disabled when already bottommost */}
      <button className={DEFAULTS.BUTTON_CLASS} title="Send to Back" onClick={handleSendToBack} disabled={isBottom}><i className="bi bi-layers-fill" /></button>
      {/* Bring Forward: disabled when already topmost */}
      <button className={DEFAULTS.BUTTON_CLASS} title="Bring Forward" onClick={handleBringForward} disabled={isTop}><i className="bi bi-arrow-up" /></button>
      {/* Send Backward: disabled when already bottommost */}
      <button className={DEFAULTS.BUTTON_CLASS} title="Send Backward" onClick={handleSendBackward} disabled={isBottom}><i className="bi bi-arrow-down" /></button>
      {/* Layer position badge: shows current layer position (1-based from bottom) / total */}
      {total > 0 && (
        <span className="badge bg-secondary ms-1" title={`Layer ${layerIndex + 1} of ${total}`} style={{ fontSize: '0.7rem', alignSelf: 'center' }}>
          {layerIndex + 1} / {total}
        </span>
      )}
    </div>
  );
}
