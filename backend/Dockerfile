FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nodeapp
EXPOSE 8080

CMD ["npm", "run", "start"]
