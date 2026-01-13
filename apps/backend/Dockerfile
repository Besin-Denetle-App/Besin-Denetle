# Besin-Denetle Backend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Base - Temel bağımlılıklar
# ============================================
FROM node:20-alpine AS base

# pnpm kurulumu
RUN npm install -g pnpm@9

WORKDIR /app

# ============================================
# Stage 2: Dependencies - Bağımlılık yükleme
# ============================================
FROM base AS deps

# Workspace dosyalarını kopyala
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Bağımlılıkları yükle (sadece production)
RUN pnpm install --frozen-lockfile --prod=false

# ============================================
# Stage 3: Builder - Build aşaması
# ============================================
FROM base AS builder

WORKDIR /app

# Bağımlılıkları kopyala
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Kaynak kodları kopyala
COPY . .

# Shared package'ı build et
WORKDIR /app/packages/shared
RUN pnpm build

# Backend'i build et
WORKDIR /app/apps/backend
RUN pnpm build

# ============================================
# Stage 4: Runner - Production image
# ============================================
FROM node:20-alpine AS runner

# Güvenlik: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

# Production bağımlılıklarını kopyala
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./package.json

# Shared package build çıktısını kopyala
COPY --from=builder /app/packages/shared/dist ./node_modules/@besin-denetle/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@besin-denetle/shared/package.json

# Kullanıcıyı değiştir
USER nestjs

# Port'u expose et
EXPOSE 3200

# Environment variables
ENV NODE_ENV=production
ENV PORT=3200

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3200/health || exit 1

# Uygulamayı başlat
CMD ["node", "dist/main.js"]
