> **Proyecto:** Digital Money House  
> **Documento:** Infraestructura  
> **Última actualización:** 2025-10-04  
> **Responsable:** Ingeniería (Plataforma)

## Índice
- [1) Objetivo](#1-objetivo)
- [2) Requisitos & herramientas](#2-requisitos--herramientas)
- [3) Variables de entorno](#3-variables-de-entorno)
- [4) Desarrollo local con Docker (compose)](#4-desarrollo-local-con-docker-compose)
- [5) Supabase local (opcional)](#5-supabase-local-opcional)
- [6) Microservicios (opcional)](#6-microservicios-opcional-topología-preparada)
- [7) Producción (Vercel + Supabase)](#7-producción-vercel--supabase)
- [8) Imagen Docker de producción (opcional)](#8-imagen-docker-de-producción-opcional)
- [9) CI/CD (GitHub Actions)](#9-cicd-github-actions)
- [10) Bocetos de red](#10-bocetos-de-red)
- [11) Troubleshooting rápido](#11-troubleshooting-rápido)
- [12) Glosario](#12-glosario)
- [13) Anexos](#13-anexos)


## 1) Objetivo

🔹 Estandarizar cómo correr el proyecto localmente con Docker.

🔹 Definir el diseño de la infraestructura (local y prod) con un **boceto de red**.

🔹 Dejar alternativas para empaquetar como **imagen Docker** y publicar.

---

## 2) Requisitos & herramientas

* Git
* Docker Desktop (incluye Docker CLI y Compose)
* Node 20 (solo si se corre fuera de Docker)
* (Opcional) **Supabase CLI** para stack local (`supabase start`)

**Windows/WSL**

* Activar WSL2 e integración en Docker Desktop: *Settings → Resources → WSL integration*.
* Aumentar recursos: *Settings → Resources* (CPU 2–4, Mem 4–6 GB).

---

## 3) Variables de entorno

Crear `.env.local` en la raíz (no se commitea). Ejemplo:

```bash
# === Front (públicas) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# === Solo server (API routes / cron) ===
# SUPABASE_SERVICE_ROLE_KEY= # (NO usar en el cliente)
```

> 🔹 **Compose** puede leer este archivo con `env_file`. No uses `service_role` en el front.

---

## 4) Desarrollo local con Docker (compose)

Archivo `docker-compose.yml` (dev):

```yaml
services:
  web:
    image: node:20-alpine
    container_name: dmh-web-dev
    working_dir: /app
    volumes:
      - .:/app:cached
      - node_modules:/app/node_modules
    ports:
      - "3000:3000"
    env_file:
      - .env.local               # lee NEXT_PUBLIC_*
    environment:
      CHOKIDAR_USEPOLLING: "true"
      WATCHPACK_POLLING: "true"
    command: >
      sh -lc "test -x node_modules/.bin/next || npm ci --prefer-offline --no-audit --fund=false; npm run dev"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').request({host:'localhost',port:3000,path:'/'},r=>process.exit(r.statusCode?0:1)).on('error',()=>process.exit(1)).end()"]
      interval: 10s
      timeout: 5s
      retries: 10

  mailhog:
    image: mailhog/mailhog:latest
    container_name: dmh-mailhog
    ports:
      - "8025:8025"
    restart: unless-stopped

volumes:
  node_modules:
```

**Scripts recomendados (`package.json`)**

```json
{
  "scripts": {
    "dev": "next dev -p 3000 -H 0.0.0.0",
    "build": "next build",
    "start": "next start -p 3000",
    "test": "jest"
  }
}
```

**Comandos clave**

```bash
# levantar
docker compose up -d
# logs
docker compose logs -f web
# bajar
docker compose down
# bajar + borrar volúmenes (node_modules)
docker compose down -v
# servicios definidos
docker compose config --services
# entrar al contenedor
docker compose exec web sh
```

**Acceso desde otro dispositivo en la LAN**

* Con `-H 0.0.0.0` en `npm run dev`, abrir `http://<IP_DEL_HOST>:3000`.
* Ver IP en Windows: `ipconfig` → IPv4.

---

## 5) Supabase local (opcional)

Instalar CLI y arrancar:

```bash
# https://supabase.com/docs/guides/cli/getting-started
supabase start
```

La CLI muestra:

* API URL (por ej. `http://127.0.0.1:54321`)
* `anon key` y `service_role`

Usar en `.env.local` para desarrollo offline:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey... # anon local
```

> 🔹 Para seeds/migraciones, agregar scripts de SQL o usar `supabase db`.

---

## 6) Microservicios (opcional, topología preparada)

Si se desea separar lógica (API/worker/cola) agregar:

```yaml
services:
  api:
    image: node:20-alpine
    working_dir: /app
    volumes: [".:/app:cached", "node_modules:/app/node_modules"]
    command: sh -lc "npm run api:dev"
    env_file: [.env.local]
    depends_on: [queue]

  worker:
    image: node:20-alpine
    working_dir: /app
    volumes: [".:/app:cached", "node_modules:/app/node_modules"]
    command: sh -lc "npm run worker:dev"
    env_file: [.env.local]
    depends_on: [queue]

  queue:
    image: redis:7-alpine
```

> 🔹 Los scripts `api:dev` y `worker:dev` pueden ser Express/Fastify/Nest y jobs (BullMQ/Agenda).

---

## 7) Producción (Vercel + Supabase)

* **Frontend**: Vercel (Next.js). Build & deploy desde Git. Variables en Project Settings.
* **Backend gestionado**: Supabase (DB/Auth/Storage). Buckets privados/públicos según el caso.
* **Email**: proveedor SMTP (en dev usamos MailHog; en prod Resend/SES/etc.).

**Variables en Vercel**

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* (server) `SUPABASE_SERVICE_ROLE_KEY` si se usa en API routes (nunca en el cliente).

---

## 8) Imagen Docker de producción (opcional)

**Dockerfile** multi-stage:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.prod.yml** (si se desea correr la imagen):

```yaml
services:
  web:
    build: .
    ports: ["3000:3000"]
    env_file: [.env.local]
```

**Ciclo de actualización**

```bash
# build con tag
docker build -t ghcr.io/tu-user/dmh-web:1.0.0 -t ghcr.io/tu-user/dmh-web:latest .
# push a GHCR o Docker Hub
docker push ghcr.io/tu-user/dmh-web:1.0.0
# consumidores actualizan
docker pull ghcr.io/tu-user/dmh-web:1.0.0
```

---

## 9) CI/CD (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint --if-present
      - run: npm test -- --ci
      - name: Build Next
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        run: npm run build
```

> 🔹 Asegurar en `tsconfig.json` principal: **excluir** tests (`test`, `__tests__`, `*.spec.*`, `*.test.*`) para no romper `next build` en Vercel.

---

## 10) Bocetos de red

**Desarrollo (local)**

```
[Host Windows/macOS/Linux]
   └─ Docker (red: dmh-net)
       ├─ web (Next dev)
       │    • 3000/tcp → host:3000
       │    • Volumen: node_modules
       │    • .env.local (NEXT_PUBLIC_*)
       ├─ mailhog (SMTP/UI)
       │    • 8025/tcp → host:8025
       └─ (opcional) supabase local (CLI)
            • API 54321 (anon/service_role locales)
```

**Producción**

```
[Internet/CDN]
   └─ Vercel (Next.js)
       • Deploy desde Git
       • Variables de entorno
   └─ Supabase (DB/Auth/Storage)
       • Postgres + RLS
       • Buckets (public/private)
   └─ Proveedor de email (Resend/SES/etc.)
```

---

## 11) Troubleshooting rápido

🔹 **`docker: command not found`** (Windows)

* Abrir Docker Desktop (Engine running).
* Nueva terminal. Si persiste, agregar al PATH:
  `C:\Program Files\Docker\Docker\resources\bin` y `...\cli-plugins`.

🔹 **Warnings `NEXT_PUBLIC_* not set` en Compose**

* Usar `env_file: [.env.local]` o crear `.env` al lado del compose.

🔹 **`sh: next: not found`**

* El volumen `node_modules` está vacío. Sembrar deps:
  `docker compose run --rm web sh -lc "npm ci --prefer-offline --no-audit --fund=false"`.
* O usar el `command` con auto-instalación (sección 4).

🔹 **Lento en Windows**

* Mantener `node_modules` como volumen.
* Excluir la carpeta del proyecto en el antivirus.
* En Docker Desktop subir recursos y, si usas WSL2, trabajar dentro de `\\wsl$`.

---

## 12) Glosario

* **Imagen**: plantilla inmutable con tu app y dependencias.
* **Contenedor**: proceso en ejecución creado desde una imagen.
* **Compose**: orquestación simple de múltiples contenedores.
* **Env file**: archivo con variables de entorno que carga Compose.

---

## 13) Anexos

* `docs/infraestructura.md` (este archivo)
* `docker-compose.yml` (dev)
* `docker-compose.prod.yml` (opcional)
* `Dockerfile` (multi-stage)
* `.env.local` / `.env.example`
* `.github/workflows/ci.yml`
