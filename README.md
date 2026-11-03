# Gmail Expenses

📧 Google Apps Script that reads expense emails from Gmail every hour and
writes them into a Google Sheet, one row per transaction. Made for Argentina:
amounts like `$ 12.345,67`, dólar cripto / blue, local senders.

It only reads the email body, never PDF attachments.

## What it detects

| Column | Senders | Estado |
|---|---|---|
| 🏠 Hogar | Payments to `HOGAR` (electricity, gas, water, municipal taxes) and transfers to `TRANSFERS` aliases (expensas, cleaning). Their bills are ignored | Pagado |
| 📱 Servicios | Payments to `SERVICES` phone, internet and TV (bills ignored). Digital services (streaming, music, games, apps, cloud, AI): their receipts, ARS or USD, credit card charges skipped | Pagado |
| 🩺 Salud | `PREPAGAS` (health insurance), paid by automatic debit | Pagado |
| 💳 Tarjetas | `BANKS` (credit card statements only, not account statements: one row per balance, ARS and USD) | Pagar |
| 🚕 Transporte | Uber, Cabify | Pagado |
| 🛒 Compras | MercadoLibre, only debit / account money purchases; payments and transfers to anyone not known (see below) | Pagado |
| 🛵 Delivery | PedidosYa (orders and Plus), Rappi (orders and Prime), Uber Eats | Pagado |
| 🧾 Otros | Payment confirmations from any other sender (gateways, shops: "Tu pago ha sido acreditado a X", "Pago aprobado"), never from a known one | Pagado |

## The sheet

One tab per month (`2026-11`). With the default categories, the columns are
`Fecha`, `Detalle`, `Hogar`, `Servicios`, `Salud`, `Tarjetas`, `Transporte`,
`Compras`, `Delivery`, `Otros`, `USD`, `Vencimiento` and `Estado`.

- Each run writes to the tab of the month **it runs in**, not the email's: a
  bill sent on the 31st lands in next month's tab, when it's paid.
- One row per transaction, sorted by email date (`Fecha`), with the sender's
  name in `Detalle` (`Galicia`, `Uber`) and the amount in its category column.
