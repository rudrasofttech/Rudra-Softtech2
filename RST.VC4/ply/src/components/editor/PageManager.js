import React from 'react';
import { useEditor } from './EditorContext';

// PageManager for multi-page navigation and add/remove
export default function PageManager() {
  const { state, dispatch, ActionTypes } = useEditor();

  return (
    <div className="editor-page-manager">
      {state.pages.map((page, idx) => (
        <button
          key={page.id}
          className={idx === state.currentPage ? 'active' : ''}
          onClick={() => dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: idx })}
        >
          Page {idx + 1}
        </button>
      ))}
      <button onClick={() => dispatch({ type: ActionTypes.ADD_PAGE })}>+</button>
      {state.pages.length > 1 && (
        <button onClick={() => dispatch({ type: ActionTypes.REMOVE_PAGE, payload: state.currentPage })}>-</button>
      )}
    </div>
  );
}
