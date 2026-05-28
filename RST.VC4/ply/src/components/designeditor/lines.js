/**
 * lines.js — Centralized line-type catalog for the design editor.
 *
 * Each entry has:
 *   id          — unique string key stored as element.lineId
 *   label       — display name shown in the picker
 *   category    — grouping label for the picker UI
 *   defaultW/H  — suggested initial element dimensions
 *   render(w, h, opts) — returns React SVG children for that line type
 *                         opts = { stroke, strokeWidth, fill }
 *
 * Adding a new line type: add one object to LINE_CATALOG. Nothing else changes.
 */
import React from 'react';

// ─── Path / layout helpers ────────────────────────────────────────────────────

/** Smooth sine-wave using quadratic bezier with T (reflected) control points */
function sineWavePath(w, h, periods) {
  const cy = h / 2;
  const a  = h * 0.44;
  const hp = w / (periods * 2); // half-period width
  const pts = [`M 0,${cy.toFixed(2)}`];
  // First explicit Q curve (upward arch)
  const cpx0 = (hp * 0.5).toFixed(2);
  const cpy0 = (cy - a).toFixed(2);
  pts.push(`Q ${cpx0},${cpy0} ${hp.toFixed(2)},${cy.toFixed(2)}`);
  // All remaining arches use T — automatically mirrors previous control point
  for (let i = 1; i < periods * 2; i++) {
    const x = Math.min((i + 1) * hp, w);
    pts.push(`T ${x.toFixed(2)},${cy.toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Zigzag: alternates between y=0 (peak) and y=h (trough) */
function zigzagPath(w, h, segs) {
  const pts = [];
  const sw = w / segs;
  for (let i = 0; i <= segs; i++) {
    const x = i * sw;
    const y = i % 2 === 0 ? h : 0;
    pts.push(i === 0 ? `M ${x.toFixed(2)},${y.toFixed(2)}` : `L ${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Sawtooth: slow rise, instant drop */
function sawtoothPath(w, h, segs) {
  const sw = w / segs;
  const pts = [`M 0,${h}`];
  for (let i = 0; i < segs; i++) {
    const x1 = (i + 1) * sw;
    pts.push(`L ${x1.toFixed(2)},0`);   // diagonal rise
    pts.push(`L ${x1.toFixed(2)},${h}`); // vertical drop
  }
  return pts.join(' ');
}

/** Square / digital wave — top for first half of each period, bottom for second */
function squareWavePath(w, h, segs) {
  const sw = w / segs;
  const pts = [`M 0,0`];
  for (let i = 0; i < segs; i++) {
    const x0 = i * sw;
    const xm = x0 + sw / 2;
    const x1 = (i + 1) * sw;
    pts.push(`H ${xm.toFixed(2)}`);  // top half
    pts.push(`V ${h}`);              // drop
    pts.push(`H ${x1.toFixed(2)}`);  // bottom half
    if (i < segs - 1) pts.push(`V 0`); // rise for next period
  }
  return pts.join(' ');
}

/** Staircase: like square wave but only step-up or step-down direction */
function staircasePath(w, h, steps) {
  const sw = w / steps;
  const sh = h / steps;
  const pts = [`M 0,${h}`];
  for (let i = 0; i < steps; i++) {
    const x1 = (i + 1) * sw;
    const y1 = h - (i + 1) * sh;
    pts.push(`H ${x1.toFixed(2)}`); // step right
    pts.push(`V ${y1.toFixed(2)}`); // step up
  }
  return pts.join(' ');
}

/** Spring / coil: extra-tight sine wave */
function springPath(w, h, coils) {
  return sineWavePath(w, h, coils);
}

// ─── Morse code rendering ─────────────────────────────────────────────────────

/**
 * Tiles a morse-style pattern across width w.
 * pattern: string of '·' (dot) and '−' (dash)
 */
function renderMorse(w, h, pattern, stroke, strokeWidth) {
  const cy = h / 2;
  const sw = Math.max(strokeWidth ?? 2, 1);
  const unit = Math.max(sw * 3, h * 0.5); // dot width
  const gap  = unit * 0.9;
  const wordGap = unit * 2.5;

  const elems = [];
  let x = 0; let key = 0;

  while (x < w) {
    for (const ch of pattern) {
      const segW = ch === '−' ? unit * 3 : unit;
      if (x > w) break;
      const x2 = Math.min(x + segW, w);
      elems.push(
        <line key={key++}
          x1={x.toFixed(2)} y1={cy.toFixed(2)}
          x2={x2.toFixed(2)} y2={cy.toFixed(2)}
          stroke={stroke} strokeWidth={sw} strokeLinecap="round"
        />
      );
      x += segW + gap;
    }
    x += wordGap;
  }
  return elems;
}

// ─── Structural renderers ─────────────────────────────────────────────────────

function renderDouble(w, h, stroke, sw) {
  const t = h * 0.18;
  const b = h * 0.82;
  return [
    <line key="t" x1={0} y1={t.toFixed(2)} x2={w} y2={t.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <line key="b" x1={0} y1={b.toFixed(2)} x2={w} y2={b.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
  ];
}

function renderTriple(w, h, stroke, sw) {
  const cy = h / 2;
  return [
    <line key="t" x1={0} y1={(h * 0.1).toFixed(2)} x2={w} y2={(h * 0.1).toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <line key="m" x1={0} y1={cy.toFixed(2)}         x2={w} y2={cy.toFixed(2)}         stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <line key="b" x1={0} y1={(h * 0.9).toFixed(2)}  x2={w} y2={(h * 0.9).toFixed(2)}  stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
  ];
}

function renderRailroad(w, h, stroke, sw) {
  const railT = h * 0.15;
  const railB = h * 0.85;
  const tieSpacing = h * 1.8;
  const elems = [
    <line key="rt" x1={0} y1={railT.toFixed(2)} x2={w} y2={railT.toFixed(2)} stroke={stroke} strokeWidth={sw} />,
    <line key="rb" x1={0} y1={railB.toFixed(2)} x2={w} y2={railB.toFixed(2)} stroke={stroke} strokeWidth={sw} />,
  ];
  let k = 0;
  for (let x = tieSpacing / 2; x < w; x += tieSpacing) {
    elems.push(
      <line key={`tie${k++}`}
        x1={x.toFixed(2)} y1={0}
        x2={x.toFixed(2)} y2={h}
        stroke={stroke} strokeWidth={(sw * 1.8).toFixed(1)} strokeLinecap="square"
      />
    );
  }
  return elems;
}

function renderLadder(w, h, stroke, sw) {
  const spacing = h * 1.2;
  const elems = [
    <line key="t" x1={0} y1={0} x2={w} y2={0} stroke={stroke} strokeWidth={sw} />,
    <line key="b" x1={0} y1={h} x2={w} y2={h} stroke={stroke} strokeWidth={sw} />,
  ];
  let k = 0;
  for (let x = spacing / 2; x < w; x += spacing) {
    elems.push(
      <line key={`r${k++}`}
        x1={x.toFixed(2)} y1={0}
        x2={x.toFixed(2)} y2={h}
        stroke={stroke} strokeWidth={sw}
      />
    );
  }
  return elems;
}

function renderBrick(w, h, stroke, sw) {
  const bw = h * 2.2;
  const bh = h / 2;
  const elems = [];
  let k = 0;
  for (let row = 0; row < 2; row++) {
    const y0 = row * bh;
    const offset = row % 2 === 0 ? 0 : bw / 2;
    for (let bx = -offset; bx < w + bw; bx += bw) {
      const x0 = Math.max(0, bx);
      const x1 = Math.min(w, bx + bw);
      if (x1 <= x0) continue;
      elems.push(
        <rect key={`b${k++}`}
          x={x0.toFixed(2)} y={y0.toFixed(2)}
          width={(x1 - x0).toFixed(2)} height={bh.toFixed(2)}
          fill="none" stroke={stroke} strokeWidth={sw}
        />
      );
    }
  }
  return elems;
}

function renderChain(w, h, stroke, sw) {
  const linkW = h * 1.3;
  const linkH = h * 0.6;
  const spacing = linkW * 0.82;
  const cy = h / 2;
  const elems = [];
  let k = 0;
  for (let x = linkW / 2; x < w + linkW * 0.5; x += spacing) {
    elems.push(
      <ellipse key={`e${k++}`}
        cx={x.toFixed(2)} cy={cy.toFixed(2)}
        rx={(linkW / 2).toFixed(2)} ry={(linkH / 2).toFixed(2)}
        fill="none" stroke={stroke} strokeWidth={sw}
      />
    );
  }
  return elems;
}

function renderCrosshatch(w, h, stroke, sw) {
  const spacing = h * 0.9;
  const elems = [
    <line key="c" x1={0} y1={(h/2).toFixed(2)} x2={w} y2={(h/2).toFixed(2)} stroke={stroke} strokeWidth={sw} />,
  ];
  let k = 0;
  for (let x = spacing / 2; x < w; x += spacing) {
    // X marks
    elems.push(
      <line key={`x1_${k}`} x1={(x - h*0.3).toFixed(2)} y1={0} x2={(x + h*0.3).toFixed(2)} y2={h} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
      <line key={`x2_${k++}`} x1={(x + h*0.3).toFixed(2)} y1={0} x2={(x - h*0.3).toFixed(2)} y2={h} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
    );
  }
  return elems;
}

// ─── Decorated ends ───────────────────────────────────────────────────────────

function renderArrowLine(w, h, stroke, sw) {
  const cy = h / 2;
  const ah = h * 0.5;
  const aw = h * 0.65;
  return [
    <line key="l" x1={0} y1={cy.toFixed(2)} x2={(w - aw).toFixed(2)} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <polygon key="a" points={`${(w-aw).toFixed(2)},${(cy-ah).toFixed(2)} ${w},${cy.toFixed(2)} ${(w-aw).toFixed(2)},${(cy+ah).toFixed(2)}`} fill={stroke} />,
  ];
}

function renderDoubleArrowLine(w, h, stroke, sw) {
  const cy = h / 2;
  const ah = h * 0.5;
  const aw = h * 0.65;
  return [
    <line key="l" x1={aw.toFixed(2)} y1={cy.toFixed(2)} x2={(w-aw).toFixed(2)} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <polygon key="al" points={`${aw.toFixed(2)},${(cy-ah).toFixed(2)} 0,${cy.toFixed(2)} ${aw.toFixed(2)},${(cy+ah).toFixed(2)}`} fill={stroke} />,
    <polygon key="ar" points={`${(w-aw).toFixed(2)},${(cy-ah).toFixed(2)} ${w},${cy.toFixed(2)} ${(w-aw).toFixed(2)},${(cy+ah).toFixed(2)}`} fill={stroke} />,
  ];
}

function renderDiamondLine(w, h, stroke, sw) {
  const cy = h / 2;
  const ds = h * 0.9;
  const ds2 = ds / 2;
  return [
    <line key="l" x1={ds.toFixed(2)} y1={cy.toFixed(2)} x2={(w-ds).toFixed(2)} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <polygon key="dl" points={`0,${cy.toFixed(2)} ${ds2.toFixed(2)},${(cy-ds2).toFixed(2)} ${ds.toFixed(2)},${cy.toFixed(2)} ${ds2.toFixed(2)},${(cy+ds2).toFixed(2)}`} fill={stroke} />,
    <polygon key="dr" points={`${w},${cy.toFixed(2)} ${(w-ds2).toFixed(2)},${(cy-ds2).toFixed(2)} ${(w-ds).toFixed(2)},${cy.toFixed(2)} ${(w-ds2).toFixed(2)},${(cy+ds2).toFixed(2)}`} fill={stroke} />,
  ];
}

function renderCircleLine(w, h, stroke, sw) {
  const cy = h / 2;
  const r  = h * 0.42;
  return [
    <line key="l" x1={(r*2+2).toFixed(2)} y1={cy.toFixed(2)} x2={(w-r*2-2).toFixed(2)} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
    <circle key="cl" cx={r.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={stroke} />,
    <circle key="cr" cx={(w-r).toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={stroke} />,
  ];
}

function renderTickedLine(w, h, stroke, sw) {
  const cy = h / 2;
  const tickH = h * 0.38;
  const spacing = h * 1.6;
  const elems = [
    <line key="l" x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />,
  ];
  let k = 0;
  for (let x = spacing / 2; x < w; x += spacing) {
    elems.push(
      <line key={`t${k++}`}
        x1={x.toFixed(2)} y1={(cy - tickH).toFixed(2)}
        x2={x.toFixed(2)} y2={(cy + tickH).toFixed(2)}
        stroke={stroke} strokeWidth={sw} strokeLinecap="round"
      />
    );
  }
  return elems;
}

function renderGrooveWave(w, h, stroke, sw, halfPeriods) {
  // Two offset sine waves to create a groove/ridge appearance
  const cy = h / 2;
  const a  = h * 0.22;
  const hp = w / halfPeriods;
  const offset = h * 0.18;

  function wavePts(yOff) {
    const pts = [`M 0,${(cy + yOff).toFixed(2)}`];
    pts.push(`Q ${(hp * 0.5).toFixed(2)},${(cy + yOff - a).toFixed(2)} ${hp.toFixed(2)},${(cy + yOff).toFixed(2)}`);
    for (let i = 1; i < halfPeriods; i++) {
      const x = Math.min((i + 1) * hp, w);
      pts.push(`T ${x.toFixed(2)},${(cy + yOff).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  return [
    <path key="g1" d={wavePts(-offset)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeOpacity="0.6" />,
    <path key="g2" d={wavePts(offset)}  stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />,
  ];
}

// ─── Symbol-series renderer ───────────────────────────────────────────────────

function renderSymbols(w, h, symbol, fill) {
  const fs  = h * 1.05;
  const gap = fs * 0.18;
  const elems = [];
  let x = fs * 0.55; let k = 0;
  while (x - fs * 0.5 < w) {
    elems.push(
      <text key={k++}
        x={x.toFixed(2)} y={(h * 0.80).toFixed(2)}
        textAnchor="middle" fontSize={fs.toFixed(1)} fill={fill}
        style={{ userSelect: 'none', fontFamily: 'serif' }}
      >{symbol}</text>
    );
    x += fs + gap;
  }
  return elems;
}

function renderCircleSeries(w, h, stroke, sw, fill) {
  const r  = h * 0.38;
  const gap = r * 0.5;
  const cy = h / 2;
  const elems = [];
  let x = r; let k = 0;
  while (x + r <= w + r) {
    elems.push(
      <circle key={k++} cx={x.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)}
        fill={fill || 'none'} stroke={stroke} strokeWidth={sw} />
    );
    x += r * 2 + gap;
  }
  return elems;
}

function renderTriangleSeries(w, h, stroke, sw, fill) {
  const tw = h * 0.9;
  const th = h * 0.85;
  const gap = tw * 0.3;
  const oy = (h - th) / 2;
  const elems = [];
  let x = 0; let k = 0;
  while (x + tw <= w + tw * 0.5) {
    elems.push(
      <polygon key={k++}
        points={`${(x + tw/2).toFixed(2)},${oy.toFixed(2)} ${(x+tw).toFixed(2)},${(oy+th).toFixed(2)} ${x.toFixed(2)},${(oy+th).toFixed(2)}`}
        fill={fill || 'none'} stroke={stroke} strokeWidth={sw}
      />
    );
    x += tw + gap;
  }
  return elems;
}

function renderDiamondSeries(w, h, stroke, sw, fill) {
  const dw = h * 0.8;
  const dh = h * 0.8;
  const gap = dw * 0.3;
  const cy  = h / 2;
  const elems = [];
  let x = dw / 2; let k = 0;
  while (x + dw / 2 <= w + dw * 0.5) {
    elems.push(
      <polygon key={k++}
        points={`${x.toFixed(2)},${(cy - dh/2).toFixed(2)} ${(x + dw/2).toFixed(2)},${cy.toFixed(2)} ${x.toFixed(2)},${(cy + dh/2).toFixed(2)} ${(x - dw/2).toFixed(2)},${cy.toFixed(2)}`}
        fill={fill || stroke} stroke={stroke} strokeWidth={sw}
      />
    );
    x += dw + gap;
  }
  return elems;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const LINE_CATALOG = [
  // ── Basic ──────────────────────────────────────────────────────────────────
  {
    id: 'straight', label: 'Straight', category: 'Basic',
    defaultW: 160, defaultH: 8,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const cy = h / 2;
      return <line x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />;
    },
  },
  {
    id: 'dashed', label: 'Dashed', category: 'Basic',
    defaultW: 160, defaultH: 8,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const cy = h / 2;
      return <line x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw}
        strokeLinecap="butt" strokeDasharray={`${sw * 5},${sw * 2.5}`} />;
    },
  },
  {
    id: 'dotted', label: 'Dotted', category: 'Basic',
    defaultW: 160, defaultH: 8,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const cy = h / 2;
      return <line x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`0.1,${sw * 2.8}`} />;
    },
  },
  {
    id: 'dash-dot', label: 'Dash Dot', category: 'Basic',
    defaultW: 160, defaultH: 8,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const cy = h / 2;
      return <line x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`${sw*5},${sw*2},${sw*0.5},${sw*2}`} />;
    },
  },
  {
    id: 'long-dash', label: 'Long Dash', category: 'Basic',
    defaultW: 160, defaultH: 8,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const cy = h / 2;
      return <line x1={0} y1={cy.toFixed(2)} x2={w} y2={cy.toFixed(2)} stroke={stroke} strokeWidth={sw}
        strokeLinecap="butt" strokeDasharray={`${sw * 12},${sw * 3}`} />;
    },
  },
  {
    id: 'double', label: 'Double', category: 'Basic',
    defaultW: 160, defaultH: 12,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderDouble(w, h, stroke, sw)}</>,
  },
  {
    id: 'triple', label: 'Triple', category: 'Basic',
    defaultW: 160, defaultH: 14,
    render: (w, h, { stroke, strokeWidth: sw = 1.5 }) => <>{renderTriple(w, h, stroke, sw)}</>,
  },
  // ── Wavy ───────────────────────────────────────────────────────────────────
  {
    id: 'sine-wave', label: 'Sine Wave', category: 'Wavy',
    defaultW: 160, defaultH: 24,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const periods = Math.max(1, Math.round(w / 40));
      return <path d={sineWavePath(w, h, periods)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    },
  },
  {
    id: 'tight-wave', label: 'Tight Wave', category: 'Wavy',
    defaultW: 160, defaultH: 16,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const periods = Math.max(1, Math.round(w / 20));
      return <path d={sineWavePath(w, h, periods)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    },
  },
  {
    id: 'loose-wave', label: 'Loose Wave', category: 'Wavy',
    defaultW: 160, defaultH: 30,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const periods = Math.max(1, Math.round(w / 80));
      return <path d={sineWavePath(w, h, periods)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    },
  },
  {
    id: 'spring', label: 'Spring / Coil', category: 'Wavy',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const coils = Math.max(2, Math.round(w * 14 / 160));
      return <path d={springPath(w, h, coils)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    },
  },
  {
    id: 'groove', label: 'Groove', category: 'Wavy',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const halfPeriods = Math.max(2, Math.round(w / 20));
      return <>{renderGrooveWave(w, h, stroke, sw, halfPeriods)}</>;
    },
  },
  // ── Jagged ─────────────────────────────────────────────────────────────────
  {
    id: 'zigzag', label: 'Zigzag', category: 'Jagged',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const segs = Math.max(2, Math.round(w / 16));
      return <path d={zigzagPath(w, h, segs)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    },
  },
  {
    id: 'sawtooth', label: 'Sawtooth', category: 'Jagged',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const segs = Math.max(2, Math.round(w / 20));
      return <path d={sawtoothPath(w, h, segs)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    },
  },
  {
    id: 'square-wave', label: 'Square Wave', category: 'Jagged',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const segs = Math.max(1, Math.round(w * 6 / 160));
      return <path d={squareWavePath(w, h, segs)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="square" strokeLinejoin="miter" />;
    },
  },
  {
    id: 'sharp-zigzag', label: 'Sharp Zigzag', category: 'Jagged',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const segs = Math.max(2, Math.round(w * 14 / 160));
      return <path d={zigzagPath(w, h, segs)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    },
  },
  {
    id: 'staircase', label: 'Staircase', category: 'Jagged',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => {
      const steps = Math.max(2, Math.round(w * 6 / 160));
      return <path d={staircasePath(w, h, steps)} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="square" strokeLinejoin="miter" />;
    },
  },
  // ── Morse ──────────────────────────────────────────────────────────────────
  {
    id: 'morse', label: 'Morse Code', category: 'Morse',
    defaultW: 160, defaultH: 12,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderMorse(w, h, '−·−·−−·−', stroke, sw)}</>,
  },
  {
    id: 'morse-sos', label: 'SOS (···−−−···)', category: 'Morse',
    defaultW: 160, defaultH: 12,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderMorse(w, h, '···−−−···', stroke, sw)}</>,
  },
  {
    id: 'morse-dashes', label: 'Morse Dashes', category: 'Morse',
    defaultW: 160, defaultH: 12,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderMorse(w, h, '−−·−−', stroke, sw)}</>,
  },
  {
    id: 'morse-mixed', label: 'Morse Mixed', category: 'Morse',
    defaultW: 160, defaultH: 12,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderMorse(w, h, '·−·−··−−', stroke, sw)}</>,
  },
  // ── Decorated Ends ─────────────────────────────────────────────────────────
  {
    id: 'arrow-line', label: 'Arrow', category: 'Decorated',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderArrowLine(w, h, stroke, sw)}</>,
  },
  {
    id: 'double-arrow', label: 'Double Arrow', category: 'Decorated',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderDoubleArrowLine(w, h, stroke, sw)}</>,
  },
  {
    id: 'diamond-line', label: 'Diamond Ends', category: 'Decorated',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderDiamondLine(w, h, stroke, sw)}</>,
  },
  {
    id: 'circle-line', label: 'Circle Ends', category: 'Decorated',
    defaultW: 160, defaultH: 18,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderCircleLine(w, h, stroke, sw)}</>,
  },
  {
    id: 'ticked', label: 'Ticked', category: 'Decorated',
    defaultW: 160, defaultH: 20,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderTickedLine(w, h, stroke, sw)}</>,
  },
  {
    id: 'crosshatch', label: 'Crosshatch', category: 'Decorated',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderCrosshatch(w, h, stroke, sw)}</>,
  },
  // ── Grooving / Structural ──────────────────────────────────────────────────
  {
    id: 'railroad', label: 'Railroad', category: 'Grooving',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderRailroad(w, h, stroke, sw)}</>,
  },
  {
    id: 'ladder', label: 'Ladder', category: 'Grooving',
    defaultW: 160, defaultH: 20,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderLadder(w, h, stroke, sw)}</>,
  },
  {
    id: 'chain', label: 'Chain', category: 'Grooving',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderChain(w, h, stroke, sw)}</>,
  },
  {
    id: 'brick', label: 'Brick', category: 'Grooving',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2 }) => <>{renderBrick(w, h, stroke, sw)}</>,
  },
  // ── Card Suits ─────────────────────────────────────────────────────────────
  {
    id: 'hearts', label: 'Hearts ♥', category: 'Card Suits',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '♥', fill || stroke || '#e53935')}</>,
  },
  {
    id: 'spades', label: 'Spades ♠', category: 'Card Suits',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '♠', fill || stroke || '#1a1a2e')}</>,
  },
  {
    id: 'clubs', label: 'Clubs ♣', category: 'Card Suits',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '♣', fill || stroke || '#1a1a2e')}</>,
  },
  {
    id: 'diamonds', label: 'Diamonds ♦', category: 'Card Suits',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '♦', fill || stroke || '#e53935')}</>,
  },
  // ── Symbol Series ──────────────────────────────────────────────────────────
  {
    id: 'stars', label: 'Stars ★', category: 'Symbols',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '★', fill || stroke || '#f59e0b')}</>,
  },
  {
    id: 'circles-series', label: 'Circles', category: 'Symbols',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2, fill }) => <>{renderCircleSeries(w, h, stroke, sw, fill)}</>,
  },
  {
    id: 'triangles-series', label: 'Triangles', category: 'Symbols',
    defaultW: 160, defaultH: 24,
    render: (w, h, { stroke, strokeWidth: sw = 2, fill }) => <>{renderTriangleSeries(w, h, stroke, sw, fill)}</>,
  },
  {
    id: 'diamonds-series', label: 'Diamonds ◆', category: 'Symbols',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, strokeWidth: sw = 2, fill }) => <>{renderDiamondSeries(w, h, stroke, sw, fill)}</>,
  },
  {
    id: 'flowers', label: 'Flowers ❀', category: 'Symbols',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '❀', fill || stroke || '#e879f9')}</>,
  },
  {
    id: 'snowflakes', label: 'Snowflakes ❄', category: 'Symbols',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '❄', fill || stroke || '#38bdf8')}</>,
  },
  {
    id: 'arrows-series', label: 'Arrows →', category: 'Symbols',
    defaultW: 160, defaultH: 26,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '→', fill || stroke || '#333')}</>,
  },
  {
    id: 'bullets', label: 'Bullets •', category: 'Symbols',
    defaultW: 160, defaultH: 22,
    render: (w, h, { stroke, fill }) => <>{renderSymbols(w, h, '•', fill || stroke || '#555')}</>,
  },
];

/** Ordered category list — controls display order in picker */
export const LINE_CATEGORIES = [
  'Basic',
  'Wavy',
  'Jagged',
  'Morse',
  'Decorated',
  'Grooving',
  'Card Suits',
  'Symbols',
];

/** Quick lookup by id */
export const LINE_BY_ID = Object.fromEntries(LINE_CATALOG.map(l => [l.id, l]));

/**
 * Renders SVG children for a line definition.
 * Returns React SVG elements (no outer <svg> tag).
 */
export function renderLineSvgContent(lineDef, w, h, strokeColor, strokeWidth, fillColor) {
  if (!lineDef) return null;
  return lineDef.render(w, h, {
    stroke:      strokeColor  ?? '#222222',
    strokeWidth: strokeWidth  ?? 2,
    fill:        fillColor    ?? strokeColor ?? '#222222',
  });
}