- `USD`: the original amount of USD charges. The same row also has the amount
  in pesos in its category, at the dollar set in `USD_RATE` (cripto by
  default) from [DolarApi](https://dolarapi.com).
  The rate used is in the cell's note; if DolarApi is down, the last rate that
  worked is used and the note says so.
- An email with both a pesos and a USD amount (a statement with both balances,
  like Brubank's or Galicia's) gives two rows: one with the pesos balance, and
  one with the USD balance and its conversion.
- `Vencimiento`: due date for bills and statements.
- `Estado`: Pagar / Pagado dropdown. Only card statements come in as Pagar;
  switch them by hand once paid.
- Payments: house and phone/internet bills are paid through Mercado Pago, so
  their bills are ignored and only what was actually paid is added. Each
  payment or transfer confirmation from a `PAYMENTS` sender ("Pago aprobado
  en Edemsa", "Transferiste a Consorcio") is a Pagado row named after the
  payee, in the category of the recipient's alias if it's in `TRANSFERS`, or
  of a known sender with the payee's name (`Hogar` for Edemsa), or `Compras`
  if none. Confirmations from any sender that isn't known (a payment gateway,
  a shop) are picked up by their subject and go to `Otros` unless the payee is
  known; they're named after the payee in the subject, or the sender. Paid by credit card, it
  adds nothing: it's already in the statement.
- `TOTAL` row at the bottom: sums for every category and `USD`. It's rebuilt
  on every run, so rows added by hand are included.

## Emails

- Every handled email is labeled `Gmail Expenses` and left in the inbox.
  Delete them once they're in the sheet.
- If the amount couldn't be read, it's labeled all the same, with no row: the
  reason is only in the run's log (*Executions* in the Apps Script editor).
  After fixing the patterns, remove the label and the next run picks it up
  again.
- Each run looks at every unlabeled inbox email from a known sender, and at
  payment confirmations from any other sender, however old. Labeled emails
  are skipped, so a row is never added twice. Archived emails are never
  looked at.
- A run stops scanning after 4 minutes (Apps Script kills it at 6), writes
  what it has and labels only those emails; the rest wait for the next run.
  The first run on a full inbox may need a few manual `run()`s.

## ⚠️ Double counting

Card statements are added to the total. Anything paid with a credit card that
also has its own email (an Uber, a bill, the prepaga) is counted twice: once in
its column and once inside the statement. MercadoLibre, streaming and payments
already skip credit card charges for this reason (`CREDIT_CARD`, when the
email says so); the rest don't, since they're assumed to be paid with debit or
account money.

## Setup

1. Create a Google Sheet (set *File → Settings → Locale* to Argentina) and copy
   its ID from the URL: `docs.google.com/spreadsheets/d/<FILE_ID>/edit`.
2. Create an empty project at https://script.google.com.
3. Upload the code, with either option below. Copy `Transfers.example.gs` to
   `Transfers.gs` and fill in your aliases first (optional: without it,
   every transfer goes to `Compras`).
4. In the Apps Script editor: *Project Settings → Script Properties* → add
   `FILE_ID` with the sheet's ID.

   <img src="images/script-properties.png" alt="Script Properties with a
   FILE_ID property" width="480">

5. Run `install()` from the editor and accept the permissions. It creates
   the trigger that calls `run()` every `RUN_EVERY_HOURS`.

   <img src="images/run-function.png" alt="Apps Script editor function
   menu: install, run, dryRun and the other functions" width="480">

   <img src="images/trigger.png" alt="Apps Script trigger: run, Time-driven,
   Hour timer, Every hour" width="480">

To process right away, run `run()`: it can be run by hand at any time, on top
of the trigger.

### Option A: clasp (from the terminal)

[clasp](https://github.com/google/clasp) is Google's CLI for Apps Script:
`clasp push` uploads the local files, `clasp pull` downloads the ones in the
web editor. Handy when editing `Config.gs` or `Categories.gs` often, and it keeps the repo and
what runs in Google in sync.

1. Install it, log in, and enable the Apps Script API at
   https://script.google.com/home/usersettings:
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
2. Copy the project's Script ID (*Project Settings*). Copy `.clasp.example.json`
   to `.clasp.json` (git-ignored), set the ID and push. `clasp create` is
   avoided on purpose: it overwrites `appsscript.json`.
   ```bash
   cp .clasp.example.json .clasp.json
   clasp push --force
   ```

After that, every change is a `clasp push`, and `clasp open-script` opens the editor.

### Option B: copy by hand (from the web)

1. In the editor, create one script file per `.gs` file, with the same names
   (`Config`, `Categories`, `Gmail`, `Main`, `Parse`, `Sheet`, and
   `Transfers` if you have it), and paste each one's content. Never
   `Transfers.example`.
2. *Project Settings* → check *Show "appsscript.json" manifest file in editor*,
   then paste the content of [appsscript.json](appsscript.json) into it. Don't
   skip it: it sets the time zone and enables the Gmail API.

Changes made in the web editor don't reach the repo: copy them back by hand,
or with `clasp pull` if you set up clasp later.

> ⚠️ Pick one side to edit. `clasp push` overwrites whatever was changed in
> the web editor, and `clasp pull` overwrites local changes.

## Configuration

Every setting is explained in a comment beside it, in the file it lives in:

- [Config.gs](Config.gs): run interval, `dryRun()` options, the dollar rate.
- [Categories.gs](Categories.gs): senders, categories and their patterns.
  To add a category, add a key to `CATEGORIES`.
- `Transfers.gs`: the aliases you transfer to and their category (template:
  [Transfers.example.gs](Transfers.example.gs)).

Only IDs go in Script Properties.

### Testing changes

After a change (and `clasp push`), run `dryRun()` from the editor: it logs
what `run()` would do, without labeling anything or touching the sheet.

```
OK       [Salud] 12/11/2026 OSDE – Tu factura está disponible
         $ 185000 | vence 22/11/2026 | Pagado
REVIEW   [Compras] 05/11/2026 Mercado Pago – Pago aprobado en Edemsa
         no amount found
         body: "Hola,\nLe pagaste a Edemsa…"
SKIP     [Compras] 08/11/2026 MercadoLibre – Compraste Auriculares
         skipIf matched
IGNORED  Rappi – 50% OFF en tu próximo pedido
         subject didn't match
```

Write custom patterns against the `body` it logs for `REVIEW` emails: it's
the cleaned plain text the patterns run against, which often differs from
how the email looks.
