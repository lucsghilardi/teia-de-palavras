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

# NEXT_PUBLIC_* é embutido no bundle em tempo de build, não lido em runtime, e
# vem do frontend/.env.production (o .dockerignore deixa ele entrar no COPY).
# Não declare ARG/ENV com esses nomes aqui: uma variável já definida, mesmo
# vazia, vence o .env.production e o tempo real sai desligado do build.
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
