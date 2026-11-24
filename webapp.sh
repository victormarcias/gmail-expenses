#!/usr/bin/env bash
# Gmail Expenses: installs the manual entry web app. Uploads the code, then
# creates the web app deployment the first time, or moves the existing one to
# a new version, so the URL never changes. Prints the URL and copies it.
# author: @victormarcias
#
# Usage: ./webapp.sh   (run it again after every change to the web app files)

set -euo pipefail
cd "$(dirname "$0")"

command -v clasp >/dev/null || { echo "✖ clasp is missing: run ./setup.sh" >&2; exit 1; }

clasp() { command clasp --user gmail-expenses "$@"; }

DESCRIPTION="Gmail Expenses web app"

./login.sh
clasp push --force

# The deployment made by this script, found by its description. Deployment
# IDs are long tokens; the HEAD one has no version and is never this one.
id=$(clasp deployments 2>/dev/null | grep -F "$DESCRIPTION" |
  grep -oE '[A-Za-z0-9_-]{30,}' | head -n 1 || true)

if [[ -n "$id" ]]; then
  echo "Updating the existing web app…"
  clasp redeploy "$id" --description "$DESCRIPTION"
else
  echo "Creating the web app…"
  id=$(clasp deploy --description "$DESCRIPTION" |
    grep -oE '[A-Za-z0-9_-]{30,}' | head -n 1)
  [[ -n "$id" ]] || { echo "✖ couldn't read the deployment ID" >&2; exit 1; }
fi

url="https://script.google.com/macros/s/$id/exec"
command -v pbcopy >/dev/null && printf '%s' "$url" | pbcopy

cat <<MSG

✔ Web app ready (URL copied to the clipboard):
  $url

On the phone: open it in Safari or Chrome, sign in to Google once, then
Share → Add to Home Screen.
MSG
