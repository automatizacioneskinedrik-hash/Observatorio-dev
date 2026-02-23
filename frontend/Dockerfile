FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
<<<<<<< HEAD

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

=======
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
<<<<<<< HEAD
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
=======
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
<<<<<<< HEAD
EXPOSE 8080

CMD ["node", "server.js"]
=======
EXPOSE 3000

CMD ["node", "server.js"]
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1
