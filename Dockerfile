# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Build tools for native deps
RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile


# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock

COPY tsconfig*.json ./
COPY src ./src
COPY proto ./proto

RUN yarn build


# Stage 3: Pruner
FROM node:20-alpine AS pruner

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile


# Stage 4: Runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tini curl

RUN addgroup -g 1001 appgroup \
 && adduser -D -u 1001 -G appgroup appuser

COPY --from=pruner /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/proto ./proto

# Permissions
RUN mkdir -p /app/logs \
 && chown -R appuser:appgroup /app

USER appuser

EXPOSE 50052

CMD ["yarn", "run", "start:prod"]
