# brmbh — landing page

Marketing site for the [brmbh agentic WordPress suite](https://github.com/brmbh/wordpress).

Static HTML/CSS/JS. No build step, no dependencies — open `index.html` to work on it.

```
index.html             the landing page (v1 shape-sorter brand)
docs.html              command reference, same tokens
assets/brand.js        mark geometry + palette, the one source
assets/v1.css          tokens and styles for both pages
assets/v1.js           landing page: Zdog tray, story, scenes
assets/docs.js         docs page: marks, copy buttons, contents
assets/brand/          frozen logos, favicons, og image (bun tools/brand-assets.mjs)
assets/fonts/          licensed web fonts, gitignored: copy them in locally
deploy.sh              hands off to infra-check
```

Serve locally with any static server (fonts load via `@font-face`, so `file://` works for
layout only).

## Deploying

Hosted on **all-inkl**, on its own vhost:

```
https://wordpress.brombach.de/
→ /www/htdocs/w00bc6c9/wordpress.brombach.de/
```

```bash
./deploy.sh            # dry run: shows new/changed/deleted, writes nothing
./deploy.sh --apply    # send + verify
```

`deploy.sh` runs `bun infra.ts deploy wordpress-brombach-de` from `infra-check`, which deploys
`main` (index.html, docs.html, assets/) with its own restricted key and checks the title after.
The fonts are not in git, so they must sit in `assets/fonts/` on the machine that deploys.

### Why its own vhost

It used to live at `brombach.de/wordpress-suite/` — a subdirectory of a vhost deployed from a
different repo with `rsync --delete`. Every deploy of that site silently deleted this one (live
2026-07-24, gone by 2026-07-29), and the URL kept returning **HTTP 200** because the parent
site's `index.html` was served as a fallback. Nothing looked broken.

### Verify content, not status codes

```bash
curl -sS https://wordpress.brombach.de/ | grep -o '<title>[^<]*</title>'
```

A 200 alone proves nothing on shared hosting — check what came back.

## Keeping copy honest

The install commands shown here must match what actually works. They have drifted before —
`npx create-brmbh` was advertised for weeks while returning a 404, because it was never
published as its own package.

Current truth:

| Path | Command |
|---|---|
| Agent | `npx skills add brmbh/wordpress`, then ask for a new brmbh theme |
| Command | `npx @brmbh/cli create my-site` |
| Clone | `git clone https://github.com/brmbh/wordpress.git` then `npm install` |

If the CLI's interface changes, update this site in the same pass — the README, the hero, and
`docs.html` are three separate surfaces and they have fallen out of sync before.

## History

Extracted from `brmbh/cli` on 2026-07-29 with `git subtree split`, so the 33 commits of site
history came along. That repo is being archived.
