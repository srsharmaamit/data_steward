# =============================================================================
# StewardData Hub — Angular SPA on Red Hat UBI8
# Stage 1 builds the Angular bundle; Stage 2 serves it with nginx.
# Both stages use official Red Hat Universal Base Images.
# =============================================================================

# ---- Stage 1: Build -----------------------------------------------------
FROM registry.access.redhat.com/ubi8/nodejs-20 AS build

USER 0
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build the production bundle
COPY angular.json tsconfig.json tsconfig.app.json tailwind.config.js ./
COPY src ./src
RUN npx ng build --configuration production

# ---- Stage 2: Serve -----------------------------------------------------
FROM registry.access.redhat.com/ubi8/nginx-122

# SPA fallback config (included inside the default server block)
COPY docker/nginx-spa.conf /opt/app-root/etc/nginx.default.d/spa.conf

# Static bundle into the UBI nginx docroot
COPY --from=build /app/dist/datasteward-hub/browser/ /opt/app-root/src/

# UBI nginx runs as non-root (uid 1001) and listens on 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
