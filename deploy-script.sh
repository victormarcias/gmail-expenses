#!/usr/bin/env bash
# Gmail Expenses: deploys the code to Apps Script with clasp and opens the
# project in the browser, to run dryRun() there.
# author: @victormarcias
#
# Usage: ./deploy-script.sh

set -euo pipefail
cd "$(dirname "$0")"

command -v clasp >/dev/null || { echo "✖ clasp is missing: run ./setup.sh" >&2; exit 1; }

clasp() { command clasp --user gmail-expenses "$@"; }

./login.sh
clasp push --force
clasp open-script
