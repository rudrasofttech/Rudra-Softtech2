import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from './EditorContext';
import logo from '../../assets/logo.jpg';

// TopBar for project name and aspect ratio
export default function TopBar() {
  const { state, dispatch, ActionTypes, saveStatus, saveToServer } = useEditor();
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', tag: '', description: '' });
  const popupRef = useRef(null);

  const openPopup = () => {
    setDraft({
      name: state.projectName,
      tag: state.projectTag || '',
      description: state.projectDescription || '',
    });
    setPopupOpen(true);
  };

  const closePopup = () => setPopupOpen(false);

  const savePopup = () => {
    dispatch({ type: ActionTypes.SET_PROJECT_NAME, payload: draft.name });
    dispatch({ type: ActionTypes.SET_PROJECT_TAG, payload: draft.tag });
    dispatch({ type: ActionTypes.SET_PROJECT_DESCRIPTION, payload: draft.description });
    setPopupOpen(false);
  };

  // Close popup on outside click
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        closePopup();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  // Handler for aspect ratio change
  const onAspectChange = (e) => {
    dispatch({ type: ActionTypes.SET_ASPECT_RATIO, payload: e.target.value });
  };

  return (
    <header className="editor-topbar">
      <a
        href="/"
        onClick={(e) => { e.preventDefault(); navigate('/'); }}
        title="Go to Home"
        style={{ display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0 }}
      >
        <img src={logo} alt="Ply" style={{ height: 32, width: 'auto' }} />
      </a>
      <button className="project-name-btn" onClick={openPopup} title="Edit project details">
        <span className="project-name-label">{state.projectName || 'Untitled Project'}</span>
        <svg className="project-name-edit-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 2.474L5.91 11.48a2.458 2.458 0 0 1-.856.57l-3.101 1.129a.75.75 0 0 1-.982-.982l1.13-3.1c.112-.31.298-.593.569-.857l7.343-7.813Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Save status indicator */}
      {saveToServer && (
        <span className="editor-save-status" style={{ marginLeft: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saveStatus === 'saving' && (
            <span style={{ color: '#888' }}>
              <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14, verticalAlign: 'middle', marginRight: 3 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && <span style={{ color: '#22a06b' }}>✓ Saved</span>}
          {saveStatus === 'error' && (
            <button
              onClick={saveToServer}
              title="Save failed — click to retry"
              className='btn btn-sm btn-danger'
            >
              ⚠ Save failed — Retry
            </button>
          )}
          {saveStatus === 'idle' && (
            <button
              onClick={saveToServer}
              title="Save to server"
              className='btn btn-sm btn-light'
            >
              Save
            </button>
          )}
        </span>
      )}

      {popupOpen && (
        <div className="project-details-overlay">
          <div className="project-details-popup" ref={popupRef}>
            <div className="project-details-header">
              <span>Project Details</span>
              <button className="project-details-close" onClick={closePopup} aria-label="Close">✕</button>
            </div>
            <div className="project-details-body">
              <label className="project-details-label">
                Name
                <input
                  className="project-details-input"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Project Name"
                  autoFocus
                />
              </label>
              <label className="project-details-label">
                Tag
                <input
                  className="project-details-input"
                  type="text"
                  value={draft.tag}
                  onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
                  placeholder="e.g. Marketing, Portfolio"
                />
              </label>
              <label className="project-details-label">
                Description
                <textarea
                  className="project-details-textarea"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Brief description of this project"
                  rows={3}
                />
              </label>
            </div>
            <div className="project-details-footer">
              <button className="project-details-cancel" onClick={closePopup}>Cancel</button>
              <button className="project-details-save" onClick={savePopup}>Save</button>
            </div>
          </div>
        </div>
      )}

      <select value={state.aspectRatio} className="form-select ms-2 form-select-sm" style={{width:'auto'}} onChange={onAspectChange}>
        <option value="16:9">16:9</option>
        <option value="4:3">4:3</option>
        <option value="1:1">1:1</option>
        <option value="9:16">9:16</option>
      </select>
    </header>
  );
}
