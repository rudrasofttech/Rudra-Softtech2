/**
 * shapes.js — Centralized shape catalog for the design editor.
 *
 * Each shape entry has:
 *   id        — unique string key, stored on the element as element.shapeId
 *   label     — display name shown in the picker
 *   category  — grouping label used in the picker UI
 *   getSvgPath(w, h) — returns an SVG <path> or <polygon> d-string (or null for primitives)
 *   svgElement — 'path' | 'polygon' | 'circle' | 'ellipse' | 'rect' | 'icon' (the SVG tag to render)
 *   defaultW  — suggested initial width
 *   defaultH  — suggested initial height
 *   previewSvg — small inline SVG string shown in the picker grid
 *
 * Adding a new shape: add an entry to SHAPE_CATALOG below. The renderer in
 * ElementControls.js iterates this catalog — no other file needs changing.
 *
 * Icons (svgElement: 'icon') are imported from icons.js and appended automatically.
 * Each icon entry has an additional { iconViewBox, iconCategory, paths[] } fields.
 */
import { ICON_CATALOG } from './icons';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Regular polygon points (cx,cy centred, radius r, n sides, offset rotation in deg) */
function polyPoints(n, w, h, rotDeg = 0) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2;
  const rot = (rotDeg * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const angle = rot + (2 * Math.PI * i) / n - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

/** Arrow pointing right, fitted to w×h */
function arrowRightPath(w, h) {
  const hw = h * 0.35; // half shaft height
  const hx = w * 0.6; // where head starts
  const cy = h / 2;
  return [
    `M 0,${cy - hw}`,
    `L ${hx},${cy - hw}`,
    `L ${hx},${cy - h * 0.5}`,
    `L ${w},${cy}`,
    `L ${hx},${cy + h * 0.5}`,
    `L ${hx},${cy + hw}`,
    `L 0,${cy + hw}`,
    'Z',
  ].join(' ');
}

/** Arrow pointing left */
function arrowLeftPath(w, h) {
  const hw = h * 0.35;
  const hx = w * 0.4;
  const cy = h / 2;
  return [
    `M ${w},${cy - hw}`,
    `L ${hx},${cy - hw}`,
    `L ${hx},${cy - h * 0.5}`,
    `L 0,${cy}`,
    `L ${hx},${cy + h * 0.5}`,
    `L ${hx},${cy + hw}`,
    `L ${w},${cy + hw}`,
    'Z',
  ].join(' ');
}

/** Arrow pointing up */
function arrowUpPath(w, h) {
  const hw = w * 0.35;
  const hy = h * 0.4;
  const cx = w / 2;
  return [
    `M ${cx - hw},${h}`,
    `L ${cx - hw},${hy}`,
    `L ${cx - w * 0.5},${hy}`,
    `L ${cx},0`,
    `L ${cx + w * 0.5},${hy}`,
    `L ${cx + hw},${hy}`,
    `L ${cx + hw},${h}`,
    'Z',
  ].join(' ');
}

/** Arrow pointing down */
function arrowDownPath(w, h) {
  const hw = w * 0.35;
  const hy = h * 0.6;
  const cx = w / 2;
  return [
    `M ${cx - hw},0`,
    `L ${cx - hw},${hy}`,
    `L ${cx - w * 0.5},${hy}`,
    `L ${cx},${h}`,
    `L ${cx + w * 0.5},${hy}`,
    `L ${cx + hw},${hy}`,
    `L ${cx + hw},0`,
    'Z',
  ].join(' ');
}

/** Double-headed horizontal arrow */
function arrowDoubleHPath(w, h) {
  const hw = h * 0.35;
  const hx = w * 0.3;
  const cy = h / 2;
  return [
    `M 0,${cy}`,
    `L ${hx},${cy - h * 0.5}`,
    `L ${hx},${cy - hw}`,
    `L ${w - hx},${cy - hw}`,
    `L ${w - hx},${cy - h * 0.5}`,
    `L ${w},${cy}`,
    `L ${w - hx},${cy + h * 0.5}`,
    `L ${w - hx},${cy + hw}`,
    `L ${hx},${cy + hw}`,
    `L ${hx},${cy + h * 0.5}`,
    'Z',
  ].join(' ');
}

/** Semi-circle (top half) */
function semiCirclePath(w, h) {
  const r = w / 2;
  return `M 0,${h} A ${r},${h} 0 0 1 ${w},${h} Z`;
}

/** Quarter circle (top-left quadrant) */
function quarterCirclePath(w, h) {
  return `M 0,${h} L 0,0 A ${w},${h} 0 0 1 ${w},${h} Z`;
}

/** Parabola (open top, filled) */
function parabolaPath(w, h) {
  const steps = 20;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0..1
    const x = t * w;
    const nx = t * 2 - 1; // -1..1
    const y = nx * nx * h; // parabola, 0 at ±1, peak=0 at centre (flipped)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x},${h - y}`);
  }
  pts.push(`L ${w},0 L 0,0 Z`);
  return pts.join(' ');
}

