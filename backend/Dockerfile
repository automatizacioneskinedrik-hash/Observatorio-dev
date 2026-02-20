FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero (mejor cache)
COPY package*.json ./

RUN npm install --production

# Copiar el resto del código
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]