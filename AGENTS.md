# Gmail Expenses — project guide

Google Apps Script (V8) that reads expense emails from Gmail every hour and
writes one row per transaction into a Google Sheet, one tab per month
(`2026-11`). Made for Argentina: `$ 12.345,67` amounts, dólar cripto / blue,
local senders. Only the email body is read, never attachments.

## Files

| File | What it holds |
|---|---|
| `source/Main.gs` | `install()` (trigger), `run()`, `dryRun()`, `scanMessages()`, `sources()` |
| `source/Config.gs` | Hand-edited settings: `RUN_EVERY_HOURS`, `DRY_RUN_*`, `USD_RATE`, `LABEL`, `WEB_APP_CATEGORY_ORDER` |
| `source/Categories.gs` | Hand-edited senders, `CATEGORIES` (one sheet column each), `PAYMENTS`, generic patterns |
| `source/Parse.gs` | `parseMessage()`, amount/date parsing, DolarApi rate |
| `source/Sheet.gs` | Monthly tab writing, headers matched by name, `TOTAL` row |
| `source/Gmail.gs` | Gmail search and per-message labeling (advanced Gmail service) |
| `source/WebApp.gs` | `doGet()` serves `WebAppPage.html`; `addExpense()` writes a manual row |
| `source/WebAppPage.html` | Manual entry page: category, detail, price, Add |
| `setup.sh` | Guided install: clasp, project, push, then opens each browser step |
| `deploy-webapp.sh` | Deploys the web app (creates it, or moves it to a new version) and prints its URL |
| `deploy-script.sh` | `login.sh`, then `clasp push` and opening the project in the browser |
| `login.sh` | Signs clasp in as `CLASP_ACCOUNT` from `.env` (git-ignored; template `.env.example`) |
| `source/appsscript.json` | Time zone (Buenos Aires), Gmail advanced service, V8 |
| `images/` | README logo, square favicon (`favicon.png`) and screenshots |
| `CHANGELOG.md` | Keep a Changelog, Unreleased promoted monthly (`.es.md` mirrors it) |

## How it works

- `run()` (trigger, or by hand) scans every unlabeled inbox email from a known
  sender whose subject matches, plus `anySender` payment confirmations found
  by `query`. Each one gives rows, no rows (`skipIf`) or a review reason
  (logged). Every handled email gets the `Gmail Expenses` label.
- Rows go to the tab of the month the run happens in, not the email's month.
- Rows are written before labels, so a failed write retries next run.
- An email less than `ADJUSTED_RECEIPT_HOURS` after an earlier one of its
  Gmail thread is an adjusted receipt: labeled, no row, so the first
  email's amount is the one that counts.
- `TIME_BUDGET_MS` (4 min) stops scanning before Apps Script's 6-minute
  limit; the rest waits for the next run.
- USD amounts: own `USD` column, plus the peso conversion in the category,
  with the rate in a cell note. A statement with both balances gives 2 rows.
- Bills of `BILLS` (phone, internet and TV included) are read as
  `BILL_PATTERNS`: a Pagar row with the due date, marked Pagado by hand. A
  payment confirmation is a separate Pagado row, named after the payee and
  categorized by known sender name, or `PAYMENTS.category`.
  Brubank's invoices due work the same way, one Pagar row each (`items`).
- `dryRun()` logs `OK` / `REVIEW` / `SKIP` / `IGNORED` per email without
  touching the sheet or labels: the way to test pattern changes.

## Personal data — never commit or publish

- `.clasp.json` (scriptId) and `.env` (account): git-ignored.
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
  subsections. `README.es.md` mirrors it.
- Screenshots: save to `images/<kebab-name>.png`, shrunk to 50% and with
  anything sensitive (IDs, emails, background fragments) pixelated then
  blurred, so it can't be recovered (Pillow is installed). The original in
  Downloads is left alone. Embed inside the matching setup step as
  `<img src="images/x.png" alt="…" width="480">`, with no text explaining
  what the image already shows.
- Setup is `./setup.sh` only (no manual copy-paste option). It's
  re-runnable: each step skips itself when done. It avoids leaving
  `clasp create-script`'s overwritten `appsscript.json` and sample `Code.js`.
  Keep README's Setup in step with it.
- Deploy: `./deploy-script.sh` or `clasp push` (`rootDir` is `source/`; only its
  `*.gs`, `*.html` and `appsscript.json` go up, per `.claspignore`). The
  user runs it; editing in the web editor and locally at once makes one
  overwrite the other. The web app goes up with `./deploy-webapp.sh`.
- No test suite. Static check: copy a `.gs` to `.js` in the scratchpad and
  run `node --check` on it. Real behavior is checked by the user with
  `dryRun()`.
- Releases are monthly, versioned `<years since 2026>.<month>.<patch>`
  (0.11.0 is 2026-11, 1.1.0 is 2027-01); an extra release in the same month
  bumps the patch. Pass the version to `/release` explicitly. Write each
  change under `[Unreleased]` in both changelogs as the work happens.
- `AGENTS.md` may be staged with `git add` once checked for sensitive data.
