# Changelog

All notable changes to Gmail Expenses are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are `<years since 2026>.<month>.<patch>`: 0.11.0 is November 2026
and 1.1.0 is January 2027. An extra release within a month bumps the patch.

[Español](CHANGELOG.es.md)

## [Unreleased]

### Added

- **Project:** logo at the top of the README, and a Spanish
  `README.es.md`.

### Changed

- **Gmail:** handled emails are marked as read along with the label.
- **Payments:** Pagomiscuentas confirmations are skipped: the bill is
  already a row.
- **Project:** the Apps Script code lives in `source/`, which is what
  `clasp push` uploads.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/commits/develop
