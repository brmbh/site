/* brmbh v1 — shape-sorter tray (Zdog) + page behaviour.
   Geometry, lighting and motion lifted from brmbh-brand/07-sorter-type.html. */
(() => {
  // mark geometry + palette live in assets/brand.js (shared with tools/brand-assets.mjs)
  const { TAU, PI, COL, INK, SHAPES, arc, rot2, pathD, glyph, flatMark } = globalThis.brmbhBrand;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const U = 40, PITCH = 1.35, H = 0.5;

  // the four pillars of the suite — one piece each, in mark order (TL, TR, BL, BR)
  const PARTS = [
    { k: 'quarter',  c: 'white',  role: 'Theme',  job: 'Bootstrap 5 and Gutenberg, one base.', title: 'Bootstrap 5 ↔ Gutenberg',  text: 'Build with the framework you know; hand clients an editor they can’t break. Figma tokens flow straight into the SCSS.', href: 'docs.html#architecture', link: 'How it bridges' },
    { k: 'circle',   c: 'red',    role: 'SCF',    job: 'Blocks on free Secure Custom Fields.', title: 'SCF block factory',        text: 'Spin up custom blocks in minutes on free Secure Custom Fields — no registration boilerplate. Drop a four-file folder in and it registers itself.', href: 'docs.html#add-block', link: 'Build a block' },
    { k: 'quarter',  c: 'blue',   role: 'CLI',    job: 'Scaffold, deploy, sync.',             title: 'One CLI, scaffold to deploy', text: 'One tool from first scaffold to final deploy, database sync included. You drive it by hand; your agent drives it the same way.', href: 'docs.html#agent-mode', link: 'JSON mode', r: 1 },
    { k: 'triangle', c: 'yellow', role: 'Skills', job: 'What your agent already knows.',      title: 'Agent skills built in',    text: 'Your AI editor already knows how to build for this theme — on Claude, Cursor, or Windsurf.', href: 'docs.html#agent-mode', link: 'For agents' },
  ];
  // the workflow order: skills → theme → SCF → CLI. Columns, keys, prompts and story steps all follow it;
  // PARTS stays in mark order, which is where each piece sits in the tray
  const FLOW = [3, 0, 1, 2];
  const clamp01 = x => Math.max(0, Math.min(1, x));

  document.querySelectorAll('[data-mark]').forEach(el => { el.innerHTML = flatMark(PARTS, el.dataset.mark === 'ink' ? { palette: INK } : {}); });
  document.querySelectorAll('[data-glyph]').forEach(el => { const [k, c, r] = el.dataset.glyph.split(':'); el.innerHTML = glyph(k, c, +r || 0, el.closest('.ask__bar') ? INK : COL); });
  document.querySelectorAll('[data-yes]').forEach(el => { el.innerHTML = glyph('circle', 'yellow'); el.setAttribute('aria-label', 'yes'); });

  // ---------- page behaviour (no Zdog needed) ----------
  document.querySelectorAll('[data-copy]').forEach(host => {
    const btn = host.matches('button') ? host : host.querySelector('.cmd__copy');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(host.dataset.copy); } catch { return; }
      const label = btn.textContent;
      btn.classList.add('is-copied');
      if (btn !== host) btn.textContent = 'Copied';
      setTimeout(() => { btn.classList.remove('is-copied'); if (btn !== host) btn.textContent = label; }, 1400);
    });
  });
  document.querySelectorAll('[data-aud]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-aud]').forEach(b => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    document.querySelectorAll('[data-panel-aud]').forEach(p => { p.hidden = p.dataset.panelAud !== btn.dataset.aud; });
  }));

  // piece columns + story steps + tray keys (markup first, so the page works without Zdog)
  const piecesEl = document.querySelector('[data-pieces]');
  const tileCanvases = [];
  FLOW.forEach(i => {
    const p = PARTS[i], el = document.createElement('div');
    el.className = 'piece';
    el.innerHTML = `<canvas aria-hidden="true"></canvas><div class="piece__row">${glyph(p.k, p.c, p.r)}<h3>${p.role}</h3></div><p>${p.job}</p>`;
    piecesEl.appendChild(el);
    tileCanvases[i] = el.querySelector('canvas');
  });
  const stepsEl = document.querySelector('[data-story-steps]');
  FLOW.forEach((i, n) => {
    const p = PARTS[i], el = document.createElement('article');
    el.className = 'sstory'; el.dataset.state = n + 1;
    el.innerHTML = `<h3>${p.title}</h3><p>${p.text}</p><a class="sstory__link" href="${p.href}">${p.link} →</a>`;
    stepsEl.appendChild(el);
  });
  const storySteps = [...stepsEl.children];

  // prompt typewriter: the workflow in order, one pillar per prompt (skills → theme → blocks → CLI).
  // Each prompt shows its piece and lifts it in the hero tray; the piece keys jump straight to a prompt.
  // Type ~40ms/char, hold, erase faster. A new play() cancels the running one.
  const PROMPTS = [
    [3, 'install the brmbh WordPress skill'],
    [0, 'create a new brmbh theme in this WordPress install'],
    [1, 'create a hero block from this Figma frame'],
    [2, 'deploy my-site to staging'],
  ];
  let job = 0, promptPart = PROMPTS[0][0];
  const tw = document.querySelector('[data-typewriter]'), twMk = document.querySelector('.ask__mk');
  const show = ([i]) => { const p = PARTS[i]; twMk.innerHTML = glyph(p.k, p.c, p.r, INK); promptPart = i; };
  function erase(my, done) {
    (function step() { if (my !== job) return; tw.textContent = tw.textContent.slice(0, -1); if (tw.textContent) setTimeout(step, 18); else done(); })();
  }
  function play(i, hold = 2000) {
    const my = ++job, item = PROMPTS[i % PROMPTS.length], text = item[1];
    show(item);
    if (reduce) { tw.textContent = text; return; }
    let n = 0;
    (function step() {
      if (my !== job) return;
      tw.textContent = text.slice(0, n);
      if (n++ < text.length) setTimeout(step, 36 + Math.random() * 36);
      else setTimeout(() => { if (my === job) erase(my, () => play(i + 1)); }, hold);
    })();
  }
  const jumpTo = part => play(PROMPTS.findIndex(([i]) => i === part), 4500);
  show(PROMPTS[0]);
  tw.textContent = PROMPTS[0][1];
  if (!reduce) { const my = ++job; setTimeout(() => { if (my === job) erase(my, () => play(1)); }, 5000); }   // hold the first prompt past the tray intro

  // scroll scene: pinned, three steps; the file tree builds across step 2
  const scrolly = document.querySelector('[data-scrolly]');
  if (scrolly) {
    const stepEls = scrolly.querySelectorAll('[data-sstep]'), sceneEls = scrolly.querySelectorAll('[data-scene]');
    const items = [...scrolly.querySelectorAll('.build')], tree = scrolly.querySelector('[data-tree]');
    const title = scrolly.querySelector('[data-ide-title]');
    // per step: window title, open tabs (last one active), status-bar language
    const WIN = {
      1: { title: 'my-theme — Terminal', tabs: ['zsh'], lang: 'zsh' },
      2: { title: 'my-theme — Agent', tabs: ['zsh', 'Agent'], lang: 'Agent' },
      3: { title: 'template.php — my-theme', tabs: ['Agent', 'template.php'], lang: 'PHP' },
    };
    const tabsEl = scrolly.querySelector('[data-ide-tabs]'), langEl = scrolly.querySelector('[data-ide-lang]');
    // code gets a line-number gutter
    scrolly.querySelectorAll('.ink--code').forEach(pre => { pre.innerHTML = pre.innerHTML.split('\n').map(l => `<span class="ln">${l || ' '}</span>`).join(''); });
    const TARGET = { 1: 0.12, 2: 0.52, 3: 0.92 };
    let cur = 0;
    const pinned = () => getComputedStyle(scrolly.firstElementChild).position === 'sticky';
    function render(p) {
      const step = p < 0.30 ? 1 : p < 0.78 ? 2 : 3;
      const count = step === 1 ? 0 : step === 3 ? items.length : Math.round((p - 0.30) / 0.48 * items.length);
      items.forEach((el, i) => el.classList.toggle('is-in', i < count));
      if (step === cur) return;
      cur = step;
      stepEls.forEach(el => el.classList.toggle('is-on', +el.dataset.sstep === step));
      sceneEls.forEach(el => el.classList.toggle('is-on', +el.dataset.scene === step));
      tree.classList.toggle('is-hl', step === 3);
      const w = WIN[step];
      title.textContent = w.title; langEl.textContent = w.lang;
      tabsEl.innerHTML = w.tabs.map((t, i) => `<span class="ide__tab${i === w.tabs.length - 1 ? ' is-on' : ''}">${t}</span>`).join('');
    }
    const progress = () => { const r = scrolly.getBoundingClientRect(); return clamp01(-r.top / (r.height - innerHeight)); };
    const update = () => render(reduce || !pinned() ? 1 : progress());
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    stepEls.forEach(el => el.addEventListener('click', () => {
      if (!pinned()) return render(TARGET[el.dataset.sstep]);
      const top = scrolly.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + TARGET[el.dataset.sstep] * (scrolly.offsetHeight - innerHeight), behavior: 'smooth' });
    }));
  }

  const keysEl = document.querySelector('[data-keys]');
  const keys = [];
  FLOW.forEach(i => {
    const p = PARTS[i], b = document.createElement('button');
    b.className = 'key'; b.type = 'button'; b.setAttribute('role', 'tab');
    b.innerHTML = `${glyph(p.k, p.c, p.r)}${p.role}`;
    keysEl.appendChild(b);
    keys[i] = b;
  });

  if (!window.Zdog) return;

  // ---------- colour + light ----------
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const LIGHT = (() => { const v = [-0.45, -0.8, 0.55], l = Math.hypot(...v); return v.map(x => x / l); })();
  function shade(rgb, k) {
    const fct = 0.8 + 0.26 * Math.max(0, k) + 0.24 * Math.min(0, k);
    const hi = Math.max(0, k - 0.92) * 0.5;
    return 'rgb(' + rgb.map(c => Math.min(255, Math.round(c * fct + 255 * hi))).join(',') + ')';
  }
  function relight(faces) {
    for (const fc of faces) {
      const n = fc.shape.renderNormal, l = Math.hypot(n.x, n.y, n.z) || 1;
      fc.shape.color = shade(fc.rgb, -(n.x * LIGHT[0] + n.y * LIGHT[1] + n.z * LIGHT[2]) / l);
    }
  }
  function solid(parent, pts, { h, color, s = U, base = 0, faces }) {
    const g = new Zdog.Group({ addTo: parent });
    const rgb = hexRgb(color);
    const P = (a, b, d) => ({ x: a * s, y: base - d * s, z: b * s });
    const add = (path, front) => faces.push({ rgb, shape: new Zdog.Shape({ addTo: g, path, fill: true, stroke: 0.7, color, backface: false, front }) });
    add(pts.map(([a, b]) => P(a, b, h)), { x: 0, y: -1, z: 0 });
    const cx = pts.reduce((t, p) => t + p[0], 0) / pts.length, cy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const l = Math.hypot(nx, ny); if (l < 1e-6) continue;
      nx /= l; ny /= l;
      if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
      add([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], h), P(a[0], a[1], h)], { x: nx, y: 0, z: ny });
    }
    return g;
  }
  function buildTray(parent, cols, rows, cells, faces) {
    const root = new Zdog.Anchor({ addTo: parent });
    const margin = 0.5, W = cols * PITCH + margin * 2 - (PITCH - 1), D = rows * PITCH + margin * 2 - (PITCH - 1), T = 0.35;
    const tg = new Zdog.Group({ addTo: root });
    tg.updateSortValue = function () { this.sortValue = -1e9; }; // tray always paints first
    solid(tg, [[-W/2,-D/2],[W/2,-D/2],[W/2,D/2],[-W/2,D/2]], { h: T, color: COL.tray, base: T * U, faces });
    const pieces = cells.map((cell, i) => {
      const cx = ((i % cols) - (cols - 1) / 2) * PITCH, cz = (Math.floor(i / cols) - (rows - 1) / 2) * PITCH;
      const pts = rot2(SHAPES[cell.k], (cell.r || 0) * PI / 2);
      new Zdog.Shape({ addTo: tg, path: pts.map(([a, b]) => ({ x: (cx + a * 1.08) * U, y: -0.5, z: (cz + b * 1.08) * U })), fill: true, stroke: 0.7, color: COL.slot, backface: false, front: { y: -1 } });
      const anchor = new Zdog.Anchor({ addTo: root, translate: { x: cx * U, z: cz * U } });
      const g = solid(anchor, pts, { h: H, color: COL[cell.c], faces });
      return { anchor, cell, g };
    });
    return { root, pieces };
  }

  const scenes = [];
  class Scene {
    constructor(canvas, { base = [300, 300], rx = -0.62, ry = TAU / 8, drag = true, sway = 0.16 } = {}) {
      const self = this;
      this.faces = []; this.ry = ry; this.sway = sway; this.touched = false; this.visible = true;
      this.illo = new Zdog.Illustration({
        element: canvas, resize: true, dragRotate: drag, rotate: { x: rx, y: ry },
        onResize(w, h) { this.zoom = Math.min(w / base[0], h / base[1]); },
        onDragStart() { self.touched = true; },
      });
      scenes.push(this);
      new IntersectionObserver(es => es.forEach(e => { self.visible = e.isIntersecting; })).observe(canvas);
    }
    frame(t) {
      const r = this.illo.rotate;
      if (!this.touched && !reduce) r.y = this.ry + this.sway * Math.sin(t * 0.45);
      r.x = Math.max(-1.35, Math.min(-0.12, r.x));
      if (this.tick) this.tick(t);
      this.illo.updateGraph();
      relight(this.faces);
      this.illo.renderGraph();
    }
  }

  // motion: soft elastic (amp .7, period .7), half-turns, front-loaded rotation
  const elasticOut = p => p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p - 0.25) * TAU) + 1;
  const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const easeOut = p => 1 - Math.pow(1 - p, 3);

  // ---------- hero tray: the mark in 3D ----------
  const hero = new Scene(document.getElementById('hero'), { base: [210, 190], rx: -0.72, ry: -TAU / 9 });
  const tray = buildTray(hero.illo, 2, 2, PARTS, hero.faces);
  tray.root.translate.y = 22;

  // each piece: drop in on load, then lift when its key is active
  let now = 0, active = -1;
  // rotation counts half-turns: odd while lifted, even at rest, so every piece lands back in its slot
  const state = tray.pieces.map(() => ({ lift: 0, from: 0, to: 0, t0: -9, rot: 0, rotFrom: 0, n: 0 }));
  function setActive(i, t) {
    if (i === active) return;
    [active, i].forEach((j, n) => {
      if (j < 0) return;
      const s = state[j], up = n === 1;
      s.from = s.lift; s.to = up ? 1 : 0; s.t0 = t; s.rotFrom = s.rot; s.n++;
    });
    active = i;
    keys.forEach((k, j) => { k.classList.toggle('is-on', j === i); k.setAttribute('aria-selected', j === i); });
  }
  let start = null;
  hero.tick = t => {
    now = t;
    if (start === null) start = t;
    const lt = t - start;
    tray.pieces.forEach((p, i) => {
      // intro drop
      const u = reduce ? 1 : clamp01((lt - 0.25 - i * 0.09) / 1.25);
      const dropY = -7 * U * (1 - elasticOut(u));
      const dropR = PI * (1 - easeInOut(clamp01(u / 0.55)));
      // key lift: up with a quick ease, down with the elastic settle; half-turn each way
      const s = state[i], dur = s.to ? 0.5 : 1.2, v = reduce ? 1 : clamp01((t - s.t0) / dur);
      s.lift = s.from + (s.to - s.from) * (s.to ? easeOut(v) : elasticOut(v));
      s.rot = s.rotFrom + (s.n * PI - s.rotFrom) * (reduce ? 1 : easeInOut(clamp01(v / 0.55)));
      const bob = s.to && !reduce ? 0.06 * Math.sin(t * 2.2) : 0;
      p.anchor.translate.y = dropY - (1.15 * s.lift + bob) * U;
      p.anchor.rotate.y = dropR + s.rot;
    });
    // after the intro the prompt drives the tray: its pillar lifts
    if (lt > 2.2 || reduce) setActive(promptPart, t);
  };
  // a key jumps the prompt to its pillar; the prompt then lifts the piece
  keys.forEach((k, i) => k.addEventListener('click', () => jumpTo(i)));

  // ---------- piece columns: one turning piece each ----------
  const TILES = tileCanvases.map((cv, i) => {
    const p = PARTS[i];
    const sc = new Scene(cv, { base: [120, 120], rx: -0.6, ry: 0.4 + i, sway: 0 });
    const a = new Zdog.Anchor({ addTo: sc.illo, translate: { y: 10 } });
    const g = solid(a, rot2(SHAPES[p.k], (p.r || 0) * PI / 2), { h: H * 1.6, color: COL[p.c], faces: sc.faces });
    // hover: the piece hops with a half-turn and settles elastic; drag turns the view (and stops the spin)
    let want = false, hop0 = -9, turns = 0;
    cv.addEventListener('pointerenter', () => { want = true; });
    sc.tick = t => {
      if (!sc.touched && !reduce) sc.illo.rotate.y = 0.4 + i + t * 0.35;
      if (want && !reduce && t - hop0 > 1.3) { hop0 = t; turns++; }
      want = false;
      const u = clamp01((t - hop0) / 1.3);
      a.translate.y = 10 - 16 * (u < 0.3 ? easeOut(u / 0.3) : 1 - elasticOut((u - 0.3) / 0.7));
      a.rotate.y = (turns - 1) * PI + PI * easeInOut(clamp01(u / 0.5));
    };
    return { sc, a, g, canvas: cv };
  });

  // ---------- story tray: fills one part per scroll step ----------
  const lerp = (a, b, t) => a + (b - a) * t;
  const storyCanvas = document.querySelector('[data-story-canvas]');
  const story = new Scene(storyCanvas, { base: [250, 250], rx: -0.66, ry: -TAU / 9, sway: 0.1 });
  const sTray = buildTray(story.illo, 2, 2, PARTS, story.faces);
  sTray.root.translate.y = 30;
  const SP = sTray.pieces.map((p, i) => {
    const x = p.anchor.translate.x, z = p.anchor.translate.z, seed = Math.sin(i * 91.7) * 0.5 + 0.5;
    const cloud = { x: (FLOW.indexOf(i) - 1.5) * 1.3 * U, y: -2.9 * U, z: -0.3 * U, ry: PI };   // a row over the tray, like the columns; half-turned, landing turns it home
    return { ...p, i, phase: seed * TAU, home: { x, z }, cloud, disp: { ...cloud }, tw: null };
  });
  let sState = -1;
  const fitted = (p, s) => FLOW.indexOf(p.i) < s;
  function retarget(p, delay) {
    const from = { ...p.disp }, h = p.home;
    const to = fitted(p, sState) ? { x: h.x, y: 0, z: h.z, ry: 0 } : { ...p.cloud };
    to.ry += TAU * Math.round((from.ry - to.ry) / TAU);
    const moving = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) > 2;
    p.tw = { from, to, t0: now + delay, dur: 1.3, hop: moving ? 0.8 : 0 };
  }
  function setStory(s) {
    if (s === sState) return;
    const prev = sState; sState = s;
    storySteps.forEach(el => el.classList.toggle('is-on', +el.dataset.state === s));
    SP.forEach(p => retarget(p, prev === -1 ? 0 : Math.abs(FLOW.indexOf(p.i) - s + 1) * 0.04));
  }
  story.tick = t => {
    SP.forEach(p => {
      const tw = p.tw; if (!tw) return;
      const u = reduce ? 1 : clamp01((t - tw.t0) / tw.dur), e = easeInOut(u);
      p.disp.x = lerp(tw.from.x, tw.to.x, e);
      p.disp.z = lerp(tw.from.z, tw.to.z, e);
      // landing settles with the soft elastic; lifting off eases
      p.disp.y = lerp(tw.from.y, tw.to.y, tw.to.y === 0 ? elasticOut(u) : e) - tw.hop * U * Math.sin(PI * u);
      p.disp.ry = lerp(tw.from.ry, tw.to.ry, easeInOut(clamp01(u / 0.55)));
      const bob = !fitted(p, sState) && !reduce ? 0.12 * U * Math.sin(t * 1.6 + p.phase) : 0;
      p.anchor.translate.x = p.disp.x; p.anchor.translate.z = p.disp.z;
      p.anchor.translate.y = p.disp.y + bob;
      p.anchor.rotate.y = p.disp.ry;
    });
  };
  const narrow = matchMedia('(max-width: 960px)').matches;
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStory(+e.target.dataset.state); }),
    { rootMargin: narrow ? '-70% 0px -24% 0px' : '-46% 0px -46% 0px' });
  storySteps.forEach(el => sio.observe(el));
  setStory(0);

  // ---------- flight: the pieces leave their columns for the tray as you scroll ----------
  // A fixed full-screen Zdog layer draws each piece between two live screen positions (its column, its spot
  // over the tray), blending position, size, height and rotation. Scrolling back reverses it.
  const storyEl = document.querySelector('[data-story]');
  const flyCanvas = document.createElement('canvas');
  flyCanvas.className = 'fly'; flyCanvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flyCanvas);
  const flyFaces = [];
  const flyIllo = new Zdog.Illustration({ element: flyCanvas, resize: true });
  const FLY = TILES.map((tl, i) => {
    const outer = new Zdog.Anchor({ addTo: flyIllo }), inner = new Zdog.Anchor({ addTo: outer });
    const p = PARTS[i];
    solid(inner, rot2(SHAPES[p.k], (p.r || 0) * PI / 2), { h: H, color: COL[p.c], faces: flyFaces });
    return { i, tl, sp: SP[i], outer, inner };
  });
  function screenOf(canvas, illo, anchor) {
    const r = canvas.getBoundingClientRect(), o = anchor.renderOrigin;
    return { x: r.left + r.width / 2 + o.x * illo.zoom, y: r.top + r.height / 2 + o.y * illo.zoom, s: illo.zoom };
  }
  // two passes per frame so the hand-off never shows an empty frame:
  // flightSwap decides who shows the pieces before the scenes render, flightDraw draws the layer after
  let flyP = 0, flying = false;
  function flightSwap() {
    const vh = innerHeight, top = storyEl.getBoundingClientRect().top;
    flyP = clamp01((vh * 0.85 - top) / (vh * 0.85));   // 0 while the story is below the fold, 1 once its stage pins
    flying = flyP > 0 && flyP < 1 && !reduce && !narrow;
    TILES.forEach(tl => { tl.g.visible = reduce || narrow || flyP <= 0; });
    SP.forEach(p => { p.g.visible = reduce || narrow || flyP >= 1; });
  }
  function flightDraw() {
    flyCanvas.style.visibility = flying ? 'visible' : 'hidden';
    if (!flying) return;
    const vh = innerHeight;
    FLY.forEach(fl => {
      const A = screenOf(fl.tl.canvas, fl.tl.sc.illo, fl.tl.a), B = screenOf(storyCanvas, story.illo, fl.sp.anchor);
      const u = clamp01((flyP - FLOW.indexOf(fl.i) * 0.05) / 0.75), e = easeInOut(u);
      fl.outer.translate.set({ x: lerp(A.x, B.x, e) - flyIllo.width / 2, y: lerp(A.y, B.y, e) - flyIllo.height / 2 - Math.sin(PI * u) * vh * 0.07, z: 0 });
      const rx0 = fl.tl.sc.illo.rotate.x, ry0 = fl.tl.sc.illo.rotate.y + fl.tl.a.rotate.y;
      let ry1 = story.illo.rotate.y + fl.sp.anchor.rotate.y;
      ry1 += TAU * Math.round((ry0 - ry1) / TAU);                                   // never more than a half-turn
      fl.outer.rotate.set({ x: lerp(rx0, story.illo.rotate.x, e), y: lerp(ry0, ry1, easeInOut(clamp01(u / 0.7))), z: 0 });
      const sc = lerp(A.s, B.s, e);
      fl.inner.scale.set({ x: sc, y: sc * lerp(1.6, 1, e), z: sc });                // columns show taller pieces than the tray
    });
    flyIllo.updateGraph();
    relight(flyFaces);
    flyIllo.renderGraph();
  }

  // ---------- loop ----------
  scenes.forEach(s => s.frame(0));
  function loop(ms) {
    const t = ms / 1000;
    now = t;
    flightSwap();
    for (const s of scenes) if (s.visible || s === story) s.frame(t);
    flightDraw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// navbar: transparent over the torn corner at the top, paper once the page scrolls
(() => {
  const top = document.querySelector('.top');
  if (!top) return;
  const set = () => top.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', set, { passive: true });
  set();
})();
