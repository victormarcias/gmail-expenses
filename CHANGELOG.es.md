# Changelog

Todos los cambios notables de Gmail Expenses se documentan en este archivo.

El formato se basa en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones son `<años desde 2026>.<mes>.<parche>`: 0.11.0 es noviembre de
2026 y 1.1.0 es enero de 2027. Un release extra dentro del mes sube el parche.

[English](CHANGELOG.md)

## [Unreleased]

### Agregado

- **Carga manual:** una página web de una pantalla (categoría, detalle,
  precio, Agregar) que escribe una fila pagada en la pestaña del mes actual.
  La sirve el script como web app que solo su dueño puede abrir, con el logo
  del proyecto en la página y un favicon cuadrado en su pestaña.
  `deploy-webapp.sh` la instala e imprime su URL.
- **Categorías:** `Ocio`, `Mascotas`, `Impuestos`, `Educación` y
  `Vacaciones`, para cargas manuales. La web app las muestra como una
  grilla de botones de colores con emoji; la elegida queda
  presionada y su nombre se ve abajo. Al inicio no hay ninguna elegida.
- **Proyecto:** logo al inicio del README y un `README.es.md` en
  español.

### Cambiado

- **Gmail:** los mails procesados se marcan como leídos junto con el label.
- **Pagos:** se saltean las confirmaciones de Pagomiscuentas: la factura ya
  es una fila.
- **Deploy:** clasp usa su propio usuario con nombre, así que iniciar sesión
  en la cuenta de otro proyecto ya no cierra la de este.
- **Facturas:** las facturas en cuotas de AYSAM dan una fila Pagar por cuota.
- **Categorías:** `Servicios` ya no existe. Las facturas de teléfono,
  internet y TV van a `Hogar`, y los servicios digitales a `Suscripciones`.
  Las pestañas que ya tienen una columna `Servicios` la conservan.
- **Proyecto:** el código de Apps Script vive en `source/`, que es lo que
  sube `clasp push`.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/commits/develop
