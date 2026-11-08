#!/usr/bin/env bash
# Gmail Expenses: uploads the code to Apps Script with clasp and opens the
# project in the browser, to run dryRun() there.
# author: @victormarcias
#
# Usage: ./upload.sh

set -euo pipefail
cd "$(dirname "$0")"

command -v clasp >/dev/null || { echo "✖ clasp is missing: run ./setup.sh" >&2; exit 1; }

clasp push --force
clasp open-script
