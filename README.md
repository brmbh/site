# brmbh — landing page

Marketing site for the [brmbh agentic WordPress suite](https://github.com/brmbh/wordpress).

Static HTML/CSS/JS. No build step, no dependencies — open `index.html` to work on it.

```
index.html      the landing page
docs.html       command reference
assets/         styles.css, main.js, logos/
deploy.sh       rsync to all-inkl
```

## Deploying

Hosted on **all-inkl**, under the `brombach.de` vhost:

```
https://brombach.de/wordpress-suite/
→ /www/htdocs/w00bc6c9/brombach.de/wordpress-suite/
```

```bash
./deploy.sh          # dry run — shows the diff, writes nothing
./deploy.sh --live   # upload
```

rsync over the `allinkl` SSH alias. The script refuses to run if the target does not end in
`/wordpress-suite`, because it uses `--delete` and the vhost root holds the personal site.

### Verify content, not status codes

`brombach.de/wordpress-suite/` returns **HTTP 200 even when nothing is deployed** — the vhost
falls back to the `brombach.de` homepage. It was recorded as live for weeks on that basis while
the directory did not exist.

```bash
curl -sS https://brombach.de/wordpress-suite/ | grep -o '<title>[^<]*</title>'
# brmbh …          → deployed
# Jan Brombach     → NOT deployed, you are seeing the fallback
```

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
