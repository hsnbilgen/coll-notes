FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --prefer-offline
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN ./node_modules/.bin/prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install --prefer-offline --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./
EXPOSE 3001 3002
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
