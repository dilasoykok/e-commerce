# ---------- 1) Build: Vite + Tailwind ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# public/ içindeki dosyalar Mac'teki izinleriyle (ör. 600) kopyalanır; nginx okuyabilsin
RUN npm run build && chmod -R a+rX dist

# ---------- 2) Serve: statik dosyalar ----------
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
