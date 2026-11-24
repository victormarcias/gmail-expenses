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
  a square favicon on its tab. `deploy-webapp.sh` installs it and prints its
  URL.
- **Categories:** `Ocio`, `Mascotas`, `Impuestos`, `Educación` and
  `Vacaciones`, for manual entries. The web app shows them as a
  grid of colored emoji buttons; the chosen one stays pressed and its name
  shows below. No category is chosen at first.
- **Project:** logo at the top of the README, and a Spanish
  `README.es.md`.

### Changed

- **Gmail:** handled emails are marked as read along with the label.
- **Payments:** Pagomiscuentas confirmations are skipped: the bill is
  already a row.
- **Deploy:** clasp uses its own named user, so signing in to another
  project's account no longer logs this one out.
- **Bills:** AYSAM installment bills give one Pagar row per installment.
- **Categories:** `Servicios` is gone. Phone, internet and TV bills go to
  `Hogar`, and digital services to `Suscripciones`. Tabs that already have a
  `Servicios` column keep it.
- **Project:** the Apps Script code lives in `source/`, which is what
  `clasp push` uploads.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/commits/develop