/** Heart shape */
function heartPath(w, h) {
  const cx = w / 2, cy = h / 2;
  // scaled unit heart
  return `M ${cx},${h * 0.85}
    C ${cx},${h * 0.85} ${0},${h * 0.55} ${0},${h * 0.35}
    A ${w * 0.25},${h * 0.25} 0 0 1 ${cx},${h * 0.25}
    A ${w * 0.25},${h * 0.25} 0 0 1 ${w},${h * 0.35}
    C ${w},${h * 0.55} ${cx},${h * 0.85} ${cx},${h * 0.85} Z`;
}

/** Star polygon with n points */
function starPath(n, w, h) {
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) / 2; // outer radius
  const r = R * 0.45;            // inner radius
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? R : r;
    const angle = (Math.PI * i) / n - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

/** Cross / plus shape */
function crossPath(w, h) {
  const t = w * 0.3; // thickness fraction
  const tw = h * 0.3;
  const cx = w / 2, cy = h / 2;
  return [
    `M ${cx - t / 2},0`,
    `L ${cx + t / 2},0`,
    `L ${cx + t / 2},${cy - tw / 2}`,
    `L ${w},${cy - tw / 2}`,
    `L ${w},${cy + tw / 2}`,
    `L ${cx + t / 2},${cy + tw / 2}`,
    `L ${cx + t / 2},${h}`,
    `L ${cx - t / 2},${h}`,
    `L ${cx - t / 2},${cy + tw / 2}`,
    `L 0,${cy + tw / 2}`,
    `L 0,${cy - tw / 2}`,
    `L ${cx - t / 2},${cy - tw / 2}`,
    'Z',
  ].join(' ');
}

/** Parallelogram */
function parallelogramPath(w, h) {
  const offset = w * 0.2;
  return `M ${offset},0 L ${w},0 L ${w - offset},${h} L 0,${h} Z`;
}

/** Trapezoid */
function trapezoidPath(w, h) {
  const inset = w * 0.2;
  return `M ${inset},0 L ${w - inset},0 L ${w},${h} L 0,${h} Z`;
}

/** Rounded rectangle helper — returns an SVG path d string */
function roundedRectPath(w, h, r) {
  const cr = Math.min(r, w / 2, h / 2);
  return [
    `M ${cr},0`,
    `L ${w - cr},0 Q ${w},0 ${w},${cr}`,
    `L ${w},${h - cr} Q ${w},${h} ${w - cr},${h}`,
    `L ${cr},${h} Q 0,${h} 0,${h - cr}`,
    `L 0,${cr} Q 0,0 ${cr},0 Z`,
  ].join(' ');
}

/** Diamond (rhombus) */
function diamondPath(w, h) {
  return `M ${w / 2},0 L ${w},${h / 2} L ${w / 2},${h} L 0,${h / 2} Z`;
}

