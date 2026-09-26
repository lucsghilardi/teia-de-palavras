# Imagem de produção do Next.js 16 (build standalone).
# Em desenvolvimento use node:22-alpine com `npm run dev`; este Dockerfile é
# usado apenas pelo compose de produção.

# ---------- deps ----------
FROM node:22-alpine AS deps
# libc6-compat cobre binários que esperam glibc (o SWC do Next é um deles).
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* é embutido no bundle em tempo de build, não lido em runtime.
# Só serve de fallback: o tráfego autenticado usa INTERNAL_API_URL, que é
# resolvido no servidor (ver lib/auth.ts).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_REVERB_APP_KEY
ENV NEXT_PUBLIC_REVERB_APP_KEY=${NEXT_PUBLIC_REVERB_APP_KEY}
ARG NEXT_PUBLIC_REVERB_HOST
ENV NEXT_PUBLIC_REVERB_HOST=${NEXT_PUBLIC_REVERB_HOST}
ARG NEXT_PUBLIC_REVERB_PORT
ENV NEXT_PUBLIC_REVERB_PORT=${NEXT_PUBLIC_REVERB_PORT}
ARG NEXT_PUBLIC_REVERB_SCHEME
ENV NEXT_PUBLIC_REVERB_SCHEME=${NEXT_PUBLIC_REVERB_SCHEME}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# O standalone traz o server.js e as dependências mínimas; static e public
# precisam ser copiados à parte.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
