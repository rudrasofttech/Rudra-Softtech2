
import React from 'react';
import { EditorProvider, useEditor } from './EditorContext';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import PageManager from './PageManager';
import './editor.css';

// Main Editor module layout
export default function Editor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}

function EditorLayout() {
  // Use context to get zoom for scaling the whole design
  const { state, dispatch, ActionTypes } = useEditor();

  // Keyboard handler for Delete key to remove selected element
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        // Find the selected element and check its type
        const page = state.pages[state.currentPage];
        const el = page.elements.find(el => el.id === state.selectedElementId);
        if (el && el.type !== 'text') {
          dispatch({ type: ActionTypes.DELETE_ELEMENT, payload: state.selectedElementId });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElementId, state.pages, state.currentPage, dispatch, ActionTypes]);

  return (
    <div className="editor-root">
      <TopBar />
      <div className="editor-main">
        <Sidebar />
        {/* Canvas container: light grey background, zooms the whole design */}
        <div
          className="editor-canvas-container bg-light"
          style={{
            position: 'relative',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="editor-canvas-zoom-wrapper"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                transform: `scale(${state.zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Canvas />
            </div>
          </div>
          <PageManager />
        </div>
      </div>
      <Toolbar />
    </div>
  );
}
