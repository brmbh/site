#!/usr/bin/env bun
/* Renders the frozen brand assets from assets/brand.js (the mark geometry) and the brand fonts.
   Text is outlined into paths, so no asset needs a font at runtime.

     bun tools/brand-assets.mjs            → assets/brand/*.svg + *.png

   Fonts: assets/fonts/*.woff (licensed, gitignored). PNGs need ImageMagick (`magick`). */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
await import(join(root, 'assets/brand.js'));
const { COL, INK, PAPER, MARK, markPaths, markSize, flatMark } = globalThis.brmbhBrand;

const opentype = require(join(root, 'tools/vendor/opentype.min.js'));
const font = file => {
  const buf = readFileSync(join(root, 'assets/fonts', file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const SHARP = font('SharpGroteskBook25.woff');      // logo type only
const HELV = font('HelveticaNeueLTPro-Bd.woff');    // headlines

// outlined text: path + its advance width, baseline at y
function text(f, str, x, y, size, fill, tracking = 0) {
  const p = f.getPath(str, x, y, size, { letterSpacing: tracking });
  return { d: `<path d="${p.toPathData(2)}" fill="${fill}"/>`, w: f.getAdvanceWidth(str, size, { letterSpacing: tracking }) };
}

const out = join(root, 'assets/brand');
mkdirSync(out, { recursive: true });
const write = (name, svg) => { writeFileSync(join(out, name), svg.trim() + '\n'); console.log('  ' + name); };
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>${body}</svg>`;

// ---- mark
const M = 100, W = markSize() * M;
write('mark.svg', svg(W, W, markPaths(MARK, { scale: M })));
write('mark-ink.svg', svg(W, W, markPaths(MARK, { scale: M, palette: INK })));

// favicon: the mark, the black piece turns paper-white in dark browser chrome
write('favicon.svg', svg(W, W,
  `<style>.p-white{fill:${COL.white}}.p-red{fill:${COL.red}}.p-blue{fill:${COL.blue}}.p-yellow{fill:${COL.yellow}}` +
  `@media (prefers-color-scheme:dark){.p-white{fill:${INK.white}}}</style>` + markPaths(MARK, { scale: M, cls: 'p' })));

// ---- lockup: mark + wordmark (Sharp Grotesk), sized like the navbar (26px mark, 1.5rem word, 0.6rem gap)
function lockup(palette, wordFill) {
  const mark = 26, size = 24, gap = 9.6;
  const word = text(SHARP, 'brmbh', 0, 0, size, wordFill, -0.01);
  const asc = SHARP.ascender / SHARP.unitsPerEm * size;
  // centre the x-height-ish block on the mark, as the page does
  const by = mark / 2 + asc * 0.36;
  const w2 = text(SHARP, 'brmbh', mark + gap, by, size, wordFill, -0.01);
  const Wl = Math.ceil(mark + gap + word.w), H = mark;
  return svg(Wl, H, markPaths(MARK, { scale: mark / markSize(), palette }) + w2.d);
}
write('lockup.svg', lockup(COL, PAPER.ink));
write('lockup-ink.svg', lockup(INK, PAPER.s2));

// ---- social card 1200×630: paper, lockup, headline, big mark
{
  const Wc = 1200, Hc = 630, pad = 80;
  const mk = 300, mx = Wc - pad - mk, my = (Hc - mk) / 2;
  const lockMark = 44, word = text(SHARP, 'brmbh', pad + lockMark + 16, pad + lockMark * 0.78, 40, PAPER.ink, -0.01);
  const h1a = text(HELV, 'WordPress run', pad, 330, 76, PAPER.ink, -0.02);
  const h1b = text(HELV, 'by your Agent.', pad, 412, 76, PAPER.ink, -0.02);
  const sub = text(HELV, 'Skills · Theme · SCF · CLI', pad, Hc - pad, 26, PAPER.ink3);
  write('og.svg', svg(Wc, Hc,
    `<rect width="${Wc}" height="${Hc}" fill="${PAPER.s1}"/>` +
    markPaths(MARK, { scale: lockMark / markSize(), x: pad, y: pad }) + word.d +
    h1a.d + h1b.d + sub.d +
    markPaths(MARK, { scale: mk / markSize(), x: mx, y: my })));
}

// ---- rasters
const png = (src, dst, size, bg = 'none') => {
  execFileSync('magick', ['-background', bg, '-density', '600', join(out, src), '-resize', size, join(out, dst)]);
  console.log('  ' + dst);
};
png('favicon.svg', 'favicon-32.png', '32x32');
// apple touch icon: iOS fills transparency with black, so the mark sits on paper with margin
writeFileSync(join(out, '_touch.svg'), svg(180, 180, `<rect width="180" height="180" fill="${PAPER.s1}"/>` + markPaths(MARK, { scale: 120 / markSize(), x: 30, y: 30 })));
png('_touch.svg', 'apple-touch-icon.png', '180x180');
execFileSync('rm', [join(out, '_touch.svg')]);
png('og.svg', 'og.png', '1200x630!');
