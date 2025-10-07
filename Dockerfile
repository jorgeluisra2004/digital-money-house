# ------------ 1) deps ------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ------------ 2) build ------------
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# (Opcional) args para compilar con variables públicas si las pasas por build-args
ARG NEXT_PUBLIC_E2E
ARG NEXT_PUBLIC_ENV
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ------------ 3) runner (standalone) ------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Si usas envs de servidor en runtime, déjalas para docker run/compose:
# ENV SUPABASE_SERVICE_ROLE_KEY=...
# ENV RESEND_API_KEY=...

# Copiamos sólo lo necesario del build standalone
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
