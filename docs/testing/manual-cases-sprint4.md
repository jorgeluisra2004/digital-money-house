# Casos de prueba manual — Sprint 4

## Servicios (lista/buscador)

1. Abrir `/pagar-servicios` → se listan servicios (sin paginar).
2. Escribir "Cable" en buscador → solo quedan "Cablevisión"/variantes.
3. Borrado del buscador → vuelve la lista completa.

## Identificador

4. Ingresar valor con letras → se ignoran, quedan solo dígitos.
5. Ingresar <6 dígitos → muestra error.
6. Ingresar 6–11 dígitos → pasa a Medios de pago con `m` precargado.

## Medios de pago

7. Ver header con **Total a pagar**.
8. Seleccionar tarjeta → radio derecho activo.
9. Click **Pagar** (tarjeta) → pantalla de **error** (idéntica al diseño).
10. Click **Volver a intentarlo** → regresa a selección.
11. Con saldo insuficiente → botón _Pagar con dinero en cuenta_ deshabilitado y/o error.
12. Con saldo suficiente → navegar a **Comprobante**.

## Comprobante

13. Monto, fecha, de/para, código visibles.
14. **Descargar comprobante** llama a `window.print()` (o descarga imagen si usás la otra variante).
