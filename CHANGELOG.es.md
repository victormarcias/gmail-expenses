# Changelog

Todos los cambios notables de Gmail Expenses se documentan en este archivo.

El formato se basa en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones son `<años desde 2026>.<mes>.<parche>`: 0.11.0 es noviembre de
2026 y 1.1.0 es enero de 2027. Un release extra dentro del mes sube el parche.

[English](CHANGELOG.md)

## [Unreleased]

## [0.11.0] - 2026-11-26

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
- **Proyecto:** el código de Apps Script vive en `source/`, que es lo que
  sube `clasp push`.
- **Setup:** `setup.sh` recuerda los pasos del browser que terminó y los
  saltea al correrlo de nuevo.
- **Carga manual:** agregar un gasto es más rápido: una sola llamada al
  servidor por Agregar, la fila va justo arriba del TOTAL sin ordenar, y las
  categorías vienen con la página.

### Corregido

- **Recibos ajustados:** solo un recibo anterior del mismo remitente hace que
  un mail sea un recibo ajustado. Una respuesta u otro mail del hilo ya no
  descarta un recibo real.
- **TOTAL:** se borra la fila TOTAL que queda entre los datos cuando se
  agregan filas a mano debajo, así los totales no se cuentan dos veces.

[Unreleased]: https://github.com/victormarcias/gmail-expenses/compare/0.11.0...HEAD
[0.11.0]: https://github.com/victormarcias/gmail-expenses/releases/tag/0.11.0
