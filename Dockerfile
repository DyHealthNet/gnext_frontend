# Stage 1: Build with Vite
FROM node:20-alpine AS build
WORKDIR /app

# Only copy .env if you NEED build-time VITE_* (optional)
COPY .env .env

COPY dyhealthnetlight_frontend/package*.json ./
RUN npm ci

COPY dyhealthnetlight_frontend/ .
RUN npm run build

# Stage 2: Serve with Nginx + reverse proxy
FROM nginx:1.27-alpine

# Serve built SPA
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx template -> rendered at container start with envsubst
# Make sure this file exists in your repo
COPY dyhealthnetlight_frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Tell the official entrypoint to render *.template into /etc/nginx/conf.d/
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
