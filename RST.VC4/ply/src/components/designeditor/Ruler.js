// Ruler.js — reusable canvas ruler component (horizontal or vertical).
//
// Props:
//   orientation  'horizontal' | 'vertical'
//   length       canvas dimension in canvas-px (canvasWidth or canvasHeight)
//   zoom         effective zoom level (state.zoom × fitScale) — maps canvas-px → screen-px
//
// All visual constants come from DEFAULTS so a theme change is a one-line edit.
// The component is pure (no state / no side-effects) and safe to render inside a
// scaled transform wrapper.

import React, { useMemo } from 'react';
import { DEFAULTS } from './constants';

// ─── Tick generation ──────────────────────────────────────────────────────────

/**
 * Picks the coarsest tick interval whose screen-px gap is ≥ RULER_MIN_TICK_GAP_PX.
 * Returns the chosen interval in canvas-px.
 */
function pickInterval(zoom) {
  const { RULER_TICK_INTERVALS, RULER_MIN_TICK_GAP_PX } = DEFAULTS;
  for (let i = RULER_TICK_INTERVALS.length - 1; i >= 0; i--) {
    const interval = RULER_TICK_INTERVALS[i];
    if (interval * zoom >= RULER_MIN_TICK_GAP_PX) return interval;
  }
  return RULER_TICK_INTERVALS[0];
}

/**
 * Generates tick mark data for one ruler axis.
 * Returns an array of { pos, label, isMajor } objects where pos is in canvas-px.
 */
function generateTicks(length, zoom) {
  const majorInterval = pickInterval(zoom);
  const { RULER_SUB_TICK_DIVS } = DEFAULTS;
  const subInterval = majorInterval / RULER_SUB_TICK_DIVS;

  const ticks = [];
  // Major ticks — labelled
  for (let v = 0; v <= length; v += majorInterval) {
    ticks.push({ pos: v, label: String(v), isMajor: true });
  }
  // Sub-ticks — un-labelled, only when the sub-interval is visually distinct
  if (subInterval * zoom >= 4) {
    for (let v = 0; v <= length; v += subInterval) {
      if (v % majorInterval !== 0) {
        ticks.push({ pos: v, label: null, isMajor: false });
      }
    }
  }
  return ticks;
}

// ─── Ruler component ──────────────────────────────────────────────────────────

/**
 * CanvasRuler renders a single ruler strip (horizontal or vertical) scaled to
 * match the canvas zoom level.
 *
 * It uses an SVG for tick marks and labels so they render crisply at any zoom.
 * The SVG coordinate space equals the SCREEN-px dimensions of the ruler strip,
 * so no further scaling is needed inside it.
 */
export default function CanvasRuler({ orientation, length, zoom }) {
  const {
    RULER_THICKNESS,
    RULER_BG,
    RULER_TICK_COLOR,
    RULER_FONT_SIZE,
    RULER_FONT_FAMILY,
  } = DEFAULTS;

  const isHorizontal = orientation === 'horizontal';

  // Screen-px extent of the ruler (matches the zoomed canvas edge)
  const screenLength = length * zoom;

  const ticks = useMemo(() => generateTicks(length, zoom), [length, zoom]);

  // Tick heights within the ruler strip (as fraction of RULER_THICKNESS)
  const majorH = Math.round(RULER_THICKNESS * 0.55);
  const minorH = Math.round(RULER_THICKNESS * 0.3);

  const svgW = isHorizontal ? screenLength : RULER_THICKNESS;
  const svgH = isHorizontal ? RULER_THICKNESS : screenLength;

  const tickMarks = ticks.map((t, i) => {
    const screenPos = t.pos * zoom; // canvas-px → screen-px
    const tickLen = t.isMajor ? majorH : minorH;

    if (isHorizontal) {
      return (
        <g key={i}>
          <line
            x1={screenPos} y1={RULER_THICKNESS - tickLen}
            x2={screenPos} y2={RULER_THICKNESS}
            stroke={RULER_TICK_COLOR} strokeWidth={1}
          />
          {t.label !== null && (
            <text
              x={screenPos + 2}
              y={RULER_THICKNESS - tickLen - 1}
              fontSize={RULER_FONT_SIZE}
              fontFamily={RULER_FONT_FAMILY}
              fill={RULER_TICK_COLOR}
            >
              {t.label}
            </text>
          )}
        </g>
      );
    } else {
      return (
        <g key={i}>
          <line
            x1={RULER_THICKNESS - tickLen} y1={screenPos}
            x2={RULER_THICKNESS}            y2={screenPos}
            stroke={RULER_TICK_COLOR} strokeWidth={1}
          />
          {t.label !== null && (
            <text
              x={RULER_THICKNESS - tickLen - 1}
              y={screenPos - 2}
              fontSize={RULER_FONT_SIZE}
              fontFamily={RULER_FONT_FAMILY}
              fill={RULER_TICK_COLOR}
              textAnchor="end"
              transform={`rotate(-90, ${RULER_THICKNESS - tickLen - 1}, ${screenPos - 2})`}
            >
              {t.label}
            </text>
          )}
        </g>
      );
    }
  });

  return (
    <div
      className="canvas-ruler"
      style={{
        width:  svgW,
        height: svgH,
        flexShrink: 0,
        overflow: 'hidden',
        background: RULER_BG,
        borderBottom: isHorizontal ? `1px solid #ccc` : 'none',
        borderRight:  !isHorizontal ? `1px solid #ccc` : 'none',
        boxSizing: 'border-box',
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        {tickMarks}
      </svg>
    </div>
  );
}

/**
 * RulerCorner — the small square that fills the intersection of the H and V rulers.
 * Keeps the layout clean without a gap in the corner.
 */
export function RulerCorner() {
  const { RULER_THICKNESS, RULER_CORNER_BG } = DEFAULTS;
  return (
    <div
      className="canvas-ruler-corner"
      style={{
        width: RULER_THICKNESS,
        height: RULER_THICKNESS,
        flexShrink: 0,
        background: RULER_CORNER_BG,
        borderRight: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
        boxSizing: 'border-box',
      }}
    />
  );
}
