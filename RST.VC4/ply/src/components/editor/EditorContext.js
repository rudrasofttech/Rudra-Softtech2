import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULTS } from './constants';

// JSON schema for design state (sample structure)
const initialDesignState = {
  projectName: 'Untitled Project',
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
    case ActionTypes.SET_ASPECT_RATIO:
      newState = { ...state, aspectRatio: action.payload };
      break;
    case ActionTypes.ADD_ELEMENT: {
      const pages = [...state.pages];
      pages[state.currentPage] = {
        ...pages[state.currentPage],
        elements: [...pages[state.currentPage].elements, action.payload],
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

export function EditorProvider({ children }) {
  // Load state from localStorage for persistence
  const [state, dispatch] = useReducer(editorReducer, initialDesignState, (init) => {
    try {
      const saved = localStorage.getItem('editorDesignState');
      return saved ? JSON.parse(saved) : init;
    } catch {
      return init;
    }
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('editorDesignState', JSON.stringify(stripHistory(state)));
  }, [state]);

  return (
    <EditorContext.Provider value={{ state, dispatch, ActionTypes }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
