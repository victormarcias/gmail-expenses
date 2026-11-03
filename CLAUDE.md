# Gmail Expenses — project guide

Google Apps Script (V8) that reads expense emails from Gmail every hour and
writes one row per transaction into a Google Sheet, one tab per month
(`2026-11`). Made for Argentina: `$ 12.345,67` amounts, dólar cripto / blue,
local senders. Only the email body is read, never attachments.

The global rules in `~/Documents/GitHub/global/CLAUDE.md` apply on top of this
file (Spanish in chat, English in the repo, never commit or push on your own,
no browser checks).

## Files

| File | What it holds |
|---|---|
| `Main.gs` | `install()` (trigger), `run()`, `dryRun()`, `scanMessages()`, `sources()` |
| `Config.gs` | Hand-edited settings: `RUN_EVERY_HOURS`, `DRY_RUN_*`, `USD_RATE`, `LABEL` |
| `Categories.gs` | Hand-edited senders, `CATEGORIES` (one sheet column each), `PAYMENTS`, generic patterns |
| `Parse.gs` | `parseMessage()`, amount/date parsing, alias lookup, DolarApi rate |
| `Sheet.gs` | Monthly tab writing, headers matched by name, `TOTAL` row |
| `Gmail.gs` | Gmail search and per-message labeling (advanced Gmail service) |
| `Transfers.gs` | Personal transfer aliases → category. Git-ignored |
| `Transfers.example.gs` | Template for it; `.claspignore` keeps it out of Apps Script |
| `appsscript.json` | Time zone (Buenos Aires), Gmail advanced service, V8 |
| `images/` | README screenshots |

## How it works

- `run()` (trigger, or by hand) scans every unlabeled inbox email from a known
  sender whose subject matches, plus `anySender` payment confirmations found
  by `query`. Each one gives rows, no rows (`skipIf`) or a review reason
  (logged). Every handled email gets the `Gmail Expenses` label.
- Rows go to the tab of the month the run happens in, not the email's month.
- Rows are written before labels, so a failed write retries next run.
- `TIME_BUDGET_MS` (4 min) stops scanning before Apps Script's 6-minute
  limit; the rest waits for the next run.
- USD amounts: own `USD` column, plus the peso conversion in the category,
  with the rate in a cell note. A statement with both balances gives 2 rows.
- Bills of `HOGAR` / phone services are ignored (`viaPayments`): only the
  payment confirmation counts, named after the payee and categorized by
  alias (`TRANSFERS`), known sender name, or `PAYMENTS.category`.
- `dryRun()` logs `OK` / `REVIEW` / `SKIP` / `IGNORED` per email without
  touching the sheet or labels: the way to test pattern changes.

## Personal data — never commit or publish

- `.clasp.json` (scriptId) and `Transfers.gs` (real aliases): git-ignored.
  `/commit` stops if either shows up.
- `FILE_ID` (the sheet's ID) lives only in Script Properties.
- `.gas-sync/` and `jsconfig.json` (VS Code Apps Script autocomplete) are
  git-ignored; `.vscode/settings.json` hides them.

## Conventions

- Code style: every hand-edited setting carries its own explanatory comment
  in the `.gs` file. Keep comments current when changing behavior.
- README: light to read. Don't repeat in it what the code comments already
  explain; point to the file instead. It covers what the tool detects, the
  sheet, the emails, setup and testing. `#` title, `##` sections, `###`
  subsections. There's no Spanish `README.es.md`.
- Screenshots: save to `images/<kebab-name>.png`, shrunk to 50% and with
  anything sensitive (IDs, emails, background fragments) pixelated then
  blurred, so it can't be recovered (Pillow is installed). The original in
  Downloads is left alone. Embed inside the matching setup step as
  `<img src="images/x.png" alt="…" width="480">`, with no text explaining
  what the image already shows.
- Deploy: `clasp push` (only `*.gs` and `appsscript.json` go up, per
  `.claspignore`). The user runs it; editing in the web editor and locally at
  once makes one overwrite the other.
- No test suite. Static check: copy a `.gs` to `.js` in the scratchpad and
  run `node --check` on it. Real behavior is checked by the user with
  `dryRun()`.
- `CLAUDE.md` and `.claude/` (skills, settings) may be staged with
  `git add` once checked for sensitive data; never `settings.local.json`.
- Commits: only through `/commit` (`.claude/skills/commit/`), one-line
  messages like "Adds commit skill, VS Code settings and README heading
  levels."
