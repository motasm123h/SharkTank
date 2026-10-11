# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# ---- base: Node + pnpm ----
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm \
    npm_config_store_dir=/pnpm-store \
    NEXT_TELEMETRY_DISABLED=1
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@10.15.0 && apk add --no-cache libc6-compat
WORKDIR /app

# ---- dev: used by docker-compose.yml; source is bind-mounted ----
FROM base AS dev
ENV NODE_ENV=development HOSTNAME=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "pnpm install --config.confirmModulesPurge=false && pnpm dev"]

# ---- deps: production install needs a committed lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm-store pnpm install --frozen-lockfile

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# ---- migrator: one-shot container that applies Drizzle migrations ----
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/db ./src/db
CMD ["pnpm", "db:migrate"]

# ---- runner: small, non-root production image ----
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
