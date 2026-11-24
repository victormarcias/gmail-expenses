# Changelog

Todos los cambios notables de Gmail Expenses se documentan en este archivo.

El formato se basa en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones son `<años desde 2026>.<mes>.<parche>`: 0.11.0 es noviembre de
2026 y 1.1.0 es enero de 2027. Un release extra dentro del mes sube el parche.

[English](CHANGELOG.md)

## [Unreleased]

### Agregado

- **Proyecto:** logo al inicio del README y un `README.es.md` en
  español.

### Cambiado

- **Gmail:** los mails procesados se marcan como leídos junto con el label.
- **Pagos:** se saltean las confirmaciones de Pagomiscuentas: la factura ya
  es una fila.
- **Deploy:** clasp usa su propio usuario con nombre, así que iniciar sesión
  en la cuenta de otro proyecto ya no cierra la de este.
- **Facturas:** las facturas en cuotas de AYSAM dan una fila Pagar por cuota.
- **Proyecto:** el código de Apps Script vive en `source/`, que es lo que
  sube `clasp push`.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/commits/develop
