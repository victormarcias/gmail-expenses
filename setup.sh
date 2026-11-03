#!/usr/bin/env bash
# Gmail Expenses: guided setup. Installs clasp, creates (or links) the Apps
# Script project, uploads the code and walks through the steps that can only
# be done in the browser. Safe to run again: it skips what's already done.
# author: @victormarcias
#
# Usage: ./setup.sh

set -euo pipefail
cd "$(dirname "$0")"

bold=$'\e[1m'
dim=$'\e[2m'
reset=$'\e[0m'

step() { printf '\n%s▸ %s%s\n' "$bold" "$1" "$reset"; }
info() { printf '  %s\n' "$1"; }
pause() { read -rp "  ${dim}Press Enter when done…${reset} " _; }
fail() { printf '\n✖ %s\n' "$1" >&2; exit 1; }

open_url() {
  info "Opening $1"
  if command -v open >/dev/null; then open "$1"
  elif command -v xdg-open >/dev/null; then xdg-open "$1" >/dev/null 2>&1
  fi
}

# Puts the value on the clipboard when possible, and always prints it
copy() {
  if command -v pbcopy >/dev/null; then
    printf '%s' "$1" | pbcopy
    info "Copied to the clipboard: $1"
  else
    info "Copy this: $1"
  fi
}

script_id() {
  sed -n 's/.*"scriptId": *"\([^"]*\)".*/\1/p' .clasp.json
}

# 1. clasp -------------------------------------------------------------------

step "clasp (Google's CLI for Apps Script)"
command -v npm >/dev/null \
  || fail "Node.js is needed: install it from https://nodejs.org and re-run."
if command -v clasp >/dev/null; then
  info "Installed ($(clasp --version))."
else
  info "Installing it with npm…"
  npm install -g @google/clasp
fi

if [[ -f ~/.clasprc.json ]]; then
  info "Already logged in."
else
  info "Log in with the Google account whose Gmail will be read."
  clasp login
fi

step "Apps Script API"
info "Turn on \"Google Apps Script API\" (clasp needs it to upload code)."
open_url "https://script.google.com/home/usersettings"
pause

# 2. Transfer aliases ----------------------------------------------------------

step "Transfer aliases (optional)"
if [[ -f Transfers.gs ]]; then
  info "Transfers.gs already exists."
else
  cp Transfers.example.gs Transfers.gs
  info "Created Transfers.gs (git-ignored). Add the aliases you transfer to"
  info "and their category; without any, transfers go to Compras."
  pause
fi

# 3. Apps Script project -------------------------------------------------------

step "Apps Script project"
if [[ -f .clasp.json ]]; then
  info "Linked to $(script_id)."
else
  read -rp "  Script ID of an existing project (Enter to create one): " id
  if [[ -n "$id" ]]; then
    sed "s/YOUR_SCRIPT_ID/$id/" .clasp.example.json > .clasp.json
  else
    # create-script overwrites appsscript.json and pulls a sample Code.js
    manifest=$(mktemp)
    cp appsscript.json "$manifest"
    created=true
    clasp create-script --type standalone --title "Gmail Expenses" \
      --rootDir . || created=false
    mv "$manifest" appsscript.json
    rm -f Code.js
    $created || fail "clasp couldn't create the project."
  fi
  info "Linked to $(script_id)."
fi

info "Uploading the code…"
clasp push --force

# 4. The sheet -----------------------------------------------------------------

step "Google Sheet"
info "Create a sheet (or use an existing one), and set"
info "File → Settings → Locale to Argentina."
open_url "https://sheets.new"
read -rp "  Paste the sheet's URL (or its ID): " url
file_id=$(printf '%s' "$url" | sed -E 's#.*/d/([^/?#]+).*#\1#')
[[ -n "$file_id" ]] || fail "Couldn't read an ID from that URL."

step "Script Properties"
info "In Project Settings → Script Properties, add a property named"
info "FILE_ID with the sheet's ID as its value."
copy "$file_id"
open_url "https://script.google.com/home/projects/$(script_id)/settings"
pause

# 5. The trigger ---------------------------------------------------------------

step "Trigger"
info "In the editor, pick install in the function menu, click Run and"
info "accept the permissions. It creates the hourly trigger."
open_url "https://script.google.com/home/projects/$(script_id)/edit"
pause

printf '\n%s✔ Done.%s From now on, every change is a clasp push.\n' \
  "$bold" "$reset"