/** Speech bubble (rectangle with tail) */
function speechBubblePath(w, h) {
  const r = 12;
  const tailW = w * 0.12;
  const tailX = w * 0.25;
  const bh = h * 0.78; // bubble body height
  return [
    `M ${r},0`,
    `L ${w - r},0 Q ${w},0 ${w},${r}`,
    `L ${w},${bh - r} Q ${w},${bh} ${w - r},${bh}`,
    `L ${tailX + tailW},${bh}`,
    `L ${tailX + tailW * 0.5},${h}`,
    `L ${tailX},${bh}`,
    `L ${r},${bh} Q 0,${bh} 0,${bh - r}`,
    `L 0,${r} Q 0,0 ${r},0 Z`,
  ].join(' ');
}

/** Chevron pointing right */
function chevronRightPath(w, h) {
  const mid = w * 0.6;
  const cy = h / 2;
  return `M 0,0 L ${mid},${cy} L 0,${h} L ${w * 0.4},${h} L ${w},${cy} L ${w * 0.4},0 Z`;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const SHAPE_CATALOG = [
  // ── Basic ──────────────────────────────────────────────────────────────────
  {
    id: 'rectangle',
    label: 'Rectangle',
    category: 'Basic',
    defaultW: 120, defaultH: 70,
    svgElement: 'rect',
    getSvgProps: (w, h, style) => ({
      x: 0, y: 0, width: w, height: h,
      rx: style?.cornerRadius ?? 0,
      ry: style?.cornerRadius ?? 0,
    }),
  },
  {
    id: 'rounded-rect',
    label: 'Rounded Rect',
    category: 'Basic',
    defaultW: 120, defaultH: 70,
    svgElement: 'path',
    getSvgPath: (w, h, style) => roundedRectPath(w, h, style?.cornerRadius ?? 20),
  },
  {
    id: 'circle',
    label: 'Circle',
    category: 'Basic',
    defaultW: 80, defaultH: 80,
    svgElement: 'ellipse',
    getSvgProps: (w, h) => ({ cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2 }),
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    category: 'Basic',
    defaultW: 120, defaultH: 70,
    svgElement: 'ellipse',
    getSvgProps: (w, h) => ({ cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2 }),
  },
  {
    id: 'line',
    label: 'Line',
    category: 'Basic',
    defaultW: 120, defaultH: 4,
    svgElement: 'line',
    getSvgProps: (w, h) => ({ x1: 0, y1: h / 2, x2: w, y2: h / 2, strokeWidth: h }),
  },
  {
    id: 'diamond',
    label: 'Diamond',
    category: 'Basic',
    defaultW: 80, defaultH: 80,
    svgElement: 'path',
    getSvgPath: (w, h) => diamondPath(w, h),
  },
  // ── Triangles ──────────────────────────────────────────────────────────────
  {
    id: 'triangle',
    label: 'Triangle',
    category: 'Triangles',
    defaultW: 100, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: `${w / 2},0 ${w},${h} 0,${h}` }),
  },
  {
    id: 'triangle-right',
    label: 'Right Triangle',
    category: 'Triangles',
    defaultW: 100, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: `0,0 ${w},${h} 0,${h}` }),
  },
  {
    id: 'triangle-down',
    label: 'Triangle Down',
    category: 'Triangles',
    defaultW: 100, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: `0,0 ${w},0 ${w / 2},${h}` }),
  },
  {
    id: 'triangle-left',
    label: 'Left Triangle',
    category: 'Triangles',
    defaultW: 100, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: `0,0 ${w},0 ${w},${h}` }),
  },
  // ── Quadrilaterals ─────────────────────────────────────────────────────────
  {
    id: 'parallelogram',
    label: 'Parallelogram',
    category: 'Quadrilaterals',
    defaultW: 120, defaultH: 70,
    svgElement: 'path',
    getSvgPath: (w, h) => parallelogramPath(w, h),
  },
  {
    id: 'trapezoid',
    label: 'Trapezoid',
    category: 'Quadrilaterals',
    defaultW: 120, defaultH: 70,
    svgElement: 'path',
    getSvgPath: (w, h) => trapezoidPath(w, h),
  },
  {
    id: 'rhombus',
    label: 'Rhombus',
    category: 'Quadrilaterals',
    defaultW: 100, defaultH: 100,
    svgElement: 'path',
    getSvgPath: (w, h) => diamondPath(w, h),
  },
  // ── Polygons ───────────────────────────────────────────────────────────────
  {
    id: 'pentagon',
    label: 'Pentagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(5, w, h) }),
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(6, w, h, 0) }),
  },
  {
    id: 'heptagon',
    label: 'Heptagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(7, w, h) }),
  },
  {
    id: 'octagon',
    label: 'Octagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(8, w, h, 22.5) }),
  },
  {
    id: 'decagon',
    label: 'Decagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(10, w, h) }),
  },
  {
    id: 'dodecagon',
    label: 'Dodecagon',
    category: 'Polygons',
    defaultW: 90, defaultH: 90,
    svgElement: 'polygon',
    getSvgProps: (w, h) => ({ points: polyPoints(12, w, h, 15) }),
  },
  // ── Curves ─────────────────────────────────────────────────────────────────
  {
    id: 'semi-circle',
    label: 'Semi Circle',
    category: 'Curves',
    defaultW: 100, defaultH: 60,
    svgElement: 'path',
    getSvgPath: (w, h) => semiCirclePath(w, h),
  },
  {
    id: 'quarter-circle',
    label: 'Quarter Circle',
    category: 'Curves',
    defaultW: 90, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => quarterCirclePath(w, h),
  },
  {
    id: 'parabola',
    label: 'Parabola',
    category: 'Curves',
    defaultW: 120, defaultH: 80,
    svgElement: 'path',
    getSvgPath: (w, h) => parabolaPath(w, h),
  },
  // ── Stars ──────────────────────────────────────────────────────────────────
  {
    id: 'star-4',
    label: '4-Point Star',
    category: 'Stars',
    defaultW: 90, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => starPath(4, w, h),
  },
  {
    id: 'star-5',
    label: '5-Point Star',
    category: 'Stars',
    defaultW: 90, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => starPath(5, w, h),
  },
  {
    id: 'star-6',
    label: '6-Point Star',
    category: 'Stars',
    defaultW: 90, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => starPath(6, w, h),
  },
  {
    id: 'star-8',
    label: '8-Point Star',
    category: 'Stars',
    defaultW: 90, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => starPath(8, w, h),
  },
  // ── Arrows ─────────────────────────────────────────────────────────────────
  {
    id: 'arrow-right',
    label: 'Arrow Right',
    category: 'Arrows',
    defaultW: 120, defaultH: 60,
    svgElement: 'path',
    getSvgPath: (w, h) => arrowRightPath(w, h),
  },
  {
    id: 'arrow-left',
    label: 'Arrow Left',
    category: 'Arrows',
    defaultW: 120, defaultH: 60,
    svgElement: 'path',
    getSvgPath: (w, h) => arrowLeftPath(w, h),
  },
  {
    id: 'arrow-up',
    label: 'Arrow Up',
    category: 'Arrows',
    defaultW: 60, defaultH: 120,
    svgElement: 'path',
    getSvgPath: (w, h) => arrowUpPath(w, h),
  },
  {
    id: 'arrow-down',
    label: 'Arrow Down',
    category: 'Arrows',
    defaultW: 60, defaultH: 120,
    svgElement: 'path',
    getSvgPath: (w, h) => arrowDownPath(w, h),
  },
  {
    id: 'arrow-double-h',
    label: 'Double Arrow',
    category: 'Arrows',
    defaultW: 120, defaultH: 60,
    svgElement: 'path',
    getSvgPath: (w, h) => arrowDoubleHPath(w, h),
  },
  {
    id: 'chevron-right',
    label: 'Chevron',
    category: 'Arrows',
    defaultW: 100, defaultH: 70,
    svgElement: 'path',
    getSvgPath: (w, h) => chevronRightPath(w, h),
  },
  // ── Symbols ────────────────────────────────────────────────────────────────
  {
    id: 'heart',
    label: 'Heart',
    category: 'Symbols',
    defaultW: 90, defaultH: 80,
    svgElement: 'path',
    getSvgPath: (w, h) => heartPath(w, h),
  },
  {
    id: 'cross',
    label: 'Cross / Plus',
    category: 'Symbols',
    defaultW: 80, defaultH: 80,
    svgElement: 'path',
    getSvgPath: (w, h) => crossPath(w, h),
  },
  {
    id: 'speech-bubble',
    label: 'Speech Bubble',
    category: 'Symbols',
    defaultW: 130, defaultH: 90,
    svgElement: 'path',
    getSvgPath: (w, h) => speechBubblePath(w, h),
  },
];

