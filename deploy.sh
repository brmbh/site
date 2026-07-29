#!/usr/bin/env bash
# Deploy the landing page to all-inkl.
#
#   ./deploy.sh            # dry run — shows what would change, writes nothing
#   ./deploy.sh --live     # actually upload
#
# Its own vhost, so --delete here affects nothing but this site.
#
# It previously lived at brombach.de/wordpress-suite/, a subdirectory of a vhost
# deployed from another repo with `rsync --delete` — which silently deleted it
# (live 2026-07-24, gone by 2026-07-29) while the URL still returned 200 from
# the parent site's index.html fallback. Hence the dedicated vhost.
set -euo pipefail

SSH_HOST="allinkl"
REMOTE_DIR="/www/htdocs/w00bc6c9/wordpress.brombach.de"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --delete is destructive; refuse to run against anything but this vhost.
if [[ "$REMOTE_DIR" != */wordpress.brombach.de ]]; then
  echo "Refusing to deploy: REMOTE_DIR must be the wordpress.brombach.de vhost" >&2
  exit 1
fi

DRY="--dry-run"
[[ "${1:-}" == "--live" ]] && DRY=""
[[ -z "$DRY" ]] || echo "DRY RUN — pass --live to upload for real"

# Only create the target for a real deploy — a dry run must write nothing,
# not even an empty directory.
if [[ -z "$DRY" ]]; then
  ssh "$SSH_HOST" "mkdir -p '$REMOTE_DIR'"
fi

rsync -avz --delete $DRY \
  --exclude '.git' --exclude '.github' \
  --exclude 'deploy.sh' --exclude 'README.md' --exclude '.DS_Store' \
  "$LOCAL_DIR"/ "$SSH_HOST:$REMOTE_DIR"/

echo
if [[ -z "$DRY" ]]; then
  echo "Deployed → https://wordpress.brombach.de/"
  echo "Verify the CONTENT, not just the status code:"
  echo "  curl -sS https://wordpress.brombach.de/ | grep -o '<title>[^<]*</title>'"
else
  echo "Nothing was written. Re-run with --live when the diff looks right."
fi
