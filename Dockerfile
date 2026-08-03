ARG BASE_IMAGE=ghcr.io/muhammed-shafeeque-th/edulearn-node:22

# Stage 1: Dependency
FROM ${BASE_IMAGE} AS dependencies

WORKDIR /app

ENV NODE_ENV=development


# Copy package files first for caching
COPY package.json yarn.lock ./

# Use cache mount for faster repeated builds (BuildKit)
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --ignore-optional

# Stage 2: Dependency
FROM dependencies AS builder

# Copy source and configs
COPY tsconfig*.json ./
COPY src ./src

# Build (keep your existing build for stability)
RUN yarn run build

# Prune to production dependencies in builder
RUN yarn install \
    --production=true \
    --frozen-lockfile \
    --ignore-optional \
    --non-interactive

#  Cleanup unnecessary files from node_modules with node-prune
ARG NODE_PRUNE_VERSION=v1.0.2

RUN  apk add --no-cache curl \
  && curl -sfL https://gobinaries.com/tj/node-prune | sh -s -- -b /usr/local/bin \
  && node-prune \
  && yarn cache clean \
  && rm -rf \
       /tmp/* \
       /root/.cache \
       /usr/local/share/.cache

# Stage 2: Runtime (Lightweight)
FROM node:22.17.1-alpine3.22 AS runner

WORKDIR /app

ENV NODE_ENV=production

LABEL org.opencontainers.image.title="edulearn-user"
LABEL org.opencontainers.image.description="EduLearn User Service"
LABEL org.opencontainers.image.source="https://github.com/muhammed-shafeeque-th/Edulearn-user"

# Non-root user
RUN addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup appuser


# Copy only essentials from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./


USER appuser

EXPOSE 50052

# Direct start (no yarn overhead, better signal handling)
CMD ["node", "dist/main.js"]