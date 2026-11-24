#!/usr/bin/env bash
# Gmail Expenses: makes sure clasp is signed in as the account in .env
# (CLASP_ACCOUNT), and logs out and in again when it isn't. It uses its own
# named clasp user, so other projects' sessions are left alone.
# author: @victormarcias
#
# Usage: ./login.sh   (deploy-script.sh runs it first)

set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || {
  echo "✖ .env is missing: copy .env.example and fill it" >&2
  exit 1
}
set -a; source .env; set +a

clasp() { command clasp --user gmail-expenses "$@"; }
: "${CLASP_ACCOUNT:?✖ CLASP_ACCOUNT is empty in .env}"

signed_in_as() {
  clasp show-authorized-user 2>/dev/null |
    sed -nE 's/.*logged in as ([^ ]+)\.$/\1/p'
}

current=$(signed_in_as)
if [ "$current" != "$CLASP_ACCOUNT" ]; then
  echo "clasp is signed in as ${current:-nobody}: signing in as $CLASP_ACCOUNT"
  clasp logout || true
  clasp login
  current=$(signed_in_as)
  [ "$current" = "$CLASP_ACCOUNT" ] || {
    echo "✖ signed in as ${current:-nobody}, not $CLASP_ACCOUNT" >&2
    exit 1
  }
fi
