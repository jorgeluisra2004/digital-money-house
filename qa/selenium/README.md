# QA — Selenium E2E (Smokes)

Suite de **Smoke Tests E2E** para la app **DMH**, basada en **Java 17 + Maven + Selenium 4 + JUnit 5**.  
Cubre los flujos mínimos de vida: login/navegación, actividad (filtros), perfil (alias/copy) y tarjetas (alta/listado).

---

## Tabla de contenidos
- [Stack](#stack)
- [Requisitos locales](#requisitos-locales)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Diseño & convenciones](#diseño--convenciones)
- [Reportes](#reportes)
- [CI (ejemplo)](#ci-ejemplo)
- [Troubleshooting](#troubleshooting)

---

## Stack
- **Java** 17
- **Maven** 3.9+
- **Selenium** 4.x (WebDriverManager para drivers)
- **JUnit** 5

---

## Requisitos locales
- **Node 20** y la app DMH corriendo (p. ej. `npm run build && npm start -p 3000`)
- **Java 17 / Maven 3.9+**
- **Google Chrome** instalado (WebDriverManager descarga el chromedriver compatible)
- **Usuario de pruebas** (sin captcha/OTP para poder loguear)

---

## Configuración

Las variables se leen vía **System Properties** de Maven (ver `pom.xml`). Se aceptan **alias** en minúscula para evitar confusiones.

| Propiedad      | Alias         | Tipo    | Default                 | Descripción                                |
| -------------- | ------------- | ------- | ----------------------- | ------------------------------------------ |
| `BASE_URL`     | `baseUrl`     | string  | `http://localhost:3000` | URL base de la app bajo prueba             |
| `E2E_EMAIL`    | —             | string  | —                       | Email del usuario de pruebas               |
| `E2E_PASSWORD` | —             | string  | —                       | Password del usuario de pruebas            |
| `HEADLESS`     | `headless`    | boolean | `true`                  | Corre Chrome en modo headless (true/false) |
| `WAIT_SECONDS` | `waitSeconds` | number  | `20`                    | Timeout explícito por defecto (segundos)   |

> **Nota:** si pasás **ambas** (propiedad y alias), prevalece la de mayúsculas.

---

## Ejecución

### 1) Levantar la app

```bash
# desde la raíz del repo
npm ci
npm run build
npm start -p 3000
```

### 2) Correr los smokes

**Linux/Mac (bash/zsh)**

```bash
cd qa/selenium
mvn -q -Dtest='*Smoke*' \
  -DbaseUrl=http://localhost:3000 \
  -DE2E_EMAIL="usuario@dominio.com" \
  -DE2E_PASSWORD="Secreta123" \
  -Dheadless=false \
  test
```

**Windows (PowerShell)**

```powershell
cd qa/selenium
mvn -q -Dtest='*Smoke*' `
  -DbaseUrl=http://localhost:3000 `
  -DE2E_EMAIL="usuario@dominio.com" `
  -DE2E_PASSWORD="Secreta123" `
  -Dheadless=false `
  test
```

### Variantes útiles

**Headless en CI**
```bash
mvn -q -Dtest='*Smoke*' -DbaseUrl=$BASE_URL -DE2E_EMAIL=$E2E_EMAIL -DE2E_PASSWORD=$E2E_PASSWORD -Dheadless=true test
```

**Seleccionar una clase**
```bash
mvn -q -Dtest=SmokeTarjetasTest -Dheadless=true test
```

**Aumentar timeout global**
```bash
mvn -q -Dtest='*Smoke*' -DwaitSeconds=30 test
```

---

## Estructura del proyecto

```text
qa/selenium/
  ├─ pom.xml
  └─ src/test/java/com/dmh/selenium/
     ├─ smoke/
     │  ├─ SmokeActividadTest.java
     │  ├─ SmokeNavigationTest.java
     │  ├─ SmokePerfilTest.java
     │  └─ SmokeTarjetasTest.java
     └─ pages/
        ├─ ActividadPage.java
        ├─ PerfilPage.java
        └─ TarjetasPage.java
```

---

## Diseño & convenciones
- **Page Object Model (POM):** cada página encapsula selectores y acciones.
- **Esperas explícitas** (`WebDriverWait`) con timeout configurable (`WAIT_SECONDS`).
- **Selectores estables:** se prioriza `data-testid` para minimizar flakiness.
- **Smokes = camino feliz:** foco en flujos mínimos y aserciones visibles al usuario.

---

## Reportes
- Salida estándar de Maven.
- **Surefire reports:** `qa/selenium/target/surefire-reports/` (`*.txt`/`*.xml` por clase).

---

## CI (ejemplo)

```yaml
name: e2e-smokes
on:
  workflow_dispatch:
  pull_request:
jobs:
  smokes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build & start app
        run: |
          npm ci
          npm run build
          nohup npm start -p 3000 >/dev/null 2>&1 &

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Run smokes (headless)
        working-directory: qa/selenium
        run: |
          mvn -B -q -Dtest='*Smoke*'             -DbaseUrl=http://localhost:3000             -DE2E_EMAIL="${{ secrets.E2E_EMAIL }}"             -DE2E_PASSWORD="${{ secrets.E2E_PASSWORD }}"             -Dheadless=true             test

      - name: Publicar reportes
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: surefire-reports
          path: qa/selenium/target/surefire-reports
```

---

## Troubleshooting

**“Unable to find CDP implementation matching …” (warnings)**  
- Son warnings de Selenium cuando el Chrome local no tiene un paquete `selenium-devtools` clavado para ese major. No bloquean.  
- Opcional: agregar `org.seleniumhq.selenium:selenium-devtools-v<major>:<seleniumVersion>`.

**Timeout esperando elementos**  
- Verificá que la app esté **arriba** en `BASE_URL`.  
- Subí timeout: `-DwaitSeconds=30`.  
- Confirmá que los `data-testid` existan y coincidan con los Page Objects.

**Falla de login**  
- Usar un **usuario de pruebas** sin 2FA/OTP/captcha y con datos mínimos.

**Puerto ocupado**  
- Levantá la app en otro puerto y pasá el nuevo `baseUrl` (p. ej. `http://localhost:4000`).

