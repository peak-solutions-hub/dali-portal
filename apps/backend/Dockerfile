FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && pnpm install turbo@2.6.3 --global

# Prune to isolate app
FROM base AS pruner
COPY . .
RUN turbo prune backend --docker

# Install dependencies (separate layer for caching)
FROM base AS installer
COPY --from=pruner /app/out/json/ .

RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the application
FROM base AS builder

COPY --from=installer /app/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/full/ .

COPY turbo.json turbo.json

# generate prisma client
RUN pnpm --filter=backend db:generate

RUN pnpm turbo build --filter=backend

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

# install pnpm 
RUN corepack enable

# Don't run as root for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/generated ./apps/backend/generated
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

USER nestjs
WORKDIR /app/apps/backend

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/src/app/main.js"]
