# Application image: API (Fastify) serving the built Vue frontend on a single port.
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Placeholder only needed by `prisma generate` at build time; the real URL is set at runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# Dependencies first, to benefit from the Docker layer cache.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/prisma.config.ts apps/api/
COPY apps/api/src/config apps/api/src/config
COPY apps/web/package.json apps/web/
COPY database/prisma database/prisma
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build --workspace @pmu/web

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3000 \
    WEB_DIST_DIR=/app/apps/web/dist

EXPOSE 3000
ENTRYPOINT ["sh", "/app/docker/start.sh"]
