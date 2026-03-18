import React from 'react';
import { useEditor } from './EditorContext';

// TopBar for project name and aspect ratio
export default function TopBar() {
  const { state, dispatch, ActionTypes } = useEditor();

  // Handler for project name change
  const onNameChange = (e) => {
    dispatch({ type: ActionTypes.SET_PROJECT_NAME, payload: e.target.value });
  };

  // Handler for aspect ratio change
  const onAspectChange = (e) => {
    dispatch({ type: ActionTypes.SET_ASPECT_RATIO, payload: e.target.value });
  };

  return (
    <header className="editor-topbar">
      <input
        type="text"
        value={state.projectName}
        onChange={onNameChange}
        className="project-name-input"
        placeholder="Project Name"
      />
      <select value={state.aspectRatio} onChange={onAspectChange}>
        <option value="16:9">16:9</option>
        <option value="4:3">4:3</option>
        <option value="1:1">1:1</option>
        <option value="9:16">9:16</option>
      </select>
    </header>
  );
}
