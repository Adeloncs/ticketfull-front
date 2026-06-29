# syntax=docker/dockerfile:1

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências de forma reprodutível
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código e gera o build de produção
COPY . .
RUN npm run build

# ---------- Stage 2: runtime (Nginx) ----------
FROM nginx:1.27-alpine AS runtime

# Configuração do Nginx (SPA fallback + proxy /api)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefatos estáticos do Angular (application builder -> dist/<app>/browser)
COPY --from=build /app/dist/ticketfull-front/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
