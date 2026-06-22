FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci fails with "Exit handler never called" bug in Docker
# Using yarn as workaround
RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install --frozen-lockfile 2>/dev/null || yarn install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Terima build-args dari Easypanel
ARG DATABASE_URL
ARG SESSION_SECRET
ARG NODE_ENV
ARG DEPLOYMENT_VERSION
ARG DEPLOYMENT_ID
ARG GIT_SHA
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV SESSION_SECRET=$SESSION_SECRET
ENV NODE_ENV="production"
ENV DEPLOYMENT_VERSION=$DEPLOYMENT_VERSION
ENV DEPLOYMENT_ID=$DEPLOYMENT_ID
ENV GIT_SHA=$GIT_SHA
ENV NEXT_TELEMETRY_DISABLED=1
# Ubah sqlite jadi postgresql untuk build Docker
RUN node -e "const fs = require('fs'); const file = 'prisma/schema.prisma'; let data = fs.readFileSync(file, 'utf8'); data = data.replace(/provider\s*=\s*\"sqlite\"/g, 'provider = \"postgresql\"'); fs.writeFileSync(file, data);"
RUN npx prisma generate
# Clean build: hapus .next lama sebelum build
RUN rm -rf .next
# Build Next.js (DATABASE_URL sudah tersedia sebagai ENV)
RUN npm run build
RUN npm prune --omit=dev

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Tambahkan user non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + migrations + CLI untuk db push saat startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
