# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# copia esplicita i due file manifest verso la cartella /app/
COPY package*.json ./

# installa le dipendenze
RUN npm ci

# copia tutto il resto del progetto
COPY . .

# build Next.js
RUN npm run build

# --- stage runtime ---
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# porta in runtime solo ciò che serve
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm ci --production

EXPOSE 3000
CMD ["npm", "start"]