/** Ordered list of category names (controls display order in picker) */
export const SHAPE_CATEGORIES = [
  'Basic',
  'Triangles',
  'Quadrilaterals',
  'Polygons',
  'Curves',
  'Stars',
  'Arrows',
  'Symbols',
];

/** Quick lookup by id — includes both shapes and icons so canvas rendering always works */
export const SHAPE_BY_ID = {
  ...Object.fromEntries(SHAPE_CATALOG.map(s => [s.id, s])),
  ...Object.fromEntries(ICON_CATALOG.map(s => [s.id, s])),
};

/**
 * Renders the SVG content for a shape definition at given dimensions.
 * Returns a React element (SVG child).
 * fillColor / strokeColor / strokeWidth are applied directly.
 */
export function renderShapeSvgContent(shapeDef, w, h, fillColor, strokeColor, strokeWidth, extraStyle) {
  if (!shapeDef) return null;
  const fill   = fillColor   ?? '#eeeeee';
  const stroke = strokeColor ?? 'none';
  const sw     = strokeWidth ?? 0;
  const style  = extraStyle  ?? {};

  if (shapeDef.svgElement === 'rect') {
    const p = shapeDef.getSvgProps(w, h, style);
    return <rect {...p} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
  if (shapeDef.svgElement === 'ellipse' || shapeDef.svgElement === 'circle') {
    const p = shapeDef.getSvgProps(w, h, style);
    return <ellipse {...p} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
  if (shapeDef.svgElement === 'line') {
    const p = shapeDef.getSvgProps(w, h, style);
    return <line {...p} stroke={fill} strokeWidth={sw > 0 ? sw : h} strokeLinecap="round" />;
  }
  if (shapeDef.svgElement === 'polygon') {
    const p = shapeDef.getSvgProps(w, h, style);
    return <polygon {...p} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
  if (shapeDef.svgElement === 'path') {
    const d = shapeDef.getSvgPath(w, h, style);
    return <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
  if (shapeDef.svgElement === 'icon') {
    // Scale Bootstrap Icons' native 16×16 (or custom iconViewBox) coordinate space
    // to the element's actual w×h bounding box.
    const vbParts = (shapeDef.iconViewBox || '0 0 16 16').split(' ').map(Number);
    const vw = vbParts[2] || 16;
    const vh = vbParts[3] || 16;
    const sx = w / vw;
    const sy = h / vh;

    // Support both the legacy 'paths' format [{d, fillRule}]
    // and the current 'elements' format [{tag, d, fill-rule, cx, ...}].
    const elements = shapeDef.elements
      || (shapeDef.paths || []).map(p => ({ tag: 'path', d: p.d, 'fill-rule': p.fillRule }));

    return (
      <g transform={`scale(${sx},${sy})`} fill={fill} stroke="none">
        {elements.map((el, i) => {
          const { tag, ...rawAttrs } = el;
          // Convert SVG attribute kebab-case names to React camelCase
          const attrs = {};
          for (const [k, v] of Object.entries(rawAttrs)) {
            if (v === undefined || v === null) continue;
            const reactKey = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            attrs[reactKey] = v;
          }
          if (tag === 'path')     return <path     key={i} {...attrs} />;
          if (tag === 'circle')   return <circle   key={i} {...attrs} />;
          if (tag === 'ellipse')  return <ellipse  key={i} {...attrs} />;
          if (tag === 'rect')     return <rect     key={i} {...attrs} />;
          if (tag === 'line')     return <line     key={i} {...attrs} />;
          if (tag === 'polygon')  return <polygon  key={i} {...attrs} />;
          if (tag === 'polyline') return <polyline key={i} {...attrs} />;
          return null;
        })}
      </g>
    );
  }
  return null;
}
