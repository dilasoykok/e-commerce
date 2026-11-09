# ---------- 1) Bağımlılıklar ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2) Build ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Derleme sırasında API'ye ulaşılamazsa sayfalar statik ürün verisiyle üretilir;
# çalışırken 60 sn içinde API'deki güncel veriyle yenilenir (lib/catalog.ts).
# public/ içindeki dosyalar Mac'teki izinleriyle (ör. 600) gelebilir; okunabilir yap.
RUN npm run build && chmod -R a+rX public

# ---------- 3) Çalıştır: yalnızca standalone çıktı (küçük imaj) ----------
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
