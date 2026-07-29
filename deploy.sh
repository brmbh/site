#!/usr/bin/env bash
# Deploy the landing page to all-inkl.
#
#   ./deploy.sh            # dry run — shows what would change, writes nothing
#   ./deploy.sh --live     # actually upload
#
# Target is a subdirectory of the brombach.de vhost. Deliberately NOT the vhost
# root: rsync --delete there would wipe the personal site.
#
# ⚠️ This directory lives inside a vhost deployed from a DIFFERENT repo. The
# brombach.de deploy mirrors its dist/ here with --delete, which already wiped
# this page once (live 2026-07-24, gone by 2026-07-29). That repo now excludes
# wordpress-suite/ — if that exclude is ever dropped, this page disappears
# again and the URL still returns 200 because the vhost falls back to
# brombach.de's index.html. The durable fix is a vhost of its own.
set -euo pipefail

SSH_HOST="allinkl"
REMOTE_DIR="/www/htdocs/w00bc6c9/brombach.de/wordpress-suite"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$REMOTE_DIR" != */wordpress-suite ]]; then
  echo "Refusing to deploy: REMOTE_DIR must end in /wordpress-suite" >&2
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
  echo "Deployed. Verify the CONTENT, not just the status code — a 200 here can be"
  echo "the brombach.de homepage served as a fallback:"
  echo "  curl -sS https://brombach.de/wordpress-suite/ | grep -o '<title>[^<]*</title>'"
else
  echo "Nothing was written. Re-run with --live when the diff looks right."
fi
