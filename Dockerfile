# ============================
# Stage 1: Build the React app
# ============================
FROM node:22-alpine AS build
ARG service
WORKDIR /app

# Install dependencies first (layer cache optimisation)
COPY $service/package*.json ./
RUN npm install

# Copy source and build
COPY $service/ ./
RUN npm run build

# ============================
# Stage 2: Serve with Nginx
# ============================
FROM nginx:1.25-alpine AS production
ARG service
RUN apk update && apk upgrade --no-cache

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY $service/nginx.conf /etc/nginx/conf.d/

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx runs as root by default â€” use the existing 'nginx' user (uid 101)
# for a non-root, unprivileged setup
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 777 /var/cache/nginx && \
    chmod -R 777 /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chmod 777 /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

