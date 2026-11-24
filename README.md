<p align="center">
  <img src="images/logo.png" alt="Gmail Expenses" width="240">
</p>

# Gmail Expenses

[Español](README.es.md)

📧 Google Apps Script that reads expense emails from Gmail every hour and
writes them into a Google Sheet, one row per transaction. Made for Argentina:
amounts like `$ 12.345,67`, dólar cripto / blue, local senders.

It only reads the email body, never PDF attachments.

## What it detects

| Column | Senders | Estado |
|---|---|---|
| 🏠 Hogar | Payments to `BILLS` (electricity, gas, water, municipal taxes, phone, internet and TV). Their bills (and home insurance and bank invoices due) are read | Pagar for bills, Pagado for payments |
| 🔁 Suscripciones | `SUBSCRIPTIONS`: digital services (streaming, music, games, apps, cloud, AI). Their receipts, ARS or USD, credit card charges skipped | Pagado |
| 🩺 Salud | `PREPAGAS` (health insurance), paid by automatic debit | Pagado |
| 💳 Tarjetas | `CREDIT_CARDS` (credit card statements only, not account statements: one row per balance, ARS and USD) | Pagar |
| 🚕 Transporte | Uber, Cabify | Pagado |
| 🛒 Compras | MercadoLibre, only debit / account money purchases; payments and transfers to anyone not known (see below) | Pagado |
| 🧾 Otros | Payment confirmations from any other sender (gateways, shops: "Tu pago ha sido acreditado a X", "Pago aprobado"), never from a known one | Pagado |
| 🥦 Supermercado | PedidosYa Market, Jumbo, Disco, Vea, Coto, Carrefour, Día, ChangoMâs, La Anónima | Pagado |
| 🛵 Delivery | PedidosYa (orders and Plus, not Market), Rappi (orders and Prime), Uber Eats | Pagado |

## The sheet

One tab per month (`2026-11`). With the default categories, the columns are
`Fecha`, `Detalle`, `Hogar`, `Suscripciones`, `Salud`, `Tarjetas`,
`Transporte`, `Compras`, `Supermercado`, `Delivery`, `Ocio`, `Mascotas`,
`Impuestos`, `Educación`, `Vacaciones`, `Otros`, `USD`, `Vencimiento` and
`Estado`.

- Each run writes to the tab of the month **it runs in**, not the email's: a
  bill sent on the 31st lands in next month's tab, when it's paid.
- One row per transaction, sorted by email date (`Fecha`), with the sender's
  name in `Detalle` (`Uber`) and the amount in its category column.
- An email of the same thread that arrives within `ADJUSTED_RECEIPT_HOURS` of an
  earlier one (an adjusted receipt) adds no row: the first amount stays.
- `USD`: the original amount of USD charges. The same row also has the amount
  in pesos in its category, at the dollar set in `USD_RATE` (cripto by
  default) from [DolarApi](https://dolarapi.com).
  The rate used is in the cell's note; if DolarApi is down, the last rate that
  worked is used and the note says so.
- An email with both a pesos and a USD amount (a statement with both balances,
  from some banks) gives two rows: one with the pesos balance, and one with the
  USD balance and its conversion.
- `Vencimiento`: due date for bills and statements.
- `Estado`: Pagar / Pagado dropdown. Card statements and due notices come in
  as Pagar; switch them by hand once paid.
- Payments: house and phone/internet bills come in as Pagar. Many services send
  no payment confirmation, so mark them Pagado by hand. Each payment or
  transfer confirmation from a `PAYMENTS` sender ("Pago aprobado en X",
  "Transferiste a X") is a Pagado row named after the payee, in the category of
  a known sender with the
  payee's name (`Hogar` for a utility), or `Compras` if none. An email listing
  invoices due gives one Pagar row per invoice, named and categorized the same
  way (`Hogar` if unknown). Confirmations from any sender that isn't known (a
  payment gateway, a shop) are picked up by their subject and go to `Otros`
  unless the payee is known; they're named after the payee in the subject, or
  the sender. Paid by credit card, it adds nothing: it's already in the
  statement.
