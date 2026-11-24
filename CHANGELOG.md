# Changelog

All notable changes to Gmail Expenses are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are `<years since 2026>.<month>.<patch>`: 0.11.0 is November 2026
and 1.1.0 is January 2027. An extra release within a month bumps the patch.

[Español](CHANGELOG.es.md)

## [Unreleased]

### Added

- **Manual entry:** a one-screen web page (category, detail, price, Add) that
  writes a paid row into the current month's tab. It is served by the script
  as a web app only its owner can open, with the project logo on the page and
  a square favicon on its tab. `webapp.sh` installs it and prints its URL, and
  an *Agregar a Inicio* button says how to add the page to a phone's home
  screen.
- **Project:** logo at the top of the README, and a Spanish
  `README.es.md`.

### Changed

- **Gmail:** handled emails are marked as read along with the label.
- **Payments:** Pagomiscuentas confirmations are skipped: the bill is
  already a row.
- **Deploy:** clasp uses its own named user, so signing in to another
  project's account no longer logs this one out.
- **Bills:** AYSAM installment bills give one Pagar row per installment.
- **Project:** the Apps Script code lives in `source/`, which is what
  `clasp push` uploads.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/commits/develop
