FROM node:22-alpine AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# install pnpm and turbo cli
RUN corepack enable && npm install -g turbo@2.6.3

# Prune to isolate app
FROM base AS pruner
COPY . .
RUN turbo prune backend --docker

# Install dependencies (separate layer for caching)
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=backend

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

# install pnpm 
RUN corepack enable

# Don't run as root for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/src/app/db ./src/app/db

RUN pnpm install --prod

USER nestjs

EXPOSE 8080

ENV PORT=8080

CMD ["node", "dist/src/app/main.js"]