- `TOTAL` row at the bottom: sums for every category and `USD`. It's rebuilt
  on every run, so rows added by hand are included.

## Emails

- Every handled email is labeled `Gmail Expenses`, marked as read and left in
  the inbox. Delete them once they're in the sheet.
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
its column and once inside the statement. Online shop purchases, streaming and
payments already skip credit card charges for this reason (`CREDIT_CARD`, when
the email says so); the rest don't, since they're assumed to be paid with debit
or account money.

## Adding an expense by hand

[WebAppPage.html](source/WebAppPage.html) is a one-screen page: pick a
category, type the price and tap Add. It writes a `Pagado` row into the
current month's tab, with the Detalle field as its detail (`Manual` unless
edited). While the automatic run is scanning, the page shows "Corrida
automática en curso…" and adds the row when it ends.

It is served by the script itself as a web app only its owner can open, so
Google's sign-in is the only authentication. To open it on the phone:

1. Run `./deploy-webapp.sh`. It uploads the code, creates the web app and
   copies its URL (it ends in `/exec`).
2. Send the URL to the phone (AirDrop, a note, a message to yourself).
3. Open it in Safari or Chrome and sign in to Google once.
4. *Share → Add to Home Screen*: it opens like an app, already signed in.

After a change to the page, run `./deploy-webapp.sh` again: it publishes a new
version and the URL stays the same.

## Setup

Needs [Node.js](https://nodejs.org). From the repo, run:

```bash
./setup.sh
```

It installs [clasp](https://github.com/google/clasp) (Google's CLI for Apps
Script), creates the Apps Script project and uploads the code, then opens each
page where something has to be done by hand:

1. Turn on the Apps Script API.
2. Create the sheet and paste its URL.
3. Add `FILE_ID` in *Project Settings → Script Properties* (the script copies
   the value).

   <img src="images/script-properties.png" alt="Script Properties with a
   FILE_ID property" width="480">

4. Run `install()` from the editor and accept the permissions. It creates
   the trigger that calls `run()` every `RUN_EVERY_HOURS`.

   <img src="images/run-function.png" alt="Apps Script editor function
   menu: install, run, dryRun and the other functions" width="480">

   <img src="images/trigger.png" alt="Apps Script trigger: run, Time-driven,
   Hour timer, Every hour" width="480">

It can be run again at any time: it skips what's already done.

After that, every change goes up with `./deploy-script.sh` (it signs its own
`clasp` user in as `CLASP_ACCOUNT` from `.env` if needed, runs `clasp push` and
opens the project). Copy `.env.example` to `.env` first. To process right
away, run `run()` from the editor.

> ⚠️ Edit locally, not in the web editor: `clasp push` overwrites whatever
> was changed there.

## Configuration

Every setting is explained in a comment beside it, in the file it lives in:

- [Config.gs](source/Config.gs): run interval, `dryRun()` options, the dollar rate
  and the label.
- [Categories.gs](source/Categories.gs): senders, categories and their patterns.
  To add a category, add a key to `CATEGORIES`.

Only IDs go in Script Properties.

### Testing changes

After a change, run `./deploy-script.sh`, then run `dryRun()` from the
editor: it logs what `run()` would do with the unlabeled inbox emails, plus the
labeled ones from the last `DRY_RUN_HOURS`, without labeling anything or
touching the sheet.

```
OK       [Salud] 12/11/2026 Prepaga – Tu factura está disponible
         $ 185000 | vence 22/11/2026 | Pagado
REVIEW   [Compras] 05/11/2026 Wallet – Pago aprobado en Empresa
         no amount found
         body: "Hola,\nLe pagaste a Empresa…"
SKIP     [Compras] 08/11/2026 Tienda – Compraste Auriculares
         skipIf matched
IGNORED  Delivery – 50% OFF en tu próximo pedido
         subject didn't match
```

Write custom patterns against the `body` it logs for `REVIEW` emails: it's
the cleaned plain text the patterns run against, which often differs from
how the email looks.
