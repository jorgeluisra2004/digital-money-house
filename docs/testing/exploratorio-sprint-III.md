# Testing exploratorio — Sprint III (DMH)

**Ámbito:** Módulo Actividad (listado, filtros, búsqueda, paginación, modal de detalle).  
**Objetivo:** Detectar inconsistencias funcionales/visuales y riesgos no cubiertos por pruebas formales.

## 1) Organización
- **Formato:** sesiones time-boxed de 60–90 minutos.
- **Equipo:** QA + dev de front para pairing en hallazgos críticos.
- **Entorno:** `NEXT_PUBLIC_E2E=true` (stubs disponibles) y entorno de staging con datos reales sanitizados.
- **Herramientas:** Playwright (traceviewer para repro), DevTools (Lighthouse), Grabador de pantalla.

## 2) Charters (cartas de misión)
1. **Charter A — Filtros combinados**: Estresar combinaciones de período (predefinidos vs. custom) + operación + búsqueda.  
   _Riesgos_: condiciones límite de fechas, confusión from/to, reset parcial.
2. **Charter B — Paginación**: Tamaños de página, no-existencia de paginación, salto visual al cambiar de página.  
   _Riesgos_: estado activo incorrecto, focus perdido.
3. **Charter C — Modal de detalle**: Acceso, cierre por overlay/ESC, formato de campos, textos largos.  
   _Riesgos_: overflow, truncamiento, locales de fecha.
4. **Charter D — Robustez visual**: Hovers, sombras, contrastes, dark mode, zoom 80–150%.  
   _Riesgos_: accesibilidad/contraste, degradación responsive.
5. **Charter E — URL & deep-linking**: Compartir enlaces con filtros, recarga y restauración del estado.  
   _Riesgos_: parámetros inválidos, estado parcial, back/forward.
6. **Charter F — Performance UX**: Carga inicial, bloqueos al abrir/cerrar popover/modal.  
   _Riesgos_: jank, layout shift (CLS).

## 3) Tours sugeridos
- **Money tour**: Recorrido por montos, signos, formatos, separadores.
- **Data tour**: Fechas límite (inicio/fin de mes/año), TZ, DST.
- **Interruptions tour**: Cambios de ruta, recarga, ir/volver histórico del navegador.
- **Accessibility tour**: Navegación por teclado y lectores.

## 4) Escenarios y workflows
- **WF1**: Buscar → aplicar “Último año” → filtrar egresos → abrir detalle → copiar URL → recargar.
- **WF2**: Custom range inválido (from > to) → corregir → aplicar.
- **WF3**: Ítems justos en frontera de paginación (10, 11, 20, 21) y ver paginador.
- **WF4**: Abrir filtros, abrir modal (desde detrás), asegurar overlay stacking correcto.

## 5) Sesiones (plantilla)
- **ID:** EXP-S3-01  
- **Fecha/Hora:** AAAA-MM-DD hh:mm  
- **Charter:** A/B/C/D/E/F  
- **Notas:** …  
- **Evidencias:** screenshots, videos, trace.zip  
- **Issues levantados:** … (ID tracker)  
- **Conclusión:** …

## 6) Hallazgos (resumen)
- _(Completar durante la ejecución de sesiones.)_

## 7) Criterios de salida
- No hay defectos Bloqueantes/Críticos abiertos.
- Cobertura de charters ≥ 80%.
- Flujos principales validados en Chrome y 1 navegador alternativo.