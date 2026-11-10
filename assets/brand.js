/* brmbh brand geometry: the one source for the mark.
   Read by the page (assets/v1.js) and by the asset generator (tools/brand-assets.mjs),
   so the favicon, lockups and social card can never drift from what the page draws. */
(() => {
  const TAU = Math.PI * 2, PI = Math.PI;

  // piece colours on paper; on ink the black piece prints paper-white
  const COL = { white: '#1c1c20', red: '#e5484d', yellow: '#f2c200', blue: '#4d5bf9', tray: '#d9d8d2', slot: '#bdbcb5' };
  const INK = { ...COL, white: '#ecebe6' };
  const PAPER = { s1: '#e6e5df', s2: '#ecebe6', s3: '#f3f2ee', ink: '#111114', ink3: '#85858b' };

  function arc(cx, cy, r, a0, a1, n, closedLoop) {
    const pts = [], m = closedLoop ? n - 1 : n;
    for (let i = 0; i <= m; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  const SHAPES = {
    circle:   arc(0, 0, .5, 0, TAU, 40, true),
    triangle: arc(0, .08, .56, -PI / 2, -PI / 2 + TAU, 3, true),
    quarter:  [[-.5, .5], ...arc(-.5, .5, 1, -PI / 2, 0, 18)],
  };
  // the four pillars = the mark, in mark order (TL, TR, BL, BR)
  const MARK = [
    { k: 'quarter',  c: 'white',  role: 'Theme' },
    { k: 'circle',   c: 'red',    role: 'SCF' },
    { k: 'quarter',  c: 'blue',   role: 'CLI', r: 1 },
    { k: 'triangle', c: 'yellow', role: 'Skills' },
  ];

  const rot2 = (pts, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); };
  const f = n => +n.toFixed(2);
  const pathD = (pts, s, tx, ty) => 'M' + pts.map(([x, y]) => f(tx + x * s) + ' ' + f(ty + y * s)).join('L') + 'Z';
  const glyph = (k, c, r = 0, palette = COL) => `<svg viewBox="-.55 -.55 1.1 1.1" aria-hidden="true"><path d="${pathD(rot2(SHAPES[k], r * PI / 2), 1, 0, 0)}" fill="${palette[c]}"/></svg>`;

  // the 2×2 mark as paths in a W×W box (W = 2 + gap); scale/offset place it inside a larger SVG
  function markPaths(cells = MARK, { gap = 0.12, palette = COL, scale = 1, x = 0, y = 0, cls } = {}) {
    const pitch = 1 + gap;
    return cells.map((cell, i) => {
      const fill = cls ? `class="${cls}-${cell.c}"` : `fill="${palette[cell.c]}"`;
      return `<path d="${pathD(rot2(SHAPES[cell.k], (cell.r || 0) * PI / 2), scale, x + (.5 + (i % 2) * pitch) * scale, y + (.5 + Math.floor(i / 2) * pitch) * scale)}" ${fill}/>`;
    }).join('');
  }
  const markSize = (gap = 0.12) => 2 + gap;
  function flatMark(cells = MARK, opts = {}) {
    const W = f(markSize(opts.gap));
    return `<svg viewBox="0 0 ${W} ${W}" aria-hidden="true">${markPaths(cells, opts)}</svg>`;
  }

  globalThis.brmbhBrand = { TAU, PI, COL, INK, PAPER, SHAPES, MARK, arc, rot2, pathD, glyph, markPaths, markSize, flatMark };
})();
