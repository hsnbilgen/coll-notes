FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --prefer-offline
COPY . .
ARG VITE_SAVE_DEBOUNCE_MS=500
ENV VITE_SAVE_DEBOUNCE_MS=${VITE_SAVE_DEBOUNCE_MS}
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
