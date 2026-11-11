/* brmbh docs — marks, copy buttons on code blocks, level glyphs, contents highlight. No Zdog. */
(() => {
  const { COL, INK, MARK, glyph, flatMark } = globalThis.brmbhBrand;

  document.querySelectorAll('[data-mark]').forEach(el => { el.innerHTML = flatMark(MARK, el.dataset.mark === 'ink' ? { palette: INK } : {}); });

  // levels wear the pillar piece of what the caller does: L1 data (circle), L2 class (quarter), L3 next (triangle)
  const LVL = { 1: ['circle', 'red'], 2: ['quarter', 'blue'], 3: ['triangle', 'yellow'] };
  document.querySelectorAll('.lvl[data-lvl]').forEach(el => { const [k, c] = LVL[el.dataset.lvl]; el.insertAdjacentHTML('afterbegin', glyph(k, c)); });
  document.querySelectorAll('.note').forEach(el => {
    const inner = el.innerHTML; el.innerHTML = `<span class="note__mk">${glyph('triangle', 'yellow')}</span><div>${inner}</div>`;
  });

  document.querySelectorAll('pre.ink[data-copy]').forEach(pre => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ink__copy'; btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pre.dataset.copy); } catch { return; }
      btn.classList.add('is-copied'); btn.textContent = 'Copied';
      setTimeout(() => { btn.classList.remove('is-copied'); btn.textContent = 'Copy'; }, 1400);
    });
    pre.appendChild(btn);
  });

  const top = document.querySelector('.top');
  const setTop = () => top.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', setTop, { passive: true }); setTop();

  // contents: mark the section in view
  const links = new Map([...document.querySelectorAll('.docs-side a[href^="#"]')].map(a => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove('is-on'));
    links.get(e.target.id)?.classList.add('is-on');
  }), { rootMargin: '-80px 0px -70% 0px' });
  links.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
})();
