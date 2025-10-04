# Plan de pruebas — Digital Money House

## ¿Cómo escribir un caso de prueba?

**Columnas (en CSV/Excel):**  
ID · Módulo · Título · Precondiciones · Pasos · Datos · Resultado esperado · Prioridad (Alta/Media/Baja) · Tipo (Funcional/UX/Security/…) · Suite (Smoke/Regression) · Estado (No ejecutado/OK/KO) · Evidencia (link)

### Ejemplo (Auth)

- **ID:** TC-LOG-001
- **Módulo:** Auth
- **Título:** Logout redirige a la landing y limpia tokens
- **Precondiciones:** Usuario logueado en `/home`
- **Pasos:** 1) Click “Cerrar sesión”.
- **Resultado esperado:** Navega a `/` (landing). `localStorage` sin claves `sb-*`, `supabase.auth.token`, `dmh-auth`, `dmh_token`.
- **Prioridad:** Alta · **Tipo:** Funcional · **Suite:** Smoke, Regression

## ¿Cómo reportar un defecto?

**Plantilla (Issue):**  
Título · Severidad · Entorno · Precondiciones · Pasos · Resultado actual · Resultado esperado · Evidencia · Logs · Regresión desde · Etiquetas

## Criterios de suite de humo (Smoke)

Casos críticos y cortos que validan que el build es ejecutable: login/logout, persistencia de sesión, navegación principal, salud de API. **Meta:** ≤ 15 min.

## Criterios de suite de regresión

Casos de funcionalidades existentes, bugs cerrados (con su test), alternos y límites, integraciones, permisos y seguridad básica.

## Alcance E2E automatizado mínimo

- Persistencia de sesión al recargar (TC-LOG-002)
- Logout redirige a landing y limpia tokens (TC-LOG-001)
