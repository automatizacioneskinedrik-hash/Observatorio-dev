# =========================
# 1) Dependencies
# =========================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci


# =========================
# 2) Build (Next "standalone")
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env (Next lo hornea para el cliente)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Debug: confirma en Cloud Build que sí llega
RUN echo "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL"

RUN npm run build


# =========================
# 3) Runner (Cloud Run)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

# Usuario no-root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Archivos necesarios para standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]