import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { DEFAULTS } from './constants';
import { getWithAuth, postWithAuth } from '../../utils/api';
import { APIURLS } from '../../utils/config';

// JSON schema for design state (sample structure)
const initialDesignState = {
  projectName: 'Untitled Project',
  projectTag: '',
  projectDescription: '',
  aspectRatio: '16:9',
  pages: [
    {
      id: 'page-1',
      elements: [], // Each element: { id, type, props, style, z, ... }
    },
  ],
  currentPage: 0,
  zoom: 1,
  history: [],
  future: [],
  selectedElementId: null, // Track the currently selected element (single selection)
};

// Action types for reducer
const ActionTypes = {
  SET_PROJECT_NAME: 'SET_PROJECT_NAME',
  SET_PROJECT_TAG: 'SET_PROJECT_TAG',
  SET_PROJECT_DESCRIPTION: 'SET_PROJECT_DESCRIPTION',
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
  // Arrow-key nudge: visual preview (no undo entry) + single commit (one undo entry)
  UPDATE_ELEMENT_NO_HISTORY: 'UPDATE_ELEMENT_NO_HISTORY',
  COMMIT_ELEMENT_MOVE: 'COMMIT_ELEMENT_MOVE',
};

// Command Pattern for undo/redo
function editorReducer(state, action) {
  // Defensive: ensure history/future are always arrays
  const safeHistory = Array.isArray(state.history) ? state.history : [];
  const safeFuture = Array.isArray(state.future) ? state.future : [];
  let newState;
  switch (action.type) {
    case 'SET_CANVAS_SIZE': {
      const pages = [...state.pages];
      pages[action.payload.pageIndex] = {
        ...pages[action.payload.pageIndex],
        canvasWidth: action.payload.width,
        canvasHeight: action.payload.height,
      };
      // Update global aspect ratio if changed
      let newAspectRatio = state.aspectRatio;
      if (action.payload.aspectRatio && action.payload.aspectRatio !== state.aspectRatio) {
        newAspectRatio = action.payload.aspectRatio;
      }
      newState = { ...state, pages, aspectRatio: newAspectRatio };
      break;
    }
            case 'RESET_CANVAS_SIZE': {
              const pages = [...state.pages];
              pages[action.payload.pageIndex] = {
                ...pages[action.payload.pageIndex],
                canvasWidth: DEFAULTS.CANVAS_MAX_W,
                canvasHeight: DEFAULTS.CANVAS_MAX_H,
              };
              newState = { ...state, pages };
              break;
            }
        case ActionTypes.BRING_ELEMENT_TO_FRONT: {
          // Move element to the highest layer and normalize all z-values to 0,1,2,...
          const pages = [...state.pages];
          const elements = [...pages[state.currentPage].elements];
          const idx = elements.findIndex(el => el.id === action.payload);
          if (idx === -1) break;
          // Build sorted order by current z (fallback to array index), move target to end
          const sorted = [...elements].sort((a, b) => {
            const az = a.z !== undefined ? a.z : elements.indexOf(a);
            const bz = b.z !== undefined ? b.z : elements.indexOf(b);
            return az - bz;
          });
          const targetEl = elements[idx];
          const reordered = sorted.filter(el => el.id !== targetEl.id).concat(targetEl);
          // Normalize z-values: 0,1,2,...
          const normalized = reordered.map((el, i) => ({ ...el, z: i }));
          pages[state.currentPage] = { ...pages[state.currentPage], elements: normalized };
          newState = { ...state, pages };
          break;
        }
        case ActionTypes.SEND_ELEMENT_TO_BACK: {
          // Move element to the lowest layer and normalize all z-values to 0,1,2,...
          const pages = [...state.pages];
          const elements = [...pages[state.currentPage].elements];
          const idx = elements.findIndex(el => el.id === action.payload);
          if (idx === -1) break;
          // Build sorted order by current z (fallback to array index), move target to start
          const sorted = [...elements].sort((a, b) => {
            const az = a.z !== undefined ? a.z : elements.indexOf(a);
            const bz = b.z !== undefined ? b.z : elements.indexOf(b);
            return az - bz;
          });
          const targetEl = elements[idx];
          const reordered = [targetEl].concat(sorted.filter(el => el.id !== targetEl.id));
          // Normalize z-values: 0,1,2,...
          const normalized = reordered.map((el, i) => ({ ...el, z: i }));
          pages[state.currentPage] = { ...pages[state.currentPage], elements: normalized };
          newState = { ...state, pages };
          break;
        }
        case ActionTypes.BRING_ELEMENT_FORWARD: {
          // Swap z with the next element above in z-order, then normalize
          const pages = [...state.pages];
          const elements = [...pages[state.currentPage].elements];
          const idx = elements.findIndex(el => el.id === action.payload);
          if (idx === -1) break;
          // Sort all elements by z (fallback to array index)
          const sorted = [...elements].sort((a, b) => {
            const az = a.z !== undefined ? a.z : elements.indexOf(a);
            const bz = b.z !== undefined ? b.z : elements.indexOf(b);
            return az - bz;
          });
          const sortedIdx = sorted.findIndex(el => el.id === action.payload);
          // If already at top, nothing to do
          if (sortedIdx >= sorted.length - 1) {
            newState = state;
            break;
          }
          // Swap with the next element above
          const temp = sorted[sortedIdx];
          sorted[sortedIdx] = sorted[sortedIdx + 1];
          sorted[sortedIdx + 1] = temp;
          // Normalize z-values: 0,1,2,...
          const normalized = sorted.map((el, i) => ({ ...el, z: i }));
          pages[state.currentPage] = { ...pages[state.currentPage], elements: normalized };
          newState = { ...state, pages };
          break;
        }
        case ActionTypes.SEND_ELEMENT_BACKWARD: {
          // Swap z with the next element below in z-order, then normalize
          const pages = [...state.pages];
          const elements = [...pages[state.currentPage].elements];
          const idx = elements.findIndex(el => el.id === action.payload);
          if (idx === -1) break;
          // Sort all elements by z (fallback to array index)
          const sorted = [...elements].sort((a, b) => {
            const az = a.z !== undefined ? a.z : elements.indexOf(a);
            const bz = b.z !== undefined ? b.z : elements.indexOf(b);
            return az - bz;
          });
          const sortedIdx = sorted.findIndex(el => el.id === action.payload);
          // If already at bottom, nothing to do
          if (sortedIdx <= 0) {
            newState = state;
            break;
          }
          // Swap with the next element below
          const temp = sorted[sortedIdx];
          sorted[sortedIdx] = sorted[sortedIdx - 1];
          sorted[sortedIdx - 1] = temp;
          // Normalize z-values: 0,1,2,...
          const normalized = sorted.map((el, i) => ({ ...el, z: i }));
          pages[state.currentPage] = { ...pages[state.currentPage], elements: normalized };
          newState = { ...state, pages };
          break;
        }
    case ActionTypes.UPDATE_PAGE_BACKGROUND: {
      const pages = [...state.pages];
      pages[action.payload.pageIndex] = {
        ...pages[action.payload.pageIndex],
        background: action.payload.background
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.UPDATE_PAGE_BORDER: {
      const pages = [...state.pages];
      pages[action.payload.pageIndex] = {
        ...pages[action.payload.pageIndex],
        ...(action.payload.borderColor !== undefined && { borderColor: action.payload.borderColor }),
        ...(action.payload.borderWidth !== undefined && { borderWidth: action.payload.borderWidth }),
        ...(action.payload.borderRadius !== undefined && { borderRadius: action.payload.borderRadius })
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.SELECT_ELEMENT:
      newState = { ...state, selectedElementId: action.payload };
      break;
    case ActionTypes.DESELECT_ELEMENT:
      newState = { ...state, selectedElementId: null };
      break;
    case ActionTypes.SET_PROJECT_NAME:
      newState = { ...state, projectName: action.payload };
      break;
    case ActionTypes.SET_PROJECT_TAG:
      newState = { ...state, projectTag: action.payload };
      break;
    case ActionTypes.SET_PROJECT_DESCRIPTION:
      newState = { ...state, projectDescription: action.payload };
      break;
    case ActionTypes.SET_ASPECT_RATIO:
      newState = { ...state, aspectRatio: action.payload };
      break;
    case ActionTypes.ADD_ELEMENT: {
      const pages = [...state.pages];
      const existingElements = pages[state.currentPage].elements;
      // Assign a z-index one above the current highest so the new element is always on top
      const maxZ = existingElements.reduce((m, el) => Math.max(m, el.z ?? 0), -1);
      const newElement = { ...action.payload, z: maxZ + 1 };
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: [...existingElements, newElement],
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.UPDATE_ELEMENT: {
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: pages[state.currentPage].elements.map(el =>
          el.id === action.payload.id ? { ...el, ...action.payload } : el
        ),
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.UPDATE_ELEMENT_NO_HISTORY: {
      // Visual-only position update during arrow-key hold: does NOT push to undo stack
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: pages[state.currentPage].elements.map(el =>
          el.id === action.payload.id ? { ...el, ...action.payload } : el
        ),
      };
      // Early return bypasses the history-push at the bottom of the reducer
      return { ...state, pages };
    }
    case ActionTypes.COMMIT_ELEMENT_MOVE: {
      // Commit the final position of an arrow-key move sequence as a single undo entry.
      // payload: { element (final state), startPages (deep-copy of pages before the sequence) }
      const { element, startPages } = action.payload;
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: pages[state.currentPage].elements.map(el =>
          el.id === element.id ? { ...el, ...element } : el
        ),
      };
      // Use startPages as the undo snapshot so Ctrl+Z jumps back to before the entire move
      const beforeSnapshot = stripHistory({ ...state, pages: startPages });
      return {
        ...state,
        pages,
        history: [...safeHistory, beforeSnapshot],
        future: [], // clear redo stack on new user action
      };
    }
    case ActionTypes.DELETE_ELEMENT: {
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: pages[state.currentPage].elements.filter(el => el.id !== action.payload),
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.SET_ELEMENTS: {
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: action.payload,
      };
      newState = { ...state, pages };
      break;
    }
    case ActionTypes.SET_CURRENT_PAGE:
      newState = { ...state, currentPage: action.payload };
      break;
    case ActionTypes.ADD_PAGE: {
      const newPage = { id: `page-${state.pages.length + 1}`, elements: [] };
      newState = {
        ...state,
        pages: [...state.pages, newPage],
        currentPage: state.pages.length,
      };
      break;
    }
    case ActionTypes.REMOVE_PAGE: {
      let pages = [...state.pages];
      pages.splice(action.payload, 1);
      let currentPage = state.currentPage;
      if (currentPage >= pages.length) currentPage = pages.length - 1;
      newState = { ...state, pages, currentPage };
      break;
    }
    case ActionTypes.SET_ZOOM:
      newState = { ...state, zoom: action.payload };
      break;
    case ActionTypes.UNDO: {
      if (safeHistory.length === 0) return state;
      const prev = safeHistory[safeHistory.length - 1];
      return {
        ...prev,
        history: safeHistory.slice(0, -1),
        future: [stripHistory(state), ...safeFuture],
      };
    }
    case ActionTypes.REDO: {
      if (safeFuture.length === 0) return state;
      const next = safeFuture[0];
      return {
        ...next,
        history: [...safeHistory, stripHistory(state)],
        future: safeFuture.slice(1),
      };
    }
    case ActionTypes.LOAD_STATE:
      newState = { ...action.payload };
      break;
    default:
      return state;
  }
  // Push current state to history for undo, clear future
  return {
    ...newState,
    history: [...safeHistory, stripHistory(state)],
    future: [],
  };
}

// Helper to strip history/future from state for stack
function stripHistory(state) {
  const { history, future, ...rest } = state;
  return rest;
}

const EditorContext = createContext();

export function EditorProvider({ children, websiteId, navigate }) {
  // State lives entirely in memory — no localStorage
  const [state, dispatch] = useReducer(editorReducer, initialDesignState);

  // true while the initial design is being fetched from the server
  const [isLoading, setIsLoading] = useState(!!websiteId);

  // 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const autoSaveTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  // Always-fresh state ref so saveToServer callback never goes stale
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  // Tracks last serialized meaningful state to avoid redundant saves
  const prevMeaningfulRef = useRef(null);
  // Internal design ID — starts from URL param, or gets assigned after create
  const designIdRef = useRef(websiteId || null);

  // On mount: if ID exists load from server, otherwise create a new design
  useEffect(() => {
    if (!navigate) return;
    async function initDesign() {
      if (designIdRef.current) {
        // Load existing design
        const r = await getWithAuth(`${APIURLS.userWebsite}/${designIdRef.current}`, navigate);
        if (r.result && r.data && r.data.jsonData) {
          try {
            const loaded = JSON.parse(r.data.jsonData);
            dispatch({
              type: ActionTypes.LOAD_STATE,
              payload: { ...initialDesignState, ...loaded, history: [], future: [] },
            });
          } catch { /* malformed JSON — keep initial state */ }
        }
        setIsLoading(false);
      } else {
        // No ID — create a new design on the server
        setSaveStatus('saving');
        const { history, future, selectedElementId, zoom, ...designData } = initialDesignState;
        const payload = {
          Name: initialDesignState.projectName || 'Untitled Project',
          Tag: initialDesignState.projectTag || '',
          Description: initialDesignState.projectDescription || '',
          JsonData: JSON.stringify(designData),
          Thumbnail: null,
        };
        const response = await postWithAuth(`${APIURLS.userWebsite}/createcanvas`, navigate, payload);
        if (response.result && response.data && response.data.id) {
          designIdRef.current = response.data.id;
          setSaveStatus('saved');
          clearTimeout(saveStatusTimerRef.current);
          saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
        }
      }
    }
    initDesign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current state to server (update)
  const saveToServer = useCallback(async () => {
    if (!designIdRef.current || !navigate) return;
    setSaveStatus('saving');
    const current = stateRef.current;
    const { history, future, selectedElementId, zoom, ...designData } = current;
    const payload = {
      Id: designIdRef.current,
      Name: current.projectName || 'Untitled Project',
      Tag: current.projectTag || '',
      Description: current.projectDescription || '',
      JsonData: JSON.stringify(designData),
      Thumbnail: null,
    };
    const response = await postWithAuth(`${APIURLS.userWebsite}/updatecanvas`, navigate, payload);
    if (response.result) {
      setSaveStatus('saved');
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  }, [navigate]);

  // Debounced auto-save: fires 2 s after the last meaningful state change.
  // Gated on designIdRef so saves are blocked until create completes.
  useEffect(() => {
    if (!designIdRef.current || !navigate) return;
    const { zoom, selectedElementId, history, future, ...meaningful } = stripHistory(state);
    const serialized = JSON.stringify(meaningful);
    if (prevMeaningfulRef.current === serialized) return; // UI-only change, skip
    prevMeaningfulRef.current = serialized;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(saveToServer, 1000);
  }, [state, navigate, saveToServer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(autoSaveTimerRef.current);
      clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  return (
    <EditorContext.Provider value={{ state, dispatch, ActionTypes, saveStatus, saveToServer, isLoading }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
