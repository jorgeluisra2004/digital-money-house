# QA — Selenium E2E (Smokes)

Este módulo contiene los **smoke tests** E2E con **Java 17 + Maven + Selenium 4 + JUnit 5** sobre la app DMH.

## Requisitos locales
- Node 20 y app corriendo (`npm run build && npm start -p 3000`)
- Java 17 / Maven 3.9+
- Usuario de pruebas (sin captcha/OTP)

## Variables
Se leen por System Properties de Maven (configurado en el `pom.xml`):
- `BASE_URL` (default: `http://localhost:3000`)
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `HEADLESS` (`true`/`false`)

## Ejecutar local
```bash
# desde la raíz del repo
npm ci
npm run build
npm start -p 3000 &   # ó en otra terminal

# en otra terminal
cd qa/selenium
mvn -q -Dtest='*Smoke*' -DHEADLESS=false test
