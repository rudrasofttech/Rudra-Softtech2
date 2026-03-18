// DraggableResizable.js
// Modular wrapper for drag, resize, and rotate logic for editor elements
import React, { useRef, useState } from 'react';

/**
 * Props:
 * - x, y, width, height, rotation
 * - minWidth, minHeight
 * - onChange({x, y, width, height, rotation})
 * - children (rendered inside the bounding box)
 * - selected (boolean)
 */
// onSelect: function to select this element (from ElementControls)
// elementId: id of the element (for future extensibility)
export default function DraggableResizable({
  x, y, width, height, rotation = 0,
  minWidth = 20, minHeight = 20,
  onChange,
  children,
  selected,
  onSelect,
  elementId,
  onlyWidthResize = false,
  type
}) {
  const boxRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0, width, height, boxX: 0, boxY: 0 });

  // Mouse down on main box (drag)
  const onMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    // Always select this element before dragging
    if (onSelect) onSelect(e);
    setDragging(true);
    setOrigin({
      x: e.clientX,
      y: e.clientY,
      boxX: x,
      boxY: y,
      width,
      height
    });
    e.stopPropagation();
  };

  // Mouse down on resize handle
  const onResizeDown = (e, direction) => {
    setResizing(direction);
    setOrigin({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
      boxX: x,
      boxY: y
    });
    e.stopPropagation();
  };

  // Mouse move with requestAnimationFrame for performance
  const animationFrameRef = useRef();
  const lastEventRef = useRef();
  const onMouseMove = (e) => {
    lastEventRef.current = e;
    if (!animationFrameRef.current) {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        const event = lastEventRef.current;
        if (!event) return;
        if (dragging) {
          const dx = event.clientX - origin.x;
          const dy = event.clientY - origin.y;
          onChange({
            x: origin.boxX + dx,
            y: origin.boxY + dy,
            width,
            height,
            rotation
          });
        } else if (resizing) {
          let newWidth = origin.width;
          let newHeight = origin.height;
          let newX = origin.boxX;
          let newY = origin.boxY;
          const dx = event.clientX - origin.x;
          const dy = event.clientY - origin.y;
          if (resizing === 'se') {
            newWidth = Math.max(minWidth, origin.width + dx);
            newHeight = Math.max(minHeight, origin.height + dy);
          } else if (resizing === 'sw') {
            newWidth = Math.max(minWidth, origin.width - dx);
            newHeight = Math.max(minHeight, origin.height + dy);
            newX = origin.boxX + dx;
          } else if (resizing === 'ne') {
            newWidth = Math.max(minWidth, origin.width + dx);
            newHeight = Math.max(minHeight, origin.height - dy);
            newY = origin.boxY + dy;
          } else if (resizing === 'nw') {
            newWidth = Math.max(minWidth, origin.width - dx);
            newHeight = Math.max(minHeight, origin.height - dy);
            newX = origin.boxX + dx;
            newY = origin.boxY + dy;
          }
          onChange({
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            rotation
          });
        }
        animationFrameRef.current = null;
      });
    }
  };

  // Mouse up
  const onMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  // Only allow width resize for text elements (east/west handles only)
  const isTextOnlyWidth = !!(typeof onlyWidthResize !== 'undefined' && onlyWidthResize);
  // Disable resize handles for line elements
  let handles = [];
  if (selected) {
    if (type === 'line') {
      handles = [];
    } else if (isTextOnlyWidth) {
      handles = [
        { dir: 'w', style: { left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
        { dir: 'e', style: { right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' } },
      ];
    } else {
      handles = [
        { dir: 'nw', style: { left: -6, top: -6, cursor: 'nwse-resize' } },
        { dir: 'ne', style: { right: -6, top: -6, cursor: 'nesw-resize' } },
        { dir: 'sw', style: { left: -6, bottom: -6, cursor: 'nesw-resize' } },
        { dir: 'se', style: { right: -6, bottom: -6, cursor: 'nwse-resize' } },
      ];
    }
  }

  // Patch onMouseMove to ignore height changes for text-only-width
  const patchedOnMouseMove = (e) => {
    if (dragging) {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      onChange({
        x: origin.boxX + dx,
        y: origin.boxY + dy,
        width,
        height,
        rotation
      });
    } else if (resizing) {
      let newWidth = origin.width;
      let newHeight = origin.height;
      let newX = origin.boxX;
      let newY = origin.boxY;
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (isTextOnlyWidth) {
        // Only allow width resize, ignore height
        if (resizing === 'e') {
          newWidth = Math.max(minWidth, origin.width + dx);
        } else if (resizing === 'w') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newX = origin.boxX + dx;
        }
        onChange({
          x: newX,
          y: newY,
          width: newWidth,
          height: origin.height,
          rotation
        });
      } else {
        // ...existing code for all handles...
        if (resizing === 'se') {
          newWidth = Math.max(minWidth, origin.width + dx);
          newHeight = Math.max(minHeight, origin.height + dy);
        } else if (resizing === 'sw') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newHeight = Math.max(minHeight, origin.height + dy);
          newX = origin.boxX + dx;
        } else if (resizing === 'ne') {
          newWidth = Math.max(minWidth, origin.width + dx);
          newHeight = Math.max(minHeight, origin.height - dy);
          newY = origin.boxY + dy;
        } else if (resizing === 'nw') {
          newWidth = Math.max(minWidth, origin.width - dx);
          newHeight = Math.max(minHeight, origin.height - dy);
          newX = origin.boxX + dx;
          newY = origin.boxY + dy;
        }
        onChange({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          rotation
        });
      }
    }
  };

  // Use patchedOnMouseMove if onlyWidthResize, else original
  React.useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', isTextOnlyWidth ? patchedOnMouseMove : onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', isTextOnlyWidth ? patchedOnMouseMove : onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  });

  return (
    <div
      ref={boxRef}
      className={`draggable-resizable${selected ? ' selected' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation}deg)`
      }}
      onMouseDown={onMouseDown}
    >
      {children}
      {handles.map(h => (
        <div
          key={h.dir}
          className="resize-handle"
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            background: '#1976d2',
            borderRadius: 6,
            zIndex: 10,
            ...h.style
          }}
          onMouseDown={e => onResizeDown(e, h.dir)}
        />
      ))}
    </div>
  );
}
