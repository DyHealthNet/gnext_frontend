# Stage 1: Build with Vite
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Build-time defaults (override with --build-arg if needed)
ARG VITE_TYPESENSE_HOST=typesense
ARG VITE_TYPESENSE_PORT=8108
ARG VITE_API_URL=http:backend:5136

# Expose them to the build environment so Vite can read them
ENV VITE_TYPESENSE_HOST=${VITE_TYPESENSE_HOST}
ENV VITE_TYPESENSE_PORT=${VITE_TYPESENSE_PORT}
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Built app
COPY --from=build /app/dist /usr/share/nginx/html

# Runtime env template for the browser
# This file becomes /usr/share/nginx/html/env-config.js at container start
COPY env-config.js.template /usr/share/nginx/html/env-config.js.template

# Tell nginx entrypoint to render *.template files at startup
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/usr/share/nginx/html \
    NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html \
    NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]