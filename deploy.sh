#!/bin/bash
# Deploys run from the vault deploy note "wordpress-brombach-de" via infra-check:
#   cd ~/Development/personal/infra-check
#   bun infra.ts deploy wordpress-brombach-de           # dry run: shows new/changed/deleted
#   bun infra.ts deploy wordpress-brombach-de --apply   # send + verify
# Config: ~/Syncthing/Obsidian/Automatic-Brain/Dev/Infra/Deploys/wordpress-brombach-de.md
exec bun ~/Development/personal/infra-check/infra.ts deploy wordpress-brombach-de "$@"
